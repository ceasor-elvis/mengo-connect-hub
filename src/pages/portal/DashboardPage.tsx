import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Calendar, FileText, MessageSquare, DollarSign,
  TrendingUp, CheckCircle, Clock, Shield, Heart, Stethoscope,
  Megaphone, Accessibility, Users, Vote, Gavel, UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

/* ── Role-specific sections metadata ── */
interface RoleInfo {
  title: string;
  icon: any;
  color: string;
  responsibilities: string[];
}

const ROLE_INFO: Record<AppRole, RoleInfo> = {
  patron: {
    title: "Patron",
    icon: Shield,
    color: "text-gold",
    responsibilities: [
      "Overall oversight and guidance of the Student Council",
      "Approve requisitions and financial expenditures",
      "Mentor and advise council leadership",
      "Liaise between school administration and council",
      "Authorize major council decisions and events",
    ],
  },
  chairperson: {
    title: "Chairperson",
    icon: UserCheck,
    color: "text-primary",
    responsibilities: [
      "Lead the Student Council and chair cabinet meetings",
      "Oversee all offices and monitor progress",
      "Represent students before school administration",
      "Coordinate with Patron on major decisions",
      "Ensure all secretaries fulfil their mandates",
    ],
  },
  vice_chairperson: {
    title: "Vice Chairperson",
    icon: UserCheck,
    color: "text-primary",
    responsibilities: [
      "Act as Chairperson in their absence",
      "Assist in coordinating council activities",
      "Supervise specific projects delegated by the Chair",
      "Monitor welfare of council members",
    ],
  },
  speaker: {
    title: "Speaker",
    icon: Gavel,
    color: "text-gold",
    responsibilities: [
      "Preside over council parliamentary sessions",
      "Maintain order and enforce standing orders",
      "Ensure every councillor's voice is heard",
      "Rule on motions and points of order",
      "Oversee Electoral Commission processes",
    ],
  },
  deputy_speaker: {
    title: "Deputy Speaker",
    icon: Gavel,
    color: "text-gold",
    responsibilities: [
      "Assist the Speaker in parliamentary duties",
      "Preside over sessions in Speaker's absence",
      "Help maintain decorum during debates",
    ],
  },
  general_secretary: {
    title: "General Secretary",
    icon: FileText,
    color: "text-primary",
    responsibilities: [
      "Record and distribute minutes of all council meetings",
      "Manage council correspondence and communication",
      "Evaluate Student Voice submissions",
      "Coordinate programmes and events calendar",
      "Maintain the council documents archive",
    ],
  },
  assistant_general_secretary: {
    title: "Assistant General Secretary",
    icon: FileText,
    color: "text-primary",
    responsibilities: [
      "Assist the General Secretary in secretarial duties",
      "Manage and update the Working Rota",
      "Help evaluate Student Voice submissions",
      "Compile attendance records for meetings",
    ],
  },
  secretary_finance: {
    title: "Secretary Finance",
    icon: DollarSign,
    color: "text-gold",
    responsibilities: [
      "Manage the council budget and financial records",
      "Process and track requisitions",
      "Prepare termly financial reports",
      "Ensure transparent use of council funds",
      "Co-approve expenditures with the Patron",
    ],
  },
  secretary_welfare: {
    title: "Secretary Welfare",
    icon: Heart,
    color: "text-destructive",
    responsibilities: [
      "Address students' welfare concerns (food, accommodation, safety)",
      "Conduct welfare surveys and report findings",
      "Coordinate with school matron/warden on dormitory issues",
      "Advocate for improved student living conditions",
      "Organize welfare-related awareness campaigns",
    ],
  },
  secretary_health: {
    title: "Secretary Health",
    icon: Stethoscope,
    color: "text-primary",
    responsibilities: [
      "Promote health and hygiene across the school",
      "Liaise with the school nurse and sick bay",
      "Organize health awareness days and first aid training",
      "Monitor sanitation in classrooms, dormitories, and latrines",
      "Report and follow up on health hazards",
    ],
  },
  secretary_women_affairs: {
    title: "Secretary Women Affairs",
    icon: Users,
    color: "text-primary",
    responsibilities: [
      "Advocate for gender equality and girls' welfare",
      "Address issues specific to female students",
      "Organize women empowerment programmes",
      "Ensure sanitary facilities are well-stocked",
      "Mentor and support young female students",
    ],
  },
  secretary_publicity: {
    title: "Secretary Publicity",
    icon: Megaphone,
    color: "text-gold",
    responsibilities: [
      "Manage council communications and notice boards",
      "Publicize events, programmes, and council decisions",
      "Update cabinet photos on the public website",
      "Coordinate with media during school events",
      "Create awareness campaigns for council initiatives",
    ],
  },
  secretary_pwd: {
    title: "Secretary Persons with Disabilities",
    icon: Accessibility,
    color: "text-primary",
    responsibilities: [
      "Advocate for students with disabilities",
      "Ensure school facilities are accessible",
      "Report accessibility barriers to administration",
      "Organize inclusive events and awareness programmes",
      "Liaise with special needs education coordinators",
    ],
  },
  electoral_commission: {
    title: "Electoral Commission",
    icon: Vote,
    color: "text-gold",
    responsibilities: [
      "Organize and oversee all council elections",
      "Screen candidates' academic qualifications",
      "Generate and manage ballot papers",
      "Ensure free, fair, and transparent elections",
      "Announce and gazette election results",
    ],
  },
};

