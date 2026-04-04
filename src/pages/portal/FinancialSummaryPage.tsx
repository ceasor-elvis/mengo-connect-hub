import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, DollarSign, Users, Search, Loader2, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface UserProfile {
  user_id: string;
  full_name: string;
  student_class: string | null;
}

export default function FinancialSummaryPage() {
  const [finance, setFinance] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const [statsRes, profilesRes, subsRes] = await Promise.all([
        api.get('/dashboard/stats/'),
        api.get('/users/all-profiles/'),
        api.get('/subscriptions/')
      ]);
      
      setFinance(statsRes.data.finance);
      setUsers(profilesRes.data);
      const subs = Array.isArray(subsRes.data) ? subsRes.data : subsRes.data.results || {};
      setSubscriptions(subs);
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

  const handleToggleSubscription = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      const newStatus = !currentStatus;
      await api.post('/subscriptions/toggle/', { user_id: userId, paid: newStatus });
      setSubscriptions(prev => ({ ...prev, [userId]: newStatus }));
      toast.success(newStatus ? "Marked as paid" : "Marked as unpaid");
    } catch (error) {
      toast.error("Failed to update subscription");
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name.toLowerCase().includes(search.toLowerCase()) || 
    (u.student_class && u.student_class.toLowerCase().includes(search.toLowerCase()))
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

      {/* Subscriptions Section */}
      <Card className="border-stone-200 overflow-hidden">
        <CardHeader className="pb-3 border-b bg-stone-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg font-serif">
              <Users className="h-5 w-5 text-primary" />
              Member Subscriptions
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search candidates..." 
                className="pl-9 h-9 bg-white" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-stone-50 border-b">
                  <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs">Member Name</th>
                  <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs">Class</th>
                  <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs text-center">Paid Status</th>
                  <th className="px-6 py-4 font-bold text-stone-600 uppercase tracking-tight text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">No members found matching your search.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isPaid = subscriptions[u.user_id] || false;
                    return (
                      <tr key={u.user_id} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-6 py-4">
                          <p className="font-bold text-stone-800">{u.full_name}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-medium">Council Member</p>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground font-medium">{u.student_class || "NOT ASSIGNED"}</td>
                        <td className="px-6 py-4 text-center">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border-2 transition-all ${
                              isPaid 
                                ? "bg-green-50 text-green-700 border-green-200" 
                                : "bg-stone-50 text-stone-400 border-stone-200"
                            }`}
                          >
                            {isPaid ? <Check className="h-3 w-3 mr-1 inline" /> : <X className="h-3 w-3 mr-1 inline" />}
                            {isPaid ? "PAID" : "UNPAID"}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-3">
                            <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase tracking-widest">
                              {isPaid ? "UNDO" : "SET PAID"}
                            </span>
                            <div className="relative flex items-center">
                              <Checkbox 
                                id={`sub-${u.user_id}`}
                                checked={isPaid}
                                onCheckedChange={() => handleToggleSubscription(u.user_id, isPaid)}
                                disabled={updating === u.user_id}
                                className="border-2 border-stone-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all scale-110"
                              />
                              {updating === u.user_id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded">
                                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
