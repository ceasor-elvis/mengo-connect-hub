import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Scale, Plus, AlertCircle, FileText, CheckCircle2, Clock, Send, ShieldCheck, ShieldAlert, FileWarning, Search, Info } from "lucide-react";
import DocumentViewer from "@/components/portal/DocumentViewer";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { notifyRole } from "@/hooks/useNotify";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface DCCase {
  id: string;
  offender_name: string;
  category: string;
  description: string;
  status: 'Pending' | 'Under Investigation' | 'Summoned' | 'Closed' | 'Resolved' | 'Dismissed';
  reported_by: string;
  created_at: string;
  is_forwarded_to_patron?: boolean;
  pending_chairperson_approval?: boolean;
}

interface DCDocument {
  id: string;
  title: string;
  category: string;
  file: string;
  uploaded_by_name: string;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function DisciplinaryPage() {
  const { user, hasPermission } = useAuth();
  const canManageDC = hasPermission("manage_disciplinary");
  const isChairperson = hasPermission("approve_disciplinary_forwarding");
  const [cases, setCases] = useState<DCCase[]>([]);
  const [documents, setDocuments] = useState<DCDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docsLoading, setDocsLoading] = useState(true);
  
  const [offender, setOffender] = useState("");
  const [category, setCategory] = useState("Insubordination");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [exportFooterText, setExportFooterText] = useState("ANOINTED TO BEAR FRUIT");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      const { data } = await api.get("/dc-cases/");
      setCases(data.results || data);
    } catch (error) {
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get("/documents/", { params: { category: "Disciplinary" } });
      setDocuments((data.results || data).filter((d: any) => d.category === 'Disciplinary'));
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchDocuments();
  }, []);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offender.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const finalCategory = category === "Other" ? customCategory : category;
      await api.post("/dc-cases/", {
        offender_name: offender,
        category: finalCategory,
        description,
        reported_by: user?.id,
      });
      notifyRole("disciplinary_committee", "New DC Case Logged", `A new disciplinary case regarding ${offender} (${finalCategory}) has been logged.`, "warning");
      toast.success("Case reported successfully");
      setOffender("");
      setDescription("");
      setCustomCategory("");
      fetchCases();
    } catch (error) {
      toast.error("Failed to report case");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle || !docFile) {
      toast.error("Please provide a title and select a file");
      return;
    }
    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", newDocTitle);
      formData.append("file", docFile);
      formData.append("category", "Disciplinary");
      formData.append("access_level", "public");
      
      await api.post("/documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Document uploaded successfully");
      setIsUploadOpen(false);
      setNewDocTitle("");
      setDocFile(null);
      fetchDocuments();
    } catch (error) {
      toast.error("Failed to upload document");
    } finally {
      setUploadLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/dc-cases/${id}/`, { status });
      toast.success(`Status updated to ${status}`);
      fetchCases();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleRequestForward = async (id: string) => {
    try {
      await api.patch(`/dc-cases/${id}/`, { pending_chairperson_approval: true });
      notifyRole("chairperson", "Case Escalation Request", "A Disciplinary Committee case requires your approval for forwarding to the Patron.", "info");
      toast.success("Forwarding request sent to Chairperson");
      fetchCases();
    } catch { toast.error("Action failed"); }
  };

  const handleApproveForward = async (id: string) => {
    try {
      await api.patch(`/dc-cases/${id}/`, { is_forwarded_to_patron: true, pending_chairperson_approval: false });
      notifyRole("patron", "Disciplinary Case Forwarded", "A Disciplinary Case has been approved by the Chairperson and escalated to your office for review.", "warning");
      toast.success("Case approved & forwarded to Patron");
      fetchCases();
    } catch { toast.error("Action failed"); }
  };

  const handleRevokeForward = async (id: string) => {
    try {
      await api.patch(`/dc-cases/${id}/`, { is_forwarded_to_patron: false, pending_chairperson_approval: false });
      toast.success("Forwarding revoked");
      fetchCases();
    } catch { toast.error("Action failed"); }
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
    doc.text("DISCIPLINARY COMMITTEE CASE REPORT", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 15, y);
    doc.text(`Active cases: ${cases.length}`, pageW - 40, y);
    y += 15;

    cases.forEach((c, idx) => {
      if (y > 250) { doc.addPage(); y = 20; }
      
      doc.setFillColor(245, 245, 245); doc.rect(15, y, pageW - 30, 8, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text(`${idx + 1}. CASE: ${c.offender_name.toUpperCase()}`, 17, y + 5.5);
      y += 10;

      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text(`Category: ${c.category} | Status: ${c.status}`, 20, y);
      y += 6;

      const descLines = doc.splitTextToSize(`Incident: ${c.description}`, pageW - 40);
      doc.text(descLines, 20, y);
      y += (descLines.length * 4) + 4;

      doc.text(`Reported on: ${format(new Date(c.created_at), 'PPP')}`, 20, y);
      y += 10;
    });

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text(exportFooterText, pageW / 2, 285, { align: "center" });

    const blob = doc.output("blob");
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);
    setIsExportOpen(false);
    toast.success("DC case report preview generated!");
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-3.5 w-3.5" />;
      case 'under investigation': return <Search className="h-3.5 w-3.5" />;
      case 'summoned': return <Scale className="h-3.5 w-3.5" />;
      case 'closed': 
      case 'resolved': return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'dismissed': return <Info className="h-3.5 w-3.5" />;
      default: return <AlertCircle className="h-3.5 w-3.5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case 'under investigation': return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case 'summoned': return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case 'closed': 
      case 'resolved': return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case 'dismissed': return "bg-slate-500/10 text-slate-600 border-slate-500/20";
      default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 relative"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute top-1/2 -left-20 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider"
          >
            <ShieldAlert className="w-3 h-3" /> Law & Order
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Disciplinary Actions
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Manage student council disciplinary records, track ongoing investigations, and escalate critical cases to the Patron.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl gap-2 font-bold bg-background/50 backdrop-blur-md hover:bg-muted border border-border/50 h-12 px-6" disabled={cases.length === 0}>
                <FileText className="h-4 w-4" /> Export Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-3xl border-border/40 bg-background/60 backdrop-blur-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Export Disciplinary Report</DialogTitle>
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
                <Button className="rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90" onClick={generatePDFReport}>View Preview</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </section>

      <Tabs defaultValue="active" className="w-full space-y-6">
        <TabsList className="bg-muted/40 backdrop-blur-md border border-border/40 p-1.5 rounded-2xl w-full max-w-xl grid grid-cols-3 mx-auto lg:mx-0 shadow-inner">
          <TabsTrigger value="active" className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Active Cases</TabsTrigger>
          <TabsTrigger value="report" className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-red-500 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-red-500/20">Report Case</TabsTrigger>
          <TabsTrigger value="docs" className="rounded-xl text-xs sm:text-sm font-bold data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="outline-none">
          <div className="grid gap-4">
            {loading ? (
              <div className="flex justify-center py-20">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                  <div className="h-10 w-10 border-4 border-red-500 border-t-transparent rounded-full drop-shadow-lg" />
                </motion.div>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-20 bg-muted/20 border border-border/40 rounded-3xl backdrop-blur-xl">
                <Scale className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-foreground">No active cases</h3>
                <p className="text-sm text-muted-foreground mt-1">Disciplinary records are clear.</p>
              </div>
            ) : (
              <AnimatePresence>
                {cases.map((c) => (
                  <motion.div key={c.id} variants={itemVariants} layout initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}>
                    <Card className="overflow-hidden rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative group border-l-4 border-l-red-500">
                      <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                      <CardContent className="p-0">
                        <div className="p-5 sm:p-6 pb-4 flex flex-col md:flex-row items-start justify-between gap-4 border-b border-border/40 bg-background/50">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="h-10 w-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 shrink-0 shadow-sm">
                                <Scale className="h-5 w-5" />
                              </div>
                              <div>
                                <h3 className="text-xl font-serif font-black tracking-tight text-foreground">{c.offender_name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] uppercase font-black tracking-widest bg-background/80 shadow-sm">{c.category}</Badge>
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Badge className={`text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5 px-3 py-1.5 shadow-sm border ${getStatusColor(c.status)}`}>
                            {getStatusIcon(c.status)} {c.status}
                          </Badge>
                        </div>
                        
                        <div className="p-5 sm:p-6 space-y-4">
                          <div className="bg-muted/30 rounded-2xl p-4 border border-border/50 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-red-500/50 to-orange-500/50" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Incident Report</h4>
                            <p className="text-sm text-foreground/90 leading-relaxed font-medium">"{c.description}"</p>
                          </div>
                          
                          <div className="flex flex-col gap-3">
                            <div className="flex flex-wrap gap-2">
                              {canManageDC && (
                                <>
                                  <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold border-blue-500/20 text-blue-600 hover:bg-blue-50" onClick={() => updateStatus(c.id, 'Under Investigation')}>
                                    <Search className="w-3.5 h-3.5 mr-1.5" /> Investigate
                                  </Button>
                                  <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold border-purple-500/20 text-purple-600 hover:bg-purple-50" onClick={() => updateStatus(c.id, 'Summoned')}>
                                    <Scale className="w-3.5 h-3.5 mr-1.5" /> Summon
                                  </Button>
                                  <Button variant="outline" size="sm" className="rounded-xl h-9 text-xs font-bold border-emerald-500/20 text-emerald-600 hover:bg-emerald-50" onClick={() => updateStatus(c.id, 'Closed')}>
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Close Case
                                  </Button>
                                </>
                              )}
                            </div>

                            <div className="pt-3 border-t border-border/40">
                              {c.is_forwarded_to_patron && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-2 flex items-start gap-2 text-amber-700 dark:text-amber-400">
                                  <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-bold text-xs uppercase tracking-wider block">Escalated</span>
                                    <span className="text-xs">Case has been forwarded to the Patron's office for executive review.</span>
                                  </div>
                                </div>
                              )}
                              
                              {c.pending_chairperson_approval && !c.is_forwarded_to_patron && (
                                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 mb-2 flex items-start gap-2 text-blue-700 dark:text-blue-400">
                                  <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                                  <div>
                                    <span className="font-bold text-xs uppercase tracking-wider block">Approval Required</span>
                                    <span className="text-xs">Awaiting Chairperson approval for Patron escalation.</span>
                                  </div>
                                </div>
                              )}

                              {isChairperson && (
                                <div className="mt-2 space-y-2">
                                  {c.is_forwarded_to_patron ? (
                                    <Button variant="destructive" size="sm" className="w-full h-10 rounded-xl gap-2 text-xs font-bold shadow-lg shadow-red-500/20" onClick={() => handleRevokeForward(c.id)}>
                                      <Send className="h-3.5 w-3.5" /> Revoke Forwarding
                                    </Button>
                                  ) : (
                                    <Button variant="default" size="sm" className="w-full h-10 rounded-xl gap-2 text-xs font-bold bg-foreground text-background hover:bg-foreground/90 shadow-lg" onClick={() => handleApproveForward(c.id)}>
                                      <Send className="h-3.5 w-3.5" /> Approve & Forward to Patron
                                    </Button>
                                  )}
                                </div>
                              )}

                              {hasPermission("manage_disciplinary") && !isChairperson && (
                                <div className="mt-2">
                                  {!c.is_forwarded_to_patron && !c.pending_chairperson_approval && (
                                    <Button variant="outline" size="sm" className="w-full h-10 rounded-xl gap-2 text-xs font-bold border-border/50 shadow-sm" onClick={() => handleRequestForward(c.id)}>
                                      <Send className="h-3.5 w-3.5" /> Request Escalation to Patron
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </TabsContent>

        <TabsContent value="report" className="outline-none">
          <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-2xl overflow-hidden max-w-2xl mx-auto">
            <div className="p-6 border-b border-border/20 bg-red-500/5">
              <CardTitle className="font-serif text-2xl font-black text-red-700 dark:text-red-400">File Disciplinary Report</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Submit an official complaint to the Disciplinary Committee.</p>
            </div>
            <CardContent className="p-6 sm:p-8">
              <form onSubmit={handleReport} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="offender" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Offender / Student Name *</Label>
                  <Input id="offender" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-red-500/20 h-12 px-4 font-bold" value={offender} onChange={(e) => setOffender(e.target.value)} placeholder="Full name of the student" required />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="bg-muted/30 rounded-xl border-border/50 h-12 focus:ring-red-500/20"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl backdrop-blur-xl bg-background/90">
                        <SelectItem value="Insubordination">Insubordination</SelectItem>
                        <SelectItem value="Dress Code">Dress Code</SelectItem>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Bullying">Bullying</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {category === "Other" && (
                    <div className="space-y-2">
                      <Label htmlFor="custom" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Custom Category *</Label>
                      <Input id="custom" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-red-500/20 h-12" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter specific category" required />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Detailed Description *</Label>
                  <Textarea id="desc" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-red-500/20 resize-none p-4" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide full context of the incident. What happened? Who was involved? When and where?" rows={5} required />
                </div>

                <div className="pt-4">
                  <Button type="submit" disabled={submitting} className="w-full h-14 rounded-2xl font-bold text-lg shadow-lg shadow-red-500/20 bg-red-600 hover:bg-red-700 text-white transition-all">
                    {submitting ? "Submitting..." : "Submit Official Report"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs" className="outline-none">
          <Card className="rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden max-w-3xl mx-auto">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/20 p-6">
              <div>
                <CardTitle className="font-serif text-2xl font-bold">Case Documentation</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Official disciplinary guidelines and records.</p>
              </div>
              {canManageDC && (
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90 shadow-lg">
                      <Plus className="h-4 w-4 mr-2" /> Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-serif text-2xl">Upload File</DialogTitle>
                      <DialogDescription>Add official DC documentation.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUploadDocument} className="space-y-5 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="docTitle" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Document Title</Label>
                        <Input id="docTitle" className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-primary/20 h-11" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} placeholder="e.g. DC Procedures 2026" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="docFile" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">File</Label>
                        <Input id="docFile" type="file" className="bg-muted/30 rounded-xl border-border/50 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-bold file:px-4 file:py-1 h-11 pt-1.5" onChange={e => setDocFile(e.target.files?.[0] || null)} required />
                      </div>
                      <div className="pt-2 border-t border-border/20 flex justify-end">
                        <Button type="submit" disabled={uploadLoading} className="rounded-xl font-bold bg-foreground text-background">
                          {uploadLoading ? "Uploading..." : "Upload File"}
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {docsLoading ? (
                  <div className="flex justify-center py-12">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
                      <div className="h-8 w-8 border-4 border-muted-foreground border-t-transparent rounded-full drop-shadow-sm" />
                    </motion.div>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-border/60 rounded-2xl bg-muted/10">
                    <FileWarning className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">No disciplinary documents uploaded yet.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {documents.map((doc) => (
                      <motion.div key={doc.id} variants={itemVariants} initial="hidden" animate="visible" exit={{ opacity: 0 }}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-4 border border-border/40 rounded-2xl bg-background/50 hover:bg-muted/50 hover:border-primary/30 transition-all group shadow-sm hover:shadow-md">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary">
                              <FileText className="h-6 w-6" />
                            </div>
                            <div>
                              <p className="font-bold text-foreground group-hover:text-primary transition-colors">{doc.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">By {doc.uploaded_by_name}</span>
                                <span className="text-muted-foreground/40">•</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <a href={doc.file} target="_blank" rel="noopener noreferrer" className="shrink-0 w-full sm:w-auto">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto rounded-xl font-bold bg-background shadow-sm hover:bg-primary hover:text-white hover:border-primary transition-colors">
                              View File
                            </Button>
                          </a>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <DocumentViewer 
        isOpen={!!previewUrl} 
        onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} 
        fileUrl={previewUrl} 
        title={`DC Case Report`} 
        type="pdf"
      />
    </motion.div>
  );
}
