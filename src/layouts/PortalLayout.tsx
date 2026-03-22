import { LayoutDashboard, Calendar, FileText, AlertTriangle, Users, Settings, MessageSquare, DollarSign, Vote } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import mengoBadge from "@/assets/mengo-badge.jpg";

const sidebarLinks = [
  { label: "Dashboard", path: "/portal", icon: LayoutDashboard },
  { label: "Student Voices", path: "/portal/student-voices", icon: MessageSquare },
  { label: "Issues", path: "/portal/issues", icon: AlertTriangle },
  { label: "Programmes", path: "/portal/programmes", icon: Calendar },
  { label: "Rota", path: "/portal/rota", icon: Users },
  { label: "Documents", path: "/portal/documents", icon: FileText },
  { label: "Requisitions", path: "/portal/requisitions", icon: DollarSign },
  { label: "Elections", path: "/portal/elections", icon: Vote },
  { label: "Settings", path: "/portal/settings", icon: Settings },
];

export default function PortalLayout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <img src={mengoBadge} alt="Crest" className="h-8 w-8 rounded-full object-cover" />
          <span className="font-serif text-sm font-bold text-sidebar-foreground">Mengo Council</span>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {sidebarLinks.map((l) => (
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
      </aside>

      {/* Main content */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <h2 className="font-serif text-lg font-semibold text-foreground">Councillor Portal</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/">← Back to Site</Link>
          </Button>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
