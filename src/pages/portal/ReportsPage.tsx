import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Lock, Plus, FileText, Send, Edit3, Trash2,
  Download, CheckCircle, Clock, ChevronDown, ChevronRight, Eye, Settings2, Star, Search,
  Bell, AlertCircle, LayoutDashboard, FileSpreadsheet, CheckSquare
} from "lucide-react";
import MonthlyReportForm from "@/components/portal/MonthlyReportForm";
import DocumentViewer from "@/components/portal/DocumentViewer";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteRenderer } from "@/components/blog/BlockNoteRenderer";
import { motion, AnimatePresence } from "framer-motion";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

const ROLE_TARGETS = [
  { value: "patron", label: "School Patron" },
  { value: "chairperson", label: "Chairperson" },
  { value: "general_secretary", label: "General Secretary" },
  { value: "adminabsolute", label: "Admin Absolute" },
];

function deserializeTemplate(raw: string): any | null {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed;
  } catch { /* not JSON */ }
  return null;
}

const generateReportPDF = async (report: any, roleLabel: string): Promise<Blob> => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    const addImageToDoc = (src: string, x: number, y: number, w: number, h: number, format: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = "Anonymous";
        img.onload = () => { doc.addImage(img, format, x, y, w, h); resolve(); };
        img.onerror = () => resolve();
      });
    };

    try {
      await Promise.all([
        addImageToDoc(mengoBadge, 15, 10, 20, 20, "JPEG"),
        addImageToDoc(unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
      ]);
    } catch(e) { console.error("Logo load failed", e); }
    
    // Header
    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    
    const sections = deserializeTemplate(report.content);
    const councilName = sections?.councilName || "STUDENTS' COUNCIL BODY";
    doc.text(councilName.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(10);
    doc.text("REPORT", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Period: ${report.period_month_display} ${report.period_year}`, 15, y); y += 4;
    doc.text(`Submitted By: ${report.author_name}`, 15, y); y += 4;
    doc.text(`Role: ${report.owner_role?.replace(/_/g, " ").toUpperCase() || roleLabel}`, 15, y); y += 8;

    const addSection = (title: string, content: string) => {
        if (y > 260) { doc.addPage(); y = 20; }
        if (title) {
            doc.setFont("helvetica", "bold");
            doc.text(title, 15, y);
            y += 6;
        }
        if (content) {
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(content, pageW - 30);
            doc.text(lines, 15, y);
            y += (lines.length * 5) + 5;
        } else if (title) {
            y += 2; // Extra space after title if no content
        }
    };

    const isJson = (str: string) => {
        try { 
          const parsed = JSON.parse(str); 
          return Array.isArray(parsed); 
        } catch { return false; }
    };

    if (sections) {
        doc.setFont("helvetica", "bold"); doc.text(`Class and Stream: ${sections.classStream || "N/A"}`, 15, y); y += 6;
        doc.text(`Class Teacher: ${sections.classTeacher || "N/A"}`, 15, y); y += 6;
        
        addSection("General Class Performance:", sections.generalPerformance);
        addSection("General School Challenges:", sections.generalChallenges);
        
        if (sections.challenges && sections.challenges.length > 0) {
            doc.setFont("helvetica", "bold"); doc.text("Specific Challenges:", 15, y); y += 6;
            sections.challenges.forEach((c: any) => {
                const text = `PROBLEM: ${c.description}\nWHEN: ${c.when}\nIMPACT: ${c.impact}`;
                addSection("", text);
            });
        }
        
        if (sections.solutions && sections.solutions.length > 0) {
            doc.setFont("helvetica", "bold"); doc.text("Proposed Solutions:", 15, y); y += 6;
            sections.solutions.forEach((s: any) => {
                const text = `PROBLEM: ${s.problem}\nSOLUTION: ${s.description}\nBENEFIT: ${s.benefit}`;
                addSection("", text);
            });
        }

        addSection("Administrative Support Requests:", sections.adminSupport);
        addSection("Positive Highlights:", sections.positiveHighlights);
        
        if (y > 240) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold"); doc.text("SIGNATORIES", 15, y); y += 10;
        const sigs = [
           ["Monitor:", sections.monitor], ["Monitress:", sections.monitress],
           ["Male Cllr:", sections.maleCouncillor], ["Female Cllr:", sections.femaleCouncillor],
           ["Student 1:", sections.student1], ["Student 2:", sections.student2]
        ];
        let rowY = y;
        sigs.forEach((s, i) => {
            doc.text(`${s[0]} ${s[1] || "_________________"}`, i % 2 === 0 ? 15 : 110, rowY);
            if (i % 2 !== 0) rowY += 10;
        });
        y = rowY + 10;
    } else if (isJson(report.content)) {
        const blocks = JSON.parse(report.content);
        const renderBlockToPDF = (block: any) => {
            const blockText = (content: any): string => {
                if (!content) return "";
                if (typeof content === 'string') return content;
                if (Array.isArray(content)) return content.map((c: any) => c.text || "").join("");
                return content.text || "";
            };
            const text = blockText(block.content);
            if (block.type === 'heading') {
                addSection(text, "");
            } else if (block.type === 'paragraph') {
                if (text.trim()) addSection("", text);
            } else if (block.type === 'bulletListItem') {
                addSection("", "• " + text);
            } else if (block.type === 'numberedListItem') {
                addSection("", "1. " + text);
            } else if (block.type === 'image' && block.props?.url) {
                addSection("[Image]", block.props.caption || "");
            }
            if (block.children && block.children.length > 0) {
                block.children.forEach(renderBlockToPDF);
            }
        };
        blocks.forEach(renderBlockToPDF);
    } else {
        const lines = report.content.split('\n');
        let currentTitle = "";
        let currentContent: string[] = [];
        lines.forEach((line: string) => {
            if (/^#+\s/.test(line)) {
                if (currentContent.length > 0 || currentTitle) {
                    addSection(currentTitle || "Content", currentContent.join('\n'));
                    currentContent = [];
                }
                currentTitle = line.replace(/^#+\s+/, '').trim();
            } else {
                currentContent.push(line);
            }
        });
        if (currentContent.length > 0 || currentTitle) {
            addSection(currentTitle || "Content", currentContent.join('\n'));
        }
    }
    
    if (y > 260) { doc.addPage(); y = 20; }
    y += 10;
    doc.setFont("helvetica", "bold"); doc.text("Declaration", 15, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Official Signature: ${report.author_name}`, 15, y); y += 6;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, y); y += 6;
    
    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
    doc.text("ANOINTED TO BEAR FRUIT", pageW / 2, 285, { align: "center" });

    return doc.output("blob");
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function ReportsPage() {
  const { profile, roles, hasPermission } = useAuth();
  const canView = hasPermission("view_reports");
  const canManage = hasPermission("manage_reports");

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // --- Monthly report state ---
  const [monthlyReports, setMonthlyReports] = useState<any[]>([]);
  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [viewMonthlyOpen, setViewMonthlyOpen] = useState(false);
  const [viewMonthlyReport, setViewMonthlyReport] = useState<any>(null);

  const [filterYear, setFilterYear] = useState<string>("All");
  const [filterMonth, setFilterMonth] = useState<string>("All");

  const [trackerData, setTrackerData] = useState<any[]>([]);
  const [trackerLoading, setTrackerLoading] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderDeadline, setReminderDeadline] = useState("");
  const [selectedMissing, setSelectedMissing] = useState<any[]>([]);
  const [filterClass, setFilterClass] = useState<string>("All");
  const [filterStream, setFilterStream] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // --- General report state ---
  const [generalReports, setGeneralReports] = useState<any[]>([]);
  const [generalLoading, setGeneralLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editReport, setEditReport] = useState<any>(null);
  const [gTitle, setGTitle] = useState("");
  const [gContent, setGContent] = useState("");
  const [gMonth, setGMonth] = useState(String(currentMonth));
  const [gYear, setGYear] = useState(String(currentYear));
  const [gStatus, setGStatus] = useState("draft");
  const [gSaving, setGSaving] = useState(false);
  const [forwardOpen, setForwardOpen] = useState(false);
  const [forwardTarget, setForwardTarget] = useState<any>(null);
  const [forwardTo, setForwardTo] = useState("");
  const [forwardSending, setForwardSending] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewReport, setViewReport] = useState<any>(null);

  const hasClassAndStream = !!(profile?.student_class && profile?.stream);
  const defaultTab = hasClassAndStream ? "monthly" : (canManage ? "general" : "monthly");
  const [tab, setTab] = useState<"monthly" | "general" | "tracker">(defaultTab);
  
  const editor = useCreateBlockNote();

  useEffect(() => {
    if (!hasClassAndStream && tab === "monthly") {
      setTab("general");
    }
  }, [hasClassAndStream]);

  const [openYears, setOpenYears] = useState<Set<number>>(new Set([currentYear]));

  const roleLabel = (roles[0] || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const loadMonthly = async () => {
    setMonthlyLoading(true);
    try {
      const { data } = await api.get("/reports/monthly/");
      setMonthlyReports(Array.isArray(data) ? data : data.results || []);
    } catch { toast.error("Failed to load monthly reports"); }
    finally { setMonthlyLoading(false); }
  };

  const loadGeneral = async () => {
    setGeneralLoading(true);
    try {
      const { data } = await api.get("/reports/general/");
      setGeneralReports(Array.isArray(data) ? data : data.results || []);
    } catch { toast.error("Failed to load general reports"); }
    finally { setGeneralLoading(false); }
  };

  const loadTracker = async () => {
    try {
      setTrackerLoading(true);
      const res = await api.get("/reports/tracker/", { params: { month: currentMonth, year: currentYear } });
      setTrackerData(res.data.tracker);
    } catch (err) {
      console.error("Tracker loading error", err);
    } finally {
      setTrackerLoading(false);
    }
  };

  const markAsRead = async (report: any, type: 'monthly' | 'general') => {
    try {
      await api.post(`/reports/${type}/${report.id}/mark-read/`, { is_read: true });
      if (type === 'monthly') loadMonthly();
      else loadGeneral();
      toast.success("Report marked as read");
    } catch (err) {
      toast.error("Failed to mark as read");
    }
  };

  const sendReminders = async () => {
    if (selectedMissing.length === 0) {
      toast.error("Select at least one class to remind.");
      return;
    }
    try {
      await api.post("/reports/reminders/", { 
        deadline: reminderDeadline,
        targets: selectedMissing.map(m => ({ class: m.class, stream: m.stream }))
      });
      toast.success("Reminders sent successfully!");
      setReminderOpen(false);
      setSelectedMissing([]);
    } catch (err) {
      toast.error("Failed to send reminders");
    }
  };

  useEffect(() => {
    if (canView) {
      loadMonthly();
      loadGeneral();
      if (canManage) loadTracker();
    }
  }, [canView]);

  useEffect(() => {
    if (tab === "tracker") loadTracker();
  }, [tab]);

  const currentMonthReport = monthlyReports.find(
    (r) => r.period_month === currentMonth && 
           r.period_year === currentYear && 
           r.owner_class === profile?.student_class && 
           r.owner_stream === profile?.stream
  );

  const combinedReports = useMemo(() => {
    const all = [
      ...monthlyReports.map(r => ({ ...r, __type: 'monthly' })),
      ...generalReports.map(r => ({ ...r, __type: 'general' }))
    ];

    const filtered = all.filter(r => {
      if (filterYear !== "All" && String(r.period_year) !== filterYear) return false;
      if (filterMonth !== "All" && String(r.period_month) !== filterMonth) return false;
      if (r.__type === 'monthly') {
        if (filterClass !== "All" && r.owner_class !== filterClass) return false;
        if (filterStream !== "All" && r.owner_stream !== filterStream) return false;
      }
      
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const textToSearch = [
          r.title,
          r.author_name,
          r.owner_role?.replace(/_/g, " "),
          r.owner_class,
          r.owner_stream,
          r.status,
          MONTH_NAMES[r.period_month - 1]
        ].filter(Boolean).join(" ").toLowerCase();
        if (!textToSearch.includes(q)) return false;
      }

      return true;
    });

    const grouped = filtered.reduce((acc: any, r) => {
      if (!acc[r.period_year]) acc[r.period_year] = {};
      if (!acc[r.period_year][r.period_month]) acc[r.period_year][r.period_month] = [];
      acc[r.period_year][r.period_month].push(r);
      return acc;
    }, {});

    Object.keys(grouped).forEach(y => {
      Object.keys(grouped[y]).forEach(m => {
        grouped[y][m].sort((a: any, b: any) => {
          if (a.__type === 'general' && b.__type !== 'general') return -1;
          if (a.__type !== 'general' && b.__type === 'general') return 1;
          return 0;
        });
      });
    });

    return grouped;
  }, [monthlyReports, generalReports, filterYear, filterMonth, filterClass, filterStream, searchQuery]);

  const sortedArchiveYears = Object.keys(combinedReports).map(Number).sort((a,b) => b-a);

  const handleDownload = async (report: any) => {
    try {
      const blob = await generateReportPDF(report, roleLabel);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.title.replace(/[\s/]+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate PDF.");
    }
  };

  const handleGeneralSave = async () => {
    const blocks = editor.document;
    const hasContent = blocks.some(b => {
      if (b.type !== 'paragraph') return true;
      if (Array.isArray(b.content) && b.content.length > 0) return true;
      return false;
    });

    if (!hasContent) { toast.error("Content cannot be empty"); return; }
    
    setGSaving(true);
    try {
      const payload = { 
        title: gTitle, 
        content: JSON.stringify(blocks), 
        period_month: Number(gMonth), 
        period_year: Number(gYear), 
        status: gStatus 
      };
      if (editReport) {
        await api.patch(`/reports/general/${editReport.id}/`, payload);
        toast.success("Report updated!");
      } else {
        await api.post("/reports/general/", payload);
        toast.success("General report created!");
      }
      setCreateOpen(false); setEditReport(null);
      setGTitle(""); setGMonth(String(currentMonth)); setGYear(String(currentYear)); setGStatus("draft");
      editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
      loadGeneral();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || "Failed to save report.");
    } finally { setGSaving(false); }
  };

  const openEdit = (r: any) => {
    setEditReport(r); setGTitle(r.title);
    setGMonth(String(r.period_month)); setGYear(String(r.period_year)); setGStatus(r.status);
    
    try {
      const parsed = JSON.parse(r.content);
      if (Array.isArray(parsed)) {
        editor.replaceBlocks(editor.document, parsed);
      } else {
        editor.replaceBlocks(editor.document, [{ type: "paragraph", content: r.content || "" }]);
      }
    } catch {
      editor.replaceBlocks(editor.document, [{ type: "paragraph", content: r.content || "" }]);
    }
    
    setCreateOpen(true);
  };

  const handleDelete = async (r: any) => {
    try {
      await api.delete(`/reports/general/${r.id}/`);
      toast.success("Deleted."); loadGeneral();
    } catch { toast.error("Failed to delete."); }
  };

  const handleForward = async () => {
    if (!forwardTo) { toast.error("Select a target office"); return; }
    setForwardSending(true);
    try {
      await api.patch(`/reports/general/${forwardTarget.id}/`, { forwarded_to: forwardTo });
      toast.success("Report forwarded!"); setForwardOpen(false); setForwardTarget(null); setForwardTo(""); loadGeneral();
    } catch { toast.error("Failed to forward report."); }
    finally { setForwardSending(false); }
  };

  const toggleYear = (y: number) => {
    setOpenYears((prev) => { const next = new Set(prev); next.has(y) ? next.delete(y) : next.add(y); return next; });
  };

  if (!canView) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-3">
        <Lock className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold text-muted-foreground">Access Restricted</h2>
        <p className="text-sm text-muted-foreground/60">You don't have permission to view Reports.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-8 pb-12 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col gap-2 relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider w-fit"
        >
          <ClipboardList className="w-3 h-3" /> System Reports
        </motion.div>
        <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
          Council Reports
        </h1>
        <p className="text-muted-foreground/80 mt-1 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
          Submit monthly council reports, track general performance, and review the archive.
        </p>
      </section>

      {/* Tab Bar */}
      <div className="flex gap-2 bg-card/60 backdrop-blur-xl border border-border/40 p-1.5 rounded-2xl w-fit shadow-lg relative z-10">
        {hasClassAndStream && (
          <button onClick={() => setTab("monthly")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all uppercase tracking-wider ${tab === "monthly" ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
            <LayoutDashboard className="w-4 h-4" /> My Class Report
          </button>
        )}
        {canManage && (
          <button onClick={() => setTab("general")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all uppercase tracking-wider ${tab === "general" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
            <FileSpreadsheet className="w-4 h-4" /> Reports Archive
          </button>
        )}
        {canManage && (
          <button onClick={() => setTab("tracker")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all uppercase tracking-wider ${tab === "tracker" ? "bg-background text-foreground shadow-sm border border-border/50" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
            <CheckSquare className="w-4 h-4" /> Submission Tracker
          </button>
        )}
      </div>

      {/* ─────────────────────────── MONTHLY REPORT TAB ─────────────────────────── */}
      {tab === "monthly" && (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Status Banner */}
          <div className={`flex items-start gap-4 p-5 rounded-3xl border shadow-lg backdrop-blur-md ${currentMonthReport
            ? "bg-emerald-500/10 border-emerald-500/20"
            : "bg-amber-500/10 border-amber-500/20"}`}>
            <div className={`mt-0.5 h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${currentMonthReport ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600"}`}>
              {currentMonthReport ? <Lock className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </div>
            <div>
              <p className={`text-base font-bold ${currentMonthReport ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                {currentMonthReport
                  ? `Report submitted for ${MONTH_NAMES[currentMonth - 1]} ${currentYear} — Locked until next month.`
                  : `Action Required: No report submitted yet for ${MONTH_NAMES[currentMonth - 1]} ${currentYear}.`}
              </p>
              <p className="text-sm text-foreground/70 mt-1 font-medium">
                {currentMonthReport ? "You have completed your reporting requirements for this period. Download your submission below." : "Please fill in the template sections and submit your monthly class report."}
              </p>
            </div>
          </div>

          {currentMonthReport && (
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardContent className="p-12 flex flex-col items-center justify-center text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                  <FileText className="h-10 w-10 text-primary relative z-10" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-black">{currentMonthReport.title}</h3>
                  <p className="text-sm font-medium text-muted-foreground mt-2">
                    Submitted on {new Date(currentMonthReport.created_at).toLocaleDateString()} at {new Date(currentMonthReport.created_at).toLocaleTimeString()}
                  </p>
                </div>
                <Button onClick={() => handleDownload(currentMonthReport)} className="h-12 px-6 rounded-xl font-bold gap-2 text-base shadow-lg shadow-primary/20">
                  <Download className="h-5 w-5" /> Download PDF Copy
                </Button>
              </CardContent>
            </Card>
          )}

          {!currentMonthReport && hasClassAndStream && (
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden max-w-4xl">
              <div className="p-6 border-b border-border/20 bg-primary/5">
                 <CardTitle className="font-serif text-2xl font-black text-primary flex items-center gap-2">
                   <FileText className="h-6 w-6" /> Class Monthly Report
                 </CardTitle>
              </div>
              <CardContent className="p-6 sm:p-8">
                 <MonthlyReportForm 
                    submitTarget="reports" 
                    onSuccess={() => loadMonthly()} 
                 />
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}

      {/* ─────────────────────────── GENERAL REPORTS ARCHIVE TAB ─────────────────────────── */}
      {tab === "general" && canManage && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-card/60 backdrop-blur-xl p-4 rounded-3xl border border-border/40 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10 h-11 text-sm bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/20"
                  placeholder="Search reports by title, author, or role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[120px] h-11 bg-background/50 border-border/50 rounded-xl font-medium"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent className="rounded-xl backdrop-blur-xl bg-background/95">
                  <SelectItem value="All">All Years</SelectItem>
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[140px] h-11 bg-background/50 border-border/50 rounded-xl font-medium"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent className="rounded-xl backdrop-blur-xl bg-background/95 max-h-[300px]">
                  <SelectItem value="All">All Months</SelectItem>
                  {MONTH_NAMES.map((m, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end shrink-0 w-full md:w-auto">
              <Dialog open={createOpen} onOpenChange={(o) => {
                setCreateOpen(o);
                if (!o) { 
                  setEditReport(null); setGTitle(""); setGMonth(String(currentMonth)); setGYear(String(currentYear)); setGStatus("draft"); 
                  editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="lg" className="gap-2 rounded-xl font-bold shadow-lg shadow-primary/20 w-full md:w-auto">
                    <Plus className="h-5 w-5" /> New General Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0">
                  <div className="p-6 border-b border-border/20 bg-primary/5">
                    <DialogTitle className="font-serif text-2xl font-black text-primary flex items-center gap-2">
                      <FileText className="h-6 w-6" />
                      {editReport ? "Edit Report" : "New General Report"}
                    </DialogTitle>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="rounded-xl border border-border/50 bg-muted/30 p-4 text-sm font-medium">
                      <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-black mr-2">Auto-title: </span>
                      <span className="text-foreground">{gTitle.trim() || `${roleLabel} Report – ${MONTH_NAMES[Number(gMonth) - 1]} ${gYear}`}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title <span className="text-muted-foreground/60 normal-case font-medium">(leave blank to auto-generate)</span></Label>
                      <Input className="h-12 bg-muted/30 border-border/50 rounded-xl" placeholder="Optional custom title…" value={gTitle} onChange={(e) => setGTitle(e.target.value)} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Month</Label>
                        <Select value={gMonth} onValueChange={setGMonth}>
                          <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl max-h-[250px]">{MONTH_NAMES.map((m, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Year</Label>
                        <Select value={gYear} onValueChange={setGYear}>
                          <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl">{[currentYear, currentYear - 1, currentYear - 2].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</Label>
                        <Select value={gStatus} onValueChange={setGStatus}>
                          <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl"><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Content</Label>
                      <div className="bg-background text-foreground min-h-[400px] border border-border/50 rounded-2xl p-4 overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <BlockNoteView editor={editor} theme="light" />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                      <Button variant="outline" className="h-12 rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
                      <Button onClick={handleGeneralSave} disabled={gSaving} className="h-12 rounded-xl font-bold shadow-lg px-8">
                        {gSaving ? "Saving…" : editReport ? "Update Report" : "Create Report"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {generalLoading || monthlyLoading ? (
             <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                   <div key={i} className="h-24 rounded-3xl bg-card/60 border border-border/40 animate-pulse"></div>
                ))}
             </div>
          ) : sortedArchiveYears.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border/60 rounded-3xl bg-muted/10 backdrop-blur-sm">
              <ClipboardList className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h3 className="font-bold text-lg text-foreground">Archive is Empty</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">No reports match the current filters or none have been submitted yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <AnimatePresence>
                {sortedArchiveYears.map((year) => (
                  <motion.div key={year} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
                    <button onClick={() => toggleYear(year)}
                      className="w-full flex items-center justify-between p-6 bg-muted/20 hover:bg-muted/40 transition-colors">
                      <span className="font-serif text-xl font-bold">{year} Archive</span>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="font-bold rounded-lg px-2 py-1">{Object.values(combinedReports[year]).flat().length} Reports</Badge>
                        <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center border border-border/50 shadow-sm">
                          {openYears.has(year) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </div>
                    </button>
                    {openYears.has(year) && (
                      <div className="divide-y divide-border/40">
                        {Object.keys(combinedReports[year]).map(Number).sort((a, b) => b - a).map((month) => (
                          <div key={month}>
                            <div className="px-6 py-2.5 bg-background/80 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 backdrop-blur-xl border-y border-border/40 z-10 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50"></div>
                              {MONTH_NAMES[month - 1]}
                            </div>
                            {combinedReports[year][month].map((r: any) => {
                              const isGeneral = r.__type === 'general';
                              const sections = !isGeneral ? deserializeTemplate(r.content) : null;
                              const preview = !isGeneral && sections
                                ? [sections.classStream, sections.generalPerformance, sections.adminSupport].filter(Boolean).join(" · ").slice(0, 120)
                                : r.content.slice(0, 120);

                              return (
                                <div key={`${r.__type}-${r.id}`} className={`p-6 flex flex-col md:flex-row md:items-start justify-between gap-4 hover:bg-muted/30 transition-colors ${isGeneral ? "bg-primary/[0.02]" : ""}`}>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                      {!r.is_read && canManage && (
                                        <Badge className="text-[10px] uppercase tracking-widest font-black bg-rose-500/10 text-rose-600 border-rose-500/20 animate-pulse">NEW</Badge>
                                      )}
                                      <span className="font-bold text-base truncate pr-2">{r.title}</span>
                                      {isGeneral ? (
                                        <>
                                          <Badge variant="outline" className={`text-[9px] uppercase font-black tracking-widest ${r.status === "published" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}`}>
                                            {r.status === "published" ? <CheckCircle className="h-3 w-3 mr-1" /> : null}
                                            {r.status}
                                          </Badge>
                                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-primary/10 text-primary border-primary/20">
                                            <Star className="h-3 w-3 mr-1" />General
                                          </Badge>
                                          {r.forwarded_to && (
                                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-blue-500/10 text-blue-600 border-blue-500/20">
                                              <Send className="h-3 w-3 mr-1" />Fwd: {r.forwarded_to.replace(/_/g, " ")}
                                            </Badge>
                                          )}
                                        </>
                                      ) : (
                                        <>
                                          {r.owner_class && (
                                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-secondary/20 text-secondary-foreground border-secondary/30">
                                              {r.owner_class} {r.owner_stream}
                                            </Badge>
                                          )}
                                          {r.is_locked && (
                                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-amber-500/10 text-amber-600 border-amber-500/20">
                                              <Lock className="h-3 w-3 mr-1" />Locked
                                            </Badge>
                                          )}
                                        </>
                                      )}
                                    </div>
                                    <p className="text-sm text-foreground/80 font-medium">By {r.author_name} <span className="text-muted-foreground/50 mx-1">•</span> <span className="text-xs uppercase tracking-wider text-muted-foreground">{r.owner_role ? r.owner_role.replace(/_/g, " ") : ""}</span></p>
                                    {!isGeneral && <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed bg-muted/30 p-2 rounded-lg border border-border/40 font-mono text-[11px]">{preview}…</p>}
                                  </div>
                                  
                                  <div className="flex gap-2 shrink-0 flex-wrap md:justify-end mt-4 md:mt-0">
                                    {isGeneral ? (
                                      <>
                                        <Button size="sm" variant="secondary" className="h-9 rounded-lg font-bold" onClick={() => { setViewReport(r); setViewOpen(true); }}>
                                          <Eye className="h-4 w-4 mr-1.5" /> View
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-9 rounded-lg font-bold" onClick={() => handleDownload(r)}>
                                          <Download className="h-4 w-4 mr-1.5" /> PDF
                                        </Button>
                                        {canManage && (
                                          <div className="flex gap-1 ml-2 pl-2 border-l border-border/50">
                                            {!r.forwarded_to && (
                                              <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg text-blue-600 hover:bg-blue-50" title="Forward to Office" onClick={() => { setForwardTarget(r); setForwardOpen(true); }}>
                                                <Send className="h-4 w-4" />
                                              </Button>
                                            )}
                                            <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg" title="Edit" onClick={() => openEdit(r)}>
                                              <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button size="sm" variant="ghost" className="h-9 w-9 p-0 rounded-lg text-rose-500 hover:bg-rose-50" title="Delete">
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle className="font-serif text-xl">Delete Report?</AlertDialogTitle>
                                                  <AlertDialogDescription>Are you sure you want to delete report "{r.title}"?</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                                                  <AlertDialogAction onClick={() => handleDelete(r)} className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <Button size="sm" variant="secondary" className="h-9 rounded-lg font-bold" onClick={() => { setViewMonthlyReport(r); setViewMonthlyOpen(true); }}>
                                          <Eye className="h-4 w-4 mr-1.5" /> View
                                        </Button>
                                        <Button size="sm" variant="outline" className="h-9 rounded-lg font-bold" onClick={() => handleDownload(r)}>
                                          <Download className="h-4 w-4 mr-1.5" /> PDF
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      )}

      {/* ─────────────────────────── SUBMISSION TRACKER TAB ─────────────────────────── */}
      {tab === "tracker" && (
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-card/60 backdrop-blur-xl p-6 rounded-3xl border border-border/40 shadow-sm gap-4">
            <div>
              <h2 className="font-serif text-2xl font-black text-foreground">Monthly Submission Tracker</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest">{MONTH_NAMES[currentMonth - 1]} {currentYear}</Badge>
                <span className="text-sm font-medium text-muted-foreground">Real-time status overview</span>
              </div>
            </div>
            <Button size="lg" className="gap-2 rounded-xl font-bold shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto" 
              onClick={() => { setSelectedMissing(trackerData.filter(t => !t.submitted)); setReminderOpen(true); }}
              disabled={trackerData.filter(t => !t.submitted).length === 0}>
              <Bell className="h-5 w-5" /> Remind All Missing
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {trackerLoading ? (
               Array.from({length: 15}).map((_, i) => (
                 <div key={i} className="h-28 rounded-2xl bg-card/60 border border-border/40 animate-pulse"></div>
               ))
            ) : trackerData.map((item, idx) => (
              <div key={idx} className={`p-4 rounded-2xl border shadow-sm transition-all flex flex-col justify-between h-full ${item.submitted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-card/60 border-border/40"}`}>
                <div className="flex justify-between items-start mb-3">
                   <span className="text-sm font-black">{item.class} <span className="text-muted-foreground/60 font-medium ml-0.5">{item.stream}</span></span>
                   {item.submitted ? (
                     <div className="h-6 w-6 rounded-full bg-emerald-500/10 flex items-center justify-center">
                       <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                     </div>
                   ) : (
                     <div className="h-6 w-6 rounded-full bg-rose-500/10 flex items-center justify-center">
                       <AlertCircle className="h-3.5 w-3.5 text-rose-600" />
                     </div>
                   )}
                </div>
                {item.submitted ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 justify-center py-1 mt-auto">Submitted</Badge>
                ) : (
                  <div className="flex flex-col gap-2 mt-auto">
                    <Badge variant="outline" className="bg-rose-500/10 text-rose-700 border-rose-500/20 justify-center py-1">Pending</Badge>
                    <button 
                      onClick={() => { setSelectedMissing([item]); setReminderOpen(true); }}
                      className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1 bg-primary/5 py-1.5 rounded-lg w-full">
                      <Send className="h-3 w-3" /> Remind
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!trackerLoading && trackerData.length === 0 && (
            <div className="text-center py-20 border border-dashed border-border/60 rounded-3xl bg-muted/10 backdrop-blur-sm">
               <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
               <p className="font-medium text-foreground">No tracking data available for this period.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Reminder Dialog */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-sm rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
          <div className="p-6 border-b border-border/20 bg-amber-500/5">
            <DialogTitle className="font-serif text-2xl font-black text-amber-600 flex items-center gap-2">
              <Bell className="h-6 w-6" /> Send Reminders
            </DialogTitle>
          </div>
          <div className="p-6 space-y-6">
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-medium text-sm leading-relaxed">
              You are about to remind <strong>{selectedMissing.length}</strong> class(es) to submit their monthly reports.
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Submission Deadline (Optional)</Label>
              <Input 
                className="h-12 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-amber-500/20"
                placeholder="e.g. Tomorrow 5:00 PM" 
                value={reminderDeadline} 
                onChange={(e) => setReminderDeadline(e.target.value)} 
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" className="h-11 rounded-xl w-full" onClick={() => setReminderOpen(false)}>Cancel</Button>
              <Button onClick={sendReminders} className="h-11 rounded-xl w-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg">Send Now</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={forwardOpen} onOpenChange={(o) => { setForwardOpen(o); if (!o) { setForwardTarget(null); setForwardTo(""); } }}>
        <DialogContent className="max-w-sm rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
          <div className="p-6 border-b border-border/20 bg-blue-500/5">
            <DialogTitle className="font-serif text-2xl font-black text-blue-600 flex items-center gap-2">
              <Send className="h-6 w-6" /> Forward Report
            </DialogTitle>
          </div>
          {forwardTarget && (
            <div className="p-6 space-y-6">
              <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm">
                <span className="text-muted-foreground block text-[10px] font-black uppercase tracking-widest mb-1">Target Report</span>
                <strong className="text-foreground">{forwardTarget.title}</strong>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Target Office</Label>
                <Select value={forwardTo} onValueChange={setForwardTo}>
                  <SelectTrigger className="h-12 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-blue-500/20"><SelectValue placeholder="Choose office…" /></SelectTrigger>
                  <SelectContent className="rounded-xl">{ROLE_TARGETS.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" className="h-11 rounded-xl w-full" onClick={() => setForwardOpen(false)}>Cancel</Button>
                <Button onClick={handleForward} disabled={forwardSending} className="h-11 rounded-xl w-full font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg">
                  {forwardSending ? "Sending…" : "Forward"} <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Monthly Report Dialog */}
      <Dialog open={viewMonthlyOpen} onOpenChange={setViewMonthlyOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0">
          <div className="p-6 border-b border-border/20 bg-primary/5 sticky top-0 z-20 backdrop-blur-xl">
            <DialogTitle className="font-serif text-2xl font-black text-primary flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <span className="truncate pr-4">{viewMonthlyReport?.title}</span>
            </DialogTitle>
            {viewMonthlyReport && (
               <div className="flex flex-wrap items-center gap-3 mt-3">
                 <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-background/50">{viewMonthlyReport.period_month_display} {viewMonthlyReport.period_year}</Badge>
                 <span className="text-xs font-medium text-muted-foreground">By {viewMonthlyReport.author_name} • {viewMonthlyReport.owner_role?.replace(/_/g, " ")}</span>
                 {viewMonthlyReport.is_locked && <Badge variant="outline" className="ml-auto bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase font-black tracking-widest"><Lock className="h-3 w-3 mr-1" />Locked</Badge>}
               </div>
            )}
          </div>
          <div className="p-6">
            {viewMonthlyReport && (() => {
              const sections = deserializeTemplate(viewMonthlyReport.content);
              return (
                <div className="space-y-6">
                  {sections ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                         <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">Council Name</p>
                            <p className="text-sm font-medium">{sections.councilName}</p>
                         </div>
                         <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">Class & Stream</p>
                            <p className="text-sm font-medium">{sections.classStream}</p>
                         </div>
                         <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">Class Teacher</p>
                            <p className="text-sm font-medium">{sections.classTeacher}</p>
                         </div>
                      </div>

                      <div className="p-5 rounded-2xl bg-card/60 border border-border/40 shadow-sm">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-3 flex items-center gap-2"><Star className="h-3 w-3" /> General Performance</p>
                         <p className="text-sm leading-relaxed whitespace-pre-wrap">{sections.generalPerformance}</p>
                      </div>

                      <div className="p-5 rounded-2xl bg-card/60 border border-border/40 shadow-sm">
                         <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/70 mb-3 flex items-center gap-2"><AlertCircle className="h-3 w-3" /> General Challenges</p>
                         <p className="text-sm leading-relaxed whitespace-pre-wrap">{sections.generalChallenges}</p>
                      </div>
                      
                      {(sections as any).challenges && (
                         <div className="p-5 rounded-2xl bg-card/60 border border-border/40 shadow-sm">
                           <p className="text-[10px] font-black uppercase tracking-widest text-rose-500/70 mb-4">Specific Challenges</p>
                           <div className="space-y-3">
                             {((sections as any).challenges || []).map((c: any, i: number) => (
                               <div key={i} className="rounded-xl p-4 bg-muted/30 border border-border/50 text-sm">
                                 <div className="grid gap-2">
                                    <div><span className="font-bold text-foreground">Problem:</span> <span className="text-muted-foreground">{c.description}</span></div>
                                    <div><span className="font-bold text-foreground">When:</span> <span className="text-muted-foreground">{c.when}</span></div>
                                    <div><span className="font-bold text-foreground">Impact:</span> <span className="text-muted-foreground">{c.impact}</span></div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                      )}

                      {(sections as any).solutions && (
                         <div className="p-5 rounded-2xl bg-card/60 border border-border/40 shadow-sm">
                           <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mb-4">Proposed Solutions</p>
                           <div className="space-y-3">
                             {((sections as any).solutions || []).map((s: any, i: number) => (
                               <div key={i} className="rounded-xl p-4 bg-muted/30 border border-border/50 text-sm">
                                 <div className="grid gap-2">
                                    <div><span className="font-bold text-foreground">For Problem:</span> <span className="text-muted-foreground">{s.problem}</span></div>
                                    <div><span className="font-bold text-foreground">Solution:</span> <span className="text-muted-foreground">{s.description}</span></div>
                                    <div><span className="font-bold text-foreground">Benefit:</span> <span className="text-muted-foreground">{s.benefit}</span></div>
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-5 rounded-2xl bg-card/60 border border-border/40 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70 mb-3">Admin Support Requests</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{sections.adminSupport}</p>
                         </div>
                         <div className="p-5 rounded-2xl bg-card/60 border border-border/40 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500/70 mb-3">Positive Highlights</p>
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{sections.positiveHighlights}</p>
                         </div>
                      </div>
                      
                      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10">
                         <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-4">Signatories</p>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 text-sm">
                            <div><span className="text-muted-foreground text-[10px] uppercase font-black block mb-0.5">Male Cllr</span><span className="font-medium">{(sections as any).maleCouncillor || "—"}</span></div>
                            <div><span className="text-muted-foreground text-[10px] uppercase font-black block mb-0.5">Female Cllr</span><span className="font-medium">{(sections as any).femaleCouncillor || "—"}</span></div>
                            <div><span className="text-muted-foreground text-[10px] uppercase font-black block mb-0.5">Monitor</span><span className="font-medium">{(sections as any).monitor || "—"}</span></div>
                            <div><span className="text-muted-foreground text-[10px] uppercase font-black block mb-0.5">Monitress</span><span className="font-medium">{(sections as any).monitress || "—"}</span></div>
                            <div><span className="text-muted-foreground text-[10px] uppercase font-black block mb-0.5">Student 1</span><span className="font-medium">{(sections as any).student1 || "—"}</span></div>
                            <div><span className="text-muted-foreground text-[10px] uppercase font-black block mb-0.5">Student 2</span><span className="font-medium">{(sections as any).student2 || "—"}</span></div>
                         </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-border/50 rounded-2xl p-6 bg-muted/20 text-sm whitespace-pre-wrap font-mono leading-relaxed">{viewMonthlyReport.content}</div>
                  )}
                  
                  <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                    {canManage && !viewMonthlyReport.is_read && (
                      <Button className="h-11 rounded-xl px-6 font-bold" onClick={() => markAsRead(viewMonthlyReport, 'monthly')}>
                        Mark as Read
                      </Button>
                    )}
                    <Button variant="outline" className="h-11 rounded-xl px-6 font-bold gap-2" onClick={() => handleDownload(viewMonthlyReport)}>
                      <Download className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </div>
              );
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* View General Report Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0">
          <div className="p-6 border-b border-border/20 bg-primary/5 sticky top-0 z-20 backdrop-blur-xl">
            <DialogTitle className="font-serif text-2xl font-black text-primary flex items-center gap-3">
              <FileText className="h-6 w-6 shrink-0" />
              <span className="truncate pr-4">{viewReport?.title}</span>
            </DialogTitle>
            {viewReport && (
              <div className="flex flex-wrap items-center gap-3 mt-3">
                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-background/50">{viewReport.period_month_display} {viewReport.period_year}</Badge>
                <Badge variant={viewReport.status === "published" ? "default" : "outline"} className="text-[10px] uppercase font-black tracking-widest">{viewReport.status}</Badge>
                {viewReport.forwarded_to && <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-blue-500/10 text-blue-600 border-blue-500/20"><Send className="h-3 w-3 mr-1"/> Fwd: {viewReport.forwarded_to.replace(/_/g, " ")}</Badge>}
                <span className="text-xs font-medium text-muted-foreground ml-auto">By {viewReport.author_name} • {viewReport.owner_role?.replace(/_/g, " ")}</span>
              </div>
            )}
          </div>
          <div className="p-6 sm:p-8">
            {viewReport && (
              <div className="space-y-8">
                <div className="rounded-2xl border border-border/50 bg-card p-6 sm:p-10 shadow-sm min-h-[500px]">
                  <BlockNoteRenderer data={viewReport.content} />
                </div>
                 <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                  {canManage && !viewReport.is_read && (
                    <Button className="h-11 rounded-xl px-6 font-bold" onClick={() => markAsRead(viewReport, 'general')}>
                      Mark as Read
                    </Button>
                  )}
                  <Button variant="outline" className="h-11 rounded-xl px-6 font-bold gap-2" onClick={() => handleDownload(viewReport)}>
                    <Download className="h-4 w-4" /> Download PDF
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
