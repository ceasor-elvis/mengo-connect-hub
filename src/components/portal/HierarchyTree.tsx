import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Shield, UserCheck, Gavel, FileText, DollarSign, Heart, Stethoscope, Users, Megaphone, Accessibility, Vote } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface RoleNode {
  role: AppRole;
  label: string;
  icon: any;
  color: string;
  children: AppRole[];
}

const TREE: RoleNode[] = [
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
      <div className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium shadow-sm border ${node.color}`}>
        <Icon className="h-3.5 w-3.5 shrink-0" />
        <div className="text-center leading-tight">
          <p className="font-semibold text-[11px]">{node.label}</p>
          {profile ? (
            <p className="text-[9px] opacity-80">{profile.full_name}</p>
          ) : (
            <p className="text-[9px] opacity-60 italic">Vacant</p>
          )}
        </div>
      </div>
    </div>
  );
}

function TreeBranch({ role, roleMap, profileMap }: { role: AppRole; roleMap: RoleMap; profileMap: ProfileMap }) {
  const node = findNode(role);
  const children = node.children;

  return (
    <div className="flex flex-col items-center gap-1">
      <NodeCard node={node} roleMap={roleMap} profileMap={profileMap} />
      {children.length > 0 && (
        <>
          <div className="w-px h-3 bg-border" />
          <div className="relative flex justify-center">
            {children.length > 1 && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-px bg-border" 
                style={{ width: `${Math.min(children.length * 120, 600)}px` }} />
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

export default function HierarchyTree() {
  const [roleMap, setRoleMap] = useState<RoleMap>({});
  const [profileMap, setProfileMap] = useState<ProfileMap>({});

  useEffect(() => {
    (async () => {
      const [rolesRes, profilesRes] = await Promise.all([
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("profiles").select("user_id, full_name, profile_pic_url"),
      ]);
      if (rolesRes.data) {
        const rm: RoleMap = {};
        rolesRes.data.forEach((r) => { rm[r.role] = r.user_id; });
        setRoleMap(rm);
      }
      if (profilesRes.data) {
        const pm: ProfileMap = {};
        profilesRes.data.forEach((p) => { pm[p.user_id] = { full_name: p.full_name, profile_pic_url: p.profile_pic_url }; });
        setProfileMap(pm);
      }
    })();
  }, []);

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-[600px] flex justify-center py-4">
        <TreeBranch role="patron" roleMap={roleMap} profileMap={profileMap} />
      </div>
    </div>
  );
}
