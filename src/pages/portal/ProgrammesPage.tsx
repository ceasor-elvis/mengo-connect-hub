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
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const localizer = momentLocalizer(moment);

interface Programme {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
  visibility: 'public' | 'private';
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
        event_date: eventDate || null,
        visibility: visibility,
        created_by: user.id,
      });
      toast.success("Programme added"); 
      log("added a programme", "programmes", title); 
      notifyAllCouncillors("New Programme", `"${title}" was added as ${visibility} event`, "info");
      setTitle(""); setDescription(""); setEventDate("");
      setVisibility("public");
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
                <Button onClick={handleAdd} disabled={submitting} className="w-full">{submitting ? "Saving..." : "Add Programme"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : programmes.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No programmes yet.</p>
      ) : (
        <Card className="p-4 shadow-sm">
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
                // Google Calendar style Blue for public, Apple style slate/purple for private
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
        </Card>
      )}
    </div>
  );
}
