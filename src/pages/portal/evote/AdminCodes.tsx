import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Download, Trash2, Filter, Hash, CheckCircle2,
  XCircle, RefreshCw, Printer, BarChart3, ChevronDown
} from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useStoreSync, useElectionSocket } from "@/hooks/useApi";
import {
  generateCodes, deleteCodes, getCodeStats,
  isBackendMode, getCodeExportUrl, fetchVotingTypes, fetchVotingCodes,
  type VotingCode, type WsMessage
} from "@/data/api";
import { getCodeStatsByClass } from "@/data/appStore";

import { toast } from "sonner";

type PrintMode = "all" | "unused" | "selected";

function printCoupons(codes: VotingCode[], vtMap: Map<string, string>) {
  if (codes.length === 0) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Print window blocked. Please allow popups for this site.");
    return;
  }

  // Get org name from the first code's voting type
  const firstVtId = codes[0].votingTypeId;
  const orgName = vtMap.get(firstVtId + "_org") || "School E-Voting";

  printWindow.document.write(`
    <html>
    <head>
      <title>Voting Coupons</title>
      <style>
        @page {
          size: A4;
          margin: 10mm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; background: white; color: #1a1a1a; -webkit-print-color-adjust: exact; }
        .grid { 
          display: grid; 
          grid-template-columns: repeat(3, 1fr); 
          gap: 2mm; 
          width: 100%;
        }
        .coupon {
          border: 1px dashed #555;
          border-radius: 6px;
          padding: 8px 6px;
          text-align: center;
          height: 25.5mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          page-break-inside: avoid;
          background: #fff;
          position: relative;
        }
        .coupon-header { border-bottom: 0.5px solid #eee; padding-bottom: 3px; margin-bottom: 2px; }
        .coupon h3 { font-size: 7px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 1px; font-weight: 700; }
        .coupon .school { font-size: 10px; font-weight: 800; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .coupon .meta { display: flex; justify-content: center; gap: 8px; font-size: 8px; color: #475569; margin: 2px 0; font-weight: 500; }
        .coupon .code { 
          font-size: 18px; 
          font-weight: 900; 
          font-family: 'Courier New', Courier, monospace; 
          letter-spacing: 2px; 
          padding: 4px; 
          background: #f8fafc; 
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          color: #020617;
        }
        .coupon .footer { font-size: 7px; color: #94a3b8; margin-top: 2px; font-weight: 500; }
        @media print {
          .grid { gap: 2.5mm; }
        }
      </style>
    </head>
    <body>
      <div class="grid">
        ${codes.map((c) => `
          <div class="coupon">
            <div class="coupon-header">
              <h3>Voting Coupon</h3>
              <div class="school">${orgName}</div>
            </div>
            <div class="meta">
              <span><b>Class:</b> ${c.className}${c.stream}</span>
              <span>•</span>
              <span>${vtMap.get(c.votingTypeId) || ""} Election</span>
            </div>
            <div class="code">${c.code}</div>
            <div class="footer">Enter this code at the voting portal</div>
          </div>
        `).join("")}
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function printStats(stats: { className: string; stream: string; total: number; used: number }[], vtMap: Map<string, string>, activeVtId?: string) {
  if (stats.length === 0) return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Print window blocked. Please allow popups for this site.");
    return;
  }

  const totalCodes = stats.reduce((sum, s) => sum + s.total, 0);
  const usedCodes = stats.reduce((sum, s) => sum + s.used, 0);
  const overallTurnout = totalCodes > 0 ? Math.round((usedCodes / totalCodes) * 100) : 0;

  // Use the active voting type's org name, or fallback to the first available one
  let orgName = "School E-Voting";
  let motto = "";
  
  if (activeVtId && vtMap.get(activeVtId + "_org")) {
    orgName = vtMap.get(activeVtId + "_org")!;
    motto = vtMap.get(activeVtId + "_motto") || "";
  } else {
    const firstOrgKey = Array.from(vtMap.keys()).find(k => k.endsWith("_org") && vtMap.get(k));
    if (firstOrgKey) {
      orgName = vtMap.get(firstOrgKey)!;
      const baseId = firstOrgKey.replace("_org", "");
      motto = vtMap.get(baseId + "_motto") || "";
    }
  }

  printWindow.document.write(`
    <html>
    <head>
      <title>Usage Statistics Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Arial', sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .header h1 { font-size: 24px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }
        .header h2 { font-size: 16px; color: #666; font-weight: normal; }
        .summary { display: flex; justify-content: space-around; background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
        .summary-item { text-align: center; }
        .summary-value { font-size: 28px; font-weight: bold; color: #2563eb; }
        .summary-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background-color: #f1f5f9; font-weight: bold; color: #475569; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
        tr:hover { background-color: #f8fafc; }
        .progress-bar-bg { width: 100%; background-color: #e2e8f0; border-radius: 999px; height: 8px; overflow: hidden; }
        .progress-bar-fill { background-color: #3b82f6; height: 100%; border-radius: 999px; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px; }
        .footer .motto { font-style: italic; color: #555; margin-bottom: 5px; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${orgName}</h1>
        <h2>Usage Statistics Report</h2>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="summary-value">${totalCodes}</div>
          <div class="summary-label">Total Codes</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${usedCodes}</div>
          <div class="summary-label">Votes Cast</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${overallTurnout}%</div>
          <div class="summary-label">Overall Turnout</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Class & Stream</th>
            <th>Total Codes</th>
            <th>Used</th>
            <th>Unused</th>
            <th>Turnout</th>
            <th style="width: 25%;">Progress</th>
          </tr>
        </thead>
        <tbody>
          ${stats.map((s) => {
    const turnout = s.total > 0 ? Math.round((s.used / s.total) * 100) : 0;
    return `
              <tr>
                <td style="font-weight: bold;">${s.className}${s.stream}</td>
                <td>${s.total}</td>
                <td>${s.used}</td>
                <td>${s.total - s.used}</td>
                <td style="font-weight: ${turnout >= 80 ? 'bold' : 'normal'}; color: ${turnout >= 80 ? '#16a34a' : 'inherit'}">${turnout}%</td>
                <td>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" style="width: ${turnout}%"></div>
                  </div>
                </td>
              </tr>
            `;
  }).join("")}
        </tbody>
      </table>

      <div class="footer">
        ${motto ? `<div class="motto">"${motto}"</div>` : ""}
        Generated on ${new Date().toLocaleString('en-UG')}
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

const AdminCodes = () => {
  const { isAuthed, isFullAdmin } = useAdminAuth();
  const store = useStoreSync();

  const refreshData = useCallback(async () => {
    try {
      await Promise.all([
        fetchVotingTypes(),
        fetchVotingCodes(),
        getCodeStats(),
      ]);
    } catch (err: any) {
      toast.error("Failed to load codes data");
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Real-time updates
  useElectionSocket(useCallback((msg: WsMessage) => {
    if (msg.type === "codes_generated" || msg.type === "code_used") {
      refreshData();
    }
  }, [refreshData]));

  // Generate form
  const [genVtId, setGenVtId] = useState(store.votingTypes[0]?.id || "");
  const [genClass, setGenClass] = useState("S1");
  const [genStream, setGenStream] = useState(store.streams[0] || "A");
  const [genCount, setGenCount] = useState(60);
  const [genResult, setGenResult] = useState<VotingCode[] | null>(null);
  const [generating, setGenerating] = useState(false);

  // Filters
  const [filterClass, setFilterClass] = useState("");
  const [filterStream, setFilterStream] = useState("");
  const [filterVtId, setFilterVtId] = useState("");
  const [filterUsed, setFilterUsed] = useState<"" | "used" | "unused">("");
  const [filterTime, setFilterTime] = useState<"all" | "latest">("all");

  // Selection (stores IDs)
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());

  // Print dropdown
  const [printMenuOpen, setPrintMenuOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredCodes = useMemo(() => {
    let result = store.votingCodes.filter((c) => {
      if (filterClass && c.className !== filterClass) return false;
      if (filterStream && c.stream !== filterStream) return false;
      if (filterVtId && c.votingTypeId !== filterVtId) return false;
      if (filterUsed === "used" && !c.used) return false;
      if (filterUsed === "unused" && c.used) return false;
      return true;
    });

    if (filterTime === "latest" && result.length > 0) {
      const maxTime = Math.max(...result.map(c => new Date(c.createdAt).getTime()));
      const batchWindowMs = 5 * 60 * 1000;
      result = result.filter(c => maxTime - new Date(c.createdAt).getTime() <= batchWindowMs);
    }

    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return result;
  }, [store.votingCodes, filterClass, filterStream, filterVtId, filterUsed, filterTime]);

  const stats = useMemo(() => getCodeStatsByClass(), [store.votingCodes]);

  const vtMap = useMemo<Map<string, string>>(() => {
    const m = new Map<string, string>();
    store.votingTypes.forEach((v: any) => {
      m.set(v.id, v.name);
      m.set(`${v.id}_org`, v.orgName);
      m.set(`${v.id}_motto`, v.motto);
    });
    return m;
  }, [store.votingTypes]);

  const handleGenerate = async () => {
    if (!genVtId || !genClass || !genStream || genCount < 1) return;
    setGenerating(true);
    try {
      const codes = await generateCodes(genVtId, genClass, genStream, genCount);
      setGenResult(codes);
      toast.success(`${codes.length} voting codes generated for ${genClass}${genStream}`);
      await refreshData(); // Force refresh to see new codes immediately
    } catch (err: any) {
      toast.error(`Code generation failed: ${err.message || "Unknown error"}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleExportCSV = () => {
    if (isBackendMode) {
      const url = getCodeExportUrl({
        className: filterClass || undefined,
        stream: filterStream || undefined,
        votingTypeId: filterVtId || undefined,
        used: filterUsed === "used" ? true : filterUsed === "unused" ? false : undefined,
      });
      if (url) {
        window.open(url, "_blank");
        toast.success("CSV export started");
        return;
      }
    }

    const codes = filteredCodes.length > 0 ? filteredCodes : store.votingCodes;
    const csv = [
      "Class,Stream,Voting Code,Election Type,Used,Created",
      ...codes.map((c) =>
        `${c.className},${c.stream},${c.code},${vtMap.get(c.votingTypeId) || ""},${c.used ? "Yes" : "No"},${new Date(c.createdAt).toLocaleDateString()}`
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voting-codes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${codes.length} codes to CSV`);
  };

  const handlePrint = (mode: PrintMode) => {
    setPrintMenuOpen(false);
    let codes: VotingCode[];
    switch (mode) {
      case "all":
        codes = filteredCodes;
        break;
      case "unused":
        codes = filteredCodes.filter((c) => !c.used);
        break;
      case "selected":
        codes = filteredCodes.filter((c) => selectedCodes.has(c.id));
        break;
    }
    if (codes.length === 0) {
      toast.error("No codes to print");
      return;
    }
    printCoupons(codes, vtMap);
  };

  const handleDeleteSelected = async () => {
    if (selectedCodes.size === 0) return;
    try {
      await deleteCodes(Array.from(selectedCodes));
      toast.success(`${selectedCodes.size} codes deleted successfully`);
      setSelectedCodes(new Set());
      await refreshData(); // Force refresh to see changes immediately
    } catch (err: any) {
      toast.error(`Delete failed: ${err.message || "Unknown error"}`);
    }
  };

  // Sync dropdown defaults when store data is loaded
  useEffect(() => {
    if (store.votingTypes.length > 0 && !genVtId) {
      setGenVtId(store.votingTypes[0].id);
    }
  }, [store.votingTypes, genVtId]);

  useEffect(() => {
    if (store.streams.length > 0 && !genStream) {
      setGenStream(store.streams[0]);
    }
  }, [store.streams, genStream]);

  const toggleSelect = (id: string) => {
    setSelectedCodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedCodes.size === filteredCodes.length && filteredCodes.length > 0) {
      setSelectedCodes(new Set());
    } else {
      setSelectedCodes(new Set(filteredCodes.map((c) => c.id)));
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
  const itemVariants = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

  if (!isAuthed) return null;

  return (
    <AdminLayout title="Voting Codes" subtitle="Generate, manage & export codes">
      <div className="space-y-6">

        {/* ── Usage by Class Stats Section ── */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">Usage by Class</h2>
                <p className="text-xs text-slate-500 mt-1">Codes used per class</p>
              </div>
            </div>
            <button
              onClick={() => printStats(stats, vtMap, genVtId || undefined)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print Stats
            </button>
          </div>
          {stats.length === 0 ? (
            <p className="text-sm text-slate-500 italic text-center py-4">No codes generated yet</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {stats.map((s) => {
                const pct = s.total > 0 ? Math.round((s.used / s.total) * 100) : 0;
                const barColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-rose-500";
                const pillColor = pct >= 80
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : pct >= 50
                    ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                    : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400";
                return (
                  <div key={`${s.className}-${s.stream}`} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{s.className}{s.stream}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <span className="text-slate-900 dark:text-white font-bold">{s.used}</span>/{s.total}
                    </p>
                    {/* Coloured turnout progress bar */}
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {/* Percentage pill badge */}
                    <span className={`self-start px-2 py-0.5 rounded-md text-[10px] font-bold ${pillColor}`}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Generate Codes Panel ── */}
        {isFullAdmin && (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white leading-none">Generate Codes</h2>
                <p className="text-xs text-slate-500 mt-1">Create new voting codes</p>
              </div>
            </div>
            {/* 4 selects in a grid row + count input */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Election Type</label>
                <select
                  value={genVtId}
                  onChange={(e) => setGenVtId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {store.votingTypes.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Class</label>
                <select
                  value={genClass}
                  onChange={(e) => setGenClass(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {store.classLevels.map((cl) => (
                    <option key={cl} value={cl}>{cl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Stream</label>
                <select
                  value={genStream}
                  onChange={(e) => setGenStream(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {store.streams.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 block">Number of Codes</label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={genCount}
                  onChange={(e) => setGenCount(Math.max(1, Math.min(500, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            {/* Action button */}
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-sm disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                {generating ? "Generating..." : `Generate ${genCount} Codes`}
              </button>
              {/* Success toast row */}
              <AnimatePresence>
                {genResult && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {genResult.length} codes generated successfully!
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* ── Filter Toolbar + Actions ── */}
        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl p-5">
          {/* Horizontal scrollable pill-selector row */}
          <div className="flex items-center gap-3 mb-5 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 flex-shrink-0 text-slate-500 dark:text-slate-400">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-bold">Filters</span>
            </div>
            <select
              value={filterVtId}
              onChange={(e) => setFilterVtId(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0"
            >
              <option value="">All Types</option>
              {store.votingTypes.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0"
            >
              <option value="">All Classes</option>
              {store.classLevels.map((cl) => (
                <option key={cl} value={cl}>{cl}</option>
              ))}
            </select>
            <select
              value={filterStream}
              onChange={(e) => setFilterStream(e.target.value)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0"
            >
              <option value="">All Streams</option>
              {store.streams.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              value={filterUsed}
              onChange={(e) => setFilterUsed(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0"
            >
              <option value="">All Status</option>
              <option value="unused">Unused</option>
              <option value="used">Used</option>
            </select>
            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value as any)}
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 flex-shrink-0"
            >
              <option value="all">All Time</option>
              <option value="latest">Latest Batch</option>
            </select>
            {/* X codes counter */}
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-auto flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
              {filteredCodes.length} codes
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 mb-5 flex-wrap">
            {/* Export CSV = primary button */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>

            {/* Print Coupons = dropdown */}
            <div className="relative" ref={printRef}>
              <button
                onClick={() => setPrintMenuOpen(!printMenuOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <Printer className="w-4 h-4" /> Print Coupons <ChevronDown className="w-3 h-3 ml-1" />
              </button>
              {printMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setPrintMenuOpen(false)} />
                  <div className="absolute left-0 top-full mt-2 z-20 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                    <button
                      onClick={() => handlePrint("all")}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white"
                    >
                      <span className="font-semibold block">Print All</span>
                      <span className="text-xs text-slate-500">All {filteredCodes.length} codes (filtered)</span>
                    </button>
                    <button
                      onClick={() => handlePrint("unused")}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800"
                    >
                      <span className="font-semibold block">Print Unused Only</span>
                      <span className="text-xs text-slate-500">{filteredCodes.filter((c) => !c.used).length} unused codes</span>
                    </button>
                    <button
                      onClick={() => handlePrint("selected")}
                      disabled={selectedCodes.size === 0}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-900 dark:text-white border-t border-slate-100 dark:border-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="font-semibold block">Print Selected</span>
                      <span className="text-xs text-slate-500">{selectedCodes.size} codes selected</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Delete selected = destructive button (only when selection > 0) */}
            <AnimatePresence>
              {isFullAdmin && selectedCodes.size > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors border border-rose-200 dark:border-rose-500/30"
                >
                  <Trash2 className="w-4 h-4" /> Delete ({selectedCodes.size})
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* ── Code Table ── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-950">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm whitespace-nowrap">
                {/* Sticky header */}
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {isFullAdmin && (
                      <th className="px-4 py-3 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={selectedCodes.size === filteredCodes.length && filteredCodes.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded border-slate-300 text-primary focus:ring-primary"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 font-semibold">Code</th>
                    <th className="px-4 py-3 font-semibold">Class</th>
                    <th className="px-4 py-3 font-semibold">Stream</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-slate-500 text-sm">
                        No codes found. Generate codes above.
                      </td>
                    </tr>
                  ) : (
                    <AnimatePresence>
                      {filteredCodes.map((vc) => {
                        const vtName = vtMap.get(vc.votingTypeId) || "";
                        const isSelected = selectedCodes.has(vc.id);
                        return (
                          <motion.tr
                            key={vc.code}
                            variants={itemVariants}
                            initial="hidden"
                            animate="show"
                            className={`hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors ${isSelected ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}
                          >
                            {isFullAdmin && (
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelect(vc.id)}
                                  className="rounded border-slate-300 text-primary focus:ring-primary"
                                />
                              </td>
                            )}
                            {/* Monospaced font-bold code */}
                            <td className="px-4 py-3 font-mono font-bold text-slate-900 dark:text-white tracking-widest text-sm">
                              {vc.code}
                            </td>
                            {/* Class/stream badges */}
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">{vc.className}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">{vc.stream}</span>
                            </td>
                            {/* Voting type pill */}
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                {vtName}
                              </span>
                            </td>
                            {/* Status */}
                            <td className="px-4 py-3">
                              {vc.used ? (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                                  <XCircle className="w-4 h-4" /> Used
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                  <CheckCircle2 className="w-4 h-4" /> Available
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {new Date(vc.createdAt).toLocaleDateString()}
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCodes;
