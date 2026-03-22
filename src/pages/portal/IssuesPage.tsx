import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";

const DUMMY_ISSUES = [
  { id: 1, title: "Dormitory maintenance schedule overdue", description: "The dormitory block B has not been cleaned in 2 weeks. Students are complaining about hygiene.", status: "open", raised_by: "Nakato Grace", date: "Mar 20, 2026" },
  { id: 2, title: "Inter-house sports budget allocation", description: "We need to allocate funds for the upcoming inter-house sports competition next term.", status: "in_progress", raised_by: "Mugisha Ronald", date: "Mar 19, 2026" },
  { id: 3, title: "Assembly sound system needs repair", description: "The microphone and speakers in the main hall have been faulty for the past month.", status: "resolved", raised_by: "Ssenoga Peter", date: "Mar 15, 2026" },
  { id: 4, title: "Library books shortage in Sciences", description: "S.4 and S.6 students report insufficient Physics and Chemistry textbooks.", status: "open", raised_by: "Kato Emmanuel", date: "Mar 14, 2026" },
  { id: 5, title: "Lunch queue management", description: "The dining hall queue system is inefficient, causing students to miss afternoon classes.", status: "in_progress", raised_by: "Nambi Irene", date: "Mar 12, 2026" },
  { id: 6, title: "Broken windows in S.2 classroom", description: "Three windows in the S.2 East classroom were broken during the storm last week.", status: "open", raised_by: "Lwanga David", date: "Mar 10, 2026" },
];

const statusColor = (s: string) => s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";

export default function IssuesPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Issues at Hand</h1>
          <p className="mt-1 text-muted-foreground">Track and manage issues raised by councillors.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Raise Issue
        </Button>
      </div>

      <div className="mt-6 space-y-4">
        {DUMMY_ISSUES.map((issue) => (
          <Card key={issue.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className={`h-4 w-4 ${issue.status === "resolved" ? "text-primary" : "text-gold"}`} />
                  {issue.title}
                </CardTitle>
                <Badge variant={statusColor(issue.status)}>{issue.status.replace("_", " ")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{issue.description}</p>
              <p className="mt-2 text-xs text-muted-foreground">Raised by <span className="font-medium text-card-foreground">{issue.raised_by}</span> • {issue.date}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
