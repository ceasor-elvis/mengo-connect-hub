import { useEffect, useState } from "react";
import {
  LayoutDashboard, Calendar, FileText, AlertTriangle, Users,
  MessageSquare, DollarSign, Vote, LogOut, Menu, X, Activity, Network, UserPlus, Lock, Settings, Scale, Shield, ShieldCheck,
  Target, Video, BarChart3, PiggyBank
} from "lucide-react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import NotificationsBell from "@/components/portal/NotificationsBell";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type AppRole = string;

interface NavItem {
  label: string;
  path: string;
  icon: any;
  roles?: AppRole[];
  permission?: string;
}

interface NavGroup {
  category: string;
  items: NavItem[];
}

const sidebarGroups: NavGroup[] = [
  {
    category: "Overview",
    items: [
      { label: "Dashboard", path: "/portal", icon: LayoutDashboard, permission: "view_dashboard" },
      { label: "Hierarchy Tree", path: "/portal/hierarchy", icon: Network, permission: "view_hierarchy" },
      { label: "Strategic Action Plan", path: "/portal/action-plan", icon: Target, permission: "view_action_plan" },
    ]
  },
  {
    category: "Council Engagement",
    items: [
      { label: "Student Voices", path: "/portal/student-voices", icon: MessageSquare, permission: "view_student_voices" },
      { label: "Issues Management", path: "/portal/issues", icon: AlertTriangle, permission: "view_issues" },
      { label: "Blog Manager", path: "/portal/blog", icon: FileText, permission: "view_blog" },
      { label: "Disciplinary Actions", path: "/portal/disciplinary", icon: Scale, permission: "view_disciplinary" },
    ]
  },
  {
    category: "Operations",
    items: [
      { label: "Programmes", path: "/portal/programmes", icon: Calendar, permission: "view_programmes" },
      { label: "Rota Management", path: "/portal/rota", icon: Users, permission: "view_rota" },
      { label: "Documents & Minutes", path: "/portal/documents", icon: FileText, permission: "view_documents" },
    ]
  },
  {
    category: "Finance",
    items: [
      { label: "Requisitions", path: "/portal/requisitions", icon: DollarSign, permission: "view_requisitions" },
      { label: "Income Registration", path: "/portal/income", icon: PiggyBank, permission: "view_financial_summary" },
      { label: "Financial Summary", path: "/portal/financial-summary", icon: BarChart3, permission: "view_financial_summary" },
    ]
  },
  {
    category: "Governance",
    items: [
      { label: "Elections", path: "/portal/elections", icon: Vote, permission: "view_elections" },
      { label: "Activity Logs", path: "/portal/logs", icon: Activity, permission: "view_logs" },
    ]
  },
  {
    category: "Administration",
    items: [
      { label: "Register Member", path: "/portal/register-member", icon: UserPlus, permission: "register_member" },
      { label: "Register Patron", path: "/portal/register-patron", icon: Shield, permission: "register_patron" },
      { label: "Home Layout", path: "/portal/home-layout", icon: Settings, permission: "manage_home_layout" },
      { label: "Feature Controls", path: "/portal/admin-absolute/features", icon: ShieldCheck, permission: "manage_permissions" },
    ]
  },
];

const ROLE_LABELS: Record<string, string> = {
  adminabsolute: "Admin Absolute", councillor: "Councillor",
  chairperson: "Chairperson", vice_chairperson: "Vice Chairperson",
  speaker: "Speaker", deputy_speaker: "Deputy Speaker", general_secretary: "General Secretary",
  assistant_general_secretary: "Asst. Gen. Secretary", secretary_finance: "Secretary Finance",
  secretary_welfare: "Secretary Welfare", secretary_health: "Secretary Health",
  secretary_women_affairs: "Secretary Women Affairs", secretary_publicity: "Secretary Publicity",
  secretary_pwd: "Secretary PWD", electoral_commission: "Electoral Commission",
  disciplinary_committee: "DP / Disciplinary Committee",
};

interface NavContentProps {
  profile: any;
  user: any;
  roleLabel: string;
  roles: string[];
  visibleGroups: NavGroup[];
  location: any;
  signOut: () => Promise<void>;
  navigate: (path: string, options?: any) => void;
}

