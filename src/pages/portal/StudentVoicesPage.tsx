import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle, Search, XCircle, ExternalLink, Clock,
  User, Calendar, Pencil, Save, X, Trash2, Send, ShieldCheck, FileText,
  MessageSquare, Sparkles, AlertTriangle, ShieldAlert
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { analyzeVoice } from "@/lib/moderation";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { format } from "date-fns";
import DocumentViewer from "@/components/portal/DocumentViewer";
import { notifyRole } from "@/hooks/useNotify";
import { motion, AnimatePresence } from "framer-motion";

interface Voice {
  id: string; title: string; category: string; description: string;
  status: "Pending" | "Approved" | "Rejected";
  submitted_by: string | null; submitted_class: string | null;
  file: string | null; file_url: string | null;
  comments: string | null; created_at: string; rejected_at: string | null;
  evaluated_by_name: string | null; evaluated_by_office: string | null;
  is_forwarded_to_patron?: boolean;
  pending_chairperson_approval?: boolean;
}

type StatusFilter = "All" | "Pending" | "Approved" | "Rejected";
const STATUS_FILTERS: StatusFilter[] = ["All", "Pending", "Approved", "Rejected"];

type ToneFilter = "All" | "Safe" | "Flagged";
const TONE_FILTERS: ToneFilter[] = ["All", "Safe", "Flagged"];

const statusVariant = (s: string) =>
  s === "Approved" ? "default" : s === "Rejected" ? "destructive" : "secondary";

const statusIcon = (s: string) => {
  if (s === "Approved") return <CheckCircle className="h-3 w-3" />;
  if (s === "Rejected") return <XCircle className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
};

