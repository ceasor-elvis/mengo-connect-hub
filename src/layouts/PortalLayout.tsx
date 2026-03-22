import { useEffect } from "react";
import {
  LayoutDashboard, Calendar, FileText, AlertTriangle, Users,
  MessageSquare, DollarSign, Vote, LogOut, Shield, Heart,
  Stethoscope, Megaphone, Accessibility, User,
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { useAuth } from "@/hooks/useAuth";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles?: AppRole[]; // if empty → all councillors can see
}

const sidebarLinks: NavItem[] = [
  { label: "Dashboard", path: "/portal", icon: LayoutDashboard },
  { label: "Student Voices", path: "/portal/student-voices", icon: MessageSquare,
    roles: ["patron", "chairperson", "general_secretary", "assistant_general_secretary"] },
  { label: "Issues", path: "/portal/issues", icon: AlertTriangle },
  { label: "Programmes", path: "/portal/programmes", icon: Calendar },
  { label: "Rota", path: "/portal/rota", icon: Users },
  { label: "Documents", path: "/portal/documents", icon: FileText },
  { label: "Requisitions", path: "/portal/requisitions", icon: DollarSign,
    roles: ["patron", "chairperson", "secretary_finance"] },
  { label: "Elections", path: "/portal/elections", icon: Vote,
    roles: ["patron", "chairperson", "speaker", "electoral_commission"] },
];

const ROLE_LABELS: Record<AppRole, string> = {
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
};

export default function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, roles, loading, hasAnyRole, signOut } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!user) return null;

  const visibleLinks = sidebarLinks.filter(
    (l) => !l.roles || hasAnyRole(l.roles) || roles.length === 0
  );

  const roleLabel = roles.length > 0 ? ROLE_LABELS[roles[0]] : "Councillor";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <img src={mengoBadge} alt="Crest" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-serif text-sm font-bold text-sidebar-foreground">Mengo Council</span>
        </div>

        {/* User info */}
        <div className="border-b border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={profile?.profile_pic_url || ""} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {(profile?.full_name || user.email || "U").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {profile?.full_name || user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {visibleLinks.map((l) => (
            <Button
              key={l.path}
              variant={location.pathname === l.path ? "default" : "ghost"}
              className={`w-full justify-start ${location.pathname !== l.path ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" : ""}`}
              asChild
            >
              <Link to={l.path}>
                <l.icon className="mr-2 h-4 w-4" />
                {l.label}
              </Link>
            </Button>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <Button variant="ghost" className="w-full justify-start text-sidebar-foreground" onClick={async () => { await signOut(); navigate("/"); }}>
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src={mengoBadge} alt="Crest" className="h-8 w-8 rounded-full object-cover md:hidden" />
            <h2 className="font-serif text-lg font-semibold text-foreground">Councillor Portal</h2>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">← Site</Link>
            </Button>
            <Button variant="ghost" size="sm" className="md:hidden" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex overflow-x-auto border-b bg-background px-2 md:hidden">
          {visibleLinks.map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs whitespace-nowrap ${
                location.pathname === l.path ? "text-primary border-b-2 border-primary" : "text-muted-foreground"
              }`}
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </Link>
          ))}
        </div>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
