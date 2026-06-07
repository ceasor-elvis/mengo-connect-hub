import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, BarChart3, Activity, Wallet, TrendingUp, CreditCard, ArrowUpRight, PiggyBank, Receipt, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

interface Requisition {
  id: string;
  purpose: string;
  net_disbursed: number;
  initiator?: string;
  status: string;
  created_at: string;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f43f5e'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function FinancialSummaryPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [financeAnalytics, setFinanceAnalytics] = useState({
    monthlyComparison: [] as any[],
    sourceDistribution: [] as any[]
  });
  const [totalIncome, setTotalIncome] = useState(0);

  const fetchData = async () => {
    try {
      const [reqsRes, statsRes] = await Promise.all([
        api.get('/requisitions/'),
        api.get('/dashboard/stats/')
      ]);
      const reqs = Array.isArray(reqsRes.data) ? reqsRes.data : reqsRes.data.results || [];
      setRequisitions(reqs);
      
      const stats = statsRes.data;
      if (stats.financeAnalytics) {
        setFinanceAnalytics(stats.financeAnalytics);
      }
      
      const budgetNode = stats.finance?.find((f: any) => f.l === "Budget");
      if (budgetNode) setTotalIncome(budgetNode.raw);

    } catch (error) {
      console.error("Failed to fetch financial data", error);
      toast.error("Failed to load financial records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const historyReqs = requisitions.filter(r => r?.status === "Approved" || r?.status === "Rejected");
  const filteredRequisitions = historyReqs.filter(r => 
    String(r?.purpose || "").toLowerCase().includes(search.toLowerCase()) || 
    (r?.initiator && String(r.initiator).toLowerCase().includes(search.toLowerCase()))
  );

  const approvedReqs = requisitions.filter(r => r?.status === "Approved");
  const pendingReqs = requisitions.filter(r => r?.status === "Pending" || String(r?.status || "").startsWith("Pending"));
  
  const totalApproved = approvedReqs.reduce((sum, r) => sum + (Number(r.net_disbursed) || 0), 0);
  const totalPending = pendingReqs.reduce((sum, r) => sum + (Number(r.net_disbursed) || 0), 0);

  const dateMap: Record<string, number> = {};
  approvedReqs.forEach(r => {
    if (r?.created_at) {
      const d = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateMap[d] = (dateMap[d] || 0) + (Number(r.net_disbursed) || 0);
    }
  });
  
  const chartData = Object.entries(dateMap)
    .map(([date, amount]) => ({ date, amount, raw: new Date(`${date} ${new Date().getFullYear()}`).getTime() }))
    .sort((a,b) => a.raw - b.raw)
    .map(({date, amount}) => ({ date, amount }));

  if (chartData.length === 0) chartData.push({ date: 'Today', amount: 0 });

  const purposeMap: Record<string, number> = {};
  approvedReqs.forEach(r => {
    const p = String(r?.purpose || "Other").split(" ")[0];
    purposeMap[p] = (purposeMap[p] || 0) + (Number(r.net_disbursed) || 0);
  });
  const purposeData = Object.entries(purposeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 5);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border/50 shadow-xl rounded-2xl p-4 backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
             <p key={index} className="text-xl font-bold font-mono" style={{ color: entry.color }}>
                UGX {entry.value.toLocaleString()}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
       <div className="flex flex-col h-64 items-center justify-center gap-4">
         <div className="h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
         <p className="text-sm font-medium text-muted-foreground animate-pulse">Aggregating financial data...</p>
       </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-8 pb-20 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col gap-2 relative">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider w-fit"
        >
          <BarChart3 className="w-3 h-3" /> Financial Command Center
        </motion.div>
        <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
          Financial Analytics
        </h1>
        <p className="text-muted-foreground/80 mt-1 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
          Real-time macroscopic overview of capital trajectory, expenditure, and liquid assets.
        </p>
      </section>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div variants={itemVariants}>
           <Card className="relative overflow-hidden border-border/40 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg bg-card/60 backdrop-blur-xl group">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-600 transform group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">
                <PiggyBank className="h-20 w-20" />
             </div>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                  </div>
                  <Badge variant="outline" className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 text-[10px] uppercase font-black tracking-widest">+ Income</Badge>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Revenue</p>
               <div className="text-3xl font-black font-serif text-emerald-600 dark:text-emerald-400 truncate">
                 <span className="text-lg font-mono text-muted-foreground/50 mr-1">UGX</span>
                 {totalIncome.toLocaleString()}
               </div>
             </CardContent>
           </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
           <Card className="relative overflow-hidden border-border/40 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg bg-card/60 backdrop-blur-xl group">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-rose-600 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                <Wallet className="h-20 w-20" />
             </div>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-rose-600" />
                  </div>
                  <Badge variant="outline" className="bg-rose-500/5 text-rose-600 border-rose-500/20 text-[10px] uppercase font-black tracking-widest">- Spent</Badge>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Expenditure</p>
               <div className="text-3xl font-black font-serif text-rose-600 dark:text-rose-400 truncate">
                 <span className="text-lg font-mono text-muted-foreground/50 mr-1">UGX</span>
                 {totalApproved.toLocaleString()}
               </div>
             </CardContent>
           </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
           <Card className="relative overflow-hidden border-primary/20 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg bg-primary/5 backdrop-blur-xl group">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-primary transform group-hover:scale-110 transition-transform duration-500">
                <DollarSign className="h-20 w-20" />
             </div>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-black tracking-widest">Liquid</Badge>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">Current Balance</p>
               <div className="text-3xl font-black font-serif text-primary truncate">
                 <span className="text-lg font-mono text-primary/50 mr-1">UGX</span>
                 {(totalIncome - totalApproved).toLocaleString()}
               </div>
             </CardContent>
           </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
           <Card className="relative overflow-hidden border-border/40 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg bg-card/60 backdrop-blur-xl group">
             <div className="absolute top-0 right-0 p-4 opacity-5 text-amber-500 transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-500">
                <CreditCard className="h-20 w-20" />
             </div>
             <CardContent className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/20 text-[10px] uppercase font-black tracking-widest">Pending</Badge>
               </div>
               <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Pending Liabilities</p>
               <div className="text-3xl font-black font-serif text-amber-600 dark:text-amber-400 truncate">
                 <span className="text-lg font-mono text-muted-foreground/50 mr-1">UGX</span>
                 {totalPending.toLocaleString()}
               </div>
             </CardContent>
           </Card>
        </motion.div>
      </div>

      {/* Analytics Insight Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
         {/* Monthly Comparison */}
         <motion.div variants={itemVariants} className="lg:col-span-3">
            <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col">
               <CardHeader className="border-b border-border/20 bg-muted/10 pb-4">
                  <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Activity className="h-4 w-4 text-blue-600" /></div>
                     <div>
                        <CardTitle className="text-lg font-serif font-bold">Income vs Expenditure</CardTitle>
                        <CardDescription className="text-xs">Macro trajectory of financial health.</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="flex-1 p-6">
                  <div className="h-[300px] w-full">
                     {financeAnalytics.monthlyComparison.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={financeAnalytics.monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                           <defs>
                             <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                               <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                               <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                             </linearGradient>
                           </defs>
                           <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                           <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                           <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }} dx={-10} />
                           <RechartsTooltip content={<CustomTooltip />} />
                           <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#colorIncome)" animationDuration={1500} />
                           <Area type="monotone" dataKey="spent" stroke="#ef4444" strokeWidth={2} fill="url(#colorSpent)" animationDuration={1500} />
                         </AreaChart>
                       </ResponsiveContainer>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-2">
                          <Activity className="h-8 w-8 opacity-20" />
                          <span className="text-sm font-medium">Insufficient historical data</span>
                       </div>
                     )}
                  </div>
               </CardContent>
            </Card>
         </motion.div>

         {/* Revenue Composition */}
         <motion.div variants={itemVariants} className="lg:col-span-2">
            <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl h-full flex flex-col">
               <CardHeader className="border-b border-border/20 bg-muted/10 pb-4">
                  <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><PieChartIcon className="h-4 w-4 text-purple-600" /></div>
                     <div>
                        <CardTitle className="text-lg font-serif font-bold">Revenue Composition</CardTitle>
                        <CardDescription className="text-xs">Distribution of capital ingress.</CardDescription>
                     </div>
                  </div>
               </CardHeader>
               <CardContent className="flex-1 p-6 flex flex-col">
                  {financeAnalytics.sourceDistribution.length > 0 ? (
                     <>
                        <div className="h-[200px] w-full flex-shrink-0">
                           <ResponsiveContainer width="100%" height="100%">
                             <PieChart>
                               <Pie
                                 data={financeAnalytics.sourceDistribution}
                                 cx="50%"
                                 cy="50%"
                                 innerRadius={50}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                                 stroke="none"
                               >
                                 {financeAnalytics.sourceDistribution.map((_, index) => (
                                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                 ))}
                               </Pie>
                               <RechartsTooltip content={<CustomTooltip />} />
                             </PieChart>
                           </ResponsiveContainer>
                        </div>
                        <div className="mt-6 flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                           {financeAnalytics.sourceDistribution.map((item, index) => (
                             <div key={item.name} className="flex flex-col gap-1 p-3 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                      <span className="text-sm font-bold text-foreground">{item.name}</span>
                                   </div>
                                   <span className="text-xs font-black text-muted-foreground uppercase">{((item.value / totalIncome) * 100).toFixed(1)}%</span>
                                </div>
                                <span className="text-lg font-serif font-black text-foreground pl-4.5 tracking-tight">UGX {item.value.toLocaleString()}</span>
                             </div>
                           ))}
                        </div>
                     </>
                  ) : (
                     <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 gap-2">
                          <PieChartIcon className="h-8 w-8 opacity-20" />
                          <span className="text-sm font-medium">No income sources recorded</span>
                     </div>
                  )}
               </CardContent>
            </Card>
         </motion.div>
      </div>

      {/* Legacy Charts Layer */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/40 shadow-sm bg-card/60 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 bg-muted/10 pb-4">
            <CardTitle className="text-base font-serif font-bold">Expenditure Velocity</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis tickFormatter={(value) => `U${(value / 1000).toFixed(0)}k`} tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }} width={60} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" animationDuration={1500} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl">
          <CardHeader className="border-b border-border/20 bg-muted/10 pb-4">
            <CardTitle className="text-base font-serif font-bold">Top Categories</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-[250px] w-full">
              {purposeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purposeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))', fontWeight: 700 }} width={80} />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }} />
                    <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} animationDuration={1500}>
                      {purposeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground/60 text-sm font-medium">
                  No categorical data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ledger Operations Log */}
      <motion.div variants={itemVariants}>
         <Card className="border-border/40 shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden">
           <div className="p-6 border-b border-border/20 bg-muted/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <div>
               <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
                 <Receipt className="h-5 w-5 text-muted-foreground" /> Ledger Operations
               </CardTitle>
               <CardDescription className="text-xs mt-1">Filtered immutable log of processed requisitions.</CardDescription>
             </div>
             <div className="relative w-full sm:w-72">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
               <Input 
                 placeholder="Query purpose or requester..." 
                 className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl focus-visible:ring-primary/20" 
                 value={search} 
                 onChange={e => setSearch(e.target.value)} 
               />
             </div>
           </div>
           <CardContent className="p-0">
             <div className="overflow-x-auto min-h-[300px]">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/30 bg-muted/5">
                      <th className="px-6 py-4 font-black text-muted-foreground tracking-widest uppercase text-[10px]">Reference / Purpose</th>
                      <th className="px-6 py-4 font-black text-muted-foreground tracking-widest uppercase text-[10px]">Initiator</th>
                      <th className="px-6 py-4 font-black text-muted-foreground tracking-widest uppercase text-[10px]">Net Disbursed</th>
                      <th className="px-6 py-4 font-black text-muted-foreground tracking-widest uppercase text-[10px] text-center">Event Status</th>
                      <th className="px-6 py-4 font-black text-muted-foreground tracking-widest uppercase text-[10px] text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {filteredRequisitions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-16 text-center text-muted-foreground">
                          <Wallet className="h-10 w-10 mx-auto mb-3 opacity-20" />
                          <p className="font-medium text-sm">No computational history matching query.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredRequisitions.map((req) => (
                        <tr key={req.id} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-6 py-4">
                             <p className="font-bold text-foreground text-base truncate max-w-[300px]">{req.purpose || "Unknown"}</p>
                             <p className="text-[10px] text-muted-foreground font-mono font-bold mt-1">ID: #{String(req.id).substring(0, 8)}</p>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-foreground/80">{req.initiator || "SYSTEM"}</td>
                          <td className="px-6 py-4">
                             <div className="font-bold font-serif text-lg text-foreground">
                               UGX {Number(req.net_disbursed || 0).toLocaleString()}
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Badge 
                              variant={req.status === "Approved" ? "default" : "destructive"} 
                              className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 ${req.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-sm' : 'bg-rose-500/10 text-rose-600 border-rose-500/20 shadow-sm'}`}
                            >
                              {req.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="text-muted-foreground font-mono font-bold text-xs bg-muted/50 inline-block px-2 py-1 rounded-md border border-border/50">
                              {req.created_at ? new Date(req.created_at).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
           </CardContent>
         </Card>
      </motion.div>
    </motion.div>
  );
}
