import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Download, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORIES = ["Constitution", "Minutes", "Finance", "Reports", "Plans", "Other"];

const catColor = (c: string) => {
  const map: Record<string, string> = { Constitution: "default", Minutes: "secondary", Finance: "outline", Reports: "default", Plans: "secondary" };
  return (map[c] || "outline") as any;
};

export default function DocumentsPage() {
  const { profile } = useAuth();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Other");
  const [file, setFile] = useState<File | null>(null);

  const fetchDocs = async () => {
    const { data } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
    setDocs(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleUpload = async () => {
    if (!file || !title || !profile) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}_${file.name}`;

    const { error: storageErr } = await supabase.storage.from("council-documents").upload(path, file);
    if (storageErr) { toast.error("Upload failed: " + storageErr.message); setUploading(false); return; }

    const { data: urlData } = supabase.storage.from("council-documents").getPublicUrl(path);

    const { error } = await supabase.from("documents").insert({
      title,
      category,
      file_url: urlData.publicUrl,
      uploaded_by: profile.full_name,
    });

    if (error) { toast.error(error.message); } else {
      toast.success("Document uploaded!");
      setOpen(false); setTitle(""); setCategory("Other"); setFile(null);
      fetchDocs();
    }
    setUploading(false);
  };

  const handleDownload = (url: string, title: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = title;
    a.click();
  };

  const filtered = docs.filter(d => d.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-foreground">Documents Archive</h1>
          <p className="mt-1 text-muted-foreground">All council documents, minutes, and reports.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="mr-2 h-4 w-4" /> Upload</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Term 1 Minutes" /></div>
              <div><Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>File (PDF, Image, Doc)</Label><Input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={e => setFile(e.target.files?.[0] || null)} /></div>
              <Button onClick={handleUpload} disabled={uploading || !file || !title} className="w-full">
                {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</> : "Upload Document"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search documents..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {loading ? <p className="text-muted-foreground text-center py-8">Loading...</p> :
         filtered.length === 0 ? <p className="text-muted-foreground text-center py-8">No documents found.</p> :
         filtered.map((doc) => (
          <Card key={doc.id} className="transition-all hover:shadow-sm">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-card-foreground">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">{doc.uploaded_by} • {new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={catColor(doc.category)}>{doc.category}</Badge>
                <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.file_url, doc.title)}>
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
