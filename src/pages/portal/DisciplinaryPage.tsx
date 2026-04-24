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
import { Scale, Plus, AlertCircle, FileText, CheckCircle2, Clock, Send, ShieldCheck } from "lucide-react";
import DocumentViewer from "@/components/portal/DocumentViewer";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { notifyRole } from "@/hooks/useNotify";
import { useAuth } from "@/hooks/useAuth";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { format } from "date-fns";

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
      formData.append("access_level", "public"); // or based on user role
      
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
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Under Investigation': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'Summoned': return <Scale className="h-4 w-4 text-purple-500" />;
      case 'Closed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Disciplinary Committee (DC)
          </h1>
          <p className="text-muted-foreground text-sm">Case management and disciplinary records.</p>
        </div>
        <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" disabled={cases.length === 0}>
              <FileText className="mr-2 h-4 w-4" /> Export Report
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Export Disciplinary Report</DialogTitle>
              <DialogDescription>Customize your report footer before downloading.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="footerText">Document Footer Slogan</Label>
                <Input 
                  id="footerText" 
                  value={exportFooterText} 
                  onChange={e => setExportFooterText(e.target.value)} 
                  placeholder="e.g. ANOINTED TO BEAR FRUIT"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsExportOpen(false)}>Cancel</Button>
              <Button onClick={generatePDFReport}>View Preview</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">Active Cases</TabsTrigger>
          <TabsTrigger value="report">Report New Case</TabsTrigger>
          <TabsTrigger value="docs">DC Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-4">
            {loading ? (
              <p className="text-center py-8 animate-pulse">Loading cases...</p>
            ) : cases.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No active cases found.</CardContent></Card>
            ) : (
              cases.map((c) => (
                <Card key={c.id} className="overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-semibold">{c.offender_name}</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getStatusIcon(c.status)} {c.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{c.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">Reported: {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-balance leading-relaxed italic border-l-2 pl-3 border-muted">
                      "{c.description}"
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                      {canManageDC && (
                        <>
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateStatus(c.id, 'Under Investigation')}>Investigate</Button>
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateStatus(c.id, 'Summoned')}>Summon</Button>
                          <Button variant="ghost" size="sm" className="text-xs hover:text-green-600" onClick={() => updateStatus(c.id, 'Closed')}>Close Case</Button>
                        </>
                      )}
                    </div>

                    <div className="pt-2 border-t mt-2">
                      {c.is_forwarded_to_patron && (
                        <div className="flex items-center gap-1 mb-2">
                          <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3" /> Forwarded to Patron
                          </Badge>
                        </div>
                      )}
                      {c.pending_chairperson_approval && !c.is_forwarded_to_patron && (
                        <div className="flex items-center gap-1 mb-2">
                          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[10px] flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Pending Chairperson Approval
                          </Badge>
                        </div>
                      )}

                      {isChairperson && (
                        <>
                          {c.pending_chairperson_approval && !c.is_forwarded_to_patron && (
                            <div className="w-full p-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 rounded-md mb-2">
                              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">⏳ A committee member has requested this case be forwarded to the Patron.</p>
                            </div>
                          )}
                          {c.is_forwarded_to_patron ? (
                            <Button variant="destructive" size="sm" className="w-full gap-2 text-xs" onClick={() => handleRevokeForward(c.id)}>
                              <Send className="h-3.5 w-3.5" /> Revoke Forwarding
                            </Button>
                          ) : (
                            <Button variant="default" size="sm" className="w-full gap-2 text-xs" onClick={() => handleApproveForward(c.id)}>
                              <Send className="h-3.5 w-3.5" /> Approve & Forward to Patron
                            </Button>
                          )}
                        </>
                      )}

                      {hasPermission("manage_disciplinary") && !isChairperson && (
                        <>
                          {c.is_forwarded_to_patron ? (
                            <p className="text-xs text-amber-700 font-medium flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Forwarded to Patron by Chairperson</p>
                          ) : c.pending_chairperson_approval ? (
                            <p className="text-xs text-blue-700 font-medium flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Awaiting Chairperson approval</p>
                          ) : (
                            <Button variant="outline" size="sm" className="w-full gap-2 text-xs border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => handleRequestForward(c.id)}>
                              <Send className="h-3.5 w-3.5" /> Request Forwarding to Patron
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader><CardTitle>Case Information Report</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleReport} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="offender">Offender / Student Name *</Label>
                  <Input id="offender" value={offender} onChange={(e) => setOffender(e.target.value)} placeholder="Full name of the student" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Insubordination">Insubordination</SelectItem>
                        <SelectItem value="Dress Code">Dress Code</SelectItem>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Bullying">Bullying</SelectItem>
                        <SelectItem value="Other">Other (Type below)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {category === "Other" && (
                    <div className="grid gap-2">
                      <Label htmlFor="custom">Custom Category *</Label>
                      <Input id="custom" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter category" />
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="desc">Detailed Description *</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide full context of the incident..." rows={4} required />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Submit Report to DC"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Case Documentation</CardTitle>
              {canManageDC && (
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Document</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Disciplinary Document</DialogTitle>
                      <DialogDescription>These documents will be accessible to authorized council members.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUploadDocument} className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="docTitle">Document Title</Label>
                        <Input id="docTitle" value={newDocTitle} onChange={e => setNewDocTitle(e.target.value)} placeholder="e.g. DC Procedures 2026" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="docFile">File</Label>
                        <Input id="docFile" type="file" onChange={e => setDocFile(e.target.files?.[0] || null)} required />
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={uploadLoading}>
                          {uploadLoading ? "Uploading..." : "Upload Document"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {docsLoading ? (
                  <p className="text-center py-4 animate-pulse">Loading documents...</p>
                ) : documents.length === 0 ? (
                  <p className="text-center py-4 text-muted-foreground text-sm">No disciplinary documents uploaded yet.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{doc.title}</p>
                          <p className="text-[10px] text-muted-foreground">Uploaded by {doc.uploaded_by_name} on {new Date(doc.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <a href={doc.file} target="_blank" rel="noopener noreferrer">
                        <Badge variant="outline" className="cursor-pointer hover:bg-primary hover:text-white">View / Download</Badge>
                      </a>
                    </div>
                  ))
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
    </div>
  );
}
