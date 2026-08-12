import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, KeyRound, Loader2, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SecurityQuestionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isMandatory?: boolean;
}

const FALLBACK_QUESTIONS = [
  "What was the name of your primary school?",
  "What is your mother's maiden name?",
  "What was the name of your first childhood village or hometown?",
  "What is your favorite academic subject in school?",
  "What city or district were you born in?",
  "What was your childhood nickname?",
  "What is the name of your favorite school club or sport?"
];

export default function SecurityQuestionsModal({
  open,
  onOpenChange,
  onSuccess,
  isMandatory = false
}: SecurityQuestionsModalProps) {
  const { user, profile, refreshProfile } = useAuth();

  const [availableQuestions, setAvailableQuestions] = useState<string[]>(FALLBACK_QUESTIONS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [q1, setQ1] = useState(FALLBACK_QUESTIONS[0]);
  const [a1, setA1] = useState("");
  const [q2, setQ2] = useState(FALLBACK_QUESTIONS[3]);
  const [a2, setA2] = useState("");

  const [customQ1, setCustomQ1] = useState("");
  const [customQ2, setCustomQ2] = useState("");
  const [isCustom1, setIsCustom1] = useState(false);
  const [isCustom2, setIsCustom2] = useState(false);

  useEffect(() => {
    if (open) {
      fetchDefaultQuestions();
    }
  }, [open]);

  const fetchDefaultQuestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users/security-questions/default-list/");
      if (data.questions && Array.isArray(data.questions)) {
        setAvailableQuestions(data.questions);
        setQ1(data.questions[0]);
        setQ2(data.questions[3] || data.questions[1]);
      }
    } catch (e) {
      // Use fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const selectedQ1 = isCustom1 ? customQ1.trim() : q1;
    const selectedQ2 = isCustom2 ? customQ2.trim() : q2;
    const answer1 = a1.trim();
    const answer2 = a2.trim();

    if (!selectedQ1 || !selectedQ2) {
      toast.error("Please provide both security questions");
      return;
    }

    if (selectedQ1 === selectedQ2) {
      toast.error("Please choose two different security questions");
      return;
    }

    if (!answer1 || !answer2) {
      toast.error("Please provide answers for both security questions");
      return;
    }

    setSaving(true);
    try {
      await api.post("/users/security-questions/", {
        questions: [
          { question: selectedQ1, answer: answer1 },
          { question: selectedQ2, answer: answer2 }
        ]
      });

      toast.success("Security questions saved! You can now self-reset your password anytime.");
      if (refreshProfile) refreshProfile();
      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save security questions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (isMandatory && !newOpen && (!profile || (profile as any).has_security_questions === false)) {
          // If mandatory, require completion
          toast.warning("Please configure your security questions for account recovery before continuing.");
          return;
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="max-w-lg rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
        <div className="p-6 bg-emerald-500/10 border-b border-border/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <DialogTitle className="font-serif text-2xl font-black text-foreground">
                Account Recovery Questions
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Set up security questions to instantly reset your password without waiting for admin approval.
              </DialogDescription>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/40 text-xs text-muted-foreground space-y-1">
            <span className="font-bold text-foreground flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Fast & Secure Recovery
            </span>
            <p>
              Answers are securely hashed. When forgotten, you can answer these two questions to unlock and change your password instantly.
            </p>
          </div>

          {/* Question 1 */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black flex items-center justify-center">1</span>
                Security Question 1
              </Label>
              <button
                type="button"
                onClick={() => setIsCustom1(!isCustom1)}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                {isCustom1 ? "Choose Standard" : "Write Custom"}
              </button>
            </div>

            {!isCustom1 ? (
              <Select value={q1} onValueChange={setQ1}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs">
                  <SelectValue placeholder="Select Question 1" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableQuestions.map((q, idx) => (
                    <SelectItem key={idx} value={q} className="text-xs">{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Type your custom security question..."
                value={customQ1}
                onChange={(e) => setCustomQ1(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs"
                required={isCustom1}
              />
            )}

            <div className="space-y-1 pt-1">
              <Label htmlFor="ans1" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Your Answer *
              </Label>
              <Input
                id="ans1"
                type="text"
                placeholder="Type the answer to question 1..."
                value={a1}
                onChange={(e) => setA1(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs"
                required
              />
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-2.5 p-4 rounded-2xl bg-card border border-border/50 shadow-sm">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black flex items-center justify-center">2</span>
                Security Question 2
              </Label>
              <button
                type="button"
                onClick={() => setIsCustom2(!isCustom2)}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                {isCustom2 ? "Choose Standard" : "Write Custom"}
              </button>
            </div>

            {!isCustom2 ? (
              <Select value={q2} onValueChange={setQ2}>
                <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs">
                  <SelectValue placeholder="Select Question 2" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {availableQuestions.map((q, idx) => (
                    <SelectItem key={idx} value={q} className="text-xs">{q}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="Type your custom security question..."
                value={customQ2}
                onChange={(e) => setCustomQ2(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs"
                required={isCustom2}
              />
            )}

            <div className="space-y-1 pt-1">
              <Label htmlFor="ans2" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Your Answer *
              </Label>
              <Input
                id="ans2"
                type="text"
                placeholder="Type the answer to question 2..."
                value={a2}
                onChange={(e) => setA2(e.target.value)}
                className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
            {!isMandatory && (
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl text-xs"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            )}
            <Button
              type="submit"
              disabled={saving || !a1.trim() || !a2.trim()}
              className="h-11 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 text-xs px-6 gap-2 w-full sm:w-auto"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {saving ? "Saving Questions..." : "Save Security Questions"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
