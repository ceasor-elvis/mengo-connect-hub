import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock, Save, Timer, ShieldCheck,
  CheckCircle2, Zap, Plus, Minus,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useStoreSync } from "@/hooks/useApi";
import {
  setCandidateTimer, setVoteConfirmEnabled,
} from "@/data/api";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/AdminLayout";

const AdminTimingPage = () => {
  const { isAuthed, isFullAdmin } = useAdminAuth();
  const store = useStoreSync();
  const [localTimer, setLocalTimer] = useState(store.candidateTimerSeconds);
  const [localConfirm, setLocalConfirm] = useState(store.voteConfirmEnabled);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store.initialFetchDone) {
      setLocalTimer(store.candidateTimerSeconds);
      setLocalConfirm(store.voteConfirmEnabled);
    }
  }, [store.initialFetchDone]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isAuthed || !isFullAdmin) return (
    <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
      <p className="text-slate-500">Access denied. Full admin required.</p>
    </div>
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await setCandidateTimer(localTimer);
      await setVoteConfirmEnabled(localConfirm);
      toast.success("Settings saved successfully!");
    } catch (err: any) {
      toast.error(`Failed to save settings: ${err.message || "Unknown error"}`);
    } finally {
      setSaving(false);
    }
  };

  const adjustTimer = (delta: number) => {
    setLocalTimer((prev) => Math.max(0, prev + delta));
  };

  const timerMins = Math.floor(localTimer / 60);
  const timerSecs = localTimer % 60;

  const saveAction = (
    <button
      onClick={handleSave}
      disabled={saving}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm disabled:opacity-60"
    >
      <Save className="w-4 h-4" />
      {saving ? "Saving…" : "Save Settings"}
    </button>
  );

  return (
    <AdminLayout title="Election Settings" subtitle="Timer & confirmation" headerActions={saveAction}>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Timer Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden"
        >
          {/* Card header band */}
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Timer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Candidate Voting Timer</h3>
              <p className="text-slate-500 text-[11px]">Duration allotted per voting category</p>
            </div>
          </div>

          <div className="px-6 py-6">
            {/* Large MM:SS display */}
            <div className="flex items-center justify-center gap-4 mb-6">
              {/* Minutes */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => adjustTimer(60)}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                    {String(timerMins).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold">min</span>
                </div>
                <button
                  onClick={() => adjustTimer(-60)}
                  disabled={timerMins === 0}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors disabled:opacity-30 text-slate-600 dark:text-slate-400"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>

              <span className="text-3xl font-extrabold text-slate-300 dark:text-slate-700 pb-2">:</span>

              {/* Seconds */}
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => adjustTimer(5)}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors text-slate-600 dark:text-slate-400"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <div className="w-24 h-24 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center shadow-inner">
                  <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums leading-none">
                    {String(timerSecs).padStart(2, "0")}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider mt-1 font-bold">sec</span>
                </div>
                <button
                  onClick={() => adjustTimer(-5)}
                  disabled={localTimer < 5}
                  className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors disabled:opacity-30 text-slate-600 dark:text-slate-400"
                >
                  <Minus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Manual inputs row */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Minutes</label>
                <input
                  type="number" min={0} max={59} value={timerMins}
                  onChange={(e) => {
                    const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    setLocalTimer(m * 60 + timerSecs);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Seconds</label>
                <input
                  type="number" min={0} max={59} value={timerSecs}
                  onChange={(e) => {
                    const s = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                    setLocalTimer(timerMins * 60 + s);
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3">
              <Clock className="w-4 h-4 flex-shrink-0 text-slate-400" />
              <span>
                Currently saved: <strong className="text-slate-900 dark:text-white">
                  {Math.floor(store.candidateTimerSeconds / 60)}m {store.candidateTimerSeconds % 60}s
                </strong> per category.
                {localTimer === 0 && <span className="text-amber-600 dark:text-amber-500 ml-1">· Set to 0 to disable timer</span>}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Vote Confirmation Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden"
        >
          <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Vote Confirmation Dialog</h3>
              <p className="text-slate-500 text-[11px]">Controls the confirm popup after candidate selection</p>
            </div>
          </div>

          <div className="px-6 py-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">
                  {localConfirm ? "Confirmation Enabled" : "Auto-Advance Mode"}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {localConfirm
                    ? "Students must confirm each choice before moving on"
                    : "Selections auto-advance to the next category immediately"}
                </p>
              </div>
              <Switch checked={localConfirm} onCheckedChange={setLocalConfirm} />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={localConfirm ? "on" : "off"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className={`flex items-start gap-3 px-4 py-3.5 rounded-xl text-xs font-medium border ${
                  localConfirm
                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/10 dark:text-blue-400 dark:border-blue-900/30"
                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/10 dark:text-amber-400 dark:border-amber-900/30"
                }`}
              >
                {localConfirm ? (
                  <><CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>Students will see a confirmation popup after clicking a candidate before advancing.</span></>
                ) : (
                  <><Zap className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>Fast mode — students auto-advance on click. Final category auto-submits the ballot.</span></>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Bottom Save row ── */}
        <div className="flex justify-center pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-bold text-sm shadow-sm hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-md transition-all disabled:opacity-60"
          >
            <Save className="w-5 h-5" />
            {saving ? "Saving Settings…" : "Save Timer & Confirmation Settings"}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminTimingPage;
