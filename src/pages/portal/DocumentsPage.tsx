import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Constitution", "Minutes", "Finance", "Reports", "Plans", "Other"];
const catColor = (c: string) => {
  const m: Record<string, string> = { Constitution: "default", Minutes: "secondary", Finance: "outline", Reports: "default", Plans: "secondary" };
  return (m[c] || "outline") as any;
};

export default function DocumentsPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [file, setFile] = useState<File | null>(null);

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

  const handleUpload = async () => {
    if (!file || !title) return;
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("file", file);

      await api.post("/documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("Uploaded!");
      setOpen(false); 
      setTitle(""); 
      setCategory("Other"); 
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
              <div><Label>File</Label><Input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
              <Button onClick={handleUpload} disabled={uploading || !file || !title} className="w-full">
                {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search documents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-2">
        {loading ? <p className="text-center py-8 text-muted-foreground">Loading...</p> :
         filtered.length === 0 ? <p className="text-center py-8 text-muted-foreground">No documents found.</p> :
         filtered.map((doc) => (
          <Card key={doc.id}>
            <CardContent className="flex items-center justify-between p-3 gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-medium truncate">{doc.title}</p>
                  <p className="text-[10px] text-muted-foreground">{doc.uploaded_by} • {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Badge variant={catColor(doc.category)} className="text-[10px] hidden sm:inline-flex">{doc.category}</Badge>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(doc.file_url || doc.file, doc.title)}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
