import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, DollarSign, Users, Search, Loader2, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface Requisition {
  id: string;
  purpose: string;
  amount: number;
  requester_name?: string;
  status: string;
  created_at: string;
}

export default function FinancialSummaryPage() {
  const [finance, setFinance] = useState<any[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    try {
      const [statsRes, reqsRes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/requisitions/')
      ]);
      
      setFinance(statsRes.data.finance);
      
      const reqs = Array.isArray(reqsRes.data) ? reqsRes.data : reqsRes.data.results || [];
      // Filter for history (Approved or Rejected)
      setRequisitions(reqs.filter((r: any) => r.status === "Approved" || r.status === "Rejected"));
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

  useEffect(() => {
    fetchData();
  }, []);

  const filteredRequisitions = requisitions.filter(r => 
    r.purpose.toLowerCase().includes(search.toLowerCase()) || 
    (r.requester_name && r.requester_name.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            Financial Summary
          </h1>
          <p className="text-sm text-muted-foreground">Overview of council funds and member subscriptions.</p>
        </div>
      </div>

      {/* Finance Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {finance.map((item: any) => (
          <Card key={item.l} className="bg-primary/5 border-primary/10 hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest leading-none mb-1">{item.l}</p>
                <p className="text-2xl font-bold text-primary">{item.v}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm border border-primary/20">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requisition History Section */}
      <Card className="border-stone-200 overflow-hidden">
        <CardHeader className="pb-3 border-b bg-stone-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
               <BarChart3 className="h-5 w-5 text-primary" />
               Payment & Requisition History
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search history..." 
                className="pl-9 h-9 bg-white" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[200px]">
             <table className="w-full text-sm text-left">
               <thead>
                 <tr className="bg-stone-50 border-b">
                   <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs">Purpose</th>
                   <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs">Requester</th>
                   <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs">Amount</th>
                   <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs text-center">Status</th>
                   <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs text-right">Date</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-stone-100">
                 {filteredRequisitions.length === 0 ? (
                   <tr><td colSpan={5} className="px-6 py-8 text-center text-muted-foreground italic">No requisition history found.</td></tr>
                 ) : (
                   filteredRequisitions.map((req) => (
                     <tr key={req.id} className="hover:bg-primary/5 transition-colors">
                       <td className="px-6 py-4 font-medium text-stone-800">{req.purpose}</td>
                       <td className="px-6 py-4 text-muted-foreground">{req.requester_name || "Unknown"}</td>
                       <td className="px-6 py-4 font-bold">UGX {req.amount.toLocaleString()}</td>
                       <td className="px-6 py-4 text-center">
                         <Badge 
                           variant={req.status === "Approved" ? "default" : "destructive"} 
                           className="text-[10px] font-bold"
                         >
                           {req.status}
                         </Badge>
                       </td>
                       <td className="px-6 py-4 text-right text-muted-foreground">
                         {new Date(req.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
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
