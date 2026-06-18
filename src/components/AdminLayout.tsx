import { ReactNode, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  BarChart3, Settings, Hash, FileText, Timer, LogOut, Clock, Menu, X
} from "lucide-react";
import { useStoreSync, useCountdown } from "@/hooks/useApi";
import { useWsStatus } from "@/contexts/WsStatusContext";
import mengoLogo from "@/assets/mengo-logo.png";
import { motion, AnimatePresence } from "framer-motion";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  headerActions?: ReactNode;
}

const navItems = [
  { to: "/evote/admin", icon: BarChart3, label: "Dashboard", adminOnly: false },
  { to: "/evote/admin/manage", icon: Settings, label: "Manage", adminOnly: true },
  { to: "/evote/admin/codes", icon: Hash, label: "Codes", adminOnly: true },
  { to: "/evote/admin/timing", icon: Timer, label: "Settings", adminOnly: true },
  { to: "/evote/admin/reports", icon: FileText, label: "Reports", adminOnly: false },
];

const AdminLayout = ({ children, title, subtitle, headerActions }: AdminLayoutProps) => {
  const { isFullAdmin, logout } = useAdminAuth();
  const store = useStoreSync();
  const timeLeft = useCountdown(store.endTime);
  const { status: wsStatus } = useWsStatus();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const wsDotColor =
    wsStatus === "online"
      ? "bg-emerald-500"
      : wsStatus === "connecting"
      ? "bg-amber-400"
      : "bg-rose-500";

  const wsDotTitle =
    wsStatus === "online"
      ? "Connected — real-time updates active"
      : wsStatus === "connecting"
      ? "Connecting…"
      : "Offline — no real-time updates";

  const statusColor = store.state === "live"
    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
    : store.state === "paused"
    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
    : "bg-rose-500/10 text-rose-600 border-rose-500/20";

  const statusLabel = store.state === "live" ? "Live" : store.state === "paused" ? "Paused" : "Ended";

  const visibleNav = navItems.filter((item) => !item.adminOnly || isFullAdmin);

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden font-sans">
      
      {/* ── Mobile Sidebar Overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} print:hidden shadow-xl lg:shadow-none`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <img src={mengoLogo} alt="MSS" className="w-5 h-5 object-contain" />
              </div>
              <span
                title={wsDotTitle}
                className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-950 ${wsDotColor} ${
                  wsStatus === "online" ? "animate-pulse" : ""
                }`}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-slate-900 dark:text-white leading-none">Admin Portal</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-wider">Mengo Senior School</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {visibleNav.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/evote/admin" && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/evote/admin"}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive 
                    ? "bg-primary/10 text-primary font-semibold" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white font-medium"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-slate-400 dark:text-slate-500"}`} />
                <span className="text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 dark:hover:border-rose-500/30 transition-all font-bold text-sm shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 print:hidden shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight leading-tight">{title}</h1>
              {subtitle && <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">{subtitle}</p>}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono font-bold tracking-tight">{timeLeft}</span>
            </div>

            {/* Status badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${statusColor}`}>
              <span className="relative flex h-2 w-2">
                {store.state === "live" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${store.state === "live" ? "bg-emerald-500" : store.state === "paused" ? "bg-amber-500" : "bg-rose-500"}`}></span>
              </span>
              <span className="text-xs font-bold tracking-wide uppercase">{statusLabel}</span>
            </div>

            {/* Mobile Sign Out Button */}
            <button
              onClick={logout}
              className="lg:hidden flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {headerActions && (
              <div className="flex items-center ml-2 border-l border-slate-200 dark:border-slate-700 pl-4">
                {headerActions}
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 print:p-0 print:overflow-visible custom-scrollbar">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
