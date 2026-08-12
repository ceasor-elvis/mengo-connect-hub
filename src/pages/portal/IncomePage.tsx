import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import { 
  PiggyBank, Plus, Search, Calendar as CalendarIcon, Trash2, 
  TrendingUp, Settings2, Coins, Receipt, Bell, Send, CheckCircle2, 
  XCircle, AlertCircle, Eye, Printer, CreditCard, Building2, 
  User, Phone, Tag, Check, Filter, ArrowUpRight, Clock, Users, 
  RefreshCw, Sparkles, ShieldCheck, Download, Copy, CheckCheck
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
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
  amount: number | string;
  description: string;
  date: string;
  receipt_number?: string;
  payer_name?: string;
  payer_contact?: string;
  payment_method?: string;
  payment_reference?: string;
  status?: string;
  received_by_name: string;
  created_at: string;
}

interface SubscriptionRecord {
  id: number;
  user: number;
  username: string;
  full_name: string;
  student_class: string;
  stream: string;
  gender: string;
  roles: string[];
  paid: boolean;
  amount_due: number | string;
  amount_paid: number | string;
  term: string;
  last_reminder_sent_at: string | null;
  reminder_count: number;
  updated_at: string;
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
  
  // Tabs: 'income' | 'subscriptions'
  const [activeTab, setActiveTab] = useState<string>("income");

  // Income State
  const [incomes, setIncomes] = useState<IncomeRecord[]>([]);
  const [loadingIncomes, setLoadingIncomes] = useState(true);
  const [incomeSearchTerm, setIncomeSearchTerm] = useState("");
  const [selectedMethodFilter, setSelectedMethodFilter] = useState("all");
  const [selectedSourceFilter, setSelectedSourceFilter] = useState("all");
  const [sources, setSources] = useState<IncomeSource[]>([]);
  
  // Modals for Income
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const [isRegisterDialogOpen, setIsRegisterDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<IncomeRecord | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isSubmittingIncome, setIsSubmittingIncome] = useState(false);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // New Source Form
  const [newSource, setNewSource] = useState({ name: "", description: "" });

  // Register Income Form State (Rich Transaction Info)
  const [incomeFormData, setIncomeFormData] = useState({
    source_type: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    receipt_number: "",
    payer_name: "",
    payer_contact: "",
    payment_method: "Cash",
    payment_reference: "",
    status: "Verified",
    description: ""
  });

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
  const [subSearchTerm, setSubSearchTerm] = useState("");
  const [subStatusFilter, setSubStatusFilter] = useState("all"); // 'all' | 'unpaid' | 'paid'
  const [subClassFilter, setSubClassFilter] = useState("all");
  
  // Reminder State & Modal
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [reminderTarget, setReminderTarget] = useState<"all_unpaid" | "single">("all_unpaid");
  const [singleReminderUser, setSingleReminderUser] = useState<SubscriptionRecord | null>(null);
  const [reminderTitle, setReminderTitle] = useState("Student Council Subscription Reminder");
  const [reminderMessage, setReminderMessage] = useState("");
  const [isSendingReminder, setIsSendingReminder] = useState(false);
  const [togglingSubId, setTogglingSubId] = useState<number | null>(null);

