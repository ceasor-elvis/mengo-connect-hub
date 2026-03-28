import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useActivityLog } from "@/hooks/useActivityLog";
import { notifyAllCouncillors } from "@/hooks/useNotify";

interface Issue {
  id: string; title: string; description: string; status: string;
  raised_by: string; created_at: string;
}

const statusColor = (s: string) => s === "resolved" ? "default" : s === "in_progress" ? "secondary" : "outline";

export default function IssuesPage() {
  const { user } = useAuth();
  const { log } = useActivityLog();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    // In absence of websockets, we could poll, but let's just fetch once on mount for now
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
      });
      toast.success("Issue raised"); 
      log("raised an issue", "issues", title); 
      notifyAllCouncillors("New Issue", `"${title}" was raised`, "warning"); 
      setTitle(""); 
      setDescription(""); 
      setOpen(false);
      fetchIssues();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Error raising issue");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="font-serif text-xl font-bold text-foreground sm:text-2xl">Issues at Hand</h1>
          <p className="text-sm text-muted-foreground">Track issues raised by councillors.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" /> Raise Issue</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Raise New Issue</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Broken lab equipment" /></div>
              <div><Label>Description *</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="Describe the issue..." /></div>
              <Button onClick={handleAdd} disabled={submitting} className="w-full">{submitting ? "Saving..." : "Raise Issue"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : issues.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No issues raised yet.</p>
      ) : (
        <div className="space-y-2">
          {issues.map((issue) => (
            <Card key={issue.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 min-w-0 flex-1">
                    <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${issue.status === "resolved" ? "text-primary" : "text-gold"}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{issue.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{issue.description}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(issue.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusColor(issue.status) as any} className="text-[10px] shrink-0">{issue.status.replace("_", " ")}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
