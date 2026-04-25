import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronRight,
  TrendingUp,
  Briefcase,
  Users,
  X,
  FileText,
  Pencil
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format } from "date-fns";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import DocumentViewer from "@/components/portal/DocumentViewer";

interface PlanStep {
  id: string;
  text: string;
  status: 'pending' | 'completed';
}

interface ActionPlan {
  id: string;
  title: string;
  objective: string;
  category: string;
  steps: PlanStep[];
  start_date: string;
  target_date: string;
  responsible_role: string;
  status: 'pending' | 'in_progress' | 'achieved';
  progress: number;
  created_by: string;
  owner_class?: string;
  owner_stream?: string;
}

const CATEGORIES = ["Welfare", "Academic", "Digital", "Infrastructure", "Discipline", "Social", "Finance"];
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  achieved: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

const SHARED_ROLES = ["councillor"];
const CLASSES = ["S.1", "S.2", "S.3", "S.4", "S.5", "S.6"];

const ROLE_LABELS: Record<string, string> = {
  chairperson: "Chairperson",
  vice_chairperson: "Vice Chairperson",
  general_secretary: "Gen. Secretary",
  assistant_general_secretary: "Asst. Gen. Secretary",
  secretary_finance: "Sec. Finance",
  secretary_welfare: "Sec. Welfare",
  secretary_health: "Sec. Health",
  secretary_publicity: "Sec. Publicity",
  patron: "School Patron",
  councillor: "Councillor",
  adminabsolute: "Absolute Admin",
};

