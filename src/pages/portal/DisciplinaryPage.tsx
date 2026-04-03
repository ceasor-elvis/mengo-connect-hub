import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Scale, Plus, AlertCircle, FileText, CheckCircle2, Clock, UserPlus, Send, ShieldCheck, User, Loader2, Download, ExternalLink, Archive, Eye, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import DocumentViewer from "@/components/portal/DocumentViewer";

interface DCCase {
  id: string;
  offender_name: string;
  category: string;
  description: string;
  status: 'Pending' | 'Active' | 'Forwarded' | 'Closed';
  reported_by: string;
  assigned_to_id: string | null;
  assigned_to_name: string | null;
  forwarded_to_office: string | null;
  created_at: string;
}

interface DCDoc {
  id: string;
  title: string;
  category: string;
  file_url: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  patron: "School Patron",
  chairperson: "Chairperson",
  speaker: "Speaker",
  general_secretary: "General Secretary",
  disciplinary_committee: "DP / Disciplinary Committee",
};

export default function DisciplinaryPage() {
  const { user, profile, isAbsoluteAdmin, hasAnyRole } = useAuth();
  const [cases, setCases] = useState<DCCase[]>([]);
  const [docs, setDocs] = useState<DCDoc[]>([]);
  const [councillors, setCouncillors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [offender, setOffender] = useState("");
  const [category, setCategory] = useState("Insubordination");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Upload Dialog state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocCat, setNewDocCat] = useState("Official Guidelines");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Viewer state
  const [viewerDoc, setViewerDoc] = useState<{ url: string; title: string } | null>(null);

  const canManage = isAbsoluteAdmin || hasAnyRole(["disciplinary_committee", "chairperson"]);

  const fetchCases = async () => {
    try {
      const { data } = await api.get("/dc-cases/");
      setCases(data.results || []);
    } catch (error) {
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  const fetchDocs = async () => {
    try {
      const { data } = await api.get("/dc-docs/");
      setDocs(data.results || []);
    } catch (error) {
      console.error("Failed to load DC documents", error);
    }
  };

  const fetchCouncillors = async () => {
    try {
      const { data } = await api.get("/users/councillors/");
      setCouncillors(data.results || []);
    } catch (error) {
      console.error("Failed to load councillors", error);
    }
  };

  useEffect(() => {
    fetchCases();
    fetchDocs();
    if (canManage) fetchCouncillors();
  }, [canManage]);

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

  const updateCase = async (id: string, updates: Partial<DCCase>) => {
    try {
      await api.patch(`/dc-cases/${id}/`, updates);
      toast.success("Case updated");
      fetchCases();
    } catch (error) {
      toast.error("Update failed");
    }
  };

  const handleTakeCase = (id: string) => {
    updateCase(id, {
      status: 'Active',
      assigned_to_id: user?.id,
      assigned_to_name: profile?.full_name || "Assigned Officer"
    });
  };

  const handleAssignCouncillor = (id: string, councillorId: string) => {
    const councillor = councillors.find(c => c.user_id === councillorId);
    if (!councillor) return;
    updateCase(id, {
      status: 'Active',
      assigned_to_id: councillorId,
      assigned_to_name: councillor.full_name
    });
  };

  const handleForwardToOffice = (id: string, office: string) => {
    updateCase(id, {
      status: 'Forwarded',
      forwarded_to_office: office
    });
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocTitle.trim()) return;
    setUploadingDoc(true);
    try {
      await api.post("/dc-docs/", {
        title: newDocTitle,
        category: newDocCat,
        file_url: "#" // Simulated
      });
      toast.success("Resource uploaded successfully");
      setNewDocTitle("");
      setSelectedFile(null);
      setIsUploadOpen(false);
      fetchDocs();
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploadingDoc(false);
    }
  };

  const downloadResource = (doc: DCDoc) => {
    const a = document.createElement("a");
    a.href = doc.file_url === "#" ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" : doc.file_url;
    a.download = doc.title;
    a.target = "_blank";
    a.click();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'Active': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'Forwarded': return <Send className="h-4 w-4 text-purple-500" />;
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
            Disciplinary Committee Portal
          </h1>
          <p className="text-muted-foreground text-sm">Official case oversight, assignment, and escalation.</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">Active & Pending</TabsTrigger>
          <TabsTrigger value="report">Report Case</TabsTrigger>
          <TabsTrigger value="docs">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-4">
            {loading ? (
              <p className="text-center py-8 animate-pulse italic">Loading DC session...</p>
            ) : cases.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No disciplinary cases on record.</CardContent></Card>
            ) : (
              cases.map((c) => (
                <Card key={c.id} className={`overflow-hidden border-l-4 ${c.status === 'Closed' ? 'border-l-green-500' : 'border-l-primary'}`}>
                  <CardHeader className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-0 bg-muted/20">
                    <div>
                      <CardTitle className="text-lg font-semibold">{c.offender_name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[9px] uppercase tracking-wider">{c.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">ID: #{c.id.slice(-4)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {c.forwarded_to_office && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] gap-1">
                          <ShieldCheck className="h-3 w-3" /> Fwd to {ROLE_LABELS[c.forwarded_to_office] || c.forwarded_to_office}
                        </Badge>
                      )}
                      <Badge variant="outline" className="flex items-center gap-1 bg-white">
                        {getStatusIcon(c.status)} {c.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <div>
                      <Label className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">incident description</Label>
                      <p className="text-sm leading-relaxed mt-1 text-balance">
                        {c.description}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t">
                      <div className="flex items-center gap-2">
                        {c.assigned_to_name ? (
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-50 border border-blue-100">
                            <User className="h-3 w-3 text-blue-600" />
                            <span className="text-xs font-medium text-blue-800">Assigned: {c.assigned_to_name}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Awaiting officer assignment
                          </span>
                        )}
                      </div>
                      
                      <div className="text-[10px] text-muted-foreground">
                        Opened: {new Date(c.created_at).toLocaleString()}
                      </div>
                    </div>

                    {canManage && c.status !== 'Closed' && (
                      <div className="flex flex-wrap gap-2 pt-3 border-t">
                        {!c.assigned_to_id ? (
                           <Button size="sm" variant="default" className="h-8 text-xs gap-1.5" onClick={() => handleTakeCase(c.id)}>
                             <UserPlus className="h-3.5 w-3.5" /> Take Case
                           </Button>
                        ) : null}

                        <Select onValueChange={(val) => handleAssignCouncillor(c.id, val)}>
                          <SelectTrigger className="h-8 text-xs w-[160px] bg-muted/50">
                            <SelectValue placeholder="Assign Councilor..." />
                          </SelectTrigger>
                          <SelectContent>
                            {councillors.map(council => (
                              <SelectItem key={council.user_id} value={council.user_id}>{council.full_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Select onValueChange={(val) => handleForwardToOffice(c.id, val)}>
                          <SelectTrigger className="h-8 text-xs w-[160px] bg-muted/50">
                            <SelectValue placeholder="Forward to Office..." />
                          </SelectTrigger>
                          <SelectContent>
                             <SelectItem value="chairperson">Chairperson</SelectItem>
                             <SelectItem value="patron">School Patron</SelectItem>
                             <SelectItem value="speaker">Speaker</SelectItem>
                             <SelectItem value="general_secretary">Gen Secretary</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="ml-auto flex gap-2">
                          <Button size="sm" variant="outline" className="h-8 text-xs hover:bg-green-50 hover:text-green-700" onClick={() => updateCase(c.id, { status: 'Closed' })}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Close Case
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader><CardTitle>DC Incident Report Form</CardTitle></CardHeader>
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
                        <SelectItem value="Disruption">Disruption</SelectItem>
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
                  <Label htmlFor="desc">Incident Details *</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what happened, including time and location..." rows={4} required />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} File Official Report
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-primary" />
                Case Documentation & Resources
              </CardTitle>
              {canManage && (
                <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="default" className="shadow-lg hover:scale-105 transition-transform">
                      <Plus className="h-4 w-4 mr-1" /> Add Resource
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Upload New DC Resource</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleUploadDoc} className="space-y-4 pt-4">
                      <div className="grid gap-2">
                        <Label htmlFor="doc-title">Document Title *</Label>
                        <Input id="doc-title" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} placeholder="e.g. Student Constitution" required />
                      </div>
                      <div className="grid gap-2">
                        <Label>Category</Label>
                        <Select value={newDocCat} onValueChange={setNewDocCat}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Official Guidelines">Official Guidelines</SelectItem>
                            <SelectItem value="Template">Template</SelectItem>
                            <SelectItem value="Constitution">Constitution</SelectItem>
                            <SelectItem value="Manual">Training Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>Select File</Label>
                        <Input 
                          type="file" 
                          className="hidden" 
                          ref={fileInputRef} 
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                        <div 
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer group
                            ${selectedFile ? 'border-primary bg-primary/5' : 'bg-muted/5 hover:bg-white hover:border-primary/50'}`}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {selectedFile ? (
                            <div className="space-y-2">
                               <CheckCircle2 className="h-8 w-8 mx-auto text-primary animate-bounce" />
                               <p className="text-sm font-bold text-primary truncate">{selectedFile.name}</p>
                               <Button variant="outline" size="sm" className="h-7 text-[10px] uppercase font-bold" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>Change File</Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                              <p className="text-xs text-muted-foreground group-hover:text-primary/70 font-semibold">Click to browse computer directory</p>
                              <p className="text-[10px] text-muted-foreground mt-1 opacity-60">PDF, DOCX, or Images supported</p>
                            </>
                          )}
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" disabled={uploadingDoc || !selectedFile} className="w-full">
                          {uploadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Publish Resource"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {docs.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground italic">No official documents uploaded yet.</p>
                ) : (
                  docs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-all hover:shadow-md group">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2.2 rounded-lg group-hover:bg-primary/20 transition-colors">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{doc.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground uppercase bg-slate-100 px-1.5 py-0.5 rounded">{doc.category}</span>
                            <span className="text-[10px] text-slate-400">•</span>
                            <span className="text-[10px] text-slate-400">Added {new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-primary hover:bg-primary/5 h-9 w-9" 
                          onClick={() => setViewerDoc({ 
                            url: doc.file_url === "#" ? "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" : doc.file_url, 
                            title: doc.title 
                          })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-medium" onClick={() => downloadResource(doc)}>
                          <Download className="h-3.5 w-3.5" /> Download
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DocumentViewer 
        isOpen={!!viewerDoc} 
        onClose={() => setViewerDoc(null)} 
        fileUrl={viewerDoc?.url || null} 
        title={viewerDoc?.title || ""} 
      />
    </div>
  );
}
