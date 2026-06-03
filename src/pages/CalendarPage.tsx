import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Clock, MapPin, CheckCircle2, CircleDashed, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Programme {
  id: number;
  title: string;
  description?: string;
  date?: string;
  visibility: string;
  is_big_event: boolean;
  created_at: string;
}

// Robust cross-browser date formatting with fallbacks to prevent page crashes
function formatDate(dateStr?: string, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return "Date to be announced";
  // Replace space with T to handle space-separated Django timestamps correctly on Safari/all platforms
  const cleanStr = dateStr.replace(" ", "T");
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) {
    // Return raw date component if parsing fails
    return dateStr.split(" ")[0] || dateStr.split("T")[0] || "Date to be announced";
  }
  try {
    return date.toLocaleDateString("en-US", options || { month: "short", day: "numeric", year: "numeric" });
  } catch (e) {
    return dateStr.split(" ")[0] || "Date to be announced";
  }
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return "Time to be announced";
  const cleanStr = dateStr.replace(" ", "T");
  const date = new Date(cleanStr);
  if (isNaN(date.getTime())) {
    return "";
  }
  try {
    return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  } catch (e) {
    return "";
  }
}

export default function CalendarPage() {
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Programme | null>(null);

  useEffect(() => {
    api.get("/programmes/")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results || [];
        // Only show public events
        const publicList = list.filter((p: any) => p.visibility === "public");
        setProgrammes(publicList);
      })
      .catch((err) => console.error("Failed to load programmes", err))
      .finally(() => setLoading(false));
  }, []);

  const getStatus = (p: Programme): "Upcoming" | "Completed" | "In Progress" => {
    if (!p || !p.date) return "Upcoming";
    const cleanStr = p.date.replace(" ", "T");
    const eventDate = new Date(cleanStr);
    if (isNaN(eventDate.getTime())) return "Upcoming";
    
    const now = new Date();
    try {
      if (eventDate.toDateString() === now.toDateString()) return "In Progress";
      return eventDate < now ? "Completed" : "Upcoming";
    } catch (e) {
      return "Upcoming";
    }
  };

  const sortedProgrammes = [...programmes].sort((a, b) => {
    const cleanA = a.date ? a.date.replace(" ", "T") : "";
    const cleanB = b.date ? b.date.replace(" ", "T") : "";
    const da = cleanA ? new Date(cleanA).getTime() : 0;
    const db = cleanB ? new Date(cleanB).getTime() : 0;
    return (isNaN(db) ? 0 : db) - (isNaN(da) ? 0 : da);
  });

  const upcomingEvents = sortedProgrammes.filter(p => getStatus(p) !== "Completed").reverse();
  const completedEvents = sortedProgrammes.filter(p => getStatus(p) === "Completed");

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <section className="bg-[#130709] text-white py-16 md:py-24 relative overflow-hidden border-b border-white/5 text-center">
        <div className="absolute inset-0 opacity-[0.03] bg-pattern pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <Badge variant="outline" className="border-gold/30 text-gold mb-3 bg-gold/5 uppercase tracking-widest text-[9px] py-1 px-3">
            MCH Term Schedule
          </Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
            Termly Calendar & Programmes
          </h1>
          <p className="text-white/60 text-sm sm:text-base font-light leading-relaxed max-w-xl mx-auto">
            Stay informed on elections, general assemblies, health campaigns, debate assemblies, and active student voice surveys.
          </p>
        </div>
      </section>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div className="container mx-auto px-6 mt-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono">Loading Calendar...</p>
          </div>
        ) : programmes.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground space-y-3">
            <Calendar className="w-12 h-12 mx-auto opacity-20" />
            <p className="text-base font-serif italic">No public events scheduled yet.</p>
            <p className="text-xs">Timeline dates will be updated as term programs are initialized.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left: Active & Upcoming Schedule (8 Columns) */}
            <div className="lg:col-span-8 space-y-8 text-left">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2 mb-6">
                  Active & Upcoming Events
                </h2>
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">No upcoming term events. Check history below.</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        status={getStatus(event)} 
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Past Milestones */}
              <div className="pt-4">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-foreground border-b border-border/40 pb-2 mb-6">
                  Past Milestones
                </h2>
                {completedEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">No past events recorded.</p>
                ) : (
                  <div className="space-y-4">
                    {completedEvents.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event} 
                        status="Completed" 
                        onClick={() => setSelectedEvent(event)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Event Info Sidebar (4 Columns) */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <div className="bg-muted/30 border border-border/40 p-6 rounded-2xl">
                <h3 className="font-serif text-base font-bold text-foreground mb-3">Calendar Information</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                  The term calendar is managed and updated regularly by the General Secretary and Electoral Commission of the Student Council body.
                </p>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gold" />
                    <span className="font-semibold">Gold Dot</span>: Big Event / General Assembly
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="font-semibold">Green Badge</span>: In Progress (Today)
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="font-semibold">Maroon Badge</span>: Upcoming Schedule
                  </div>
                </div>
              </div>

              <div className="bg-[#130709] border border-white/5 p-6 rounded-2xl text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-[0.02] bg-pattern pointer-events-none" />
                <h3 className="font-serif text-base font-bold mb-2">Have a Proposal?</h3>
                <p className="text-xs text-white/70 leading-relaxed mb-4">
                  Do you want to propose a student event, class debate, or wellness activity? Pitch it directly via our online voice portal.
                </p>
                <Button className="w-full bg-gold hover:bg-gold-light text-gold-foreground text-[10px] font-bold uppercase tracking-widest py-4 rounded-lg" asChild>
                  <a href="/student-voice">Pitch Event</a>
                </Button>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* ── EVENT DETAILS DIALOG ────────────────────────────────────── */}
      <Dialog open={selectedEvent !== null} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md p-6 rounded-2xl bg-background text-foreground">
          {selectedEvent && (
            <>
              <DialogHeader className="text-left space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${
                    getStatus(selectedEvent) === "Completed" 
                      ? "bg-muted text-muted-foreground" 
                      : getStatus(selectedEvent) === "In Progress" 
                      ? "bg-green-500/10 text-green-600 border-green-500/20" 
                      : "bg-primary/10 text-primary border-primary/20"
                  } border-none uppercase tracking-widest text-[8px] px-2 py-0.5`}>
                    {getStatus(selectedEvent)}
                  </Badge>
                  {selectedEvent.is_big_event && (
                    <Badge className="bg-gold text-gold-foreground border-none uppercase tracking-widest text-[8px] px-2 py-0.5">
                      ★ Major Event
                    </Badge>
                  )}
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl font-black leading-tight text-foreground">
                  {selectedEvent.title}
                </DialogTitle>
                <div className="space-y-1.5 text-xs text-muted-foreground font-medium pt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>
                      {formatDate(selectedEvent.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>
                      {formatTime(selectedEvent.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span>Mengo Senior School Hall / Grounds</span>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="h-[1px] bg-border/50 my-4" />

              <DialogDescription className="text-left text-sm text-muted-foreground leading-relaxed">
                {selectedEvent.description || "No further details published. General student orientation and representation goals apply."}
              </DialogDescription>
            </>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
}

function EventCard({ 
  event, 
  status, 
  onClick 
}: { 
  event: Programme; 
  status: "Upcoming" | "Completed" | "In Progress";
  onClick: () => void;
}) {
  const Icon = status === "Completed" ? CheckCircle2 : status === "In Progress" ? CircleDashed : Calendar;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`p-5 rounded-2xl border bg-card/40 hover:bg-card hover:shadow-md transition-all duration-300 flex items-start gap-4 cursor-pointer group ${
        event.is_big_event ? "border-gold/20 hover:border-gold/40" : "border-border/50"
      }`}
      onClick={onClick}
    >
      <div className={`p-3 rounded-xl flex-shrink-0 ${
        status === "Completed" 
          ? "bg-muted text-muted-foreground/60" 
          : status === "In Progress" 
          ? "bg-green-500/10 text-green-600 animate-pulse" 
          : "bg-primary/5 text-primary"
      }`}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-serif text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
            {event.title}
          </h3>
          {event.is_big_event && (
            <span className="w-1.5 h-1.5 rounded-full bg-gold inline-block" title="Major Event" />
          )}
        </div>

        <p className="text-xs text-muted-foreground line-clamp-1 mt-1 leading-relaxed">
          {event.description || "Details to be announced."}
        </p>

        <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-semibold mt-3 flex-wrap">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-primary/60" />
            {formatDate(event.date, { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary/60" />
            Mengo Senior School
          </span>
        </div>
      </div>

      <Badge variant="outline" className={`${
        status === "Completed" 
          ? "bg-muted text-muted-foreground/60" 
          : status === "In Progress" 
          ? "bg-green-500/10 text-green-600 border-green-500/20" 
          : "bg-primary/5 text-primary border-primary/20"
      } border-none uppercase tracking-widest text-[8px] px-2 py-0.5 self-center hidden sm:inline-flex`}>
        {status}
      </Badge>

    </motion.div>
  );
}