export default function ActionPlanPage() {
  const { user, hasPermission, hasRole, roles } = useAuth();
  const isAdmin = hasRole("adminabsolute");
  const canManage = hasPermission("manage_action_plans");
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ActionPlan | null>(null);
  const [streams, setStreams] = useState<string[]>([]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFooterText, setExportFooterText] = useState("ANOINTED TO BEAR FRUIT");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Form states
  const [newPlan, setNewPlan] = useState({
    title: "",
    objective: "",
    category: "Welfare",
    target_date: "",
    responsible_role: "chairperson",
    owner_class: "",
    owner_stream: "",
    steps: [{ text: "", status: 'pending' }]
  });

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/action-plans/");
      setPlans(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      toast.error("Failed to load action plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    // Fetch streams for admin office assignment
    api.get("/streams/").then(({ data }) => {
      setStreams(Array.isArray(data) ? data.map((s: any) => s.name) : []);
    });
  }, []);

  useEffect(() => {
    if (roles.length > 0 && !isAdmin) {
      setNewPlan(prev => ({ ...prev, responsible_role: roles[0] }));
    }
  }, [roles, isAdmin]);

  const handleAddStep = () => {
    setNewPlan({ ...newPlan, steps: [...newPlan.steps, { text: "", status: 'pending' }] });
  };

  const handleCreatePlan = async () => {
    if (!newPlan.title || !newPlan.objective) {
      return toast.error("Please fill in the title and objective");
    }
    try {
      const payload = {
        ...newPlan,
        id: Date.now().toString(),
        start_date: new Date().toISOString(),
        status: 'pending',
        progress: 0,
        created_by: user?.id,
        owner_role: isAdmin ? newPlan.responsible_role : undefined,
        owner_class: isAdmin ? newPlan.owner_class : undefined,
        owner_stream: isAdmin ? newPlan.owner_stream : undefined,
        steps: newPlan.steps.map((s, i) => ({ ...s, id: `${Date.now()}-${i}` }))
      };
      await api.post("/action-plans/", payload);
      toast.success("Strategic plan added successfully");
      setIsAddOpen(false);
      setNewPlan({
        title: "", objective: "", category: "Welfare", target_date: "", 
        responsible_role: !isAdmin && roles[0] ? roles[0] : "chairperson", 
        owner_class: "", owner_stream: "",
        steps: [{ text: "", status: 'pending' }]
      });
      fetchPlans();
    } catch (e) {
      toast.error("Failed to create plan");
    }
  };

  const handleUpdatePlan = async () => {
    if (!editingPlan || !editingPlan.title || !editingPlan.objective) {
      return toast.error("Please fill in the title and objective");
    }
    try {
      const completedCount = editingPlan.steps.filter(s => s.status === 'completed').length;
      const progress = editingPlan.steps.length > 0 ? Math.round((completedCount / editingPlan.steps.length) * 100) : 0;
      const status = progress === 100 ? 'achieved' : progress > 0 ? 'in_progress' : 'pending';

      const payload = {
        ...editingPlan,
        progress,
        status,
        owner_role: isAdmin ? editingPlan.responsible_role : undefined,
        owner_class: isAdmin ? editingPlan.owner_class : undefined,
        owner_stream: isAdmin ? editingPlan.owner_stream : undefined,
      };
      await api.patch(`/action-plans/${editingPlan.id}/`, payload);
      toast.success("Strategic plan updated successfully");
      setIsEditOpen(false);
      setEditingPlan(null);
      fetchPlans();
    } catch (e) {
      toast.error("Failed to update plan");
    }
  };

  const openEditDialog = (plan: ActionPlan) => {
    setEditingPlan(plan);
    setIsEditOpen(true);
  };

  const toggleStep = async (plan: ActionPlan, stepId: string) => {
    const updatedSteps = plan.steps.map(s => 
      s.id === stepId ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' } as PlanStep : s
    );
    const completedCount = updatedSteps.filter(s => s.status === 'completed').length;
    const progress = Math.round((completedCount / updatedSteps.length) * 100);
    const status = progress === 100 ? 'achieved' : progress > 0 ? 'in_progress' : 'pending';

    try {
      await api.patch(`/action-plans/${plan.id}/`, { 
        steps: updatedSteps, 
        progress,
        status 
      });
      fetchPlans();
    } catch (e) {
      toast.error("Failed to update step");
    }
  };

  const deletePlan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this strategic goal?")) return;
    try {
      await api.delete(`/action-plans/${id}/`);
      toast.success("Plan removed");
      fetchPlans();
    } catch (e) {
      toast.error("Error deleting plan");
    }
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    const addImageToDoc = (src: string, x: number, y: number, w: number, h: number, format: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = "Anonymous";
        img.onload = () => { doc.addImage(img, format, x, y, w, h); resolve(); };
        img.onerror = () => resolve();
      });
    };

    await Promise.all([
      addImageToDoc(mengoBadge, 15, 10, 20, 20, "JPEG"),
      addImageToDoc(unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
    ]);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    doc.text("VINE STUDENTS' COUNCIL BODY", pageW / 2, y, { align: "center" });
    y += 10; doc.setFontSize(12);
    doc.text("STRATEGIC ACTION PLAN REPORT", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 15, y);
    y += 10;

    plans.forEach((plan, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFillColor(245, 245, 245); doc.rect(15, y, pageW - 30, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(`${idx + 1}. ${plan.title.toUpperCase()}`, 17, y + 5.5);
      y += 10;

      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      const objLines = doc.splitTextToSize(`Objective: ${plan.objective}`, pageW - 40);
      doc.text(objLines, 20, y);
      y += (objLines.length * 4) + 4;

      doc.text(`Category: ${plan.category} | Status: ${plan.status} | Progress: ${plan.progress}%`, 20, y);
      y += 6;
      doc.text(`Timeline: ${format(new Date(plan.start_date), 'MMM d')} - ${plan.target_date ? format(new Date(plan.target_date), 'MMM d, yyyy') : 'TBD'}`, 20, y);
      y += 6;
      doc.text(`Office in Charge: ${ROLE_LABELS[plan.responsible_role] || plan.responsible_role}`, 20, y);
      y += 10;

      doc.setFont("helvetica", "bold"); doc.text("Milestones:", 20, y); y += 5;
      doc.setFont("helvetica", "normal");
      plan.steps.forEach(step => {
        const check = step.status === 'completed' ? "[X]" : "[ ]";
        doc.text(`${check} ${step.text}`, 25, y);
        y += 5;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 10;
    });

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(exportFooterText, pageW / 2, 285, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("Strategic report preview generated!");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Education Hero Section */}
      <Card className="border-none bg-gradient-to-br from-primary/10 via-background to-primary/5 shadow-2xl overflow-hidden relative group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:bg-primary/10" />
        <CardHeader className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary text-primary-foreground rounded-lg shadow-lg">
              <Lightbulb className="w-6 h-6 animate-pulse" />
            </div>
            <CardTitle className="text-2xl font-serif">Strategic Planning Hub</CardTitle>
          </div>
          <CardTitle className="text-xl font-bold mt-4">What is an Action Plan?</CardTitle>
          <CardDescription className="text-base text-foreground/80 max-w-3xl leading-relaxed mt-2">
            An Action Plan is a <strong>strategic roadmap</strong> that outlines the specific steps, resources, and timelines needed to achieve a council goal. 
            It transforms abstract visions into concrete, trackable tasks, ensuring accountability across the leadership cabinet.
          </CardDescription>
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border text-xs font-medium backdrop-blur-sm">
              <Target className="w-3.5 h-3.5 text-primary" /> Define the Goal
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border text-xs font-medium backdrop-blur-sm">
              <ChevronRight className="w-3.5 h-3.5 text-primary" /> Break it into Steps
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border text-xs font-medium backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-primary" /> Assign Responsibility
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 border text-xs font-medium backdrop-blur-sm">
              <Clock className="w-3.5 h-3.5 text-primary" /> Set a Deadline
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold font-serif flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" /> Current Action Items
        </h2>
        <div className="flex items-center gap-2">
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={plans.length === 0} className="border-primary/20 text-primary">
                <FileText className="w-4 h-4 mr-2" /> Export Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Strategic Report</DialogTitle>
                <DialogDescription>Customize your report footer before downloading.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="footerText">Document Footer Slogan</Label>
                  <Input 
                    id="footerText" 
                    value={exportFooterText} 
                    onChange={e => setExportFooterText(e.target.value)} 
                    placeholder="e.g. ANOINTED TO BEAR FRUIT"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
                <Button onClick={generatePDFReport}>View Preview</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {canManage && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="shadow-lg hover:shadow-primary/20 transition-all">
                  <Plus className="w-4 h-4 mr-2" /> New Strategy
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Strategic Action Plan</DialogTitle>
                  <DialogDescription>Outline your next big move for the school.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Goal Title</Label>
                    <Input 
                      id="title" 
                      placeholder="e.g. Modernize School Library" 
                      value={newPlan.title}
                      onChange={e => setNewPlan({...newPlan, title: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="objective">Primary Objective</Label>
                    <Textarea 
                      id="objective" 
                      placeholder="What is the main goal we want to achieve?" 
                      className="min-h-[100px]"
                      value={newPlan.objective}
                      onChange={e => setNewPlan({...newPlan, objective: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Select value={newPlan.category} onValueChange={v => setNewPlan({...newPlan, category: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Target Date</Label>
                      <Input 
                        type="date" 
                        value={newPlan.target_date}
                        onChange={e => setNewPlan({...newPlan, target_date: e.target.value})}
                      />
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>Responsible Office</Label>
                        <Select value={newPlan.responsible_role} onValueChange={v => setNewPlan({...newPlan, responsible_role: v})}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {SHARED_ROLES.includes(newPlan.responsible_role) && (
                        <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                          <div className="grid gap-2">
                            <Label>Target Class</Label>
                            <Select value={newPlan.owner_class} onValueChange={v => setNewPlan({...newPlan, owner_class: v})}>
                              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                              <SelectContent>
                                {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-2">
                            <Label>Target Stream</Label>
                            <Select value={newPlan.owner_stream} onValueChange={v => setNewPlan({...newPlan, owner_stream: v})}>
                              <SelectTrigger><SelectValue placeholder="Select Stream" /></SelectTrigger>
                              <SelectContent>
                                {streams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid gap-3">
                    <Label className="flex items-center justify-between">
                      Action Steps
                      <Button type="button" variant="outline" size="sm" onClick={handleAddStep}>
                        <Plus className="w-3 h-3 mr-1" /> Add Step
                      </Button>
                    </Label>
                    {newPlan.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-2">
                        <Input 
                          placeholder={`Step ${idx + 1}`} 
                          value={step.text}
                          onChange={e => {
                            const s = [...newPlan.steps];
                            s[idx].text = e.target.value;
                            setNewPlan({...newPlan, steps: s});
                          }}
                        />
                        {newPlan.steps.length > 1 && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setNewPlan({...newPlan, steps: newPlan.steps.filter((_, i) => i !== idx)})}
                          >
                            <X className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreatePlan}>Create Plan</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading council roadmap…</p>
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed py-20 flex flex-col items-center justify-center text-center">
          <Target className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <CardTitle className="text-muted-foreground font-medium">No active action plans</CardTitle>
          <CardDescription>Click 'New Strategy' to add your first goal for this term.</CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <Card key={plan.id} className="shadow-sm border-border/50 hover:border-primary/30 transition-all flex flex-col group">
              <CardHeader className="pb-3 px-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tight">
                        {plan.category}
                      </Badge>
                      <Badge className={`text-[10px] font-bold uppercase ${STATUS_COLORS[plan.status]}`}>
                        {plan.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-bold group-hover:text-primary transition-colors">{plan.title}</CardTitle>
                  </div>
                  {canManage && (
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                        onClick={() => openEditDialog(plan)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deletePlan(plan.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <CardDescription className="line-clamp-2 mt-1 leading-relaxed">{plan.objective}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-4 px-6">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-primary" /> Progress
                    </span>
                    <span className="text-muted-foreground font-medium">{plan.progress}%</span>
                  </div>
                  <Progress value={plan.progress} className="h-2" />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Milestones</p>
                  <div className="space-y-1.5">
                    {plan.steps.map((step) => (
                      <div 
                        key={step.id} 
                        className={`flex items-start gap-2 p-2 rounded-lg border border-transparent transition-all ${
                          step.status === 'completed' ? 'bg-emerald-500/5 text-emerald-700/80' : 'bg-muted/30 hover:border-primary/20'
                        } ${canManage ? 'cursor-pointer' : 'cursor-default'}`}
                        onClick={() => canManage && toggleStep(plan, step.id)}
                      >
                        {step.status === 'completed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30 shrink-0 mt-0.5" />
                        )}
                        <span className={`text-[13px] leading-tight ${step.status === 'completed' ? 'line-through opacity-70' : ''}`}>
                          {step.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-auto border-t space-y-2 flex flex-col justify-between h-[80px]">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Office in Charge</span>
                      <span className="text-xs font-bold">
                        {ROLE_LABELS[plan.responsible_role] || 'Leadership'}
                        {plan.responsible_role === 'councillor' && plan.owner_class && (
                          <span className="ml-1 text-[10px] text-muted-foreground whitespace-nowrap">
                            ({plan.owner_class} {plan.owner_stream})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Target Completion</span>
                      <span className="text-xs font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-primary" />
                        {plan.target_date ? format(new Date(plan.target_date), 'MMM d, yyyy') : 'TBD'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
      </div>
    )}

    <DocumentViewer 
      isOpen={!!previewUrl} 
      onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} 
      fileUrl={previewUrl} 
      title={`Council Strategic Plan`} 
      type="pdf"
    />
      {/* Edit Plan Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Strategic Action Plan</DialogTitle>
            <DialogDescription>
              Modify your strategic goals and action steps.
            </DialogDescription>
          </DialogHeader>
          {editingPlan && (
            <div className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Title of Strategic Action Plan</Label>
                <Input 
                  value={editingPlan.title} 
                  onChange={e => setEditingPlan({...editingPlan, title: e.target.value})}
                  placeholder="e.g. Enhancing Student Welfare Through Digital Systems"
                />
              </div>
              <div className="grid gap-2">
                <Label>Main Objective</Label>
                <Textarea 
                  value={editingPlan.objective} 
                  onChange={e => setEditingPlan({...editingPlan, objective: e.target.value})}
                  placeholder="What do you want to achieve?"
                  className="h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <Select value={editingPlan.category} onValueChange={v => setEditingPlan({...editingPlan, category: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Target Completion Date</Label>
                  <Input 
                    type="date" 
                    value={editingPlan.target_date ? editingPlan.target_date.split('T')[0] : ""} 
                    onChange={e => setEditingPlan({...editingPlan, target_date: e.target.value})}
                  />
                </div>
              </div>
              
              {isAdmin && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Responsible Office</Label>
                    <Select value={editingPlan.responsible_role} onValueChange={v => setEditingPlan({...editingPlan, responsible_role: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {SHARED_ROLES.includes(editingPlan.responsible_role) && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="grid gap-2">
                        <Label>Target Class</Label>
                        <Select value={editingPlan.owner_class} onValueChange={v => setEditingPlan({...editingPlan, owner_class: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                          <SelectContent>
                            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Target Stream</Label>
                        <Select value={editingPlan.owner_stream} onValueChange={v => setEditingPlan({...editingPlan, owner_stream: v})}>
                          <SelectTrigger><SelectValue placeholder="Select Stream" /></SelectTrigger>
                          <SelectContent>
                            {streams.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-3">
                <Label className="flex items-center justify-between">
                  Action Steps
                  <Button variant="outline" size="sm" onClick={() => setEditingPlan({...editingPlan, steps: [...editingPlan.steps, { id: Date.now().toString(), text: "", status: 'pending' }]})}>
                    <Plus className="h-3 w-3 mr-1" /> Add Milestone
                  </Button>
                </Label>
                <div className="space-y-2">
                  {editingPlan.steps.map((step, idx) => (
                    <div key={step.id} className="flex gap-2">
                      <Input 
                        value={step.text} 
                        onChange={e => {
                          const newSteps = [...editingPlan.steps];
                          newSteps[idx].text = e.target.value;
                          setEditingPlan({...editingPlan, steps: newSteps});
                        }}
                        placeholder={`Step ${idx + 1}`}
                        className="flex-1"
                      />
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setEditingPlan({...editingPlan, steps: editingPlan.steps.filter((_, i) => i !== idx)});
                        }}
                        disabled={editingPlan.steps.length === 1}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdatePlan}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
