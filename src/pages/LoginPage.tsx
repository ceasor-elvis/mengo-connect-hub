import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, LogIn, UserPlus } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { Constants } from "@/integrations/supabase/types";

const COUNCILLOR_PREFIX = "MSC"; // Mengo Student Council - common identifier

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

function makeEmail(studentId: string) {
  return `${COUNCILLOR_PREFIX.toLowerCase()}.${studentId.toLowerCase()}@mengo.council`;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    if (user) navigate("/portal", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !password) {
      toast.error("Please enter your Student ID and password");
      return;
    }
    setLoading(true);
    const email = makeEmail(studentId);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("Invalid Student ID or password");
    } else {
      toast.success("Welcome back!");
      navigate("/portal");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !password || !fullName || !selectedRole) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    // Check if position is already taken
    const { data: existingRoles } = await supabase
      .from("user_roles")
      .select("id")
      .eq("role", selectedRole as any);

    if (existingRoles && existingRoles.length > 0) {
      setLoading(false);
      toast.error(`The position "${ROLE_LABELS[selectedRole]}" is already taken by another councillor.`);
      return;
    }

    const email = makeEmail(studentId);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, student_id: studentId },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setLoading(false);
      toast.error(error.message);
      return;
    }

    // Update profile with student_id and class
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ student_id: studentId, class: studentClass || null })
        .eq("user_id", data.user.id);

      // Assign role
      await supabase.from("user_roles").insert({
        user_id: data.user.id,
        role: selectedRole as any,
      });
    }

    setLoading(false);
    toast.success("Account created! You can now sign in.");
    setIsSignup(false);
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={mengoBadge} alt="Mengo Crest" className="mx-auto mb-4 h-20 w-20 rounded-full border-4 border-gold object-cover shadow-lg" />
          <h1 className="font-serif text-2xl font-bold text-foreground">Councillor Portal</h1>
          <p className="mt-1 text-xs font-mono text-muted-foreground tracking-wider">
            {COUNCILLOR_PREFIX} — Mengo Student Council
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? "Register as a councillor" : "Sign in with your Student ID"}
          </p>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-4 rounded-xl border bg-card p-6 shadow-sm">
          {isSignup && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" placeholder="e.g. Nakamya Faith" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentClass">Class</Label>
                <Input id="studentClass" placeholder="e.g. S.4 Blue" value={studentClass} onChange={(e) => setStudentClass(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Position / Office *</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your position" />
                  </SelectTrigger>
                  <SelectContent>
                    {Constants.public.Enums.app_role.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABELS[role] || role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="studentId">Student ID *</Label>
            <div className="flex items-center gap-2">
              <span className="rounded bg-primary/10 px-2 py-1.5 text-xs font-bold text-primary">{COUNCILLOR_PREFIX}-</span>
              <Input
                id="studentId"
                placeholder="e.g. 2024001"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.replace(/\s/g, ""))}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Your unique student identification number</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password *</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {isSignup ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
            {loading ? "Please wait..." : isSignup ? "Register" : "Sign In"}
          </Button>

          <div className="text-center">
            <button type="button" className="text-sm text-primary hover:underline" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? "Already registered? Sign in" : "New councillor? Register"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Lock className="mr-1 inline h-3 w-3" />
          Access restricted to elected council members only
        </p>
      </div>
    </div>
  );
}
