import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Search, Loader2, Check, ShieldAlert, Eye, Trash2, LayoutGrid, List, HardDrive, File as FileIcon, Folder, FileArchive, FolderOpen, Image as ImageIcon, Video, FileAudio } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { notifyRole } from "@/hooks/useNotify";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MonthlyReportForm from "@/components/portal/MonthlyReportForm";
import RequisitionFormTemplate from "@/components/portal/RequisitionFormTemplate";
import MinutesFormTemplate from "@/components/portal/MinutesFormTemplate";
import DocumentViewer from "@/components/portal/DocumentViewer";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = ["Constitution", "Minutes", "Finance", "Reports", "Plans", "Other"];

const getFileIcon = (title: string, category: string) => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes(".pdf")) return <FileText className="h-6 w-6" />;
  if (lowerTitle.match(/\.(jpeg|jpg|gif|png|webp)$/) != null) return <ImageIcon className="h-6 w-6" />;
  if (lowerTitle.match(/\.(mp4|avi|mov|mkv)$/) != null) return <Video className="h-6 w-6" />;
  if (lowerTitle.match(/\.(mp3|wav|ogg)$/) != null) return <FileAudio className="h-6 w-6" />;
  if (lowerTitle.match(/\.(zip|tar|gz|rar)$/) != null) return <FileArchive className="h-6 w-6" />;
  
  if (category === "Finance") return <FileText className="h-6 w-6 text-green-500" />;
  if (category === "Constitution") return <FileText className="h-6 w-6 text-blue-500" />;
  
  return <FileIcon className="h-6 w-6" />;
};

