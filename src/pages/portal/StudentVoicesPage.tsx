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
  User, Calendar, Pencil, Save, X, Trash2, Send, ShieldCheck, FileText
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
import { notifyRole, notifyUser } from "@/hooks/useNotify";

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

export default function StudentVoicesPage() {
  const { user, roles, hasAnyRole } = useAuth();
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

  const isChairperson = hasAnyRole(["chairperson"]);

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
    <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl">Student Voices</h1>
          <p className="text-sm text-muted-foreground">Review and evaluate submissions.</p>
        </div>
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={filtered.length === 0}>
              <FileText className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Voices Report</DialogTitle>
              <DialogDescription>Customize your report footer before downloading.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="footerText" className="text-xs font-bold uppercase text-muted-foreground">Document Footer Slogan</label>
                <Input 
                  id="footerText" 
                  value={exportFooterText} 
                  onChange={e => setExportFooterText(e.target.value)} 
                  placeholder="e.g. ANOINTED TO BEAR FRUIT"
                />
              </div>
            </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
                <Button onClick={generatePDFReport}>View Preview</Button>
              </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f}
            onClick={() => setStatusFilter(f)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors
              ${statusFilter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background text-muted-foreground hover:text-foreground border-border"
              }`}
          >
            {f}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold
              ${statusFilter === f ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {!roles.includes("patron") || roles.includes("adminabsolute") ? (
        <div className="flex items-center gap-4 py-1.5 px-3 border border-dashed rounded-lg bg-muted/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-1">Smart Tone:</span>
          <div className="flex gap-2">
            {TONE_FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setToneFilter(f)}
                className={`text-[10px] font-semibold transition-opacity px-2 py-0.5 rounded
                  ${toneFilter === f ? "bg-primary/10 text-primary" : "opacity-50 hover:opacity-100"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title, category or student..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground animate-pulse">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No submissions found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => {
            const days = daysUntilDeletion(v.rejected_at);
            return (
              <Card
                key={v.id}
                className="cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-border active:scale-[0.99]"
                onClick={() => openModal(v)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <Badge variant="outline" className="text-[10px] shrink-0">{v.category}</Badge>
                      <span className="text-sm font-medium truncate">{v.title}</span>
                      {(() => {
                        const { status, reason } = analyzeVoice(v.title, v.description);
                        return (
                          <Badge variant={status === "Safe" ? "secondary" : "destructive"} className="text-[9px] h-4 scale-90 px-1 border-none bg-stone-100 dark:bg-stone-800">
                            {status === "Safe" ? <span className="text-green-600">● Safe</span> : <span title={reason || ""}>⚠ Flagged</span>}
                          </Badge>
                        );
                      })()}
                    </div>
                    <div className="flex items-center gap-1">
                      <Badge variant={statusVariant(v.status) as any} className="text-[10px] flex items-center gap-1 shrink-0">
                        {statusIcon(v.status)} {v.status}
                      </Badge>
                      {v.is_forwarded_to_patron && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] flex items-center gap-1 shrink-0">
                          <ShieldCheck className="h-3 w-3" /> Forwarded
                        </Badge>
                      )}
                      {v.pending_chairperson_approval && !v.is_forwarded_to_patron && (
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] flex items-center gap-1 shrink-0">
                          <Clock className="h-3 w-3" /> Pending Approval
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{v.description}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                      <User className="h-3 w-3" />
                      {v.submitted_by || "Anonymous"}{v.submitted_class ? ` · ${v.submitted_class}` : ""}
                      <span className="mx-0.5">·</span>
                      <Calendar className="h-3 w-3" />
                      {new Date(v.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {days !== null && (
                      <span className={`text-[10px] font-medium ${days <= 7 ? "text-destructive" : "text-muted-foreground"}`}>
                        🗑 Auto-deletes in {days}d
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-[10px]">{selected.category}</Badge>
                  <Badge variant={statusVariant(selected.status) as any} className="text-[10px] flex items-center gap-1">
                    {statusIcon(selected.status)} {selected.status}
                  </Badge>
                  {selected.is_forwarded_to_patron && (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> {roles.includes("patron") ? "Forwarded by Council" : "Forwarded to Patron"}
                    </Badge>
                  )}
                  {daysUntilDeletion(selected.rejected_at) !== null && (
                    <span className={`text-[10px] font-medium ${(daysUntilDeletion(selected.rejected_at) ?? 31) <= 7 ? "text-destructive" : "text-muted-foreground"}`}>
                      🗑 Auto-deletes in {daysUntilDeletion(selected.rejected_at)}d
                    </span>
                  )}
                  {(() => {
                    const { status, reason } = analyzeVoice(selected.title, selected.description);
                    return status === "Flagged" && (
                      <div className="w-full mt-1.5 p-2 bg-destructive/5 text-destructive border border-destructive/20 rounded-md flex items-center gap-2">
                        <span className="text-xs font-bold uppercase">FLAGGED ISSUE:</span>
                        <span className="text-xs">{reason}</span>
                      </div>
                    );
                  })()}
                </div>
                <DialogTitle className="font-serif text-lg leading-snug">{selected.title}</DialogTitle>
                <DialogDescription className="flex items-center gap-1 text-xs flex-wrap">
                  <User className="h-3 w-3" />
                  {selected.submitted_by || "Anonymous"}{selected.submitted_class ? ` · ${selected.submitted_class}` : ""}
                  <span className="mx-0.5">·</span>
                  <Calendar className="h-3 w-3" />
                  {new Date(selected.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                </DialogDescription>
              </DialogHeader>

              {!editing ? (
                <div className="space-y-4 pt-1">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.description}</p>
                  </div>

                  {(selected.file_url || selected.file) && (
                    <a
                      href={selected.file_url || selected.file || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View Attachment
                    </a>
                  )}

                  {selected.comments && (
                    <div className="rounded-md bg-muted px-3 py-2.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Council Comment
                        {selected.evaluated_by_office && (
                          <span className="ml-1 normal-case font-normal">
                            — from{" "}
                            <span className="font-semibold text-foreground">
                              {selected.evaluated_by_office
                                .split("_")
                                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                            </span>
                          </span>
                        )}
                      </p>
                      <p className="text-xs italic">{selected.comments}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 border-t pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={startEdit}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <div className="flex items-center gap-2">
                        {confirmDelete && (
                          <span className="text-xs text-destructive font-medium">Confirm delete?</span>
                        )}
                        <Button
                          variant={confirmDelete ? "destructive" : "outline"}
                          size="sm"
                          className="gap-1.5"
                          disabled={deleting}
                          onClick={handleDelete}
                          onBlur={() => setConfirmDelete(false)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deleting ? "Deleting..." : confirmDelete ? "Yes, Delete" : "Delete"}
                        </Button>
                      </div>
                    </div>

                    {isChairperson && (
                      <>
                        {selected.pending_chairperson_approval && !selected.is_forwarded_to_patron && (
                          <div className="w-full p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-md mb-1">
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">⏳ A councillor has requested this be forwarded to the Patron. Please review and approve.</p>
                          </div>
                        )}
                        {selected.is_forwarded_to_patron ? (
                          <Button variant="destructive" className="w-full gap-2" size="sm" onClick={handleRevokeForward}>
                            <Send className="h-4 w-4" /> Revoke Forwarding to Patron
                          </Button>
                        ) : (
                          <Button variant="default" className="w-full gap-2" size="sm" onClick={handleApproveForward}>
                            <Send className="h-4 w-4" /> Approve & Forward to School Patron
                          </Button>
                        )}
                      </>
                    )}

                    {hasAnyRole(["general_secretary", "assistant_general_secretary"]) && !isChairperson && (
                      <>
                        {selected.is_forwarded_to_patron ? (
                          <div className="w-full p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 rounded-md">
                            <p className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Already forwarded to Patron by Chairperson</p>
                          </div>
                        ) : selected.pending_chairperson_approval ? (
                          <div className="w-full p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-md">
                            <p className="text-xs text-blue-700 dark:text-blue-300 font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Awaiting Chairperson approval to forward</p>
                          </div>
                        ) : (
                          <Button variant="outline" className="w-full gap-2 border-blue-200 text-blue-700 hover:bg-blue-50" size="sm" onClick={handleRequestForward}>
                            <Send className="h-4 w-4" /> Request Forwarding to Patron
                          </Button>
                        )}
                      </>
                    )}
                  </div>

                  {selected.status === "Pending" && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Evaluate</p>
                      <Textarea
                        placeholder="Add a comment (optional)..."
                        rows={3}
                        className="text-sm"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                      />
                      <div className="flex gap-2 pt-1">
                        <Button
                          className="flex-1 gap-1.5"
                          disabled={evaluating}
                          onClick={() => handleEvaluate("Approved")}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {evaluating ? "Saving..." : "Approve"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-1.5 text-destructive border-destructive/40 hover:bg-destructive/10"
                          disabled={evaluating}
                          onClick={() => handleEvaluate("Rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                          {evaluating ? "Saving..." : "Reject"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label htmlFor="voice-status" className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Status</label>
                    <select
                      id="voice-status"
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as "Pending" | "Approved" | "Rejected")}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Council Comment</label>
                    <Textarea rows={3} placeholder="Optional..." value={editComments} onChange={e => setEditComments(e.target.value)} />
                  </div>
                  <div className="flex gap-2 pt-1 border-t">
                    <Button className="flex-1 gap-1.5" disabled={saving} onClick={handleSaveEdit}>
                      <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" className="gap-1.5" onClick={() => setEditing(false)}>
                      <X className="h-4 w-4" /> Cancel
                    </Button>
                  </div>
                </div>
              )}
            </>
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
    </div>
  );
}
