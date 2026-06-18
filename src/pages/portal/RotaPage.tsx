import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Users, Plus, Pencil, Trash2, Save, Printer, Calendar, Clock, UserCheck, Shield, Check, ChevronsUpDown } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Councillor {
  user_id: string;
  full_name: string;
  gender: string;
  student_class: string | null;
  roles: string[];
}

interface Duty {
  day: string;
  task: string;
  assigned: string[]; // array of councillor names
  supervisor: string[]; // array of supervisor names
}

interface RotaRow {
  id: string;
  week: string;
  duties: Duty[];
  created_by: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dayColors: Record<string, string> = {
  Mon: "bg-blue-500/10 text-blue-600 border-blue-500/20", 
  Tue: "bg-purple-500/10 text-purple-600 border-purple-500/20", 
  Wed: "bg-pink-500/10 text-pink-600 border-pink-500/20", 
  Thu: "bg-orange-500/10 text-orange-600 border-orange-500/20", 
  Fri: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", 
  Sat: "bg-amber-500/10 text-amber-600 border-amber-500/20", 
  Sun: "bg-red-500/10 text-red-600 border-red-500/20",
};

const ROLE_LABELS: Record<string, string> = {
  adminabsolute: "Admin",
  patron: "Patron",
  chairperson: "Chairperson",
  vice_chairperson: "Vice Chair",
  speaker: "Speaker",
  deputy_speaker: "Dep. Speaker",
  general_secretary: "Gen. Sec.",
  assistant_general_secretary: "Asst. Gen. Sec.",
  secretary_finance: "Sec. Finance",
  secretary_welfare: "Sec. Welfare",
  secretary_health: "Sec. Health",
  secretary_women_affairs: "Sec. Women Affairs",
  secretary_publicity: "Sec. Publicity",
  secretary_pwd: "Sec. PWD",
  electoral_commission: "EC",
  disciplinary_committee: "DC",
  councillor: "Councillor",
};

function councillorLabel(c: Councillor) {
  const role = c.roles?.[0];
  const roleStr = role && ROLE_LABELS[role] ? ` (${ROLE_LABELS[role]})` : "";
  const name = c.full_name || `User ${c.user_id}`;
  return `${name}${roleStr}`;
}

function addDutyRow(list: Duty[], setter: (d: Duty[]) => void) {
  setter([...list, { day: "Mon", task: "", assigned: [], supervisor: [] }]);
}

function updateDutyRow(list: Duty[], setter: (d: Duty[]) => void, idx: number, field: keyof Duty, value: any) {
  const updated = [...list];
  updated[idx] = { ...updated[idx], [field]: value };
  setter(updated);
}

function removeDutyRow(list: Duty[], setter: (d: Duty[]) => void, idx: number) {
  setter(list.filter((_, i) => i !== idx));
}

// MultiSelect using Popover and Command
function MultiCouncillorSelector({ 
  selected, 
  onChange, 
  councillors,
  placeholder = "Select councillors..."
}: { 
  selected: string[], 
  onChange: (val: string[]) => void, 
  councillors: Councillor[],
  placeholder?: string
}) {
  const [open, setOpen] = useState(false);
  
  const toggle = (name: string) => {
    if (selected.includes(name)) {
      onChange(selected.filter(n => n !== name));
    } else {
      onChange([...selected, name]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between h-auto min-h-[2.5rem] py-2 bg-background/50 border-border/50 hover:border-primary/50 text-left font-normal">
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 && <span className="text-muted-foreground">{placeholder}</span>}
            {selected.map(name => (
              <Badge key={name} variant="secondary" className="text-[10px] py-0 px-1.5 h-5 flex items-center gap-1" onClick={(e) => { e.stopPropagation(); toggle(name); }}>
                {name.split(' ')[0]} <span className="text-[8px] opacity-50 hover:opacity-100 ml-1">×</span>
              </Badge>
            ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search councillor..." />
          <CommandList className="max-h-60 overflow-y-auto custom-scrollbar">
            <CommandEmpty>No councillor found.</CommandEmpty>
            <CommandGroup>
              {councillors.map((c) => {
                const name = c.full_name || `User ${c.user_id}`;
                const isSelected = selected.includes(name);
                return (
                  <CommandItem key={name} value={name} onSelect={() => toggle(name)}>
                    <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50'}`}>
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <span className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${c.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                      {councillorLabel(c)}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function DutyEditor({ duties, setDuties, councillors }: { duties: Duty[]; setDuties: (d: Duty[]) => void; councillors: Councillor[] }) {
  return (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
      <AnimatePresence>
        {duties.map((d, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group relative rounded-xl border border-border/50 bg-card/40 p-4 shadow-sm backdrop-blur-sm transition-all hover:border-primary/30 hover:bg-card/60"
          >
            <div className="absolute -right-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <Button variant="destructive" size="icon" className="h-6 w-6 rounded-full shadow-md" onClick={() => removeDutyRow(duties, setDuties, i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-primary" /> Day
                </label>
                <Select value={d.day} onValueChange={(v) => updateDutyRow(duties, setDuties, i, "day", v)}>
                  <SelectTrigger className="bg-background/50 border-border/50 transition-colors hover:border-primary/50"><SelectValue /></SelectTrigger>
                  <SelectContent>{DAYS.map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              
              <div className="space-y-1.5 lg:col-span-3">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3 text-primary" /> Task Description
                </label>
                <Input 
                  className="bg-background/50 border-border/50 transition-colors hover:border-primary/50" 
                  placeholder="e.g., Monitor lunch lines, Check sanitation..." 
                  value={d.task} 
                  onChange={(e) => updateDutyRow(duties, setDuties, i, "task", e.target.value)} 
                />
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserCheck className="h-3 w-3 text-primary" /> Assigned To
                </label>
                <MultiCouncillorSelector 
                  selected={d.assigned} 
                  onChange={(val) => updateDutyRow(duties, setDuties, i, "assigned", val)} 
                  councillors={councillors} 
                  placeholder="Select assignees..."
                />
              </div>

              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-primary" /> Supervisor(s)
                </label>
                <MultiCouncillorSelector 
                  selected={d.supervisor} 
                  onChange={(val) => updateDutyRow(duties, setDuties, i, "supervisor", val)} 
                  councillors={councillors} 
                  placeholder="Select supervisors..."
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button 
        variant="outline" 
        className="w-full mt-2 border-dashed border-primary/40 text-primary hover:bg-primary/5 hover:border-primary transition-all" 
        onClick={() => addDutyRow(duties, setDuties)}
      >
        <Plus className="h-4 w-4 mr-2" /> Add Duty Assignment
      </Button>
    </div>
  );
}

export default function RotaPage() {
  const { user, hasPermission } = useAuth();
  const canEdit = hasPermission("manage_rota");

  const [rotas, setRotas] = useState<RotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [councillors, setCouncillors] = useState<Councillor[]>([]);

  // New rota form
  const [showAdd, setShowAdd] = useState(false);
  const [newWeek, setNewWeek] = useState("");
  const [newDuties, setNewDuties] = useState<Duty[]>([{ day: "Mon", task: "", assigned: [], supervisor: [] }]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeek, setEditWeek] = useState("");
  const [editDuties, setEditDuties] = useState<Duty[]>([]);

  // Export State
  const [exportingRota, setExportingRota] = useState<RotaRow | null>(null);
  const [exportTitle, setExportTitle] = useState("");
  const [exportSubtitle, setExportSubtitle] = useState("THE OFFICE OF THE GENERAL SECRETARY");
  const [exportH1, setExportH1] = useState("Supervisors");
  const [exportH2, setExportH2] = useState("Females");
  const [exportH3, setExportH3] = useState("Males");
  const [exportNotes, setExportNotes] = useState("");

  const startExport = (rota: RotaRow) => {
    setExportTitle(rota.week.toUpperCase());
    setExportH1("Supervisors");
    setExportH2("Females");
    setExportH3("Males");
    setExportNotes(
      "ALL COUNCILLORS AND SUPERVISORS ARE EXPECTED AT THE LUNCH LINES BY 1:15 P.M.\n" +
      "DEFAULTING WILL RESULT INTO PAYMENT OF A FINE OF sh.3000 TO THE SEC. FINANCE\n" +
      "ANY COUNCILLOR THAT WILL NOT BE ABLE TO SHOW UP ON THE LUNCH LINES SHOULD ENSURE PRIOR COMMUNICATION IS MADE TO THEIR SUPERVISORS.\n" +
      "FOR CONCERNS RELATING TO THE ROTA, REACH OUT TO THE GEN. SEC. OR ASST. GEN. SEC."
    );
    setExportingRota(rota);
  };

  const fetchCouncillors = async () => {
    try {
      const response = await api.get("/users/councillors/");
      const data = response.data;
      const list = Array.isArray(data) ? data : (data.results || data.profiles || []);
      setCouncillors(list);
    } catch (e) {
      console.error("RotaPage: Failed to load councillors", e);
      setCouncillors([]);
    }
  };

  const fetchRotas = async () => {
    try {
      const { data } = await api.get("/rotas/");
      const entries = Array.isArray(data) ? data : data.results || [];
      setRotas(
        entries.map((r: any) => ({
          id: r.id,
          week: r.week,
          duties: (Array.isArray(r.duties) ? r.duties : []).map((d: any) => ({
            day: d.day || "Mon",
            task: d.task || "",
            assigned: Array.isArray(d.assigned) ? d.assigned : (d.assigned ? [d.assigned] : []),
            supervisor: Array.isArray(d.supervisor) ? d.supervisor : (d.supervisor ? [d.supervisor] : []),
          })) as Duty[],
          created_by: r.created_by,
        }))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouncillors();
    fetchRotas();
  }, []);

  const getGender = (name: string): string => {
    const c = councillors.find(c => (c.full_name || `User ${c.user_id}`) === name);
    return c?.gender || "unknown";
  };

  const handleCreate = async () => {
    if (!newWeek.trim()) return toast.error("Enter the week label");
    const validDuties = newDuties.filter((d) => d.task.trim() && d.assigned.length > 0);
    if (!validDuties.length) return toast.error("Add at least one duty with assignments");

    try {
      await api.post("/rotas/", {
        week: newWeek.trim(),
        duties: validDuties,
        created_by: user!.id,
      });
      toast.success("Rota created");
      setShowAdd(false);
      setNewWeek("");
      setNewDuties([{ day: "Mon", task: "", assigned: [], supervisor: [] }]);
      fetchRotas();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error creating rota");
    }
  };

  const startEdit = (rota: RotaRow) => {
    setEditingId(rota.id);
    setEditWeek(rota.week);
    setEditDuties(JSON.parse(JSON.stringify(rota.duties))); // Deep copy
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const validDuties = editDuties.filter((d) => d.task.trim() && d.assigned.length > 0);
    try {
      await api.patch(`/rotas/${editingId}/`, {
        week: editWeek.trim(),
        duties: validDuties
      });
      toast.success("Rota updated");
      setEditingId(null);
      fetchRotas();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error updating rota");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/rotas/${id}/`);
      toast.success("Rota deleted");
      fetchRotas();
    } catch (e) {
      toast.error("Error deleting rota");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </motion.div>
      </div>
    );
  }

  if (exportingRota) {
    // Auto-categorize assigned councillors by gender for each day
    const categorizeByDay = (day: string) => {
      const dayDuties = exportingRota.duties.filter(d => d.day === day);
      
      const supervisors: string[] = [];
      const females: string[] = [];
      const males: string[] = [];
      const unknown: string[] = [];

      dayDuties.forEach(d => {
        d.supervisor.forEach(s => supervisors.push(s));
        d.assigned.forEach(name => {
          const gender = getGender(name);
          if (gender === 'female') females.push(name);
          else if (gender === 'male') males.push(name);
          else unknown.push(name);
        });
      });

      return { 
        supervisors: [...new Set(supervisors)], 
        females: [...new Set(females)], 
        males: [...new Set([...males, ...unknown])] 
      };
    };

    return (
      <div className="bg-background min-h-screen">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #rota-printable, #rota-printable * { visibility: visible; }
            #rota-printable { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; box-shadow: none !important; border: none !important; }
            .no-print { display: none !important; }
            @page { margin: 1cm; size: auto; }
          }
        `}</style>

        <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-12">
          {/* Controls - Hidden on print */}
          <div className="no-print flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm backdrop-blur-md bg-card/60">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={exportSubtitle} onChange={e => setExportSubtitle(e.target.value)} placeholder="Subtitle" className="flex-1 text-xs" />
                  <Input value={exportTitle} onChange={e => setExportTitle(e.target.value)} placeholder="Main Title" className="flex-1 text-xs font-bold border-primary/50" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={exportH1} onChange={e => setExportH1(e.target.value)} placeholder="Col 1" className="flex-1 text-xs" />
                  <Input value={exportH2} onChange={e => setExportH2(e.target.value)} placeholder="Col 2" className="flex-1 text-xs" />
                  <Input value={exportH3} onChange={e => setExportH3(e.target.value)} placeholder="Col 3" className="flex-1 text-xs" />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                 <Button variant="outline" className="w-full sm:w-auto" onClick={() => setExportingRota(null)}>Cancel</Button>
                 <Button className="w-full sm:w-auto bg-primary text-primary-foreground shadow-md hover:shadow-lg transition-all" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/> Print</Button>
              </div>
            </div>
          </div>

          {/* Printable Template */}
          {(() => {
            const genSec = councillors.find(c => c.roles?.includes('general_secretary'))?.full_name || "KWAGALA SIMONPETER ALVIN";
            const asstGenSec = councillors.find(c => c.roles?.includes('assistant_general_secretary'))?.full_name || "NSAMBA ORETHA GLORIA";
            
            return (
              <div id="rota-printable" className="bg-white text-black border border-black p-0 shadow-lg">
                <div className="text-center p-6 border-b border-black">
                  <h2 className="font-serif font-black text-xl sm:text-2xl uppercase tracking-wider text-black">{exportSubtitle}</h2>
                  <h3 className="font-bold text-lg sm:text-xl mt-1 uppercase text-black">{exportTitle}</h3>
                </div>
                
                <table className="w-full border-collapse text-sm bg-white">
                  <thead>
                    <tr>
                      <th className="border border-black p-3 text-left font-bold uppercase w-24 text-black">Day</th>
                      <th className="border border-black p-3 text-left font-bold uppercase w-1/3 text-black">{exportH1}</th>
                      <th className="border border-black p-0 text-left font-bold uppercase w-1/2 text-black">
                        <div className="border-b border-black p-3 text-center">{exportTitle.includes("LUNCH") ? "Councillors on Duty" : "Assignments"}</div>
                        <div className="flex">
                          <div className="flex-1 border-r border-black p-3">{exportH2}</div>
                          <div className="flex-1 p-3">{exportH3}</div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="align-top font-medium leading-relaxed bg-white text-black">
                    {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => {
                      const { supervisors, females, males } = categorizeByDay(day);
                      return (
                        <tr key={day}>
                          <td className="border border-black p-3 font-bold uppercase">
                            {day === "Mon" ? "MONDAY" : day === "Tue" ? "TUESDAY" : day === "Wed" ? "WEDNESDAY" : day === "Thu" ? "THURSDAY" : "FRIDAY"}
                          </td>
                          <td className="border border-black p-3">
                            {supervisors.map((s, i) => <span key={i} className="block">{s}</span>)}
                          </td>
                          <td className="border border-black p-0">
                            <div className="flex h-full min-h-[60px]">
                              <div className="flex-1 border-r border-black p-3">
                                {females.length > 0 ? females.map((f, i) => <span key={i} className="block">{f}</span>) : <span className="text-black/20 italic">None</span>}
                              </div>
                              <div className="flex-1 p-3">
                                {males.length > 0 ? males.map((m, i) => <span key={i} className="block">{m}</span>) : <span className="text-black/20 italic">None</span>}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <div className="mt-8 text-xs p-5 pb-0 text-black">
                  <h4 className="font-bold underline mb-2">NOTE:</h4>
                  <ul className="list-disc pl-5 space-y-1.5 font-medium uppercase text-[10px] sm:text-xs text-black/80">
                    {exportNotes.split('\n').filter(line => line.trim()).map((line, i) => (
                      <li key={i}>{line.trim()}</li>
                    ))}
                  </ul>
                </div>

                <div className="mt-12 flex justify-between items-start pt-8 p-5 text-black">
                  <div className="space-y-4">
                    <p className="font-bold uppercase text-xs">ASSISTANT GENERAL SECRETARY</p>
                    <div className="h-10 italic text-black/40 text-xl font-serif"></div>
                    <p className="font-bold uppercase text-sm border-t border-dashed border-black pt-1">{asstGenSec}</p>
                  </div>
                  
                  <div className="space-y-4 text-left">
                    <p className="font-bold uppercase text-xs">GENERAL SECRETARY</p>
                    <div className="h-10 italic text-black/40 text-xl font-serif"></div>
                    <p className="font-bold uppercase text-sm border-t border-dashed border-black pt-1">{genSec}</p>
                  </div>
                </div>
                
                <div className="pb-8"></div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-12"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap bg-card/60 backdrop-blur-md p-6 rounded-2xl border border-primary/10 shadow-sm">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
            Working Rota
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-medium">Manage weekly duty assignments with precision.</p>
        </div>
        {canEdit && (
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button className="shadow-md hover:shadow-lg transition-all rounded-full px-6 bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-500">
                <Plus className="h-4 w-4 mr-2" /> Create Rota
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-serif font-bold flex items-center gap-2 text-primary">
                  <Calendar className="h-6 w-6" /> New Weekly Rota
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 pt-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Rota Label</label>
                  <Input 
                    placeholder="e.g. Week 13 (Mar 30 – Apr 5)" 
                    value={newWeek} 
                    onChange={(e) => setNewWeek(e.target.value)} 
                    className="text-base font-medium h-12 bg-background/50 border-border/50 focus-visible:ring-primary/30" 
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Duty Assignments</label>
                  <DutyEditor duties={newDuties} setDuties={setNewDuties} councillors={councillors} />
                </div>
                
                <Button onClick={handleCreate} className="w-full text-sm h-12 font-bold shadow-md hover:shadow-lg transition-all rounded-xl">
                  Save New Rota
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {rotas.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-16 text-center border border-dashed border-border/50 rounded-3xl bg-card/30"
        >
          <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
            <Calendar className="h-10 w-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-serif font-bold text-foreground">No Rotas Found</h3>
          <p className="text-muted-foreground max-w-sm mx-auto mt-2 text-sm leading-relaxed">
            There are currently no working rotas configured. Create one to start assigning weekly duties.
          </p>
          {canEdit && (
            <Button variant="outline" className="mt-6 shadow-sm" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4 mr-2" /> Create First Rota
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence>
            {rotas.map((rota, idx) => (
              <motion.div 
                key={rota.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group">
                  <CardHeader className="border-b border-border/30 bg-muted/20 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        {editingId === rota.id ? (
                          <Input 
                            value={editWeek} 
                            onChange={(e) => setEditWeek(e.target.value)} 
                            className="h-10 text-base font-bold w-64 bg-background shadow-inner" 
                            autoFocus
                          />
                        ) : (
                          <CardTitle className="text-xl font-serif tracking-tight">{rota.week}</CardTitle>
                        )}
                      </div>
                      
                      {canEdit && (
                        <div className="flex items-center gap-2 bg-background/50 p-1.5 rounded-lg border border-border/50">
                          {editingId !== rota.id ? (
                            <>
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted" onClick={() => startExport(rota)}>
                                <Printer className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline">Print</span>
                              </Button>
                              <div className="w-px h-4 bg-border/60 mx-1" />
                              <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => startEdit(rota)}>
                                <Pencil className="h-4 w-4 mr-1.5" /> <span className="hidden sm:inline">Edit</span>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-serif text-xl">Delete Rota?</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete this rota?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(rota.id)} className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          ) : (
                            <>
                              <Button size="sm" className="h-8 shadow-sm bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleSaveEdit}>
                                <Save className="h-4 w-4 mr-1.5" /> Save Changes
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-destructive" onClick={() => setEditingId(null)}>
                                Cancel
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-0">
                    {editingId === rota.id ? (
                      <div className="p-6 bg-muted/10 border-b border-border/30">
                        <DutyEditor duties={editDuties} setDuties={setEditDuties} councillors={councillors} />
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {rota.duties.map((d, i) => {
                          return (
                            <div key={i} className="flex flex-col sm:flex-row gap-4 p-4 hover:bg-muted/30 transition-colors">
                              <div className="sm:w-24 shrink-0 flex items-start pt-1">
                                <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider border px-2 py-0.5 ${dayColors[d.day] || dayColors.Mon}`}>
                                  {d.day}
                                </Badge>
                              </div>
                              
                              <div className="flex-1 min-w-0 grid gap-4 md:grid-cols-12">
                                <div className="md:col-span-5 flex flex-col justify-center">
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Task</span>
                                  <p className="text-sm font-medium leading-relaxed">{d.task}</p>
                                </div>
                                
                                <div className="md:col-span-4 flex flex-col justify-center">
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" /> Assigned To
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {d.assigned.length > 0 ? d.assigned.map(name => {
                                      const gender = getGender(name);
                                      return (
                                        <div key={name} className="flex items-center gap-1.5 bg-background border border-border/60 px-2 py-1 rounded-md shadow-sm group-hover:border-primary/20 transition-colors">
                                          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${gender === 'female' ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.4)]' : gender === 'male' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]' : 'bg-gray-400'}`} />
                                          <span className="text-xs font-medium">{name}</span>
                                        </div>
                                      );
                                    }) : <span className="text-xs italic text-muted-foreground/50">Unassigned</span>}
                                  </div>
                                </div>
                                
                                <div className="md:col-span-3 flex flex-col justify-center">
                                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1">
                                    <Shield className="h-3 w-3" /> Supervisor(s)
                                  </span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {d.supervisor.length > 0 ? d.supervisor.map(name => {
                                      const gender = getGender(name);
                                      return (
                                        <div key={name} className="flex items-center gap-1.5 bg-primary/5 border border-primary/10 px-2 py-1 rounded-md shadow-sm w-max">
                                          <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${gender === 'female' ? 'bg-pink-500' : gender === 'male' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                                          <span className="text-xs text-primary font-bold">{name}</span>
                                        </div>
                                      );
                                    }) : <span className="text-xs italic text-muted-foreground/50">—</span>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
