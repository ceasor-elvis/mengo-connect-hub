import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Trash2, Image as ImageIcon, Loader2, Upload,
  Users, CheckCircle2, Rocket, Save, BarChart3, Pencil,
} from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";

interface BackgroundImage { id: string; title: string; file_url: string; }
interface StatItem { id?: string; title: string; description: string; }

const STAT_DEFINITIONS = [
  { key: "Students Represented", icon: Users,        placeholder: "e.g. 2,500+", color: "from-blue-500/10 to-blue-600/5",    accent: "text-blue-600",    border: "border-blue-200"   },
  { key: "Issues Resolved",      icon: CheckCircle2, placeholder: "e.g. 150+",   color: "from-emerald-500/10 to-emerald-600/5", accent: "text-emerald-600", border: "border-emerald-200"},
  { key: "Council Projects",     icon: Rocket,       placeholder: "e.g. 24+",    color: "from-amber-500/10 to-amber-600/5",  accent: "text-amber-600",   border: "border-amber-200"  },
];

export default function HomeLayoutPage() {
  const [images,       setImages]       = useState<BackgroundImage[]>([]);
  const [stats,        setStats]        = useState<StatItem[]>(STAT_DEFINITIONS.map(d => ({ title: d.key, description: "" })));
  const [statsLoading, setStatsLoading] = useState(true);
  const [savingStats,  setSavingStats]  = useState(false);
  const [imgLoading,   setImgLoading]   = useState(true);
  const [uploading,    setUploading]    = useState(false);
  const { log } = useActivityLog();

  /* ── Stats ─────────────────────────── */
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const { data } = await api.get("/documents/?category=home_stats");
      const items: any[] = Array.isArray(data) ? data : data.results || [];
      setStats(STAT_DEFINITIONS.map(def => {
        const found = items.find(i => i.title === def.key);
        return found ? { id: found.id, title: def.key, description: found.description ?? "" } : { title: def.key, description: "" };
      }));
    } catch { /* keep defaults */ }
    finally { setStatsLoading(false); }
  };

  const handleStatChange = (i: number, val: string) => {
    const next = [...stats]; next[i] = { ...next[i], description: val }; setStats(next);
  };

  const handleSaveStats = async () => {
    setSavingStats(true);
    try {
      for (const stat of stats) {
        if (!stat.id) {
          const fd = new FormData();
          fd.append("title", stat.title); fd.append("description", stat.description); fd.append("category", "home_stats");
          fd.append("file", new Blob(["stat"], { type: "text/plain" }), "stat.txt");
          await api.post("/documents/", fd, { headers: { "Content-Type": "multipart/form-data" } });
        } else {
          await api.patch(`/documents/${stat.id}/`, { description: stat.description });
        }
      }
      toast.success("Statistics saved! The home page will update immediately.");
      log("updated homepage statistics", "layout");
      fetchStats();
    } catch { toast.error("Failed to save statistics — please try again."); }
    finally { setSavingStats(false); }
  };

  /* ── Images ─────────────────────────── */
  const fetchImages = async () => {
    try {
      const { data } = await api.get("/home-layouts/");
      setImages(Array.isArray(data) ? data : data.results || []);
    } catch { toast.error("Failed to load background images"); }
    finally { setImgLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    setUploading(true);
    const fd = new FormData(); fd.append("file", file); fd.append("title", "slideshow_img");
    try {
      await api.post("/home-layouts/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Background uploaded!"); log("uploaded a new homepage background", "layout"); fetchImages();
    } catch { toast.error("Failed to upload image"); }
    finally { setUploading(false); }
  };

  const handleDelete = async (id: string) => {
    try { await api.delete(`/home-layouts/${id}/`); toast.success("Image removed"); log("removed a homepage background", "layout"); fetchImages(); }
    catch { toast.error("Failed to delete image"); }
  };

  useEffect(() => { fetchImages(); fetchStats(); }, []);

  /* ── Render ─────────────────────────── */
  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-12">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary sm:text-3xl">Home Layout Manager</h1>
        <p className="text-sm text-muted-foreground mt-1">Control what visitors see on the public landing page.</p>
      </div>

      {/* ── SECTION 1: STATS (first!) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-none">Impact Statistics</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Shown live on the home page hero section</p>
            </div>
          </div>
          <Button id="save-stats-btn" onClick={handleSaveStats} disabled={savingStats || statsLoading} className="gap-2 rounded-xl">
            {savingStats ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingStats ? "Saving…" : "Save Changes"}
          </Button>
        </div>

        {statsLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STAT_DEFINITIONS.map((def, i) => {
              const Icon = def.icon;
              const stat = stats[i];
              return (
                <Card key={def.key} className={`border-0 shadow-sm bg-gradient-to-br ${def.color} relative overflow-hidden`}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`h-8 w-8 rounded-lg border ${def.border} bg-white/70 flex items-center justify-center`}>
                        <Icon className={`h-4 w-4 ${def.accent}`} />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{def.key}</span>
                    </div>
                    <div className={`text-3xl font-serif font-bold mb-3 ${def.accent}`}>
                      {stat?.description || <span className="text-muted-foreground/40 italic text-base font-normal">Not set</span>}
                    </div>
                    <div className="relative">
                      <Pencil className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/50" />
                      <Input
                        id={`stat-input-${i}`}
                        value={stat?.description ?? ""}
                        onChange={(e) => handleStatChange(i, e.target.value)}
                        placeholder={def.placeholder}
                        className="pl-8 h-9 text-sm bg-white/60 border-white/80 focus-visible:ring-primary/30"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Click <strong>Save Changes</strong> to push updates live to the public landing page.
        </p>
      </section>

      {/* ── SECTION 2: SLIDESHOW IMAGES ── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">Slideshow Backgrounds</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Images cycle automatically behind the hero section</p>
          </div>
        </div>

        <Card className="border-primary/10 shadow-sm overflow-hidden mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-xl p-10 bg-muted/30 hover:bg-muted/50 transition-colors">
              <input type="file" id="bg-upload" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={uploading} />
              <Label htmlFor="bg-upload" className={`flex flex-col items-center gap-4 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <Upload className="h-8 w-8 text-primary" />}
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{uploading ? "Uploading…" : "Click to upload image"}</p>
                  <p className="text-sm text-muted-foreground">Recommended: 1920×1080 landscape photos</p>
                </div>
              </Label>
            </div>
          </CardContent>
        </Card>

        {imgLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : images.length === 0 ? (
          <Card className="border-dashed py-14 text-center text-muted-foreground italic text-sm">
            No custom backgrounds yet — default school photos are active.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {images.map((img) => (
              <Card key={img.id} className="group overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="aspect-video relative overflow-hidden">
                  <img src={img.file_url} alt="Background" className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(img.id)} className="h-10 w-10">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3 bg-card border-t flex justify-between items-center">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{String(img.id).split("-")[0]}</span>
                  <p className="text-xs font-bold text-primary">Active in Slideshow</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
