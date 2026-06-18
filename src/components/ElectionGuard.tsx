import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldX, Clock, UserX, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/hooks/useAppStore";
import { hasCodeBeenUsed } from "@/data/appStore";
import { toast } from "sonner";
import { useCountdown } from "@/hooks/useApi";

interface ElectionGuardProps {
  children: ReactNode;
  votingCode?: string;
}

type BlockReason = "ended" | "paused" | "already_voted" | "not_started" | null;

const ElectionGuard = ({ children, votingCode }: ElectionGuardProps) => {
  const store = useAppStore();
  const navigate = useNavigate();
  const [blockReason, setBlockReason] = useState<BlockReason>(null);
  const prevStateRef = useRef<string | null>(null);
  const timeLeft = useCountdown(store.startTime);

  // Show toast when election state changes mid-session
  useEffect(() => {
    const prev = prevStateRef.current;
    const curr = store.state;
    if (prev !== null && prev !== curr) {
      if (curr === "paused") {
        toast.warning("⏸ Election Paused", {
          description: "The administrator has paused the election. Please wait.",
          duration: 6000,
        });
      } else if (curr === "ended") {
        toast.error("🔒 Election Ended", {
          description: "The voting period has closed.",
          duration: 6000,
        });
      } else if (curr === "live") {
        toast.success("▶ Election Resumed", {
          description: "Voting is now live. You may continue.",
          duration: 4000,
        });
      }
    }
    prevStateRef.current = curr;
  }, [store.state]);

  useEffect(() => {
    const check = () => {
      if (!store.initialFetchDone) return;

      const now = Date.now();
      const end = new Date(store.endTime).getTime();
      const start = new Date(store.startTime).getTime();

      if (store.state === "ended" || now > end) {
        setBlockReason("ended");
        return;
      }
      if (store.state === "paused") {
        setBlockReason("paused");
        return;
      }
      if (store.state === "scheduled" || now < start) {
        setBlockReason("not_started");
        return;
      }
      if (votingCode && hasCodeBeenUsed(votingCode)) {
        setBlockReason("already_voted");
        return;
      }
      setBlockReason(null);
    };

    check();
    const id = setInterval(check, 1000);
    return () => clearInterval(id);
  }, [store.state, store.endTime, store.startTime, store.initialFetchDone, votingCode]);


  const config: Record<string, { icon: ReactNode; title: string; message: string; color: string }> = {
    not_started: {
      icon: <Clock className="w-10 h-10" />,
      title: "Voting Not Started",
      message: "The voting period has not yet begun. Please check the schedule and return at the designated start time.",
      color: "text-primary",
    },
    ended: {
      icon: <Clock className="w-10 h-10" />,
      title: "Voting Has Ended",
      message: "The voting period has closed. No further votes or sign-ins are being accepted. Please contact your school administration for results.",
      color: "text-destructive",
    },
    paused: {
      icon: <ShieldX className="w-10 h-10" />,
      title: "Voting Is Paused",
      message: "The election has been temporarily paused by the administrator. Please wait until voting resumes.",
      color: "text-warning",
    },
    already_voted: {
      icon: <UserX className="w-10 h-10" />,
      title: "Already Voted",
      message: "This voting code has already been used. Each student is allowed only one vote per election type. If you believe this is an error, contact your school administration.",
      color: "text-destructive",
    },
  };

  if (!store.initialFetchDone && !blockReason) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!blockReason) return <>{children}</>;

  const c = config[blockReason];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-elevated rounded-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: "spring" }}
            className={`w-20 h-20 rounded-full bg-muted mx-auto mb-5 flex items-center justify-center ${c.color}`}
          >
            {c.icon}
          </motion.div>

          <div className="flex items-center justify-center gap-2 mb-2">
            <XCircle className={`w-5 h-5 ${c.color}`} />
            <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
          </div>

          <h3 className={`text-lg font-semibold mb-2 ${c.color}`}>{c.title}</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">{c.message}</p>

          {blockReason === "not_started" && (
            <div className="mb-8 p-4 bg-muted/50 rounded-xl border border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Starts In</span>
              <span className="text-3xl font-mono font-bold text-primary tracking-tight">{timeLeft}</span>
            </div>
          )}

          <button
            onClick={() => navigate("/evote")}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Return Home
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ElectionGuard;
