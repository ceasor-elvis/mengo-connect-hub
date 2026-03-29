import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const ROLE_LABELS: Record<string, string> = {
  patron: "Patron",
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
  secretary_pwd: "Secretary Persons with Disabilities",
  electoral_commission: "Electoral Commission",
};

const APP_ROLES = Object.keys(ROLE_LABELS);


export default function RegisterMemberPage() {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

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
        role: selectedRole,
      });

      toast.success(`${fullName} has been registered successfully!`);
      // Reset form
      setUsername("");
      setPassword("");
      setFullName("");
      setStudentClass("");
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
        <h1 className="font-serif text-2xl font-bold">Register New Member</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a portal account for a new council member.
        </p>
      </div>

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
            <Label htmlFor="studentClass">Class</Label>
            <Input id="studentClass" placeholder="e.g. S.4 Blue" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} />
          </div>
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
    </div>
  );
}
