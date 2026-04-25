import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, Calendar, FileText, MessageSquare, DollarSign,
  TrendingUp, CheckCircle, Shield, Heart, Stethoscope,
  Megaphone, Accessibility, Users, Vote, Gavel, UserCheck, type LucideIcon,
  ChevronRight, ArrowUpRight, BarChart3, PieChart as PieChartIcon
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";

type AppRole = string;

interface RoleInfo { title: string; icon: LucideIcon; color: string; responsibilities: string[]; link: string; }

interface DashboardStats {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  change: string;
  key: string;
  path: string;
}

interface RecentVoice { title: string; category: string; status: string; date: string; }
interface RecentIssue { title: string; status: string; raised: string; }
interface FinanceItem { v: string; l: string; raw?: number; }

const ROLE_INFO: Record<string, RoleInfo> = {
  adminabsolute: { title: "Admin Absolute", icon: Shield, color: "text-red-500", link: "/portal/admin-absolute/features", responsibilities: ["Full system access", "Bypass all restrictions", "Manage everything"] },
  patron: { title: "Patron", icon: Shield, color: "text-amber-500", link: "/portal/logs", responsibilities: ["Overall oversight and guidance", "Approve requisitions", "Mentor council leadership", "Liaise with administration"] },
  chairperson: { title: "Chairperson", icon: UserCheck, color: "text-indigo-500", link: "/portal/hierarchy", responsibilities: ["Lead the Student Council", "Oversee all offices", "Represent students", "Coordinate with Patron"] },
  vice_chairperson: { title: "Vice Chairperson", icon: UserCheck, color: "text-indigo-400", link: "/portal/hierarchy", responsibilities: ["Act as Chairperson when absent", "Assist in coordination", "Supervise delegated projects"] },
  speaker: { title: "Speaker", icon: Gavel, color: "text-amber-600", link: "/portal/programmes", responsibilities: ["Preside over parliamentary sessions", "Maintain order", "Rule on motions", "Oversee EC processes"] },
  deputy_speaker: { title: "Deputy Speaker", icon: Gavel, color: "text-amber-500", link: "/portal/programmes", responsibilities: ["Assist Speaker", "Preside when Speaker absent", "Maintain decorum"] },
  general_secretary: { title: "General Secretary", icon: FileText, color: "text-emerald-500", link: "/portal/student-voices", responsibilities: ["Record minutes", "Manage communications", "Evaluate Student Voices", "Coordinate programmes"] },
  assistant_general_secretary: { title: "Asst. Gen. Secretary", icon: FileText, color: "text-emerald-400", link: "/portal/rota", responsibilities: ["Assist Gen. Secretary", "Manage Working Rota", "Compile attendance"] },
  secretary_finance: { title: "Secretary Finance", icon: DollarSign, color: "text-amber-500", link: "/portal/financial-summary", responsibilities: ["Manage council budget", "Track requisitions", "Prepare financial reports"] },
  secretary_welfare: { title: "Secretary Welfare", icon: Heart, color: "text-rose-500", link: "/portal/student-voices", responsibilities: ["Address welfare concerns", "Conduct surveys", "Coordinate with matron"] },
  secretary_health: { title: "Secretary Health", icon: Stethoscope, color: "text-cyan-500", link: "/portal/student-voices", responsibilities: ["Promote hygiene", "Liaise with sick bay", "Monitor sanitation"] },
  secretary_women_affairs: { title: "Secretary Women Affairs", icon: Users, color: "text-purple-500", link: "/portal/student-voices", responsibilities: ["Advocate gender equality", "Address girls' welfare", "Ensure sanitary facilities"] },
  secretary_publicity: { title: "Secretary Publicity", icon: Megaphone, color: "text-orange-500", link: "/portal/blog", responsibilities: ["Manage communications", "Publicize events", "Create awareness campaigns"] },
  secretary_pwd: { title: "Secretary PWD", icon: Accessibility, color: "text-blue-500", link: "/portal/student-voices", responsibilities: ["Advocate for students with disabilities", "Ensure accessibility", "Organize inclusive events"] },
  electoral_commission: { title: "Electoral Commission", icon: Vote, color: "text-slate-600", link: "/portal/elections", responsibilities: ["Organize elections", "Screen candidates", "Generate ballots", "Announce results"] },
};

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
};

