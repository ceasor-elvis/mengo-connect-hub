import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, CheckCircle, Clock, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { notifyAllCouncillors } from "@/hooks/useNotify";

interface Requisition {
  id: string; item: string; amount: number; requested_by: string;
  status: string; approved_by: string | null; created_at: string;
}

const statusIcon = (s: string) => {
  if (s === "approved") return <CheckCircle className="mr-1 h-3 w-3" />;
  if (s === "rejected") return <XCircle className="mr-1 h-3 w-3" />;
  return <Clock className="mr-1 h-3 w-3" />;
};
const statusVariant = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

export default function RequisitionsPage() {
  const { user, hasAnyRole } = useAuth();
  const { log } = useActivityLog();
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canApprove = hasAnyRole(["secretary_finance", "patron"]);

  const fetchReqs = async () => {
    try {
      const { data } = await api.get("/requisitions/");
      setReqs(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReqs();
  }, []);

  const handleAdd = async () => {
    if (!item.trim() || !amount) { toast.error("Item & amount required"); return; }
    if (!user) { toast.error("Login required"); return; }
    setSubmitting(true);
    try {
      await api.post("/requisitions/", {
        item: item.trim(),
        amount: Number(amount),
        requested_by: user.id
      });
      toast.success("Request submitted");
      log("submitted a requisition", "requisitions", item);
      notifyAllCouncillors("New Requisition", `Requisition for "${item}" submitted`, "info");
      setItem(""); setAmount(""); setOpen(false);
      fetchReqs();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error submitting request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string, status: "approved" | "rejected") => {
    if (!user) return;
    try {
      await api.patch(`/requisitions/${id}/`, { status, approved_by: user.id });
      toast.success(`Request ${status}`);
      log(`${status} a requisition`, "requisitions");
      fetchReqs();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error updating status");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Requisitions</h1>
          <p className="text-sm text-muted-foreground">Financial requests & approvals.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>New Requisition</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Item *</Label><Input value={item} onChange={e => setItem(e.target.value)} placeholder="e.g. Sports Equipment" /></div>
              <div><Label>Amount (UGX) *</Label><Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 250000" /></div>
              <Button onClick={handleAdd} disabled={submitting} className="w-full">{submitting ? "Saving..." : "Submit Request"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : reqs.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No requisitions yet.</p>
      ) : (
        <div className="space-y-2">
          {reqs.map((req) => (
            <Card key={req.id}>
              <CardContent className="flex items-center justify-between p-3 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 shrink-0">
                    <DollarSign className="h-4 w-4 text-gold" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{req.item}</p>
                    <p className="text-[10px] text-muted-foreground">
                      UGX {req.amount.toLocaleString()} • {new Date(req.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {canApprove && req.status === "pending" ? (
                     <div className="flex gap-1">
                       <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => handleApprove(req.id, "approved")}>Approve</Button>
                       <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => handleApprove(req.id, "rejected")}>Reject</Button>
                     </div>
                  ) : (
                    <Badge variant={statusVariant(req.status) as any} className="text-[10px]">
                      {statusIcon(req.status)} {req.status}
                    </Badge>
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
