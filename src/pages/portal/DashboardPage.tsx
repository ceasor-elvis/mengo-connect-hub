import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Calendar, FileText, MessageSquare, DollarSign,
  TrendingUp, CheckCircle, Shield, Heart, Stethoscope,
  Megaphone, Accessibility, Users, Vote, Gavel, UserCheck, type LucideIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

type AppRole = string;

interface RoleInfo { title: string; icon: LucideIcon; color: string; responsibilities: string[]; }

interface DashboardStats {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change: string;
}

interface RecentVoice {
  title: string;
  category: string;
  status: string;
  date: string;
}

interface RecentIssue {
  title: string;
  status: string;
  raised: string;
}

interface FinanceItem {
  v: string;
  l: string;
}

const ROLE_INFO: Record<string, RoleInfo> = {
  adminabsolute: { title: "Admin Absolute", icon: Shield, color: "text-red-500", responsibilities: ["Full system access", "Bypass all restrictions", "Manage everything"] },
  patron: { title: "Patron", icon: Shield, color: "text-gold", responsibilities: ["Overall oversight and guidance", "Final approval of council documents", "Mentor council leadership", "Liaise with administration"] },
  chairperson: { title: "Chairperson", icon: UserCheck, color: "text-primary", responsibilities: ["Lead the Student Council", "Approve & Forward documents to Patron", "Oversee all offices", "Coordinate with Patron"] },
  vice_chairperson: { title: "Vice Chairperson", icon: UserCheck, color: "text-primary", responsibilities: ["Act as Chairperson when absent", "Assist in coordination", "Supervise delegated projects"] },
  speaker: { title: "Speaker", icon: Gavel, color: "text-gold", responsibilities: ["Preside over parliamentary sessions", "Maintain order", "Rule on motions", "Oversee EC processes"] },
  deputy_speaker: { title: "Deputy Speaker", icon: Gavel, color: "text-gold", responsibilities: ["Assist Speaker", "Preside when Speaker absent", "Maintain decorum"] },
  general_secretary: { title: "General Secretary", icon: FileText, color: "text-primary", responsibilities: ["Record minutes", "Manage communications", "Evaluate Student Voices", "Coordinate programmes"] },
  assistant_general_secretary: { title: "Asst. Gen. Secretary", icon: FileText, color: "text-primary", responsibilities: ["Assist Gen. Secretary", "Manage Working Rota", "Compile attendance"] },
  secretary_finance: { title: "Secretary Finance", icon: DollarSign, color: "text-gold", responsibilities: ["Manage council budget", "Track requisitions", "Prepare financial reports"] },
  secretary_welfare: { title: "Secretary Welfare", icon: Heart, color: "text-destructive", responsibilities: ["Address welfare concerns", "Conduct surveys", "Coordinate with matron"] },
  secretary_health: { title: "Secretary Health", icon: Stethoscope, color: "text-primary", responsibilities: ["Promote hygiene", "Liaise with sick bay", "Monitor sanitation"] },
  secretary_women_affairs: { title: "Secretary Women Affairs", icon: Users, color: "text-primary", responsibilities: ["Advocate gender equality", "Address girls' welfare", "Ensure sanitary facilities"] },
  secretary_publicity: { title: "Secretary Publicity", icon: Megaphone, color: "text-gold", responsibilities: ["Manage communications", "Publicize events", "Create awareness campaigns"] },
  secretary_pwd: { title: "Secretary PWD", icon: Accessibility, color: "text-primary", responsibilities: ["Advocate for students with disabilities", "Ensure accessibility", "Organize inclusive events"] },
  electoral_commission: { title: "Electoral Commission", icon: Vote, color: "text-gold", responsibilities: ["Organize elections", "Screen candidates", "Generate ballots", "Announce results"] },
};

