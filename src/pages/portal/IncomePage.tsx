import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PiggyBank, Plus, Search, Calendar as CalendarIcon, Trash2, TrendingUp, Settings2, Coins, Receipt } from "lucide-react";
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8 pb-12 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl -z-10" />

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
        <section className="flex flex-col gap-2 relative flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider w-fit"
          >
            <Coins className="w-3 h-3" /> Financial Control
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Income Registration
          </h1>
          <p className="text-muted-foreground/80 mt-1 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Track and manage all council revenue sources with immutable logging.
          </p>
        </section>

        {hasPermission("manage_income") && (
          <div className="flex flex-wrap gap-3 shrink-0">
            <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="h-12 rounded-xl font-bold bg-background/50 border-border/50 backdrop-blur-xl shadow-sm hover:bg-muted/50">
                  <Settings2 className="mr-2 h-4 w-4" /> Manage Sources
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
                <div className="p-6 border-b border-border/20 bg-muted/20">
                  <DialogTitle className="font-serif text-2xl font-black flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-muted-foreground" /> Manage Income Sources
                  </DialogTitle>
                </div>
                <div className="p-6">
                  <form onSubmit={handleAddSource} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="s_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source Name</Label>
                      <Input 
                        id="s_name" 
                        className="h-11 bg-muted/30 border-border/50 rounded-xl"
                        placeholder="e.g. Donation" 
                        value={newSource.name}
                        onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="s_desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                      <Input 
                        id="s_desc" 
                        className="h-11 bg-muted/30 border-border/50 rounded-xl"
                        placeholder="Details about this revenue stream" 
                        value={newSource.description}
                        onChange={e => setNewSource({ ...newSource, description: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" className="h-11 rounded-xl font-bold px-6">Add Source</Button>
                    </div>
                  </form>
                  <div className="mt-6 pt-6 border-t border-border/40">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Existing Sources</Label>
                    <div className="flex flex-wrap gap-2">
                      {sources.map(s => (
                        <Badge key={s.id} variant="secondary" className="px-3 py-1 font-medium bg-muted/50 border-border/50">{s.name}</Badge>
                      ))}
                      {sources.length === 0 && <span className="text-sm text-muted-foreground italic">No sources defined yet.</span>}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="h-12 rounded-xl font-bold shadow-lg shadow-emerald-500/20 bg-emerald-500 hover:bg-emerald-600 text-white">
                  <Plus className="mr-2 h-5 w-5" /> Register Income
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
                <div className="p-6 border-b border-border/20 bg-emerald-500/5">
                  <DialogTitle className="font-serif text-2xl font-black text-emerald-600 flex items-center gap-2">
                    <PiggyBank className="h-6 w-6" /> Register Income
                  </DialogTitle>
                </div>
                <div className="p-6">
                  <form onSubmit={handleRegisterIncome} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="source" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source of Income *</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={formData.source_type} 
                          onValueChange={val => setFormData({ ...formData, source_type: val })}
                        >
                          <SelectTrigger id="source" className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 flex-1">
                            <SelectValue placeholder="Select a source..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            {sources.map(s => (
                              <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                            ))}
                            {sources.length === 0 && <SelectItem value="none" disabled>No sources available</SelectItem>}
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={() => setIsSourceDialogOpen(true)}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (UGX) *</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">UGX</span>
                          <Input 
                            id="amount" 
                            type="number" 
                            className="h-11 pl-10 bg-muted/30 border-border/50 rounded-xl font-mono focus-visible:ring-emerald-500/20"
                            placeholder="0"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Received *</Label>
                        <Input 
                          id="date" 
                          type="date"
                          className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20"
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description (Optional)</Label>
                      <Textarea 
                        id="description" 
                        placeholder="Additional details about this income..." 
                        className="resize-none bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20"
                        rows={3}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                    <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-border/40">
                      <Button type="button" variant="outline" className="h-11 rounded-xl w-full" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                      <Button type="submit" disabled={isSubmitting} className="h-11 rounded-xl w-full font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                        {isSubmitting ? "Registering..." : "Complete Registration"}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/40 bg-emerald-500/5 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
             <TrendingUp className="h-16 w-16" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-400/70 mb-1">Total Income Registered</p>
            <div className="flex items-end gap-2">
               <span className="text-muted-foreground/60 font-bold mb-1">UGX</span>
               <h3 className="text-3xl font-serif font-black text-emerald-600 dark:text-emerald-400">{totalIncome.toLocaleString()}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden relative">
           <div className="absolute top-0 right-0 p-4 opacity-5 text-foreground">
             <Receipt className="h-16 w-16" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Records</p>
            <h3 className="text-3xl font-serif font-black text-foreground">{incomes.length} <span className="text-lg font-bold text-muted-foreground font-sans tracking-normal">Entries</span></h3>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Table */}
      <motion.div variants={itemVariants}>
        <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border/20 bg-muted/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-muted-foreground" /> Revenue Transaction History
            </CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search source or description..." 
                className="pl-10 h-10 bg-background/50 border-border/50 rounded-xl focus-visible:ring-emerald-500/20" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <CardContent className="p-0">
            <div className="overflow-x-auto min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/5 hover:bg-muted/5 border-border/30">
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Amount (UGX)</TableHead>
                    <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Received By</TableHead>
                    {hasPermission("manage_income") && (
                      <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/30">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="h-8 w-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                          <p className="text-sm font-medium text-muted-foreground">Loading financial records...</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredIncomes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-48 text-center">
                        <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                           <PiggyBank className="h-10 w-10 opacity-20 mb-2" />
                           <p className="font-medium text-sm">No income records found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    <AnimatePresence>
                      {filteredIncomes.map((inc) => (
                        <motion.tr 
                          key={inc.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="hover:bg-muted/30 transition-colors group"
                        >
                          <TableCell className="px-6 py-4">
                            <div className="font-bold text-foreground">
                              {inc.source_name || inc.source}
                            </div>
                            {inc.description && (
                              <p className="text-[11px] text-muted-foreground font-medium mt-1 line-clamp-1 max-w-[300px]">
                                {inc.description}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground">
                            <div className="flex items-center gap-2 bg-muted/50 w-fit px-2 py-1 rounded-md border border-border/50">
                              <CalendarIcon className="h-3 w-3" />
                              {format(new Date(inc.date), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-4 text-right">
                            <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                              {Number(inc.amount).toLocaleString()}
                            </span>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-widest bg-background/50 text-muted-foreground">
                              {inc.received_by_name}
                            </Badge>
                          </TableCell>
                          {hasPermission("manage_income") && (
                            <TableCell className="px-6 py-4 text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all" 
                                    title="Delete Record"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-serif text-xl">Delete Income Record?</AlertDialogTitle>
                                    <AlertDialogDescription>Are you sure you want to delete this income record?</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteIncome(inc.id)} className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          )}
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
