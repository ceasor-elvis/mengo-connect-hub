import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, KeyRound, ArrowRight, Loader2, AlertCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStoreSync, useCountdown } from "@/hooks/useApi";
import {
  validateVotingCode, verifyVoter, parseCodePrefix,
  getElectionStatus, fetchVotingTypes
} from "@/data/api";
import mengoLogo from "@/assets/mengo-logo.png";
import ElectionGuard from "@/components/ElectionGuard";
import { Badge } from "@/components/ui/badge";


const LoginPage = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [votingCode, setVotingCode] = useState("");
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resolvedVotingTypeId, setResolvedVotingTypeId] = useState("");
  const [resolvedVotingTypeName, setResolvedVotingTypeName] = useState("");
  const [codeClassInfo, setCodeClassInfo] = useState<{ classLevel: string; stream: string } | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const navigate = useNavigate();
  const store = useStoreSync();
  const targetTime = store.state === "scheduled" ? store.startTime : store.endTime;
  const timeLeft = useCountdown(targetTime);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          getElectionStatus(),
          fetchVotingTypes(),
        ]);
      } catch (err: any) {
        console.error("Failed to load initial election data:", err);
      }
    };
    init();
  }, []);

  const statusColor = store.state === "live"
    ? "bg-green-500/15 text-green-500"
    : store.state === "scheduled"
    ? "bg-blue-500/15 text-blue-500"
    : store.state === "paused"
    ? "bg-yellow-500/15 text-yellow-500"
    : "bg-red-500/15 text-red-500";

  const handleStep1 = async () => {
    if (!votingCode.trim()) {
      setError("Please enter your voting code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await validateVotingCode(votingCode.trim());

      if (result.already_used) {
        setError("This voting code has already been used. Each code can only be used once.");
        return;
      }

      if (!result.valid) {
        
        setError("Invalid voting code, or this election type is not currently active.");
        return;
      }

      

      const parsed = parseCodePrefix(votingCode.trim());
      const classInfo = parsed || {
        classLevel: result.class_name || "",
        stream: result.stream || "",
      };
      setCodeClassInfo(classInfo);
      setResolvedVotingTypeId(result.voting_type_id || "");
      setResolvedVotingTypeName(result.voting_type_name || "");
      setNeedsConfirm(result.confirm_required ?? false);

      if (result.confirm_required) {
        setStep(2);
      } else {
        navigate("/evote/vote", {
          state: {
            votingCode: votingCode.trim(),
            votingTypeId: result.voting_type_id,
            classInfo,
          },
        });
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!studentId.trim()) {
      setError("Please enter your registration number");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const result = await verifyVoter(votingCode.trim(), studentId.trim());
      if (!result) {
        setError("Registration number doesn't match this voting code. Try again.");
        return;
      }

      navigate("/evote/confirm", {
        state: {
          student: result.student,
          votingCode: votingCode.trim(),
          votingTypeId: resolvedVotingTypeId,
          classInfo: codeClassInfo,
        },
      });
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ElectionGuard>
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative premium gradient background bubbles */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="relative w-24 h-24 mx-auto mb-4 flex items-center justify-center rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl"
          >
            {/* Spinning decorative ring */}
            <div className="absolute inset-1 rounded-2xl border border-dashed border-accent/30 animate-spin" style={{ animationDuration: '30s' }} />
            <img src={mengoLogo} alt="Mengo Senior School" className="w-16 h-16 object-contain relative z-10" />
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Mengo Senior School
          </h1>
          <p className="text-white/60 text-xs sm:text-sm font-medium tracking-wide mt-1 uppercase">
            Secure Electoral System
          </p>

          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor} flex items-center gap-1`}>
              <span className="relative flex h-1.5 w-1.5">
                {store.state === "live" && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${store.state === "live" ? "bg-green-500" : "bg-muted-foreground"}`} />
              </span>
              {store.state === "live" ? "Live" : store.state === "scheduled" ? "Scheduled" : store.state === "paused" ? "Paused" : "Ended"}
            </span>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/90 text-xs font-mono font-bold shadow-sm">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {timeLeft}
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 mt-3 flex-wrap">
            {store.votingTypes.filter((v) => v.active).map((vt) => (
              <Badge key={vt.id} variant="outline" className="bg-white/5 border-white/10 text-white/70 text-[9px] font-bold uppercase tracking-wider py-0 px-2.5">
                {vt.name}
              </Badge>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="bg-card/45 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl p-8 relative overflow-hidden">
          {needsConfirm && step === 2 && (
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-muted text-muted-foreground border border-border">1</div>
              <div className="w-8 h-0.5 bg-border" />
              <div className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold bg-primary text-primary-foreground shadow-sm shadow-primary/20 ring-2 ring-primary/30">2</div>
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <KeyRound className="w-4 h-4 text-accent" />
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">Voting Code</label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal mb-3">Enter the unique access code printed on your voting sheet.</p>
                  <input
                    type="text"
                    value={votingCode}
                    onChange={(e) => {
                      let val = e.target.value.toUpperCase();
                      // Auto-hyphenation: S4A -> S4A-
                      if (val.length === 3 && votingCode.length === 2 && /^[S]\d[A-Z]$/.test(val)) {
                        val += "-";
                      }
                      setVotingCode(val);
                      setError("");
                    }}
                    placeholder="e.g. S4A-8K2P9"
                    maxLength={15}
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-center font-mono text-lg tracking-widest uppercase shadow-inner"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleStep1()}
                  />
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Shield className="w-3 h-3 text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Single-use secure credential</p>
                  </div>
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 text-destructive text-xs mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                <button
                  onClick={handleStep1}
                  disabled={loading || votingCode.length < 5}
                  className="w-full py-3.5 rounded-xl bg-hero-gradient text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </motion.div>
            ) : (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
                {resolvedVotingTypeName && (
                  <div className="mb-5 text-center flex flex-wrap justify-center gap-1.5">
                    <Badge className="bg-accent/15 border-accent/20 text-accent text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                      {resolvedVotingTypeName}
                    </Badge>
                    {codeClassInfo && (
                      <Badge className="bg-primary/10 border-primary/20 text-primary text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5">
                        {codeClassInfo.classLevel} - {codeClassInfo.stream}
                      </Badge>
                    )}
                  </div>
                )}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Shield className="w-4 h-4 text-accent" />
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">Registration Number</label>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal mb-3">Provide your official student registration number to verify your identity.</p>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => { setStudentId(e.target.value.toUpperCase()); setError(""); }}
                    placeholder="e.g. STU-2024-001"
                    className="w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all text-center font-mono text-lg tracking-widest uppercase shadow-inner"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleStep2()}
                  />
                </div>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2 text-destructive text-xs mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 leading-relaxed">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="px-4 py-3 rounded-xl border border-border hover:bg-muted/50 font-semibold text-muted-foreground text-sm transition-all duration-200 cursor-pointer">
                    Back
                  </button>
                  <button
                    onClick={handleStep2}
                    disabled={loading}
                    className="flex-1 py-3.5 rounded-xl bg-hero-gradient text-primary-foreground font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Verify Identity <ArrowRight className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-white/30 text-[10px] mt-6 tracking-wide font-medium uppercase">
          Mengo Senior School • Protected by end-to-end encryption
        </p>
      </motion.div>
    </div>
    </ElectionGuard>
  );
};

export default LoginPage;