export default function DashboardPage() {
  const { profile, roles, isAbsoluteAdmin, isCouncillor, hasAnyRole } = useAuth();
  const primaryRole = roles[0];
  const info = isAbsoluteAdmin ? ROLE_INFO.adminabsolute : (primaryRole ? ROLE_INFO[primaryRole] : null);

  const showFinance = hasAnyRole(["patron", "chairperson", "secretary_finance"]);
  const showVoices = hasAnyRole(["patron", "chairperson", "general_secretary", "assistant_general_secretary"]) || isCouncillor;
  const showAllProgress = hasAnyRole(["patron", "chairperson"]) || isCouncillor;

  const [dashboardData, setDashboardData] = useState<{
    stats: DashboardStats[];
    recentVoices: RecentVoice[];
    recentIssues: RecentIssue[];
    finance: FinanceItem[];
  } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/dashboard/stats/');
        const data = response.data;
        
        const mappedStats = [
          { label: "Voices", value: data.stats.voices.toString(), icon: MessageSquare, color: "text-primary", change: "Total" },
          { label: "Issues", value: data.stats.issues.toString(), icon: AlertTriangle, color: "text-gold", change: "Recorded" },
          { label: "Events", value: data.stats.events.toString(), icon: Calendar, color: "text-primary", change: "Scheduled" },
          { label: "Docs", value: data.stats.docs.toString(), icon: FileText, color: "text-gold", change: "Uploaded" },
        ];
        
        setDashboardData({
          stats: mappedStats,
          recentVoices: data.recentVoices,
          recentIssues: data.recentIssues,
          finance: data.finance
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };
    
    fetchDashboardData();
  }, [profile]);

  const stats = dashboardData?.stats || [
    { label: "Voices", value: "...", icon: MessageSquare, color: "text-primary", change: "..." },
    { label: "Issues", value: "...", icon: AlertTriangle, color: "text-gold", change: "..." },
    { label: "Events", value: "...", icon: Calendar, color: "text-primary", change: "..." },
    { label: "Docs", value: "...", icon: FileText, color: "text-gold", change: "..." },
  ];
  
  const isPatronStrict = roles.includes("patron") && !isAbsoluteAdmin;
  const recentVoices = (dashboardData?.recentVoices || []).filter(v => {
    if (isPatronStrict) return v.status === "Approved"; // Simple filter for safety, or we assume backend handles it.
    return true;
  });
  const recentIssues = dashboardData?.recentIssues || [];
  const financeData = dashboardData?.finance || [
    { v: "...", l: "Budget" },
    { v: "...", l: "Spent" },
    { v: "...", l: "Left" },
  ];

  return (
    <div className="space-y-4">
      {/* Greeting */}
      <div>
        <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">
          Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
        </h1>
        <p className="text-sm text-muted-foreground">
          {info ? `${info.title} — ${info.responsibilities[0]}` : "Your council dashboard."}
        </p>
      </div>

      {/* Role Card — compact */}
      {info && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <info.icon className={`h-5 w-5 ${info.color}`} />
              <span className="font-semibold text-sm">{info.title}</span>
            </div>
            <ul className="grid gap-1 sm:grid-cols-2">
              {info.responsibilities.map((r, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle className="mt-0.5 h-3 w-3 shrink-0 text-primary" /> {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{s.label}</span>
                <s.icon className={`h-4 w-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <TrendingUp className="h-2.5 w-2.5" /> {s.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Student Voices */}
        {showVoices && (
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-sm">
                <MessageSquare className="h-4 w-4 text-primary" /> Recent Voices
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 space-y-2">
              {recentVoices.map((v) => (
                <div key={v.title} className="flex items-center justify-between rounded-lg border p-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{v.title}</p>
                    <p className="text-[10px] text-muted-foreground">{v.category} • {v.date}</p>
                  </div>
                  <Badge variant={v.status === "approved" ? "default" : "secondary"} className="text-[10px] ml-2 shrink-0">
                    {v.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recent Issues */}
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-gold" /> Recent Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 space-y-2">
            {recentIssues.map((i) => (
              <div key={i.title} className="flex items-center justify-between rounded-lg border p-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{i.title}</p>
                  <p className="text-[10px] text-muted-foreground">{i.raised}</p>
                </div>
                <Badge variant={i.status === "resolved" ? "default" : "secondary"} className="text-[10px] ml-2 shrink-0">
                  {i.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Finance Summary */}
      {showFinance && (
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm">
              <DollarSign className="h-4 w-4 text-gold" /> Finance
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-3 gap-2">
              {financeData.map((f: FinanceItem) => (
                <div key={f.l} className="rounded-lg bg-muted p-2 sm:p-3 text-center">
                  <p className="text-sm font-bold sm:text-lg">{f.v}</p>
                  <p className="text-[10px] text-muted-foreground">{f.l}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Offices — compact grid */}
      {showAllProgress && (
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-primary" /> All Offices
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {(Object.entries(ROLE_INFO) as [AppRole, RoleInfo][]).map(([key, ri]) => (
                <div key={key} className="flex items-center gap-2 rounded-lg border p-2">
                  <ri.icon className={`h-4 w-4 shrink-0 ${ri.color}`} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{ri.title}</p>
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
