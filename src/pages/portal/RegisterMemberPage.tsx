import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, ArrowUpCircle, Plus, Loader2 } from "lucide-react";
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
  const { hasAnyRole } = useAuth();
  const canManageStreams = hasAnyRole(["chairperson", "adminabsolute", "general_secretary"]);

  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [studentStream, setStudentStream] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const [profiles, setProfiles] = useState<any[]>([]);
  const [streams, setStreams] = useState<any[]>([]);
  const [upgradeUserId, setUpgradeUserId] = useState("");
  const [upgradeRole, setUpgradeRole] = useState("");
  const [upgradeLoading, setUpgradeLoading] = useState(false);

  const [addStreamOpen, setAddStreamOpen] = useState(false);
  const [newStreamName, setNewStreamName] = useState("");
  const [addingStream, setAddingStream] = useState(false);

  const fetchProfiles = () => api.get("/users/all-profiles/").then(res => setProfiles(Array.isArray(res.data) ? res.data : (res.data.results || []))).catch(() => {});
  const fetchStreams = () => api.get("/streams/").then(res => setStreams(res.data.results || [])).catch(() => {});

  useEffect(() => {
    fetchProfiles();
    fetchStreams();
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
    } catch (e) {
      toast.error("Failed to add stream");
    } finally {
      setAddingStream(false);
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
        stream: studentStream || null,
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
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="register">Register Member</TabsTrigger>
          <TabsTrigger value="upgrade">Upgrade Role</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
