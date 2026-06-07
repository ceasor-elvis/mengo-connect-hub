import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  UserPlus, ArrowUpCircle, Plus, Loader2, Search, Edit2, ShieldAlert, 
  Key, Trash2, Check, Rocket, Megaphone, Clock, Users, Shield, Zap
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

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

const formatRoleLabel = (role: string) => {
  if (!role) return "";
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function RegisterMemberPage() {
  const { hasPermission } = useAuth();
  const canManageStreams = hasPermission("register_member");
  const isAdminAbsolute = hasPermission("manage_permissions");
  const canPostUpdates = hasPermission("manage_system_updates");

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const defaultPassword = `mss@${new Date().getFullYear()}`;
  const [password, setPassword] = useState(defaultPassword);
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentStream, setStudentStream] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [gender, setGender] = useState("");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [backendRoles, setBackendRoles] = useState<string[]>([]);
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

  const [savingEdit, setSavingEdit] = useState(false);
  const [reseting, setReseting] = useState(false);

  // System Updates State
  const [systemUpdates, setSystemUpdates] = useState<any[]>([]);
  const [newUpdate, setNewUpdate] = useState({ title: "", content: "", version: "" });
  const [postingUpdate, setPostingUpdate] = useState(false);

  const fetchProfiles = () => api.get("/users/all-profiles/").then(res => setProfiles(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(() => {});
  const fetchStreams = () => api.get("/streams/").then(res => setStreams(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(() => {});
  const fetchBackendRoles = () => api.get("/users/all-roles/").then(res => {
    const rolesData = Array.isArray(res.data) ? res.data : (res.data.results || []);
    const roleNames = rolesData.map((r: any) => r.role);
    setBackendRoles(roleNames);
  }).catch(() => {});
  const [notifications, setNotifications] = useState<any[]>([]);
  const fetchNotifications = () => api.get("/notifications/").then(res => setNotifications(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(() => {});
  const fetchSystemUpdates = () => api.get("/system-updates/").then(res => setSystemUpdates(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(() => {});

  useEffect(() => {
    fetchProfiles();
    fetchStreams();
    fetchNotifications();
    fetchBackendRoles();
    if (canPostUpdates) fetchSystemUpdates();
  }, []);

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUpdate.title || !newUpdate.content) {
      toast.error("Please fill in the title and content");
      return;
    }
    setPostingUpdate(true);
    try {
      await api.post("/system-updates/", newUpdate);
      toast.success("System announcement posted!");
      setNewUpdate({ title: "", content: "", version: "" });
      fetchSystemUpdates();
    } catch (e: any) {
      toast.error("Failed to post update");
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleDeleteUpdate = async (id: number) => {
    try {
      await api.delete(`/system-updates/${id}/`);
      toast.success("Update deleted");
      fetchSystemUpdates();
    } catch (e) {
      toast.error("Failed to delete update");
    }
  };

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
        stream: (editingMember.stream && editingMember.stream !== "none") ? editingMember.stream : null,
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
    
    try {
      await api.delete(`/users/${member.user_id}/profile/admin/`);
      toast.success("Member successfully deleted from the database.");
      fetchProfiles();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete member.");
    }
  };

  const handleAdminReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetingUser) return;
    const defaultPassword = `mss@${new Date().getFullYear()}`;
    setReseting(true);
    try {
      await api.post("/users/admin-reset-password/", {
        user_id: resetingUser.id,
        new_password: defaultPassword,
      });

      if (resetingUser.notificationId) {
        await api.patch(`/notifications/${resetingUser.notificationId}/`, { read: true }).catch(() => {});
        setCompletedResets(prev => [...prev, resetingUser.notificationId]);
      }
      
      toast.success(`Password reset to ${defaultPassword} successfully!`);
      setResetingUser(null);
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
      setPassword(defaultPassword);
      setFullName("");
      setStudentClass("");
      setStudentStream("");
      setSelectedRole("");
      setGender("");
      fetchProfiles();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed. This account may already exist.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8 pb-12 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col gap-2 relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider w-fit"
        >
          <Shield className="w-3 h-3" /> System Control
        </motion.div>
        <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
          Administration Center
        </h1>
        <p className="text-muted-foreground/80 mt-1 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
          Manage council members, assign roles, handle access requests, and broadcast system-wide updates.
        </p>
      </section>

      <Tabs defaultValue="register" className="space-y-6">
        <TabsList className={`bg-muted/40 backdrop-blur-md border border-border/40 p-1.5 rounded-2xl w-full grid mx-auto shadow-inner ${canPostUpdates ? 'grid-cols-5' : 'grid-cols-4'}`}>
          <TabsTrigger value="register" className="rounded-xl text-[10px] sm:text-xs font-bold data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/20 uppercase tracking-wider">Register</TabsTrigger>
          <TabsTrigger value="upgrade" className="rounded-xl text-[10px] sm:text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm uppercase tracking-wider">Upgrade</TabsTrigger>
          <TabsTrigger value="members" className="rounded-xl text-[10px] sm:text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm uppercase tracking-wider">Members</TabsTrigger>
          <TabsTrigger value="requests" className="rounded-xl text-[10px] sm:text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm uppercase tracking-wider relative">
            Requests
            {notifications.filter(n => n.title === "Password Reset Request" && !n.read).length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            )}
          </TabsTrigger>
          {canPostUpdates && <TabsTrigger value="updates" className="rounded-xl text-[10px] sm:text-xs font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm uppercase tracking-wider">Updates</TabsTrigger>}
        </TabsList>

        <TabsContent value="register" className="outline-none">
          <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
            <div className="p-6 border-b border-border/20 bg-emerald-500/5">
              <CardTitle className="font-serif text-2xl font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <UserPlus className="h-6 w-6" /> Register New Member
              </CardTitle>
            </div>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleRegister} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name *</Label>
                  <Input id="fullName" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-emerald-500/20 h-12 px-4 font-bold" placeholder="e.g. Nakamya Faith" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username *</Label>
                    <Input id="username" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-emerald-500/20 h-12" placeholder="e.g. jdoe" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))} required />
                    <p className="text-[10px] text-muted-foreground font-medium">Used for login</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class</Label>
                    <Select value={studentClass} onValueChange={setStudentClass}>
                      <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-12">
                        <SelectValue placeholder="Select Class" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                        {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender *</Label>
                    <Select value={gender} onValueChange={setGender} required>
                      <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-12">
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream</Label>
                      {canManageStreams && (
                        <Dialog open={addStreamOpen} onOpenChange={setAddStreamOpen}>
                          <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="h-auto p-0 text-[10px] font-bold text-emerald-600 uppercase tracking-widest"><Plus className="h-3 w-3 mr-0.5" /> Add Stream</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-sm rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
                            <div className="p-6 border-b border-border/20 bg-emerald-500/5">
                              <DialogTitle className="font-serif text-xl font-bold text-emerald-700">Add New Stream</DialogTitle>
                            </div>
                            <div className="p-6 space-y-5">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream Name</Label>
                                <Input className="bg-muted/30 rounded-xl border-border/50 h-11 focus-visible:ring-emerald-500/20" value={newStreamName} onChange={e => setNewStreamName(e.target.value)} placeholder="e.g. NORTH" />
                              </div>
                              <Button onClick={handleAddStream} className="w-full h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" disabled={addingStream || !newStreamName}>
                                {addingStream ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Save Stream
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                    <Select value={studentStream} onValueChange={setStudentStream}>
                      <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-12">
                        <SelectValue placeholder="Select Stream (Optional)" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                        <SelectItem value="none">None</SelectItem>
                        {streams.map((s) => (
                          <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Position / Office *</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole} required>
                    <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-12">
                      <SelectValue placeholder={backendRoles.length === 0 ? "No positions available" : "Select a position"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90 max-h-[300px]">
                      {backendRoles.length === 0 ? (
                        <SelectItem disabled value="none">No positions available</SelectItem>
                      ) : (
                        backendRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role] || formatRoleLabel(role)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Temporary Password *</Label>
                  <Input id="password" type="text" disabled className="bg-muted/50 rounded-xl border-border/50 focus-visible:ring-emerald-500/20 h-12 font-mono text-muted-foreground tracking-wider font-bold" placeholder="Min. 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> Member must change this after first login.</p>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white transition-all" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
                    {loading ? "Registering..." : "Register Member"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upgrade" className="outline-none">
          <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden max-w-xl mx-auto">
            <div className="p-6 border-b border-border/20 bg-blue-500/5">
              <CardTitle className="font-serif text-2xl font-black text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <ArrowUpCircle className="h-6 w-6" /> Role Upgrades
              </CardTitle>
            </div>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleUpgrade} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Existing Member</Label>
                  <Select value={upgradeUserId} onValueChange={setUpgradeUserId}>
                    <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-12">
                      <SelectValue placeholder="Search member..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90 max-h-[300px]">
                      {profiles.filter(p => !(p.full_name || "").startsWith("Removed")).map(p => (
                        <SelectItem key={p.user_id} value={String(p.user_id)}>{p.full_name} (@{p.username})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Leadership Position</Label>
                  <Select value={upgradeRole} onValueChange={setUpgradeRole}>
                    <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-12">
                      <SelectValue placeholder={backendRoles.length === 0 ? "No positions available" : "Select new role..."} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90 max-h-[300px]">
                      {backendRoles.length === 0 ? (
                        <SelectItem disabled value="none">No positions available</SelectItem>
                      ) : (
                        backendRoles.map((role) => (
                          <SelectItem key={role} value={role}>
                            {ROLE_LABELS[role] || formatRoleLabel(role)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t border-border/40">
                  <Button type="submit" className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white transition-all" disabled={upgradeLoading}>
                    {upgradeLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Zap className="mr-2 h-5 w-5 fill-current" />}
                    {upgradeLoading ? "Upgrading..." : "Execute Upgrade"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members" className="space-y-4 outline-none">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search directory by name or username..." 
              className="pl-11 bg-card/60 backdrop-blur-xl border-border/50 rounded-2xl h-12 focus-visible:ring-primary/20 shadow-sm" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="divide-y divide-border/40">
              {profiles.filter(p => 
                (!(p.full_name || "").startsWith("Removed Council") && !(p.full_name || "").startsWith("Removed Member")) &&
                ((p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                (p.username || "").toLowerCase().includes(searchTerm.toLowerCase()))
              ).map((p) => {
                const isAdminEdit = hasPermission("register_member");
                return (
                  <div key={p.user_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 hover:bg-muted/30 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{p.full_name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground font-medium">@{p.username}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{p.student_class || "Staff"}</span>
                          <span className="text-muted-foreground/30">•</span>
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">
                            {p.role ? (ROLE_LABELS[p.role] || formatRoleLabel(p.role)) : "Councillor"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {isAdminEdit && (
                      <div className="flex items-center gap-2 sm:ml-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 rounded-lg font-bold text-xs"
                          onClick={() => setEditingMember(p)}
                        >
                          <Edit2 className="h-3.5 w-3.5 sm:mr-1.5" /> <span className="hidden sm:inline">Edit</span>
                        </Button>
                        {isAdminAbsolute && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 rounded-lg border-rose-500/20 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="font-serif text-xl">Delete Member?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete <strong>{p.full_name}</strong>? This will remove them from the database and cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteMember(p)} className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white">Delete Member</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {profiles.filter(p => 
                (!(p.full_name || "").startsWith("Removed Council") && !(p.full_name || "").startsWith("Removed Member")) &&
                ((p.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                (p.username || "").toLowerCase().includes(searchTerm.toLowerCase()))
              ).length === 0 && (
                <div className="text-center py-16 text-muted-foreground font-medium">
                  No members found matching your search.
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6 outline-none">
          <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden max-w-2xl mx-auto">
            <div className="p-8 text-center bg-amber-500/5 border-b border-border/20">
              <div className="mx-auto h-16 w-16 bg-amber-500/10 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="h-8 w-8 text-amber-500" />
              </div>
              <h3 className="font-serif text-2xl font-black text-amber-600">Pending Password Resets</h3>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Members who have requested a password reset will appear here for administrative approval.
              </p>
            </div>

            <CardContent className="p-0">
              <div className="divide-y divide-border/40">
                {notifications.filter(n => n.title === "Password Reset Request" && (!n.read || completedResets.includes(n.id))).map((n) => (
                  <div key={n.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-muted/30 transition-colors gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Key className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{(n.message || "Password Reset Request").split('(')[0]}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                          Requested {n.created_at || n.timestamp ? new Date(n.created_at || n.timestamp).toLocaleTimeString() : "Unknown Time"}
                        </p>
                      </div>
                    </div>
                    {completedResets.includes(n.id) ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-3 py-1.5 justify-center">
                        <Check className="h-3.5 w-3.5 mr-1" /> Complete
                      </Badge>
                    ) : (
                      <Button size="sm" className="h-9 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm sm:w-auto w-full" onClick={() => setResetingUser({ id: n.target_user_id || n.user_id, fullName: (n.message || "User ").split('(')[0].replace('User ', ''), notificationId: n.id })}>
                        Approve Reset
                      </Button>
                    )}
                  </div>
                ))}
                {notifications.filter(n => n.title === "Password Reset Request" && (!n.read || completedResets.includes(n.id))).length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-16 font-medium">
                    No pending requests at this time.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="updates" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden h-fit">
              <div className="p-6 border-b border-border/20 bg-purple-500/5">
                <CardTitle className="font-serif text-2xl font-black text-purple-700 dark:text-purple-400 flex items-center gap-2">
                  <Megaphone className="h-6 w-6" /> Broadcast Update
                </CardTitle>
              </div>
              <CardContent className="p-6">
                <form onSubmit={handlePostUpdate} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Update Title *</Label>
                    <Input 
                      className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-purple-500/20 h-11"
                      placeholder="e.g. New Feature: Financial Summaries" 
                      value={newUpdate.title} 
                      onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Content *</Label>
                    <Textarea 
                      className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-purple-500/20 resize-none p-4"
                      placeholder="Describe what's new..." 
                      rows={5}
                      value={newUpdate.content} 
                      onChange={e => setNewUpdate({...newUpdate, content: e.target.value})} 
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Version Tag (Optional)</Label>
                    <Input 
                      className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-purple-500/20 h-11"
                      placeholder="e.g. v2.1.0" 
                      value={newUpdate.version} 
                      onChange={e => setNewUpdate({...newUpdate, version: e.target.value})} 
                    />
                  </div>

                  <div className="pt-2">
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold shadow-lg shadow-purple-500/20 bg-purple-600 hover:bg-purple-700 text-white transition-all" disabled={postingUpdate}>
                      {postingUpdate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
                      Post Announcement
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2 pl-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Announcement History
              </h3>
              
              <div className="space-y-4">
                <AnimatePresence>
                  {systemUpdates.map((update) => (
                    <motion.div key={update.id} variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}>
                      <Card className="rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500/50 to-indigo-500/50" />
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-3 gap-4">
                            <div>
                              <h4 className="font-bold text-base leading-tight">{update.title}</h4>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                  {new Date(update.created_at).toLocaleDateString()}
                                </span>
                                {update.version && (
                                  <>
                                    <span className="text-muted-foreground/30">•</span>
                                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest">{update.version}</Badge>
                                  </>
                                )}
                              </div>
                            </div>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity border border-rose-500/20 text-rose-600 hover:bg-rose-50 hover:text-rose-700 shrink-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="font-serif text-xl">Delete Update?</AlertDialogTitle>
                                  <AlertDialogDescription>Are you sure you want to delete this system update?</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUpdate(update.id)} className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                          <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                            {update.content}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {systemUpdates.length === 0 && (
                  <div className="text-center py-16 border border-dashed border-border/60 rounded-3xl bg-muted/10 backdrop-blur-sm">
                    <Megaphone className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No updates posted yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Member Dialog */}
      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
          <div className="p-6 border-b border-border/20 bg-primary/5">
            <DialogTitle className="font-serif text-2xl font-black text-primary">Edit Member Info</DialogTitle>
          </div>
          {editingMember && (
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input className="bg-muted/30 rounded-xl border-border/50 h-11 focus-visible:ring-primary/20" value={editingMember.full_name} onChange={e => setEditingMember({...editingMember, full_name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Username</Label>
                <Input className="bg-muted/30 rounded-xl border-border/50 h-11 focus-visible:ring-primary/20" value={editingMember.username} onChange={e => setEditingMember({...editingMember, username: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class</Label>
                  <Select value={editingMember.student_class || "S.1"} onValueChange={v => setEditingMember({...editingMember, student_class: v})}>
                    <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                      {["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender *</Label>
                  <Select value={editingMember.gender || "male"} onValueChange={v => setEditingMember({...editingMember, gender: v})}>
                    <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream</Label>
                  <Select value={editingMember.stream || "none"} onValueChange={v => setEditingMember({...editingMember, stream: v})}>
                    <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-11"><SelectValue placeholder="Select Stream" /></SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                      <SelectItem value="none">None</SelectItem>
                      {streams.map((s) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Position</Label>
                  <Select value={editingMember.role || "councillor"} onValueChange={v => setEditingMember({...editingMember, role: v})}>
                    <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-11"><SelectValue placeholder={backendRoles.length === 0 ? "No positions available" : "Select position"} /></SelectTrigger>
                    <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90 max-h-[200px]">
                      {backendRoles.length === 0 ? (
                        <SelectItem disabled value="none">No positions available</SelectItem>
                      ) : (
                        backendRoles.map(r => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r] || formatRoleLabel(r)}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full h-11 rounded-xl font-bold shadow-lg" disabled={savingEdit}>
                  {savingEdit ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />} Save Changes
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Reset Dialog */}
      <Dialog open={!!resetingUser} onOpenChange={(open) => !open && setResetingUser(null)}>
        <DialogContent className="max-w-sm rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
          <div className="p-6 border-b border-border/20 bg-amber-500/5">
            <DialogTitle className="font-serif text-2xl font-black text-amber-600">Admin Password Reset</DialogTitle>
          </div>
          <div className="p-6 space-y-5">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400">
              <p className="text-sm font-medium leading-relaxed">
                You are generating a new temporary password for <strong>{resetingUser?.fullName}</strong>. They must change it upon login.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Temporary Password</Label>
              <Input 
                type="text" 
                disabled
                value={`mss@${new Date().getFullYear()}`}
                className="bg-muted/50 text-muted-foreground border-border/50 h-11 font-mono text-center tracking-wider font-bold rounded-xl"
              />
            </div>
            <div className="pt-2">
              <Button onClick={handleAdminReset} className="w-full h-11 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg" disabled={reseting}>
                {reseting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Key className="mr-2 h-4 w-4" />} Confirm Reset
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
