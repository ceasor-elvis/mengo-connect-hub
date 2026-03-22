import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Plus, CheckCircle, Clock, XCircle } from "lucide-react";

const DUMMY_REQUISITIONS = [
  { id: 1, item: "Public Address System Repair", amount: 350000, requested_by: "Ssenoga Peter", status: "approved", date: "Mar 18, 2026" },
  { id: 2, item: "Sports Equipment (Footballs & Nets)", amount: 480000, requested_by: "Lwanga David", status: "pending", date: "Mar 19, 2026" },
  { id: 3, item: "First Aid Kit Restocking", amount: 120000, requested_by: "Okello Joseph", status: "approved", date: "Mar 15, 2026" },
  { id: 4, item: "Printing of Council Newsletters", amount: 95000, requested_by: "Ssenoga Peter", status: "rejected", date: "Mar 14, 2026" },
  { id: 5, item: "Debate Club Transport", amount: 250000, requested_by: "Lwanga David", status: "pending", date: "Mar 20, 2026" },
  { id: 6, item: "Women's Day Celebration Expenses", amount: 180000, requested_by: "Babirye Esther", status: "approved", date: "Mar 8, 2026" },
];

const statusIcon = (s: string) => {
  if (s === "approved") return <CheckCircle className="mr-1 h-3 w-3" />;
  if (s === "rejected") return <XCircle className="mr-1 h-3 w-3" />;
  return <Clock className="mr-1 h-3 w-3" />;
};

const statusVariant = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

export default function RequisitionsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Requisitions</h1>
          <p className="mt-1 text-muted-foreground">Manage financial requests and approvals.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Request
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {DUMMY_REQUISITIONS.map((req) => (
          <Card key={req.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                  <DollarSign className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{req.item}</p>
                  <p className="text-xs text-muted-foreground">By {req.requested_by} • {req.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-card-foreground">UGX {req.amount.toLocaleString()}</p>
                <Badge variant={statusVariant(req.status) as any}>
                  {statusIcon(req.status)}
                  {req.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
