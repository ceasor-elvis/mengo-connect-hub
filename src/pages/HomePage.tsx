import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageSquare, CheckCircle2, Users, Rocket, Clock, Quote, GraduationCap, School, BookOpen } from "lucide-react";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { WhoWeAre } from "@/components/CabinetSection";
import { TimelineSection } from "@/components/home/TimelineSection";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { motion, useScroll, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

/** Extract plain text from BlockNote JSON for list previews */
function extractExcerpt(content: string | any[] | null, maxChars = 160): string {
  if (!content) return '';
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return content.slice(0, maxChars);
      const text = parsed.map((b: any) => Array.isArray(b.content) ? b.content.map((c: any) => c.text || '').join('') : '').filter(Boolean).join(' ');
      return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
    } catch {
      const plainText = content.replace(/<[^>]*>/g, '');
      return plainText.length > maxChars ? plainText.slice(0, maxChars).trimEnd() + '…' : plainText;
    }
  }
  if (Array.isArray(content)) {
    const text = content.map((b: any) => Array.isArray(b.content) ? b.content.map((c: any) => c.text || '').join('') : '').filter(Boolean).join(' ');
    return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
  }
  return '';
}

function ScrollIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer"
      onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
    >
      <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-medium">Explore More</span>
      <div className="w-[1px] h-12 bg-gradient-to-b from-gold to-transparent" />
    </motion.div>
  );
}

