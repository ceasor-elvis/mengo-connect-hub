import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Pencil, Clock, Calendar as CalendarIcon, Star, EyeOff, Globe } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function ProgrammesPage() {
  const { user, hasPermission } = useAuth();
  const { log } = useActivityLog();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create state
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

  const calendarEvents = programmes.map((p) => ({
    id: p.id,
    title: p.title,
    start: p.event_date ? new Date(p.event_date) : new Date(),
    end: p.event_date ? new Date(p.event_date) : new Date(),
    resource: p,
  }));

  const timelineEvents = programmes
    .filter(p => p.is_big_event)
    .sort((a, b) => new Date(a.event_date || a.created_at).getTime() - new Date(b.event_date || b.created_at).getTime());

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-12 pb-16 relative"
    >
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 right-10 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider"
          >
            <CalendarIcon className="w-3 h-3" /> Event Management
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Programmes & Schedule
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Manage the council's event calendar, track major milestones, and keep the timeline updated for the student body.
          </p>
        </div>

        {canAdd && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl gap-2 font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white h-12 px-6">
                <Plus className="h-4 w-4" /> Schedule Event
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
              <div className="p-6 border-b border-border/20 bg-indigo-500/5">
                <DialogTitle className="font-serif text-2xl font-black text-indigo-700 dark:text-indigo-400">New Event</DialogTitle>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title *</Label>
                  <Input className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-indigo-500/20 h-11" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Career Day" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Date</Label>
                  <Input type="date" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-indigo-500/20 h-11" value={eventDate} onChange={e => setEventDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                  <Textarea className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-indigo-500/20 resize-none" value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Event details..." />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visibility</Label>
                  <div className="flex gap-4 p-1 bg-muted/30 rounded-xl border border-border/50">
                    <button
                      type="button"
                      onClick={() => setVisibility("public")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        visibility === "public" ? "bg-background shadow text-indigo-600" : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" /> Public
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibility("private")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        visibility === "private" ? "bg-background shadow text-indigo-600" : "text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Private
                    </button>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                    <input type="checkbox" checked={isBigEvent} onChange={(e) => setIsBigEvent(e.target.checked)} className="rounded border-border/50 w-5 h-5 text-indigo-600 focus:ring-indigo-500/20" />
                    <div className="space-y-0.5">
                      <span className="text-sm font-bold block leading-none">Major Event</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Pin to the public timeline</span>
                    </div>
                  </label>
                </div>
                <div className="pt-2">
                  <Button onClick={handleAdd} disabled={submitting} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white transition-all">
                    {submitting ? "Saving..." : "Add to Schedule"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
            <div className="p-6 border-b border-border/20 bg-indigo-500/5">
              <DialogTitle className="font-serif text-2xl font-black text-indigo-700 dark:text-indigo-400">Edit Event</DialogTitle>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title *</Label>
                <Input className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-indigo-500/20 h-11" value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Event Date</Label>
                <Input type="date" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-indigo-500/20 h-11" value={editDate} onChange={e => setEditDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                <Textarea className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-indigo-500/20 resize-none" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Visibility</Label>
                <div className="flex gap-4 p-1 bg-muted/30 rounded-xl border border-border/50">
                  <button
                    type="button"
                    onClick={() => setEditVisibility("public")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      editVisibility === "public" ? "bg-background shadow text-indigo-600" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5" /> Public
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditVisibility("private")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                      editVisibility === "private" ? "bg-background shadow text-indigo-600" : "text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <EyeOff className="w-3.5 h-3.5" /> Private
                  </button>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-3 p-4 rounded-xl border border-border/50 bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors">
                  <input type="checkbox" checked={editIsBigEvent} onChange={(e) => setEditIsBigEvent(e.target.checked)} className="rounded border-border/50 w-5 h-5 text-indigo-600 focus:ring-indigo-500/20" />
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold block leading-none">Major Event</span>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Pin to the public timeline</span>
                  </div>
                </label>
              </div>
              <div className="pt-2">
                <Button onClick={handleEdit} disabled={editSubmitting} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white transition-all">
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </section>

      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full drop-shadow-lg" />
          </motion.div>
        </div>
      ) : (
        <>
          {/* Section 1: Interactive Calendar */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="font-serif text-2xl font-bold text-foreground">Interactive Calendar</h2>
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden">
              <CardContent className="p-2 sm:p-6">
                <div className="min-h-[500px] w-full rounded-2xl bg-background/50 border border-border/50 overflow-hidden">
                  <InteractiveCalendar events={calendarEvents} />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Section 2: Major Events Timeline */}
            <motion.div variants={itemVariants} className="xl:col-span-2 space-y-4">
              <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" /> Timeline
              </h2>
              
              <div className="p-6 rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl">
                {timelineEvents.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground italic text-sm">No major events on the timeline yet.</div>
                ) : (
                  <div className="relative border-l-2 border-border/50 ml-4 space-y-8">
                    {timelineEvents.map((p, idx) => (
                      <div key={p.id} className="relative pl-8 group">
                        <div className="absolute -left-[11px] top-1.5 h-5 w-5 rounded-full border-4 border-background bg-indigo-500 shadow-lg shadow-indigo-500/50 group-hover:scale-125 transition-transform" />
                        
                        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all hover:border-indigo-500/30">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                            <div>
                              <h3 className="font-serif text-xl font-bold text-foreground leading-tight group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                              <p className="text-xs font-black uppercase tracking-widest text-indigo-500 mt-1 flex items-center gap-1.5">
                                <CalendarIcon className="h-3 w-3" /> {formatDate(p.event_date)}
                              </p>
                            </div>
                            
                            {canAdd && (
                              <div className="flex gap-1 shrink-0 bg-muted/50 p-1 rounded-xl">
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-indigo-600 hover:bg-background shadow-sm" onClick={() => openEditDialog(p)}>
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-rose-600 hover:bg-rose-50 shadow-sm">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="rounded-3xl border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle className="font-serif text-2xl">Remove from Timeline?</AlertDialogTitle>
                                      <AlertDialogDescription>This will permanently remove "{p.title}". This cannot be undone.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(p.id, p.title)} className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            )}
                          </div>
                          
                          {p.description && <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>}
                          
                          <div className="mt-4 pt-3 border-t border-border/40 flex justify-end">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1.5 w-fit ${p.visibility === 'private' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                              {p.visibility === 'private' ? <EyeOff className="w-3 h-3" /> : <Globe className="w-3 h-3" />} {p.visibility}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Section 3: All Programmes */}
            {canAdd && (
              <motion.div variants={itemVariants} className="space-y-4">
                <h2 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
                   Directory
                </h2>
                
                <div className="space-y-3">
                  <AnimatePresence>
                    {programmes.length === 0 ? (
                      <p className="text-muted-foreground italic text-sm text-center py-12 bg-card/60 backdrop-blur-xl rounded-3xl border border-border/40">No programmes yet.</p>
                    ) : (
                      programmes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(p => (
                        <motion.div key={p.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, height: 0 }}>
                          <Card className="rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden">
                            <CardContent className="p-4 flex flex-col gap-3">
                              <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-base leading-tight group-hover:text-indigo-600 transition-colors">{p.title}</h3>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background border border-border/50 rounded-lg p-0.5 shadow-sm shrink-0">
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted" onClick={() => openEditDialog(p)}>
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  {!p.is_big_event && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-rose-50 text-rose-500">
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="rounded-3xl border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="font-serif text-2xl">Delete Event?</AlertDialogTitle>
                                          <AlertDialogDescription>Permanently remove "{p.title}"?</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDelete(p.id, p.title)} className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2 border-t border-border/40">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" /> {formatDate(p.event_date)}</span>
                                <div className="flex gap-1.5">
                                  {p.is_big_event && (
                                    <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-amber-500/15 text-amber-700 dark:text-amber-400 rounded-md">
                                      Major
                                    </span>
                                  )}
                                  <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md ${p.visibility === 'private' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                    {p.visibility}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </motion.div>
  );
}
