import { useState, useEffect } from "react";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Clock, XCircle, Trash2, ListChecks, Send, AlertCircle, Coins, ArrowRight, Save } from "lucide-react";
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
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { notifyRole } from "@/hooks/useNotify";
import { motion, AnimatePresence } from "framer-motion";

interface LineItem {
  id: string;
  item: string;
  amount: number;
}

interface Requisition {
  id: string;
  purpose: string;
  initiator: string;
  net_disbursed: number;
  liabilities: LineItem[];
  expenses: LineItem[];
  status: string; // Pending, Pending Chairperson, Pending Patron, Approved, Rejected
  approved_by: string | null;
  approved_by_name?: string | null;
  created_at: string;
}

const statusIcon = (s: string) => {
  if (s === "Approved") return <CheckCircle className="mr-1.5 h-3.5 w-3.5" />;
  if (s === "Rejected") return <XCircle className="mr-1.5 h-3.5 w-3.5" />;
  if (s.includes("Pending")) return <Clock className="mr-1.5 h-3.5 w-3.5 animate-pulse" />;
  return <Clock className="mr-1.5 h-3.5 w-3.5" />;
};

const statusVariant = (s: string) => {
  if (s === "Approved") return "default";
  if (s === "Rejected") return "destructive";
  if (s === "Pending Patron") return "warning";
  if (s === "Pending Chairperson") return "outline";
  return "secondary";
};