export default function DashboardPage() {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();
  const primaryRole = roles[0];
  const info = primaryRole ? ROLE_INFO[primaryRole] : null;

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/dashboard/stats/');
        setDashboardData(data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [profile]);

  const dashboardStats = useMemo(() => {
    if (!dashboardData?.stats) return [];
    const config = [
      { key: "voices", path: "/portal/student-voices", label: "Voices", icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50", change: "submissions" },
      { key: "issues", path: "/portal/issues", label: "Issues", icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", change: "recorded" },
      { key: "events", path: "/portal/programmes", label: "Events", icon: Calendar, color: "text-emerald-600", bg: "bg-emerald-50", change: "scheduled" },
      { key: "docs",   path: "/portal/documents", label: "Documents", icon: FileText, color: "text-blue-600",   bg: "bg-blue-50",   change: "uploaded" },
    ];
    return config
      .filter(c => dashboardData.stats[c.key] !== undefined)
      .map(c => ({
        ...c,
        value: dashboardData.stats[c.key].toString()
      }));
  }, [dashboardData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Header Section */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
            Greetings{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            {info ? `${info.title} Center` : "Welcome to your executive dashboard."}
          </p>
        </div>
        {info && (
          <div className="flex items-center gap-3 bg-card/40 backdrop-blur-md border border-primary/10 px-4 py-2 rounded-2xl shadow-sm">
            <div className={`p-2 rounded-xl ${info.color.replace('text-', 'bg-').replace('-500', '-500/10')}`}>
              <info.icon className={`h-5 w-5 ${info.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Oversight</p>
              <p className="text-sm font-serif font-bold text-foreground">{info.title}</p>
            </div>
          </div>
        )}
      </section>

      {/* Metrics Grid - Dynamically sized based on card count */}
      <div className={`grid gap-4 ${
        dashboardStats.length === 1 ? "grid-cols-1" :
        dashboardStats.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
        dashboardStats.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      }`}>
        {dashboardStats.map((s, idx) => (
          <motion.div key={s.key} variants={itemVariants}>
            <Card 
              className="border-border/50 bg-card/60 backdrop-blur-sm hover:shadow-md transition-all group overflow-hidden cursor-pointer"
              onClick={() => navigate(s.path)}
            >
              <CardContent className="p-5 relative">
                <div className={`absolute -right-2 -top-2 h-16 w-16 opacity-5 transition-transform group-hover:scale-125 ${s.color}`}>
                  <s.icon className="h-full w-full" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-white/50 border-primary/5">Live</Badge>
                </div>
                <p className="text-3xl font-serif font-bold tracking-tight">{s.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">{s.label}</span>
                  <span className="text-[10px] text-primary flex items-center gap-0.5 font-bold">
                    <TrendingUp className="h-3 w-3" /> {s.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Interaction Trend - Graph */}
        {dashboardData?.trends?.length > 0 && (
          <motion.div 
            variants={itemVariants} 
            className={dashboardData?.issueDist?.length > 0 ? "md:col-span-8" : "md:col-span-12"}
          >
            <Card className="h-full border-border/50 bg-card/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-serif">Interaction Trends</CardTitle>
                  <p className="text-xs text-muted-foreground">Monthly Student Voice submissions</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-indigo-600" />
                </div>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                    />
                    <Bar dataKey="voices" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Issue Distribution - Pie Chart */}
        {dashboardData?.issueDist?.length > 0 && (
          <motion.div 
            variants={itemVariants} 
            className={dashboardData?.trends?.length > 0 ? "md:col-span-4" : "md:col-span-12"}
          >
            <Card className="h-full border-border/50 bg-card/60 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-serif">Issue Categories</CardTitle>
                <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                  <PieChartIcon className="h-4 w-4 text-amber-600" />
                </div>
              </CardHeader>
              <CardContent className="h-[300px] flex flex-col justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.issueDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {dashboardData.issueDist.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {dashboardData.issueDist.slice(0, 4).map((d: any, i: number) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* Activity Lists */}
        {(dashboardData?.permissions?.voices || dashboardData?.permissions?.issues) && (
          <motion.div 
            variants={itemVariants} 
            className={(dashboardData?.permissions?.finance) ? "md:col-span-8 flex flex-col gap-6" : "md:col-span-12 flex flex-col gap-6"}
          >
            {dashboardData?.permissions?.voices && (
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-600" /> Critical Student Voices
                  </CardTitle>
                  <Badge 
                    variant="secondary" 
                    onClick={() => navigate("/portal/student-voices")}
                    className="bg-indigo-50 text-indigo-700 border-none hover:bg-indigo-100 cursor-pointer flex items-center gap-1"
                  >
                    View All <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData.recentVoices.map((v: any, idx: number) => (
                    <div key={idx} className="group flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-default">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs uppercase">
                          {v.category.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-semibold group-hover:text-indigo-700 transition-colors">{v.title}</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {v.category} <span className="h-1 w-1 rounded-full bg-slate-300" /> {v.date}
                          </p>
                        </div>
                      </div>
                      <Badge className={`rounded-full px-2.5 py-0.5 text-[10px] border-none shadow-none ${
                        v.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {v.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {dashboardData?.permissions?.issues && (
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" /> Recent Issues Reported
                  </CardTitle>
                  <Badge 
                    variant="secondary" 
                    onClick={() => navigate("/portal/issues")}
                    className="bg-amber-50 text-amber-700 border-none hover:bg-amber-100 cursor-pointer flex items-center gap-1"
                  >
                    Queue <ArrowUpRight className="h-3 w-3" />
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  {dashboardData.recentIssues.map((i: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-border/30">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
                          <UserCheck className="h-4 w-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{i.title}</p>
                          <p className="text-[10px] text-muted-foreground">Raised by {i.raised}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] capitalize ${
                        i.status === 'resolved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {i.status.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Finance & Insights */}
        {(dashboardData?.permissions?.finance || true) && (
          <motion.div 
            variants={itemVariants} 
            className={(dashboardData?.permissions?.voices || dashboardData?.permissions?.issues) ? "md:col-span-4 space-y-6" : "md:col-span-12 space-y-6"}
          >
            {dashboardData?.permissions?.finance && (
              <Card 
                className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden relative cursor-pointer group"
                onClick={() => navigate("/portal/financial-summary")}
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <DollarSign className="h-20 w-20" />
                </div>
                <CardHeader>
                  <CardTitle className="text-lg font-serif">Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">Budget Utilization</span>
                      <span className="text-primary">
                        {(() => {
                          const spent = dashboardData.finance.find((f: any) => f.l === "Spent")?.raw || 0;
                          const budget = dashboardData.finance.find((f: any) => f.l === "Budget")?.raw || 0;
                          return budget > 0 ? Math.round((spent / budget) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full" 
                        style={{ 
                          width: (() => {
                            const spent = dashboardData.finance.find((f: any) => f.l === "Spent")?.raw || 0;
                            const budget = dashboardData.finance.find((f: any) => f.l === "Budget")?.raw || 0;
                            return `${budget > 0 ? Math.min((spent / budget) * 100, 100) : 0}%`;
                          })()
                        }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {dashboardData.finance.map((f: FinanceItem) => (
                      <div key={f.l} className="flex items-center justify-between p-3 rounded-xl bg-white/40 border border-border/20 group-hover:border-primary/20 transition-all">
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{f.l}</span>
                        <span className="text-sm font-bold font-serif">{f.v}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Context Card - Linked to Action Plan */}
            <Card 
              className="border-indigo-500/20 bg-indigo-500/5 backdrop-blur-sm shadow-indigo-500/5 cursor-pointer hover:bg-indigo-500/10 transition-colors group"
              onClick={() => navigate("/portal/action-plan")}
            >
              <CardContent className="p-5 relative">
                <ArrowUpRight className="absolute top-4 right-4 h-4 w-4 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                <h3 className="text-sm font-serif font-bold text-indigo-700 mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Oversight Guide
                </h3>
                <p className="text-[12px] text-indigo-600/80 leading-relaxed italic border-l-2 border-indigo-200 pl-3">
                  "Real-time analytics for the student council leadership. Manage votes, issues, and student welfare with transparency and elite precision."
                </p>
                <div className="mt-4 pt-4 border-t border-indigo-500/10 grid grid-cols-2 gap-2">
                  {info?.responsibilities.slice(0, 2).map((r, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-indigo-900 font-medium">
                      <CheckCircle className="h-2.5 w-2.5 text-indigo-600 mt-0.5" /> {r}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Offices Bar — if allowed */}
      {dashboardData?.permissions?.docs && (
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Users className="h-3 w-3" /> Governance Hub Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex flex-wrap gap-2">
                {(Object.entries(ROLE_INFO) as [AppRole, RoleInfo][]).slice(0, 12).map(([key, ri]) => (
                  <Badge 
                    key={key} 
                    variant="outline" 
                    onClick={() => navigate(ri.link)}
                    className="bg-white/40 border-border/30 hover:border-primary/30 transition-colors cursor-pointer py-1 px-3 rounded-lg flex items-center gap-2 text-[10px]"
                  >
                    <ri.icon className={`h-3 w-3 ${ri.color}`} />
                    {ri.title}
                    <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/30" />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
