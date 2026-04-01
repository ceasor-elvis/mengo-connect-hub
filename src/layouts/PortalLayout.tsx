import { useEffect, useState } from "react";
import {
  LayoutDashboard, Calendar, FileText, AlertTriangle, Users,
  MessageSquare, DollarSign, Vote, LogOut, Menu, X, Activity, Network, UserPlus, Lock, Settings
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import NotificationsBell from "@/components/portal/NotificationsBell";

type AppRole = string;

interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles?: AppRole[];
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
  { label: "Hierarchy", path: "/portal/hierarchy", icon: Network },
  { label: "Logs", path: "/portal/logs", icon: Activity,
    roles: ["patron", "chairperson", "speaker", "electoral_commission"] },
  { label: "Register Member", path: "/portal/register-member", icon: UserPlus,
    roles: ["chairperson"] },
  { label: "Blog Manager", path: "/portal/blog", icon: FileText,
    roles: ["chairperson", "secretary_publicity"] },
];

const ROLE_LABELS: Record<string, string> = {
  adminabsolute: "Admin Absolute", councillor: "Councillor",
  chairperson: "Chairperson", vice_chairperson: "Vice Chairperson",
  speaker: "Speaker", deputy_speaker: "Deputy Speaker", general_secretary: "General Secretary",
  assistant_general_secretary: "Asst. Gen. Secretary", secretary_finance: "Secretary Finance",
  secretary_welfare: "Secretary Welfare", secretary_health: "Secretary Health",
  secretary_women_affairs: "Secretary Women Affairs", secretary_publicity: "Secretary Publicity",
  secretary_pwd: "Secretary PWD", electoral_commission: "Electoral Commission",
};

export default function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, roles, loading, hasAnyRole, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ecGranted, setEcGranted] = useState(false);
  const [activeLocks, setActiveLocks] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);

  // Check if user has EC access grant
  useEffect(() => {
    if (!user) return;
    api.get("/ec-access-grants/", { params: { granted_to: user.id } }).then(({ data }) => {
      const grants = Array.isArray(data) ? data : data.results || [];
      // either the API filters by `granted_to` or we verify locally just in case
      if (grants.some((g: any) => g.granted_to === user.id)) setEcGranted(true);
    }).catch(console.error);
  }, [user]);

  // Poll for active election locks
  useEffect(() => {
    if (!user) return;
    const fetchLocks = () => {
      api.get("/election-locks/").then(({ data }) => {
         const locks = Array.isArray(data) ? data : data.results || [];
         setActiveLocks(locks);
      }).catch(console.error);
    };
    fetchLocks();
    const interval = setInterval(fetchLocks, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Loading…</p>
    </div>
  );
  if (!user) return null;

  const visibleLinks = sidebarLinks.filter((l) => {
    if (roles.includes("patron") && !["Dashboard", "Student Voices", "Programmes", "Documents", "Requisitions"].includes(l.label)) {
      return false;
    }
    if (!l.roles) return true;
    if (hasAnyRole(l.roles)) return true;
    // EC access delegation
    if (l.path === "/portal/elections" && ecGranted) return true;
    return false;
  });

  const roleLabel = roles.length > 0 ? ROLE_LABELS[roles[0]] : "Councillor";

  const NavContent = () => (
    <>
      {/* User info */}
      <div className="border-b border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profile_pic || ""} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
              {(profile?.full_name || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-sidebar-foreground">{profile?.full_name || user.email}</p>
            <p className="truncate text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {visibleLinks.map((l) => (
          <Button
            key={l.path}
            variant={location.pathname === l.path ? "default" : "ghost"}
            size="sm"
            className={`w-full justify-start text-sm relative ${location.pathname !== l.path ? "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" : ""}`}
            asChild
          >
            <Link to={l.path}>
              <l.icon className="mr-2 h-4 w-4" />
              <span className="flex-1 text-left">{l.label}</span>
              {l.label === "Elections" && activeLocks.length > 0 && (
                <Badge variant="destructive" className="ml-auto rounded-full px-1.5 py-0 text-[10px]">
                  <Lock className="h-3 w-3 mr-1" /> {activeLocks.length}
                </Badge>
              )}
            </Link>
          </Button>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2 space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground relative hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" asChild>
          <Link to="/portal?tab=profile">
            <Settings className="mr-2 h-4 w-4" /> Profile Settings
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive" onClick={async () => { await signOut(); navigate("/"); }}>
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-12 items-center gap-2 border-b border-sidebar-border px-3">
          <img src={mengoBadge} alt="Crest" className="h-7 w-7 rounded-full object-cover" />
          <span className="font-serif text-[10px] font-bold text-sidebar-foreground">MENGO STUDENTS' COUNCIL BODY</span>
        </div>
        <NavContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar flex flex-col">
            <div className="flex h-12 items-center justify-between border-b border-sidebar-border px-3">
              <div className="flex items-center gap-2">
                <img src={mengoBadge} alt="Crest" className="h-7 w-7 rounded-full object-cover" />
                <span className="font-serif text-[10px] font-bold text-sidebar-foreground">MENGO STUDENTS' COUNCIL BODY</span>
              </div>
              <Button variant="ghost" size="icon" className="text-sidebar-foreground h-8 w-8" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <NavContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {activeLocks.length > 0 && location.pathname !== "/portal/elections" && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-destructive font-medium">
              <Lock className="h-4 w-4" />
              <span>Election screening is currently locked.</span>
            </div>
            <Button size="sm" variant="link" className="text-destructive h-auto p-0" asChild>
               <Link to="/portal/elections">View Status &rarr;</Link>
            </Button>
          </div>
        )}
        {/* Top bar */}
        <header className="flex h-12 items-center justify-between border-b bg-background px-3 sm:px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setMobileOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="font-serif text-sm font-semibold text-foreground sm:text-base">Portal</h2>
          </div>
          <div className="flex items-center gap-1">
            <NotificationsBell />
            <Button variant="ghost" size="sm" className="text-xs h-8" asChild>
              <Link to="/">← Home</Link>
            </Button>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={async () => { await signOut(); navigate("/"); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <div className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-background lg:hidden">
          {visibleLinks.slice(0, 5).map((l) => (
            <Link
              key={l.path}
              to={l.path}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] ${
                location.pathname === l.path ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <l.icon className="h-4 w-4" />
              <span className="truncate max-w-[56px]">{l.label.split(" ")[0]}</span>
            </Link>
          ))}
          {visibleLinks.length > 5 && (
            <button
              onClick={() => setMobileOpen(true)}
              className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] text-muted-foreground"
            >
              <Menu className="h-4 w-4" />
              <span>More</span>
            </button>
          )}
        </div>

        <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
