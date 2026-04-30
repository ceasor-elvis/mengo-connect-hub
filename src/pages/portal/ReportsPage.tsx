import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ClipboardList, Lock, Plus, FileText, Send, Edit3, Trash2,
  Download, CheckCircle, Clock, ChevronDown, ChevronRight, Eye, Settings2, Star, Search,
  Bell, AlertCircle
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
  const [tab, setTab] = useState<"monthly" | "general" | "tracker">(hasClassAndStream ? "monthly" : "general");
  
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
      const res = await api.get("/reports/tracker/");
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
    if (!confirm(`Delete report "${r.title}"?`)) return;
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <ClipboardList className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <p className="text-xs text-muted-foreground">Submit monthly council reports &amp; manage general reports</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border rounded-lg p-1 bg-muted/30 w-fit">
        {hasClassAndStream && (
          <button onClick={() => setTab("monthly")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "monthly" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            My Class Report
          </button>
        )}
        <button onClick={() => setTab("general")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "general" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          Reports Archive
        </button>
        {canManage && (
          <button onClick={() => setTab("tracker")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tab === "tracker" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            Submission Tracker
          </button>
        )}
      </div>

      {/* ─────────────────────────── MONTHLY REPORT TAB ─────────────────────────── */}
      {tab === "monthly" && (
        <div className="space-y-5">
          {/* Status Banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl border ${currentMonthReport
            ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
            : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"}`}>
            {currentMonthReport ? <Lock className="h-5 w-5 text-amber-600 shrink-0" /> : <Clock className="h-5 w-5 text-blue-600 shrink-0" />}
            <div>
              <p className={`text-sm font-semibold ${currentMonthReport ? "text-amber-800 dark:text-amber-400" : "text-blue-800 dark:text-blue-400"}`}>
                {currentMonthReport
                  ? `Report submitted for ${MONTH_NAMES[currentMonth - 1]} ${currentYear} — locked until next month`
                  : `No report yet for ${MONTH_NAMES[currentMonth - 1]} ${currentYear}`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentMonthReport ? "Download your submitted report below." : "Fill in the template sections and submit."}
              </p>
            </div>
          </div>

          {currentMonthReport && (
            <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-card border-dashed space-y-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                 <FileText className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <h3 className="font-bold">{currentMonthReport.title}</h3>
                <p className="text-xs text-muted-foreground">Submitted on {new Date(currentMonthReport.created_at).toLocaleDateString()} at {new Date(currentMonthReport.created_at).toLocaleTimeString()}</p>
              </div>
              <Button onClick={() => handleDownload(currentMonthReport)} className="gap-2">
                <Download className="h-4 w-4" /> Download My Report (PDF)
              </Button>
            </div>
          )}

          {/* Template form (only when no current month report AND user has a class) */}
          {!currentMonthReport && hasClassAndStream && (
            <div className="border rounded-xl bg-card overflow-hidden">

               <MonthlyReportForm 
                  submitTarget="reports" 
                  onSuccess={() => loadMonthly()} 
               />
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────── GENERAL REPORTS ARCHIVE TAB ─────────────────────────── */}
      {tab === "general" && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-start md:items-center bg-muted/20 p-3 rounded-lg border">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9 h-9 text-sm bg-background"
                  placeholder="Search reports..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[110px] h-9 bg-background"><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Years</SelectItem>
                  {[currentYear, currentYear - 1, currentYear - 2].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}
                </SelectContent>
              </Select>
              <Select value={filterMonth} onValueChange={setFilterMonth}>
                <SelectTrigger className="w-[120px] h-9 bg-background"><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Months</SelectItem>
                  {MONTH_NAMES.map((m, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          {canManage && (
            <div className="flex justify-end shrink-0">
              <Dialog open={createOpen} onOpenChange={(o) => {
                setCreateOpen(o);
                if (!o) { 
                  setEditReport(null); setGTitle(""); setGMonth(String(currentMonth)); setGYear(String(currentYear)); setGStatus("draft"); 
                  editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> New General Report</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      {editReport ? "Edit Report" : "New General Report"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Auto-title: </span>
                    {gTitle.trim() || `${roleLabel} Report – ${MONTH_NAMES[Number(gMonth) - 1]} ${gYear}`}
                  </div>
                  <div className="space-y-4 pt-1">
                    <div className="space-y-2">
                      <Label className="text-xs">Title <span className="text-muted-foreground">(leave blank to auto-generate)</span></Label>
                      <Input placeholder="Optional custom title…" value={gTitle} onChange={(e) => setGTitle(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Month</Label>
                        <Select value={gMonth} onValueChange={setGMonth}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{MONTH_NAMES.map((m, i) => (<SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Year</Label>
                        <Select value={gYear} onValueChange={setGYear}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{[currentYear, currentYear - 1, currentYear - 2].map((y) => (<SelectItem key={y} value={String(y)}>{y}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Status</Label>
                      <Select value={gStatus} onValueChange={setGStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Content (Rich Text Editor)</Label>
                      <div className="bg-white text-black min-h-[400px] border rounded-md p-2 overflow-hidden prose-sm max-w-none shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                        <BlockNoteView editor={editor} theme="light" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                      <Button onClick={handleGeneralSave} disabled={gSaving}>
                        {gSaving ? "Saving…" : editReport ? "Update Report" : "Create Report"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
          </div>

          {generalLoading || monthlyLoading ? (
            <div className="text-center py-8 text-muted-foreground text-sm animate-pulse">Loading archive…</div>
          ) : sortedArchiveYears.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-20" />
              Archive is empty.
            </div>
          ) : (
            <div className="space-y-3">
              {sortedArchiveYears.map((year) => (
                <div key={year} className="border rounded-xl overflow-hidden">
                  <button onClick={() => toggleYear(year)}
                    className="w-full flex items-center justify-between px-5 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <span className="font-semibold text-sm">{year} Tracker</span>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{Object.values(combinedReports[year]).flat().length} report(s)</span>
                      {openYears.has(year) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>
                  {openYears.has(year) && (
                    <div className="divide-y relative">
                      {Object.keys(combinedReports[year]).map(Number).sort((a, b) => b - a).map((month) => (
                        <div key={month}>
                          <div className="px-5 py-2 bg-muted/10 text-xs font-semibold text-muted-foreground uppercase tracking-widest sticky top-0 backdrop-blur border-b z-10">
                            {MONTH_NAMES[month - 1]}
                          </div>
                          {combinedReports[year][month].map((r: any) => {
                            const isGeneral = r.__type === 'general';
                            const sections = !isGeneral ? deserializeTemplate(r.content) : null;
                            const preview = !isGeneral && sections
                              ? [sections.classStream, sections.generalPerformance, sections.adminSupport].filter(Boolean).join(" · ").slice(0, 120)
                              : r.content.slice(0, 120);

                            return (
                              <div key={`${r.__type}-${r.id}`} className={`px-5 py-3 flex items-start justify-between gap-4 hover:bg-muted/10 transition-colors ${isGeneral ? "bg-primary/5" : ""}`}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {!r.is_read && canManage && (
                                      <Badge className="text-[9px] bg-red-100 text-red-700 border-red-200 animate-pulse">NEW</Badge>
                                    )}
                                    <span className="font-medium text-sm truncate">{r.title}</span>
                                    {isGeneral ? (
                                      <>
                                        <Badge variant={r.status === "published" ? "default" : "outline"}
                                          className={`text-[10px] ${r.status === "published" ? "bg-green-100 text-green-700 border-green-300" : ""}`}>
                                          {r.status === "published" ? <CheckCircle className="h-2.5 w-2.5 mr-1" /> : null}
                                          {r.status}
                                        </Badge>
                                        <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                          <Star className="h-2.5 w-2.5 mr-1" />General Report
                                        </Badge>
                                        {r.forwarded_to && (
                                          <Badge className="text-[10px] bg-blue-100 text-blue-700 border-blue-300">
                                            <Send className="h-2.5 w-2.5 mr-1" />Forwarded to {r.forwarded_to.replace(/_/g, " ")}
                                          </Badge>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        {r.owner_class && (
                                          <Badge className="text-[10px] bg-secondary/20 text-secondary-foreground border-secondary/30">
                                            {r.owner_class} {r.owner_stream}
                                          </Badge>
                                        )}
                                        {r.is_locked && (
                                          <Badge className="text-[10px] bg-amber-100 text-amber-700 border-amber-300">
                                            <Lock className="h-2.5 w-2.5 mr-1" />Locked
                                          </Badge>
                                        )}
                                      </>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">By {r.author_name} {r.owner_role ? `· ${r.owner_role.replace(/_/g, " ")}` : ""}</p>
                                  {!isGeneral && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{preview}…</p>}
                                </div>
                                <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                  {isGeneral ? (
                                    <>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="View"
                                        onClick={() => { setViewReport(r); setViewOpen(true); }}><Eye className="h-3.5 w-3.5" /></Button>
                                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Download"
                                        onClick={() => handleDownload(r)}><Download className="h-3.5 w-3.5" /></Button>
                                      {canManage && (
                                        <>
                                          {!r.forwarded_to && (
                                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700" title="Forward to Office"
                                              onClick={() => { setForwardTarget(r); setForwardOpen(true); }}><Send className="h-3.5 w-3.5" /></Button>
                                          )}
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit" onClick={() => openEdit(r)}><Edit3 className="h-3.5 w-3.5" /></Button>
                                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive" title="Delete"
                                            onClick={() => handleDelete(r)}><Trash2 className="h-3.5 w-3.5" /></Button>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                                        onClick={() => { setViewMonthlyReport(r); setViewMonthlyOpen(true); }}>
                                        <Eye className="h-3 w-3" /> View
                                      </Button>
                                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => handleDownload(r)}>
                                        <Download className="h-3 w-3" /> Download
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
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────── SUBMISSION TRACKER TAB ─────────────────────────── */}
      {tab === "tracker" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-xl border">
            <div>
              <h2 className="text-sm font-bold">Monthly Submission Tracker</h2>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Status for {MONTH_NAMES[currentMonth - 1]} {currentYear}</p>
            </div>
            <Button size="sm" variant="outline" className="gap-2" 
              onClick={() => { setSelectedMissing(trackerData.filter(t => !t.submitted)); setReminderOpen(true); }}
              disabled={trackerData.filter(t => !t.submitted).length === 0}>
              <Bell className="h-4 w-4" /> Remind All Missing
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {trackerLoading ? (
               Array.from({length: 12}).map((_, i) => (
                 <div key={i} className="h-20 border rounded-xl bg-muted/10 animate-pulse" />
               ))
            ) : trackerData.map((item, idx) => (
              <div key={idx} className={`p-3 rounded-xl border transition-all ${item.submitted ? "bg-green-50/30 border-green-200" : "bg-red-50/30 border-red-200"}`}>
                <div className="flex justify-between items-start mb-2">
                   <span className="text-xs font-bold">{item.class} {item.stream}</span>
                   {item.submitted ? (
                     <CheckCircle className="h-4 w-4 text-green-600" />
                   ) : (
                     <AlertCircle className="h-4 w-4 text-red-600" />
                   )}
                </div>
                {item.submitted ? (
                  <p className="text-[10px] text-green-700 font-medium">Submitted</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-red-700 font-medium italic">Pending</p>
                    <button 
                      onClick={() => { setSelectedMissing([item]); setReminderOpen(true); }}
                      className="text-[9px] text-primary hover:underline text-left w-fit flex items-center gap-1">
                      <Send className="h-2.5 w-2.5" /> Remind Cllr
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!trackerLoading && trackerData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No tracking data available.</div>
          )}
        </div>
      )}

      {/* Reminder Dialog */}
      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-amber-600" />Send Reminders</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-xs text-muted-foreground">
              You are about to remind <strong>{selectedMissing.length}</strong> class(es) to submit their monthly reports.
            </p>
            <div className="space-y-2">
              <Label className="text-xs">Submission Deadline (Optional)</Label>
              <Input 
                placeholder="e.g. Tomorrow 5:00 PM" 
                value={reminderDeadline} 
                onChange={(e) => setReminderDeadline(e.target.value)} 
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setReminderOpen(false)}>Cancel</Button>
              <Button onClick={sendReminders}>Send Notifications</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Forward Dialog */}
      <Dialog open={forwardOpen} onOpenChange={(o) => { setForwardOpen(o); if (!o) { setForwardTarget(null); setForwardTo(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-blue-600" />Forward Report</DialogTitle>
          </DialogHeader>
          {forwardTarget && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground">Forwarding: <strong>{forwardTarget.title}</strong></p>
              <div className="space-y-2">
                <Label className="text-xs">Select Target Office</Label>
                <Select value={forwardTo} onValueChange={setForwardTo}>
                  <SelectTrigger><SelectValue placeholder="Choose office…" /></SelectTrigger>
                  <SelectContent>{ROLE_TARGETS.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setForwardOpen(false)}>Cancel</Button>
                <Button onClick={handleForward} disabled={forwardSending}>
                  {forwardSending ? "Sending…" : "Forward"}<Send className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Monthly Report Dialog (template renderer) */}
      <Dialog open={viewMonthlyOpen} onOpenChange={setViewMonthlyOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {viewMonthlyReport?.title}
            </DialogTitle>
          </DialogHeader>
          {viewMonthlyReport && (() => {
            const sections = deserializeTemplate(viewMonthlyReport.content);
            return (
              <div className="space-y-4">
                <div className="flex gap-2 flex-wrap text-xs">
                  <Badge variant="outline">{viewMonthlyReport.period_month_display} {viewMonthlyReport.period_year}</Badge>
                  {viewMonthlyReport.is_locked && <Badge className="bg-amber-100 text-amber-700 border-amber-300"><Lock className="h-2.5 w-2.5 mr-1" />Locked</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">By {viewMonthlyReport.author_name} &bull; {viewMonthlyReport.owner_role?.replace(/_/g, " ")}</p>
                {sections ? (
                  <div className="divide-y border rounded-lg overflow-hidden capitalize">
                    <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Council Name</p><p className="text-sm">{sections.councilName}</p></div>
                    <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Class & Stream</p><p className="text-sm">{sections.classStream}</p></div>
                    <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Class Teacher</p><p className="text-sm">{sections.classTeacher}</p></div>
                    <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">General Performance</p><p className="text-sm whitespace-pre-wrap">{sections.generalPerformance}</p></div>
                    <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">General Challenges</p><p className="text-sm whitespace-pre-wrap">{sections.generalChallenges}</p></div>
                    
                    {(sections as any).challenges && (
                       <div className="px-4 py-3">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Specific Challenges</p>
                         <div className="text-xs space-y-2">
                           {((sections as any).challenges || []).map((c: any, i: number) => (
                             <div key={i} className="border rounded p-2 bg-muted/20">
                               <p><strong>Problem:</strong> {c.description}</p>
                               <p><strong>When:</strong> {c.when}</p>
                               <p><strong>Impact:</strong> {c.impact}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                    )}

                    {(sections as any).solutions && (
                       <div className="px-4 py-3">
                         <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Proposed Solutions</p>
                         <div className="text-xs space-y-2">
                           {((sections as any).solutions || []).map((s: any, i: number) => (
                             <div key={i} className="border rounded p-2 bg-muted/20">
                               <p><strong>Problem:</strong> {s.problem}</p>
                               <p><strong>Solution:</strong> {s.description}</p>
                               <p><strong>Benefit:</strong> {s.benefit}</p>
                             </div>
                           ))}
                         </div>
                       </div>
                    )}

                    <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Admin Support Requests</p><p className="text-sm whitespace-pre-wrap">{sections.adminSupport}</p></div>
                    <div className="px-4 py-3"><p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Positive Highlights</p><p className="text-sm whitespace-pre-wrap">{sections.positiveHighlights}</p></div>
                    
                    <div className="px-4 py-3 bg-muted/30">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-1">Signatories</p>
                       <div className="grid grid-cols-2 gap-2 text-xs">
                          <p><strong>Male Cllr:</strong> {(sections as any).maleCouncillor || "—"}</p>
                          <p><strong>Female Cllr:</strong> {(sections as any).femaleCouncillor || "—"}</p>
                          <p><strong>Monitor:</strong> {(sections as any).monitor || "—"}</p>
                          <p><strong>Monitress:</strong> {(sections as any).monitress || "—"}</p>
                          <p><strong>Student 1:</strong> {(sections as any).student1 || "—"}</p>
                          <p><strong>Student 2:</strong> {(sections as any).student2 || "—"}</p>
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 bg-muted/20 text-sm whitespace-pre-wrap font-mono">{viewMonthlyReport.content}</div>
                )}
                 <div className="flex justify-end gap-2 pt-2">
                  {canManage && !viewMonthlyReport.is_read && (
                    <Button size="sm" variant="default" onClick={() => markAsRead(viewMonthlyReport, 'monthly')}>
                      Mark as Read
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleDownload(viewMonthlyReport)}>
                    <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* View General Report Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />{viewReport?.title}
            </DialogTitle>
          </DialogHeader>
          {viewReport && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap text-xs">
                <Badge variant="outline">{viewReport.period_month_display} {viewReport.period_year}</Badge>
                <Badge variant={viewReport.status === "published" ? "default" : "outline"}>{viewReport.status}</Badge>
                {viewReport.forwarded_to && <Badge className="bg-blue-100 text-blue-700 border-blue-300">Forwarded → {viewReport.forwarded_to.replace(/_/g, " ")}</Badge>}
              </div>
              <div className="text-xs text-muted-foreground">By {viewReport.author_name} · {viewReport.owner_role?.replace(/_/g, " ")}</div>
              <div className="border rounded-lg p-5 bg-card prose-sm max-w-none shadow-sm">
                <BlockNoteRenderer data={viewReport.content} />
              </div>
               <div className="flex justify-end gap-2 pt-2">
                {canManage && !viewReport.is_read && (
                  <Button size="sm" variant="default" onClick={() => markAsRead(viewReport, 'general')}>
                    Mark as Read
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleDownload(viewReport)}>
                  <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