const statusBadgeClasses = (s: string) => {
  if (s === "Approved") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
  if (s === "Rejected") return "bg-rose-500/10 text-rose-600 border-rose-500/20";
  if (s === "Pending Patron") return "bg-purple-500/10 text-purple-600 border-purple-500/20";
  if (s === "Pending Chairperson") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-slate-500/10 text-slate-600 border-slate-500/20";
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function RequisitionsPage() {
  const { user, profile, hasPermission } = useAuth();
  const { log } = useActivityLog();
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Form State
  const [purpose, setPurpose] = useState("");
  const [liabilities, setLiabilities] = useState<LineItem[]>([]);
  const [expenses, setExpenses] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canApprove = hasPermission("approve_requisition");
  const canForwardToPatron = hasPermission("forward_req_patron");
  const canForwardToChair = hasPermission("forward_req_chair");
  const canManage = hasPermission("manage_requisitions");

  const fetchReqs = async () => {
    try {
      const { data } = await api.get("/requisitions/");
      const reqsData = Array.isArray(data) ? data : data.results || [];
      const parseJSON = (val: any) => {
        try { return typeof val === 'string' ? JSON.parse(val || '[]') : val || []; }
        catch (e) { return []; }
      };
      setReqs(reqsData.map((r: any) => ({
        ...r,
        liabilities: parseJSON(r.liabilities),
        expenses: parseJSON(r.expenses)
      })));
    } catch (error) {
      toast.error("Failed to load requisitions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReqs();
  }, []);

  const totalAmount = [...liabilities, ...expenses].reduce((sum, item) => sum + item.amount, 0);

  const handleAddLineItem = (type: "liability" | "expense") => {
    const newItem = { id: Math.random().toString(36).substr(2, 9), item: "", amount: 0 };
    if (type === "liability") setLiabilities([...liabilities, newItem]);
    else setExpenses([...expenses, newItem]);
  };

  const handleRemoveLineItem = (type: "liability" | "expense", id: string) => {
    if (type === "liability") setLiabilities(liabilities.filter(l => l.id !== id));
    else setExpenses(expenses.filter(e => e.id !== id));
  };

  const handleUpdateItem = (type: "liability" | "expense", id: string, field: "item" | "amount", value: string | number) => {
    const setter = type === "liability" ? setLiabilities : setExpenses;
    const items = type === "liability" ? liabilities : expenses;
    setter(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleAdd = async () => {
    if (!purpose.trim()) { toast.error("Purpose is required"); return; }
    if (totalAmount <= 0) { toast.error("Please add at least one line item with an amount"); return; }
    if (!user) { toast.error("Login required"); return; }

    setSubmitting(true);
    try {
      await api.post("/requisitions/", {
        purpose: purpose.trim(),
        initiator: profile?.full_name || user?.username || "Unknown",
        net_disbursed: totalAmount,
        liabilities,
        expenses,
        status: "Pending"
      });
      toast.success("Requisition created. Don't forget to submit it to the Chairperson.");
      log("created a requisition", "requisitions", purpose);
      setPurpose(""); setLiabilities([]); setExpenses([]); setOpen(false);
      fetchReqs();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error creation requisition");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string, actionMsg: string) => {
    if (!user) return;
    try {
      await api.patch(`/requisitions/${id}/`, { status: newStatus, approved_by: user.id });
      toast.success(actionMsg);
      log(`${newStatus.toLowerCase()} requisition`, "requisitions");
      fetchReqs();
      
      if (newStatus === "Pending Chairperson") {
        notifyRole("chairperson", "Requisition Forwarded", `A new requisition from ${user.username} has been submitted for your approval.`, "info");
      } else if (newStatus === "Pending Patron") {
        notifyRole("patron", "Requisition Pending Approval", `A requisition has been approved by the Chairperson and is now awaiting your final signature.`, "info");
      }

    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error updating status");
    }
  };

  const handleDelete = async (id: string, reqPurpose: string) => {
    try {
      await api.delete(`/requisitions/${id}/`);
      toast.success("Successfully deleted");
      log("deleted a requisition", "requisitions", reqPurpose);
      fetchReqs();
    } catch (e: any) {
      toast.error("Error deleting requisition");
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-8 pb-12 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl -z-10" />

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-end">
        <section className="flex flex-col gap-2 relative flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider w-fit"
          >
            <Coins className="w-3 h-3" /> Financial Control
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Requisitions
          </h1>
          <p className="text-muted-foreground/80 mt-1 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Manage detailed accountability and oversee the multi-stage financial approval chain.
          </p>
        </section>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="rounded-xl font-bold shadow-lg shadow-amber-500/20 bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto h-12 px-6 shrink-0">
              <Plus className="mr-2 h-5 w-5" /> New Requisition
            </Button>
          </DialogTrigger>
          <DialogContent aria-describedby={undefined} className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0">
            <div className="p-6 border-b border-border/20 bg-amber-500/5 sticky top-0 z-20 backdrop-blur-xl">
              <DialogTitle className="font-serif text-2xl font-black text-amber-600 flex items-center gap-2">
                <Coins className="h-6 w-6" /> File New Requisition
              </DialogTitle>
            </div>
            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid gap-6 sm:grid-cols-2 bg-muted/20 p-5 rounded-2xl border border-border/50">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reference / Purpose *</Label>
                  <Input className="h-11 bg-background border-border/50 rounded-xl focus-visible:ring-amber-500/20 font-medium" value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Science Fair Logistics" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Initiator (Autofilled)</Label>
                  <Input className="h-11 bg-muted/50 border-border/50 rounded-xl font-medium text-foreground/70" value={profile?.full_name || user?.username || ""} disabled />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <Label className="text-sm font-black uppercase tracking-widest text-rose-500/80">Liabilities (Debts)</Label>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold text-xs bg-rose-500/5 text-rose-600 border-rose-500/20 hover:bg-rose-500/10" onClick={() => handleAddLineItem("liability")}>
                    <Plus className="mr-1 h-3 w-3" /> Add Liability
                  </Button>
                </div>
                <AnimatePresence>
                  {liabilities.map((l) => (
                    <motion.div key={l.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 items-start sm:items-center">
                      <div className="flex-1">
                        <Input className="bg-muted/30 border-border/50 rounded-xl h-11" value={l.item} onChange={e => handleUpdateItem("liability", l.id, "item", e.target.value)} placeholder="Creditor/Items description" />
                      </div>
                      <div className="w-32 sm:w-40 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">UGX</span>
                        <Input className="bg-muted/30 border-border/50 rounded-xl h-11 pl-10 font-mono" type="number" value={l.amount || ""} onChange={e => handleUpdateItem("liability", l.id, "amount", Number(e.target.value))} placeholder="0" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50 shrink-0" onClick={() => handleRemoveLineItem("liability", l.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                  {liabilities.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground/60 text-sm font-medium border border-dashed border-border/50 rounded-xl bg-muted/10">
                      No liabilities added.
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <Label className="text-sm font-black uppercase tracking-widest text-blue-500/80">Expenses (Spendings)</Label>
                  <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold text-xs bg-blue-500/5 text-blue-600 border-blue-500/20 hover:bg-blue-500/10" onClick={() => handleAddLineItem("expense")}>
                    <Plus className="mr-1 h-3 w-3" /> Add Expense
                  </Button>
                </div>
                <AnimatePresence>
                  {expenses.map((e) => (
                    <motion.div key={e.id} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="flex gap-3 items-start sm:items-center">
                      <div className="flex-1">
                        <Input className="bg-muted/30 border-border/50 rounded-xl h-11" value={e.item} onChange={evt => handleUpdateItem("expense", e.id, "item", evt.target.value)} placeholder="Purpose of spend" />
                      </div>
                      <div className="w-32 sm:w-40 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">UGX</span>
                        <Input className="bg-muted/30 border-border/50 rounded-xl h-11 pl-10 font-mono" type="number" value={e.amount || ""} onChange={evt => handleUpdateItem("expense", e.id, "amount", Number(evt.target.value))} placeholder="0" />
                      </div>
                      <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl text-rose-500 hover:bg-rose-50 shrink-0" onClick={() => handleRemoveLineItem("expense", e.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                  {expenses.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground/60 text-sm font-medium border border-dashed border-border/50 rounded-xl bg-muted/10">
                      No expenses added.
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="font-bold text-amber-700 uppercase tracking-widest text-xs">Total Net Disbursed</span>
                <span className="text-3xl font-serif font-black text-amber-600">UGX {totalAmount.toLocaleString()}</span>
              </div>

              <div className="pt-4 border-t border-border/40">
                <Button onClick={handleAdd} disabled={submitting} className="w-full h-14 rounded-xl text-base font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20">
                  {submitting ? "Processing..." : "Create Requisition Record"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
             <div key={i} className="h-28 rounded-3xl bg-card/60 border border-border/40 animate-pulse"></div>
          ))}
        </div>
      ) : reqs.length === 0 ? (
        <div className="text-center py-24 border border-dashed border-border/60 rounded-3xl bg-muted/10 backdrop-blur-sm">
          <Coins className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-bold text-lg text-foreground">No Requisitions</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto mt-1">No financial requisitions have been tracked in the hub yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="hidden md:grid grid-cols-12 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
            <div className="col-span-5">Reference / Purpose</div>
            <div className="col-span-2">Initiator</div>
            <div className="col-span-2">Net Disbursed</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          
          <AnimatePresence>
            {reqs.map((req) => (
              <motion.div key={req.id} variants={itemVariants} layout>
                <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${req.status === 'Approved' ? 'bg-emerald-500' : req.status === 'Rejected' ? 'bg-rose-500' : req.status === 'Pending Patron' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                  <CardContent className="p-5 flex flex-col md:grid md:grid-cols-12 gap-6 items-start md:items-center">
                    
                    <div className="col-span-5 w-full flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shrink-0 border border-border/50 shadow-sm group-hover:scale-105 transition-transform">
                        <ListChecks className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground text-base truncate flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">#{String(req.id).substring(0,6)}</span>
                          <span className="text-muted-foreground/30">•</span>
                          {req.purpose || "Unknown Purpose"}
                        </p>
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">
                          {req.created_at ? new Date(req.created_at).toLocaleString('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "-"}
                        </p>
                      </div>
                    </div>

                    <div className="col-span-2 w-full md:w-auto flex flex-col md:block">
                      <span className="md:hidden text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Initiator</span>
                      <p className="text-sm font-bold text-foreground/80">{req.initiator}</p>
                    </div>

                    <div className="col-span-2 w-full md:w-auto flex flex-col md:block">
                      <span className="md:hidden text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Net Disbursed</span>
                      <p className="text-base font-serif font-black text-primary">UGX {Number(req.net_disbursed || 0).toLocaleString()}</p>
                    </div>

                    <div className="col-span-2 w-full md:w-auto flex flex-col md:block">
                      <span className="md:hidden text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Status</span>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest px-2.5 py-1 ${statusBadgeClasses(req.status)}`}>
                          {statusIcon(req.status)} {req.status}
                        </Badge>
                        {req.status === 'Approved' && req.approved_by_name && (
                          <span className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                            By {req.approved_by_name}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="col-span-1 w-full flex flex-wrap justify-end gap-2 mt-2 md:mt-0">
                      {/* View Details Modal */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="secondary" size="sm" className="h-9 rounded-lg font-bold">
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0">
                          <div className="p-6 border-b border-border/20 bg-primary/5 sticky top-0 z-20 backdrop-blur-xl">
                            <DialogTitle className="font-serif text-2xl font-black text-primary flex items-center gap-2">
                              <Coins className="h-6 w-6" /> Requisition Details
                            </DialogTitle>
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              <span className="text-xs font-mono font-bold text-muted-foreground bg-background/50 px-2 py-1 rounded-md border border-border/50">#{req.id}</span>
                              <Badge variant="outline" className={`text-[10px] uppercase font-black tracking-widest bg-background/50 ${statusBadgeClasses(req.status)}`}>
                                {req.status}
                              </Badge>
                              {req.status === 'Approved' && req.approved_by_name && (
                                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600/80">
                                  Approved by {req.approved_by_name}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="p-6 sm:p-8 space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-muted/20 p-5 rounded-2xl border border-border/50">
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Reference / Purpose</span>
                                <p className="font-bold text-foreground text-base">{req.purpose || "Unknown"}</p>
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">Initiator</span>
                                <p className="font-bold text-foreground text-base">{req.initiator}</p>
                              </div>
                            </div>

                            {req.liabilities && req.liabilities.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-black text-sm uppercase tracking-widest text-rose-500/80 border-b border-border/40 pb-2">Liabilities (Debts)</h4>
                                <div className="space-y-2">
                                  {req.liabilities.map((l, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm py-2 px-3 bg-muted/30 rounded-xl border border-border/50">
                                      <span className="font-medium text-foreground/80">{l.item || "Unknown Liability"}</span>
                                      <span className="font-mono font-bold text-foreground">UGX {Number(l.amount || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {req.expenses && req.expenses.length > 0 && (
                              <div className="space-y-3">
                                <h4 className="font-black text-sm uppercase tracking-widest text-blue-500/80 border-b border-border/40 pb-2">Expenses (Spendings)</h4>
                                <div className="space-y-2">
                                  {req.expenses.map((e, i) => (
                                    <div key={i} className="flex justify-between items-center text-sm py-2 px-3 bg-muted/30 rounded-xl border border-border/50">
                                      <span className="font-medium text-foreground/80">{e.item || "Unknown Expense"}</span>
                                      <span className="font-mono font-bold text-foreground">UGX {Number(e.amount || 0).toLocaleString()}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {!((req.liabilities && req.liabilities.length > 0) || (req.expenses && req.expenses.length > 0)) && (
                              <div className="text-center py-10 border border-dashed border-border/50 rounded-2xl bg-muted/10">
                                <span className="text-muted-foreground/60 font-medium text-sm">No line items recorded.</span>
                              </div>
                            )}

                            <div className="bg-primary/5 p-6 rounded-2xl border border-primary/20 flex flex-col sm:flex-row justify-between items-center gap-2">
                              <span className="font-black text-xs uppercase tracking-widest text-primary/70">Total Net Disbursed</span>
                              <span className="font-serif font-black text-3xl text-primary">UGX {Number(req.net_disbursed || 0).toLocaleString()}</span>
                            </div>

                            {/* Action Buttons within Dialog */}
                            <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-border/40">
                              {/* Direct Approval / Rejection */}
                              {req.status !== "Approved" && req.status !== "Rejected" && canApprove && (
                                <>
                                  <Button variant="outline" className="h-11 rounded-xl px-6 font-bold border-rose-500/20 text-rose-600 hover:bg-rose-50" onClick={() => handleStatusUpdate(req.id, "Rejected", "Requisition Rejected")}>
                                    <XCircle className="mr-2 h-4 w-4" /> Reject
                                  </Button>
                                  <Button className="h-11 rounded-xl px-6 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" onClick={() => handleStatusUpdate(req.id, "Approved", "Requisition Fully Approved")}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Final Actions (Delete) */}
                      {hasPermission("manage_permissions") && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-serif text-xl">Delete Requisition?</AlertDialogTitle>
                              <AlertDialogDescription className="text-sm font-medium">
                                This will permanently delete requisition "{req.purpose}". This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(req.id, req.purpose)} className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white">
                                Delete Permanently
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
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