function daysUntilDeletion(rejectedAt: string | null): number | null {
  if (!rejectedAt) return null;
  const d = new Date(rejectedAt);
  const deleteOn = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
  const diff = Math.ceil((deleteOn.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function StudentVoicesPage() {
  const { user, roles, hasPermission } = useAuth();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [toneFilter, setToneFilter] = useState<ToneFilter>("All");
  const [selected, setSelected] = useState<Voice | null>(null);
  const [comment, setComment] = useState("");
  const [evaluating, setEvaluating] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const [editComments, setEditComments] = useState("");
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFooterText, setExportFooterText] = useState("ANOINTED TO BEAR FRUIT");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchVoices = async () => {
    try {
      const { data } = await api.get("/student-voices/");
      setVoices(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load submissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVoices(); }, []);

  const openModal = (v: Voice) => {
    setSelected(v);
    setComment("");
    setEditing(false);
  };

  const closeModal = () => {
    setSelected(null);
    setComment("");
    setEditing(false);
    setConfirmDelete(false);
  };

  const handleDelete = async () => {
    if (!selected) return;
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setDeleting(true);
    try {
      await api.delete(`/student-voices/${selected.id}/`);
      toast.success("Submission deleted");
      closeModal();
      fetchVoices();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete submission");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const startEdit = () => {
    if (!selected) return;
    setEditStatus(selected.status);
    setEditComments(selected.comments || "");
    setEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await api.patch(`/student-voices/${selected.id}/`, {
        status: editStatus,
        comments: editComments || null,
      });
      toast.success("Submission updated");
      setEditing(false);
      closeModal();
      fetchVoices();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluate = async (status: "Approved" | "Rejected") => {
    if (!user || !selected) return;
    setEvaluating(true);
    try {
      await api.patch(`/student-voices/${selected.id}/`, {
        status,
        comments: comment || null,
      });
      toast.success(`Submission ${status.toLowerCase()}`);
      closeModal();
      fetchVoices();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error evaluating submission");
    } finally {
      setEvaluating(false);
    }
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF();
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

    await Promise.all([
      addImageToDoc(mengoBadge, 15, 10, 20, 20, "JPEG"),
      addImageToDoc(unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
    ]);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    doc.text("VINE STUDENTS' COUNCIL BODY", pageW / 2, y, { align: "center" });
    y += 10; doc.setFontSize(12);
    doc.text("STUDENT VOICES & SUBMISSIONS REPORT", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 15, y);
    doc.text(`Total Submissions: ${filtered.length}`, pageW - 40, y);
    y += 10;

    doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`Applied Filters: Status(${statusFilter}), Tone(${toneFilter})`, 15, y);
    doc.setTextColor(0, 0, 0);
    y += 8;

    filtered.forEach((v, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFillColor(245, 245, 245); doc.rect(15, y, pageW - 30, 7, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(`${idx + 1}. ${v.title.toUpperCase()}`, 17, y + 4.5);
      y += 8;

      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(v.description, pageW - 40);
      doc.text(descLines, 20, y);
      y += (descLines.length * 4) + 3;

      doc.text(`Category: ${v.category} | Status: ${v.status} | From: ${v.submitted_by || "Anonymous"} (${v.submitted_class || "N/A"})`, 20, y);
      y += 5;
      if (v.comments) {
        doc.setFont("helvetica", "italic");
        doc.text(`Council Response: ${v.comments.substring(0, 80)}${v.comments.length > 80 ? '...' : ''}`, 20, y);
        doc.setFont("helvetica", "normal");
        y += 5;
      }
      y += 5;
    });

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(exportFooterText, pageW / 2, 285, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("Voices report preview generated!");
  };

  const canApproveForward = hasPermission("approve_voice_forwarding");
  const canRequestForward = hasPermission("request_voice_forwarding");
  const canManage = hasPermission("manage_student_voices");

  const handleRequestForward = async () => {
    if (!selected) return;
    try {
      await api.patch(`/student-voices/${selected.id}/`, {
        pending_chairperson_approval: true
      });
      toast.success("Forwarding request sent to Chairperson for approval");
      notifyRole("chairperson", "Voice Forwarding Request", `A request to forward "${selected.title}" to the Patron requires your approval.`, "warning");
      setSelected({ ...selected, pending_chairperson_approval: true });
      fetchVoices();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const handleApproveForward = async () => {
    if (!selected) return;
    try {
      await api.patch(`/student-voices/${selected.id}/`, {
        is_forwarded_to_patron: true,
        pending_chairperson_approval: false
      });
      toast.success("Approved & forwarded to Patron");
      notifyRole("patron", "New Student Voice Forwarded", `The Chairperson has forwarded a student voice: "${selected.title}" for your review.`, "info");
      setSelected({ ...selected, is_forwarded_to_patron: true, pending_chairperson_approval: false });
      fetchVoices();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const handleRevokeForward = async () => {
    if (!selected) return;
    try {
      await api.patch(`/student-voices/${selected.id}/`, {
        is_forwarded_to_patron: false,
        pending_chairperson_approval: false
      });
      toast.success("Forwarding revoked");
      setSelected({ ...selected, is_forwarded_to_patron: false, pending_chairperson_approval: false });
      fetchVoices();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  const counts: Record<StatusFilter, number> = {
    All: voices.length,
    Pending: voices.filter(v => v.status === "Pending").length,
    Approved: voices.filter(v => v.status === "Approved").length,
    Rejected: voices.filter(v => v.status === "Rejected").length,
  };

  const filtered = voices.filter(v => {
    const isPatron = roles.includes("patron") && !roles.includes("adminabsolute");
    if (isPatron && !v.is_forwarded_to_patron) return false;

    if (toneFilter !== "All") {
      const { status } = analyzeVoice(v.title, v.description);
      if (status !== toneFilter) return false;
    }

    const matchesStatus = statusFilter === "All" || v.status === statusFilter;
    const matchesSearch =
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      (v.submitted_by || "").toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 relative"
    >
      <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Header Section */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider"
          >
            <MessageSquare className="w-3 h-3" /> Voice Submissions
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Student Voices
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Review, evaluate, and action on submissions from the student body. Ensure all concerns are addressed with clarity and precision.
          </p>
        </div>
        
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl gap-2 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow" disabled={filtered.length === 0}>
              <FileText className="h-4 w-4" /> Export Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md rounded-3xl border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Export Voices Report</DialogTitle>
              <DialogDescription>Customize your report footer before downloading.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="footerText" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Footer Slogan</label>
                <Input 
                  id="footerText" 
                  className="bg-muted/50 border-border/50 focus-visible:ring-primary/20 rounded-xl"
                  value={exportFooterText} 
                  onChange={e => setExportFooterText(e.target.value)} 
                  placeholder="e.g. ANOINTED TO BEAR FRUIT"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
              <Button variant="outline" className="rounded-xl" onClick={() => setIsExportOpen(false)}>Cancel</Button>
              <Button className="rounded-xl font-bold" onClick={generatePDFReport}>View Preview</Button>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {/* Filters & Search */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="bg-muted/50 p-1 rounded-2xl flex gap-1 border border-border/50">
                {STATUS_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all
                      ${statusFilter === f
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                  >
                    {f}
                    <span className={`rounded-lg px-2 py-0.5 text-[10px] font-black
                      ${statusFilter === f ? "bg-primary/10 text-primary" : "bg-border/50 text-muted-foreground"}`}>
                      {counts[f]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search voices..."
                className="pl-9 bg-muted/30 border-border/50 rounded-2xl focus-visible:ring-primary/20"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {!hasPermission("manage_home_layout") && (
            <div className="flex items-center gap-3 py-2.5 px-4 border border-indigo-500/20 rounded-2xl bg-indigo-500/5">
              <Sparkles className="h-4 w-4 text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Smart Tone Analysis:</span>
              <div className="flex gap-1.5">
                {TONE_FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => setToneFilter(f)}
                    className={`text-[10px] font-bold uppercase tracking-wider transition-all px-3 py-1 rounded-xl
                      ${toneFilter === f ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20"}`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-lg" />
          </motion.div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-border/40 rounded-3xl backdrop-blur-xl">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-foreground">No voices found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {filtered.map((v) => {
              const days = daysUntilDeletion(v.rejected_at);
              const { status: toneStatus, reason } = analyzeVoice(v.title, v.description);
              
              return (
                <motion.div key={v.id} variants={itemVariants} layout initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}>
                  <Card
                    className="h-full border-border/40 bg-card/40 backdrop-blur-xl hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer group rounded-3xl overflow-hidden relative flex flex-col"
                    onClick={() => openModal(v)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-background/40 to-background/10 group-hover:bg-transparent transition-colors z-0" />
                    
                    <CardContent className="p-6 relative z-10 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-2 flex-wrap min-w-0">
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-background/80 border-border/50 shadow-sm shrink-0">
                            {v.category}
                          </Badge>
                          {toneStatus === "Flagged" && (
                            <Badge variant="destructive" className="text-[9px] uppercase font-black tracking-widest border-none shadow-sm gap-1 shrink-0 bg-rose-500">
                              <ShieldAlert className="h-3 w-3" /> Flagged
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge 
                            className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1 shadow-sm border-none ${
                              v.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' :
                              v.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {statusIcon(v.status)} {v.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-serif font-bold text-foreground leading-tight group-hover:text-primary transition-colors mb-2 line-clamp-2">
                        {v.title}
                      </h3>
                      
                      <p className="text-sm text-muted-foreground/80 leading-relaxed line-clamp-3 mb-6 flex-1">
                        {v.description}
                      </p>
                      
                      <div className="mt-auto space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-foreground truncate">{v.submitted_by || "Anonymous"}</p>
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> {new Date(v.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                              {v.submitted_class && ` • ${v.submitted_class}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {v.is_forwarded_to_patron && (
                            <Badge className="bg-blue-500/10 text-blue-600 border-none text-[9px] uppercase font-black tracking-widest flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" /> Forwarded
                            </Badge>
                          )}
                          {v.pending_chairperson_approval && !v.is_forwarded_to_patron && (
                            <Badge className="bg-indigo-500/10 text-indigo-600 border-none text-[9px] uppercase font-black tracking-widest flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Pending Chair
                            </Badge>
                          )}
                          {days !== null && (
                            <span className={`text-[10px] font-bold uppercase tracking-widest ml-auto ${days <= 7 ? "text-rose-500" : "text-muted-foreground"}`}>
                              Del in {days}d
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Detail Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl p-0">
          {selected && (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border/20 bg-muted/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <MessageSquare className="h-32 w-32" />
                </div>
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-background/80">{selected.category}</Badge>
                    <Badge 
                      className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1 border-none ${
                        selected.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600' :
                        selected.status === 'Rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {statusIcon(selected.status)} {selected.status}
                    </Badge>
                    {selected.is_forwarded_to_patron && (
                      <Badge className="bg-blue-500/10 text-blue-600 border-none text-[10px] uppercase font-black tracking-widest flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> {roles.includes("patron") ? "Forwarded by Council" : "Forwarded to Patron"}
                      </Badge>
                    )}
                  </div>
                  
                  <DialogTitle className="font-serif text-3xl font-black leading-tight text-foreground pr-8">
                    {selected.title}
                  </DialogTitle>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{selected.submitted_by || "Anonymous"}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {new Date(selected.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                        {selected.submitted_class && ` • ${selected.submitted_class}`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {(() => {
                  const { status, reason } = analyzeVoice(selected.title, selected.description);
                  return status === "Flagged" && (
                    <div className="w-full p-4 bg-rose-500/10 text-rose-600 border border-rose-500/20 rounded-2xl flex items-start gap-3 shadow-inner">
                      <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest mb-1">Flagged Issue Detected</p>
                        <p className="text-sm font-medium">{reason}</p>
                      </div>
                    </div>
                  );
                })()}

                {!editing ? (
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1"><FileText className="h-3 w-3"/> Description</p>
                      <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                        {selected.description}
                      </div>
                    </div>

                    {(selected.file_url || selected.file) && (
                      <a
                        href={selected.file_url || selected.file || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 font-bold text-xs transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" /> View Attached Evidence
                      </a>
                    )}

                    {selected.comments && (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400 mb-2 flex items-center gap-1.5">
                          <CheckCircle className="h-3.5 w-3.5" /> Council Evaluation
                          {selected.evaluated_by_office && (
                            <span className="opacity-70 normal-case font-bold tracking-normal">— {selected.evaluated_by_office.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}</span>
                          )}
                        </p>
                        <p className="text-sm italic font-medium text-indigo-950 dark:text-indigo-100">{selected.comments}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                        <Button variant="outline" size="sm" className="gap-2 rounded-xl" onClick={startEdit} disabled={!canManage}>
                          <Pencil className="h-4 w-4" /> Edit Record
                        </Button>
                        <div className="flex items-center gap-3">
                          {confirmDelete && <span className="text-xs text-rose-500 font-bold uppercase tracking-wider animate-pulse">Confirm delete?</span>}
                          <Button
                            variant={confirmDelete ? "destructive" : "secondary"}
                            size="sm"
                            className="gap-2 rounded-xl"
                            disabled={deleting || !canManage}
                            onClick={handleDelete}
                            onBlur={() => setConfirmDelete(false)}
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleting ? "Deleting..." : confirmDelete ? "Yes, Delete" : "Delete"}
                          </Button>
                        </div>
                      </div>

                      {canApproveForward && (
                        <div className="space-y-2 mt-2">
                          {selected.pending_chairperson_approval && !selected.is_forwarded_to_patron && (
                            <div className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4" /> A councillor has requested this be forwarded to the Patron. Review required.
                              </p>
                            </div>
                          )}
                          {selected.is_forwarded_to_patron ? (
                            <Button variant="destructive" className="w-full gap-2 rounded-xl py-5" onClick={handleRevokeForward}>
                              <Send className="h-4 w-4" /> Revoke Forwarding to Patron
                            </Button>
                          ) : (
                            <Button className="w-full gap-2 rounded-xl py-5 shadow-lg shadow-primary/20" onClick={handleApproveForward}>
                              <Send className="h-4 w-4" /> Approve & Forward to Patron
                            </Button>
                          )}
                        </div>
                      )}

                      {canRequestForward && !canApproveForward && (
                        <div className="mt-2">
                          {selected.is_forwarded_to_patron ? (
                            <div className="w-full p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Forwarded to Patron by Chairperson</p>
                            </div>
                          ) : selected.pending_chairperson_approval ? (
                            <div className="w-full p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-2"><Clock className="h-4 w-4" /> Awaiting Chairperson approval to forward</p>
                            </div>
                          ) : (
                            <Button variant="outline" className="w-full gap-2 rounded-xl py-5 border-blue-500/20 text-blue-600 hover:bg-blue-500/10" onClick={handleRequestForward}>
                              <Send className="h-4 w-4" /> Request Forwarding to Patron
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {selected.status === "Pending" && (
                      <div className="space-y-3 pt-6 border-t border-border/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1"><Pencil className="h-3 w-3"/> Evaluation</p>
                        <Textarea
                          placeholder="Add your council evaluation notes..."
                          rows={3}
                          className="text-sm bg-muted/30 border-border/50 focus-visible:ring-primary/20 rounded-xl resize-none"
                          value={comment}
                          onChange={e => setComment(e.target.value)}
                        />
                        <div className="flex gap-3">
                          <Button className="flex-1 gap-2 rounded-xl py-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20" disabled={evaluating} onClick={() => handleEvaluate("Approved")}>
                            <CheckCircle className="h-4 w-4" /> {evaluating ? "Saving..." : "Approve"}
                          </Button>
                          <Button variant="outline" className="flex-1 gap-2 rounded-xl py-5 text-rose-600 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50" disabled={evaluating} onClick={() => handleEvaluate("Rejected")}>
                            <XCircle className="h-4 w-4" /> {evaluating ? "Saving..." : "Reject"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/50 space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="voice-status" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</label>
                        <select
                          id="voice-status"
                          className="w-full rounded-xl border border-border/50 bg-background px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none"
                          value={editStatus}
                          onChange={e => setEditStatus(e.target.value as "Pending" | "Approved" | "Rejected")}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Council Comment</label>
                        <Textarea className="bg-background rounded-xl" rows={3} placeholder="Optional notes..." value={editComments} onChange={e => setEditComments(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button className="flex-1 gap-2 rounded-xl shadow-lg shadow-primary/20" disabled={saving} onClick={handleSaveEdit}>
                        <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button variant="outline" className="gap-2 rounded-xl" onClick={() => setEditing(false)}>
                        <X className="h-4 w-4" /> Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <DocumentViewer 
        isOpen={!!previewUrl} 
        onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} 
        fileUrl={previewUrl} 
        title={`Student Voices Report`} 
        type="pdf"
      />
    </motion.div>
  );
}