function ChairpersonAddressSection({ config, chairpersonProfile }: { config: any, chairpersonProfile?: any }) {
  const quote = config?.chairperson_quote || "We represent student aspirations, protect welfare, and foster competent leadership. Our mandate is to serve with transparency, ensuring every single voice is valued.";
  const name = chairpersonProfile?.full_name || config?.chairperson_name || "Ssekandi Brian";
  const title = config?.chairperson_title || "Student Council Chairperson";
  
  // Calculate initials from name if not provided
  let initials = config?.chairperson_initials || "SB";
  if (chairpersonProfile?.full_name) {
    const parts = chairpersonProfile.full_name.split(' ');
    initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length-1][0]}` : parts[0][0];
  }
  
  const tenure = config?.chairperson_tenure || "Mengo Senior School · 2025/2026";
  const profilePic = chairpersonProfile?.profile_pic;

  return (
    <section className="bg-background py-16 md:py-20 border-y overflow-hidden relative">
      <div className="absolute inset-0 opacity-[0.015] bg-pattern pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-14">
          
          {/* Quote side */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex-1 text-left relative"
          >
            <Quote className="absolute -top-10 -left-6 w-20 h-20 text-primary/5 -z-10" />
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-4">
              Chairperson's Address
            </span>
            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-relaxed italic pr-4">
              "{quote}"
            </h2>
          </motion.div>

          {/* Signature/Avatar side */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex-shrink-0 flex items-center gap-4 bg-muted/30 border border-border/40 p-5 rounded-2xl md:w-80"
          >
            <div className={`relative w-14 h-14 rounded-full overflow-hidden border border-gold/40 flex-shrink-0 ${profilePic ? '' : 'bg-primary flex items-center justify-center text-white font-serif text-lg font-bold'}`}>
              {profilePic ? (
                <img src={profilePic} alt={name} className="w-full h-full object-cover" />
              ) : (
                initials.toUpperCase()
              )}
            </div>
            <div className="text-left">
              <p className="font-serif font-bold text-foreground text-base">{name}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{title}</p>
              <div className="h-px w-8 bg-gold/50 my-1.5" />
              <p className="text-[10px] text-muted-foreground font-medium">{tenure}</p>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}


function ImpactStatsSection({ data }: { data: any[] }) {
  const defaultStats = [
    { label: "Students Represented", value: "2,500+" },
    { label: "Issues Resolved", value: "150+" },
    { label: "Council Projects", value: "24+" },
    { label: "Years of Excellence", value: "100+" }
  ];

  const stats = defaultStats.map(ds => {
    const found = data.find(apiStat => apiStat.title === ds.label);
    return found ? { ...ds, value: found.value } : ds;
  });

  return (
    <section className="py-10 bg-[#0f0406] border-y border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-[0.02] pointer-events-none" />
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 divide-y lg:divide-y-0 lg:divide-x divide-white/10 text-center">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              className="py-4 lg:py-0 flex flex-col justify-center animate-none"
            >
              <span className="text-3xl md:text-4xl font-serif font-extrabold text-gold-light tracking-tight mb-1">
                {s.value}
              </span>
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/50 font-bold">
                {s.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BlogsPreviewSection() {
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const { data } = await api.get("/blogs/?limit=3&public=true");
        setBlogs(Array.isArray(data) ? data.slice(0, 3) : data.results?.slice(0, 3) || []);
      } catch (err) {
        console.error("Failed to load blogs", err);
      }
    };
    fetchBlogs();
  }, []);

  if (blogs.length === 0) return null;

  const featured = blogs[0];
  const others = blogs.slice(1);

  return (
    <section className="py-16 md:py-20 bg-background border-t border-border/40">
      <div className="container mx-auto px-6">
        
        {/* Header */}
        <div className="flex items-end justify-between mb-10 md:mb-12 border-b border-border/40 pb-4">
          <div className="text-left">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] block mb-2">Press & Media</span>
            <h2 className="text-2xl md:text-4xl font-serif font-black text-foreground tracking-tight">Latest Announcements</h2>
          </div>
          <Button className="group bg-primary hover:bg-primary/95 text-white rounded-full px-5 h-9 text-xs font-bold uppercase tracking-wider shadow-md" asChild>
            <Link to="/blog">
              View Press Room <ArrowRight className="ml-2 w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Magazine Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Featured Large Card */}
          {featured && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-7 group text-left"
            >
              <Link to={`/blog?blogId=${featured.id}`} className="block">
                <div className="relative overflow-hidden rounded-2xl aspect-[16/10] mb-4 bg-muted border border-border/30 shadow-sm">
                  <img
                    src={featured.media_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"}
                    alt={featured.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-all duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-primary text-white text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full">
                      Featured
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                    {featured.created_at ? new Date(featured.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent Update"}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                    {featured.title || 'Untitled Update'}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                    {extractExcerpt(featured.content, 200) || 'No description available.'}
                  </p>
                  <div className="inline-flex items-center text-primary font-bold text-xs pt-1 border-b border-transparent group-hover:border-primary transition-all">
                    Read Article <ArrowRight className="ml-1 w-3.5 h-3.5" />
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Right: Stacked Horizontal Cards */}
          {others.length > 0 && (
            <div className="lg:col-span-5 flex flex-col gap-6 md:gap-8 text-left">
              {others.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.1 * i }}
                  className="group border-b border-border/40 pb-6 last:border-0 last:pb-0"
                >
                  <Link to={`/blog?blogId=${post.id}`} className="flex gap-4 sm:gap-6 items-start">
                    <div className="relative overflow-hidden rounded-xl w-24 h-18 sm:w-36 sm:h-24 flex-shrink-0 bg-muted border border-border/30">
                      <img
                        src={post.media_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                        {post.created_at ? new Date(post.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent Update"}
                      </p>
                      <h4 className="text-sm sm:text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {post.title || 'Untitled Update'}
                      </h4>
                      <p className="text-muted-foreground text-xs leading-relaxed line-clamp-1 hidden sm:block">
                        {extractExcerpt(post.content, 90)}
                      </p>
                      <div className="inline-flex items-center text-primary font-bold text-[10px] pt-1">
                        Read Story <ArrowRight className="ml-0.5 w-3 h-3" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

        </div>

      </div>
    </section>
  );
}

// ─── Role ordering & labels ─────────────────────────────────────────────────
const BOARD_ROLE_ORDER: Record<string, number> = {
  patron: 0, chairperson: 1, vice_chairperson: 2, speaker: 3,
  deputy_speaker: 4, general_secretary: 5, assistant_general_secretary: 6,
  secretary_finance: 7, secretary_welfare: 8, secretary_health: 9,
  secretary_women_affairs: 10, secretary_publicity: 11, secretary_pwd: 12,
  electoral_commission: 13, councillor: 14, councillors: 14,
};
const BOARD_ROLE_LABELS: Record<string, string> = {
  patron: "Patron", chairperson: "Chairperson", vice_chairperson: "Vice Chairperson",
  speaker: "Speaker", deputy_speaker: "Deputy Speaker",
  general_secretary: "General Secretary", assistant_general_secretary: "Asst. Gen. Secretary",
  secretary_finance: "Secretary Finance", secretary_welfare: "Secretary Welfare",
  secretary_health: "Secretary Health", secretary_women_affairs: "Secretary Women Affairs",
  secretary_publicity: "Secretary Publicity", secretary_pwd: "Secretary PWD",
  electoral_commission: "Electoral Commission", councillor: "Councillor", councillors: "Councillor",
};
function fmtRole(r: string) {
  return BOARD_ROLE_LABELS[r] || r.split("_").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function BoardMiniCard({ m, size = "md", delay = 0, highlight = false }: { m: any; size?: "sm" | "md" | "lg"; delay?: number; highlight?: boolean }) {
  const initial = m.full_name ? m.full_name[0].toUpperCase() : "?";
  const avatarCls = size === "lg" ? "w-24 h-24 sm:w-28 sm:h-28" : size === "md" ? "w-16 h-16 sm:w-20 sm:h-20" : "w-12 h-12 sm:w-14 sm:h-14";
  const nameCls  = size === "lg" ? "text-sm sm:text-base font-extrabold" : size === "md" ? "text-xs font-bold" : "text-[10px] font-semibold";
  const roleCls  = size === "lg" ? "text-[10px] sm:text-xs" : "text-[8px] sm:text-[9px]";

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center text-center group cursor-pointer"
    >
      <div className="relative">
        {highlight && <div className="absolute inset-0 rounded-full bg-gold/30 blur-xl scale-125 animate-pulse pointer-events-none" />}
        <div className={`relative rounded-full overflow-hidden border-4 ${
          highlight ? "border-gold shadow-[0_0_24px_rgba(212,175,55,0.5)]" : "border-white/80 dark:border-white/20"
        } shadow-xl mx-auto ${avatarCls} transition-transform duration-300 group-hover:scale-110 group-hover:shadow-2xl`}>
          {m.profile_pic ? (
            <img src={m.profile_pic} alt={m.full_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold font-serif text-xl">
              {initial}
            </div>
          )}
          {/* hover overlay hint */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-[8px] font-bold uppercase tracking-wider">View</span>
          </div>
        </div>
      </div>
      <div className="mt-2 space-y-0.5">
        <p className={`text-foreground leading-tight group-hover:text-primary transition-colors ${nameCls}`}>{m.full_name}</p>
        {size !== "sm" && m.student_class && (
          <p className="text-[9px] text-muted-foreground">{m.student_class} · {m.stream}</p>
        )}
        <span className={`inline-block mt-0.5 px-2 py-0.5 rounded ${
          highlight ? "bg-gold/20 text-yellow-700 dark:text-yellow-300 font-bold" : "bg-primary/10 text-primary font-semibold"
        } ${roleCls} uppercase tracking-wider`}>
          {fmtRole(m.role)}
        </span>
      </div>
    </motion.div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{card}</DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-2xl rounded-3xl bg-background/80 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Hero banner */}
          <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-maroon-dark overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.3),transparent)]" />
          </div>

          {/* Avatar overlapping banner */}
          <div className="relative px-6 pb-6">
            <div className="-mt-14 mb-4 flex items-end justify-between">
              <div className="relative">
                <div className={`relative w-24 h-24 rounded-full overflow-hidden border-4 ${
                  highlight ? "border-gold shadow-[0_0_20px_rgba(212,175,55,0.5)]" : "border-white"
                } shadow-xl`}>
                  {m.profile_pic ? (
                    <img src={m.profile_pic} alt={m.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold font-serif text-3xl">
                      {initial}
                    </div>
                  )}
                </div>
              </div>
              {/* Active badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Active Officer</span>
              </div>
            </div>

            {/* Name + role */}
            <div className="mb-5">
              <h2 className="font-serif text-2xl font-black text-foreground leading-tight mb-1">{m.full_name}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                highlight
                  ? "bg-gold/20 text-yellow-700 dark:text-yellow-300 border border-gold/30"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}>
                {fmtRole(m.role)}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-muted/40 border border-border/50 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Class</span>
                </div>
                <p className="font-bold text-sm text-foreground">{m.student_class || "—"}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <School className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Stream</span>
                </div>
                <p className="font-bold text-sm text-foreground">{m.stream || "—"}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-muted/30 border border-border/40 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">About</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {m.bio || "No biography provided. Dedicated to serving the students of Mengo Senior School with integrity and commitment."}
              </p>
            </div>

            {/* Footer ref */}
            <p className="mt-4 text-[9px] text-muted-foreground/40 text-center font-mono">
              MSS-COUNCIL · {m.full_name?.replace(/\s+/g, "-").toUpperCase()}
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function CouncilBoardPreviewWrapper({ config }: { config: any }) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/users/all-profiles/")
      .then(({ data }) => {
        const all: any[] = Array.isArray(data) ? data : [];
        const filtered = all
          .filter(p => p.role && p.role !== "adminabsolute")
          .sort((a, b) => (BOARD_ROLE_ORDER[a.role] ?? 99) - (BOARD_ROLE_ORDER[b.role] ?? 99));
        setMembers(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const chair = members.find(m => m.role === "chairperson");

  return (
    <>
      <ChairpersonAddressSection config={config} chairpersonProfile={chair} />
      <CouncilBoardPreview members={members} loading={loading} />
    </>
  );
}

function CouncilBoardPreview({ members, loading }: { members: any[], loading: boolean }) {

  const chair      = members.find(m => m.role === "chairperson");
  const viceChair  = members.find(m => m.role === "vice_chairperson");
  const speaker    = members.find(m => m.role === "speaker");
  const top3       = [viceChair, chair, speaker].filter(Boolean);
  const secondary  = members.filter(m => !["chairperson","vice_chairperson","speaker","adminabsolute"].includes(m.role) && !(["councillor","councillors"].includes(m.role))).slice(0, 8);
  const councillors = members.filter(m => ["councillor","councillors"].includes(m.role)).slice(0, 8);
  const isEmpty = !loading && members.length === 0;

  return (
    <section className="bg-gradient-to-b from-background via-primary/[0.03] to-background py-14 md:py-20 overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 max-w-2xl mx-auto"
        >
          <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none mb-2 text-[10px] uppercase tracking-widest">
            Meet the Team
          </Badge>
          <h2 className="font-serif text-2xl md:text-4xl font-bold text-primary mb-3 leading-tight">
            Our Council Leadership
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-10 bg-primary/20" />
            <p className="text-muted-foreground text-sm">Serving with integrity and dedication</p>
            <div className="h-px w-10 bg-primary/20" />
          </div>
        </motion.div>

        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Council members will appear here once registered.</p>
          </div>
        )}

        {!loading && !isEmpty && (
          <>
            {/* ── TOP 3 LEADERSHIP ───────────────────────────────── */}
            {top3.length > 0 && (
              <div className="flex flex-wrap justify-center items-end gap-8 sm:gap-14 mb-10">
                {viceChair && <BoardMiniCard m={viceChair} size="md" delay={0.1} />}
                {chair     && <BoardMiniCard m={chair}     size="lg" delay={0}   highlight />}
                {speaker   && <BoardMiniCard m={speaker}   size="md" delay={0.2} />}
              </div>
            )}

            {/* Divider */}
            {secondary.length > 0 && (
              <div className="flex items-center gap-4 mb-8">
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/40 px-2">Secretariat</span>
                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              </div>
            )}

            {/* ── SECRETARIAT ROW ─────────────────────────────────── */}
            {secondary.length > 0 && (
              <div className="flex flex-wrap justify-center gap-5 sm:gap-7 mb-10">
                {secondary.map((m, i) => (
                  <BoardMiniCard key={m.user_id} m={m} size="sm" delay={i * 0.06} />
                ))}
              </div>
            )}

            {/* Councillors */}
            {councillors.length > 0 && (
              <>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary/40 px-2">Councillors</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                </div>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
                  {councillors.map((m, i) => (
                    <BoardMiniCard key={m.user_id} m={m} size="sm" delay={i * 0.05} />
                  ))}
                </div>
              </>
            )}

            {/* ── VIEW ALL CTA ─────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex justify-center mt-6"
            >
              <Button
                asChild
                className="group bg-primary hover:bg-primary/90 text-white px-8 py-5 text-sm font-bold uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 transition-all duration-300 hover:shadow-primary/40 hover:scale-105"
              >
                <Link to="/council-board">
                  View Full Council Board
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}

const slideshowImages = [
  "/slideshow/2025-02-08.webp",
  "/slideshow/2025-02-09.webp",
  "/slideshow/476063854_17890842204176339_398022608816591784_n.jpeg",
  "/slideshow/G1_ifQeXkAAGhfW.jpg",
  "/slideshow/G_20CA8XwAA27xu.jpg",
  "/slideshow/GmeokXxaQAA_GLK.jpg",
  "/slideshow/HDSX4TkW8AAxy9L.jpg",
  "/slideshow/HF9ljg7X0AAXzSb.jpg",
  "/slideshow/maxresdefault.jpg"
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } }
};

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeSlides, setActiveSlides] = useState<string[]>(slideshowImages);
  const [homeStats, setHomeStats] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data } = await api.get("/council-config/");
        setConfig(data);
      } catch (err) {
        console.error("Failed to load council config", err);
      }
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/home-stats/");
        setHomeStats(Array.isArray(data) ? data : data.results || []);
      } catch (err) {
        console.error("Failed to load home stats", err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const fetchCustomSlides = async () => {
      try {
        const { data } = await api.get("/home-layouts/");
        const entries = Array.isArray(data) ? data : data.results || [];
        const customSlides = entries
          .map((d: any) => d.file_url || d.file)
          .filter(Boolean);

        if (customSlides.length > 0) {
          setActiveSlides(customSlides);
          setCurrentImageIndex(0);
        }
      } catch (err) {
        console.error("Failed to load custom slides", err);
      }
    };
    fetchCustomSlides();
  }, []);

  useEffect(() => {
    if (activeSlides.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % activeSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlides]);

  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <div className="relative bg-background">
      {/* ── HERO SECTION ────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] lg:min-h-[90vh] flex items-center bg-[#130709] border-b border-white/5 overflow-hidden pt-24 pb-16 lg:py-0">
        {/* Dynamic decorative radial gold glow */}
        <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 blur-[130px] rounded-full pointer-events-none" />
        {/* Maroon radial glow */}
        <div className="absolute -top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] bg-pattern pointer-events-none" />

        <div className="relative z-10 container mx-auto px-6 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Text & Brand Column */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="lg:col-span-7 flex flex-col text-left space-y-6"
            >
              {/* EST. 1895 Badge & School Crest Group */}
              <motion.div variants={itemVariants} className="flex items-center gap-3">
                <div className="relative inline-block">
                  <motion.img
                    whileHover={{ scale: 1.08, rotate: 3 }}
                    src={mengoBadge}
                    alt="Mengo Badge"
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full border border-gold/40 object-cover shadow-lg"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gold uppercase tracking-[0.25em] font-serif">Mengo Senior School</span>
                  <span className="text-[8px] text-white/50 uppercase tracking-[0.15em] font-semibold mt-0.5">Established 1895</span>
                </div>
              </motion.div>

              {/* Editorial Header */}
              <motion.div variants={itemVariants}>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.05] drop-shadow-md">
                  The Official Voice of <br />
                  <span className="bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">Mengo Students</span>
                </h1>
              </motion.div>

              {/* Sub-paragraph */}
              <motion.p 
                variants={itemVariants}
                className="max-w-xl text-white/70 text-sm sm:text-base leading-relaxed font-light"
              >
                Pioneering excellence for over a century. We represent student aspirations, protect welfare, and foster competent leadership under our time-tested constitution.
              </motion.p>

              {/* Motto quote */}
              <motion.div 
                variants={itemVariants}
                className="flex items-center gap-3 border-l border-gold/40 pl-4 py-1"
              >
                <span className="text-[10px] sm:text-xs font-bold text-gold/80 tracking-[0.2em] uppercase font-serif">
                  "Akwana Akira Ayomba"
                </span>
              </motion.div>

              {/* Elegant CTAs */}
              <motion.div 
                variants={itemVariants}
                className="pt-4 flex flex-wrap gap-4"
              >
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button className="px-6 py-5 text-xs font-bold uppercase tracking-widest bg-gold text-gold-foreground hover:bg-gold/90 transition-all rounded-lg shadow-xl shadow-gold/10" asChild>
                    <Link to="/student-voice">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Submit Voice
                    </Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button className="px-6 py-5 text-xs font-bold uppercase tracking-widest bg-[#800000] text-white hover:bg-[#800000]/90 transition-all rounded-lg shadow-xl" asChild>
                    <Link to="/council-board">
                      View Board
                    </Link>
                  </Button>
                </motion.div>
              </motion.div>
            </motion.div>

            {/* Premium Slideshow Frame Column */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              className="lg:col-span-5 relative w-full aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black/40"
            >
              {/* Slideshow image transitions */}
              {activeSlides.map((img, index) => (
                <motion.div
                  key={`${img}-${index}`}
                  style={{ backgroundImage: `url('${img}')` }}
                  className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-[2000ms] ease-in-out ${
                    index === currentImageIndex ? "opacity-100 scale-105" : "opacity-0 scale-100"
                  }`}
                />
              ))}

              {/* Shadow vignette gradients overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

              {/* Caption Overlay */}
              <div className="absolute bottom-6 left-6 right-6 text-left">
                <span className="text-gold text-[9px] uppercase tracking-widest font-black block mb-1">MCH Media Gallery</span>
                <p className="text-white/60 text-[10px] font-light italic">
                  Leading by example. Captured moments of student initiatives & assembly representations.
                </p>
              </div>

              {/* Subtle slideshow page indicators */}
              <div className="absolute top-6 right-6 flex gap-1.5 z-20">
                {activeSlides.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-1 rounded-full transition-all duration-300 ${
                      i === currentImageIndex ? "w-4 bg-gold" : "w-1 bg-white/30"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

          </div>
        </div>

        <ScrollIndicator />
      </section>

      <ImpactStatsSection data={homeStats} />
      
      {/* Fetch members at page level so we can pass chairperson */}
      <CouncilBoardPreviewWrapper config={config} />

      <WhoWeAre />

      <BlogsPreviewSection />
      <TimelineSection />

      {/* CTA — compact */}
      <section className="bg-primary py-12 md:py-16 overflow-hidden relative">
        <div className="absolute inset-0 bg-hero-gradient opacity-90" />
        <div className="absolute inset-0 bg-pattern opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="container mx-auto px-4 text-center relative z-10"
        >
          <div className="max-w-xl mx-auto p-8 rounded-2xl glass">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-4">Your Voice Matters</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-white/80 font-light mb-6">
              Every idea counts. Submit yours today.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Button className="bg-gold text-gold-foreground hover:bg-gold-light px-8 py-5 text-base font-bold uppercase tracking-widest rounded-lg shadow-xl" asChild>
                <Link to="/student-voice">Submit Voice Now</Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
