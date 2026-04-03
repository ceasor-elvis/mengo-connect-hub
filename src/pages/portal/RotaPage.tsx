import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Plus, Pencil, Trash2, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Duty {
  day: string;
  task: string;
  assigned: string;
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

export default function RotaPage() {
  const { user, hasAnyRole } = useAuth();
  const canEdit = hasAnyRole([...EDITOR_ROLES] as any[]);

  const [rotas, setRotas] = useState<RotaRow[]>([]);
  const [loading, setLoading] = useState(true);

  // New rota form
  const [showAdd, setShowAdd] = useState(false);
  const [newWeek, setNewWeek] = useState("");
  const [newDuties, setNewDuties] = useState<Duty[]>([{ day: "Mon", task: "", assigned: "" }]);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWeek, setEditWeek] = useState("");
  const [editDuties, setEditDuties] = useState<Duty[]>([]);

  const fetchRotas = async () => {
    try {
      const { data } = await api.get("/rotas/");
      const entries = Array.isArray(data) ? data : data.results || [];
      setRotas(
        entries.map((r: any) => ({
          id: r.id,
          week: r.week,
          duties: (Array.isArray(r.duties) ? r.duties : []) as unknown as Duty[],
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
    fetchRotas();
  }, []);

  const addDutyRow = (list: Duty[], setter: (d: Duty[]) => void) => {
    setter([...list, { day: "Mon", task: "", assigned: "" }]);
  };

  const updateDutyRow = (list: Duty[], setter: (d: Duty[]) => void, idx: number, field: keyof Duty, value: string) => {
    const updated = [...list];
    updated[idx] = { ...updated[idx], [field]: value };
    setter(updated);
  };

  const removeDutyRow = (list: Duty[], setter: (d: Duty[]) => void, idx: number) => {
    setter(list.filter((_, i) => i !== idx));
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
      setNewDuties([{ day: "Mon", task: "", assigned: "" }]);
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

  const DutyEditor = ({ duties, setDuties }: { duties: Duty[]; setDuties: (d: Duty[]) => void }) => (
    <div className="space-y-2">
      {duties.map((d, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1.5">
          <Select value={d.day} onValueChange={(v) => updateDutyRow(duties, setDuties, i, "day", v)}>
            <SelectTrigger className="w-20 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>{DAYS.map((day) => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
          </Select>
          <Input className="flex-1 min-w-[120px] h-8 text-xs" placeholder="Task" value={d.task} onChange={(e) => updateDutyRow(duties, setDuties, i, "task", e.target.value)} />
          <Input className="flex-1 min-w-[120px] h-8 text-xs" placeholder="Assigned to" value={d.assigned} onChange={(e) => updateDutyRow(duties, setDuties, i, "assigned", e.target.value)} />
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeDutyRow(duties, setDuties, i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
        </div>
      ))}
      <Button variant="outline" size="sm" className="text-xs" onClick={() => addDutyRow(duties, setDuties)}><Plus className="h-3 w-3 mr-1" /> Add Row</Button>
    </div>
  );

  if (loading) return <p className="text-sm text-muted-foreground p-4">Loading…</p>;

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
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="text-base">Create Weekly Rota</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Week label, e.g. Week 13 (Mar 30 – Apr 5)" value={newWeek} onChange={(e) => setNewWeek(e.target.value)} className="text-sm" />
                <DutyEditor duties={newDuties} setDuties={setNewDuties} />
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
                <DutyEditor duties={editDuties} setDuties={setEditDuties} />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm min-w-[360px]">
                  <thead>
                    <tr className="border-b">
                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground w-14">Day</th>
                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Task</th>
                      <th className="py-1.5 px-2 text-left font-medium text-muted-foreground">Assigned</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rota.duties.map((d, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-1.5 px-2"><Badge variant={dayVariant[d.day] || "outline"} className="text-[10px]">{d.day}</Badge></td>
                        <td className="py-1.5 px-2">{d.task}</td>
                        <td className="py-1.5 px-2 font-medium">{d.assigned}</td>
                      </tr>
                    ))}
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
