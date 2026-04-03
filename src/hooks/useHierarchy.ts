import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Shield, UserCheck, Gavel, FileText, DollarSign, Heart, Stethoscope, Users, Megaphone, Accessibility, Vote, User, LucideIcon } from "lucide-react";

export type AppRole = string;

export interface RoleNode {
  role: AppRole;
  label: string;
  iconName: string;
  color: string;
  children: AppRole[];
}

export const ICON_MAP: Record<string, LucideIcon> = {
  Shield, UserCheck, Gavel, FileText, DollarSign, Heart, Stethoscope, Users, Megaphone, Accessibility, Vote, User
};

export const DEFAULT_TREE: RoleNode[] = [
  { role: "patron", label: "Patron", iconName: "Shield", color: "bg-primary text-primary-foreground", children: ["chairperson"] },
  { role: "chairperson", label: "Chairperson", iconName: "UserCheck", color: "bg-primary text-primary-foreground", children: ["vice_chairperson", "general_secretary", "assistant_general_secretary", "speaker", "deputy_speaker", "disciplinary_committee"] },
  
  { role: "vice_chairperson", label: "Vice Chairperson", iconName: "UserCheck", color: "bg-accent text-accent-foreground", children: ["secretary_welfare", "secretary_health"] },
  { role: "secretary_welfare", label: "Welfare", iconName: "Heart", color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_health", label: "Health", iconName: "Stethoscope", color: "bg-muted text-muted-foreground", children: [] },

  { role: "general_secretary", label: "General Secretary", iconName: "FileText", color: "bg-accent text-accent-foreground", children: ["dpo", "secretary_publicity", "secretary_pwd", "secretary_women_affairs", "secretary_finance"] },
  { role: "assistant_general_secretary", label: "Asst. Gen. Secretary", iconName: "FileText", color: "bg-accent text-accent-foreground", children: [] },

  { role: "dpo", label: "DPO", iconName: "Users", color: "bg-primary text-primary-foreground", children: ["class_coordinators"] },
  { role: "secretary_publicity", label: "Publicity", iconName: "Megaphone", color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_pwd", label: "PWD", iconName: "Accessibility", color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_women_affairs", label: "Women Affairs", iconName: "Users", color: "bg-muted text-muted-foreground", children: [] },
  { role: "secretary_finance", label: "Finance", iconName: "DollarSign", color: "bg-muted text-muted-foreground", children: [] },
  
  { role: "class_coordinators", label: "Class Coordinators", iconName: "Users", color: "bg-muted text-muted-foreground", children: ["councillors"] },
  { role: "councillors", label: "Councilors", iconName: "User", color: "bg-muted text-muted-foreground", children: [] },

  { role: "speaker", label: "Speaker", iconName: "Gavel", color: "bg-accent text-accent-foreground", children: ["electoral_commission"] },
  { role: "electoral_commission", label: "Head of Electoral Comm", iconName: "Vote", color: "bg-muted text-muted-foreground", children: [] },
  
  { role: "deputy_speaker", label: "Deputy Speaker", iconName: "Gavel", color: "bg-accent text-accent-foreground", children: [] },

  { role: "disciplinary_committee", label: "Disciplinary", iconName: "Shield", color: "bg-accent text-accent-foreground", children: [] },
];

export function useHierarchy(refreshKey?: number) {
  const [tree, setTree] = useState<RoleNode[]>(DEFAULT_TREE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/hierarchy-tree/")
      .then((res) => {
        if (mounted && res.data && Array.isArray(res.data.results)) {
          setTree(res.data.results);
        } else if (mounted && res.data && Array.isArray(res.data)) {
           setTree(res.data);
        }
      })
      .catch((err) => {
        console.error("Failed to load custom hierarchy tree, using default.", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
      
    return () => { mounted = false; };
  }, [refreshKey]);

  return { tree, loading };
}
