import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle, Search, XCircle, ExternalLink, Clock,
  User, Calendar, Pencil, Save, X, Trash2, Send, ShieldCheck, Eye, Download
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { analyzeVoice } from "@/lib/moderation";
import DocumentViewer from "@/components/portal/DocumentViewer";

interface Voice {
  id: string; title: string; category: string; description: string;
  status: "Pending" | "Approved" | "Rejected";
  submitted_by: string | null; submitted_class: string | null;
  file: string | null; file_url: string | null;
  comments: string | null; created_at: string; rejected_at: string | null;
  evaluated_by_name: string | null; evaluated_by_office: string | null;
  is_forwarded_to_patron?: boolean;
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

/** Returns days remaining before a rejected submission is auto-deleted. */
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

  // Edit state
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState<"Pending" | "Approved" | "Rejected">("Pending");
  const [editComments, setEditComments] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete state
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Viewer state
  const [viewerDoc, setViewerDoc] = useState<{ url: string; title: string } | null>(null);

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

  const handleToggleForward = async () => {
    if (!selected) return;
    const newState = !selected.is_forwarded_to_patron;
    try {
      await api.patch(`/student-voices/${selected.id}/`, {
        is_forwarded_to_patron: newState
      });
      toast.success(newState ? "Forwarded to Patron" : "Forwarding revoked");
      setSelected({ ...selected, is_forwarded_to_patron: newState });
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
    // Patron Access Restriction
    const isPatron = roles.includes("patron") && !roles.includes("adminabsolute");
    if (isPatron && !v.is_forwarded_to_patron) return false;

    // Smart Tone Filter
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
      <div>
        <h1 className="font-serif text-xl font-bold sm:text-2xl">Student Voices</h1>
        <p className="text-sm text-muted-foreground">Review and evaluate submissions.</p>
      </div>

      {/* Status filter tabs */}
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

      {/* Secondary Tone Filter row — Hidden from Patron */}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title, category or student..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {loading ? (
        <p className="text-center py-8 text-muted-foreground animate-pulse italic">Loading discussions...</p>
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
                      {/* Tone Indicator */}
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
                      <Badge variant={statusVariant(v.status)} className="text-[10px] flex items-center gap-1 shrink-0">
                        {statusIcon(v.status)} {v.status}
                      </Badge>
                      {v.is_forwarded_to_patron && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] flex items-center gap-1 shrink-0">
                          <ShieldCheck className="h-3 w-3" /> Forwarded
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{v.description}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {v.submitted_by || "Anonymous"}{v.submitted_class ? ` · ${v.submitted_class}` : ""}
                      </div>
                      <span className="opacity-50">|</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(v.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      {(v.file_url || v.file) && (
                        <>
                          <span className="opacity-50">|</span>
                          <span className="flex items-center gap-1 text-primary lowercase font-bold tracking-tighter">
                            <Eye className="h-3 w-3" /> Attachment
                          </span>
                        </>
                      )}
                    </div>
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

      {/* Detail / Edit Modal */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeModal(); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto border-none shadow-2xl">
          {selected && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="outline" className="text-[10px]">{selected.category}</Badge>
                  <Badge variant={statusVariant(selected.status)} className="text-[10px] flex items-center gap-1">
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
                  {/* Modal Tone info */}
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
                /* ── View mode ── */
                <div className="space-y-4 pt-1">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground bg-stone-50 p-4 rounded-xl border border-stone-100 italic">
                      "{selected.description}"
                    </p>
                  </div>

                  {(selected.file_url || selected.file) && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-bold truncate">Attachment Found</p>
                         <p className="text-[10px] text-muted-foreground">Council Document / Proof</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-primary hover:bg-primary/10 gap-1.5"
                          onClick={() => setViewerDoc({ 
                            url: selected.file_url || selected.file || "#", 
                            title: `Attachment - ${selected.title}` 
                          })}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => {
                            const a = document.createElement("a");
                            a.href = selected.file_url || selected.file || "#";
                            a.download = `Attachment_${selected.id}`;
                            a.click();
                          }}
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {selected.comments && (
                    <div className="rounded-xl bg-slate-50 px-3 py-2.5 border border-slate-100">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Council Comment
                        {selected.evaluated_by_office && (
                          <span className="ml-1 normal-case font-normal">
                            — from{" "}
                            <span className="font-semibold text-foreground text-primary">
                              {selected.evaluated_by_office
                                .split("_")
                                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                                .join(" ")}
                            </span>
                          </span>
                        )}
                      </p>
                      <p className="text-xs italic text-slate-700 leading-relaxed">"{selected.comments}"</p>
                    </div>
                  )}

                  {/* Actions row — Edit + Delete + Forward */}
                  <div className="flex flex-col gap-3 border-t pt-3">
                    <div className="flex items-center justify-between gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 h-9" onClick={startEdit}>
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Button>
                      <div className="flex items-center gap-2">
                        {confirmDelete && (
                          <span className="text-[10px] text-destructive font-bold uppercase tracking-tighter">Confirm delete?</span>
                        )}
                        <Button
                          variant={confirmDelete ? "destructive" : "outline"}
                          size="sm"
                          className="gap-1.5 h-9"
                          disabled={deleting}
                          onClick={handleDelete}
                          onBlur={() => setConfirmDelete(false)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {deleting ? "Deleting..." : confirmDelete ? "Yes, Delete" : "Delete"}
                        </Button>
                      </div>
                    </div>

                    {hasAnyRole(["chairperson", "general_secretary", "assistant_general_secretary"]) && (
                      <Button 
                        variant={selected.is_forwarded_to_patron ? "destructive" : "default"} 
                        className="w-full gap-2 border-stone-200 shadow-sm" 
                        size="sm"
                        onClick={handleToggleForward}
                      >
                        <Send className="h-4 w-4" /> 
                        {selected.is_forwarded_to_patron ? "Revoke Forwarding to Patron" : "Forward to School Patron"}
                      </Button>
                    )}
                  </div>

                  {/* Evaluate — only for Pending */}
                  {selected.status === "Pending" && (
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Evaluation Session</p>
                      <Textarea
                        placeholder="Add a comment (optional)..."
                        rows={3}
                        className="text-sm bg-muted/20"
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                      />
                      <div className="flex gap-2 pt-1">
                        <Button
                          className="flex-1 gap-1.5 h-10 shadow-lg"
                          disabled={evaluating}
                          onClick={() => handleEvaluate("Approved")}
                        >
                          <CheckCircle className="h-4 w-4" />
                          {evaluating ? "Saving..." : "Approve Voice"}
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 gap-1.5 h-10 text-destructive border-destructive/40 hover:bg-destructive/10"
                          disabled={evaluating}
                          onClick={() => handleEvaluate("Rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                          {evaluating ? "Saving..." : "Reject Voice"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* ── Edit mode: status + comment only ── */
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
                    <Button className="flex-1 gap-1.5 h-10" disabled={saving} onClick={handleSaveEdit}>
                      <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="outline" className="gap-1.5 h-10" onClick={() => setEditing(false)}>
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
        isOpen={!!viewerDoc} 
        onClose={() => setViewerDoc(null)} 
        fileUrl={viewerDoc?.url || null} 
        title={viewerDoc?.title || ""} 
      />
    </div>
  );
}
