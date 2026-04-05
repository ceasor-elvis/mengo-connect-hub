import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Save, Printer } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

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
  assigned: string; // councillor full_name
  supervisor: string; // supervisor full_name
}

interface RotaRow {
  id: string;
  week: string;
  duties: Duty[];
  created_by: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayVariant: Record<string, "default" | "secondary" | "outline"> = {
  Mon: "default", Tue: "secondary", Wed: "outline", Thu: "default", Fri: "secondary", Sat: "outline", Sun: "default",
};

const EDITOR_ROLES = ["assistant_general_secretary", "patron", "chairperson", "speaker"] as const;

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

// Helper functions (outside component to avoid re-creation)
function councillorLabel(c: Councillor) {
  const role = c.roles?.[0];
  const roleStr = role && ROLE_LABELS[role] ? ` (${ROLE_LABELS[role]})` : "";
  const name = c.full_name || `User ${c.user_id}`;
  return `${name}${roleStr}`;
}

function addDutyRow(list: Duty[], setter: (d: Duty[]) => void) {
  setter([...list, { day: "Mon", task: "", assigned: "", supervisor: "" }]);
}

function updateDutyRow(list: Duty[], setter: (d: Duty[]) => void, idx: number, field: keyof Duty, value: string) {
  const updated = [...list];
  updated[idx] = { ...updated[idx], [field]: value };
  setter(updated);
}

function removeDutyRow(list: Duty[], setter: (d: Duty[]) => void, idx: number) {
  setter(list.filter((_, i) => i !== idx));
}

// Extracted as a top-level component so React doesn't recreate it on every parent render
function DutyEditor({ duties, setDuties, councillors }: { duties: Duty[]; setDuties: (d: Duty[]) => void; councillors: Councillor[] }) {
  return (
    <div className="space-y-3">
      {duties.map((d, i) => (
        <div key={i} className="rounded-lg border border-border/60 p-2.5 space-y-2 bg-muted/30">
          <div className="flex items-center gap-1.5">
            <Select value={d.day} onValueChange={(v) => updateDutyRow(duties, setDuties, i, "day", v)}>
              <SelectTrigger className="w-20 h-8 text-xs shrink-0"><SelectValue /></SelectTrigger>
              <SelectContent>{DAYS.map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="flex-1 h-8 text-xs" placeholder="Task description" value={d.task} onChange={(e) => updateDutyRow(duties, setDuties, i, "task", e.target.value)} />
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeDutyRow(duties, setDuties, i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Assigned to - Councillor dropdown */}
            <div className="flex-1 min-w-[160px]">
              <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Assigned To</label>
              <Select value={d.assigned} onValueChange={(v) => updateDutyRow(duties, setDuties, i, "assigned", v)}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Select councillor..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {councillors.map((c) => (
                    <SelectItem key={c.user_id || Math.random().toString()} value={c.full_name || `User ${c.user_id}`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${c.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                        {councillorLabel(c)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Supervisor dropdown */}
            <div className="flex-1 min-w-[160px]">
              <label className="text-[10px] font-medium text-muted-foreground mb-0.5 block">Supervisor</label>
              <Select value={d.supervisor || ""} onValueChange={(v) => updateDutyRow(duties, setDuties, i, "supervisor", v)}>
                <SelectTrigger className="h-8 text-xs w-full">
                  <SelectValue placeholder="Select supervisor..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {councillors.map((c) => (
                    <SelectItem key={`sup-${c.user_id || Math.random().toString()}`} value={c.full_name || `User ${c.user_id}`}>
                      <span className="flex items-center gap-1.5">
                        <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${c.gender === 'female' ? 'bg-pink-500' : 'bg-blue-500'}`} />
                        {councillorLabel(c)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" className="text-xs" onClick={() => addDutyRow(duties, setDuties)}><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
    </div>
  );
}

export default function RotaPage() {
  const { user, hasAnyRole } = useAuth();
  const canEdit = hasAnyRole([...EDITOR_ROLES] as any[]);

  const [rotas, setRotas] = useState<RotaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [councillors, setCouncillors] = useState<Councillor[]>([]);

  // New rota form
  const [showAdd, setShowAdd] = useState(false);
  const [newWeek, setNewWeek] = useState("");
  const [newDuties, setNewDuties] = useState<Duty[]>([{ day: "Mon", task: "", assigned: "", supervisor: "" }]);

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
            assigned: d.assigned || "",
            supervisor: d.supervisor || "",
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

  // Helper: look up gender for a councillor name
  const getGender = (name: string): string => {
    const c = councillors.find(c => (c.full_name || `User ${c.user_id}`) === name);
    return c?.gender || "unknown";
  };

  const handleCreate = async () => {
    if (!newWeek.trim()) return toast.error("Enter the week label");
    const validDuties = newDuties.filter((d) => d.task.trim() && d.assigned.trim());
    if (!validDuties.length) return toast.error("Add at least one duty");

    try {
      await api.post("/rotas/", {
        week: newWeek.trim(),
        duties: validDuties,
        created_by: user!.id,
      });
      toast.success("Rota created");
      setShowAdd(false);
      setNewWeek("");
      setNewDuties([{ day: "Mon", task: "", assigned: "", supervisor: "" }]);
      fetchRotas();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error creating rota");
    }
  };

  const startEdit = (rota: RotaRow) => {
    setEditingId(rota.id);
    setEditWeek(rota.week);
    setEditDuties([...rota.duties]);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const validDuties = editDuties.filter((d) => d.task.trim() && d.assigned.trim());
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
    if (!confirm("Delete this rota?")) return;
    try {
      await api.delete(`/rotas/${id}/`);
      toast.success("Rota deleted");
      fetchRotas();
    } catch (e) {
      toast.error("Error deleting rota");
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>;

  if (exportingRota) {
    // Auto-categorize assigned councillors by gender for each day
    const categorizeByDay = (day: string) => {
      const dayDuties = exportingRota.duties.filter(d => d.day === day);
      const supervisors = dayDuties.map(d => d.supervisor).filter(Boolean);
      const females = dayDuties.filter(d => getGender(d.assigned) === "female").map(d => d.assigned);
      const males = dayDuties.filter(d => getGender(d.assigned) === "male").map(d => d.assigned);
      // If gender unknown, put in males column as fallback
      const unknown = dayDuties.filter(d => getGender(d.assigned) === "unknown").map(d => d.assigned);
      return { supervisors: [...new Set(supervisors)], females: [...new Set(females)], males: [...new Set([...males, ...unknown])] };
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
          <div className="no-print flex flex-col gap-4 bg-card p-4 rounded-xl border shadow-sm">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex-1 space-y-3 w-full">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={exportSubtitle} onChange={e => setExportSubtitle(e.target.value)} placeholder="Subtitle (e.g. THE OFFICE OF...)" className="flex-1 text-xs sm:text-sm" />
                  <Input value={exportTitle} onChange={e => setExportTitle(e.target.value)} placeholder="Main Title (e.g. ROTA 2026)" className="flex-1 text-xs sm:text-sm font-bold border-primary" />
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input value={exportH1} onChange={e => setExportH1(e.target.value)} placeholder="Column 1 Header" className="flex-1 text-xs sm:text-sm" />
                  <Input value={exportH2} onChange={e => setExportH2(e.target.value)} placeholder="Column 2 Header" className="flex-1 text-xs sm:text-sm" />
                  <Input value={exportH3} onChange={e => setExportH3(e.target.value)} placeholder="Column 3 Header" className="flex-1 text-xs sm:text-sm" />
                </div>
                <div className="bg-muted/50 rounded-lg p-2 text-[10px] text-muted-foreground">
                  <span className="font-semibold">Auto-sort:</span> Councillors are automatically sorted into <span className="text-pink-500 font-semibold">Female</span> and <span className="text-blue-500 font-semibold">Male</span> columns based on their gender in the system.
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
                 <Button variant="outline" className="w-full sm:w-auto" onClick={() => setExportingRota(null)}>Cancel</Button>
                 <Button className="w-full sm:w-auto" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2"/> Print</Button>
              </div>
            </div>
            <div className="border-t pt-4">
              <label className="text-xs font-bold uppercase mb-2 block">Edit Notes / Instructions</label>
              <Textarea 
                value={exportNotes} 
                onChange={e => setExportNotes(e.target.value)} 
                placeholder="Enter notes to appear at the bottom..."
                className="text-xs h-32"
              />
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Working Rota</h1>
          <p className="text-sm text-muted-foreground">Weekly duty assignments.</p>
        </div>
        {canEdit && (
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> New Rota</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-base">Create Weekly Rota</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Week label, e.g. Week 13 (Mar 30 – Apr 5)" value={newWeek} onChange={(e) => setNewWeek(e.target.value)} className="text-sm" />
                <DutyEditor duties={newDuties} setDuties={setNewDuties} councillors={councillors} />
                <Button onClick={handleCreate} className="w-full text-xs">Create Rota</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {rotas.length === 0 && <p className="text-sm text-muted-foreground">No rotas yet.</p>}

      {rotas.map((rota) => (
        <Card key={rota.id}>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {editingId === rota.id ? (
                  <Input value={editWeek} onChange={(e) => setEditWeek(e.target.value)} className="h-7 text-xs w-52" />
                ) : (
                  rota.week
                )}
              </span>
              {canEdit && editingId !== rota.id && (
                <span className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startExport(rota)}><Printer className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(rota)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDelete(rota.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                </span>
              )}
              {canEdit && editingId === rota.id && (
                <span className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSaveEdit}><Save className="h-3.5 w-3.5 text-primary" /></Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            {editingId === rota.id ? (
              <div className="px-3 sm:px-0">
                <DutyEditor duties={editDuties} setDuties={setEditDuties} councillors={councillors} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[460px]">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground w-14">Day</th>
                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Task</th>
                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Assigned</th>
                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Supervisor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rota.duties.map((d, i) => {
                      const gender = getGender(d.assigned);
                      return (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1.5 px-2"><Badge variant={dayVariant[d.day] || "outline"} className="text-[10px]">{d.day}</Badge></td>
                          <td className="py-1.5 px-2">{d.task}</td>
                          <td className="py-1.5 px-2 font-medium">
                            <span className="flex items-center gap-1.5">
                              <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${gender === 'female' ? 'bg-pink-500' : gender === 'male' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                              {d.assigned}
                            </span>
                          </td>
                          <td className="py-1.5 px-2 text-muted-foreground">{d.supervisor || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
