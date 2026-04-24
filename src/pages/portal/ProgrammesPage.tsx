import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Clock } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { notifyRole } from "@/hooks/useNotify";
import { InteractiveCalendar } from "@/components/calendar/InteractiveCalendar";

interface Programme {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  visibility: 'public' | 'private';
  is_big_event?: boolean;
  created_by: string;
  created_at: string;
}

export default function ProgrammesPage() {
  const { user, hasPermission } = useAuth();
  const { log } = useActivityLog();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [isBigEvent, setIsBigEvent] = useState(false);

  // Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editingProg, setEditingProg] = useState<Programme | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editVisibility, setEditVisibility] = useState<"public" | "private">("public");
  const [editIsBigEvent, setEditIsBigEvent] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const canAdd = hasPermission("manage_programmes");

  const fetchProgrammes = async () => {
    try {
      const { data } = await api.get("/programmes/");
      setProgrammes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load programmes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProgrammes(); }, []);

  const handleAdd = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!user) { toast.error("Login required"); return; }
    setSubmitting(true);
    try {
      await api.post("/programmes/", {
        title: title.trim(),
        description: description.trim() || null,
        date: eventDate || null,
        event_date: eventDate || null,
        visibility,
        is_big_event: isBigEvent,
        created_by: user.id,
      });
      toast.success("Programme added");
      log("added a programme", "programmes", title);
      notifyRole(
        ["general_secretary", "secretary_publicity", "adminabsolute", "chairperson"],
        "New Programme",
        `"${title}" was added as ${visibility} event`,
        "info"
      );
      setTitle(""); setDescription(""); setEventDate("");
      setVisibility("public"); setIsBigEvent(false); setOpen(false);
      fetchProgrammes();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add programme");
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (prog: Programme) => {
    setEditingProg(prog);
    setEditTitle(prog.title);
    setEditDescription(prog.description || "");
    setEditDate(prog.event_date ? prog.event_date.substring(0, 10) : "");
    setEditVisibility(prog.visibility);
    setEditIsBigEvent(prog.is_big_event || false);
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingProg) return;
    if (!editTitle.trim()) { toast.error("Title is required"); return; }
    setEditSubmitting(true);
    try {
      await api.patch(`/programmes/${editingProg.id}/`, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        date: editDate || null,
        event_date: editDate || null,
        visibility: editVisibility,
        is_big_event: editIsBigEvent,
      });
      toast.success("Programme updated");
      log("updated a programme", "programmes", editTitle);
      setEditOpen(false);
      fetchProgrammes();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to update programme");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (id: string, progTitle: string) => {
    try {
      await api.delete(`/programmes/${id}/`);
      toast.success("Programme deleted");
      log("deleted a programme", "programmes", progTitle);
      fetchProgrammes();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete programme");
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
  };

  const ProgrammeCard = ({ p }: { p: Programme }) => (
    <div className="flex items-start justify-between gap-3 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-base leading-tight">{p.title}</h3>
          {p.is_big_event && (
            <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-full border border-amber-500/30">
              Major
            </span>
          )}
          <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${p.visibility === 'private' ? 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'}`}>
            {p.visibility}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{formatDate(p.event_date)}</p>
        {p.description && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{p.description}</p>}
      </div>
      {canAdd && (
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(p)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          {!p.is_big_event && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Programme?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently remove "{p.title}". This cannot be undone.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleDelete(p.id, p.title)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );

  const calendarEvents = programmes.map((p) => ({
    id: p.id,
    title: p.title,
    start: p.event_date ? new Date(p.event_date) : new Date(),
    end: p.event_date ? new Date(p.event_date) : new Date(),
    resource: p,
  }));

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Programmes & Events</h1>
          <p className="text-sm text-muted-foreground">Upcoming and past council programmes.</p>
        </div>
        {canAdd && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Add Programme</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New Programme</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Career Day" /></div>
                <div><Label>Event Date</Label><Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} /></div>
                <div><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Details..." /></div>
                <div>
                  <Label>Visibility</Label>
                  <div className="flex gap-4 mt-1">
                    <label className="flex items-center gap-1.5"><input type="radio" name="visibility" value="public" checked={visibility === "public"} onChange={() => setVisibility("public")} /> Public</label>
                    <label className="flex items-center gap-1.5"><input type="radio" name="visibility" value="private" checked={visibility === "private"} onChange={() => setVisibility("private")} /> Councilor Private</label>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={isBigEvent} onChange={(e) => setIsBigEvent(e.target.checked)} className="rounded border-gray-300 w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Mark as Major Event (Show on Timeline)</span>
                  </label>
                </div>
                <Button onClick={handleAdd} disabled={submitting} className="w-full">{submitting ? "Saving..." : "Add Programme"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Programme</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title *</Label><Input value={editTitle} onChange={e => setEditTitle(e.target.value)} /></div>
            <div><Label>Event Date</Label><Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} /></div>
            <div><Label>Description</Label><Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} /></div>
            <div>
              <Label>Visibility</Label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1.5"><input type="radio" name="edit-visibility" value="public" checked={editVisibility === "public"} onChange={() => setEditVisibility("public")} /> Public</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="edit-visibility" value="private" checked={editVisibility === "private"} onChange={() => setEditVisibility("private")} /> Councilor Private</label>
              </div>
            </div>
            <div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input type="checkbox" checked={editIsBigEvent} onChange={(e) => setEditIsBigEvent(e.target.checked)} className="rounded border-gray-300 w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Major Event (Show on Timeline)</span>
              </label>
            </div>
            <Button onClick={handleEdit} disabled={editSubmitting} className="w-full">{editSubmitting ? "Saving..." : "Save Changes"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : (
        <>
          {/* Section 1: Interactive Calendar */}
          <div>
            <h2 className="text-lg font-serif font-bold text-foreground border-b pb-2 mb-4">Events Calendar</h2>
            <Card className="p-4 sm:p-6 shadow-sm w-full bg-card">
              <InteractiveCalendar events={calendarEvents} />
            </Card>
          </div>

          {/* Section 2: Major Events Timeline */}
          <div className="px-2 sm:px-8 max-w-4xl mx-auto">
            <h2 className="text-lg font-serif font-bold text-foreground border-b pb-2 mb-8">Major Events Timeline</h2>
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
              {programmes
                .filter(p => p.is_big_event)
                .sort((a, b) => new Date(a.event_date || a.created_at).getTime() - new Date(b.event_date || b.created_at).getTime())
                .map((p) => (
                  <div key={p.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-1 gap-1">
                        <h3 className="font-bold text-lg leading-tight">{p.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full shrink-0 w-fit">
                            {formatDate(p.event_date)}
                          </span>
                          {canAdd && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" onClick={() => openEditDialog(p)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                      {p.description && <p className="text-muted-foreground text-sm">{p.description}</p>}
                    </div>
                  </div>
                ))}
              {programmes.filter(p => p.is_big_event).length === 0 && (
                <div className="text-center text-muted-foreground py-12">No major events on the timeline yet.</div>
              )}
            </div>
          </div>

          {/* Section 3: All Programmes — visible to editors only */}
          {canAdd && (
            <div className="space-y-3">
              <h2 className="text-lg font-serif font-bold text-foreground border-b pb-2">All Programmes</h2>
              {programmes.length === 0 ? (
                <p className="text-muted-foreground italic text-sm text-center py-4">No programmes yet.</p>
              ) : (
                programmes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(p => (
                  <ProgrammeCard key={p.id} p={p} />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