const getCategoryColor = (c: string) => {
  const m: Record<string, string> = { 
    Constitution: "bg-blue-500/10 text-blue-600 border-blue-500/20", 
    Minutes: "bg-purple-500/10 text-purple-600 border-purple-500/20", 
    Finance: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", 
    Reports: "bg-orange-500/10 text-orange-600 border-orange-500/20", 
    Plans: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" 
  };
  return m[c] || "bg-slate-500/10 text-slate-600 border-slate-500/20";
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function DocumentsPage() {
  const { user, hasPermission } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [file, setFile] = useState<File | null>(null);
  const [accessLevel, setAccessLevel] = useState("public");
  const [targetOffice, setTargetOffice] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");

  // Viewer state
  const [viewerDoc, setViewerDoc] = useState<{ url: string; title: string } | null>(null);

  const OFFICES = [
    "chairperson", "vice_chairperson", "speaker", "deputy_speaker", 
    "general_secretary", "assistant_general_secretary", "secretary_finance",
    "secretary_welfare", "secretary_health", "secretary_women_affairs", 
    "secretary_publicity", "secretary_pwd", "electoral_commission", "patron_pending_chairperson"
  ];
  
  const ROLE_LABELS: Record<string, string> = {
    chairperson: "Chairperson", vice_chairperson: "Vice Chairperson",
    speaker: "Speaker", deputy_speaker: "Deputy Speaker", general_secretary: "General Secretary",
    assistant_general_secretary: "Asst. Gen. Secretary", secretary_finance: "Secretary Finance",
    secretary_welfare: "Secretary Welfare", secretary_health: "Secretary Health",
    secretary_women_affairs: "Secretary Women Affairs", secretary_publicity: "Secretary Publicity",
    secretary_pwd: "Secretary PWD", electoral_commission: "Electoral Commission", 
    patron: "Patron", patron_pending_chairperson: "Patron (Pending Approval)"
  };

  const fetchDocs = async () => {
    try {
      const { data } = await api.get("/documents/");
      const entries = Array.isArray(data) ? data : data.results || [];
      setDocs(entries);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleApprove = async (docId: string) => {
     setApproving(docId);
     try {
       await api.patch(`/documents/${docId}/`, { target_office: "patron" });
       const doc = docs.find(d => d.id === docId);
       notifyRole("patron", "Document Forwarded", `The Chairperson has approved and forwarded a document ("${doc?.title || 'System Document'}") to your office for review.`, "info");
       toast.success("Document approved and forwarded to Patron.");
       fetchDocs();
     } catch (err) {
       toast.error("Failed to approve document.");
     } finally {
       setApproving(null);
     }
  };

  const handleDelete = async (docId: string) => {
    setDeleting(docId);
    try {
      await api.delete(`/documents/${docId}/`);
      toast.success("Document deleted.");
      fetchDocs();
    } catch (err) {
      toast.error("Failed to delete document.");
    } finally {
      setDeleting(null);
    }
  };

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("access_level", accessLevel);
      if (accessLevel === "shared") formData.append("target_office", targetOffice);
      formData.append("file", file);

      await api.post("/documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (accessLevel === "shared" && targetOffice) {
        notifyRole(
          targetOffice, 
          "New Document Shared", 
          `A new document "${title}" has been securely shared with your office.`, 
          "info"
        );
      }

      toast.success("Uploaded successfully!");
      setOpen(false); 
      setTitle(""); 
      setCategory("Other"); 
      setAccessLevel("public");
      setTargetOffice("");
      setFile(null); 
      fetchDocs();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (url: string, title: string) => {
    const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.download = title; a.click();
  };

  const filtered = docs.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = filterCategory === "All" || d.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider"
          >
            <HardDrive className="w-3 h-3" /> Digital Library
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Document Center
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Access, manage, and share official council documents. Utilize smart templates for standardized reporting.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-2xl gap-2 font-bold bg-background/50 backdrop-blur-md border border-border/50 shadow-sm h-12 px-5">
                <LayoutGrid className="h-4 w-4 text-primary" /> Smart Templates
              </Button>
            </DialogTrigger>
            <DialogContent className={`rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl overflow-hidden ${(activeTemplate === "monthly_report" || activeTemplate === "requisition" || activeTemplate === "minutes") ? "max-w-4xl" : "max-w-xl"}`}>
              <div className="p-6 border-b border-border/20 bg-blue-500/5">
                <DialogTitle className="font-serif text-2xl font-black text-blue-700 dark:text-blue-400">
                  {activeTemplate === "monthly_report" ? "Monthly Council Report" : 
                   activeTemplate === "requisition" ? "Official Requisition Voucher" :
                   activeTemplate === "minutes" ? "Meeting Minutes Recording" :
                   "Document Templates"}
                </DialogTitle>
              </div>
              
              <div className="p-6">
                {!activeTemplate ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div 
                      className="group flex flex-col gap-3 p-5 rounded-2xl border border-border/50 bg-background hover:bg-muted/30 cursor-pointer transition-all hover:border-blue-500/30 hover:shadow-lg hover:shadow-blue-500/5"
                      onClick={() => setActiveTemplate("monthly_report")}
                    >
                      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="font-bold text-foreground group-hover:text-blue-600 transition-colors">Monthly Council Report</p>
                        <p className="text-xs text-muted-foreground mt-1">Standardized class and office reporting format.</p>
                      </div>
                    </div>

                    {hasPermission("manage_requisitions") && (
                      <div 
                        className="group flex flex-col gap-3 p-5 rounded-2xl border border-border/50 bg-background hover:bg-muted/30 cursor-pointer transition-all hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5"
                        onClick={() => setActiveTemplate("requisition")}
                      >
                        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-emerald-600 transition-colors">Financial Requisition</p>
                          <p className="text-xs text-muted-foreground mt-1">Formal printable fund request voucher.</p>
                        </div>
                      </div>
                    )}

                    {hasPermission("manage_documents") && (
                      <div 
                        className="group flex flex-col gap-3 p-5 rounded-2xl border border-border/50 bg-background hover:bg-muted/30 cursor-pointer transition-all hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5"
                        onClick={() => setActiveTemplate("minutes")}
                      >
                        <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                          <FileText className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground group-hover:text-purple-600 transition-colors">Meeting Minutes</p>
                          <p className="text-xs text-muted-foreground mt-1">Structured meeting records and resolutions.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-h-[70vh] overflow-y-auto pr-2">
                     {activeTemplate === "monthly_report" && <MonthlyReportForm onSuccess={() => { setActiveTemplate(null); setShowTemplates(false); fetchDocs(); }} />}
                     {activeTemplate === "requisition" && <RequisitionFormTemplate onSuccess={() => { setActiveTemplate(null); setShowTemplates(false); fetchDocs(); }} />}
                     {activeTemplate === "minutes" && <MinutesFormTemplate onSuccess={() => { setActiveTemplate(null); setShowTemplates(false); fetchDocs(); }} />}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {hasPermission("manage_documents") && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-2xl gap-2 font-bold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white h-12 px-6">
                  <Upload className="h-4 w-4" /> Upload File
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
                <div className="p-6 border-b border-border/20 bg-blue-500/5">
                  <DialogTitle className="font-serif text-2xl font-black text-blue-700 dark:text-blue-400">Upload Document</DialogTitle>
                </div>
                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title *</Label>
                    <Input className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-blue-500/20 h-11" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Term 1 Minutes" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                          {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Level</Label>
                      <Select value={accessLevel} onValueChange={setAccessLevel}>
                        <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-11"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                          <SelectItem value="public">Public (All)</SelectItem>
                          <SelectItem value="private">Private (My Office)</SelectItem>
                          <SelectItem value="shared">Share Specific</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {accessLevel === "shared" && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Target Office</Label>
                      <Select value={targetOffice} onValueChange={setTargetOffice}>
                        <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-11"><SelectValue placeholder="Select Office" /></SelectTrigger>
                        <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                          {OFFICES.map(o => <SelectItem key={o} value={o}>{ROLE_LABELS[o]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">File Selection</Label>
                    <Input 
                      type="file" 
                      className="bg-muted/30 rounded-xl border-border/50 h-11 pt-2 file:rounded-md file:border-0 file:bg-blue-500/10 file:text-blue-600 file:font-bold file:px-3 file:py-1 hover:file:bg-blue-500/20" 
                      accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.mp3,.zip" 
                      onChange={e => setFile(e.target.files?.[0] || null)} 
                    />
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleUpload} disabled={uploading || !file || !title || (accessLevel === 'shared' && !targetOffice)} className="w-full h-12 rounded-xl font-bold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700 text-white transition-all">
                      {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload to Archive"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </section>

      {/* Explorer Controls */}
      <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-lg rounded-3xl overflow-hidden">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search files by name..." 
              className="pl-11 bg-muted/30 border-border/50 rounded-2xl h-12 focus-visible:ring-blue-500/20 text-base" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48 bg-muted/30 border-border/50 rounded-2xl h-12 font-medium">
                <FolderOpen className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                <SelectItem value="All">All Folders</SelectItem>
                {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            
            <div className="flex bg-muted/50 p-1.5 rounded-2xl shrink-0 border border-border/50">
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className={`h-9 w-10 rounded-xl ${viewMode === 'list' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground'}`}>
                <List className="w-4 h-4" />
              </Button>
              <Button variant={viewMode === 'grid' ? 'secondary' : 'ghost'} size="sm" onClick={() => setViewMode('grid')} className={`h-9 w-10 rounded-xl ${viewMode === 'grid' ? 'bg-background shadow-sm text-blue-600' : 'text-muted-foreground'}`}>
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Explorer View */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" : "flex flex-col gap-3"}>
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <div className="h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full drop-shadow-lg" />
            </motion.div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-24 border border-dashed border-border/60 rounded-3xl bg-muted/10 backdrop-blur-sm">
            <Folder className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-foreground">Folder is empty</h3>
            <p className="text-sm text-muted-foreground mt-1">No documents found matching your criteria.</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((doc) => {
              const isPending = doc.target_office === 'patron_pending_chairperson';
              const canApprove = isPending && hasPermission('approve_voice_forwarding');
              const canDelete = doc.uploaded_by === user?.username || hasPermission('manage_permissions');
              const fileUrl = doc.file_url || doc.file || "#";

              if (viewMode === 'grid') {
                return (
                  <motion.div key={doc.id} variants={itemVariants} layout initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}>
                    <Card className={`h-full group flex flex-col rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
                      isPending ? 'shadow-lg shadow-amber-500/10 border-amber-500/30' : 'hover:shadow-xl hover:shadow-blue-500/5 hover:border-blue-500/30'
                    }`}>
                      <CardContent className="p-0 flex flex-col flex-1">
                        <div className="p-6 flex-1 flex flex-col relative z-10">
                          <div className="flex justify-between items-start mb-5">
                            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm ${
                              isPending ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-background border-border/60 text-muted-foreground group-hover:text-blue-500 transition-colors'
                            }`}>
                              {isPending ? <ShieldAlert className="h-6 w-6" /> : getFileIcon(doc.title, doc.category)}
                            </div>
                            
                            <Badge className={`text-[9px] uppercase font-black tracking-widest shadow-sm ${getCategoryColor(doc.category)}`}>
                              {doc.category}
                            </Badge>
                          </div>
                          
                          <h3 className="font-bold text-lg leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2" title={doc.title}>
                            {doc.title}
                          </h3>
                          
                          <div className="mt-auto space-y-2 pt-4">
                            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                              <span className="truncate pr-2">{doc.uploaded_by}</span>
                              <span className="shrink-0">{new Date(doc.created_at).toLocaleDateString()}</span>
                            </div>
                            
                            <div className="flex gap-2">
                              {doc.access_level === 'private' && (
                                <span className="bg-slate-500/10 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest">Private</span>
                              )}
                              {doc.access_level === 'shared' && (
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                  isPending ? "bg-amber-500/10 text-amber-600" : "bg-indigo-500/10 text-indigo-600"
                                }`}>
                                  Shared: {ROLE_LABELS[doc.target_office] || doc.target_office}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-muted/40 border-t border-border/40 flex items-center justify-between gap-2 mt-auto">
                          {canApprove ? (
                            <Button size="sm" className="w-full h-9 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 shadow-sm" onClick={() => handleApprove(doc.id)} disabled={approving === doc.id}>
                              {approving === doc.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5 mr-1.5" />} Approve
                            </Button>
                          ) : (
                            <>
                              <Button variant="outline" size="sm" className="flex-1 h-9 rounded-xl text-xs font-bold border-border/60 hover:bg-background shadow-sm hover:text-blue-600" onClick={() => setViewerDoc({ url: fileUrl, title: doc.title })}>
                                <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                              </Button>
                              <div className="flex gap-1.5 shrink-0">
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background border border-border/40 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => handleDownload(fileUrl, doc.title)}>
                                  <Download className="h-4 w-4" />
                                </Button>
                                {canDelete && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background border border-border/40 shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                                        {deleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="rounded-3xl border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
                                      <AlertDialogHeader>
                                        <AlertDialogTitle className="font-serif text-2xl">Delete Document?</AlertDialogTitle>
                                        <AlertDialogDescription>Permanently remove "{doc.title}"? This cannot be undone.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(doc.id)} className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">Delete</AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              }

              // List View
              return (
                <motion.div key={doc.id} variants={itemVariants} layout initial="hidden" animate="visible" exit={{ opacity: 0, height: 0 }}>
                  <Card className={`rounded-2xl border-border/40 bg-card/60 backdrop-blur-xl hover:bg-muted/30 transition-all shadow-sm hover:shadow-md ${
                    isPending ? 'border-amber-500/30' : ''
                  }`}>
                    <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0 flex-1">
                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border bg-background shadow-sm ${
                          isPending ? 'border-amber-500/30 text-amber-600' : 'border-border/60 text-muted-foreground'
                        }`}>
                          {isPending ? <ShieldAlert className="h-5 w-5" /> : getFileIcon(doc.title, doc.category)}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base truncate pr-4">{doc.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge className={`text-[8px] uppercase font-black tracking-widest shadow-sm ${getCategoryColor(doc.category)}`}>
                              {doc.category}
                            </Badge>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{doc.uploaded_by}</span>
                            <span className="text-muted-foreground/30">•</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
                            
                            {doc.access_level === 'private' && (
                              <span className="bg-slate-500/10 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">Private</span>
                            )}
                            {doc.access_level === 'shared' && (
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isPending ? "bg-amber-500/10 text-amber-600" : "bg-indigo-500/10 text-indigo-600"}`}>
                                Shared: {ROLE_LABELS[doc.target_office] || doc.target_office}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                        {canApprove ? (
                          <Button size="sm" className="h-9 px-4 rounded-xl text-xs font-bold bg-green-600 hover:bg-green-700 shadow-sm w-full sm:w-auto" onClick={() => handleApprove(doc.id)} disabled={approving === doc.id}>
                            {approving === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1.5" />} Approve & Forward
                          </Button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5 w-full">
                            <Button variant="outline" size="sm" className="h-9 rounded-xl text-xs font-bold border-border/60 hover:bg-background shadow-sm hover:text-blue-600 flex-1 sm:flex-none" onClick={() => setViewerDoc({ url: fileUrl, title: doc.title })}>
                              <Eye className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">View</span>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background border border-border/40 shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => handleDownload(fileUrl, doc.title)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl bg-background border border-border/40 shadow-sm hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200">
                                    {deleting === doc.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-3xl border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-serif text-2xl">Delete Document?</AlertDialogTitle>
                                    <AlertDialogDescription>Permanently remove "{doc.title}"? This cannot be undone.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(doc.id)} className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <DocumentViewer 
        isOpen={!!viewerDoc} 
        onClose={() => setViewerDoc(null)} 
        fileUrl={viewerDoc?.url || null} 
        title={viewerDoc?.title || ""} 
      />    
    </motion.div>
  );
}
