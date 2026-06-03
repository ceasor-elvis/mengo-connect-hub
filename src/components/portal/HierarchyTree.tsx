import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useHierarchy, RoleNode, AppRole, ICON_MAP } from "@/hooks/useHierarchy";
import { Plus, Minus, Users, User, GraduationCap, School, Info, Crown, Star } from "lucide-react";
import { api } from "@/lib/api";

interface ProfileMap {
  [userId: string]: {
    full_name: string;
    profile_pic_url: string | null;
    student_class?: string;
    stream?: string;
    gender?: string;
    bio?: string;
  };
}
interface RoleMap { [role: string]: string }

// ─── Tier classification for visual prominence ────────────────────────────────
const TIER_1 = ["patron", "chairperson"];
const TIER_2 = ["vice_chairperson", "general_secretary", "speaker"];
const TIER_3 = [
  "deputy_speaker", "assistant_general_secretary",
  "secretary_finance", "secretary_welfare", "secretary_health",
  "secretary_women_affairs", "secretary_publicity", "secretary_pwd",
  "electoral_commission", "disciplinary_committee", "dpo",
];

function getTier(role: string): 1 | 2 | 3 | 4 {
  if (TIER_1.includes(role)) return 1;
  if (TIER_2.includes(role)) return 2;
  if (TIER_3.includes(role)) return 3;
  return 4;
}

