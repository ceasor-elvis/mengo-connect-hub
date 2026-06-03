import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Crown, GraduationCap, School, BookOpen } from "lucide-react";

// ─── Role priority for display ordering ─────────────────────────────────────
const ROLE_ORDER: Record<string, number> = {
  patron: 0,
  chairperson: 1,
  vice_chairperson: 2,
  speaker: 3,
  deputy_speaker: 4,
  general_secretary: 5,
  assistant_general_secretary: 6,
  secretary_finance: 7,
  secretary_welfare: 8,
  secretary_health: 9,
  secretary_women_affairs: 10,
  secretary_publicity: 11,
  secretary_pwd: 12,
  electoral_commission: 13,
  councillor: 14,
  councillors: 14,
};

const ROLE_LABELS: Record<string, string> = {
  patron: "Patron",
  chairperson: "Chairperson",
  vice_chairperson: "Vice Chairperson",
  speaker: "Speaker",
  deputy_speaker: "Deputy Speaker",
  general_secretary: "General Secretary",
  assistant_general_secretary: "Asst. General Secretary",
  secretary_finance: "Secretary Finance",
  secretary_welfare: "Secretary Welfare",
  secretary_health: "Secretary Health",
  secretary_women_affairs: "Secretary Women Affairs",
  secretary_publicity: "Secretary Publicity",
  secretary_pwd: "Secretary PWD",
  electoral_commission: "Electoral Commission",
  councillor: "Councillor",
  councillors: "Councillor",
  adminabsolute: "Administrator",
};

function formatRole(role: string): string {
  if (!role) return "Member";
  if (ROLE_LABELS[role]) return ROLE_LABELS[role];
  return role.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    sm: "w-16 h-16 text-lg",
    md: "w-24 h-24 text-2xl",
    lg: "w-28 h-28 text-3xl",
    xl: "w-36 h-36 text-4xl",
  };

  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`${sizeClasses[size]} rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto flex-shrink-0 relative`}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary to-maroon-dark flex items-center justify-center text-white font-bold font-serif">
          {initial}
        </div>
      )}
    </div>
  );
}

function MemberCard({
  member,
  size = "md",
  delay = 0,
  highlight = false,
}: {
  member: any;
  size?: "sm" | "md" | "lg" | "xl";
  delay?: number;
  highlight?: boolean;
}) {
  const role = member.role || "member";
  const label = formatRole(role);
  const initial = member.full_name ? member.full_name.charAt(0).toUpperCase() : "?";

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col items-center text-center group cursor-pointer ${highlight ? "relative" : ""}`}
    >
      <div className="relative">
        {highlight && (
          <div className="absolute inset-0 rounded-full bg-gold/30 blur-xl scale-125 animate-pulse pointer-events-none" />
        )}
        <div
          className={`relative rounded-full transition-transform duration-300 group-hover:scale-105 ${
            highlight ? "ring-4 ring-gold ring-offset-2 ring-offset-transparent" : ""
          }`}
        >
          <Avatar src={member.profile_pic} name={member.full_name} size={size} />
          {/* hover overlay hint */}
          <div className="absolute inset-0 bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-[8px] font-bold uppercase tracking-wider">View</span>
          </div>
        </div>
        {highlight && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gold text-black rounded-full p-1 shadow-lg shadow-gold/40 z-10">
            <Crown className="w-3 h-3" />
          </div>
        )}
      </div>
      <div className="mt-2">
        <p className="font-serif font-bold text-white text-sm sm:text-base leading-tight group-hover:text-gold transition-colors">
          {member.full_name}
        </p>
        {member.student_class && member.stream && (
          <p className="text-[10px] text-white/60 font-medium mt-0.5">
            {member.student_class} · {member.stream}
          </p>
        )}
        <div
          className={`mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-block ${
            highlight
              ? "bg-gold text-black"
              : "bg-white/15 text-white/90"
          }`}
        >
          {label}
        </div>
        {member.bio && (
          <p className="text-[9px] text-white/50 mt-1 max-w-[120px] leading-relaxed line-clamp-2">
            {member.bio}
          </p>
        )}
      </div>
    </motion.div>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>{card}</DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-2xl rounded-3xl bg-background/95 backdrop-blur-2xl text-foreground">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Hero banner */}
          <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-maroon-dark overflow-hidden">
            <div className="absolute inset-0 bg-pattern opacity-10" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.3),transparent)]" />
            {highlight && (
              <div className="absolute top-4 right-4 bg-gold/20 border border-gold/40 text-gold text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-sm">
                ★ Executive
              </div>
            )}
          </div>

          {/* Avatar overlapping banner */}
          <div className="relative px-6 pb-6">
            <div className="-mt-14 mb-4 flex items-end justify-between">
              <div className="relative">
                {highlight && <div className="absolute inset-0 rounded-full bg-gold/40 blur-lg scale-110" />}
                <div className={`relative w-24 h-24 rounded-full overflow-hidden border-4 ${
                  highlight ? "border-gold shadow-[0_0_20px_rgba(212,175,55,0.5)]" : "border-white"
                } shadow-xl`}>
                  {member.profile_pic ? (
                    <img src={member.profile_pic} alt={member.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold font-serif text-3xl">
                      {initial}
                    </div>
                  )}
                </div>
                {highlight && (
                  <div className="absolute -top-1 -right-1 bg-gold text-black rounded-full p-1.5 shadow-lg z-10">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              {/* Active badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Active Officer</span>
              </div>
            </div>

            {/* Name + role */}
            <div className="mb-5 text-left">
              <h2 className="font-serif text-2xl font-black text-foreground leading-tight mb-1">{member.full_name}</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                highlight
                  ? "bg-gold/20 text-yellow-700 dark:text-yellow-300 border border-gold/30"
                  : "bg-primary/10 text-primary border border-primary/20"
              }`}>
                {highlight && <Crown className="w-3 h-3" />}
                {label}
              </span>
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 mb-5 text-left">
              <div className="bg-muted/40 border border-border/50 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Class</span>
                </div>
                <p className="font-bold text-sm text-foreground">{member.student_class || "—"}</p>
              </div>
              <div className="bg-muted/40 border border-border/50 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                  <School className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Stream</span>
                </div>
                <p className="font-bold text-sm text-foreground">{member.stream || "—"}</p>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 text-left">
              <div className="flex items-center gap-1.5 text-muted-foreground mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">About</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed italic">
                {member.bio || "No biography provided. Dedicated to serving the students of Mengo Senior School with integrity and commitment."}
              </p>
            </div>

            {/* Footer ref */}
            <p className="mt-4 text-[9px] text-muted-foreground/40 text-center font-mono">
              MSS-COUNCIL · {member.full_name?.replace(/\s+/g, "-").toUpperCase()}
            </p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Top-tier roles to display prominently ───────────────────────────────────
