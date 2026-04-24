import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Plus, MoreHorizontal, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

interface Issue {
  id: string; title: string; description: string; status: string;
  raised_by: string; reporter_name?: string; created_at: string;
  category: string; priority: string;
}

const statusColor = (s: string) => s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";

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
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Issues at Hand</h1>
          <p className="text-sm text-muted-foreground">Track issues raised by councillors.</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" disabled={filteredIssues.length === 0}>
                <FileText className="mr-1 h-4 w-4" /> Export Report
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Export Issues Report</DialogTitle>
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
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Raise Issue</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Raise New Issue</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Broken lab equipment" /></div>
                <div><Label>Description *</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the issue..." /></div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Infrastructure">Infrastructure</SelectItem>
                        <SelectItem value="Academic">Academic</SelectItem>
                        <SelectItem value="Welfare">Welfare</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority *</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleAdd} disabled={submitting} className="w-full">{submitting ? "Saving..." : "Raise Issue"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            <SelectItem value="Infrastructure">Infrastructure</SelectItem>
            <SelectItem value="Academic">Academic</SelectItem>
            <SelectItem value="Welfare">Welfare</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Priorities</SelectItem>
            <SelectItem value="Low">Low</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="High">High</SelectItem>
            <SelectItem value="Critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : issues.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No issues raised yet.</p>
      ) : filteredIssues.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No issues found matching your filters.</p>
      ) : (
        <div className="space-y-2">
          {filteredIssues.map((issue) => (
            <Card key={issue.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${issue.status === "resolved" ? "text-primary" : "text-gold"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{issue.title}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 mb-1">
                        <Badge variant="outline" className="text-[10px]">{issue.category}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{issue.priority}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{issue.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Raised by <span className="font-semibold text-foreground">{issue.reporter_name || "Unknown"}</span> • {new Date(issue.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant={statusColor(issue.status) as any} className="text-[10px]">{issue.status.replace("_", " ")}</Badge>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusUpdate(issue.id, "Open")}>Open</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(issue.id, "in_progress")}>In Progress</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusUpdate(issue.id, "resolved")}>Resolved</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <DocumentViewer 
        isOpen={!!previewUrl} 
        onClose={() => { if (previewUrl) URL.revokeObjectURL(previewUrl); setPreviewUrl(null); }} 
        fileUrl={previewUrl} 
        title={`Council Issues Report`} 
        type="pdf"
      />
    </div>
  );
}
