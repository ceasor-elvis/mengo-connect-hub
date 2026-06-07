import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle, Calendar, FileText, MessageSquare, DollarSign,
  TrendingUp, CheckCircle, Shield, Heart, Stethoscope,
  Megaphone, Accessibility, Users, Vote, Gavel, UserCheck, type LucideIcon,
  ChevronRight, ArrowUpRight, BarChart3, PieChart as PieChartIcon, Activity
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
  bg: string;
  change: string;
  key: string;
  path: string;
}

interface RecentVoice { title: string; category: string; status: string; date: string; }
interface RecentIssue { title: string; status: string; raised: string; }
interface FinanceItem { v: string; l: string; raw?: number; }

const ROLE_INFO: Record<string, RoleInfo> = {
  adminabsolute: { title: "Admin Absolute", icon: Shield, color: "text-rose-500", link: "/portal/admin-absolute/features", responsibilities: ["Full system access", "Bypass all restrictions", "Manage everything"] },
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

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function DashboardPage() {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();
  const primaryRole = roles?.[0];
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
      { key: "voices", path: "/portal/student-voices", label: "Voices", icon: MessageSquare, color: "text-indigo-500", bg: "from-indigo-500/20 to-indigo-500/5", change: "submissions" },
      { key: "issues", path: "/portal/issues", label: "Issues", icon: AlertTriangle, color: "text-rose-500", bg: "from-rose-500/20 to-rose-500/5", change: "recorded" },
      { key: "events", path: "/portal/programmes", label: "Events", icon: Calendar, color: "text-emerald-500", bg: "from-emerald-500/20 to-emerald-500/5", change: "scheduled" },
      { key: "docs",   path: "/portal/documents", label: "Documents", icon: FileText, color: "text-cyan-500", bg: "from-cyan-500/20 to-cyan-500/5", change: "uploaded" },
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-lg" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header Section */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl -z-10" />
        
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider"
          >
            <Activity className="w-3 h-3" /> Live Command Center
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Greetings{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            {info ? `You are logged into the ${info.title} oversight portal. Monitor, manage, and evaluate student council activities with elite precision.` : "Welcome to your executive dashboard."}
          </p>
        </div>
        
        {info && (
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="flex items-center gap-4 bg-background/60 backdrop-blur-xl border border-primary/20 px-6 py-4 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.02)]"
          >
            <div className={`p-3 rounded-2xl ${info.color.replace('text-', 'bg-').replace('-500', '-500/10')} shadow-inner`}>
              <info.icon className={`h-6 w-6 ${info.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 mb-0.5">Active Role</p>
              <p className="text-base font-serif font-black text-foreground">{info.title}</p>
            </div>
          </motion.div>
        )}
      </section>

      {/* Metrics Grid */}
      <div className={`grid gap-5 ${
        dashboardStats.length === 1 ? "grid-cols-1" :
        dashboardStats.length === 2 ? "grid-cols-1 sm:grid-cols-2" :
        dashboardStats.length === 3 ? "grid-cols-1 sm:grid-cols-3" :
        "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      }`}>
        {dashboardStats.map((s, idx) => (
          <motion.div key={s.key} variants={itemVariants} whileHover={{ y: -5 }}>
            <Card 
              className={`relative overflow-hidden border-border/40 bg-gradient-to-br ${s.bg} backdrop-blur-xl hover:shadow-2xl hover:shadow-${s.color.split('-')[1]}-500/10 transition-all duration-300 cursor-pointer group rounded-3xl`}
              onClick={() => navigate(s.path)}
            >
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] group-hover:bg-background/40 transition-colors" />
              <CardContent className="p-6 relative z-10">
                <div className={`absolute -right-4 -top-4 h-24 w-24 opacity-[0.03] group-hover:opacity-[0.08] transition-all duration-500 group-hover:scale-110 group-hover:-rotate-12 ${s.color}`}>
                  <s.icon className="h-full w-full" />
                </div>
                
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-2xl bg-background/80 shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-300`}>
                    <s.icon className={`h-5 w-5 ${s.color}`} />
                  </div>
                  <div className="flex flex-col items-end">
                    <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-background/80 border-border/50 shadow-sm">Live</Badge>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-4xl font-black font-serif tracking-tight drop-shadow-sm">{s.value}</p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs font-bold text-foreground/70 uppercase tracking-widest">{s.label}</span>
                    <span className={`text-[10px] flex items-center gap-1 font-black uppercase tracking-wider ${s.color}`}>
                      <TrendingUp className="h-3 w-3" /> {s.change}
                    </span>
                  </div>
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
            <Card className="h-full border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 bg-muted/10 pb-4">
                <div>
                  <CardTitle className="text-xl font-serif font-bold">Interaction Trends</CardTitle>
                  <p className="text-xs font-medium text-muted-foreground mt-1">Monthly Voice Submissions</p>
                </div>
                <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                </div>
              </CardHeader>
              <CardContent className="h-[320px] pt-6 px-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '16px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--background))', fontWeight: 'bold' }}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                    />
                    <Bar dataKey="voices" fill="#6366f1" radius={[8, 8, 8, 8]} barSize={36}>
                      {dashboardData.trends.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={`url(#colorVoices${index})`} />
                      ))}
                    </Bar>
                    <defs>
                      {dashboardData.trends.map((_: any, index: number) => (
                        <linearGradient key={`gradient-${index}`} id={`colorVoices${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9}/>
                          <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.5}/>
                        </linearGradient>
                      ))}
                    </defs>
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
            <Card className="h-full border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between border-b border-border/20 bg-muted/10 pb-4">
                <CardTitle className="text-xl font-serif font-bold">Issue Distribution</CardTitle>
                <div className="h-10 w-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 group-hover:bg-amber-500/20 transition-colors">
                  <PieChartIcon className="h-5 w-5 text-amber-500" />
                </div>
              </CardHeader>
              <CardContent className="h-[320px] flex flex-col justify-center pt-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={dashboardData.issueDist}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={6}
                    >
                      {dashboardData.issueDist.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="drop-shadow-sm hover:opacity-80 transition-opacity outline-none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: 'hsl(var(--background))', fontWeight: 'bold' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {dashboardData.issueDist.slice(0, 4).map((d: any, i: number) => (
                    <div key={d.name} className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30 border border-border/30 hover:border-border/60 transition-colors">
                      <div className="h-3 w-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[11px] font-bold text-foreground/80 truncate">{d.name}</span>
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
              <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/20 bg-muted/5">
                  <CardTitle className="text-lg font-serif font-bold flex items-center gap-2.5">
                    <div className="p-1.5 bg-indigo-500/10 rounded-lg"><MessageSquare className="h-4 w-4 text-indigo-500" /></div>
                    Critical Student Voices
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/portal/student-voices")}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 h-8 px-3 rounded-xl"
                  >
                    View All <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/20">
                    {(dashboardData.recentVoices || []).map((v: any, idx: number) => (
                      <div key={idx} className="group flex items-center justify-between p-4 hover:bg-muted/20 transition-all cursor-pointer" onClick={() => navigate("/portal/student-voices")}>
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 font-black text-xs uppercase shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                            {v.category.slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground/90 group-hover:text-indigo-600 transition-colors mb-0.5">{v.title}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                              {v.category} <span className="h-1 w-1 rounded-full bg-border" /> {v.date}
                            </p>
                          </div>
                        </div>
                        <Badge className={`rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest border-none shadow-sm ${
                          v.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                        }`}>
                          {v.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {dashboardData?.permissions?.issues && (
              <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 flex flex-row items-center justify-between border-b border-border/20 bg-muted/5">
                  <CardTitle className="text-lg font-serif font-bold flex items-center gap-2.5">
                    <div className="p-1.5 bg-rose-500/10 rounded-lg"><AlertTriangle className="h-4 w-4 text-rose-500" /></div>
                    Recent Issues Reported
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate("/portal/issues")}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-500/10 h-8 px-3 rounded-xl"
                  >
                    Queue <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-border/20">
                    {(dashboardData.recentIssues || []).map((i: any, idx: number) => (
                      <div key={idx} className="group flex items-center justify-between p-4 hover:bg-muted/20 transition-all cursor-pointer" onClick={() => navigate("/portal/issues")}>
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="h-10 w-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shadow-sm group-hover:bg-rose-500 transition-colors">
                            <UserCheck className="h-4 w-4 text-rose-500 group-hover:text-white transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground/90 group-hover:text-rose-600 transition-colors truncate mb-0.5">{i.title}</p>
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Raised by {i.raised}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`rounded-xl px-3 py-1 text-[10px] font-bold uppercase tracking-widest border shadow-sm ${
                          i.status === 'resolved' ? 'bg-emerald-500/5 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/5 text-rose-600 border-rose-500/20'
                        }`}>
                          {i.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
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
                className="border-border/40 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden relative cursor-pointer group hover:shadow-emerald-500/10 transition-all"
                onClick={() => navigate("/portal/financial-summary")}
              >
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity group-hover:scale-110 group-hover:-rotate-12 duration-500">
                  <DollarSign className="h-24 w-24 text-emerald-500" />
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-serif font-bold flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-500/20 rounded-lg"><DollarSign className="h-4 w-4 text-emerald-600" /></div>
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                      <span className="text-muted-foreground">Budget Utilization</span>
                      <span className="text-emerald-600">
                        {(() => {
                          const spent = (dashboardData.finance || []).find((f: any) => f.l === "Spent")?.raw || 0;
                          const budget = (dashboardData.finance || []).find((f: any) => f.l === "Budget")?.raw || 0;
                          return budget > 0 ? Math.round((spent / budget) * 100) : 0;
                        })()}%
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: (() => {
                          const spent = (dashboardData.finance || []).find((f: any) => f.l === "Spent")?.raw || 0;
                          const budget = (dashboardData.finance || []).find((f: any) => f.l === "Budget")?.raw || 0;
                          return `${budget > 0 ? Math.min((spent / budget) * 100, 100) : 0}%`;
                        })() }}
                        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {(dashboardData.finance || []).map((f: FinanceItem) => (
                      <div key={f.l} className="flex items-center justify-between p-3.5 rounded-2xl bg-background/60 border border-border/40 group-hover:border-emerald-500/20 transition-all shadow-sm">
                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{f.l}</span>
                        <span className="text-base font-black font-serif text-foreground">{f.v}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Context Card - Linked to Action Plan */}
            <Card 
              className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/5 backdrop-blur-xl shadow-lg rounded-3xl cursor-pointer hover:shadow-indigo-500/10 transition-all group overflow-hidden relative"
              onClick={() => navigate("/portal/action-plan")}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-purple-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              <CardContent className="p-6 relative z-10">
                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center absolute top-5 right-5 group-hover:bg-indigo-500 transition-colors">
                  <ArrowUpRight className="h-4 w-4 text-indigo-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-base font-serif font-black text-indigo-700 dark:text-indigo-400 mb-3 flex items-center gap-2">
                  <Shield className="h-4 w-4" /> Oversight Guide
                </h3>
                <p className="text-xs text-indigo-900/70 dark:text-indigo-200/70 leading-relaxed font-medium italic border-l-2 border-indigo-500/30 pl-3 py-1">
                  "Real-time analytics for the student council leadership. Manage votes, issues, and student welfare with transparency and elite precision."
                </p>
                <div className="mt-5 pt-5 border-t border-indigo-500/10 grid grid-cols-1 gap-2.5">
                  {info?.responsibilities.slice(0, 3).map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-[11px] text-indigo-950 dark:text-indigo-100 font-bold uppercase tracking-wider">
                      <div className="h-1.5 w-1.5 rounded-full bg-indigo-500" /> {r}
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
          <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden mt-2">
            <CardHeader className="pb-3 bg-muted/5 border-b border-border/20">
              <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-foreground/60 flex items-center gap-2">
                <Users className="h-4 w-4" /> Governance Hub Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
               <div className="flex flex-wrap gap-2.5">
                {(Object.entries(ROLE_INFO) as [AppRole, RoleInfo][]).slice(0, 12).map(([key, ri]) => (
                  <motion.div key={key} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge 
                      variant="outline" 
                      onClick={() => navigate(ri.link)}
                      className="bg-background/80 backdrop-blur-md border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer py-1.5 px-4 rounded-xl flex items-center gap-2 text-[11px] font-bold shadow-sm"
                    >
                      <ri.icon className={`h-3.5 w-3.5 ${ri.color}`} />
                      {ri.title}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
