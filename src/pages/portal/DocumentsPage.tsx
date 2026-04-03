import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Search, Loader2, Check, ShieldAlert, Eye, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MonthlyReportForm from "@/components/portal/MonthlyReportForm";
import RequisitionFormTemplate from "@/components/portal/RequisitionFormTemplate";
import MinutesFormTemplate from "@/components/portal/MinutesFormTemplate";
import DocumentViewer from "@/components/portal/DocumentViewer";

const CATEGORIES = ["Constitution", "Minutes", "Finance", "Reports", "Plans", "Other"];
const catColor = (c: string) => {
  const m: Record<string, string> = { Constitution: "default", Minutes: "secondary", Finance: "outline", Reports: "default", Plans: "secondary" };
  return (m[c] || "outline") as any;
};

export default function DocumentsPage() {
  const { hasRole } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
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

  const fileInputRef = useRef<HTMLInputElement>(null);

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
       toast.success("Document approved and forwarded to Patron.");
       fetchDocs();
     } catch (err) {
       toast.error("Failed to approve document.");
     } finally {
       setApproving(null);
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
      
      toast.success("Uploaded!");
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

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Documents Archive</h1>
          <p className="text-sm text-muted-foreground">Council documents & reports.</p>
        </div>
        
        <div className="flex gap-2">
          {/* Templates flow */}
          <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-primary/20">
                <FileText className="mr-1 h-4 w-4" /> Templates
              </Button>
            </DialogTrigger>
            <DialogContent className={(activeTemplate === "monthly_report" || activeTemplate === "requisition" || activeTemplate === "minutes") ? "max-w-4xl" : "max-w-sm"}>
              <DialogHeader>
                <DialogTitle>
                  {activeTemplate === "monthly_report" ? "Monthly Council Report" : 
                   activeTemplate === "requisition" ? "Official Requisition Voucher" :
                   activeTemplate === "minutes" ? "Meeting Minutes Recording" :
                   "Council Document Templates"}
                </DialogTitle>
              </DialogHeader>
              {!activeTemplate ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                  <div 
                    className="flex items-center gap-4 p-4 rounded-xl border border-primary/10 hover:bg-primary/5 cursor-pointer transition-all hover:border-primary/30"
                    onClick={() => setActiveTemplate("monthly_report")}
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Monthly Council Report</p>
                      <p className="text-[10px] text-muted-foreground">Standardized class/office reporting.</p>
                    </div>
                  </div>

                  <div 
                    className="flex items-center gap-4 p-4 rounded-xl border border-primary/10 hover:bg-primary/5 cursor-pointer transition-all hover:border-primary/30"
                    onClick={() => setActiveTemplate("requisition")}
                  >
                    <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Financial Requisition</p>
                      <p className="text-[10px] text-muted-foreground">Formal printable fund request voucher.</p>
                    </div>
                  </div>

                  <div 
                    className="flex items-center gap-4 p-4 rounded-xl border border-primary/10 hover:bg-primary/5 cursor-pointer transition-all hover:border-primary/30"
                    onClick={() => setActiveTemplate("minutes")}
                  >
                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Meeting Minutes</p>
                      <p className="text-[10px] text-muted-foreground">Structured meeting record & resolutions.</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-dashed border-muted-foreground/20 text-center opacity-50 select-none flex items-center justify-center">
                    <p className="text-[10px] font-medium italic">More templates coming soon...</p>
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                   {activeTemplate === "monthly_report" && (
                     <MonthlyReportForm 
                       onSuccess={() => {
                         setActiveTemplate(null);
                         setShowTemplates(false);
                         fetchDocs();
                       }} 
                     />
                   )}
                   {activeTemplate === "requisition" && (
                     <RequisitionFormTemplate 
                       onSuccess={() => {
                         setActiveTemplate(null);
                         setShowTemplates(false);
                         fetchDocs();
                       }} 
                     />
                   )}
                   {activeTemplate === "minutes" && (
                     <MinutesFormTemplate 
                       onSuccess={() => {
                         setActiveTemplate(null);
                         setShowTemplates(false);
                         fetchDocs();
                       }} 
                     />
                   )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Simple Upload flow */}
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Upload className="mr-1 h-4 w-4" /> Upload</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Term 1 Minutes" /></div>
                <div><Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Access Level</Label>
                  <Select value={accessLevel} onValueChange={setAccessLevel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public (All members)</SelectItem>
                      <SelectItem value="private">Private (My Office Only)</SelectItem>
                      <SelectItem value="shared">Share with Specific Office</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {accessLevel === "shared" && (
                  <div><Label>Target Office</Label>
                    <Select value={targetOffice} onValueChange={setTargetOffice}>
                      <SelectTrigger><SelectValue placeholder="Select Office" /></SelectTrigger>
                      <SelectContent>
                        {OFFICES.map(o => <SelectItem key={o} value={o}>{ROLE_LABELS[o]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>File Selection</Label>
                  <Input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" 
                    onChange={e => setFile(e.target.files?.[0] || null)} 
                  />
                  <div 
                    className={`mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all hover:bg-stone-50 group
                      ${file ? 'border-primary bg-primary/5' : 'border-stone-200'}`}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {file ? (
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 flex items-center justify-center bg-primary rounded-lg text-white">
                           <CheckCircle2 className="h-5 w-5" />
                         </div>
                         <div className="flex-1 text-left min-w-0">
                            <p className="text-xs font-bold truncate text-primary">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Ready to upload</p>
                         </div>
                         <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                           <Loader2 className="h-4 w-4" />
                         </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto text-stone-400 group-hover:text-primary transition-colors" />
                        <p className="text-[11px] font-bold mt-2 group-hover:text-primary">Click to select from computer directory</p>
                        <p className="text-[9px] text-stone-400">PDF, DOC, DOCX, PNG, JPG</p>
                      </>
                    )}
                  </div>
                </div>
                <Button onClick={handleUpload} disabled={uploading || !file || !title || (accessLevel === 'shared' && !targetOffice)} className="w-full h-11 shadow-lg ring-offset-2 hover:ring-2 hover:ring-primary/20 transition-all">
                  {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload to Archive"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search documents..." className="pl-9 h-11 rounded-xl shadow-sm border-stone-200" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {loading ? <p className="text-center py-8 text-muted-foreground italic">Fetching archive...</p> :
         filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No documents found.</p> :
         filtered.map((doc) => {
           const isPending = doc.target_office === 'patron_pending_chairperson';
           const canApprove = isPending && hasRole('chairperson');
           const fileUrl = doc.file_url || doc.file || "#";

           return (
            <Card key={doc.id} className={isPending ? "border-amber-500/50 bg-amber-500/5 shadow-none" : "hover:shadow-sm transition-shadow shadow-none border-stone-200"}>
              <CardContent className="flex items-center justify-between p-3 gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg shrink-0 ${isPending ? 'bg-amber-500/20 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                    {isPending ? <ShieldAlert className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-medium truncate">{doc.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      {doc.uploaded_by} • {new Date(doc.created_at).toLocaleDateString()}
                      {doc.access_level === 'private' && <span className="bg-stone-100 text-stone-600 px-1 rounded">Private</span>}
                      {doc.access_level === 'shared' && (
                        <span className={isPending ? "text-amber-600 font-medium" : "text-primary/70"}>
                          {` (Shared with ${ROLE_LABELS[doc.target_office] || doc.target_office})`}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge variant={catColor(doc.category)} className="text-[10px] hidden sm:inline-flex">{doc.category}</Badge>
                  
                  {canApprove && (
                    <Button 
                      size="sm" 
                      variant="default" 
                      className="h-7 px-2 text-[10px] bg-green-600 hover:bg-green-700 shadow-md"
                      onClick={() => handleApprove(doc.id)}
                      disabled={approving === doc.id}
                    >
                      {approving === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 mr-1" />}
                      Approve & Forward
                    </Button>
                  )}

                  <div className="flex items-center gap-0.5">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary hover:bg-primary/5" 
                      onClick={() => setViewerDoc({ url: fileUrl, title: doc.title })}
                      title="View Inbuilt"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-primary" 
                      onClick={() => handleDownload(fileUrl, doc.title)}
                      title="Download locally"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
           );
         })}
      </div>

      <DocumentViewer 
        isOpen={!!viewerDoc} 
        onClose={() => setViewerDoc(null)} 
        fileUrl={viewerDoc?.url || null} 
        title={viewerDoc?.title || ""} 
      />
    </div>
  );
}
