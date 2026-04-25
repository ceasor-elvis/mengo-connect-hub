import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, Plus, Search, Calendar as CalendarIcon, Trash2, TrendingUp, Settings2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

interface IncomeSource {
  id: number;
  name: string;
  description?: string;
}

interface IncomeRecord {
  id: number;
  source_type: number | null;
  source_name: string;
  source: string;
  amount: number;
  description: string;
  date: string;
  received_by_name: string;
  created_at: string;
}

export default function IncomePage() {
  const { user, hasPermission } = useAuth();
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSource, setNewSource] = useState({ name: "", description: "" });

  // Form state
  const [formData, setFormData] = useState({
    source_type: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    description: ""
  });

  const fetchSources = async () => {
    try {
      const { data } = await api.get("/income-sources/");
      setSources(data);
    } catch (error) {
      console.error("Failed to fetch sources", error);
    }
  };

  const fetchIncomes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/income/");
      setIncomes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to fetch income records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchSources();
  }, []);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name) return;
    try {
      const { data } = await api.post("/income-sources/", newSource);
      setSources([...sources, data]);
      setFormData({ ...formData, source_type: data.id.toString() });
      setIsSourceDialogOpen(false);
      setNewSource({ name: "", description: "" });
      toast.success("New income source added");
    } catch (error) {
      toast.error("Failed to add source");
    }
  };

  const handleRegisterIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.source_type || !formData.amount || !formData.date) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/income/", {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast.success("Income registered successfully");
      setIsDialogOpen(false);
      setFormData({
        source_type: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        description: ""
      });
      fetchIncomes();
    } catch (error) {
      toast.error("Failed to register income");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIncome = async (id: number) => {
    if (!confirm("Are you sure you want to delete this income record?")) return;
    try {
      await api.delete(`/income/${id}/`);
      toast.success("Income record deleted");
      fetchIncomes();
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const filteredIncomes = incomes.filter(inc => 
    (inc.source_name || inc.source || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    inc.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight">Income Registration</h1>
          <p className="text-muted-foreground mt-1 text-sm">Track and manage all council revenue sources.</p>
        </div>

        {hasPermission("manage_income") && (
          <div className="flex gap-2">
            <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/20 hover:bg-primary/5">
                  <Settings2 className="mr-2 h-4 w-4" /> Manage Sources
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Income Sources</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddSource} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="s_name">Source Name</Label>
                    <Input 
                      id="s_name" 
                      placeholder="e.g. Donation" 
                      value={newSource.name}
                      onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s_desc">Description</Label>
                    <Input 
                      id="s_desc" 
                      placeholder="Details about this revenue stream" 
                      value={newSource.description}
                      onChange={e => setNewSource({ ...newSource, description: e.target.value })}
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit">Add Source</Button>
                  </div>
                </form>
                <div className="mt-4 border-t pt-4">
                  <Label className="text-xs uppercase text-muted-foreground">Existing Sources</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {sources.map(s => (
                      <Badge key={s.id} variant="secondary">{s.name}</Badge>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                  <Plus className="mr-2 h-4 w-4" /> Register New Income
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <PiggyBank className="h-5 w-5 text-primary" />
                    Register Council Income
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleRegisterIncome} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source of Income *</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.source_type} 
                        onValueChange={val => setFormData({ ...formData, source_type: val })}
                      >
                        <SelectTrigger id="source" className="flex-1">
                          <SelectValue placeholder="Select a source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {sources.map(s => (
                            <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" size="icon" onClick={() => setIsSourceDialogOpen(true)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount (UGX) *</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="50000"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date Received *</Label>
                      <Input 
                        id="date" 
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea 
                      id="description" 
                      placeholder="Additional details about this income..." 
                      className="resize-none"
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <DialogFooter className="pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Registering..." : "Complete Registration"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-primary/10 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/60">Total Income Registered</p>
                <h3 className="text-2xl font-serif font-bold mt-1 text-primary">UGX {totalIncome.toLocaleString()}</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/60">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recent Records</p>
                <h3 className="text-2xl font-serif font-bold mt-1">{incomes.length} Entries</h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <PiggyBank className="h-6 w-6 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Table */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="border-b bg-muted/30 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-serif">Revenue Transaction History</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search source or description..." 
                className="pl-10" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/10">
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount (UGX)</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading records...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredIncomes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No income records found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIncomes.map((inc) => (
                  <TableRow key={inc.id} className="hover:bg-muted/5 transition-colors">
                    <TableCell className="font-medium">
                      <div>
                        {inc.source_name || inc.source}
                        {inc.description && <p className="text-xs text-muted-foreground font-normal mt-0.5 line-clamp-1">{inc.description}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(inc.date), "PPP")}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-600">
                      {Number(inc.amount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="secondary" className="font-normal">{inc.received_by_name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasPermission("manage_income") && (
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteIncome(inc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
