import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ChevronRight, User, Clock, Timer, Loader2, Sparkles, ShieldCheck, Award } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useStoreSync, useCountdown, useCategoryCountdown } from "@/hooks/useApi";
import { submitVotes, parseCodePrefix, fetchCategories, fetchCandidates, fetchVotingTypes, getElectionStatus } from "@/data/api";
import mengoLogo from "@/assets/mengo-logo.png";
import ElectionGuard from "@/components/ElectionGuard";
import { toast } from "sonner";
import CachedImage from "@/components/CachedImage";
import { Badge } from "@/components/ui/badge";

const getGradient = (name: string) => {
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gradients = [
    "from-[#800020] to-[#b3002d]",
    "from-[#9d2235] to-[#c73e54]",
    "from-slate-800 to-slate-600",
    "from-indigo-900 to-indigo-700",
    "from-teal-800 to-teal-600",
    "from-[#6a1b29] to-[#8a2538]"
  ];
  return gradients[hash % gradients.length];
};

const getInitials = (name: string) => {
  if (!name) return "??";
  return name.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
};

interface LocationState {
  votingCode?: string;
  votingTypeId?: string;
  classInfo?: { classLevel: string; stream: string };
  student?: any;
}

const SESSION_KEY = (code: string) => `vote_session_${code}`;

const VotePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { votingCode = "", votingTypeId = "", classInfo: passedClassInfo, student } = (location.state as LocationState) || {};

  // ── Session restore: load persisted step & selections on mount ──
  const savedSession = (() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY(votingCode)) || 'null'); } catch { return null; }
  })();

  const [currentStep, setCurrentStep] = useState<number>(savedSession?.step ?? 0);
  const [selections, setSelections] = useState<Record<string, string>>(savedSession?.selections ?? {});
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [zoomedCandidate, setZoomedCandidate] = useState<any>(null);
  const [submissionError, setSubmissionError] = useState(false);

  const store = useStoreSync();
  const electionTimeLeft = useCountdown(store.endTime);
  const { display: categoryTimeLeft, urgent: timerUrgent, expired: timerExpired } = useCategoryCountdown(store.candidateTimerSeconds, currentStep);

  // ── Persist session to sessionStorage whenever step or selections change ──
  useEffect(() => {
    if (!votingCode || done) return;
    sessionStorage.setItem(SESSION_KEY(votingCode), JSON.stringify({ step: currentStep, selections, votingTypeId }));
  }, [currentStep, selections, votingCode, votingTypeId, done]);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          getElectionStatus(),
          fetchVotingTypes(),
          fetchCategories(votingTypeId),
          fetchCandidates({ votingTypeId }),
        ]);
      } catch (err: any) {
        console.error("Failed to load voting data:", err);
      }
    };
    if (votingTypeId) init();
  }, [votingTypeId]);

  const codeClassInfo = useMemo(() => {
    if (passedClassInfo) return passedClassInfo;
    const parsed = parseCodePrefix(votingCode);
    if (parsed) return parsed;
    const vc = store.votingCodes.find((c) => c.code === votingCode);
    if (vc) return { classLevel: vc.className, stream: vc.stream };
    return null;
  }, [votingCode, passedClassInfo, store.votingCodes]);

  const isCouncillorType = useMemo(() => {
    return store.categories.some((c) => c.votingTypeId === votingTypeId && (c.gender === "male" || c.gender === "female"));
  }, [store.categories, votingTypeId]);

  const sortedCategories = useMemo(() =>
    [...store.categories]
      .filter((c) => c.votingTypeId === votingTypeId)
      .sort((a, b) => a.order - b.order),
    [store.categories, votingTypeId]
  );

  const currentCategory = sortedCategories[currentStep];
  const isCouncillorCategory = currentCategory?.gender === "male" || currentCategory?.gender === "female";

  const categoryCandidates = useMemo(() => {
    if (!currentCategory) return [];
    let cands = store.candidates.filter((c) => c.categoryId === currentCategory.id);
    if (isCouncillorCategory && codeClassInfo) {
      cands = cands.filter((c) => c.classLevel === codeClassInfo.classLevel && c.stream === codeClassInfo.stream);
    }
    return cands;
  }, [store.candidates, currentCategory, isCouncillorCategory, codeClassInfo]);

  const progress = ((currentStep) / sortedCategories.length) * 100;

  const votingType = store.votingTypes.find((v) => v.id === votingTypeId);
  const votingTypeName = votingType?.name || "Voting";

  const statusColor = store.state === "live"
    ? "bg-green-500/15 text-green-500"
    : store.state === "paused"
    ? "bg-yellow-500/15 text-yellow-500"
    : "bg-red-500/15 text-red-500";

  const voteConfirmEnabled = store.voteConfirmEnabled;

  const handleSelect = (candidateId: string) => {
    setSelections((prev) => ({ ...prev, [currentCategory.id]: candidateId }));

    // If confirmation is disabled, auto-advance after a brief visual delay
    if (!voteConfirmEnabled) {
      setTimeout(() => {
        autoAdvance(candidateId);
      }, 400);
    }
  };

  // ── Timer expired: skip current category and advance ──
  useEffect(() => {
    if (!timerExpired || done || submitting || !currentCategory) return;
    toast.warning(`⏱ Time's up for "${currentCategory.name}" — skipping to next.`, { duration: 3000 });
    if (currentStep < sortedCategories.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCurrentStep(sortedCategories.length); // go to final review
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerExpired]);

  const autoAdvance = async (candidateId?: string) => {
    const updatedSelections = candidateId ? { ...selections, [currentCategory.id]: candidateId } : { ...selections };
    if (currentStep < sortedCategories.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCurrentStep(sortedCategories.length);
    }
  };

  const handleNext = () => {
    if (!selections[currentCategory.id] && !timerExpired) return;
    if (voteConfirmEnabled && !timerExpired) {
      setShowConfirm(true);
    } else {
      autoAdvance(selections[currentCategory.id]);
    }
  };

  const confirmAndProceed = async () => {
    setShowConfirm(false);
    if (currentStep < sortedCategories.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCurrentStep(sortedCategories.length);
    }
  };

  const handleCastBallot = async () => {
    setSubmitting(true);
    setSubmissionError(false);
    try {
      await submitVotes(votingCode, selections);
      setDone(true);
      sessionStorage.removeItem(SESSION_KEY(votingCode));
    } catch (err: any) {
      console.error("Vote submission failed:", err);
      setSubmissionError(true);
      toast.error(err.response?.data?.detail || err.response?.data?.election || "Vote submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card/45 backdrop-blur-xl border border-border/60 shadow-2xl rounded-3xl p-8 sm:p-10 text-center max-w-md w-full relative z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500 mx-auto mb-6 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-foreground mb-2 font-serif">Ballot Submitted!</h2>
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-accent tracking-widest uppercase mb-4">
            <Award className="w-4 h-4" /> Securely Recorded
          </div>
          
          <p className="text-muted-foreground text-sm leading-relaxed mb-8">
            Thank you for participating in the <strong>{votingTypeName}</strong> election. Your choices have been encrypted and saved securely.
          </p>
          
          <button
            onClick={() => navigate("/evote")}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-primary to-[#500010] border-2 border-accent text-accent font-bold text-sm tracking-wider flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:opacity-95 active:scale-98 transition-all duration-200 cursor-pointer shadow-md"
          >
            Finish Session
          </button>
        </motion.div>
      </div>
    );
  }

  if (!currentCategory && currentStep !== sortedCategories.length) return null;

  return (
    <ElectionGuard votingCode={votingCode}>
    <div className="min-h-screen bg-hero-gradient flex flex-col justify-between py-4 px-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full mx-auto mb-4 flex items-center justify-between px-4 py-2.5 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl relative z-10 flex-shrink-0 shadow-lg">
        <div className="flex items-center gap-2">
          <img src={mengoLogo} alt="MSS Logo" className="w-6 h-6 object-contain" />
          <span className="font-sans font-bold text-xs tracking-wider text-white uppercase">{votingTypeName} Election</span>
          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${statusColor}`}>
            <span className="relative flex h-1.5 w-1.5">
              {store.state === "live" ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                </>
              ) : (
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
              )}
            </span>
            {store.state === "live" ? "Live" : store.state === "paused" ? "Paused" : "Ended"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-white/50 uppercase font-bold tracking-wider hidden sm:inline-block">Time Remaining</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-mono font-bold shadow-sm">
            <Clock className="w-3.5 h-3.5 text-accent" />
            {electionTimeLeft}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full mx-auto bg-[#faf8f5] text-[#2c1d11] border-4 border-double border-[#c5a059] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-4 sm:p-6 md:p-8 flex flex-col relative overflow-hidden flex-grow min-h-[480px] z-10"
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
          <img src={mengoLogo} alt="Mengo Seal" className="w-80 h-80 object-contain" />
        </div>

        {currentStep === sortedCategories.length ? (
          <div className="flex-grow flex flex-col relative z-10">
            <div className="text-center mb-6 pb-4 border-b border-[#e8dfcf]">
              <span className="px-3 py-1 rounded-full bg-accent/20 text-primary text-[10px] font-bold uppercase tracking-wider font-sans border border-accent/20">
                Ballot Paper Summary
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#1c1105] font-serif mt-2">
                Verify Your Choices
              </h2>
              <p className="text-[#60523e] text-xs max-w-md mx-auto mt-1 leading-relaxed">
                Please review your selections below before casting your final ballot. Click on any row to change your choice.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-6">
              {sortedCategories.map((cat, idx) => {
                const selectedCandId = selections[cat.id];
                const candidate = store.candidates.find((c) => c.id === selectedCandId);
                
                return (
                  <motion.div 
                    key={cat.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => setCurrentStep(idx)}
                    className="group flex items-center justify-between p-3 sm:p-4 rounded-xl border border-[#e6dfd3] bg-white hover:border-primary hover:shadow-md transition-all duration-200 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-[#e8dfcf] flex-shrink-0">
                         {candidate?.photo ? (
                           <CachedImage src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className={`w-full h-full bg-gradient-to-br ${candidate ? getGradient(candidate.name) : "from-slate-200 to-slate-300"} flex items-center justify-center text-white text-xs font-bold`}>
                             {candidate ? getInitials(candidate.name) : "?"}
                           </div>
                         )}
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-muted-foreground block tracking-wider leading-none mb-0.5">
                          {cat.name}
                        </span>
                        <span className="text-sm font-bold text-[#1c1105] block leading-tight group-hover:text-primary transition-colors">
                          {candidate ? candidate.name : <span className="text-red-500 italic">No Selection (Skipped)</span>}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {candidate?.classLevel && (
                        <span className="text-[9px] font-bold bg-[#faf8f5] border border-[#e8dfcf] text-[#60523e] px-2 py-0.5 rounded hidden sm:inline-block">
                          {candidate.classLevel}{candidate.stream ? ` - ${candidate.stream}` : ""}
                        </span>
                      )}
                      <span className="text-xs font-bold text-primary opacity-60 group-hover:opacity-100 transition-opacity">
                        Change
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {submissionError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 text-xs leading-relaxed text-center font-medium">
                Error recording ballot. Please check your connection and try again.
              </div>
            )}

            <div className="border-t border-[#e8dfcf] pt-4">
              <button
                onClick={handleCastBallot}
                disabled={submitting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-primary to-[#500010] border-2 border-accent text-accent font-bold text-sm tracking-widest flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] hover:opacity-95 active:scale-98 transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-lg uppercase"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-accent" />
                    CASTING SECURE BALLOT...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-accent" />
                    CAST MY SECURE BALLOT NOW
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
            <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#e8dfcf] flex-shrink-0 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none bg-primary/10 px-2 py-0.5 rounded">
                    Step {currentStep + 1} of {sortedCategories.length}
                  </span>
                  {isCouncillorCategory && codeClassInfo && (
                    <span className="text-[10px] font-bold text-accent uppercase tracking-widest leading-none bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                      {codeClassInfo.classLevel} - {codeClassInfo.stream} Candidates
                    </span>
                  )}
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1c1105] font-serif leading-tight">
                  {currentCategory.name}
                </h2>
                {currentCategory.description && (
                  <p className="text-[#60523e] text-xs font-sans max-w-xl leading-relaxed">
                    {currentCategory.description}
                  </p>
                )}
              </div>
              
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-bold transition-all duration-300 shadow-md ${
                timerUrgent 
                  ? "bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.4)] border border-red-500 animate-pulse" 
                  : "bg-amber-500 text-white shadow-[0_0_10px_rgba(245,158,11,0.2)] border border-amber-400"
              }`}>
                <Timer className="w-3.5 h-3.5" />
                {categoryTimeLeft}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 flex-shrink-0">
              <div className="flex-1 h-2 bg-[#e6dfd3] rounded-full overflow-hidden border border-[#dfd7c8]">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/80"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <span className="text-[10px] text-[#60523e] font-bold font-mono whitespace-nowrap">
                {Math.round(progress)}% Filled
              </span>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 min-h-0">
              {categoryCandidates.length === 0 ? (
                <div className="h-full flex items-center justify-center py-8">
                  <div className="text-center bg-white border border-[#e6dfd3] rounded-2xl p-8 max-w-xs shadow-sm">
                    <User className="w-12 h-12 text-[#60523e]/30 mx-auto mb-3" />
                    <p className="text-[#60523e] text-sm font-medium">No candidates registered for your class/stream in this category.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 auto-rows-fr p-0.5">
                  {categoryCandidates.map((candidate, i) => {
                    const selected = selections[currentCategory.id] === candidate.id;
                    return (
                      <motion.button
                        key={candidate.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleSelect(candidate.id)}
                        className={`group relative rounded-2xl text-left flex flex-col items-center p-4 overflow-hidden border-2 bg-white transition-all duration-300 hover:scale-[1.03] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent ${
                          selected 
                            ? "border-primary ring-2 ring-primary/20 shadow-md bg-primary/[0.01]" 
                            : "border-[#e6dfd3] hover:border-primary/40 shadow-sm"
                        }`}
                      >
                        {selected && (
                          <motion.div 
                            initial={{ scale: 0 }} 
                            animate={{ scale: 1 }} 
                            className="absolute top-2.5 right-2.5 z-10 w-6 h-6 rounded-full bg-primary border border-accent flex items-center justify-center shadow-md"
                          >
                            <CheckCircle2 className="w-4 h-4 text-accent fill-primary" />
                          </motion.div>
                        )}

                        <div 
                          className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 shadow-inner mb-3 transition-all duration-300 cursor-zoom-in relative group-hover:scale-[1.04] ${
                            selected ? "border-primary shadow-primary/20" : "border-[#e6dfd3]"
                          }`}
                          onClick={(e) => { e.stopPropagation(); setZoomedCandidate(candidate); }}
                        >
                          {candidate.photo ? (
                            <CachedImage src={candidate.photo} alt={candidate.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${getGradient(candidate.name)} flex items-center justify-center text-white text-lg font-bold`}>
                              {getInitials(candidate.name)}
                            </div>
                          )}
                        </div>

                        <h3 className="font-bold text-[#1c1105] text-sm sm:text-base text-center leading-tight group-hover:text-primary transition-colors">
                          {candidate.name}
                        </h3>
                        
                        
                        
                        {candidate.classLevel && (
                          <Badge variant="outline" className="text-[9px] font-bold border-[#e8dfcf] text-[#60523e] bg-[#faf8f5] mt-2 py-0 px-2 leading-tight">
                            {candidate.classLevel}{candidate.stream ? ` - ${candidate.stream}` : ""}
                          </Badge>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {(voteConfirmEnabled || timerExpired || submissionError) && (
              <div className="flex justify-between items-center flex-shrink-0 pt-4 border-t border-[#e8dfcf]">
                <span className="text-xs text-[#60523e] font-medium hidden sm:inline-block">
                  {selections[currentCategory.id] ? "Selection marked. Ready to proceed." : "Please make a selection."}
                </span>
                <button
                  onClick={handleNext}
                  disabled={(!selections[currentCategory.id] && !timerExpired) || submitting}
                  className="ml-auto px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:bg-primary/95 hover:shadow-lg active:scale-98 transition-all disabled:opacity-40 text-sm cursor-pointer"
                >
                  {currentStep < sortedCategories.length - 1 ? "Next Category" : "Go to Review"} 
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <div className="text-center text-white/40 text-[9px] uppercase tracking-wider font-semibold mt-4 z-10">
        Mengo Senior School • Secure Electronic Voting • E2E Encrypted
      </div>

      <AnimatePresence>
        {showConfirm && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
               initial={{ scale: 0.95, opacity: 0 }} 
               animate={{ scale: 1, opacity: 1 }} 
               exit={{ scale: 0.95, opacity: 0 }} 
               className="bg-[#faf8f5] border-2 border-accent text-[#1c1105] rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
             >
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
               <h3 className="text-lg font-bold font-serif mb-2 text-[#1c1105]">Confirm Choice</h3>
               <p className="text-xs text-[#60523e] mb-1">
                 You selected for <span className="font-semibold text-primary">{currentCategory.name}</span>:
               </p>
               <p className="text-base font-bold text-primary mb-6 flex items-center gap-2 bg-primary/5 p-3 rounded-lg border border-primary/10 font-sans">
                 <CheckCircle2 className="w-5 h-5 text-accent fill-primary flex-shrink-0" />
                 {store.candidates.find((c) => c.id === selections[currentCategory.id])?.name}
               </p>
               <div className="flex gap-3">
                 <button 
                   onClick={() => setShowConfirm(false)} 
                   className="flex-1 py-2.5 rounded-xl border border-[#e6dfd3] bg-white text-[#60523e] text-xs font-bold hover:bg-[#faf8f5] transition-colors cursor-pointer"
                 >
                   Change Selection
                 </button>
                 <button 
                   onClick={confirmAndProceed} 
                   disabled={submitting} 
                   className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-95 transition-opacity disabled:opacity-60 cursor-pointer"
                 >
                   {submitting ? "Confirming..." : "Confirm Choice"}
                 </button>
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {zoomedCandidate && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 cursor-zoom-out" 
            onClick={() => setZoomedCandidate(null)}
          >
            <motion.div 
              initial={{ scale: 0.7, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.7, opacity: 0 }} 
              transition={{ type: "spring", damping: 25, stiffness: 350 }} 
              className="bg-[#faf8f5] border-3 border-accent rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl relative overflow-hidden" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
              <div className="w-36 h-36 rounded-full overflow-hidden mx-auto mb-4 border-3 border-primary shadow-lg">
                {zoomedCandidate.photo ? (
                  <CachedImage src={zoomedCandidate.photo} alt={zoomedCandidate.name} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${getGradient(zoomedCandidate.name)} flex items-center justify-center text-white text-2xl font-bold`}>
                    {getInitials(zoomedCandidate.name)}
                  </div>
                )}
              </div>
              <h3 className="text-lg font-bold text-[#1c1105] font-serif leading-tight">{zoomedCandidate.name}</h3>
              
              {zoomedCandidate.classLevel && (
                <Badge variant="outline" className="text-[9px] font-bold border-[#e8dfcf] text-[#60523e] bg-[#faf8f5] mt-2 py-0 px-2">
                  {zoomedCandidate.classLevel}{zoomedCandidate.stream ? ` - ${zoomedCandidate.stream}` : ""}
                </Badge>
              )}
              <button 
                onClick={() => setZoomedCandidate(null)} 
                className="mt-6 w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-95 transition-opacity text-xs cursor-pointer"
              >
                Close Detail
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </ElectionGuard>
  );
};

export default VotePage;
