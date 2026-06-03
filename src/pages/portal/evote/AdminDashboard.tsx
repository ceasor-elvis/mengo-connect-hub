import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Users, Vote, Activity, Trophy, TrendingUp,
  CalendarClock, Timer,
  ToggleLeft, ToggleRight, Layers, Pause, Play, Square,
  RotateCcw, Calendar,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useStoreSync, useCountdown, useElectionSocket } from "@/hooks/useApi";
import AdminLayout from "@/components/AdminLayout";
import type { Category, Candidate } from "@/data/api";
import {
  setElectionState, setElectionSchedule, setCandidateTimer,
  updateVotingType, getElectionStatus, fetchVotingTypes, fetchCategories, fetchCandidates, fetchVotingCodes
} from "@/data/api";
import CachedImage from "@/components/CachedImage";
import {
  setElectionState as setElectionStateLocal,
  setVoteConfirmEnabled as setVoteConfirmEnabledLocal,
  setCandidateTimer as setCandidateTimerLocal,
  setElectionSchedule as setElectionScheduleLocal,
  updateVotingType as updateVotingTypeLocal,
} from "@/data/appStore";
import { useEffect } from "react";
import { getVotesCast, getTurnout, getVotesCastByType } from "@/data/appStore";

import { toast } from "sonner";