const NavContent = ({ profile, user, roleLabel, roles, visibleGroups, location, signOut, navigate }: NavContentProps) => (
  <div className="flex flex-col h-full overflow-hidden">
    {/* User info */}
    <div className="border-b border-sidebar-border p-3 bg-sidebar-accent/5">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 border-2 border-primary/20">
          <AvatarImage src={profile?.profile_pic || ""} />
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {(profile?.full_name || "U").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground leading-none mb-1">{profile?.full_name || user.email}</p>
          <p className="truncate text-[10px] text-sidebar-foreground/60 font-medium">{roleLabel}</p>
          {roles.includes("adminabsolute") && (
            <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-black uppercase tracking-tighter">
              <ShieldCheck className="h-2.5 w-2.5" />
              Admin
            </div>
          )}
        </div>
      </div>
    </div>

    <ScrollArea className="flex-1 px-3 py-4">
      <div className="space-y-6">
        {visibleGroups.map((group) => (
          <div key={group.category} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-[0.2em] mb-2">
              {group.category}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((l) => {
                const isActive = location.pathname === l.path;
                return (
                  <Button
                    key={l.path}
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className={`w-full justify-start text-sm group relative transition-all duration-200 ${
                      isActive 
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm" 
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    }`}
                    asChild
                  >
                    <Link to={l.path}>
                      <l.icon className={`mr-2.5 h-4 w-4 transition-transform duration-200 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                      <span className="flex-1 text-left">{l.label}</span>
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 bg-primary rounded-full" />
                      )}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>

    <div className="border-t border-sidebar-border p-3 space-y-1 bg-sidebar-accent/5">
      <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground h-9" asChild>
        <Link to="/portal/settings">
          <Settings className="mr-2.5 h-4 w-4" /> Profile Settings
        </Link>
      </Button>
      <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/70 hover:bg-destructive/10 hover:text-destructive h-9" onClick={async () => { await signOut(); navigate("/"); }}>
        <LogOut className="mr-2.5 h-4 w-4" /> Sign Out
      </Button>
    </div>
  </div>
);

export default function PortalLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, roles, loading, hasAnyRole, hasPermission, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLocks, setActiveLocks] = useState<any[]>([]);

  // Meeting request state
  const canRequestMeeting = hasAnyRole(["chairperson", "vice_chairperson", "general_secretary"]);
  const [meetOpen, setMeetOpen] = useState(false);
  const [meetDate, setMeetDate] = useState("");
  const [meetTime, setMeetTime] = useState("");
  const [meetNote, setMeetNote] = useState("");
  const [meetSending, setMeetSending] = useState(false);

  const handleSendMeetingRequest = async () => {
    if (!meetDate || !meetTime) {
      toast.error("Please select a date and time");
      return;
    }
    setMeetSending(true);
    try {
      const senderName = profile?.full_name || "A councillor";
      const roleTitle = roles[0] ? (ROLE_LABELS[roles[0]] || roles[0]) : "Councillor";
      const formattedDate = new Date(`${meetDate}T${meetTime}`).toLocaleString("en-UG", {
        weekday: "short", day: "numeric", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      await api.post("/notifications/", {
        user_id: "role:patron",
        sender_id: user?.id,
        title: "📋 Meeting Request",
        message: `${senderName} (${roleTitle}) is requesting a meeting on ${formattedDate}.${meetNote ? " Note: " + meetNote : ""}`,
        type: "meeting"
      });
      toast.success("Meeting request sent to Patron!");
      setMeetOpen(false);
      setMeetDate(""); setMeetTime(""); setMeetNote("");
    } catch (e) {
      toast.error("Failed to send meeting request");
    } finally {
      setMeetSending(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) navigate("/login", { replace: true });
  }, [loading, user, navigate]);


  // Poll for active election locks
  useEffect(() => {
    if (!user) return;
    const fetchLocks = () => {
      api.get("/ec-access-locks/").then(({ data }) => {
         const locks = Array.isArray(data) ? data : data.results || [];
         setActiveLocks(locks);
      }).catch(console.error);
    };
    fetchLocks();
    const interval = setInterval(fetchLocks, 5000);
    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => { 
    setMobileOpen(false);
    // Explicitly scroll main content to top on navigation to avoid "persisted scroll" issue
    const mainContent = document.querySelector('main');
    if (mainContent) mainContent.scrollTop = 0;
  }, [location.pathname]);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground animate-pulse">Loading…</p>
    </div>
  );
  if (!user) return null;

  const visibleGroups = sidebarGroups.map(group => ({
    ...group,
    items: group.items.filter(l => {

      // Primary permission check
      if (l.permission && !hasPermission(l.permission)) return false;

      // Role fallback if permission not defined
      if (l.roles && !hasAnyRole(l.roles)) return false;

      return true;
    })
  })).filter(group => group.items.length > 0);

  const flatVisibleLinks = visibleGroups.flatMap(g => g.items);

  const roleLabel = roles.length > 0 ? ROLE_LABELS[roles[0]] : "Councillor";


  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-col border-r bg-sidebar lg:flex">
        <div className="flex h-12 items-center gap-2 border-b border-sidebar-border px-3">
          <img src={mengoBadge} alt="Crest" className="h-7 w-7 rounded-full object-cover" />
          <span className="font-serif text-[10px] font-bold text-sidebar-foreground">MENGO STUDENTS' COUNCIL BODY</span>
        </div>
        <NavContent 
          profile={profile}
          user={user}
          roleLabel={roleLabel}
          roles={roles}
          visibleGroups={visibleGroups}
          location={location}
          signOut={signOut}
          navigate={navigate}
        />
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
            <NavContent 
              profile={profile}
              user={user}
              roleLabel={roleLabel}
              roles={roles}
              visibleGroups={visibleGroups}
              location={location}
              signOut={signOut}
              navigate={navigate}
            />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {activeLocks.length > 0 && location.pathname !== "/portal/elections" && (
          <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-destructive font-medium">
              <Lock className="h-4 w-4" />
              <span>Screening is currently locked for {activeLocks.length} {activeLocks.length === 1 ? 'category' : 'categories'}.</span>
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
            {canRequestMeeting && (
              <Dialog open={meetOpen} onOpenChange={setMeetOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative group" title="Request Meeting with Patron">
                    <Video className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      Request Meeting with Patron
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    <p className="text-xs text-muted-foreground">
                      Send a meeting request notification to the School Patron with your preferred date and time.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Date *</Label>
                        <Input type="date" value={meetDate} onChange={e => setMeetDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Time *</Label>
                        <Input type="time" value={meetTime} onChange={e => setMeetTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Note (optional)</Label>
                      <Textarea
                        value={meetNote}
                        onChange={e => setMeetNote(e.target.value)}
                        placeholder="e.g. Regarding cafeteria improvement budget..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                    <Button onClick={handleSendMeetingRequest} disabled={meetSending} className="w-full">
                      <Video className="mr-2 h-4 w-4" />
                      {meetSending ? "Sending..." : "Send Meeting Request"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
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
          {flatVisibleLinks.slice(0, 5).map((l) => (
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
          {flatVisibleLinks.length > 5 && (
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
