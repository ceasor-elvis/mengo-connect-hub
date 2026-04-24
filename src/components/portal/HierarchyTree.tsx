import { useEffect, useState } from "react";
import axios from "axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import { useHierarchy, RoleNode, AppRole, ICON_MAP } from "@/hooks/useHierarchy";
import { Plus, Minus, Users, User } from "lucide-react";
import { api } from "@/lib/api";

interface ProfileMap { [userId: string]: { full_name: string; profile_pic_url: string | null } }
interface RoleMap { [role: string]: string }

function NodeCard({
  node, roleMap, profileMap, isExpanded, onToggle, hasChildren
}: {
  node: RoleNode; roleMap: RoleMap; profileMap: ProfileMap;
  isExpanded: boolean; onToggle: () => void; hasChildren: boolean;
}) {
  const userId = roleMap[node.role];
  const profile = userId ? profileMap[userId] : null;
  const Icon = ICON_MAP[node.iconName] || User;
  const isMultipleRole = node.role === "class_coordinators" || node.role === "councillors";

  const cardContent = (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`
        relative group flex flex-col items-center gap-2 rounded-2xl p-4 text-xs font-medium
        shadow-lg border backdrop-blur-xl transition-all duration-500
        ${!isMultipleRole && profile ? 'cursor-pointer' : 'cursor-default'}
        ${node.color || 'bg-card text-card-foreground'}
        w-[110px] sm:w-[140px]
        border-white/10 hover:border-white/30
        ${!profile && !isMultipleRole ? 'opacity-60 grayscale-[0.5]' : ''}
      `}
      onClick={(e) => { if (hasChildren) { e.stopPropagation(); onToggle(); } }}
    >
      {hasChildren && (
        <div className="absolute -right-2 -top-2 w-6 h-6 rounded-full bg-background/80 backdrop-blur-md shadow-xl flex items-center justify-center text-primary z-20 border border-primary/20 group-hover:scale-125 transition-all duration-500 overflow-hidden">
          <motion.div animate={isExpanded ? { rotate: 0 } : { rotate: 180 }} className="flex items-center justify-center">
            {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </motion.div>
          {!isExpanded && <div className="absolute inset-0 rounded-full animate-ping bg-primary/10 -z-10" />}
        </div>
      )}

      <div className="shrink-0 relative">
        {!isMultipleRole && profile && (profile.profile_pic_url || (profile as any).profile_pic) ? (
          <div className="relative p-1">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-gold to-transparent opacity-50 blur-sm" />
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white shadow-xl relative z-10">
              <AvatarImage src={profile.profile_pic_url || (profile as any).profile_pic || ""} alt={profile.full_name} />
              <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        ) : (
          <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner ${profile ? 'bg-white/20' : 'bg-black/5'}`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${profile ? 'text-current' : 'text-current/40'}`} />
          </div>
        )}
      </div>

      <div className="text-center leading-tight w-full space-y-1">
        <p className={`font-bold text-[10px] sm:text-[11px] break-words uppercase tracking-widest leading-none ${!profile && !isMultipleRole ? 'text-current/60' : ''}`}>{node.label}</p>
        <div className="h-[1px] w-6 mx-auto bg-current/20 rounded-full" />
        {isMultipleRole ? (
          <p className="text-[9px] opacity-70 font-semibold italic tracking-tight">Multiple Members</p>
        ) : profile ? (
          <p className="text-[9px] opacity-90 font-bold truncate w-full px-1">{profile.full_name}</p>
        ) : (
          <p className="text-[8px] opacity-40 italic uppercase tracking-widest font-light">Vacant</p>
        )}
      </div>

      <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 via-transparent to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none -z-10" />
    </motion.div>
  );

  if (isMultipleRole || !profile) return cardContent;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div onClick={(e) => e.stopPropagation()}>{cardContent}</div>
      </DialogTrigger>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-transparent border-none shadow-none">
        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} className="flex flex-col items-center gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-gold blur-[50px] opacity-40 group-hover:opacity-60 transition-opacity animate-pulse" />
            <Avatar className="h-48 w-48 border-8 border-white shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] relative z-10 transition-transform duration-500 hover:scale-105">
              <AvatarImage src={profile.profile_pic_url || (profile as any).profile_pic || ""} alt={profile.full_name} />
              <AvatarFallback className="bg-muted text-4xl font-serif">{profile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
          <div className="bg-white/90 backdrop-blur-xl px-10 py-6 rounded-[2.5rem] border border-white/40 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent opacity-50" />
            <h2 className="font-serif text-2xl font-bold text-primary mb-1">{profile.full_name}</h2>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-px w-4 bg-gold/30" />
              <p className="text-[10px] font-bold text-gold uppercase tracking-[0.4em]">{node.label}</p>
              <div className="h-px w-4 bg-gold/30" />
            </div>
            <p className="text-[10px] text-muted-foreground/60 italic">Official Council Member</p>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function TreeBranch({
  role, tree, roleMap, profileMap, level = 0, defaultExpanded = true, isDesktop
}: {
  role: AppRole; tree: RoleNode[]; roleMap: RoleMap; profileMap: ProfileMap;
  level?: number; defaultExpanded?: boolean; isDesktop: boolean;
}) {
  const node = tree.find((n) => n.role === role);
  const [isExpanded, setIsExpanded] = useState(level < 2 || defaultExpanded);

  if (!node) return null;

  const children = node.children || [];
  // On mobile: always vertical. On desktop: horizontal at top 2 levels only.
  const isVerticalBranch = !isDesktop || level >= 2;

  return (
    <div className={`flex flex-col ${isVerticalBranch ? 'items-start w-full' : 'items-center'} relative`}>
      <div className="flex flex-col items-center">
        <NodeCard
          node={node} roleMap={roleMap} profileMap={profileMap}
          isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} hasChildren={children.length > 0}
        />
        {children.length > 0 && !isVerticalBranch && isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 32, opacity: 1 }}
            className="w-px bg-gradient-to-b from-primary/30 via-primary/50 to-primary/10 shrink-0" />
        )}
      </div>

      <AnimatePresence>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`flex overflow-hidden ${isVerticalBranch
              ? 'flex-col items-start ml-[55px] sm:ml-[70px] border-l-2 border-dashed border-primary/20 pl-6 sm:pl-8 py-4 gap-6 w-full'
              : 'flex-row justify-center items-start'}`}
          >
            {children.map((c, index) => (
              <div key={c} className={`relative flex flex-col ${isVerticalBranch ? 'items-start w-full' : 'items-center px-4 md:px-8'}`}>
                {!isVerticalBranch && children.length > 1 && (
                  <>
                    {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-gradient-to-r from-transparent to-primary/20" />}
                    {index < children.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-gradient-to-l from-transparent to-primary/20" />}
                  </>
                )}
                {!isVerticalBranch && <div className="w-px h-8 bg-gradient-to-b from-primary/20 to-primary/40 shrink-0" />}
                {isVerticalBranch && <div className="absolute left-[-26px] sm:left-[-34px] top-[30px] w-6 sm:w-8 h-px bg-gradient-to-r from-primary/20 to-primary/40" />}
                <TreeBranch
                  role={c} tree={tree} roleMap={roleMap} profileMap={profileMap}
                  level={level + 1} defaultExpanded={false} isDesktop={isDesktop}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function HierarchyTree({ refreshKey }: { refreshKey?: number }) {
  const [roleMap, setRoleMap] = useState<RoleMap>({});
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const { tree } = useHierarchy(refreshKey);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);

  const fetchData = async () => {
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        api.get("/users/all-roles/").catch(() => ({ data: [] })),
        api.get("/users/all-profiles/").catch(() => ({ data: [] })),
      ]);
      const rolesData = rolesRes.data;
      const profilesData = profilesRes.data;
      if (rolesData) {
        const rm: RoleMap = {};
        const roles = Array.isArray(rolesData) ? rolesData : (rolesData.results || []);
        roles.forEach((r: any) => { if (r.role) rm[r.role] = r.user_id; });
        setRoleMap(rm);
      }
      if (profilesData) {
        const pm: ProfileMap = {};
        const profiles = Array.isArray(profilesData) ? profilesData : profilesData.results || [];
        profiles.forEach((p: any) => {
          pm[p.user_id] = { full_name: p.full_name, profile_pic_url: p.profile_pic_url || p.profile_pic || null };
        });
        setProfileMap(pm);
      }
    } catch (e) {
      console.error("Failed to fetch hierarchy details", e);
    }
  };

  useEffect(() => {
    fetchData();
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [refreshKey]);

  const allChildren = new Set(tree.flatMap(n => n.children));
  const rootNodes = tree.filter(n => !allChildren.has(n.role));
  const rootRole = rootNodes.length > 0 ? rootNodes[0].role : tree[0]?.role;

  return (
    <div className="w-full overflow-x-hidden pb-16 selection:bg-gold/20">
      <div className="w-full flex justify-center py-8 md:py-12 px-4">
        {rootRole ? (
          <TreeBranch role={rootRole} tree={tree} roleMap={roleMap} profileMap={profileMap} isDesktop={isDesktop} />
        ) : (
          <div className="text-center py-20 px-12 rounded-[3rem] border-2 border-dashed border-primary/10 bg-gradient-to-b from-primary/[0.02] to-transparent max-w-md mx-auto">
            <Users className="w-12 h-12 text-primary/10 mx-auto mb-4" />
            <p className="text-primary/40 font-medium italic tracking-tight">Council structure is being prepared...</p>
          </div>
        )}
      </div>
    </div>
  );
}
