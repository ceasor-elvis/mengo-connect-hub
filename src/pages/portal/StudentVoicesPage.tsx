import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, CheckCircle, Clock, Search, XCircle, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Voice {
  id: string; title: string; category: string; description: string; status: string;
  submitted_by: string | null; submitted_class: string | null; file_url: string | null;
  comments: string | null; created_at: string;
}

const statusVariant = (s: string) => s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

export default function StudentVoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const fetchVoices = async () => {
    const { data, error } = await supabase.from("student_voices").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("Failed to load"); console.error(error); }
    else setVoices(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchVoices();
    const channel = supabase.channel("sv-rt").on("postgres_changes", { event: "*", schema: "public", table: "student_voices" }, () => fetchVoices()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleEvaluate = async (id: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("Login required"); return; }
    const { error } = await supabase.from("student_voices").update({ status, evaluated_by: user.id, comments: commentMap[id] || null }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(`Submission ${status}`); setCommentMap(p => { const n = { ...p }; delete n[id]; return n; }); }
  };

  const filtered = voices.filter(v =>
    v.title.toLowerCase().includes(search.toLowerCase()) ||
    v.category.toLowerCase().includes(search.toLowerCase()) ||
    (v.submitted_by || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-xl font-bold sm:text-2xl">Student Voices</h1>
        <p className="text-sm text-muted-foreground">Review and evaluate submissions.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card><CardContent className="p-2 sm:p-3 text-center">
          <p className="text-xl font-bold sm:text-2xl">{voices.length}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="p-2 sm:p-3 text-center">
          <p className="text-xl font-bold text-primary sm:text-2xl">{voices.filter(v => v.status === "approved").length}</p>
          <p className="text-[10px] text-muted-foreground">Approved</p>
        </CardContent></Card>
        <Card><CardContent className="p-2 sm:p-3 text-center">
          <p className="text-xl font-bold text-gold sm:text-2xl">{voices.filter(v => v.status === "pending").length}</p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">No submissions found.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <Badge variant="outline" className="text-[10px]">{v.category}</Badge>
                    <span className="text-sm font-medium truncate">{v.title}</span>
                  </div>
                  <Badge variant={statusVariant(v.status)} className="text-[10px] shrink-0">{v.status}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{v.description}</p>
                {v.file_url && (
                  <a href={v.file_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[10px] text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> Attachment
                  </a>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">
                  {v.submitted_by || "Anonymous"}{v.submitted_class ? ` (${v.submitted_class})` : ""} •{" "}
                  {new Date(v.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                </p>
                {v.comments && (
                  <p className="mt-1.5 rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground italic">
                    <strong>Comment:</strong> {v.comments}
                  </p>
                )}
                {v.status === "pending" && (
                  <div className="mt-2 space-y-1.5">
                    <Textarea placeholder="Comment (optional)..." rows={2} className="text-xs" value={commentMap[v.id] || ""}
                      onChange={e => setCommentMap({ ...commentMap, [v.id]: e.target.value })} />
                    <div className="flex gap-2">
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleEvaluate(v.id, "approved")}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleEvaluate(v.id, "rejected")}>
                        <XCircle className="mr-1 h-3 w-3" /> Reject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
