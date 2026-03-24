import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";

const DUMMY_ISSUES = [
  { id: 1, title: "Dormitory maintenance overdue", description: "Block B not cleaned in 2 weeks.", status: "open", raised_by: "Nakato Grace", date: "Mar 20" },
  { id: 2, title: "Inter-house sports budget", description: "Need funds for next term competition.", status: "in_progress", raised_by: "Mugisha Ronald", date: "Mar 19" },
  { id: 3, title: "Assembly sound system repair", description: "Microphone and speakers faulty.", status: "resolved", raised_by: "Ssenoga Peter", date: "Mar 15" },
  { id: 4, title: "Library books shortage", description: "S.4/S.6 lack Physics and Chemistry texts.", status: "open", raised_by: "Kato Emmanuel", date: "Mar 14" },
  { id: 5, title: "Lunch queue management", description: "Inefficient queue causing late classes.", status: "in_progress", raised_by: "Nambi Irene", date: "Mar 12" },
  { id: 6, title: "Broken windows S.2 East", description: "3 windows broken during storm.", status: "open", raised_by: "Lwanga David", date: "Mar 10" },
];

const statusColor = (s: string) => s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";

export default function IssuesPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Issues at Hand</h1>
          <p className="text-sm text-muted-foreground">Track issues raised by councillors.</p>
        </div>
        <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Raise Issue</Button>
      </div>

      <div className="space-y-2">
        {DUMMY_ISSUES.map((issue) => (
          <Card key={issue.id}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0 flex-1">
                  <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${issue.status === "resolved" ? "text-primary" : "text-gold"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{issue.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{issue.description}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      By <span className="font-medium">{issue.raised_by}</span> • {issue.date}
                    </p>
                  </div>
                </div>
                <Badge variant={statusColor(issue.status)} className="text-[10px] shrink-0">{issue.status.replace("_", " ")}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
