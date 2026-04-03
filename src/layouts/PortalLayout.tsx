import React, { useState, useEffect } from "react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarTrigger } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, FileText, Vote, MessageSquare, Scale, Calendar, LogOut, Settings, Bell, ChevronDown, CheckCheck, Inbox } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/api";
import { toast } from "sonner";

const navItems = [
  { title: "Dashboard", url: "/portal", icon: LayoutDashboard, roles: ["all"] },
  { title: "Student Voices", url: "/portal/voices", icon: MessageSquare, roles: ["all"] },
  { title: "Elections", url: "/portal/elections", icon: Vote, roles: ["all"] },
  { title: "Cabinet & Hierarchy", url: "/portal/hierarchy", icon: Users, roles: ["all"] },
  { title: "Documents Archive", url: "/portal/documents", icon: FileText, roles: ["all"] },
  { title: "Disciplinary", url: "/portal/disciplinary", icon: Scale, roles: ["all"] },
  { title: "Programme/Events", url: "/portal/programmes", icon: Calendar, roles: ["all"] },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, roles, signOut, hasRole, isAbsoluteAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get("/notifications/");
      const items = data.results || [];
      setNotifications(items);
      setUnreadCount(items.filter((n: any) => !n.read).length);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling for simulation
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/`, { read: true });
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
       const unread = notifications.filter(n => !n.read);
       await Promise.all(unread.map(n => api.patch(`/notifications/${n.id}/`, { read: true })));
       toast.success("All notifications cleared");
       fetchNotifications();
    } catch (e) {
       toast.error("Failed to clear notifications");
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  // Visibility logic for sidebar links
  const filteredNavItems = navItems.filter((item) => {
    if (item.roles.includes("all")) return true;
    if (isAbsoluteAdmin) return true;
    return item.roles.some((role) => hasRole(role));
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-slate-50/50">
        <Sidebar className="border-r border-slate-200 shadow-sm" collapsible="icon">
          <SidebarHeader className="p-4 border-b border-slate-100 bg-white">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                <span className="font-serif text-xl font-bold text-white">M</span>
              </div>
              <div className="flex flex-col truncate group-data-[collapsible=icon]:hidden">
                <span className="font-serif text-sm font-bold text-slate-900">MCH Portal</span>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Connect Hub</span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2 gap-4 bg-white">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-data-[collapsible=icon]:hidden">
                Navigation
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        isActive={location.pathname === item.url}
                        className={`transition-all duration-200 hover:bg-slate-50 ${
                          location.pathname === item.url 
                            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90" 
                            : "text-slate-600 hover:text-primary"
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-slate-100 bg-white group-data-[collapsible=icon]:p-2">
            <div className="space-y-2 group-data-[collapsible=icon]:hidden">
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="w-full justify-start text-slate-500 hover:text-destructive hover:bg-destructive/5"
                 onClick={handleLogout}
               >
                 <LogOut className="mr-2 h-4 w-4" /> Logout
               </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Dashboard Top Header */}
          <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
            <div className="flex items-center gap-4">
               <SidebarTrigger className="text-slate-600 hover:text-primary transition-colors" />
               <div className="h-6 w-[1px] bg-slate-200 hidden sm:block"></div>
               <h2 className="text-sm font-semibold text-slate-500 hidden sm:block">
                 {navItems.find(i => i.url === location.pathname)?.title || "Portal"}
               </h2>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Notifications Center */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="ghost" size="icon" className="relative text-slate-500 hover:bg-slate-50 transition-colors">
                     <Bell className="h-5 w-5" />
                     {unreadCount > 0 && (
                       <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[9px] bg-primary border-2 border-white animate-pulse">
                         {unreadCount}
                       </Badge>
                     )}
                   </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[320px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden mt-2">
                   <div className="p-4 bg-primary text-white flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm">Notifications</h4>
                        <p className="text-[10px] opacity-80 uppercase tracking-widest">{unreadCount} unread alerts</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/20 text-white" onClick={markAllAsRead} title="Clear all">
                        <CheckCheck className="h-4 w-4" />
                      </Button>
                   </div>
                   <ScrollArea className="h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-12 text-center">
                           <Inbox className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                           <p className="text-xs text-slate-400 italic">No activity yet.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-50">
                          {notifications.map((n) => (
                            <div 
                              key={n.id} 
                              className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative ${!n.read ? 'bg-blue-50/30' : ''}`}
                              onClick={() => markAsRead(n.id)}
                            >
                               {!n.read && <div className="absolute left-1 top-5 w-1.5 h-1.5 bg-primary rounded-full"></div>}
                               <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className={`text-xs ${!n.read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>{n.title}</p>
                                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{n.message}</p>
                                    <p className="text-[9px] text-slate-400 mt-2 uppercase tracking-tighter">
                                      {new Date(n.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                                    </p>
                                  </div>
                               </div>
                            </div>
                          ))}
                        </div>
                      )}
                   </ScrollArea>
                   <div className="p-3 bg-slate-50 text-center border-t border-slate-100">
                      <Button variant="link" size="sm" className="text-[10px] h-auto p-0 text-slate-500 font-bold uppercase tracking-widest hover:text-primary">
                        View All Activity History
                      </Button>
                   </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-0 hover:bg-transparent flex items-center gap-2 group">
                    <Avatar className="h-9 w-9 border-2 border-white shadow-sm ring-1 ring-slate-100 group-hover:ring-primary/30 transition-all">
                      <AvatarImage src={profile?.profile_pic || ""} />
                      <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold ring-inset">
                        {profile?.full_name?.split(" ").map(n => n[0]).join("") || "??"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start truncate max-w-[120px]">
                       <span className="text-xs font-bold text-slate-900 truncate leading-tight">{profile?.full_name}</span>
                       <span className="text-[9px] text-slate-500 font-medium uppercase tracking-tighter">{isAbsoluteAdmin ? "Overseer" : roles?.[0] || "Council Member"}</span>
                    </div>
                    <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-primary transition-colors mt-0.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-1 border-slate-100 shadow-xl rounded-xl">
                  <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-2">My Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate("/portal/settings")} className="rounded-lg cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-50" />
                  <DropdownMenuItem onClick={handleLogout} className="rounded-lg text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer font-bold">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main Content Area */}
          <ScrollArea className="flex-1 bg-slate-50/50">
            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
              {children}
            </div>
          </ScrollArea>
        </main>
      </div>
    </SidebarProvider>
  );
}
