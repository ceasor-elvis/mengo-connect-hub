import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  id: string;
  user_id: string;
  action: string;
  module: string;
  details: string | null;
  created_at: string;
  profile?: { full_name: string };
}

const MODULE_COLORS: Record<string, string> = {
  issues: "bg-accent/20 text-accent-foreground",
  programmes: "bg-primary/10 text-primary",
  requisitions: "bg-accent/20 text-accent-foreground",
  rota: "bg-primary/10 text-primary",
  documents: "bg-muted text-muted-foreground",
  elections: "bg-primary/10 text-primary",
  voices: "bg-accent/20 text-accent-foreground",
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/activity-logs/", { params: { limit: 200 } });
        
        // Assuming Django API returns an array, or an object with 'results' array (pagination)
        const entries = Array.isArray(data) ? data : data.results || [];
        
        // Normally Django serializers can directly embed profile info (e.g., `user__full_name`)
        // If not, we map it, but we assume the API provides `profile.full_name` or `full_name` directly
        setLogs(entries.map((l: any) => ({
          ...l,
          profile: l.profile || { full_name: l.user_full_name || l.user_id || "Unknown" },
        })));
      } catch (error) {
        console.error("Failed to fetch activity logs", error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const modules = [...new Set(logs.map((l) => l.module))];

  const filtered = logs.filter((l) => {
    if (moduleFilter !== "all" && l.module !== moduleFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        l.action.toLowerCase().includes(s) ||
        l.module.toLowerCase().includes(s) ||
        l.details?.toLowerCase().includes(s) ||
        l.profile?.full_name.toLowerCase().includes(s)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-xl font-bold sm:text-2xl flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" /> Activity Logs
        </h1>
        <p className="text-xs text-muted-foreground">Monitor councillor activities across all modules</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Select value={moduleFilter} onValueChange={setModuleFilter}>
          <SelectTrigger className="w-full sm:w-40 h-9 text-sm">
            <SelectValue placeholder="All modules" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All modules</SelectItem>
            {modules.map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6">
          <CardTitle className="text-sm">{filtered.length} log entries</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {loading ? (
            <p className="text-sm text-muted-foreground animate-pulse py-4 text-center">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No activity logs found</p>
          ) : (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-1.5">
                {filtered.map((l) => (
                  <div key={l.id} className="flex items-start gap-2 rounded-lg border p-2">
                    <Badge variant="outline" className={`text-[9px] mt-0.5 shrink-0 ${MODULE_COLORS[l.module] || "bg-muted text-muted-foreground"}`}>
                      {l.module}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs">
                        <span className="font-medium">{l.profile?.full_name}</span>{" "}
                        <span className="text-muted-foreground">{l.action}</span>
                      </p>
                      {l.details && <p className="text-[10px] text-muted-foreground truncate">{l.details}</p>}
                      <p className="text-[9px] text-muted-foreground">
                        {formatDistanceToNow(new Date(l.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
