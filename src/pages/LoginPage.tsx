import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, LogIn, Loader2, ShieldCheck, Send, KeyRound, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

interface SecurityQuestionItem {
  id: number;
  question: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { user, setAuthData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Forgot password state
  const [forgotOpen, setForgotOpen] = useState(false);
  const [activeResetTab, setActiveResetTab] = useState<string>("security_questions");

  // Option 1: Security Questions State
  const [sqUsername, setSqUsername] = useState("");
  const [sqLoading, setSqLoading] = useState(false);
  const [sqUserFound, setSqUserFound] = useState(false);
  const [sqFullName, setSqFullName] = useState("");
  const [sqQuestions, setSqQuestions] = useState<SecurityQuestionItem[]>([]);
  const [sqAnswers, setSqAnswers] = useState<{ [key: number]: string }>({});
  const [sqNewPassword, setSqNewPassword] = useState("");
  const [sqConfirmPassword, setSqConfirmPassword] = useState("");
  const [sqResetting, setSqResetting] = useState(false);

  // Option 2: Admin Request State
  const [resetUsername, setResetUsername] = useState("");
  const [sendingReset, setSendingReset] = useState(false);

  useEffect(() => {
    if (user) navigate("/portal", { replace: true });
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error("Please enter your username and password");
      return;
    }
    setLoading(true);
    
    try {
      const res = await api.post("/users/login/", { username, password });
      const { access, refresh, user: userData } = res.data;
      setAuthData(access, refresh, userData ?? { id: "", username });
      toast.success("Welcome back!");
      navigate("/portal");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Find security questions for user
  const handleFetchQuestions = async () => {
    if (!sqUsername.trim()) {
      toast.error("Please enter your username");
      return;
    }
    setSqLoading(true);
    try {
      const { data } = await api.post("/users/security-questions/get-for-reset/", {
        username: sqUsername.trim()
      });

      if (data.has_security_questions === false) {
        toast.warning(data.detail || "Security questions are not configured for this account. Please request an admin reset.");
        setActiveResetTab("admin_request");
        setResetUsername(sqUsername.trim());
      } else {
        setSqQuestions(data.questions || []);
        setSqFullName(data.full_name || data.username);
        setSqUserFound(true);
        // Initialize empty answers map
        const initialMap: { [key: number]: string } = {};
        (data.questions || []).forEach((q: SecurityQuestionItem) => {
          initialMap[q.id] = "";
        });
        setSqAnswers(initialMap);
        toast.success("Security questions retrieved! Please provide the answers below.");
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "No account found with this username");
      setSqUserFound(false);
    } finally {
      setSqLoading(false);
    }
  };

  // Step 2: Verify answers and reset password instantly
  const handleVerifyAndResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sqNewPassword || !sqConfirmPassword) {
      toast.error("Please enter and confirm your new password");
      return;
    }
    if (sqNewPassword !== sqConfirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }
    if (sqNewPassword.length < 4) {
      toast.error("Password must be at least 4 characters long");
      return;
    }

    // Ensure all questions answered
    const answersPayload = sqQuestions.map(q => ({
      id: q.id,
      answer: sqAnswers[q.id] || ""
    }));

    for (const item of answersPayload) {
      if (!item.answer.trim()) {
        toast.error("Please answer all security questions");
        return;
      }
    }

    setSqResetting(true);
    try {
      const payload = {
        username: sqUsername.trim(),
        answers: answersPayload,
        new_password: sqNewPassword
      };

      const { data } = await api.post("/users/security-questions/verify-and-reset/", payload);
      toast.success(data.message || "Password reset successfully! Please sign in.");
      
      // Reset state and switch to login with prefilled username
      setUsername(sqUsername.trim());
      setPassword(sqNewPassword);
      setForgotOpen(false);
      resetSqState();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Incorrect security answers. Please verify and try again.");
    } finally {
      setSqResetting(false);
    }
  };

  const resetSqState = () => {
    setSqUsername("");
    setSqUserFound(false);
    setSqFullName("");
    setSqQuestions([]);
    setSqAnswers({});
    setSqNewPassword("");
    setSqConfirmPassword("");
  };

  // Option 2: Request Admin Reset
  const handleRequestReset = async () => {
    if (!resetUsername.trim()) {
      toast.error("Please enter your username");
      return;
    }
    setSendingReset(true);
    try {
      await api.post("/users/forgot-password/", { username: resetUsername.trim() });
      toast.success("Reset request sent to Administration / Registering Officers!");
      setForgotOpen(false);
      setResetUsername("");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Could not find account");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <img src={mengoBadge} alt="Mengo Crest" className="mx-auto mb-4 h-20 w-20 rounded-full border-4 border-gold object-cover shadow-lg" />
          <h1 className="font-serif text-2xl font-bold text-foreground">Councillor Portal</h1>
          <p className="mt-1 text-xs font-mono text-muted-foreground tracking-wider">
            Mengo Student Council
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in with your username
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 rounded-2xl border bg-card/70 backdrop-blur-xl p-6 shadow-xl">
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              placeholder="e.g. jdoe"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/\s/g, ""))}
              className="rounded-xl bg-background/50 h-11"
            />
            <p className="text-xs text-muted-foreground">Your unique council username</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password *</Label>
              <Dialog 
                open={forgotOpen} 
                onOpenChange={(open) => {
                  setForgotOpen(open);
                  if (!open) resetSqState();
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs font-semibold text-primary hover:underline">
                    Forgot Password?
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-lg rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
                  <div className="p-6 bg-primary/5 border-b border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                        <KeyRound className="h-6 w-6" />
                      </div>
                      <div>
                        <DialogTitle className="font-serif text-2xl font-black text-foreground">
                          Account Password Recovery
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                          Choose your preferred password recovery method below.
                        </DialogDescription>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <Tabs value={activeResetTab} onValueChange={setActiveResetTab} className="space-y-5">
                      <TabsList className="grid grid-cols-2 h-11 p-1 rounded-xl bg-muted/50 border border-border/40">
                        <TabsTrigger value="security_questions" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Instant via Security Qs
                        </TabsTrigger>
                        <TabsTrigger value="admin_request" className="rounded-lg text-xs font-bold gap-1.5 data-[state=active]:bg-background">
                          <Send className="w-3.5 h-3.5 text-amber-600" /> Admin Request
                        </TabsTrigger>
                      </TabsList>

                      {/* ═════════════════════════════════════════════════════════════ */}
                      {/* TAB 1: INSTANT RESET VIA SECURITY QUESTIONS */}
                      {/* ═════════════════════════════════════════════════════════════ */}
                      <TabsContent value="security_questions" className="space-y-4 pt-1">
                        {!sqUserFound ? (
                          <div className="space-y-4">
                            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                              <p>
                                Self-service instant reset: Enter your username to answer your registered security questions and choose a new password immediately.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="sq_username" className="text-xs font-bold text-foreground">
                                Account Username *
                              </Label>
                              <Input
                                id="sq_username"
                                placeholder="e.g. jdoe"
                                value={sqUsername}
                                onChange={(e) => setSqUsername(e.target.value.replace(/\s/g, ""))}
                                className="rounded-xl h-11 bg-muted/30"
                              />
                            </div>

                            <Button 
                              onClick={handleFetchQuestions} 
                              disabled={sqLoading || !sqUsername.trim()}
                              className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground text-xs gap-2"
                            >
                              {sqLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                              {sqLoading ? "Checking Account..." : "Retrieve My Security Questions"}
                            </Button>
                          </div>
                        ) : (
                          <form onSubmit={handleVerifyAndResetPassword} className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/40 text-xs">
                              <div>
                                <span className="text-[10px] uppercase font-bold text-muted-foreground block">Account Identified</span>
                                <span className="font-bold text-foreground">{sqFullName} (@{sqUsername})</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setSqUserFound(false)}
                                className="text-[11px] h-7 text-primary hover:underline font-bold"
                              >
                                Change User
                              </Button>
                            </div>

                            {/* Security Questions List */}
                            <div className="space-y-3">
                              {sqQuestions.map((q, idx) => (
                                <div key={q.id} className="space-y-1.5 p-3 rounded-2xl bg-muted/20 border border-border/40">
                                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">
                                      {idx + 1}
                                    </span>
                                    {q.question}
                                  </Label>
                                  <Input
                                    type="text"
                                    placeholder="Type your answer..."
                                    value={sqAnswers[q.id] || ""}
                                    onChange={(e) => setSqAnswers({ ...sqAnswers, [q.id]: e.target.value })}
                                    className="rounded-xl h-10 bg-background/70 text-xs"
                                    required
                                  />
                                </div>
                              ))}
                            </div>

                            {/* New Password Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                              <div className="space-y-1.5">
                                <Label htmlFor="sq_new_pass" className="text-xs font-bold text-foreground">
                                  New Password *
                                </Label>
                                <Input
                                  id="sq_new_pass"
                                  type="password"
                                  placeholder="••••••••"
                                  value={sqNewPassword}
                                  onChange={(e) => setSqNewPassword(e.target.value)}
                                  className="rounded-xl h-10 bg-muted/30 text-xs"
                                  required
                                />
                              </div>

                              <div className="space-y-1.5">
                                <Label htmlFor="sq_conf_pass" className="text-xs font-bold text-foreground">
                                  Confirm New Password *
                                </Label>
                                <Input
                                  id="sq_conf_pass"
                                  type="password"
                                  placeholder="••••••••"
                                  value={sqConfirmPassword}
                                  onChange={(e) => setSqConfirmPassword(e.target.value)}
                                  className="rounded-xl h-10 bg-muted/30 text-xs"
                                  required
                                />
                              </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="h-11 rounded-xl text-xs flex-1"
                                onClick={() => setSqUserFound(false)}
                              >
                                Back
                              </Button>
                              <Button 
                                type="submit" 
                                disabled={sqResetting}
                                className="h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 text-xs flex-2 gap-2"
                              >
                                {sqResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {sqResetting ? "Verifying..." : "Verify & Reset Password"}
                              </Button>
                            </div>
                          </form>
                        )}
                      </TabsContent>

                      {/* ═════════════════════════════════════════════════════════════ */}
                      {/* TAB 2: REQUEST ADMIN / OFFICER APPROVAL */}
                      {/* ═════════════════════════════════════════════════════════════ */}
                      <TabsContent value="admin_request" className="space-y-4 pt-1">
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p>
                            Submit an official reset chit to the Council Patron and Member Registration Officers. They will generate a temporary pass for you.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="reset-username" className="text-xs font-bold text-foreground">Account Username *</Label>
                          <Input
                            id="reset-username"
                            placeholder="e.g. jdoe"
                            value={resetUsername}
                            onChange={(e) => setResetUsername(e.target.value.replace(/\s/g, ""))}
                            className="rounded-xl h-11 bg-muted/30 text-xs"
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="outline" onClick={() => setForgotOpen(false)} className="h-11 rounded-xl text-xs">
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleRequestReset} 
                            disabled={sendingReset || !resetUsername.trim()}
                            className="h-11 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 text-xs gap-2 px-5"
                          >
                            {sendingReset && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Send className="w-3.5 h-3.5" /> Submit Request to Officers
                          </Button>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl bg-background/50 h-11" 
            />
          </div>

          <Button type="submit" className="w-full rounded-xl h-11 font-bold shadow-lg shadow-primary/20 text-sm" disabled={loading}>
            <LogIn className="mr-2 h-4 w-4" />
            {loading ? "Please wait..." : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          <Lock className="mr-1 inline h-3 w-3" />
          Access restricted to elected council members & students
        </p>
      </div>
    </div>
  );
}
