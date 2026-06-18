import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, MoreHorizontal, FileText, User, Calendar, AlertOctagon, Info, Flag } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DocumentViewer from "@/components/portal/DocumentViewer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { notifyRole } from "@/hooks/useNotify";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Issue {
  id: string; title: string; description: string; status: string;
  raised_by: string; reporter_name?: string; created_at: string;
  category: string; priority: string;
}

const statusColor = (s: string) => {
  const normalized = s.toLowerCase();
  if (normalized === "resolved") return "bg-emerald-500/10 text-emerald-600 border-none";
  if (normalized === "in_progress") return "bg-blue-500/10 text-blue-600 border-none";
  return "bg-amber-500/10 text-amber-600 border-none";
};

const priorityColor = (p: string) => {
  const norm = p.toLowerCase();
  if (norm === "critical") return "bg-rose-500 text-white border-none shadow-md shadow-rose-500/20";
  if (norm === "high") return "bg-orange-500/20 text-orange-700 border-none";
  if (norm === "medium") return "bg-amber-500/10 text-amber-600 border-none";
  return "bg-slate-500/10 text-slate-600 border-none";
};

const priorityIcon = (p: string) => {
  const norm = p.toLowerCase();
  if (norm === "critical") return <AlertOctagon className="h-3 w-3" />;
  if (norm === "high") return <AlertTriangle className="h-3 w-3" />;
  if (norm === "medium") return <Flag className="h-3 w-3" />;
  return <Info className="h-3 w-3" />;
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function IssuesPage() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("manage_issues");
  const { log } = useActivityLog();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Infrastructure");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFooterText, setExportFooterText] = useState("ANOINTED TO BEAR FRUIT");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const filteredIssues = issues.filter(issue => {
    const s = issue.status.toLowerCase();
    const st = statusFilter.toLowerCase();
    const matchesStatus = statusFilter === "All" || s === st || (st === "open" && s !== "in_progress" && s !== "resolved");
    const matchesCategory = categoryFilter === "All" || issue.category === categoryFilter;
    const matchesPriority = priorityFilter === "All" || issue.priority === priorityFilter;
    return matchesStatus && matchesCategory && matchesPriority;
  });

  const fetchIssues = async () => {
    try {
      const { data } = await api.get("/issues/");
      setIssues(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load issues");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleAdd = async () => {
    if (!title.trim() || !description.trim()) { toast.error("Title & description required"); return; }
    if (!user) { toast.error("Login required"); return; }
    setSubmitting(true);
    try {
      await api.post("/issues/", {
        title: title.trim(),
        description: description.trim(),
        raised_by: user.id,
        category,
        priority
      });
      toast.success("Issue raised"); 
      log("raised an issue", "issues", title); 
      notifyRole(
        ["chairperson", "patron", "general_secretary"],
        "New Issue Raised",
        `A new issue titled "${title}" has been raised by ${user.username}.`,
        "warning"
      );
      setTitle(""); 
      setDescription(""); 
      setCategory("Infrastructure");
      setPriority("Medium");
      setOpen(false);
      fetchIssues();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error raising issue");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/issues/${id}/`, { status: newStatus });
      toast.success("Status updated");
      fetchIssues();
    } catch (e: any) {
      toast.error("Failed to update status");
    }
  };

  const generatePDFReport = async () => {
    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    const addImageToDoc = (src: string, x: number, y: number, w: number, h: number, format: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = "Anonymous";
        img.onload = () => { doc.addImage(img, format, x, y, w, h); resolve(); };
        img.onerror = () => resolve();
      });
    };

    await Promise.all([
      addImageToDoc(mengoBadge, 15, 10, 20, 20, "JPEG"),
      addImageToDoc(unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
    ]);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    doc.text("VINE STUDENTS' COUNCIL BODY", pageW / 2, y, { align: "center" });
    y += 10; doc.setFontSize(12);
    doc.text("COUNCIL ISSUES & GRIEVANCES REPORT", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 15, y);
    doc.text(`Total Issues: ${filteredIssues.length}`, pageW - 40, y);
    y += 10;

    doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text(`Filters: Status(${statusFilter}), Category(${categoryFilter}), Priority(${priorityFilter})`, 15, y);
    doc.setTextColor(0, 0, 0);
    y += 8;

    filteredIssues.forEach((issue, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFillColor(245, 245, 245); doc.rect(15, y, pageW - 30, 7, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(9);
      doc.text(`${idx + 1}. ${issue.title.toUpperCase()}`, 17, y + 4.5);
      y += 8;

      doc.setFontSize(8); doc.setFont("helvetica", "normal");
      const descLines = doc.splitTextToSize(issue.description, pageW - 40);
      doc.text(descLines, 20, y);
      y += (descLines.length * 4) + 3;

      doc.text(`Category: ${issue.category} | Priority: ${issue.priority} | Status: ${issue.status.replace('_', ' ')}`, 20, y);
      y += 5;
      doc.text(`Raised by: ${issue.reporter_name || "Unknown councillor"} on ${format(new Date(issue.created_at), 'MMM d, yyyy')}`, 20, y);
      y += 10;
    });

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(exportFooterText, pageW / 2, 285, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("Issues report preview generated!");
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 relative"
    >
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-32 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />

      {/* Header Section */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider"
          >
            <AlertTriangle className="w-3 h-3" /> Grievances & Challenges
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Issues at Hand
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Track and resolve operational, academic, or welfare issues raised by the council. Prioritize and act swiftly.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-2xl gap-2 font-bold bg-background/50 backdrop-blur-md" disabled={filteredIssues.length === 0}>
                <FileText className="h-4 w-4" /> Export Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Export Issues Report</DialogTitle>
                <DialogDescription>Customize your report footer before downloading.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="footerText" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Footer Slogan</Label>
                  <Input 
                    id="footerText" 
                    className="bg-muted/50 border-border/50 focus-visible:ring-primary/20 rounded-xl"
                    value={exportFooterText} 
                    onChange={e => setExportFooterText(e.target.value)} 
                    placeholder="e.g. ANOINTED TO BEAR FRUIT"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-border/20">
                <Button variant="outline" className="rounded-xl" onClick={() => setIsExportOpen(false)}>Cancel</Button>
                <Button className="rounded-xl font-bold" onClick={generatePDFReport}>View Preview</Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl gap-2 font-bold shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white">
                <Plus className="h-4 w-4" /> Raise Issue
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
              <div className="p-6 border-b border-border/20 bg-rose-500/5">
                <DialogTitle className="font-serif text-2xl font-black text-rose-700 dark:text-rose-400">Raise New Issue</DialogTitle>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title *</Label>
                  <Input className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-rose-500/20" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Broken lab equipment" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description *</Label>
                  <Textarea className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-rose-500/20 resize-none" value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the issue in detail..." />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-muted/30 rounded-xl border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl backdrop-blur-xl bg-background/80">
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Academic">Academic</SelectItem>
                        <SelectItem value="Welfare">Welfare</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Priority *</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="bg-muted/30 rounded-xl border-border/50"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl backdrop-blur-xl bg-background/80">
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={handleAdd} disabled={submitting} className="w-full rounded-xl py-6 font-bold shadow-lg shadow-rose-500/20 bg-rose-600 hover:bg-rose-700 text-white">
                    {submitting ? "Saving..." : "Submit Issue"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      {/* Filters */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-muted/30 border-border/50 rounded-2xl h-11 focus:ring-primary/20"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-muted/30 border-border/50 rounded-2xl h-11 focus:ring-primary/20"><SelectValue placeholder="Category" /></SelectTrigger>
                <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="Academic">Academic</SelectItem>
                  <SelectItem value="Welfare">Welfare</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-muted/30 border-border/50 rounded-2xl h-11 focus:ring-primary/20"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                  <SelectItem value="All">All Priorities</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full drop-shadow-lg" />
          </motion.div>
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-border/40 rounded-3xl backdrop-blur-xl">
          <AlertTriangle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-foreground">No issues raised yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Everything is running smoothly.</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="text-center py-20 bg-muted/20 border border-border/40 rounded-3xl backdrop-blur-xl">
          <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-serif text-xl font-bold text-foreground">No issues found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters to find what you're looking for.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence>
            {filteredIssues.map((issue) => {
              const isCritical = issue.priority.toLowerCase() === "critical" && issue.status.toLowerCase() !== "resolved";
              
              return (
                <motion.div key={issue.id} variants={itemVariants} layout initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}>
                  <Card className={`h-full bg-card/40 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group rounded-3xl overflow-hidden relative flex flex-col ${
                    isCritical ? 'border-rose-500/50 shadow-rose-500/10' : 'border-border/40 hover:shadow-primary/5'
                  }`}>
                    {isCritical && (
                      <div className="absolute inset-0 bg-rose-500/5 animate-pulse z-0" />
                    )}
                    <CardContent className="p-5 sm:p-6 relative z-10 flex flex-col flex-1">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`mt-0.5 h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center border shadow-sm ${
                            issue.status.toLowerCase() === "resolved" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                            isCritical ? "bg-rose-500 text-white border-rose-600 shadow-rose-500/30" : "bg-amber-500/10 border-amber-500/20 text-amber-600"
                          }`}>
                            {issue.status.toLowerCase() === "resolved" ? <CheckCircle className="h-5 w-5" /> : 
                             isCritical ? <AlertOctagon className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-lg font-serif font-bold truncate group-hover:text-primary transition-colors leading-tight mb-1.5">{issue.title}</h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-background/80 border-border/50 shadow-sm">{issue.category}</Badge>
                              <Badge className={`text-[9px] uppercase font-black tracking-widest flex items-center gap-1 shadow-sm ${priorityColor(issue.priority)}`}>
                                {priorityIcon(issue.priority)} {issue.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1 shadow-sm ${statusColor(issue.status)}`}>
                            {issue.status.replace("_", " ")}
                          </Badge>
                          {canManage && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl bg-background/50 hover:bg-muted border border-border/50 shadow-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl border-border/50 bg-background/90 backdrop-blur-xl">
                                <DropdownMenuItem className="text-xs font-bold" onClick={() => handleStatusUpdate(issue.id, "Open")}>Mark as Open</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-blue-600" onClick={() => handleStatusUpdate(issue.id, "in_progress")}>Mark In Progress</DropdownMenuItem>
                                <DropdownMenuItem className="text-xs font-bold text-emerald-600" onClick={() => handleStatusUpdate(issue.id, "resolved")}>Mark Resolved</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground/90 leading-relaxed mb-6 line-clamp-2 flex-1 pl-13">
                        {issue.description}
                      </p>
                      
                      <div className="mt-auto pt-4 border-t border-border/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3 w-3 text-primary" />
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span className="text-foreground">{issue.reporter_name || "Unknown"}</span>
                          </p>
                        </div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" /> {new Date(issue.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
      
      <DocumentViewer 
        isOpen={!!previewUrl} 
        onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} 
        fileUrl={previewUrl} 
        title={`Council Issues Report`} 
        type="pdf"
      />
    </motion.div>
  );
}
