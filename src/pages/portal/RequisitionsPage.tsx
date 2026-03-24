import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, CheckCircle, Clock, XCircle } from "lucide-react";

const DUMMY_REQUISITIONS = [
  { id: 1, item: "PA System Repair", amount: 350000, requested_by: "Ssenoga Peter", status: "approved", date: "Mar 18" },
  { id: 2, item: "Sports Equipment", amount: 480000, requested_by: "Lwanga David", status: "pending", date: "Mar 19" },
  { id: 3, item: "First Aid Kit", amount: 120000, requested_by: "Okello Joseph", status: "approved", date: "Mar 15" },
  { id: 4, item: "Newsletter Printing", amount: 95000, requested_by: "Ssenoga Peter", status: "rejected", date: "Mar 14" },
  { id: 5, item: "Debate Transport", amount: 250000, requested_by: "Lwanga David", status: "pending", date: "Mar 20" },
  { id: 6, item: "Women's Day Expenses", amount: 180000, requested_by: "Babirye Esther", status: "approved", date: "Mar 8" },
];

const statusIcon = (s: string) => {
  if (s === "approved") return <CheckCircle className="mr-1 h-3 w-3" />;
  if (s === "rejected") return <XCircle className="mr-1 h-3 w-3" />;
  return <Clock className="mr-1 h-3 w-3" />;
};

const statusVariant = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

export default function RequisitionsPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Requisitions</h1>
          <p className="text-sm text-muted-foreground">Financial requests & approvals.</p>
        </div>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" /> New Request</Button>
      </div>

      <div className="space-y-2">
        {DUMMY_REQUISITIONS.map((req) => (
          <Card key={req.id}>
            <CardContent className="flex items-center justify-between p-3 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 shrink-0">
                  <DollarSign className="h-4 w-4 text-gold" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{req.item}</p>
                  <p className="text-[10px] text-muted-foreground">{req.requested_by} • {req.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-xs font-bold hidden sm:block">UGX {req.amount.toLocaleString()}</p>
                <Badge variant={statusVariant(req.status) as any} className="text-[10px]">
                  {statusIcon(req.status)} {req.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
