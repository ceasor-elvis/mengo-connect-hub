import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { notifyAllCouncillors } from "@/hooks/useNotify";

interface Programme {
  id: string;
  title: string;
  description: string | null;
  event_date: string | null;
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

  const canAdd = hasAnyRole(["general_secretary", "secretary_publicity"]);

  const fetchProgrammes = async () => {
    const { data, error } = await supabase.from("programmes").select("*").order("event_date", { ascending: true });
    if (error) { toast.error("Failed to load programmes"); console.error(error); }
    else setProgrammes(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchProgrammes();
    const ch = supabase.channel("prog-rt").on("postgres_changes", { event: "*", schema: "public", table: "programmes" }, () => fetchProgrammes()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const handleAdd = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!user) { toast.error("Login required"); return; }
    setSubmitting(true);
    const { error } = await supabase.from("programmes").insert({
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate || null,
      created_by: user.id,
    });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Programme added"); log("added a programme", "programmes", title); notifyAllCouncillors("New Programme", `"${title}" was added`, "info");
      setTitle(""); setDescription(""); setEventDate("");
      setOpen(false);
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {programmes.map((prog) => (
            <Card key={prog.id} className="transition-all hover:shadow-md">
              <CardContent className="p-3 sm:p-4">
                <h3 className="text-sm font-semibold">{prog.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gold font-medium mt-1">
                  <Calendar className="h-3 w-3" /> {formatDate(prog.event_date)}
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{prog.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
