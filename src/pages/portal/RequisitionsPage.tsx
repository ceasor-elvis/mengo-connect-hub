import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, CheckCircle, Clock, XCircle, Trash2, ListChecks } from "lucide-react";
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
  created_at: string;
}

const statusIcon = (s: string) => {
  if (s === "Approved") return <CheckCircle className="mr-1 h-3 w-3" />;
  if (s === "Rejected") return <XCircle className="mr-1 h-3 w-3" />;
  return <Clock className="mr-1 h-3 w-3" />;
};

const statusVariant = (s: string) => {
  if (s === "Approved") return "default";
  if (s === "Rejected") return "destructive";
  if (s === "Pending Patron") return "warning";
  if (s === "Pending Chairperson") return "outline";
  return "secondary";
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
      setReqs(Array.isArray(data) ? data : data.results || []);
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
      } else if (newStatus === "Approved") {
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary sm:text-3xl">Financial Requisitions</h1>
          <p className="text-sm text-muted-foreground">Detailed accountability and multi-stage approval chain.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="shadow-md"><Plus className="mr-2 h-5 w-5" /> New Requisition</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>File New Requisition</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Reference / Purpose *</Label>
                  <Input value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Science Fair Logistics" />
                </div>
                <div className="space-y-2">
                  <Label>Initiator (Autofilled)</Label>
                  <Input value={profile?.full_name || user?.username || ""} disabled className="bg-muted/50" />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold text-primary">Liabilities (Debts)</Label>
                  <Button variant="outline" size="sm" onClick={() => handleAddLineItem("liability")}>
                    <Plus className="mr-1 h-3 w-3" /> Add Liability
                  </Button>
                </div>
                {liabilities.map((l) => (
                  <div key={l.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Input value={l.item} onChange={e => handleUpdateItem("liability", l.id, "item", e.target.value)} placeholder="Creditor/Items" />
                    </div>
                    <div className="w-32 space-y-1">
                      <Input type="number" value={l.amount} onChange={e => handleUpdateItem("liability", l.id, "amount", Number(e.target.value))} placeholder="Amount" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={() => handleRemoveLineItem("liability", l.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-bold text-primary">Expenses (Spendings)</Label>
                  <Button variant="outline" size="sm" onClick={() => handleAddLineItem("expense")}>
                    <Plus className="mr-1 h-3 w-3" /> Add Expense
                  </Button>
                </div>
                {expenses.map((e) => (
                  <div key={e.id} className="flex gap-2 items-end">
                    <div className="flex-1 space-y-1">
                      <Input value={e.item} onChange={evt => handleUpdateItem("expense", e.id, "item", evt.target.value)} placeholder="Purpose of spend" />
                    </div>
                    <div className="w-32 space-y-1">
                      <Input type="number" value={e.amount} onChange={evt => handleUpdateItem("expense", e.id, "amount", Number(evt.target.value))} placeholder="Amount" />
                    </div>
                    <Button variant="ghost" size="icon" className="text-destructive h-10 w-10" onClick={() => handleRemoveLineItem("expense", e.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
                <span className="font-bold">Total Net Disbursed:</span>
                <span className="text-xl font-serif font-bold text-primary">UGX {totalAmount.toLocaleString()}</span>
              </div>

              <Button onClick={handleAdd} disabled={submitting} className="w-full text-base py-6 shadow-lg">
                {submitting ? "Processing..." : "Create Requisition Record"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Clock className="animate-spin text-primary h-10 w-10" /></div>
      ) : reqs.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-20 text-center text-muted-foreground">No requisitions tracked in the hub yet.</CardContent></Card>
      ) : (
        <div className="grid gap-4">
          <div className="hidden md:grid grid-cols-6 px-4 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            <div className="col-span-2">Reference / Purpose</div>
            <div>Initiator</div>
            <div>Net Disbursed</div>
            <div>Event Status</div>
            <div className="text-right">Actions</div>
          </div>
          {reqs.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow group">
              <CardContent className="p-4 flex flex-col md:grid md:grid-cols-6 gap-4 items-center">
                <div className="col-span-2 w-full flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
                    <ListChecks className="h-5 w-5 text-gold" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-foreground text-sm flex items-center gap-2">
                      {req.id} <span className="font-normal text-muted-foreground">/</span> {req.purpose || "Unknown Purpose"}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">{req.created_at ? new Date(req.created_at).toLocaleString('en-UG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : "-"}</p>
                  </div>
                </div>

                <div className="w-full md:w-auto flex flex-col md:block">
                  <span className="md:hidden text-[10px] text-muted-foreground font-bold uppercase">Initiator</span>
                  <p className="text-sm font-medium">{req.initiator}</p>
                </div>

                <div className="w-full md:w-auto flex flex-col md:block">
                  <span className="md:hidden text-[10px] text-muted-foreground font-bold uppercase">Net Disbursed</span>
                  <p className="text-sm font-serif font-bold text-primary">UGX {Number(req.net_disbursed || 0).toLocaleString()}</p>
                </div>

                <div className="w-full md:w-auto flex flex-col md:block">
                  <span className="md:hidden text-[10px] text-muted-foreground font-bold uppercase">Event Status</span>
                  <Badge variant={statusVariant(req.status) as any} className="text-[10px] font-bold shadow-sm px-2">
                    {statusIcon(req.status)} {req.status}
                  </Badge>
                </div>

                <div className="w-full flex flex-wrap justify-end gap-2">
                  {/* View Details Modal */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="secondary" size="sm" className="h-8 text-xs">
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="font-serif">Requisition Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-xl border border-border/50">
                          <div>
                            <span className="text-xs uppercase text-muted-foreground font-bold block mb-1">Reference / Purpose</span>
                            <p className="font-medium text-foreground">{req.purpose || "Unknown"}</p>
                          </div>
                          <div>
                            <span className="text-xs uppercase text-muted-foreground font-bold block mb-1">Initiator</span>
                            <p className="font-medium text-foreground">{req.initiator}</p>
                          </div>
                        </div>

                        {req.liabilities && req.liabilities.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-2 text-primary">Liabilities (Debts)</h4>
                            {req.liabilities.map((l, i) => (
                              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                                <span>{l.item || "Unknown Liability"}</span>
                                <span className="font-mono text-muted-foreground">UGX {Number(l.amount || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {req.expenses && req.expenses.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-sm border-b pb-2 text-primary">Expenses (Spendings)</h4>
                            {req.expenses.map((e, i) => (
                              <div key={i} className="flex justify-between items-center text-sm py-1 border-b border-border/50 last:border-0">
                                <span>{e.item || "Unknown Expense"}</span>
                                <span className="font-mono text-muted-foreground">UGX {Number(e.amount || 0).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {!((req.liabilities && req.liabilities.length > 0) || (req.expenses && req.expenses.length > 0)) && (
                          <div className="text-center py-6 text-muted-foreground italic text-sm">
                            No line items were recorded for this requisition.
                          </div>
                        )}

                        <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex justify-between items-center mt-2">
                          <span className="font-bold text-sm text-primary">Total Net Disbursed</span>
                          <span className="font-serif font-bold text-xl text-primary">UGX {Number(req.net_disbursed || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* Step 1: Submit to Chairperson (Finance, or Creator with manage_requisitions) */}
                  {req.status === "Pending" && (canForwardToChair || (req.initiator === (profile?.full_name || user?.username) && canManage)) && (
                    <Button size="sm" className="h-8 text-xs bg-gold hover:bg-gold/80" onClick={() => handleStatusUpdate(req.id, "Pending Chairperson", "Forwarded to Chairperson")}>
                      Forward to Chair
                    </Button>
                  )}

                  {/* Step 2: Forward to Patron (Only Chairperson or equivalent) */}
                  {req.status === "Pending Chairperson" && canForwardToPatron && (
                    <Button size="sm" className="h-8 text-xs bg-primary hover:bg-primary/80" onClick={() => handleStatusUpdate(req.id, "Pending Patron", "Forwarded to Patron")}>
                      Forward to Patron
                    </Button>
                  )}

                  {/* Step 3: Patron Approval */}
                  {req.status === "Pending Patron" && canApprove && (
                    <div className="flex gap-1">
                      <Button size="sm" className="h-8 text-xs" onClick={() => handleStatusUpdate(req.id, "Approved", "Requisition Fully Approved")}>Approve</Button>
                      <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={() => handleStatusUpdate(req.id, "Rejected", "Requisition Rejected")}>Reject</Button>
                    </div>
                  )}

                  {/* Final Actions (Delete) */}
                  {hasPermission("manage_permissions") && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete requisition "{req.purpose}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(req.id, req.purpose)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
