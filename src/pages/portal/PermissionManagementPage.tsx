import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  Lock, 
  Save, 
  Search, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Settings2,
  User as UserIcon,
  Fingerprint
} from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Permission {
  name: string;
  code: string;
  category: string;
}

interface Role {
  role: string;
  permissions: string[];
}

interface UserProfile {
  id: number;
  user_id: number;
  full_name: string;
  username: string;
  role: string;
  permissions: string[];
}

export default function PermissionManagementPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userSearch, setUserSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permRes, roleRes, profileRes] = await Promise.all([
        api.get("/users/permissions/"),
        api.get("/users/all-roles/"),
        api.get("/users/all-profiles/")
      ]);
      
      setPermissions(permRes.data.results || permRes.data);
      setRoles(roleRes.data.roles || roleRes.data);
      setProfiles(profileRes.data.results || profileRes.data);
    } catch (error) {
      toast.error("Failed to load permission data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTogglePermission = (code: string, type: 'role' | 'user') => {
    if (type === 'role' && selectedRole) {
      const newPerms = selectedRole.permissions.includes(code)
        ? selectedRole.permissions.filter(p => p !== code)
        : [...selectedRole.permissions, code];
      setSelectedRole({ ...selectedRole, permissions: newPerms });
    } else if (type === 'user' && selectedUser) {
      const newPerms = selectedUser.permissions.includes(code)
        ? selectedUser.permissions.filter(p => p !== code)
        : [...selectedUser.permissions, code];
      setSelectedUser({ ...selectedUser, permissions: newPerms });
    }
  };

  const saveRolePermissions = async () => {
    if (!selectedRole) return;
    setSaving(true);
    try {
      await api.post("/users/roles/update-permissions/", {
        role: selectedRole.role,
        permissions: selectedRole.permissions
      });
      toast.success(`Permissions updated for ${selectedRole.role}`);
      // Refresh local roles list
      setRoles(roles.map(r => r.role === selectedRole.role ? selectedRole : r));
    } catch (error) {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const saveUserPermissions = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await api.post("/users/users/update-permissions/", {
        user_id: selectedUser.user_id,
        permissions: selectedUser.permissions
      });
      toast.success(`Direct permissions updated for ${selectedUser.username}`);
      // Refresh local profiles list
      setProfiles(profiles.map(p => p.user_id === selectedUser.user_id ? selectedUser : p));
    } catch (error) {
      toast.error("Failed to save permissions");
    } finally {
      setSaving(false);
    }
  };

  const permsByCategory = permissions.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || 
    p.username?.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground animate-pulse font-medium">Loading Feature Controls...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Lock className="h-8 w-8 text-primary" /> Feature Access Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Delegate feature access to roles or override specific user permissions.
          </p>
        </div>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] h-12 bg-muted/50 p-1">
          <TabsTrigger value="roles" className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Role Permissions
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> User Overrides
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Role List */}
            <Card className="md:col-span-4 border-none bg-muted/30 shadow-none">
              <CardHeader>
                <CardTitle className="text-lg">System Roles</CardTitle>
                <CardDescription>Select a role to manage its features</CardDescription>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ScrollArea className="h-[500px]">
                  <div className="space-y-1">
                    {roles.map((role) => (
                      <button
                        key={role.role}
                        onClick={() => setSelectedRole(role)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                          selectedRole?.role === role.role 
                            ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" 
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Fingerprint className={`h-4 w-4 ${selectedRole?.role === role.role ? "text-primary-foreground" : "text-primary"}`} />
                          <span className="font-medium capitalize">{role.role.replace(/_/g, ' ')}</span>
                        </div>
                        <ChevronRight className={`h-4 w-4 opacity-50 ${selectedRole?.role === role.role ? "text-primary-foreground" : ""}`} />
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Permissions Editor */}
            <Card className="md:col-span-8 border-none bg-card shadow-lg ring-1 ring-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                  <CardTitle className="text-xl">
                    {selectedRole ? `Manage: ${selectedRole.role.replace(/_/g, ' ')}` : "Select a Role"}
                  </CardTitle>
                  <CardDescription>
                    Toggle features specific to this role. Changes take effect on next login.
                  </CardDescription>
                </div>
                {selectedRole && (
                  <Button 
                    onClick={saveRolePermissions} 
                    disabled={saving}
                    className="gap-2 shadow-sm"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
                    Save Changes
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedRole ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground p-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/50">
                    <Settings2 className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">No role selected</p>
                    <p className="text-sm">Pick a role from the left to start delegating features.</p>
                  </div>
                ) : (
                  <Accordion type="multiple" className="w-full space-y-4">
                    {Object.entries(permsByCategory).map(([category, categoryPerms]) => (
                      <AccordionItem key={category} value={category} className="border border-border/50 rounded-xl px-4 bg-muted/5 transition-all data-[state=open]:bg-transparent">
                        <AccordionTrigger className="hover:no-underline py-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                              {categoryPerms.length}
                            </Badge>
                            <span className="font-semibold">{category}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                            {categoryPerms.map((perm) => (
                              <div 
                                key={perm.code} 
                                className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all group"
                              >
                                <div className="space-y-1">
                                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{perm.name}</p>
                                  <code className="text-[10px] text-muted-foreground bg-muted p-1 px-1.5 rounded uppercase tracking-wider">{perm.code}</code>
                                </div>
                                <Switch
                                  checked={selectedRole.permissions.includes(perm.code)}
                                  onCheckedChange={() => handleTogglePermission(perm.code, 'role')}
                                  className="data-[state=checked]:bg-primary shadow-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
             {/* User Search & List */}
             <Card className="md:col-span-4 border-none bg-muted/30 shadow-none">
              <CardHeader className="space-y-4">
                <div>
                  <CardTitle className="text-lg">User Overrides</CardTitle>
                  <CardDescription>Search and select a user to grant individual access</CardDescription>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search users..." 
                    className="pl-9 h-11 bg-background"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                  />
                </div>
              </CardHeader>
              <CardContent className="px-2 pb-2">
                <ScrollArea className="h-[420px]">
                  <div className="space-y-1">
                    {filteredProfiles.length === 0 ? (
                      <p className="text-center text-sm text-muted-foreground py-8">No users found</p>
                    ) : (
                      filteredProfiles.map((p) => (
                        <button
                          key={p.user_id}
                          onClick={() => setSelectedUser(p)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                            selectedUser?.user_id === p.user_id 
                              ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" 
                              : "hover:bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedUser?.user_id === p.user_id ? "bg-white/20" : "bg-primary/10"}`}>
                            <UserIcon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{p.full_name}</p>
                            <p className={`text-xs truncate ${selectedUser?.user_id === p.user_id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                              @{p.username} • <span className="capitalize">{p.role?.replace(/_/g, ' ') || 'None'}</span>
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* User Permissions Editor */}
            <Card className="md:col-span-8 border-none bg-card shadow-lg ring-1 ring-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                  <CardTitle className="text-xl">
                    {selectedUser ? `Override: ${selectedUser.full_name}` : "Select a User"}
                  </CardTitle>
                  <CardDescription>
                    Explicitly grant features regardless of role. This is useful for temporary delegations.
                  </CardDescription>
                </div>
                {selectedUser && (
                  <Button 
                    onClick={saveUserPermissions} 
                    disabled={saving}
                    className="gap-2 shadow-sm"
                  >
                    {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
                    Save Overrides
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {!selectedUser ? (
                  <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground p-8 text-center bg-muted/10 rounded-xl border border-dashed border-border/50">
                    <UserIcon className="h-12 w-12 mb-4 opacity-20" />
                    <p className="font-medium">No user selected</p>
                    <p className="text-sm">Search and pick a user to manage their specific access levels.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <AlertCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-primary">Override Mode Active</p>
                        <p className="text-xs text-muted-foreground">
                          Directly assigned permissions will be merged with the user's role ({selectedUser.role?.replace(/_/g, ' ')}).
                          If you want a user to have ONLY their role's permissions, uncheck everything here.
                        </p>
                      </div>
                    </div>

                    <Accordion type="multiple" className="w-full space-y-4">
                      {Object.entries(permsByCategory).map(([category, categoryPerms]) => (
                        <AccordionItem key={category} value={category} className="border border-border/50 rounded-xl px-4 bg-muted/5 transition-all data-[state=open]:bg-transparent">
                          <AccordionTrigger className="hover:no-underline py-4">
                             <div className="flex items-center gap-3">
                              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                                {categoryPerms.length}
                              </Badge>
                              <span className="font-semibold">{category}</span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                              {categoryPerms.map((perm) => (
                                <div 
                                  key={perm.code} 
                                  className="flex items-center justify-between p-4 rounded-xl border border-border/40 bg-card hover:border-primary/30 transition-all group"
                                >
                                  <div className="space-y-1">
                                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{perm.name}</p>
                                    <code className="text-[10px] text-muted-foreground bg-muted p-1 px-1.5 rounded uppercase tracking-wider">{perm.code}</code>
                                  </div>
                                  <Switch
                                    checked={selectedUser.permissions.includes(perm.code)}
                                    onCheckedChange={() => handleTogglePermission(perm.code, 'user')}
                                    className="data-[state=checked]:bg-primary shadow-sm"
                                  />
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