const LEADERSHIP_ROLES = [
  "chairperson",
  "vice_chairperson",
  "speaker",
  "deputy_speaker",
];
const SECRETARIAT_ROLES = [
  "general_secretary",
  "assistant_general_secretary",
  "secretary_finance",
  "secretary_welfare",
  "secretary_health",
  "secretary_women_affairs",
  "secretary_publicity",
  "secretary_pwd",
];
const COMMISSION_ROLES = ["electoral_commission"];
const COUNCILLOR_ROLES = ["councillor", "councillors"];
const PATRON_ROLES = ["patron", "adminabsolute"];

export default function CouncilBoardPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [config, setConfig] = useState<{ org_name?: string; slogan?: string }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/users/all-profiles/").catch(() => ({ data: [] })),
      api.get("/council-config/").catch(() => ({ data: {} })),
    ]).then(([profilesRes, configRes]) => {
      // Only show members who have a role AND it's not purely adminabsolute
      const all: any[] = Array.isArray(profilesRes.data) ? profilesRes.data : [];
      const withRoles = all.filter(
        (p) => p.role && p.role !== "adminabsolute"
      );
      // Sort by role order
      const sorted = withRoles.sort((a: any, b: any) => {
        const ao = ROLE_ORDER[a.role] ?? 99;
        const bo = ROLE_ORDER[b.role] ?? 99;
        return ao - bo;
      });
      setProfiles(sorted);
      setConfig(configRes.data || {});
      setLoading(false);
    });
  }, []);

  // Group members by category
  const patronMembers = profiles.filter((p) => PATRON_ROLES.includes(p.role));
  const chairperson = profiles.find((p) => p.role === "chairperson");
  const viceChair = profiles.find((p) => p.role === "vice_chairperson");
  const speaker = profiles.find((p) => p.role === "speaker");
  const deputySpeaker = profiles.find((p) => p.role === "deputy_speaker");
  const topLeaders = [viceChair, chairperson, speaker].filter(Boolean);
  const secondRow = [deputySpeaker].filter(Boolean);

  const secretariat = profiles.filter((p) => SECRETARIAT_ROLES.includes(p.role));
  const commission = profiles.filter((p) => COMMISSION_ROLES.includes(p.role));
  const councillors = profiles.filter((p) => COUNCILLOR_ROLES.includes(p.role));

  const orgName = config.org_name || "MENGO SENIOR SCHOOL";
  const slogan = config.slogan || "AKWANA AKIRA AYOMBA";

  const currentYear = new Date().getFullYear();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <div className="text-center text-white space-y-4">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-lg">Loading Council Board…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0a0a] via-primary to-[#1a0a0a] text-white">
      {/* ── HEADER ────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-pattern opacity-5 pointer-events-none" />

        <div className="relative z-10 text-center py-10 sm:py-14 px-4">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="flex justify-center mb-4"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 -m-2 border-2 border-dashed border-gold/40 rounded-full"
              />
              <img
                src={mengoBadge}
                alt="Badge"
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-gold object-cover shadow-[0_0_30px_rgba(212,175,55,0.4)]"
              />
            </div>
          </motion.div>

          {/* School name */}
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-lg"
          >
            {orgName}
          </motion.h1>

          {/* Council title + year */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-2"
          >
            <p className="text-gold font-bold text-base sm:text-xl tracking-widest uppercase">
              Student Council Body &nbsp;·&nbsp; {currentYear - 1}/{currentYear}
            </p>
            <div className="flex items-center justify-center gap-3 mt-2">
              <div className="h-[1px] w-16 bg-gold/40" />
              <span className="text-[10px] sm:text-xs text-white/60 uppercase tracking-[0.3em] italic font-medium">
                &ldquo;{slogan}&rdquo;
              </span>
              <div className="h-[1px] w-16 bg-gold/40" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── PATRON(S) ─────────────────────────────────────────── */}
      {patronMembers.length > 0 && (
        <section className="px-4 pb-4">
          <SectionLabel label="Patron" />
          <div className="flex flex-wrap justify-center gap-8 mt-6">
            {patronMembers.map((m, i) => (
              <MemberCard key={m.id} member={m} size="md" delay={i * 0.1} />
            ))}
          </div>
        </section>
      )}

      {/* ── GOLDEN DIVIDER ─────────────────────────────────────── */}
      <Divider />

      {/* ── TOP LEADERSHIP (Chair centred, VP & Speaker flanking) ─ */}
      {topLeaders.length > 0 && (
        <section className="px-4 pb-8">
          <SectionLabel label="Executive Leadership" />
          <div className="flex flex-wrap justify-center items-end gap-6 sm:gap-12 mt-8">
            {/* Vice Chair */}
            {viceChair && (
              <MemberCard member={viceChair} size="md" delay={0.1} />
            )}
            {/* Chairperson — largest & centred */}
            {chairperson && (
              <MemberCard
                member={chairperson}
                size="xl"
                delay={0}
                highlight
              />
            )}
            {/* Speaker */}
            {speaker && (
              <MemberCard member={speaker} size="md" delay={0.2} />
            )}
          </div>

          {/* Deputy Speaker below */}
          {secondRow.length > 0 && (
            <div className="flex flex-wrap justify-center gap-8 mt-8">
              {secondRow.map((m, i) => (
                <MemberCard key={m.id} member={m} size="sm" delay={0.3 + i * 0.1} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── SECRETARIAT ─────────────────────────────────────────── */}
      {secretariat.length > 0 && (
        <>
          <Divider />
          <section className="px-4 pb-8">
            <SectionLabel label="Secretariat" />
            <div className="mt-6 flex flex-wrap justify-center gap-6 sm:gap-8">
              {secretariat.map((m, i) => (
                <MemberCard key={m.id} member={m} size="sm" delay={i * 0.07} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── ELECTORAL COMMISSION ─────────────────────────────────── */}
      {commission.length > 0 && (
        <>
          <Divider />
          <section className="px-4 pb-8">
            <SectionLabel label="Electoral Commission" />
            <div className="mt-6 flex flex-wrap justify-center gap-6 sm:gap-8">
              {commission.map((m, i) => (
                <MemberCard key={m.id} member={m} size="sm" delay={i * 0.1} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── COUNCILLORS ─────────────────────────────────────────── */}
      {councillors.length > 0 && (
        <>
          <Divider />
          <section className="px-4 pb-8">
            <SectionLabel label="Councillors" />
            <div className="mt-6 flex flex-wrap justify-center gap-4 sm:gap-6">
              {councillors.map((m, i) => (
                <MemberCard key={m.id} member={m} size="sm" delay={i * 0.05} />
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── FOOTER BANNER ─────────────────────────────────────────── */}
      <Divider />
      <div className="relative overflow-hidden bg-black/30 py-6 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-transparent to-gold/5 pointer-events-none" />
        <div className="relative z-10 container mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-center text-xs">
          <FooterItem
            title="School Theme"
            value={`"Growing in Faith and Fruitful in Life" — John 15:8`}
          />
          <FooterItem
            title="School Mission"
            value="To provide quality education through practical skills, teamwork, resilience &amp; produce God-fearing persons"
          />
          <FooterItem
            title="School Vision"
            value="To be at the helm of producing competent humans to serve the church, state &amp; the world"
          />
          <FooterItem
            title="Core Values"
            value="Fearing God · Respect of persons &amp; property · Integrity"
          />
        </div>
      </div>

      {/* Empty state */}
      {profiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-white/50">
          <div className="text-6xl mb-4">👥</div>
          <p className="font-serif text-lg">No council members registered yet.</p>
          <p className="text-sm mt-1 text-white/40">Members will appear here once registered.</p>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-xs" />
      <span className="text-[11px] sm:text-xs font-bold tracking-[0.3em] uppercase text-gold/80 px-2 py-0.5 border border-gold/30 rounded">
        {label}
      </span>
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent max-w-xs" />
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center justify-center py-4 px-8">
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </div>
  );
}

function FooterItem({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <p className="text-gold/70 font-bold uppercase tracking-wider mb-1 text-[9px] sm:text-[10px]">
        {title}
      </p>
      <p
        className="text-white/60 text-[9px] sm:text-[10px] leading-relaxed"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  );
}