/* ── Stats (common) ── */
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
];

const recentIssues = [
  { title: "Dormitory maintenance schedule", status: "open", raised: "Nakato Grace" },
  { title: "Inter-house sports budget", status: "in_progress", raised: "Mugisha Ronald" },
  { title: "Assembly sound system repair", status: "resolved", raised: "Ssenoga Peter" },
];

export default function DashboardPage() {
  const { profile, roles, hasRole, hasAnyRole } = useAuth();
  const primaryRole = roles[0];
  const info = primaryRole ? ROLE_INFO[primaryRole] : null;

  const showFinance = hasAnyRole(["patron", "chairperson", "secretary_finance"]);
  const showVoices = hasAnyRole(["patron", "chairperson", "general_secretary", "assistant_general_secretary"]) || roles.length === 0;
  const showAllProgress = hasAnyRole(["patron", "chairperson"]) || roles.length === 0;

  return (
    <div>
      {/* Greeting */}
      <h1 className="font-serif text-2xl font-bold text-foreground">
        Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
      </h1>
      <p className="mt-1 text-muted-foreground">
        {info ? `${info.title} — ${ROLE_INFO[primaryRole!].responsibilities[0]}` : "Your council dashboard overview."}
      </p>

      {/* Role Card */}
      {info && (
        <Card className="mt-6 border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <info.icon className={`h-5 w-5 ${info.color}`} />
              Your Office: {info.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm font-medium text-foreground">Key Responsibilities:</p>
            <ul className="space-y-1.5">
              {info.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
        {/* Recent Student Voices — visible to evaluators / all if no role */}
        {showVoices && (
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
        )}

        {/* Recent Issues — all councillors */}
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

      {/* Finance Summary — Patron, Chair, Finance only */}
      {showFinance && (
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
      )}

      {/* All Offices Progress — Chair & Patron */}
      {showAllProgress && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              All Offices Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(Object.entries(ROLE_INFO) as [AppRole, RoleInfo][]).map(([key, ri]) => (
                <div key={key} className="flex items-center gap-3 rounded-lg border p-3">
                  <ri.icon className={`h-5 w-5 shrink-0 ${ri.color}`} />
                  <div>
                    <p className="text-sm font-medium text-card-foreground">{ri.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">{ri.responsibilities[0]}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
