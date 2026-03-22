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
  id: string;
  title: string;
  category: string;
  description: string;
  status: string;
  submitted_by: string | null;
  submitted_class: string | null;
  file_url: string | null;
  comments: string | null;
  created_at: string;
}

const statusVariant = (s: string) =>
  s === "approved" ? "default" : s === "rejected" ? "destructive" : "secondary";

export default function StudentVoicesPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});

  const fetchVoices = async () => {
    const { data, error } = await supabase
      .from("student_voices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load submissions");
      console.error(error);
    } else {
      setVoices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVoices();

    const channel = supabase
      .channel("student-voices-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "student_voices" }, () => {
        fetchVoices();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleEvaluate = async (id: string, status: "approved" | "rejected") => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error("You must be logged in"); return; }

    const { error } = await supabase.from("student_voices").update({
      status,
      evaluated_by: user.id,
      comments: commentMap[id] || null,
    }).eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Submission ${status}`);
      setCommentMap((prev) => { const n = { ...prev }; delete n[id]; return n; });
    }
  };

  const filtered = voices.filter(
    (v) =>
      v.title.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase()) ||
      (v.submitted_by || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h1 className="font-serif text-2xl font-bold text-foreground">Student Voices</h1>
      <p className="mt-1 text-muted-foreground">Review and evaluate submissions from the student body.</p>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold">{voices.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-primary">{voices.filter(v => v.status === "approved").length}</p>
          <p className="text-xs text-muted-foreground">Approved</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-gold">{voices.filter(v => v.status === "pending").length}</p>
          <p className="text-xs text-muted-foreground">Pending</p>
        </CardContent></Card>
      </div>

      <div className="mt-4 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search submissions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="mt-8 text-center text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-8 text-center text-muted-foreground">No submissions found.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {filtered.map((v) => (
            <Card key={v.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline">{v.category}</Badge>
                    <CardTitle className="text-base">{v.title}</CardTitle>
                  </div>
                  <Badge variant={statusVariant(v.status)}>
                    {v.status === "approved" ? <CheckCircle className="mr-1 h-3 w-3" /> :
                     v.status === "rejected" ? <XCircle className="mr-1 h-3 w-3" /> :
                     <Clock className="mr-1 h-3 w-3" />}
                    {v.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{v.description}</p>

                {v.file_url && (
                  <a href={v.file_url} target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <ExternalLink className="h-3 w-3" /> View attachment
                  </a>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  By {v.submitted_by || "Anonymous"}{v.submitted_class ? ` (${v.submitted_class})` : ""} •{" "}
                  {new Date(v.created_at).toLocaleDateString("en-UG", { day: "numeric", month: "short", year: "numeric" })}
                </p>

                {v.comments && (
                  <p className="mt-2 rounded bg-muted px-3 py-2 text-xs text-muted-foreground italic">
                    <strong>Comment:</strong> {v.comments}
                  </p>
                )}

                {v.status === "pending" && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Add a comment (optional)..."
                      rows={2}
                      className="text-sm"
                      value={commentMap[v.id] || ""}
                      onChange={(e) => setCommentMap({ ...commentMap, [v.id]: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleEvaluate(v.id, "approved")}>
                        <CheckCircle className="mr-1 h-3 w-3" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEvaluate(v.id, "rejected")}>
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
