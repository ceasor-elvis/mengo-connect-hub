import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn, UserPlus } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (user) navigate("/portal", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter your email and password");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Welcome back!");
      navigate("/portal");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Account created! Please check your email to verify, then sign in.");
      setIsSignup(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={mengoBadge} alt="Mengo Crest" className="mx-auto mb-4 h-20 w-20 rounded-full border-4 border-gold object-cover shadow-lg" />
          <h1 className="font-serif text-2xl font-bold text-foreground">Councillor Portal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {isSignup ? "Create your councillor account" : "Sign in to access your dashboard"}
          </p>
        </div>

        <form onSubmit={isSignup ? handleSignup : handleLogin} className="space-y-5 rounded-xl border bg-card p-6 shadow-sm">
          {isSignup && (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="e.g. Brian Ssekandi" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="councillor@mengo.ac.ug" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {isSignup ? <UserPlus className="mr-2 h-4 w-4" /> : <LogIn className="mr-2 h-4 w-4" />}
            {loading ? "Please wait..." : isSignup ? "Create Account" : "Sign In"}
          </Button>

          <div className="text-center">
            <button type="button" className="text-sm text-primary hover:underline" onClick={() => setIsSignup(!isSignup)}>
              {isSignup ? "Already have an account? Sign in" : "New councillor? Create account"}
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
