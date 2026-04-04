import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { motion } from "framer-motion";
import { useHierarchy, RoleNode, AppRole, ICON_MAP } from "@/hooks/useHierarchy";
import { Loader2 } from "lucide-react";

interface ProfileMap { [userId: string]: { full_name: string; profile_pic_url: string | null } }
interface RoleMap { [role: string]: string } // role -> user_id

function NodeCard({ node, roleMap, profileMap }: { node: RoleNode; roleMap: RoleMap; profileMap: ProfileMap }) {
  const userId = roleMap[node.role];
  const profile = userId ? profileMap[userId] : null;
  const Icon = ICON_MAP[node.iconName] || ICON_MAP.User;

  return (
    <div className="flex flex-col items-center">
      <Dialog>
        <DialogTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-center gap-1 sm:gap-1.5 rounded-lg p-1.5 sm:p-2 text-xs font-medium shadow-sm border cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all ${node.color} min-w-[70px] sm:min-w-[90px] max-w-[100px]`}
          >
             <div className="shrink-0">
               {profile && (profile.profile_pic_url || (profile as any).profile_pic) ? (
                 <Avatar className="h-6 w-6 sm:h-7 sm:w-7 border-2 border-primary-foreground/20 shadow-md">
                   <AvatarImage src={profile.profile_pic_url || (profile as any).profile_pic || ""} alt={profile.full_name} />
                   <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-[9px]">
                     {profile.full_name.slice(0, 2).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
               ) : (
                 <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mx-auto" />
               )}
             </div>
            
            <div className="text-center leading-tight w-full">
              <p className="font-bold text-[8.5px] sm:text-[9px] break-words uppercase tracking-tight leading-none mb-0.5">{node.label}</p>
              {profile ? (
                <p className="text-[8.5px] opacity-90 font-medium truncate w-full">{profile.full_name}</p>
              ) : (
                <p className="text-[8px] opacity-60 italic">Vacant</p>
              )}
            </div>
          </motion.div>
        </DialogTrigger>
        
        {profile && (
          <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gold blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <Avatar className="h-64 w-64 border-8 border-background shadow-2xl relative z-10 transition-transform hover:scale-105">
                  <AvatarImage src={profile.profile_pic_url || (profile as any).profile_pic || ""} alt={profile.full_name} />
                  <AvatarFallback className="bg-muted text-4xl">
                    {profile.full_name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="bg-background/90 backdrop-blur-sm px-6 py-3 rounded-full border shadow-xl text-center">
                <h2 className="font-serif text-xl font-bold">{profile.full_name}</h2>
                <p className="text-sm font-medium text-gold uppercase tracking-widest">{node.label}</p>
              </div>
            </motion.div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function TreeBranch({ role, tree, roleMap, profileMap }: { role: AppRole; tree: RoleNode[]; roleMap: RoleMap; profileMap: ProfileMap }) {
  const node = tree.find((n) => n.role === role);
  if (!node) return null; // Avoid crashing on broken links

  const children = node.children || [];

  return (
    <div className="flex flex-col items-center gap-1">
      <NodeCard node={node} roleMap={roleMap} profileMap={profileMap} />
      {children.length > 0 && (
        <>
          {/* Parent vertical line down */}
          <div className="w-px h-4 bg-border shrink-0" />
          
          {/* Children container: no flex-wrap, items-start to keep them aligned properly */}
          <div className="flex justify-center items-start">
            {children.map((c, index) => (
              <div key={c} className="relative flex flex-col items-center px-1 md:px-3">
                {/* CSS Horizontal line spanning */}
                {children.length > 1 && (
                  <>
                     {index > 0 && <div className="absolute top-0 left-0 w-1/2 h-px bg-border" />}
                     {index < children.length - 1 && <div className="absolute top-0 right-0 w-1/2 h-px bg-border" />}
                  </>
                )}
                
                {/* Child vertical line down to its own card */}
                <div className="w-px h-4 bg-border shrink-0" />
                
                <TreeBranch role={c} tree={tree} roleMap={roleMap} profileMap={profileMap} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function HierarchyTree({ refreshKey }: { refreshKey?: number }) {
  const [roleMap, setRoleMap] = useState<RoleMap>({});
  const [profileMap, setProfileMap] = useState<ProfileMap>({});
  const { tree, loading } = useHierarchy(refreshKey);

  const fetchData = async () => {
    try {
      const [rolesRes, profilesRes] = await Promise.all([
        api.get("/users/all-roles/"),
        api.get("/users/all-profiles/"),
      ]);
      
      if (rolesRes.data) {
        const rm: RoleMap = {};
        rolesRes.data.forEach((r: any) => { rm[r.role] = r.user_id; });
        setRoleMap(rm);
      }
      if (profilesRes.data) {
        const pm: ProfileMap = {};
        const profiles = Array.isArray(profilesRes.data) ? profilesRes.data : profilesRes.data.results || [];
        profiles.forEach((p: any) => { 
          pm[p.user_id] = { 
            full_name: p.full_name, 
            profile_pic_url: p.profile_pic_url || p.profile_pic || null
          }; 
        });
        setProfileMap(pm);
      }
    } catch (e) {
      console.error("Failed to fetch hierarchy data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Find root nodes (nodes that are not children of any other node)
  const allChildren = new Set(tree.flatMap(n => n.children));
  const rootNodes = tree.filter(n => !allChildren.has(n.role));
  const rootRole = rootNodes.length > 0 ? rootNodes[0].role : tree[0]?.role;

  return (
    <div className="overflow-x-auto pb-4">
      <div className="w-max min-w-full flex justify-center py-4 px-4 sm:px-8">
        {rootRole ? (
          <TreeBranch role={rootRole} tree={tree} roleMap={roleMap} profileMap={profileMap} />
        ) : (
          <p className="text-secondary opacity-50">Empty organization structure</p>
        )}
      </div>
    </div>
  );
}
