import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import {
  Printer, Trophy, BarChart3, Calendar, Layers, Users,
  TrendingUp, Vote, Hash, Clock, PieChart, Award,
} from "lucide-react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useStoreSync } from "@/hooks/useApi";
import { getVotesCast, getTurnout, getVotesCastByType, getCodeStatsByClass } from "@/data/appStore";
import { fetchVotingTypes, fetchCategories, fetchCandidates, getElectionStatus, fetchVotingCodes } from "@/data/api";
import AdminLayout from "@/components/AdminLayout";
import type { Category, Candidate } from "@/data/api";

// ── Helpers ───────────────────────────────────────────────────────────────────

function isCouncillorType(votingTypeId: string, categories: Category[]) {
  return categories.some(
    (c) => c.votingTypeId === votingTypeId && (c.gender === "male" || c.gender === "female")
  );
}

function classStreamGroups(catIds: string[], candidates: Candidate[]) {
  const seen = new Set<string>();
  const pairs: { classLevel: string; stream: string }[] = [];
  candidates
    .filter((c) => catIds.includes(c.categoryId))
    .forEach((c) => {
      const key = `${c.classLevel ?? ""}|${c.stream ?? ""}`;
      if (!seen.has(key)) {
        seen.add(key);
        pairs.push({ classLevel: c.classLevel ?? "", stream: c.stream ?? "" });
      }
    });
  return pairs.sort((a, b) =>
    `${a.classLevel}${a.stream}`.localeCompare(`${b.classLevel}${b.stream}`)
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

const AdminReports = () => {
  const { isAuthed } = useAdminAuth();
  const store = useStoreSync();
  const votesCast = getVotesCast();
  const turnout = getTurnout();
  const codeStats = getCodeStatsByClass();
  const [selectedVtId, setSelectedVtId] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"results" | "stats">("results");
  const printRef = useRef<HTMLDivElement>(null);

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
        console.error("Failed to load reports data:", err);
      }
    };
    init();
  }, []);

  if (!isAuthed) return null;

  const activeTypes = store.votingTypes.filter((vt) => vt.active);
  const selectedType = activeTypes.find((vt) => vt.id === selectedVtId);
  const displayOrgName = selectedType?.orgName || activeTypes[0]?.orgName;
  const displayMotto = selectedType?.motto || activeTypes[0]?.motto;
  const totalCodes = store.votingCodes.length;
  const usedCodes = store.votingCodes.filter((c) => c.used).length;

  const handlePrint = () => window.print();

  const reportActions = (
    <button
      onClick={handlePrint}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-sm"
    >
      <Printer className="w-4 h-4" /> Print Report
    </button>
  );

  return (
    <AdminLayout title="Reports" subtitle="Results & analytics" headerActions={reportActions}>
      {/* Tab switcher */}
      <div className="mb-6 print:hidden">
        <div className="flex gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-sm w-fit">
          {(["results", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === tab ? "text-primary" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {activeTab === tab && (
                <motion.div
                  layoutId="reportTab"
                  className="absolute inset-0 bg-primary/10 rounded-lg"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab === "results" ? <Trophy className="w-4 h-4" /> : <PieChart className="w-4 h-4" />}
                {tab === "results" ? "Election Results" : "Session Stats"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Printable area */}
      <div ref={printRef} id="printable-report" className="print:py-0 print:px-0 print:max-w-full">

        {/* ═══ RESULTS TAB ═══ */}
        {(activeTab === "results" || true) && (
          <div className={activeTab !== "results" ? "hidden print:block" : ""}>

            {/* Report header */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl px-6 py-8 mb-6 print:shadow-none print:border">
              <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 mb-4">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                  {displayOrgName?.trim() ? displayOrgName : "Election Results Report"}
                </h2>
                {selectedType && (
                  <p className="text-sm font-bold text-primary uppercase tracking-widest mb-6">{selectedType.name}</p>
                )}
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  {[
                    { icon: Calendar, label: new Date().toLocaleDateString("en-UG") },
                    { icon: Vote, label: `${votesCast} votes cast` },
                    { icon: TrendingUp, label: `${turnout}% turnout` },
                  ].map(({ icon: Icon, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg">
                      <Icon className="w-3.5 h-3.5 text-slate-400" /> {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Voting type filter pills */}
            {activeTypes.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-6 print:hidden">
                {[{ id: "all", name: "All Types" }, ...activeTypes].map((vt) => (
                  <button
                    key={vt.id}
                    onClick={() => setSelectedVtId(vt.id)}
                    className={`relative px-4 py-2 rounded-lg text-sm font-semibold transition-all border ${
                      selectedVtId === vt.id 
                        ? "bg-primary text-white border-primary" 
                        : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                  >
                    <span className="relative z-10">{vt.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Results cards */}
            <AnimatePresence mode="wait">
              {activeTypes
                .filter((vt) => selectedVtId === "all" || vt.id === selectedVtId)
                .map((vt) => {
                  const vtCategories = store.categories.filter((c) => c.votingTypeId === vt.id);
                  if (vtCategories.length === 0) return null;
                  const isCouncillor = isCouncillorType(vt.id, store.categories);
                  const vtVotes = getVotesCastByType(vt.id);

                  return (
                    <div key={vt.id} className="mb-8 print:break-inside-avoid">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-1 h-6 rounded-full bg-primary flex-shrink-0" />
                        <div>
                          <h2 className="text-base font-bold text-slate-900 dark:text-white">{vt.name}</h2>
                          <p className="text-xs text-slate-500">{vtVotes} votes cast</p>
                        </div>
                      </div>

                      {isCouncillor ? (
                        <CouncillorResults categories={vtCategories} candidates={store.candidates} />
                      ) : (
                        <div className="grid gap-5 lg:grid-cols-2">
                          {vtCategories.map((category, ci) => {
                            const catCandidates = store.candidates
                              .filter((c) => c.categoryId === category.id)
                              .sort((a, b) => b.votes - a.votes);
                            const totalCatVotes = catCandidates.reduce((s, c) => s + c.votes, 0);
                            const winner = catCandidates[0];
                            const maxVotes = winner?.votes || 1;

                            return (
                              <motion.div
                                key={category.id}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: ci * 0.04 }}
                                className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden print:shadow-none print:border print:break-inside-avoid"
                              >
                                {/* Header band */}
                                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center justify-between">
                                  <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider">{category.name}</h3>
                                  <span className="text-xs text-slate-500 font-bold bg-slate-200/50 dark:bg-slate-800 px-2 py-0.5 rounded-md tabular-nums">{totalCatVotes} votes</span>
                                </div>

                                {/* Winner highlight */}
                                {winner && totalCatVotes > 0 && (
                                  <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-500/5 border-b border-amber-100 dark:border-amber-500/10 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                                      <Trophy className="w-4 h-4" />
                                    </div>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{winner.name}</span>
                                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-auto tabular-nums shrink-0 bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded-md">
                                      {winner.votes} ({totalCatVotes > 0 ? Math.round((winner.votes / totalCatVotes) * 100) : 0}%)
                                    </span>
                                  </div>
                                )}

                                {/* Candidate bars */}
                                <div className="p-5 space-y-4">
                                  {catCandidates.length === 0 && (
                                    <p className="text-sm text-slate-500 text-center py-4 italic">No candidates yet</p>
                                  )}
                                  {catCandidates.map((cand, i) => {
                                    const pct = totalCatVotes > 0 ? Math.round((cand.votes / totalCatVotes) * 100) : 0;
                                    const barW = maxVotes > 0 ? (cand.votes / maxVotes) * 100 : 0;
                                    const isWinner = i === 0 && totalCatVotes > 0;
                                    return (
                                      <div key={cand.id}>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 inline-flex items-center justify-center rounded-md text-[10px] font-bold flex-shrink-0 ${
                                              isWinner ? "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                            }`}>{i + 1}</span>
                                            <span className={`text-sm font-semibold ${isWinner ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
                                              {cand.name}
                                            </span>
                                          </div>
                                          <span className="text-xs text-slate-700 dark:text-slate-300 tabular-nums font-medium">
                                            {cand.votes} <span className="text-slate-400">({pct}%)</span>
                                          </span>
                                        </div>
                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden print:h-1.5">
                                          <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${barW}%` }}
                                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: i * 0.05 }}
                                            className={`h-full rounded-full ${isWinner ? "bg-amber-500" : "bg-slate-300 dark:bg-slate-600"}`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </AnimatePresence>
          </div>
        )}

        {/* ═══ STATS TAB ═══ */}
        {(activeTab === "stats" || true) && (
          <div className={activeTab !== "stats" ? "hidden print:block" : ""}>
            <div className="print:mt-8 print:border-t print:border-slate-300 print:pt-6">
              <div className="flex items-center gap-2 mb-6 print:hidden">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <PieChart className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Voting Session Statistics</h2>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Hash} label="Total Codes" value={totalCodes} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" border="border-blue-100 dark:border-blue-500/20" />
                <StatCard icon={Vote} label="Votes Cast" value={usedCodes} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" border="border-emerald-100 dark:border-emerald-500/20" />
                <StatCard icon={TrendingUp} label="Turnout" value={`${turnout}%`} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-500/10" border="border-amber-100 dark:border-amber-500/20" />
                <StatCard icon={Layers} label="Active Types" value={activeTypes.length} color="text-purple-600 dark:text-purple-400" bg="bg-purple-50 dark:bg-purple-500/10" border="border-purple-100 dark:border-purple-500/20" />
              </div>

              {/* Votes by election type */}
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden mb-6 print:shadow-none print:border">
                <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Votes by Election Type</h3>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeTypes.map((vt) => {
                    const vtTotal = store.votingCodes.filter((c) => c.votingTypeId === vt.id).length;
                    const vtUsed = store.votingCodes.filter((c) => c.votingTypeId === vt.id && c.used).length;
                    const vtPct = vtTotal > 0 ? Math.round((vtUsed / vtTotal) * 100) : 0;
                    return (
                      <div key={vt.id} className="px-5 py-4 flex items-center gap-4">
                        <Layers className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white flex-1">{vt.name}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${vtPct}%` }}
                              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full bg-primary"
                            />
                          </div>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-medium tabular-nums w-24 text-right">
                            {vtUsed}/{vtTotal} ({vtPct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {activeTypes.length === 0 && (
                    <p className="px-5 py-6 text-sm text-slate-500 text-center italic">No active election types</p>
                  )}
                </div>
              </div>

              {/* Turnout by class & stream */}
              {codeStats.length > 0 && (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden print:shadow-none print:border">
                  <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Turnout by Class & Stream</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                          <th className="px-5 py-3 font-semibold">Class</th>
                          <th className="px-5 py-3 font-semibold">Stream</th>
                          <th className="px-5 py-3 font-semibold text-right">Total</th>
                          <th className="px-5 py-3 font-semibold text-right">Used</th>
                          <th className="px-5 py-3 font-semibold text-right">Turnout</th>
                          <th className="px-5 py-3 font-semibold w-32"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {codeStats
                          .sort((a, b) => `${a.className}${a.stream}`.localeCompare(`${b.className}${b.stream}`))
                          .map((row) => {
                            const pct = row.total > 0 ? Math.round((row.used / row.total) * 100) : 0;
                            const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
                            return (
                              <tr key={`${row.className}-${row.stream}`} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                <td className="px-5 py-3 font-bold text-slate-900 dark:text-white">{row.className}</td>
                                <td className="px-5 py-3 text-slate-600 dark:text-slate-400 font-medium">{row.stream}</td>
                                <td className="px-5 py-3 text-right tabular-nums text-slate-600 dark:text-slate-300">{row.total}</td>
                                <td className="px-5 py-3 text-right tabular-nums font-semibold text-slate-900 dark:text-white">{row.used}</td>
                                <td className={`px-5 py-3 text-right tabular-nums font-bold ${pct >= 80 ? "text-emerald-600 dark:text-emerald-400" : pct >= 50 ? "text-amber-600 dark:text-amber-400" : "text-rose-600 dark:text-rose-400"}`}>{pct}%</td>
                                <td className="px-5 py-3">
                                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${pct}%` }}
                                      transition={{ duration: 0.6 }}
                                      className={`h-full rounded-full ${barColor}`}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Session timing info */}
              <div className="mt-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5 print:shadow-none print:border">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-slate-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Session Info</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-5 py-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</p>
                    <p className={`font-bold capitalize ${
                      store.state === "live" ? "text-emerald-600 dark:text-emerald-400" :
                      store.state === "paused" ? "text-amber-600 dark:text-amber-400" : "text-slate-600 dark:text-slate-400"
                    }`}>
                      {store.state === "live" ? "🟢 " : store.state === "paused" ? "⏸️ " : "⏹️ "}{store.state}
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-5 py-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Start Time</p>
                    <p className="font-bold text-slate-900 dark:text-white">{new Date(store.startTime).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 rounded-xl px-5 py-4 border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">End Time</p>
                    <p className="font-bold text-slate-900 dark:text-white">{new Date(store.endTime).toLocaleString("en-UG", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center print:mt-6 print:border-t print:border-slate-300 print:pt-4">
          {displayMotto?.trim() && (
            <p className="font-medium text-slate-600 dark:text-slate-400 italic mb-2 text-sm">&ldquo;{displayMotto}&rdquo;</p>
          )}
          <p className="text-xs text-slate-500">Report generated on {new Date().toLocaleDateString("en-UG")} &bull; MSS Election System</p>
        </div>
      </div>
    </AdminLayout>
  );
};

// ── StatCard ──────────────────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color, bg, border }: {
  icon: any; label: string; value: string | number; color: string; bg: string; border: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-950 border ${border} shadow-sm rounded-xl p-5 print:shadow-none print:border-slate-300`}>
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <p className="text-3xl font-black text-slate-900 dark:text-white tabular-nums leading-none mb-1.5">{value}</p>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</p>
    </div>
  );
}

// ── CouncillorResults ─────────────────────────────────────────────────────────

function CouncillorResults({ categories, candidates }: { categories: Category[]; candidates: Candidate[] }) {
  const maleCat = categories.find((c) => c.gender === "male");
  const femaleCat = categories.find((c) => c.gender === "female");
  const catIds = categories.map((c) => c.id);
  const groups = classStreamGroups(catIds, candidates);

  if (groups.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
        No councillor candidates registered yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {groups.map((g, gi) => {
        const label = `${g.classLevel}${g.stream ? ` - ${g.stream}` : ""}`;

        const boysCands = maleCat
          ? candidates.filter((c) => c.categoryId === maleCat.id && c.classLevel === g.classLevel && c.stream === g.stream).sort((a, b) => b.votes - a.votes)
          : [];
        const girlsCands = femaleCat
          ? candidates.filter((c) => c.categoryId === femaleCat.id && c.classLevel === g.classLevel && c.stream === g.stream).sort((a, b) => b.votes - a.votes)
          : [];

        const boysTotal = boysCands.reduce((s, c) => s + c.votes, 0);
        const girlsTotal = girlsCands.reduce((s, c) => s + c.votes, 0);
        const boyWinner = boysCands[0];
        const girlWinner = girlsCands[0];

        return (
          <motion.div
            key={`${g.classLevel}-${g.stream}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: gi * 0.04 }}
            className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl overflow-hidden print:shadow-none print:border print:break-inside-avoid"
          >
            <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3.5 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{label} Councillors</h3>
            </div>

            {(boyWinner || girlWinner) && (boysTotal > 0 || girlsTotal > 0) && (
              <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-500/5 border-b border-amber-100 dark:border-amber-500/10 flex flex-wrap gap-4">
                {boyWinner && boysTotal > 0 && (
                  <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded-md">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Boy: {boyWinner.name}</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-1">{boyWinner.votes}v ({Math.round((boyWinner.votes / boysTotal) * 100)}%)</span>
                  </div>
                )}
                {girlWinner && girlsTotal > 0 && (
                  <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-500/20 px-2 py-1 rounded-md">
                    <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Girl: {girlWinner.name}</span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 ml-1">{girlWinner.votes}v ({Math.round((girlWinner.votes / girlsTotal) * 100)}%)</span>
                  </div>
                )}
              </div>
            )}

            <div className={`grid divide-slate-100 dark:divide-slate-800 ${boysCands.length > 0 && girlsCands.length > 0 ? "sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x" : ""}`}>
              {boysCands.length > 0 && (
                <CandidateList label="Boy Councillor" candidates={boysCands} total={boysTotal} accentClass="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400" />
              )}
              {girlsCands.length > 0 && (
                <CandidateList label="Girl Councillor" candidates={girlsCands} total={girlsTotal} accentClass="bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-400" />
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── CandidateList ─────────────────────────────────────────────────────────────

function CandidateList({ label, candidates, total, accentClass }: {
  label: string; candidates: Candidate[]; total: number; accentClass: string;
}) {
  return (
    <div className="p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">{label}</p>
      {candidates.length === 0 ? (
        <p className="text-sm text-slate-500 italic">No candidates</p>
      ) : (
        <div className="space-y-2">
          {candidates.map((cand, i) => {
            const pct = total > 0 ? Math.round((cand.votes / total) * 100) : 0;
            return (
              <div key={cand.id} className="flex items-center justify-between py-1.5 border-t border-slate-100 dark:border-slate-800 first:border-0">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 inline-flex items-center justify-center rounded-md text-[10px] font-bold flex-shrink-0 ${
                    i === 0 && total > 0 ? accentClass : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>{i + 1}</span>
                  <span className={`text-sm font-semibold ${i === 0 && total > 0 ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>{cand.name}</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums ml-3 shrink-0 font-medium">
                  {cand.votes} <span className="text-slate-400">({pct}%)</span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AdminReports;
