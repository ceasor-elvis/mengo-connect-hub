import { useEffect, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useHierarchy, RoleNode, ICON_MAP } from "@/hooks/useHierarchy";
import { Users, User, GraduationCap, School, Info, ChevronDown, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

interface Profile {
  full_name: string;
  profile_pic_url: string | null;
  student_class?: string;
  stream?: string;
  gender?: string;
  bio?: string;
}
interface ProfileMap { [userId: string]: Profile }
interface RoleMap { [role: string]: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitial(name: string) {
  return name ? name.charAt(0).toUpperCase() : "?";
}

// ─── Single circular photo card — CouncilBoardPage style ─────────────────────
function PhotoCard({
  node,
  profile,
  depth,
}: {
  node: RoleNode;
  profile: Profile | null;
  depth: number;
}) {
  const Icon = ICON_MAP[node.iconName] || User;

  const photoSize =
    depth === 0 ? "w-36 h-36 sm:w-40 sm:h-40" :
    depth === 1 ? "w-24 h-24 sm:w-28 sm:h-28" :
    depth === 2 ? "w-20 h-20 sm:w-24 sm:h-24" :
    "w-16 h-16";

  const nameSize =
    depth === 0 ? "text-sm sm:text-base font-bold" :
    depth === 1 ? "text-[13px] font-bold" :
    "text-[11px] font-semibold";

  const roleSize = depth === 0 ? "text-[11px]" : "text-[9px]";

  const highlight = depth === 0;

  const pic = profile?.profile_pic_url || (profile as any)?.profile_pic;

  const card = (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.04 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="flex flex-col items-center text-center group cursor-pointer select-none"
    >
      <div className="relative">
        {highlight && (
          <div className="absolute inset-0 rounded-full bg-primary/40 blur-xl scale-125 animate-pulse pointer-events-none" />
        )}
        <div
          className={`relative ${photoSize} rounded-full overflow-hidden border-4 ${highlight ? "border-primary shadow-[0_0_24px_rgba(var(--primary),.35)] ring-4 ring-primary/30" : "border-white/20"} shadow-xl mx-auto flex-shrink-0 bg-muted`}
        >
          {pic ? (
            <img
              src={pic}
              alt={profile!.full_name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              {profile ? (
                <span className="text-white font-bold font-serif text-2xl opacity-80">
                  {getInitial(profile.full_name)}
                </span>
              ) : (
                <Icon className="h-1/2 w-1/2 text-white/30" />
              )}
            </div>
          )}
        </div>
        {/* hover overlay */}
        {profile && (
          <div className="absolute inset-0 bg-black/25 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
            <span className="text-white text-[8px] font-bold uppercase tracking-wider">View</span>
          </div>
        )}
      </div>

      <div className="mt-2.5 space-y-0.5 max-w-[120px]">
        {profile ? (
          <p className={`${nameSize} text-white leading-tight group-hover:text-primary/80 transition-colors`}>
            {profile.full_name}
          </p>
        ) : (
          <p className="text-[10px] text-white/30 italic">Vacant</p>
        )}
        {profile?.student_class && (
          <p className="text-[9px] text-white/50 font-medium">
            {profile.student_class} · {profile.stream}
          </p>
        )}
        <div
          className={`mt-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider inline-block ${
            highlight ? "bg-primary text-primary-foreground" : "bg-white/10 text-white/80"
          }`}
        >
          {node.label}
        </div>
      </div>
    </motion.div>
  );

  if (!profile) return card;

  return (
    <Dialog>
      <DialogTrigger asChild>{card}</DialogTrigger>
      <DialogContent className="max-w-lg p-0 overflow-hidden border-0 shadow-2xl rounded-3xl bg-background/95 backdrop-blur-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Hero banner */}
          <div className="relative h-32 bg-gradient-to-br from-primary via-primary/80 to-primary/40 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_white,transparent)]" />
          </div>
          {/* Avatar overlapping */}
          <div className="relative px-6 pb-6">
            <div className="-mt-14 mb-4 flex items-end justify-between">
              <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
                {pic ? (
                  <img src={pic} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold font-serif text-3xl">
                    {getInitial(profile.full_name)}
                  </div>
                )}
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
                <Icon className="h-3.5 w-3.5" /> {node.label}
              </div>
            </div>
            <h2 className="font-serif text-2xl font-black text-foreground leading-tight">{profile.full_name}</h2>
            <div className="flex flex-wrap gap-3 mt-3">
              {profile.student_class && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <GraduationCap className="h-4 w-4" />
                  <span className="text-sm">{profile.student_class}</span>
                </div>
              )}
              {profile.stream && (
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <School className="h-4 w-4" />
                  <span className="text-sm">{profile.stream}</span>
                </div>
              )}
            </div>
            {profile.bio && (
              <div className="mt-4 pt-4 border-t border-border/40">
                <div className="flex items-center gap-2 text-primary/60 mb-2">
                  <Info className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">About</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic line-clamp-4">{profile.bio}</p>
              </div>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Section divider label ────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 py-3">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{label}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

// ─── Collapsible Branch Group ─────────────────────────────────────────────────
function BranchGroup({
  role, tree, roleMap, profileMap, depth,
}: {
  role: string; tree: RoleNode[]; roleMap: RoleMap; profileMap: ProfileMap; depth: number;
}) {
  const node = tree.find((n) => n.role === role);
  const [expanded, setExpanded] = useState(depth < 3);

  if (!node) return null;

  const userId = roleMap[node.role];
  const profile = userId ? profileMap[userId] : null;
  const children = node.children || [];
  const isMulti = node.role === "class_coordinators" || node.role === "councillors";

  return (
    <div className="w-full">
      <div className="flex flex-col items-center">
        <PhotoCard node={node} profile={profile} depth={depth} />

        {children.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center gap-1 text-[9px] text-white/40 hover:text-white/70 uppercase tracking-widest font-bold transition-colors"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? "Collapse" : `Show ${children.length}`}
          </button>
        )}
      </div>

      <AnimatePresence>
        {expanded && children.length > 0 && !isMulti && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* connector line */}
            <div className="flex justify-center">
              <div className="w-px h-8 bg-gradient-to-b from-white/30 to-white/10" />
            </div>
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mt-2">
              {children.map((c, i) => (
                <motion.div
                  key={c}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <BranchGroup
                    role={c} tree={tree} roleMap={roleMap} profileMap={profileMap}
                    depth={depth + 1}
                  />
                </motion.div>
              ))}
            </div>
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

  const fetchData = useCallback(async () => {
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
  }, [refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const allChildren = new Set(tree.flatMap((n) => n.children));
  const rootNodes = tree.filter((n) => !allChildren.has(n.role));
  const rootRole = rootNodes.length > 0 ? rootNodes[0].role : tree[0]?.role;

  return (
    <div className="w-full min-h-[480px] bg-gradient-to-b from-primary/90 via-primary/70 to-primary/50 rounded-2xl overflow-hidden">
      {/* subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.08),transparent_60%)] pointer-events-none rounded-2xl" />

      <div className="relative w-full flex flex-col items-center px-6 py-10 gap-8">
        {rootRole ? (
          <BranchGroup
            role={rootRole}
            tree={tree}
            roleMap={roleMap}
            profileMap={profileMap}
            depth={0}
          />
        ) : (
          <div className="text-center py-20 px-12">
            <Users className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 font-medium italic tracking-tight text-sm">
              Council structure is being prepared…
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