// ─── Profile Detail Dialog ───────────────────────────────────────────────────
function ProfileDialog({
  profile,
  node,
  children,
}: {
  profile: NonNullable<ProfileMap[string]>;
  node: RoleNode;
  children: React.ReactNode;
}) {
  const Icon = ICON_MAP[node.iconName] || User;
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-xl p-0 overflow-hidden bg-background/60 backdrop-blur-3xl border-white/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] rounded-[2.5rem]">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background -z-10" />
          <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-primary/5 to-transparent -z-10" />

          <div className="p-8 sm:p-10">
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Profile Image */}
              <div className="relative group shrink-0">
                <div className="absolute inset-0 bg-gold blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity animate-pulse" />
                <Avatar className="h-40 w-40 sm:h-48 sm:w-48 border-8 border-white shadow-2xl relative z-10">
                  <AvatarImage src={profile.profile_pic_url || (profile as any).profile_pic || ""} alt={profile.full_name} className="object-cover" />
                  <AvatarFallback className="bg-muted text-5xl font-serif">{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-gold text-white text-[10px] font-black uppercase tracking-tighter px-3 py-1.5 rounded-full shadow-lg z-20 border-2 border-white">
                  Active Officer
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left space-y-4">
                <div>
                  <h2 className="font-serif text-3xl font-black text-primary leading-tight tracking-tight mb-2">
                    {profile.full_name}
                  </h2>
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-widest">{node.label}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 border border-white/60 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <GraduationCap className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Class</span>
                    </div>
                    <p className="text-sm font-bold text-primary">{profile.student_class || "N/A"}</p>
                  </div>
                  <div className="bg-white/40 border border-white/60 p-3 rounded-2xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <School className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Stream</span>
                    </div>
                    <p className="text-sm font-bold text-primary">{profile.stream || "N/A"}</p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2 text-primary/60">
                    <Info className="h-4 w-4" />
                    <span className="text-xs font-black uppercase tracking-widest">About</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-4">
                    {profile.bio || "No biography provided. Dedicated to serving the students of Mengo Senior School."}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-primary/5 flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Certified Council Official</span>
              </div>
              <p className="text-[10px] font-medium text-muted-foreground/40 italic">
                Ref: MSS-{profile.full_name.split(" ").join("-").toUpperCase()}
              </p>
            </div>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Individual node card — scales with tier ─────────────────────────────────
function NodeCard({
  node, roleMap, profileMap, isExpanded, onToggle, hasChildren,
}: {
  node: RoleNode; roleMap: RoleMap; profileMap: ProfileMap;
  isExpanded: boolean; onToggle: () => void; hasChildren: boolean;
}) {
  const userId = roleMap[node.role];
  const profile = userId ? profileMap[userId] : null;
  const Icon = ICON_MAP[node.iconName] || User;
  const isMulti = node.role === "class_coordinators" || node.role === "councillors";
  const tier = getTier(node.role);
  const hasPhoto = !isMulti && profile && (profile.profile_pic_url || (profile as any).profile_pic);

  // Tier-based sizing
  const avatarSize = tier === 1
    ? "h-20 w-20 sm:h-24 sm:w-24"
    : tier === 2
    ? "h-14 w-14 sm:h-18 sm:w-18"
    : "h-10 w-10 sm:h-14 sm:w-14";

  const cardWidth = tier === 1
    ? "w-[130px] sm:w-[160px]"
    : tier === 2
    ? "w-[110px] sm:w-[145px]"
    : "w-[90px] sm:w-[125px]";

  const nameSize = tier === 1
    ? "text-[9px] sm:text-[12px]"
    : tier === 2
    ? "text-[8.5px] sm:text-[11px]"
    : "text-[8px] sm:text-[10px]";

  const labelSize = tier === 1
    ? "text-[8px] sm:text-[10px]"
    : "text-[7px] sm:text-[9px]";

  // Ring colour by tier
  const tierRing =
    tier === 1 ? "ring-2 ring-gold ring-offset-1 ring-offset-transparent" :
    tier === 2 ? "ring-1 ring-primary/40" :
    "";

  const cardEl = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className={`
        relative group flex flex-col items-center gap-2 rounded-2xl p-3 sm:p-4
        shadow-lg border backdrop-blur-xl transition-all duration-300
        ${!isMulti && profile ? "cursor-pointer" : "cursor-default"}
        ${node.color || "bg-card text-card-foreground"}
        ${cardWidth}
        border-white/10 hover:border-white/30
        ${!profile && !isMulti ? "opacity-55" : ""}
      `}
      onClick={(e) => {
        if (hasChildren && (!profile || isMulti)) { e.stopPropagation(); onToggle(); }
      }}
    >
      {/* Expand/Collapse button */}
      {hasChildren && (
        <div
          className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-background/90 shadow-xl flex items-center justify-center text-primary z-20 border border-primary/20 hover:scale-125 transition-all duration-300 cursor-pointer hover:bg-primary/10"
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
        >
          <motion.div animate={isExpanded ? { rotate: 0 } : { rotate: 180 }} className="flex items-center justify-center">
            {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </motion.div>
          {!isExpanded && <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 -z-10" />}
        </div>
      )}

      {/* Tier-1 crown badge */}
      {tier === 1 && profile && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-gold text-white rounded-full p-1 shadow-lg shadow-gold/30">
            <Crown className="w-3 h-3" />
          </div>
        </div>
      )}
      {tier === 2 && profile && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-30">
          <div className="bg-primary text-white rounded-full p-0.5 shadow-md">
            <Star className="w-2.5 h-2.5" />
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="shrink-0 relative mt-1">
        {!isMulti && hasPhoto ? (
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${tier === 1 ? "bg-gold/30 blur-lg scale-110" : "bg-primary/10 blur-md"} pointer-events-none`} />
            <Avatar className={`${avatarSize} border-2 border-white shadow-xl relative z-10 ${tierRing}`}>
              <AvatarImage
                src={profile!.profile_pic_url || (profile as any)!.profile_pic || ""}
                alt={profile!.full_name}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {profile!.full_name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div
            className={`${avatarSize} rounded-full flex items-center justify-center border border-white/20 shadow-inner ${profile ? "bg-white/20" : "bg-black/5"} ${tierRing}`}
          >
            {isMulti
              ? <Users className={`${tier <= 2 ? "h-6 w-6" : "h-4 w-4"} opacity-70`} />
              : profile
              ? <Icon className={`${tier <= 2 ? "h-7 w-7" : "h-5 w-5"}`} />
              : <Icon className={`${tier <= 2 ? "h-6 w-6" : "h-4 w-4"} opacity-30`} />
            }
          </div>
        )}
      </div>

      {/* Text */}
      <div className="text-center leading-tight w-full space-y-0.5">
        <p className={`font-bold ${labelSize} uppercase tracking-wider opacity-70 leading-tight`}>
          {node.label}
        </p>
        <div className="h-[1px] w-6 mx-auto bg-current/20 rounded-full" />
        {isMulti ? (
          <p className="text-[7px] sm:text-[9px] opacity-60 italic">Multiple Members</p>
        ) : profile ? (
          <p className={`${nameSize} font-extrabold opacity-95 break-words leading-snug px-1`}>
            {profile.full_name}
          </p>
        ) : (
          <p className="text-[7px] sm:text-[9px] opacity-35 italic uppercase tracking-widest font-light">
            Vacant
          </p>
        )}
        {/* Class + Stream for Tier 1 */}
        {tier <= 2 && profile && profile.student_class && (
          <p className="text-[7px] sm:text-[8px] opacity-50 font-medium mt-0.5">
            {profile.student_class} · {profile.stream}
          </p>
        )}
      </div>

      {/* Hover shimmer */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </motion.div>
  );

  if (isMulti || !profile) return cardEl;

  return <ProfileDialog profile={profile} node={node}>{cardEl}</ProfileDialog>;
}

// ─── Tree Branch renderer ─────────────────────────────────────────────────────
function TreeBranch({
  role, tree, roleMap, profileMap, level = 0, defaultExpanded = true, isDesktop,
}: {
  role: AppRole; tree: RoleNode[]; roleMap: RoleMap; profileMap: ProfileMap;
  level?: number; defaultExpanded?: boolean; isDesktop: boolean;
}) {
  const node = tree.find((n) => n.role === role);
  const [isExpanded, setIsExpanded] = useState(level < 2 || defaultExpanded);

  if (!node) return null;

  const children = node.children || [];
  const isVerticalBranch = !isDesktop || level >= 2;
  const tier = getTier(node.role);

  return (
    <div className={`flex flex-col ${isVerticalBranch ? "items-start w-full" : "items-center"} relative`}>
      <div className="flex flex-col items-center">
        <NodeCard
          node={node} roleMap={roleMap} profileMap={profileMap}
          isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}
          hasChildren={children.length > 0}
        />
        {children.length > 0 && !isVerticalBranch && isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: tier <= 1 ? 48 : 32, opacity: 1 }}
            className={`w-px bg-gradient-to-b from-primary/40 via-primary/60 to-primary/20 shrink-0 ${tier <= 1 ? "w-0.5" : ""}`}
          />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`flex overflow-hidden ${
              isVerticalBranch
                ? "flex-col items-start ml-[52px] sm:ml-[72px] border-l-2 border-dashed border-primary/20 pl-6 sm:pl-10 py-4 gap-5 w-full"
                : "flex-row justify-center items-start"
            }`}
          >
            {children.map((c, index) => (
              <div
                key={c}
                className={`relative flex flex-col ${isVerticalBranch ? "items-start w-full" : "items-center px-3 md:px-6"}`}
              >
                {!isVerticalBranch && children.length > 1 && (
                  <>
                    {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-gradient-to-r from-transparent to-primary/30" />}
                    {index < children.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-gradient-to-l from-transparent to-primary/30" />}
                  </>
                )}
                {!isVerticalBranch && <div className="w-px h-8 bg-gradient-to-b from-primary/30 to-primary/50 shrink-0" />}
                {isVerticalBranch && (
                  <div className="absolute left-[-26px] sm:left-[-40px] top-[28px] w-6 sm:w-10 h-px bg-gradient-to-r from-primary/20 to-primary/50" />
                )}
                <TreeBranch
                  role={c} tree={tree} roleMap={roleMap} profileMap={profileMap}
                  level={level + 1} defaultExpanded={level < 1} isDesktop={isDesktop}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function HierarchyTree({ refreshKey }: { refreshKey?: number }) {
  const [roleMap, setRoleMap] = useState<RoleMap>({});
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const { tree } = useHierarchy(refreshKey);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );

  const fetchData = async () => {
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        api.get("/users/all-roles/").catch(() => ({ data: [] })),
        api.get("/users/all-profiles/").catch(() => ({ data: [] })),
      ]);

      const roles = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data?.results || [];
      const rm: RoleMap = {};
      roles.forEach((r: any) => { if (r.role) rm[r.role] = r.user_id; });
      setRoleMap(rm);

      const profiles = Array.isArray(profilesRes.data) ? profilesRes.data : profilesRes.data?.results || [];
      const pm: ProfileMap = {};
      profiles.forEach((p: any) => {
        pm[p.user_id] = {
          full_name: p.full_name,
          profile_pic_url: p.profile_pic_url || p.profile_pic || null,
          student_class: p.student_class,
          stream: p.stream,
          gender: p.gender,
          bio: p.bio,
        };
      });
      setProfileMap(pm);
    } catch (e) {
      console.error("Failed to fetch hierarchy details", e);
    }
  };

  useEffect(() => {
    fetchData();
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [refreshKey]);

  const allChildren = new Set(tree.flatMap((n) => n.children));
  const rootNodes = tree.filter((n) => !allChildren.has(n.role));
  const rootRole = rootNodes.length > 0 ? rootNodes[0].role : tree[0]?.role;

  return (
    <div className="w-full overflow-x-hidden pb-16 selection:bg-gold/20">
      <div className="w-full flex justify-center py-8 md:py-12 px-4">
        {rootRole ? (
          <TreeBranch
            role={rootRole}
            tree={tree}
            roleMap={roleMap}
            profileMap={profileMap}
            isDesktop={isDesktop}
          />
        ) : (
          <div className="text-center py-20 px-12 rounded-[3rem] border-2 border-dashed border-primary/10 bg-gradient-to-b from-primary/[0.02] to-transparent max-w-md mx-auto">
            <Users className="w-12 h-12 text-primary/10 mx-auto mb-4" />
            <p className="text-primary/40 font-medium italic tracking-tight">
              Council structure is being prepared…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
