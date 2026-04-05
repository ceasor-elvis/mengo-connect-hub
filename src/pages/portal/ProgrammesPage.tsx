import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { notifyAllCouncillors } from "@/hooks/useNotify";
import { InteractiveCalendar } from "@/components/calendar/InteractiveCalendar";
import { Calendar, momentLocalizer } from "react-big-calendar";
import { LayoutGrid, CalendarDays, LayoutList, Clock } from "lucide-react";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

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
  const { user, hasAnyRole } = useAuth();
  const { log } = useActivityLog();
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [viewMode, setViewMode] = useState<"calendar" | "visual" | "timeline">("timeline");
  const [isBigEvent, setIsBigEvent] = useState(false);

  const canAdd = hasAnyRole(["general_secretary", "secretary_publicity", "adminabsolute", "chairperson"]);

  const fetchProgrammes = async () => {
    try {
      const { data } = await api.get("/programmes/");
      setProgrammes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load programmes");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgrammes();
  }, []);

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
        visibility: visibility,
        is_big_event: isBigEvent,
        created_by: user.id,
      });
      toast.success("Programme added"); 
      log("added a programme", "programmes", title); 
      notifyAllCouncillors("New Programme", `"${title}" was added as ${visibility} event`, "info");
      setTitle(""); setDescription(""); setEventDate("");
      setVisibility("public");
      setIsBigEvent(false);
      setOpen(false);
      fetchProgrammes();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to add programme");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return "TBD";
    return new Date(d).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap justify-end gap-2 px-1">
        <Button 
          variant={viewMode === "timeline" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setViewMode("timeline")}
          className="rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          <LayoutList className="w-3.5 h-3.5 mr-1.5" /> Timeline View
        </Button>
        <Button 
          variant={viewMode === "calendar" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setViewMode("calendar")}
          className="rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          <CalendarDays className="w-3.5 h-3.5 mr-1.5" /> Detailed View
        </Button>
        <Button 
          variant={viewMode === "visual" ? "default" : "outline"} 
          size="sm" 
          onClick={() => setViewMode("visual")}
          className="rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          <LayoutGrid className="w-3.5 h-3.5 mr-1.5" /> Visual View
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : programmes.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No programmes yet.</p>
      ) : (
        <Card className={`p-2 sm:p-4 shadow-sm ${viewMode === 'timeline' ? 'bg-transparent border-none' : 'border-none bg-transparent sm:bg-card sm:border'}`}>
          {viewMode === "timeline" ? (
             <div className="py-6 px-2 sm:px-8 max-w-4xl mx-auto">
               <h2 className="text-2xl font-serif font-bold mb-8 text-center">Council Timeline (Major Events)</h2>
               <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                 {programmes.filter(p => p.is_big_event).sort((a, b) => new Date(a.event_date || a.created_at).getTime() - new Date(b.event_date || b.created_at).getTime()).map((p, i) => (
                   <div key={p.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                     <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-primary text-primary-foreground shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                       <Clock className="w-4 h-4" />
                     </div>
                     <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 sm:mb-1 gap-1">
                         <h3 className="font-bold text-lg leading-tight">{p.title}</h3>
                         <span className="text-[10px] sm:text-xs font-semibold px-2.5 py-0.5 bg-primary/10 text-primary rounded-full shrink-0 w-fit">
                           {formatDate(p.event_date)}
                         </span>
                       </div>
                       {p.description && <p className="text-muted-foreground text-sm">{p.description}</p>}
                     </div>
                   </div>
                 ))}
                 {programmes.filter(p => p.is_big_event).length === 0 && (
                   <div className="text-center text-muted-foreground py-12 relative z-10 bg-background/80">No major events added to the timeline yet.</div>
                 )}
               </div>
             </div>
          ) : viewMode === "calendar" ? (
            <div className="h-[600px] w-full">
              <Calendar
                localizer={localizer}
                events={programmes.map((p) => ({
                  id: p.id,
                  title: p.title,
                  start: p.event_date ? new Date(p.event_date) : new Date(),
                  end: p.event_date ? new Date(p.event_date) : new Date(),
                  resource: p,
                }))}
                startAccessor="start"
                endAccessor="end"
                defaultView="month"
                views={['month', 'agenda', 'week', 'day']}
                eventPropGetter={(event) => {
                  const isPrivate = event.resource?.visibility === "private";
                  return {
                    style: {
                      backgroundColor: isPrivate ? "#6366f1" : "#039be5",
                      borderColor: isPrivate ? "#4f46e5" : "#0288d1",
                      color: "white",
                      borderRadius: "4px",
                      opacity: 0.9,
                      display: "block",
                    },
                  };
                }}
                onSelectEvent={(event) => {
                  toast(`Event: ${event.title}`, { description: event.resource?.description || "No description provided." });
                }}
              />
            </div>
          ) : (
            <InteractiveCalendar 
              events={programmes.map((p) => ({
                id: p.id,
                title: p.title,
                start: p.event_date ? new Date(p.event_date) : new Date(),
                end: p.event_date ? new Date(p.event_date) : new Date(),
                resource: p,
              }))}
            />
          )}
        </Card>
      )}
    </div>
  );
}