  // --- DATA FETCHING ---
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
      setLoadingIncomes(true);
      const { data } = await api.get("/income/");
      setIncomes(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to fetch income records");
    } finally {
      setLoadingIncomes(false);
    }
  };

  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true);
      const { data } = await api.get("/subscriptions/");
      setSubscriptions(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to fetch subscription records");
    } finally {
      setLoadingSubscriptions(false);
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchSources();
    fetchSubscriptions();
  }, []);

  // --- INCOME ACTIONS ---
  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSource.name) return;
    try {
      const { data } = await api.post("/income-sources/", newSource);
      setSources([...sources, data]);
      setIncomeFormData({ ...incomeFormData, source_type: data.id.toString() });
      setIsSourceDialogOpen(false);
      setNewSource({ name: "", description: "" });
      toast.success("New income source added");
    } catch (error) {
      toast.error("Failed to add source");
    }
  };

  const handleRegisterIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeFormData.source_type || !incomeFormData.amount || !incomeFormData.date) {
      toast.error("Please fill in all required fields (Source, Amount, Date)");
      return;
    }

    setIsSubmittingIncome(true);
    try {
      const payload = {
        ...incomeFormData,
        amount: parseFloat(incomeFormData.amount),
        source_type: parseInt(incomeFormData.source_type)
      };
      await api.post("/income/", payload);
      toast.success("Transaction registered successfully with receipt generated!");
      setIsRegisterDialogOpen(false);
      setIncomeFormData({
        source_type: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        receipt_number: "",
        payer_name: "",
        payer_contact: "",
        payment_method: "Cash",
        payment_reference: "",
        status: "Verified",
        description: ""
      });
      fetchIncomes();
    } catch (error) {
      toast.error("Failed to register income transaction");
    } finally {
      setIsSubmittingIncome(false);
    }
  };

  const handleDeleteIncome = async (id: number) => {
    try {
      await api.delete(`/income/${id}/`);
      toast.success("Income transaction deleted");
      if (selectedTransaction?.id === id) {
        setIsDetailsDialogOpen(false);
      }
      fetchIncomes();
    } catch (error) {
      toast.error("Failed to delete record");
    }
  };

  const handleCopyReceipt = (receiptNo: string) => {
    navigator.clipboard.writeText(receiptNo);
    setCopiedReceipt(true);
    toast.success("Receipt number copied to clipboard!");
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  // --- SUBSCRIPTION ACTIONS ---
  const handleToggleSubscriptionPaid = async (sub: SubscriptionRecord) => {
    try {
      setTogglingSubId(sub.user);
      const newStatus = !sub.paid;
      const { data } = await api.post(`/subscriptions/${sub.user}/toggle/`, {
        paid: newStatus
      });
      setSubscriptions(prev => prev.map(s => s.user === sub.user ? { ...s, paid: newStatus, amount_paid: newStatus ? s.amount_due : 0 } : s));
      toast.success(`Marked ${sub.full_name || sub.username} as ${newStatus ? 'PAID' : 'UNPAID'}`);
    } catch (error) {
      toast.error("Failed to update subscription status");
    } finally {
      setTogglingSubId(null);
    }
  };

  const openReminderModal = (sub?: SubscriptionRecord) => {
    if (sub) {
      setReminderTarget("single");
      setSingleReminderUser(sub);
      setReminderTitle("Student Council Subscription Reminder");
      setReminderMessage(
        `Dear ${sub.full_name || sub.username},\n\nThis is a friendly reminder from the Council Finance docket that your ${sub.term || 'Term 1'} subscription dues (UGX ${Number(sub.amount_due).toLocaleString()}) are still outstanding.\n\nPlease clear your subscription with the Secretary for Finance at your earliest convenience.`
      );
    } else {
      setReminderTarget("all_unpaid");
      setSingleReminderUser(null);
      setReminderTitle("Student Council Subscription Dues - Clearance Notice");
      setReminderMessage(
        `Dear Council Member / Student,\n\nThis is a reminder that Term 1 Student Council subscription dues are currently pending. All members with unpaid balances are requested to visit the Finance office to finalize payments.`
      );
    }
    setIsReminderDialogOpen(true);
  };

  const handleSendReminder = async () => {
    if (!reminderTitle.trim() || !reminderMessage.trim()) {
      toast.error("Please provide both a title and message for the reminder");
      return;
    }

    setIsSendingReminder(true);
    try {
      const payload = {
        target: reminderTarget === "all_unpaid" ? "all_unpaid" : "selected",
        user_ids: reminderTarget === "single" && singleReminderUser ? [singleReminderUser.user] : [],
        title: reminderTitle,
        message: reminderMessage,
        type: "warning"
      };

      const { data } = await api.post("/subscriptions/send-reminder/", payload);
      toast.success(data.message || "Reminder notification(s) dispatched successfully!");
      setIsReminderDialogOpen(false);
      fetchSubscriptions();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to dispatch reminders");
    } finally {
      setIsSendingReminder(false);
    }
  };

  // --- FILTERING & COMPUTATIONS ---
  const filteredIncomes = incomes.filter(inc => {
    const matchesSearch = 
      (inc.source_name || inc.source || "").toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
      (inc.receipt_number || "").toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
      (inc.payer_name || "").toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
      (inc.payment_reference || "").toLowerCase().includes(incomeSearchTerm.toLowerCase()) ||
      (inc.description || "").toLowerCase().includes(incomeSearchTerm.toLowerCase());

    const matchesMethod = selectedMethodFilter === "all" || inc.payment_method === selectedMethodFilter;
    const matchesSource = selectedSourceFilter === "all" || inc.source_type?.toString() === selectedSourceFilter;

    return matchesSearch && matchesMethod && matchesSource;
  });

  const totalIncome = incomes.reduce((sum, inc) => sum + Number(inc.amount), 0);

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = 
      (sub.full_name || "").toLowerCase().includes(subSearchTerm.toLowerCase()) ||
      (sub.username || "").toLowerCase().includes(subSearchTerm.toLowerCase()) ||
      (sub.student_class || "").toLowerCase().includes(subSearchTerm.toLowerCase()) ||
      (sub.stream || "").toLowerCase().includes(subSearchTerm.toLowerCase());

    const matchesStatus = 
      subStatusFilter === "all" ? true :
      subStatusFilter === "paid" ? sub.paid :
      !sub.paid;

    const matchesClass = 
      subClassFilter === "all" ? true :
      (sub.student_class || "").includes(subClassFilter);

    return matchesSearch && matchesStatus && matchesClass;
  });

  const totalSubscribers = subscriptions.length;
  const paidSubscribers = subscriptions.filter(s => s.paid).length;
  const unpaidSubscribers = totalSubscribers - paidSubscribers;
  const totalSubAmountExpected = subscriptions.reduce((sum, s) => sum + Number(s.amount_due || 50000), 0);
  const totalSubAmountCollected = subscriptions.filter(s => s.paid).reduce((sum, s) => sum + Number(s.amount_paid || s.amount_due || 50000), 0);
  const collectionRate = totalSubscribers > 0 ? Math.round((paidSubscribers / totalSubscribers) * 100) : 0;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8 pb-16 relative min-h-screen"
    >
      {/* Background glow accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
        <section className="flex flex-col gap-2 relative flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider w-fit"
          >
            <Coins className="w-3.5 h-3.5" /> Treasury & Revenue Docket
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Finance & Revenue Control
          </h1>
          <p className="text-muted-foreground/80 mt-1 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Record comprehensive revenue transactions with verifiable receipting, and manage student subscriptions with automated reminder broadcasts.
          </p>
        </section>

        {hasPermission("manage_income") && (
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {activeTab === "income" ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSourceDialogOpen(true)}
                  className="h-11 rounded-xl font-bold bg-background/50 border-border/50 backdrop-blur-xl shadow-sm hover:bg-muted/50"
                >
                  <Settings2 className="mr-2 h-4 w-4 text-muted-foreground" /> Income Categories
                </Button>

                <Button 
                  onClick={() => setIsRegisterDialogOpen(true)}
                  className="h-11 rounded-xl font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" /> Register New Income
                </Button>
              </>
            ) : (
              <Button 
                onClick={() => openReminderModal()}
                disabled={unpaidSubscribers === 0}
                className="h-11 rounded-xl font-bold shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Bell className="mr-2 h-4 w-4" /> Remind All Unpaid ({unpaidSubscribers})
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 max-w-md h-12 p-1 rounded-2xl bg-muted/40 backdrop-blur-xl border border-border/40">
          <TabsTrigger 
            value="income" 
            className="rounded-xl font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-md flex items-center gap-2"
          >
            <Receipt className="w-4 h-4 text-emerald-600" /> Income Transactions
          </TabsTrigger>
          <TabsTrigger 
            value="subscriptions" 
            className="rounded-xl font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-md flex items-center gap-2"
          >
            <Users className="w-4 h-4 text-amber-600" /> Subscriptions & Reminders
          </TabsTrigger>
        </TabsList>

        {/* ═════════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: INCOME TRANSACTIONS & RECEIPTING */}
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="income" className="space-y-6">
          {/* Stat Summary Cards */}
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-3xl border-border/40 bg-emerald-500/5 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-600">
                <TrendingUp className="h-16 w-16" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-400/70 mb-1">Total Realized Revenue</p>
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
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Transaction Records</p>
                <h3 className="text-3xl font-serif font-black text-foreground">{incomes.length} <span className="text-lg font-bold text-muted-foreground font-sans tracking-normal">Receipts</span></h3>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-5 text-foreground">
                <Building2 className="h-16 w-16" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Active Revenue Channels</p>
                <h3 className="text-3xl font-serif font-black text-foreground">{sources.length} <span className="text-lg font-bold text-muted-foreground font-sans tracking-normal">Categories</span></h3>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search, Filter and Transactions Table */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/20 bg-muted/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-emerald-600" /> Revenue Transactions & Audit Trail
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Click any transaction to inspect official receipt details, payer metadata, and channel references.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Receipt #, payer, source..." 
                      className="pl-9 h-10 bg-background/50 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 text-xs" 
                      value={incomeSearchTerm}
                      onChange={e => setIncomeSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Payment Method Filter */}
                  <Select value={selectedMethodFilter} onValueChange={setSelectedMethodFilter}>
                    <SelectTrigger className="h-10 text-xs w-[140px] rounded-xl bg-background/50 border-border/50">
                      <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Mobile Money (MTN)">MTN MoMo</SelectItem>
                      <SelectItem value="Mobile Money (Airtel)">Airtel Money</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="School Pay">School Pay</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Source Filter */}
                  <Select value={selectedSourceFilter} onValueChange={setSelectedSourceFilter}>
                    <SelectTrigger className="h-10 text-xs w-[140px] rounded-xl bg-background/50 border-border/50">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Sources</SelectItem>
                      {sources.map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CardContent className="p-0">
                <div className="overflow-x-auto min-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/5 hover:bg-muted/5 border-border/30">
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receipt #</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Source & Payer</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Method / Ref</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Amount (UGX)</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/30">
                      {loadingIncomes ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="h-8 w-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                              <p className="text-sm font-medium text-muted-foreground">Loading revenue transactions...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredIncomes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <PiggyBank className="h-10 w-10 opacity-20 mb-2" />
                              <p className="font-medium text-sm">No revenue transactions matching current filters.</p>
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
                              onClick={() => {
                                setSelectedTransaction(inc);
                                setIsDetailsDialogOpen(true);
                              }}
                              className="hover:bg-muted/30 transition-colors group cursor-pointer"
                            >
                              {/* Receipt Number */}
                              <TableCell className="px-6 py-4">
                                <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                  {inc.receipt_number || `REC-${inc.id.toString().padStart(4, '0')}`}
                                </span>
                              </TableCell>

                              {/* Source & Payer */}
                              <TableCell className="px-6 py-4">
                                <div className="font-bold text-foreground flex items-center gap-2">
                                  {inc.source_name || inc.source || "General Revenue"}
                                </div>
                                {inc.payer_name && (
                                  <p className="text-[11px] text-muted-foreground font-medium mt-0.5 flex items-center gap-1">
                                    <User className="w-3 h-3 text-muted-foreground/60" /> Payer: {inc.payer_name}
                                  </p>
                                )}
                              </TableCell>

                              {/* Date */}
                              <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground whitespace-nowrap">
                                <div className="flex items-center gap-1.5 bg-muted/40 w-fit px-2.5 py-1 rounded-md border border-border/40">
                                  <CalendarIcon className="h-3 w-3 text-muted-foreground/70" />
                                  {format(new Date(inc.date), "MMM d, yyyy")}
                                </div>
                              </TableCell>

                              {/* Payment Method & Reference */}
                              <TableCell className="px-6 py-4">
                                <Badge variant="secondary" className="font-semibold text-[10px] bg-muted/60 text-foreground">
                                  {inc.payment_method || "Cash"}
                                </Badge>
                                {inc.payment_reference && (
                                  <p className="text-[10px] font-mono text-muted-foreground/80 mt-1 truncate max-w-[140px]" title={inc.payment_reference}>
                                    Ref: {inc.payment_reference}
                                  </p>
                                )}
                              </TableCell>

                              {/* Amount */}
                              <TableCell className="px-6 py-4 text-right">
                                <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                  {Number(inc.amount).toLocaleString()}
                                </span>
                              </TableCell>

                              {/* Status */}
                              <TableCell className="px-6 py-4">
                                <Badge 
                                  variant="outline" 
                                  className={`text-[10px] uppercase font-bold tracking-wider ${
                                    inc.status === 'Reconciled' ? 'bg-sky-500/10 text-sky-600 border-sky-500/20' :
                                    inc.status === 'Pending Verification' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                    'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  }`}
                                >
                                  {inc.status || "Verified"}
                                </Badge>
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setSelectedTransaction(inc);
                                      setIsDetailsDialogOpen(true);
                                    }}
                                    title="View Full Receipt Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {hasPermission("manage_income") && (
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all" 
                                          title="Delete Transaction"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                                        <AlertDialogHeader>
                                          <AlertDialogTitle className="font-serif text-xl">Delete Income Record?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete transaction <strong>{inc.receipt_number || `REC-${inc.id}`}</strong>? This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => handleDeleteIncome(inc.id)} className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white">
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  )}
                                </div>
                              </TableCell>
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
        </TabsContent>

        {/* ═════════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SUBSCRIPTIONS & REMINDERS */}
        {/* ═════════════════════════════════════════════════════════════════════════ */}
        <TabsContent value="subscriptions" className="space-y-6">
          {/* Subscriptions Overview Stats */}
          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-4">
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Total Subscribed Members</p>
                <h3 className="text-3xl font-serif font-black text-foreground">{totalSubscribers}</h3>
                <p className="text-xs text-muted-foreground mt-1">Council members & students</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40 bg-emerald-500/5 shadow-sm">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/70 dark:text-emerald-400/70 mb-1">Cleared / Paid Dues</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-serif font-black text-emerald-600 dark:text-emerald-400">{paidSubscribers}</h3>
                  <span className="text-xs font-bold text-emerald-600/80">({collectionRate}%)</span>
                </div>
                <p className="text-xs text-emerald-600/70 mt-1 font-mono">UGX {totalSubAmountCollected.toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40 bg-amber-500/5 shadow-sm">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/70 dark:text-amber-400/70 mb-1">Pending / Unpaid Dues</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-serif font-black text-amber-600 dark:text-amber-400">{unpaidSubscribers}</h3>
                  <span className="text-xs font-bold text-amber-600/80">({100 - collectionRate}%)</span>
                </div>
                <p className="text-xs text-amber-600/70 mt-1 font-mono">UGX {(totalSubAmountExpected - totalSubAmountCollected).toLocaleString()}</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm flex flex-col justify-between">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Quick Action</p>
                <Button 
                  onClick={() => openReminderModal()}
                  disabled={unpaidSubscribers === 0 || !hasPermission("manage_income")}
                  className="w-full mt-2 h-10 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 text-xs"
                >
                  <Bell className="w-3.5 h-3.5 mr-1.5" /> Broadcast Reminders
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Subscriptions Table Card */}
          <motion.div variants={itemVariants}>
            <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border/20 bg-muted/10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-serif font-bold flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-600" /> Council Member Subscriptions & Dues Tracker
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Track individual fee compliance, toggle payment statuses, and send personalized notification reminders.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  {/* Search */}
                  <div className="relative flex-1 lg:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search member, username..." 
                      className="pl-9 h-10 bg-background/50 border-border/50 rounded-xl focus-visible:ring-amber-500/20 text-xs" 
                      value={subSearchTerm}
                      onChange={e => setSubSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Status Filter */}
                  <Select value={subStatusFilter} onValueChange={setSubStatusFilter}>
                    <SelectTrigger className="h-10 text-xs w-[130px] rounded-xl bg-background/50 border-border/50">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unpaid">Unpaid Only</SelectItem>
                      <SelectItem value="paid">Paid Only</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Class Filter */}
                  <Select value={subClassFilter} onValueChange={setSubClassFilter}>
                    <SelectTrigger className="h-10 text-xs w-[120px] rounded-xl bg-background/50 border-border/50">
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Classes</SelectItem>
                      <SelectItem value="S.6">S.6</SelectItem>
                      <SelectItem value="S.5">S.5</SelectItem>
                      <SelectItem value="S.4">S.4</SelectItem>
                      <SelectItem value="S.3">S.3</SelectItem>
                      <SelectItem value="S.2">S.2</SelectItem>
                      <SelectItem value="S.1">S.1</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <CardContent className="p-0">
                <div className="overflow-x-auto min-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/5 hover:bg-muted/5 border-border/30">
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member & Details</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class / Stream</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Term Dues</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reminder History</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-border/30">
                      {loadingSubscriptions ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center gap-3">
                              <div className="h-8 w-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
                              <p className="text-sm font-medium text-muted-foreground">Loading subscription roster...</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="h-48 text-center">
                            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                              <Users className="h-10 w-10 opacity-20 mb-2" />
                              <p className="font-medium text-sm">No subscription records match the selected filters.</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <AnimatePresence>
                          {filteredSubscriptions.map((sub) => (
                            <motion.tr 
                              key={sub.id || sub.user}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="hover:bg-muted/30 transition-colors group"
                            >
                              {/* Member info */}
                              <TableCell className="px-6 py-4">
                                <div className="font-bold text-foreground flex items-center gap-2">
                                  {sub.full_name || sub.username}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[11px] text-muted-foreground font-mono">@{sub.username}</span>
                                  {sub.roles && sub.roles.length > 0 && (
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider py-0 px-1.5 font-bold bg-muted/40">
                                      {sub.roles[0].replace(/_/g, ' ')}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>

                              {/* Class & Stream */}
                              <TableCell className="px-6 py-4 text-xs font-medium text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Badge variant="secondary" className="text-[10px] font-semibold bg-muted/50">
                                    {sub.student_class || "N/A"} {sub.stream ? `• ${sub.stream}` : ''}
                                  </Badge>
                                </div>
                              </TableCell>

                              {/* Dues */}
                              <TableCell className="px-6 py-4">
                                <div className="font-mono text-xs font-bold text-foreground">
                                  UGX {Number(sub.amount_due || 50000).toLocaleString()}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-medium">{sub.term || "Term 1 2026"}</span>
                              </TableCell>

                              {/* Status */}
                              <TableCell className="px-6 py-4">
                                {sub.paid ? (
                                  <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                    <CheckCircle2 className="w-3 h-3" /> Paid & Cleared
                                  </Badge>
                                ) : (
                                  <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                                    <XCircle className="w-3 h-3" /> Unpaid Due
                                  </Badge>
                                )}
                              </TableCell>

                              {/* Reminder Info */}
                              <TableCell className="px-6 py-4 text-xs text-muted-foreground">
                                {sub.last_reminder_sent_at ? (
                                  <div>
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                                      <Clock className="w-3 h-3 text-amber-600" />
                                      {formatDistanceToNow(new Date(sub.last_reminder_sent_at), { addSuffix: true })}
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">Sent {sub.reminder_count} notice(s)</span>
                                  </div>
                                ) : (
                                  <span className="text-[11px] text-muted-foreground/60 italic">No reminders sent</span>
                                )}
                              </TableCell>

                              {/* Actions */}
                              <TableCell className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {/* Send Reminder button */}
                                  {!sub.paid && hasPermission("manage_income") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => openReminderModal(sub)}
                                      className="h-8 rounded-lg text-xs font-bold text-amber-600 border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/15"
                                    >
                                      <Bell className="w-3 h-3 mr-1" /> Remind
                                    </Button>
                                  )}

                                  {/* Toggle Paid status button */}
                                  {hasPermission("manage_income") && (
                                    <Button
                                      size="sm"
                                      variant={sub.paid ? "outline" : "default"}
                                      disabled={togglingSubId === sub.user}
                                      onClick={() => handleToggleSubscriptionPaid(sub)}
                                      className={`h-8 rounded-lg text-xs font-bold ${
                                        sub.paid 
                                          ? "text-muted-foreground hover:text-rose-600 border-border/50" 
                                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20"
                                      }`}
                                    >
                                      {togglingSubId === sub.user ? (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                      ) : sub.paid ? (
                                        "Mark Unpaid"
                                      ) : (
                                        "Mark as Paid"
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
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
        </TabsContent>
      </Tabs>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: REGISTER INCOME TRANSACTION (RICH METADATA) */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isRegisterDialogOpen} onOpenChange={setIsRegisterDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
          <div className="p-6 border-b border-border/20 bg-emerald-500/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600">
                <PiggyBank className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl font-black text-foreground">
                  Register Revenue Transaction
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Record detailed transaction metadata, payment channel details, and payer identity.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <form onSubmit={handleRegisterIncome} className="space-y-5">
              {/* Source & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                    <span>Revenue Source / Category *</span>
                  </Label>
                  <div className="flex gap-2">
                    <Select 
                      value={incomeFormData.source_type} 
                      onValueChange={val => setIncomeFormData({ ...incomeFormData, source_type: val })}
                    >
                      <SelectTrigger id="source" className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 flex-1 text-xs">
                        <SelectValue placeholder="Select revenue stream..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {sources.map(s => (
                          <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="outline" className="h-11 w-11 rounded-xl p-0" onClick={() => setIsSourceDialogOpen(true)} title="Add New Category">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Amount (UGX) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">UGX</span>
                    <Input 
                      id="amount" 
                      type="number" 
                      className="h-11 pl-12 bg-muted/30 border-border/50 rounded-xl font-mono focus-visible:ring-emerald-500/20"
                      placeholder="e.g. 500000"
                      value={incomeFormData.amount}
                      onChange={e => setIncomeFormData({ ...incomeFormData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Date & Payment Method */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date Received *</Label>
                  <Input 
                    id="date" 
                    type="date"
                    className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 text-xs"
                    value={incomeFormData.date}
                    onChange={e => setIncomeFormData({ ...incomeFormData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment_method" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payment Method / Channel *</Label>
                  <Select 
                    value={incomeFormData.payment_method} 
                    onValueChange={val => setIncomeFormData({ ...incomeFormData, payment_method: val })}
                  >
                    <SelectTrigger id="payment_method" className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 text-xs">
                      <SelectValue placeholder="Select payment channel" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Cash">Cash Handover</SelectItem>
                      <SelectItem value="Mobile Money (MTN)">Mobile Money (MTN)</SelectItem>
                      <SelectItem value="Mobile Money (Airtel)">Mobile Money (Airtel)</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer / Deposit</SelectItem>
                      <SelectItem value="School Pay">School Pay</SelectItem>
                      <SelectItem value="Cheque">Bank Cheque</SelectItem>
                      <SelectItem value="Other">Other Channel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Payer Name & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payer_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payer / Contributing Entity</Label>
                  <Input 
                    id="payer_name" 
                    className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 text-xs"
                    placeholder="e.g. S.4 West Class / MOSA Alumni / Parent" 
                    value={incomeFormData.payer_name}
                    onChange={e => setIncomeFormData({ ...incomeFormData, payer_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payer_contact" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Payer Contact (Phone / Email)</Label>
                  <Input 
                    id="payer_contact" 
                    className="h-11 bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 text-xs"
                    placeholder="e.g. +256 701 234 567" 
                    value={incomeFormData.payer_contact}
                    onChange={e => setIncomeFormData({ ...incomeFormData, payer_contact: e.target.value })}
                  />
                </div>
              </div>

              {/* Payment Reference & Receipt Number */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment_reference" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Transaction ID / Bank Slip Ref</Label>
                  <Input 
                    id="payment_reference" 
                    className="h-11 bg-muted/30 border-border/50 rounded-xl font-mono focus-visible:ring-emerald-500/20 text-xs"
                    placeholder="e.g. TXN-994102941 / CHQ-002" 
                    value={incomeFormData.payment_reference}
                    onChange={e => setIncomeFormData({ ...incomeFormData, payment_reference: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="receipt_number" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Receipt Voucher Number (Optional)</Label>
                  <Input 
                    id="receipt_number" 
                    className="h-11 bg-muted/30 border-border/50 rounded-xl font-mono focus-visible:ring-emerald-500/20 text-xs"
                    placeholder="Leave blank for auto-generated" 
                    value={incomeFormData.receipt_number}
                    onChange={e => setIncomeFormData({ ...incomeFormData, receipt_number: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description & Notes</Label>
                <Textarea 
                  id="description" 
                  placeholder="Provide additional details regarding this revenue collection (purpose, term, class breakdowns)..." 
                  className="resize-none bg-muted/30 border-border/50 rounded-xl focus-visible:ring-emerald-500/20 text-xs"
                  rows={3}
                  value={incomeFormData.description}
                  onChange={e => setIncomeFormData({ ...incomeFormData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button type="button" variant="outline" className="h-11 rounded-xl w-full" onClick={() => setIsRegisterDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmittingIncome} 
                  className="h-11 rounded-xl w-full font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                >
                  {isSubmittingIncome ? "Processing..." : "Complete & Generate Receipt"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: TRANSACTION DETAILS & OFFICIAL RECEIPT CARD */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-xl rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
          {selectedTransaction && (
            <div>
              {/* Receipt Header */}
              <div className="p-6 bg-emerald-500/5 border-b border-border/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-lg text-foreground">Official Revenue Receipt</h3>
                      <p className="text-[11px] text-muted-foreground">Mengo Senior School Student Council</p>
                    </div>
                  </div>

                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-mono font-bold text-xs">
                    {selectedTransaction.status || "Verified"}
                  </Badge>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-6">
                {/* Amount Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/80">Total Amount Received</span>
                    <div className="text-3xl font-serif font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      UGX {Number(selectedTransaction.amount).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date of Entry</span>
                    <p className="text-xs font-bold text-foreground mt-0.5">
                      {format(new Date(selectedTransaction.date), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>

                {/* Key Transaction Metadata Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3" /> Receipt Number
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-foreground">
                        {selectedTransaction.receipt_number || `REC-${selectedTransaction.id}`}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 rounded-md hover:bg-muted"
                        onClick={() => handleCopyReceipt(selectedTransaction.receipt_number || `REC-${selectedTransaction.id}`)}
                      >
                        {copiedReceipt ? <CheckCheck className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> Category Source
                    </span>
                    <p className="font-bold text-foreground">
                      {selectedTransaction.source_name || selectedTransaction.source || "General Revenue"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> Payment Channel
                    </span>
                    <p className="font-bold text-foreground">
                      {selectedTransaction.payment_method || "Cash Handover"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Channel Reference
                    </span>
                    <p className="font-mono font-bold text-foreground truncate" title={selectedTransaction.payment_reference || "N/A"}>
                      {selectedTransaction.payment_reference || "Direct Handover"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" /> Payer Identity
                    </span>
                    <p className="font-bold text-foreground">
                      {selectedTransaction.payer_name || "General Contribution"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/40 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Payer Contact
                    </span>
                    <p className="font-bold text-foreground">
                      {selectedTransaction.payer_contact || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Description / Memo */}
                {selectedTransaction.description && (
                  <div className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes & Remarks</span>
                    <p className="text-xs text-foreground/90 font-medium leading-relaxed">
                      {selectedTransaction.description}
                    </p>
                  </div>
                )}

                {/* Auditor / Officer Signoff */}
                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest block">Recorded By Official</span>
                    <p className="font-bold text-foreground">{selectedTransaction.received_by_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest block">Timestamp</span>
                    <p className="font-medium text-muted-foreground">
                      {format(new Date(selectedTransaction.created_at), "PPp")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Receipt Footer Actions */}
              <div className="p-4 bg-muted/20 border-t border-border/20 flex items-center justify-between gap-3">
                <Button 
                  variant="outline" 
                  onClick={handlePrintReceipt}
                  className="h-10 rounded-xl text-xs font-bold gap-2"
                >
                  <Printer className="w-3.5 h-3.5" /> Print / Save Voucher
                </Button>

                <Button 
                  onClick={() => setIsDetailsDialogOpen(false)}
                  className="h-10 rounded-xl font-bold px-6 text-xs"
                >
                  Close Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: SEND SUBSCRIPTION REMINDER NOTIFICATION */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
          <div className="p-6 bg-amber-500/5 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
                <Bell className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="font-serif text-xl font-black text-foreground">
                  Dispatch Subscription Reminder
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {reminderTarget === "all_unpaid" 
                    ? `Send automated notification reminders to all ${unpaidSubscribers} unpaid member(s).` 
                    : `Send direct notification to ${singleReminderUser?.full_name || singleReminderUser?.username}.`}
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rem_title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Notification Headline *
              </Label>
              <Input 
                id="rem_title" 
                className="h-11 bg-muted/30 border-border/50 rounded-xl text-xs font-semibold focus-visible:ring-amber-500/20"
                value={reminderTitle}
                onChange={e => setReminderTitle(e.target.value)}
                placeholder="e.g. Council Subscription Due Reminder"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rem_msg" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Reminder Message Body *
              </Label>
              <Textarea 
                id="rem_msg" 
                rows={5}
                className="resize-none bg-muted/30 border-border/50 rounded-xl text-xs focus-visible:ring-amber-500/20 leading-relaxed"
                value={reminderMessage}
                onChange={e => setReminderMessage(e.target.value)}
                placeholder="Type reminder message content..."
                required
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                Recipients will receive this alert in their in-portal notification bell and activity feed immediately.
              </p>
            </div>
          </div>

          <div className="p-4 bg-muted/20 border-t border-border/20 flex items-center justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              className="h-11 rounded-xl text-xs"
              onClick={() => setIsReminderDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button"
              disabled={isSendingReminder}
              onClick={handleSendReminder}
              className="h-11 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 text-xs gap-2 px-6"
            >
              {isSendingReminder ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {isSendingReminder ? "Dispatching..." : "Send Notification Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: MANAGE SOURCES / CATEGORIES */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl overflow-hidden p-0">
          <div className="p-6 border-b border-border/20 bg-muted/20">
            <DialogTitle className="font-serif text-2xl font-black flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-muted-foreground" /> Income Categories
            </DialogTitle>
          </div>
          <div className="p-6">
            <form onSubmit={handleAddSource} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="s_name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category Name *</Label>
                <Input 
                  id="s_name" 
                  className="h-11 bg-muted/30 border-border/50 rounded-xl text-xs"
                  placeholder="e.g. Donations, Canteen Levy, Gala" 
                  value={newSource.name}
                  onChange={e => setNewSource({ ...newSource, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="s_desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</Label>
                <Input 
                  id="s_desc" 
                  className="h-11 bg-muted/30 border-border/50 rounded-xl text-xs"
                  placeholder="Details about this revenue stream" 
                  value={newSource.description}
                  onChange={e => setNewSource({ ...newSource, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" className="h-11 rounded-xl font-bold px-6 text-xs">Add Category</Button>
              </div>
            </form>
            <div className="mt-6 pt-6 border-t border-border/40">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 block">Existing Categories</Label>
              <div className="flex flex-wrap gap-2">
                {sources.map(s => (
                  <Badge key={s.id} variant="secondary" className="px-3 py-1 font-medium bg-muted/50 border-border/50 text-xs">{s.name}</Badge>
                ))}
                {sources.length === 0 && <span className="text-sm text-muted-foreground italic">No categories defined yet.</span>}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
