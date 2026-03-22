import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Calendar, FileText, MessageSquare, DollarSign, TrendingUp, CheckCircle, Clock } from "lucide-react";

const stats = [
  { label: "Student Voices", value: "23", icon: MessageSquare, color: "text-primary", change: "+5 this week" },
  { label: "Open Issues", value: "7", icon: AlertTriangle, color: "text-gold", change: "3 resolved" },
  { label: "Programmes", value: "12", icon: Calendar, color: "text-primary", change: "2 upcoming" },
  { label: "Documents", value: "45", icon: FileText, color: "text-gold", change: "8 new" },
];

const recentVoices = [
  { title: "Library Opening Hours", category: "Ideas", status: "pending", date: "Mar 20, 2026" },
  { title: "Broken Desks in S.3 East", category: "Complaints", status: "approved", date: "Mar 19, 2026" },
  { title: "Science Fair Proposal", category: "Projects", status: "pending", date: "Mar 18, 2026" },
  { title: "Water Supply Issues", category: "Complaints", status: "approved", date: "Mar 17, 2026" },
];

const recentIssues = [
  { title: "Dormitory maintenance schedule", status: "open", raised: "Nakato Grace" },
  { title: "Inter-house sports budget", status: "in_progress", raised: "Mugisha Ronald" },
  { title: "Assembly sound system repair", status: "resolved", raised: "Ssenoga Peter" },
];

export default function DashboardPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-foreground">Welcome back, Councillor!</h1>
      <p className="mt-1 text-muted-foreground">Here's an overview of your council activities.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-card-foreground">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent Student Voices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Student Voices
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentVoices.map((v) => (
              <div key={v.title} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{v.title}</p>
                  <p className="text-xs text-muted-foreground">{v.category} • {v.date}</p>
                </div>
                <Badge variant={v.status === "approved" ? "default" : "secondary"}>
                  {v.status === "approved" ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                  {v.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-gold" />
              Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentIssues.map((i) => (
              <div key={i.title} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{i.title}</p>
                  <p className="text-xs text-muted-foreground">Raised by {i.raised}</p>
                </div>
                <Badge variant={i.status === "resolved" ? "default" : i.status === "in_progress" ? "secondary" : "outline"}>
                  {i.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Finance Summary */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-gold" />
            Finance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-2xl font-bold text-card-foreground">UGX 2.4M</p>
              <p className="text-xs text-muted-foreground">Total Budget</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-2xl font-bold text-primary">UGX 1.8M</p>
              <p className="text-xs text-muted-foreground">Spent</p>
            </div>
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-2xl font-bold text-gold">UGX 600K</p>
              <p className="text-xs text-muted-foreground">Remaining</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
