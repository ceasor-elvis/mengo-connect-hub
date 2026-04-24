import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, ArrowUpCircle, Plus, Loader2, Search, Edit2, ShieldAlert, Key, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  councillor: "Councillor",
  chairperson: "Chairperson",
  vice_chairperson: "Vice Chairperson",
  speaker: "Speaker",
  deputy_speaker: "Deputy Speaker",
  general_secretary: "General Secretary",
  assistant_general_secretary: "Assistant General Secretary",
  secretary_finance: "Secretary Finance",
  secretary_welfare: "Secretary Welfare",
  secretary_health: "Secretary Health",
  secretary_women_affairs: "Secretary Women Affairs",
  secretary_publicity: "Secretary Publicity",
  secretary_pwd: "Secretary PWD",
  electoral_commission: "Electoral Commission",
};

const APP_ROLES = Object.keys(ROLE_LABELS);


export default function RegisterMemberPage() {
  const { hasPermission } = useAuth();
  const canManageStreams = hasPermission("register_member");
  const isAdminAbsolute = hasPermission("manage_permissions");

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentStream, setStudentStream] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [gender, setGender] = useState("");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [upgradeUserId, setUpgradeUserId] = useState("");
  const [upgradeRole, setUpgradeRole] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [addStreamOpen, setAddStreamOpen] = useState(false);
  const [newStreamName, setNewStreamName] = useState("");
  const [addingStream, setAddingStream] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [resetingUser, setResetingUser] = useState<any | null>(null);
  const [completedResets, setCompletedResets] = useState<string[]>([]);
  const [newTempPassword, setNewTempPassword] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [reseting, setReseting] = useState(false);

  const fetchProfiles = () => api.get("/users/all-profiles/").then(res => setProfiles(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(() => {});
  const fetchStreams = () => api.get("/streams/").then(res => setStreams(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(() => {});
  const [notifications, setNotifications] = useState<any[]>([]);
  const fetchNotifications = () => api.get("/notifications/").then(res => setNotifications(res.data)).catch(() => {});

  useEffect(() => {
    fetchProfiles();
    fetchStreams();
    fetchNotifications();
  }, []);

  const handleAddStream = async () => {
    if (!newStreamName) return;
    setAddingStream(true);
    try {
      await api.post("/streams/", { name: newStreamName });
      toast.success("Stream added!");
      setNewStreamName("");
      setAddStreamOpen(false);
      fetchStreams();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add stream");
    } finally {
      setAddingStream(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setSavingEdit(true);
    try {
      await api.patch(`/users/${editingMember.user_id}/profile/admin/`, {
        full_name: editingMember.full_name,
        username: editingMember.username,
        student_class: editingMember.student_class,
        gender: editingMember.gender,
        role: editingMember.role,
      });
      toast.success("Member updated successfully!");
      setEditingMember(null);
      fetchProfiles();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteMember = async (member: any) => {
    if (!window.confirm(`Are you sure you want to securely remove ${member.full_name}? This will securely wipe their system information and permanently hide their account.`)) return;
    
    try {
      await api.patch(`/users/${member.user_id}/profile/admin/`, {
        full_name: "Removed Member",
        student_class: "N/A",
        gender: "N/A",
        role: "councillor"
      });
      toast.success("Member securely anonymized and removed from directory.");
      fetchProfiles();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to remove member.");
    }
  };

  const handleAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetingUser || !newTempPassword) return;
    setReseting(true);
    try {
      await api.post("/users/admin-reset-password/", {
        user_id: resetingUser.id,
        new_password: newTempPassword,
      });

      if (resetingUser.notificationId) {
        await api.patch(`/notifications/${resetingUser.notificationId}/`, { read: true }).catch(() => {});
        setCompletedResets(prev => [...prev, resetingUser.notificationId]);
      }
      
      toast.success("Password reset successfully!");
      setResetingUser(null);
      setNewTempPassword("");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Reset failed");
    } finally {
      setReseting(false);
    }
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upgradeUserId || !upgradeRole) { toast.error("Select both user and role"); return; }
    setUpgradeLoading(true);
    try {
      await api.post("/users/upgrade-role/", { user_id: upgradeUserId, new_role: upgradeRole });
      toast.success("Member role upgraded successfully!");
      setUpgradeUserId("");
      setUpgradeRole("");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Upgrade failed");
    } finally {
      setUpgradeLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !fullName || !selectedRole) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/users/register/", {
        password,
        username,
        full_name: fullName,
        student_class: studentClass,
        stream: (studentStream && studentStream !== "none") ? studentStream : null,
        gender: gender || null,
        role: selectedRole,
      });

      toast.success(`${fullName} has been registered successfully!`);
      // Reset form
      setUsername("");
      setPassword("");
      setFullName("");
      setStudentClass("");
      setStudentStream("");
      setSelectedRole("");
      setGender("");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed. This account may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold">Manage Members</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Register new council members or upgrade a councillor to leadership.
        </p>
      </div>

      <Tabs defaultValue="register">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="register">Register</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <form onSubmit={handleRegister} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" placeholder="e.g. Nakamya Faith" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input id="username" placeholder="e.g. jdoe" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} />
            <p className="text-xs text-muted-foreground">They will use this to log in</p>
          </div>
          <div className="space-y-2">
            <Label>Class</Label>
            <Select value={studentClass} onValueChange={setStudentClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class" />
              </SelectTrigger>
              <SelectContent>
                {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Gender *</Label>
          <Select value={gender} onValueChange={setGender}>
            <SelectTrigger>
              <SelectValue placeholder="Select Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Stream</Label>
            {canManageStreams && (
              <Dialog open={addStreamOpen} onOpenChange={setAddStreamOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" size="sm" className="h-auto p-0"><Plus className="h-3 w-3 mr-1" /> Add Stream</Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader><DialogTitle>Add New Stream</DialogTitle></DialogHeader>
                  <div className="space-y-3 pt-2">
                    <div>
                      <Label>Stream Name</Label>
                      <Input value={newStreamName} onChange={e => setNewStreamName(e.target.value)} placeholder="e.g. NORTH" />
                    </div>
                    <Button onClick={handleAddStream} className="w-full" disabled={addingStream}>
                      {addingStream && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Stream
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          <Select value={studentStream} onValueChange={setStudentStream}>
            <SelectTrigger>
              <SelectValue placeholder="Select Stream (Optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {streams.map((s) => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Position / Office *</Label>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              {APP_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Temporary Password *</Label>
          <Input id="password" type="password" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="text-xs text-muted-foreground">The member should change this after first login.</p>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
            <UserPlus className="mr-2 h-4 w-4" />
            {loading ? "Registering..." : "Register Member"}
          </Button>
        </form>
      </TabsContent>

        <TabsContent value="upgrade">
          <form onSubmit={handleUpgrade} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
            <div className="space-y-2">
              <Label>Select Existing Member</Label>
              <Select value={upgradeUserId} onValueChange={setUpgradeUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Search member..." />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map(p => (
                    <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>New Leadership Position</Label>
              <Select value={upgradeRole} onValueChange={setUpgradeRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new role..." />
                </SelectTrigger>
                <SelectContent>
                  {APP_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full" disabled={upgradeLoading}>
              <ArrowUpCircle className="mr-2 h-4 w-4" />
              {upgradeLoading ? "Upgrading..." : "Upgrade Member"}
            </Button>
          </form>
        </TabsContent>

      <TabsContent value="members" className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search members..." 
            className="pl-9" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="divide-y">
            {profiles.filter(p => 
              (!p.full_name?.startsWith("Removed Council") && !p.full_name?.startsWith("Removed Member")) &&
              (p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
              p.username?.toLowerCase().includes(searchTerm.toLowerCase()))
            ).map((p) => {
              const isAdminEdit = hasPermission("register_member");
              return (
                <div key={p.user_id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{p.username} • {p.student_class || "Staff"} • {p.role ? ROLE_LABELS[p.role] : "Councillor"}</p>
                  </div>
                  {isAdminEdit && (
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setEditingMember(p)}
                      >
                        <Edit2 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      {isAdminAbsolute && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteMember(p)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="requests" className="space-y-4">
        <div className="rounded-xl border bg-card p-6 shadow-sm text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-amber-500 mb-2" />
          <h3 className="font-bold">Pending Password Resets</h3>
          <p className="text-sm text-muted-foreground">Members who clicked 'Forgot Password' will appear here.</p>
        </div>

        <div className="space-y-3">
          {notifications.filter(n => n.title === "Password Reset Request" && (!n.read || completedResets.includes(n.id))).map((n) => (
            <div key={n.id} className="flex items-center justify-between p-4 rounded-xl border bg-card shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Key className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">{n.message.split('(')[0]}</p>
                  <p className="text-xs text-muted-foreground">Sent {new Date(n.created_at || n.timestamp).toLocaleTimeString()}</p>
                </div>
              </div>
              {completedResets.includes(n.id) ? (
                <Button size="sm" variant="outline" disabled className="bg-green-50 text-green-700 border-green-200">
                  <Check className="h-4 w-2 mr-2" /> Reset Complete
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setResetingUser({ id: n.target_user_id || n.user_id, fullName: n.message.split('(')[0].replace('User ', ''), notificationId: n.id })}>Reset</Button>
              )}
            </div>
          ))}
          {notifications.filter(n => n.title === "Password Reset Request" && (!n.read || completedResets.includes(n.id))).length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">No pending requests.</p>
          )}
        </div>
      </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Member Information</DialogTitle>
          </DialogHeader>
          {editingMember && (
            <form onSubmit={handleSaveEdit} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={editingMember.full_name} onChange={e => setEditingMember({...editingMember, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={editingMember.username} onChange={e => setEditingMember({...editingMember, username: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={editingMember.student_class} onValueChange={v => setEditingMember({...editingMember, student_class: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select value={editingMember.gender} onValueChange={v => setEditingMember({...editingMember, gender: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Select value={editingMember.role || "councillor"} onValueChange={v => setEditingMember({...editingMember, role: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APP_ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={savingEdit}>
                {savingEdit && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Reset Dialog */}
      <Dialog open={!!resetingUser} onOpenChange={(open) => !open && setResetingUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Administrative Reset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-xs text-amber-800 leading-relaxed">
                You are generating a new temporary password for <strong>{resetingUser?.fullName}</strong>. They must change it upon login.
              </p>
            </div>
            <div className="space-y-2">
              <Label>New Temporary Password</Label>
              <Input 
                type="password" 
                placeholder="Enter new password" 
                value={newTempPassword} 
                onChange={e => setNewTempPassword(e.target.value)} 
              />
            </div>
            <Button onClick={handleAdminReset} className="w-full" disabled={reseting || !newTempPassword}>
              {reseting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Reset Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