const AdminDashboard = () => {
  const { isAuthed, isFullAdmin } = useAdminAuth();
  const store = useStoreSync();
  const timeLeft = useCountdown(store.endTime);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [votingStartTime, setVotingStartTime] = useState(store.startTime.slice(0, 16));
  const [votingEndTime, setVotingEndTime] = useState(store.endTime.slice(0, 16));

  // Real-time WebSocket updates (auto-reconnects)
  useElectionSocket((msg) => {
    console.log("[ws] Dashboard event:", msg.type, msg.data);
    switch (msg.type) {
      case "election_state_changed":
        if (msg.data?.state) setElectionStateLocal(msg.data.state);
        if (msg.data?.candidate_timer_minutes != null) setCandidateTimerLocal(msg.data.candidate_timer_minutes);
        if (msg.data?.vote_confirm_enabled != null) setVoteConfirmEnabledLocal(msg.data.vote_confirm_enabled);
        break;
      case "schedule_updated":
        if (msg.data?.start_time && msg.data?.end_time) setElectionScheduleLocal(msg.data.start_time, msg.data.end_time);
        break;
      case "voting_type_updated":
        if (msg.data?.id) updateVotingTypeLocal(msg.data.id, {
          active: msg.data.active,
          confirmPageEnabled: msg.data.confirm_page_enabled,
          name: msg.data.name,
        });
        break;
      case "vote_cast":
      case "code_used":
        // Refetch to get latest counts
        fetchVotingCodes().catch(() => {});
        fetchCandidates().catch(() => {});
        break;
    }
  });

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          getElectionStatus(),
          fetchVotingTypes(),
          fetchCategories(),
          fetchCandidates(),
          fetchVotingCodes(),
        ]);
      } catch (err: any) {
        toast.error("Failed to load dashboard data");
      }
    };
    init();
  }, []);

  const votesCast = getVotesCast();
  const turnout = getTurnout();

  if (!isAuthed) return null;

  const statusLabel = store.state === "live" ? "Live" : store.state === "scheduled" ? "Scheduled" : store.state === "paused" ? "Paused" : "Ended";

  const statCards = [
    {
      label: "Total Codes",
      value: store.votingCodes.length,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-50 dark:bg-blue-500/10",
      borderColor: "border-blue-200 dark:border-blue-500/20",
    },
    {
      label: "Votes Cast",
      value: votesCast,
      icon: Vote,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-50 dark:bg-emerald-500/10",
      borderColor: "border-emerald-200 dark:border-emerald-500/20",
    },
    {
      label: "Turnout",
      value: `${turnout}%`,
      icon: TrendingUp,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-50 dark:bg-amber-500/10",
      borderColor: "border-amber-200 dark:border-amber-500/20",
    },
    {
      label: "Active Types",
      value: store.votingTypes.filter((v) => v.active).length,
      icon: Layers,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-50 dark:bg-indigo-500/10",
      borderColor: "border-indigo-200 dark:border-indigo-500/20",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  const formatTime = (dt: string) => {
    const d = new Date(dt);
    return d.toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" });
  };

  const handleToggleActive = async (vtId: string, currentActive: boolean) => {
    try {
      await updateVotingType(vtId, { active: !currentActive });
      toast.success(`Voting type ${!currentActive ? "activated" : "deactivated"} successfully`);
    } catch (err: any) {
      toast.error(`Failed to update voting type: ${err.message || "Unknown error"}`);
    }
  };

  const handleToggleConfirm = async (vtId: string, currentConfirm: boolean) => {
    try {
      await updateVotingType(vtId, { confirmPageEnabled: !currentConfirm });
      toast.success(`ID verification ${!currentConfirm ? "enabled" : "disabled"} successfully`);
    } catch (err: any) {
      toast.error(`Failed to update verification: ${err.message || "Unknown error"}`);
    }
  };

  const handleSetElectionState = async (newState: "live" | "paused" | "ended") => {
    try {
      await setElectionState(newState);
      const labels = { live: "resumed", paused: "paused", ended: "ended" };
      toast.success(`Election ${labels[newState]} successfully`);
    } catch (err: any) {
      toast.error(`Failed to change election state: ${err.message || "Unknown error"}`);
    }
  };

  const handleSaveSchedule = async () => {
    try {
      await setElectionSchedule(new Date(votingStartTime).toISOString(), new Date(votingEndTime).toISOString());
      setShowTimeModal(false);
      toast.success("Voting schedule updated successfully");
    } catch (err: any) {
      toast.error(`Failed to update schedule: ${err.message || "Unknown error"}`);
    }
  };

  const scheduleActions = isFullAdmin ? (
    <button
      onClick={() => setShowTimeModal(true)}
      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
      title="Voting Schedule"
    >
      <CalendarClock className="w-4 h-4" />
    </button>
  ) : null;

  // Status pill config
  const statusConfig = {
    live: { label: "Live", dot: "bg-emerald-500", pill: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20", ping: true },
    scheduled: { label: "Scheduled", dot: "bg-blue-500", pill: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20", ping: false },
    paused: { label: "Paused", dot: "bg-amber-500", pill: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20", ping: false },
    ended: { label: "Ended", dot: "bg-rose-500", pill: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20", ping: false },
  };
  const sc = statusConfig[store.state as keyof typeof statusConfig] || statusConfig.ended;

  return (
    <AdminLayout title="Dashboard" subtitle={isFullAdmin ? "Full Admin" : "View Only"} headerActions={scheduleActions}>
      <div className="w-full space-y-6">

        {/* ── Stat Cards ── */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {statCards.map((stat) => (
            <motion.div
              key={stat.label}
              variants={itemVariants}
              className={`bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 border-b-4 ${stat.borderColor}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1">
                {stat.value}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Election Controls Bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}
          className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl px-6 py-4 flex flex-wrap items-center justify-between gap-4"
        >
          {/* Left: status + schedule + countdown */}
          <div className="flex flex-wrap items-center gap-4 min-w-0">
            {/* Status pill */}
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide ${sc.pill}`}>
              <span className="relative flex h-2 w-2">
                {sc.ping && (
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${sc.dot} opacity-60`} />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${sc.dot}`} />
              </span>
              {sc.label}
            </span>

            {/* Schedule */}
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <CalendarClock className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="font-semibold">{formatTime(store.startTime)}</span>
              <span className="text-slate-400">→</span>
              <span className="font-semibold">{formatTime(store.endTime)}</span>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <Timer className="w-4 h-4 text-slate-400" />
              <span className="font-mono font-bold text-sm text-slate-700 dark:text-slate-300">{timeLeft} left</span>
            </div>
          </div>

          {/* Right: control buttons */}
          {isFullAdmin && (
            <div className="flex items-center gap-2">
              {store.state !== "ended" && (
                <button
                  onClick={() => handleSetElectionState(store.state === "live" ? "paused" : "live")}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                    store.state === "live"
                      ? "bg-white dark:bg-slate-950 text-amber-600 border-amber-200 dark:border-amber-500/30 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                      : "bg-white dark:bg-slate-950 text-emerald-600 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                  }`}
                >
                  {store.state === "live" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {store.state === "live" ? "Pause" : store.state === "scheduled" ? "Force Start" : "Resume"}
                </button>
              )}
              <button
                onClick={() => handleSetElectionState(store.state === "ended" ? "live" : "ended")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                  store.state === "ended"
                    ? "bg-white dark:bg-slate-950 text-emerald-600 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                    : "bg-white dark:bg-slate-950 text-rose-600 border-rose-200 dark:border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                }`}
              >
                {store.state === "ended" ? <RotateCcw className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {store.state === "ended" ? "Restart" : "End"}
              </button>
              <button
                onClick={() => setShowTimeModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all bg-white dark:bg-slate-950"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
            </div>
          )}
        </motion.div>

        {/* ── Voting Types Panel (full admin only) ── */}
        {isFullAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.45 }}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-none">Election Types</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Manage active voting categories</p>
              </div>
            </div>
            <div className="space-y-3">
              {store.votingTypes.map((vt) => (
                <div
                  key={vt.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-colors"
                >
                  {/* Left: icon + name + description */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
                      <Vote className="w-5 h-5 text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{vt.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{vt.description}</p>
                    </div>
                  </div>

                  {/* Right: toggle pills */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    {/* Active toggle */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Active</span>
                      <button
                        onClick={() => handleToggleActive(vt.id, vt.active)}
                        className="flex items-center gap-1"
                      >
                        {vt.active ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <ToggleRight className="w-6 h-6" />
                            <span className="text-xs font-bold">ON</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                            <ToggleLeft className="w-6 h-6" />
                            <span className="text-xs font-bold">OFF</span>
                          </div>
                        )}
                      </button>
                    </div>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

                    {/* ID Verify toggle */}
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">ID Verify</span>
                      <button
                        onClick={() => handleToggleConfirm(vt.id, vt.confirmPageEnabled)}
                        className="flex items-center gap-1"
                      >
                        {vt.confirmPageEnabled ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <ToggleRight className="w-6 h-6" />
                            <span className="text-xs font-bold">ON</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                            <ToggleLeft className="w-6 h-6" />
                            <span className="text-xs font-bold">OFF</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Live Rankings ── */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Live Rankings</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider font-semibold">Real-time vote counts</p>
            </div>
          </div>

          {store.votingTypes.filter((vt) => vt.active).map((vt) => {
            const vtCategories = store.categories.filter((c) => c.votingTypeId === vt.id);
            const vtVotes = getVotesCastByType(vt.id);
            if (vtCategories.length === 0) return null;

            // Detect councillor type (has gendered categories)
            const isCouncillor = vtCategories.some(
              (c) => c.gender === "male" || c.gender === "female"
            );

            return (
              <div key={vt.id} className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                    <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{vt.name}</h3>
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                    {vtVotes} votes
                  </span>
                </div>

                {isCouncillor ? (
                  // ── Councillor: group by class+stream, show top boy & top girl ──
                  <DashboardCouncillorRankings
                    categories={vtCategories}
                    candidates={store.candidates}
                    itemVariants={itemVariants}
                  />
                ) : (
                  // ── Regular: one card per category ──
                  <motion.div className="grid gap-5 lg:grid-cols-2" variants={containerVariants} initial="hidden" animate="show">
                    {vtCategories.map((category) => {
                      const catCandidates = store.candidates
                        .filter((c) => c.categoryId === category.id)
                        .sort((a, b) => b.votes - a.votes)
                        .slice(0, 5);
                      const maxVotes = catCandidates[0]?.votes || 1;
                      const totalCatVotes = catCandidates.reduce((s, c) => s + c.votes, 0);

                      return (
                        <motion.div key={category.id} variants={itemVariants} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden flex flex-col">
                          {/* Header band */}
                          <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">{category.name}</h3>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              {totalCatVotes} votes
                            </span>
                          </div>
                          <div className="p-5 space-y-4 flex-1">
                            {catCandidates.length === 0 && (
                              <p className="text-sm text-slate-500 text-center py-4">No candidates yet</p>
                            )}
                            {catCandidates.map((candidate, i) => {
                              const pct = totalCatVotes > 0 ? Math.round((candidate.votes / totalCatVotes) * 100) : 0;
                              const barWidth = maxVotes > 0 ? (candidate.votes / maxVotes) * 100 : 0;
                              const isWinner = i === 0 && totalCatVotes > 0;
                              return (
                                <div key={candidate.id}>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                        {candidate.photo ? (
                                          <CachedImage src={candidate.photo} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${
                                            isWinner ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "text-slate-500"
                                          }`}>{i + 1}</div>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        {isWinner && <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                                        <span className={`text-sm font-semibold ${isWinner ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                                          {candidate.name}
                                        </span>
                                      </div>
                                    </div>
                                    <span className="text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
                                      {candidate.votes} <span className="text-slate-500 font-medium">({pct}%)</span>
                                    </span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${barWidth}%` }}
                                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                                      className={`h-full rounded-full ${isWinner ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Voting Time Modal ── */}
      <AnimatePresence>
        {showTimeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
            onClick={() => setShowTimeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-2xl max-w-sm w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CalendarClock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-none">Voting Schedule</h3>
                  <p className="text-xs text-slate-500 mt-1">Set when voting opens and closes</p>
                </div>
              </div>
              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={votingStartTime}
                    onChange={(e) => setVotingStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={votingEndTime}
                    onChange={(e) => setVotingEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowTimeModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSchedule}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-sm transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default AdminDashboard;

// ── Councillor live-rankings sub-component ───────────────────────────────────

interface DashboardCouncillorRankingsProps {
  categories: Category[];
  candidates: Candidate[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemVariants: any;
}

function DashboardCouncillorRankings({ categories, candidates, itemVariants }: DashboardCouncillorRankingsProps) {
  const maleCat = categories.find((c) => c.gender === "male");
  const femaleCat = categories.find((c) => c.gender === "female");
  const catIds = categories.map((c) => c.id);

  // Build unique class+stream pairs from all candidates in these categories
  const seen = new Set<string>();
  const groups: { classLevel: string; stream: string }[] = [];
  candidates
    .filter((c) => catIds.includes(c.categoryId))
    .forEach((c) => {
      const key = `${c.classLevel ?? ""}|${c.stream ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        groups.push({ classLevel: c.classLevel ?? "", stream: c.stream ?? "" });
      }
    });
  groups.sort((a, b) => `${a.classLevel}${a.stream}`.localeCompare(`${b.classLevel}${b.stream}`));

  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-8 text-center text-slate-500 text-sm">
        No councillor candidates registered yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {groups.map((g) => {
        const label = `${g.classLevel}${g.stream ? ` - ${g.stream}` : ""}`;

        const top3Boys = maleCat
          ? candidates
              .filter((c) => c.categoryId === maleCat.id && c.classLevel === g.classLevel && c.stream === g.stream)
              .sort((a, b) => b.votes - a.votes)
              .slice(0, 3)
          : [];
        const top3Girls = femaleCat
          ? candidates
              .filter((c) => c.categoryId === femaleCat.id && c.classLevel === g.classLevel && c.stream === g.stream)
              .sort((a, b) => b.votes - a.votes)
              .slice(0, 3)
          : [];

        const boysTotal = top3Boys.reduce((s, c) => s + c.votes, 0);
        const girlsTotal = top3Girls.reduce((s, c) => s + c.votes, 0);

        return (
          <motion.div key={`${g.classLevel}-${g.stream}`} variants={itemVariants} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">{label} Councillors</h3>
            </div>
            <div className={`grid divide-slate-200 dark:divide-slate-800 ${top3Boys.length > 0 && top3Girls.length > 0 ? "grid-cols-2 divide-x" : ""}`}>
              {/* Boys — only shown if candidates exist */}
              {top3Boys.length > 0 && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 pb-1 border-b border-slate-100 dark:border-slate-800">Boy</p>
                {top3Boys.map((c, i) => {
                  const pct = boysTotal > 0 ? Math.round((c.votes / boysTotal) * 100) : 0;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 inline-flex items-center justify-center rounded-full text-[9px] font-bold ${i === 0 && boysTotal > 0 ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{i + 1}</span>
                          <span className={`text-xs font-semibold truncate ${i === 0 ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>{c.name}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className={`h-full rounded-full ${i === 0 ? "bg-blue-500" : "bg-blue-300 dark:bg-blue-600"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
              {/* Girls — only shown if candidates exist */}
              {top3Girls.length > 0 && (
              <div className="p-4 space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400 pb-1 border-b border-slate-100 dark:border-slate-800">Girl</p>
                {top3Girls.map((c, i) => {
                  const pct = girlsTotal > 0 ? Math.round((c.votes / girlsTotal) * 100) : 0;
                  return (
                    <div key={c.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-4 h-4 inline-flex items-center justify-center rounded-full text-[9px] font-bold ${i === 0 && girlsTotal > 0 ? "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>{i + 1}</span>
                          <span className={`text-xs font-semibold truncate ${i === 0 ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-300"}`}>{c.name}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 tabular-nums">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6 }} className={`h-full rounded-full ${i === 0 ? "bg-pink-500" : "bg-pink-300 dark:bg-pink-600"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
