import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, User, ArrowRight, Award } from "lucide-react";
import type { Student } from "@/data/api";
import { useStoreSync } from "@/hooks/useApi";
import mengoLogo from "@/assets/mengo-logo.png";
import ElectionGuard from "@/components/ElectionGuard";
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

const ConfirmPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStoreSync();
  const { student, votingCode, votingTypeId, classInfo } = (location.state as {
    student: Student;
    votingCode: string;
    votingTypeId: string;
    classInfo?: { classLevel: string; stream: string };
  }) || {};

  if (!student) {
    navigate("/evote");
    return null;
  }

  const votingTypeName = store.votingTypes.find((v) => v.id === votingTypeId)?.name || "";

  return (
    <ElectionGuard votingCode={votingCode}>
    <div className="min-h-screen bg-hero-gradient flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient bubbles */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 rounded-full bg-primary/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Double-bordered Cream Ballot Card */}
        <div className="bg-[#faf8f5] text-[#2c1d11] border-4 border-double border-[#c5a059] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl p-8 text-center relative overflow-hidden">
          {/* Faint Watermark Seal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] select-none">
            <img src={mengoLogo} alt="Mengo Seal" className="w-64 h-64 object-contain" />
          </div>

          <div className="relative z-10">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500 mx-auto mb-4 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)] animate-pulse"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </motion.div>

            <span className="text-[10px] font-bold text-primary tracking-widest uppercase mb-1 block leading-none">
              Identity Verified
            </span>
            <h2 className="text-2xl font-bold font-serif text-[#1c1105] mb-2">Confirm Your Identity</h2>
            <p className="text-xs text-[#60523e] mb-6 leading-relaxed">
              Verify your student credentials before entering the official digital ballot room.
            </p>

            {votingTypeName && (
              <span className="inline-block px-3 py-1 rounded-full bg-accent/25 border border-accent/30 text-primary text-[10px] font-bold uppercase tracking-wider mb-6">
                {votingTypeName} Election
              </span>
            )}

            {/* Glowing Avatar circle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-24 h-24 rounded-full bg-white mx-auto mb-4 flex items-center justify-center overflow-hidden border-3 border-primary shadow-lg relative"
            >
              {student.photo ? (
                <CachedImage src={student.photo} alt={student.name} className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${getGradient(student.name)} flex items-center justify-center text-white text-3xl font-bold`}>
                  {getInitials(student.name)}
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <h3 className="text-lg font-bold text-[#1c1105] leading-tight flex items-center justify-center gap-1.5 font-sans">
                {student.name}
              </h3>
              <p className="text-xs text-[#60523e] font-mono mt-0.5 tracking-wider uppercase font-semibold">
                {student.registrationNumber}
              </p>
              <Badge variant="outline" className="mt-3 border-primary/20 bg-primary/5 text-primary font-bold px-3 py-1 text-xs uppercase">
                {student.className}
              </Badge>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.7 }} 
              className="flex gap-3 pt-4 border-t border-[#e8dfcf]"
            >
              <button
                onClick={() => navigate("/evote")}
                className="px-4 py-3.5 rounded-xl border border-[#e6dfd3] bg-white text-[#60523e] text-xs font-bold hover:bg-[#faf8f5] transition-colors cursor-pointer"
              >
                Not Me
              </button>
              <button
                onClick={() => navigate("/evote/vote", { state: { votingCode, votingTypeId, classInfo, student } })}
                className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-[#500010] border-2 border-accent text-accent font-bold text-xs tracking-widest flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:opacity-95 active:scale-98 transition-all duration-200 cursor-pointer shadow-md uppercase"
              >
                Enter Ballot Room <ArrowRight className="w-4 h-4 text-accent" />
              </button>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
    </ElectionGuard>
  );
};

export default ConfirmPage;
