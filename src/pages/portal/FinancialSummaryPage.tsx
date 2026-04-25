import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, BarChart3, Activity, Wallet, TrendingUp, CreditCard, ArrowUpRight, PiggyBank } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from "recharts";

interface Requisition {
  id: string;
  purpose: string;
  net_disbursed: number;
  initiator?: string;
  status: string;
  created_at: string;
}

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];

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
      
      // Calculate total income from the summary stats in dashboard
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

  // Group by date for AreaChart
  const dateMap: Record<string, number> = {};
  approvedReqs.forEach(r => {
    if (r?.created_at) {
      const d = new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dateMap[d] = (dateMap[d] || 0) + (Number(r.net_disbursed) || 0);
    }
  });
  
  // Sort by actual date timestamp
  const chartData = Object.entries(dateMap)
    .map(([date, amount]) => {
      // Need a full date to parse cleanly for sorting since "Oct 15" relies on current year context
      return { date, amount, raw: new Date(`${date} ${new Date().getFullYear()}`).getTime() };
    })
    .sort((a,b) => a.raw - b.raw)
    .map(({date, amount}) => ({ date, amount }));

  // If no data, provide dummy structural zeroes so charts don't break visually
  if (chartData.length === 0) {
    chartData.push({ date: 'Today', amount: 0 });
  }

  // Group by purpose for BarChart
  const purposeMap: Record<string, number> = {};
  approvedReqs.forEach(r => {
    const p = String(r?.purpose || "Other").split(" ")[0]; // Categorize by first word to make labels fit
    purposeMap[p] = (purposeMap[p] || 0) + (Number(r.net_disbursed) || 0);
  });
  const purposeData = Object.entries(purposeMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a,b) => b.value - a.value)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border border-border/50 shadow-xl rounded-lg p-3 backdrop-blur-md">
          <p className="text-sm text-muted-foreground font-medium mb-1">{label}</p>
          <p className="text-xl font-bold font-mono text-primary">
            UGX {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="h-8 w-8 text-primary" />
            Financial Analytics
          </h1>
          <p className="text-muted-foreground mt-1">Real-time expenditure tracking and requisition statistics.</p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md bg-emerald-500/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
             <PiggyBank className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600">Total Revenue</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight text-emerald-700 dark:text-emerald-400">
              <span className="text-muted-foreground/50 text-xl mr-1">UGX</span>
              {totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All-time registered income
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <Wallet className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenditure</CardTitle>
            <TrendingUp className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight text-foreground">
              <span className="text-muted-foreground text-xl mr-1">UGX</span>
              {totalApproved.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Approved disbursements
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md bg-primary/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
             <Activity className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Current Balance</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight text-primary">
              <span className="text-muted-foreground/50 text-xl mr-1">UGX</span>
              {(totalIncome - totalApproved).toLocaleString()}
            </div>
            <p className="text-xs text-primary/60 mt-2">
              Available liquid capital
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <CreditCard className="h-16 w-16" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Liabilities</CardTitle>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono tracking-tight text-amber-600 dark:text-amber-400">
               <span className="text-muted-foreground/50 text-xl mr-1">UGX</span>
              {totalPending.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Unprocessed requisitions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Insight Layer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-br from-background to-muted/20">
            <CardHeader>
               <CardTitle className="text-base font-semibold">Income vs Expenditure</CardTitle>
               <CardDescription>Monthly comparison of revenue trajectory and outflow.</CardDescription>
            </CardHeader>
            <CardContent>
               <div className="h-[300px] w-full">
                  {financeAnalytics.monthlyComparison.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={financeAnalytics.monthlyComparison} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <YAxis tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                        <RechartsTooltip 
                           contentStyle={{ backgroundColor: 'hsl(var(--background))', borderColor: 'hsl(var(--border))' }}
                        />
                        <Area type="monotone" dataKey="income" stroke="#10b981" fill="#10b981" fillOpacity={0.1} stackId="1" />
                        <Area type="monotone" dataKey="spent" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} stackId="2" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground italic text-sm">Insufficient historical data</div>
                  )}
               </div>
            </CardContent>
         </Card>

         <Card className="border-border/50 shadow-sm">
            <CardHeader>
               <CardTitle className="text-base font-semibold">Revenue Composition</CardTitle>
               <CardDescription>Breakdown of income by registration source.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row items-center gap-4">
               <div className="h-[250px] w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={financeAnalytics.sourceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {financeAnalytics.sourceDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
               </div>
               <div className="w-full md:w-1/2 space-y-2">
                  {financeAnalytics.sourceDistribution.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="text-muted-foreground truncate max-w-[120px]">{item.name}</span>
                       </div>
                       <span className="font-mono font-bold uppercase transition-all duration-300 transform group-hover:scale-105 inline-block">UGX {item.value.toLocaleString()}</span>
                    </div>
                  ))}
               </div>
            </CardContent>
         </Card>
      </div>

      {/* Legacy Charts Layer - Kept for detailed requisition views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Area Chart */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Expenditure Velocity</CardTitle>
            <CardDescription>Capital outflow timeline over the recorded history.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                    dy={10}
                  />
                  <YAxis 
                    tickFormatter={(value) => `U${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontFamily: 'monospace' }}
                    width={60}
                  />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAmount)" 
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Categories Bar Chart */}
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Top Categories</CardTitle>
            <CardDescription>Highest expenditure by prefix.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {purposeData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={purposeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/20" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }} 
                      width={80} 
                    />
                    <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} animationDuration={1500}>
                      {purposeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                  No categorical data
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requisition History Log */}
      <Card className="border-border/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Ledger Operations</CardTitle>
              <CardDescription>Filtered immutable log of processed requisitions.</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Query purpose or requester..." 
                className="pl-9 h-9 bg-background/50 border-muted" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[250px]">
             <table className="w-full text-sm text-left">
               <thead>
                 <tr className="border-b bg-muted/10">
                   <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-[10px]">Reference / Purpose</th>
                   <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-[10px]">Initiator</th>
                   <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-[10px]">Net Disbursed</th>
                   <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-[10px] text-center">Event Status</th>
                   <th className="px-6 py-4 font-semibold text-muted-foreground tracking-wider uppercase text-[10px] text-right">Timestamp</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-border/50">
                 {filteredRequisitions.length === 0 ? (
                   <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                       <Wallet className="h-8 w-8 mx-auto mb-3 opacity-20" />
                       <p className="italic">No computational history matching query.</p>
                     </td>
                   </tr>
                 ) : (
                   filteredRequisitions.map((req) => (
                     <tr key={req.id} className="hover:bg-muted/30 transition-colors group">
                       <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{req.purpose || "Unknown"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">ID: {String(req.id).substring(0, 8)}...</p>
                       </td>
                       <td className="px-6 py-4 text-muted-foreground font-medium">{req.initiator || "SYSTEM"}</td>
                       <td className="px-6 py-4">
                          <div className="font-bold font-mono text-foreground">
                            UGX {Number(req.net_disbursed || 0).toLocaleString()}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-center">
                         <Badge 
                           variant={req.status === "Approved" ? "default" : "destructive"} 
                           className={`text-[10px] uppercase font-bold tracking-widest ${req.status === 'Approved' ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-none' : 'bg-rose-500/15 text-rose-600 hover:bg-rose-500/25 border-none'}`}
                         >
                           {req.status}
                         </Badge>
                       </td>
                       <td className="px-6 py-4 text-right">
                         <div className="flex justify-end items-center text-muted-foreground font-mono text-xs">
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
    </div>
  );
}
