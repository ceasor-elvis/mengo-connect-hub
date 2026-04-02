import { useEffect, useState, useLayoutEffect, useRef } from "react";
import { api } from "@/lib/api";
import { Shield, UserCheck, Gavel, FileText, DollarSign, Heart, Stethoscope, Users, Megaphone, Accessibility, Vote, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

type AppRole = string;

interface RoleNode {
  role: AppRole;
  label: string;
  icon: any;
  color: string;
  children: AppRole[];
}

export const TREE: RoleNode[] = [
  { role: "patron", label: "Patron", icon: Shield, color: "bg-primary text-primary-foreground", children: ["chairperson"] },
  { role: "chairperson", label: "Chairperson", icon: UserCheck, color: "bg-primary text-primary-foreground", children: ["vice_chairperson", "speaker", "general_secretary", "secretary_finance"] },
  { role: "vice_chairperson", label: "Vice Chairperson", icon: UserCheck, color: "bg-accent text-accent-foreground", children: [] },
  { role: "speaker", label: "Speaker", icon: Gavel, color: "bg-accent text-accent-foreground", children: ["deputy_speaker", "electoral_commission"] },
  { role: "deputy_speaker", label: "Deputy Speaker", icon: Gavel, color: "bg-muted text-muted-foreground", children: [] },
  { role: "electoral_commission", label: "Electoral Commission", icon: Vote, color: "bg-muted text-muted-foreground", children: [] },
  { role: "general_secretary", label: "General Secretary", icon: FileText, color: "bg-accent text-accent-foreground", children: ["assistant_general_secretary", "secretary_welfare", "secretary_health", "secretary_women_affairs", "secretary_publicity", "secretary_pwd"] },
  { role: "assistant_general_secretary", label: "Asst. Gen. Secretary", icon: FileText, color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_finance", label: "Secretary Finance", icon: DollarSign, color: "bg-accent text-accent-foreground", children: [] },
  { role: "secretary_welfare", label: "Secretary Welfare", icon: Heart, color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_health", label: "Secretary Health", icon: Stethoscope, color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_women_affairs", label: "Secretary Women Affairs", icon: Users, color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_publicity", label: "Secretary Publicity", icon: Megaphone, color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_pwd", label: "Secretary PWD", icon: Accessibility, color: "bg-muted text-muted-foreground", children: [] },
];

const findNode = (role: AppRole) => TREE.find((n) => n.role === role)!;

interface ProfileMap { [userId: string]: { full_name: string; profile_pic_url: string | null } }
interface RoleMap { [role: string]: string } // role -> user_id

function NodeCard({ node, roleMap, profileMap }: { node: RoleNode; roleMap: RoleMap; profileMap: ProfileMap }) {
  const userId = roleMap[node.role];
  const profile = userId ? profileMap[userId] : null;
  const Icon = node.icon;

  return (
    <div className="flex flex-col items-center">
      <Dialog>
        <DialogTrigger asChild>
          <motion.div 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium shadow-sm border cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all ${node.color}`}
          >
            <div className="flex flex-col items-center gap-1.5 shrink-0">
               {profile ? (
                 <Avatar className="h-8 w-8 border-2 border-primary-foreground/20 shadow-md">
                   <AvatarImage src={profile.profile_pic_url || ""} />
                   <AvatarFallback className="bg-primary-foreground/10 text-primary-foreground text-[10px]">
                     {profile.full_name.slice(0, 2).toUpperCase()}
                   </AvatarFallback>
                 </Avatar>
               ) : (
                 <Icon className="h-4 w-4 shrink-0 mx-auto" />
               )}
            </div>
            
            <div className="text-left leading-tight min-w-[60px]">
              <p className="font-bold text-[10px] break-words uppercase tracking-tight">{node.label}</p>
              {profile ? (
                <p className="text-[10px] opacity-90 font-medium truncate max-w-[120px]">{profile.full_name}</p>
              ) : (
                <p className="text-[9px] opacity-60 italic">Vacant</p>
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
                  <AvatarImage src={profile.profile_pic_url || ""} />
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

function TreeBranch({ role, roleMap, profileMap }: { role: AppRole; roleMap: RoleMap; profileMap: ProfileMap }) {
  const node = findNode(role);
  const children = node?.children || [];
  const connectorRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (connectorRef.current && children.length > 1) {
      const width = Math.min(children.length * 120, 600);
      connectorRef.current.style.width = `${width}px`;
    }
  }, [children.length]);

  return (
    <div className="flex flex-col items-center gap-1">
      {node && <NodeCard node={node} roleMap={roleMap} profileMap={profileMap} />}
      {children.length > 0 && (
        <>
          <div className="w-px h-3 bg-border" />
          <div className="relative flex justify-center">
            {children.length > 1 && (
              <div 
                ref={connectorRef}
                className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border group-connector" 
              />
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {children.map((c) => (
              <div key={c} className="flex flex-col items-center">
                <div className="w-px h-2 bg-border" />
                <TreeBranch role={c} roleMap={roleMap} profileMap={profileMap} />
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
        profiles.forEach((p: any) => { pm[p.user_id] = { full_name: p.full_name, profile_pic_url: p.profile_pic_url || p.profile_pic }; });
        setProfileMap(pm);
      }
    } catch (e) {
      console.error("Failed to fetch hierarchy data", e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshKey]);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[700px] flex justify-center py-4">
        <TreeBranch role="patron" roleMap={roleMap} profileMap={profileMap} />
      </div>
    </div>
  );
}
