import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Bell, BellRing, Check, CheckCheck, Trash2, Search, Filter, 
  Send, MessageSquare, ArrowUpRight, DollarSign, Calendar, 
  AlertTriangle, Users, Shield, Clock, FileText, Vote, 
  Sparkles, RefreshCw, Layers, CheckCircle2, XCircle, Info
} from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

interface NotificationItem {
  id: string | number;
  user?: number | null;
  user_id?: string | number;
  sender_id?: string;
  sender_name?: string;
  owner_role?: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  read: boolean;
  created_at: string;
  feedback?: string | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 120, damping: 15 } }
};

export default function NotificationsPage() {
  const { user, roles, hasPermission } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'unread' | 'finance' | 'meeting' | 'voice' | 'system'
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Send Notification Dialog State
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendTargetType, setSendTargetType] = useState<"broadcast" | "role" | "user">("broadcast");
  const [targetRole, setTargetRole] = useState("councillor");
  const [targetUserId, setTargetUserId] = useState("");
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [newNotifTitle, setNewNotifTitle] = useState("");
  const [newNotifMessage, setNewNotifMessage] = useState("");
  const [newNotifType, setNewNotifType] = useState("info");

  // Feedback Dialog State
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data } = await api.get("/notifications/", { params: { limit: 100 } });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setNotifications(list.map((n: any) => ({ ...n, read: n.is_read !== undefined ? n.is_read : n.read })));
    } catch (e) {
      console.error("Failed to load notifications", e);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersList = async () => {
    try {
      const { data } = await api.get("/users/all/");
      setAvailableUsers(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      // Fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUsersList();
  }, [user]);

  // Mark single as read / unread
  const handleToggleRead = async (n: NotificationItem) => {
    const newReadState = !n.read;
    try {
      await api.patch(`/notifications/${n.id}/`, {
        read: newReadState,
        is_read: newReadState
      });
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: newReadState, is_read: newReadState } : x));
      toast.success(newReadState ? "Marked as read" : "Marked as unread");
    } catch (e) {
      toast.error("Failed to update notification state");
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.post("/notifications/mark-all-read/");
      setNotifications(prev => prev.map(n => ({ ...n, read: true, is_read: true })));
      toast.success("All notifications marked as read");
    } catch (e) {
      toast.error("Failed to mark all as read");
    }
  };

  // Clear all read
  const handleClearRead = async () => {
    try {
      await api.post("/notifications/clear-read/");
      setNotifications(prev => prev.filter(n => !n.read));
      toast.success("Cleared all read notifications");
    } catch (e) {
      toast.error("Failed to clear read notifications");
    }
  };

  // Delete single notification
  const handleDeleteNotification = async (id: string | number) => {
    try {
      await api.delete(`/notifications/${id}/`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success("Notification dismissed");
    } catch (e) {
      toast.error("Failed to delete notification");
    }
  };

  // Smart route resolver for notification destination
  const resolveRouteInfo = (n: NotificationItem) => {
    const t = (n.type || "").toLowerCase();
    const combined = ((n.title || "") + " " + (n.message || "")).toLowerCase();

    if (combined.includes("subscription") || combined.includes("revenue") || combined.includes("income")) {
      return { path: "/portal/income", label: "View Finance / Subscriptions", icon: DollarSign, category: "finance" };
    }
    if (combined.includes("requisition")) {
      return { path: "/portal/requisitions", label: "View Requisition Docket", icon: DollarSign, category: "finance" };
    }
    if (t === "meeting" || combined.includes("meeting") || combined.includes("patron")) {
      return { path: "/portal/programmes", label: "View Programme Schedule", icon: Calendar, category: "meeting" };
    }
    if (combined.includes("programme") || combined.includes("event") || combined.includes("calendar")) {
      return { path: "/portal/programmes", label: "Open Event Calendar", icon: Calendar, category: "meeting" };
    }
    if (combined.includes("student voice") || combined.includes("submission") || combined.includes("issue")) {
      return { path: "/portal/student-voices", label: "Review Student Voices", icon: MessageSquare, category: "voice" };
    }
    if (combined.includes("disciplinary") || combined.includes("offence") || combined.includes("hearing")) {
      return { path: "/portal/disciplinary", label: "View Disciplinary Hearing", icon: Shield, category: "voice" };
    }
    if (combined.includes("election") || combined.includes("vote") || combined.includes("candidate")) {
      return { path: "/portal/elections", label: "Open Election Center", icon: Vote, category: "system" };
    }
    if (combined.includes("report") || combined.includes("monthly")) {
      return { path: "/portal/reports", label: "View Reports Tracker", icon: FileText, category: "system" };
    }
    if (combined.includes("rota") || combined.includes("assembly")) {
      return { path: "/portal/rota", label: "Check Duty Rota", icon: Users, category: "meeting" };
    }
    if (combined.includes("document") || combined.includes("minutes")) {
      return { path: "/portal/documents", label: "Open Documents Repository", icon: FileText, category: "system" };
    }
    return null;
  };

  // Submit Feedback / Reply
  const handleSubmitFeedback = async () => {
    if (!selectedNotif || !feedbackText.trim()) return;
    setIsSubmittingFeedback(true);
    try {
      await api.patch(`/notifications/${selectedNotif.id}/`, {
        feedback: feedbackText,
        read: true,
        is_read: true
      });

      if (selectedNotif.sender_id) {
        await api.post("/notifications/", {
          user_id: selectedNotif.sender_id,
          title: "💬 Response to Notification",
          message: `Official feedback regarding "${selectedNotif.title}": "${feedbackText}"`,
          type: "info"
        });
      }

      toast.success("Feedback & response submitted");
      setSelectedNotif(null);
      setFeedbackText("");
      fetchNotifications();
    } catch (e) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  // Send New Notification
  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotifTitle.trim() || !newNotifMessage.trim()) {
      toast.error("Please enter a title and message");
      return;
    }

    setIsSending(true);
    try {
      let payload: any = {
        title: newNotifTitle,
        message: newNotifMessage,
        type: newNotifType,
        sender_id: user?.id?.toString()
      };

      if (sendTargetType === "broadcast") {
        await api.post("/notifications/all/", payload);
        toast.success("Broadcast announcement sent to all council members!");
      } else if (sendTargetType === "role") {
        payload.user_id = `role:${targetRole}`;
        const { data } = await api.post("/notifications/", payload);
        toast.success(data.message || `Dispatched to role: ${targetRole}`);
      } else if (sendTargetType === "user") {
        if (!targetUserId) {
          toast.error("Please select a recipient user");
          setIsSending(false);
          return;
        }
        payload.user_id = targetUserId;
        await api.post("/notifications/", payload);
        toast.success("Notification sent to user!");
      }

      setIsSendDialogOpen(false);
      setNewNotifTitle("");
      setNewNotifMessage("");
      fetchNotifications();
    } catch (e) {
      toast.error("Failed to dispatch notification");
    } finally {
      setIsSending(false);
    }
  };

  // --- FILTERING ---
  const filteredNotifications = notifications.filter(n => {
    const routeInfo = resolveRouteInfo(n);
    const combinedText = ((n.title || "") + " " + (n.message || "") + " " + (n.sender_name || "")).toLowerCase();
    const matchesSearch = combinedText.includes(searchTerm.toLowerCase());

    // Category filter
    let matchesCat = true;
    if (categoryFilter === "unread") {
      matchesCat = !n.read;
    } else if (categoryFilter === "finance") {
      matchesCat = routeInfo?.category === "finance" || combinedText.includes("subscription") || combinedText.includes("requisition") || combinedText.includes("due");
    } else if (categoryFilter === "meeting") {
      matchesCat = routeInfo?.category === "meeting" || n.type === "meeting" || combinedText.includes("meeting") || combinedText.includes("programme");
    } else if (categoryFilter === "voice") {
      matchesCat = routeInfo?.category === "voice" || combinedText.includes("student voice") || combinedText.includes("disciplinary");
    } else if (categoryFilter === "system") {
      matchesCat = routeInfo?.category === "system" || combinedText.includes("version") || combinedText.includes("update") || combinedText.includes("election");
    }

    // Priority type filter
    const matchesPriority = priorityFilter === "all" ? true : n.type === priorityFilter;

    return matchesSearch && matchesCat && matchesPriority;
  });

  const totalCount = notifications.length;
  const unreadCount = notifications.filter(n => !n.read).length;
  const meetingCount = notifications.filter(n => n.type === "meeting" || (n.title && n.title.toLowerCase().includes("meeting"))).length;
  const financeCount = notifications.filter(n => {
    const text = ((n.title || "") + " " + (n.message || "")).toLowerCase();
    return text.includes("subscription") || text.includes("requisition") || text.includes("income") || text.includes("due");
  }).length;

  const typeStyles: Record<string, { badge: string; dot: string; icon: any }> = {
    info: { badge: "bg-sky-500/10 text-sky-600 border-sky-500/20", dot: "bg-sky-500", icon: Info },
    warning: { badge: "bg-amber-500/10 text-amber-600 border-amber-500/20", dot: "bg-amber-500", icon: AlertTriangle },
    success: { badge: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", dot: "bg-emerald-500", icon: CheckCircle2 },
    error: { badge: "bg-rose-500/10 text-rose-600 border-rose-500/20", dot: "bg-rose-500", icon: XCircle },
    meeting: { badge: "bg-purple-500/10 text-purple-600 border-purple-500/20", dot: "bg-purple-500", icon: Calendar },
  };

  const isPatronOrAdmin = roles.includes("patron") || roles.includes("adminabsolute") || roles.includes("chairperson");

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto space-y-8 pb-16 relative min-h-screen"
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
        <section className="space-y-2">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider w-fit"
          >
            <BellRing className="w-3.5 h-3.5" /> Communications & Alerts Hub
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
            Notifications Center
          </h1>
          <p className="text-muted-foreground/80 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Stay updated with financial due reminders, student voice resolutions, meeting approvals, and administrative broadcasts.
          </p>
        </section>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllRead}
              className="h-11 rounded-xl font-bold bg-background/50 border-border/50 backdrop-blur-xl text-xs hover:bg-muted/50"
            >
              <CheckCheck className="w-4 h-4 mr-2 text-emerald-600" /> Mark All Read
            </Button>
          )}

          {isPatronOrAdmin && (
            <Button
              onClick={() => setIsSendDialogOpen(true)}
              className="h-11 rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 text-xs px-5"
            >
              <Send className="w-3.5 h-3.5 mr-2" /> Send Announcement
            </Button>
          )}
        </div>
      </div>

      {/* Stat Summary Metrics */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          onClick={() => setCategoryFilter("all")}
          className={`rounded-2xl border-border/40 backdrop-blur-xl cursor-pointer transition-all hover:border-primary/40 ${
            categoryFilter === "all" ? "ring-2 ring-primary/30 bg-primary/5" : "bg-card/60"
          }`}
        >
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total In-Box</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-3xl font-serif font-black text-foreground">{totalCount}</h3>
              <Layers className="w-5 h-5 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setCategoryFilter("unread")}
          className={`rounded-2xl border-border/40 backdrop-blur-xl cursor-pointer transition-all hover:border-amber-500/40 ${
            categoryFilter === "unread" ? "ring-2 ring-amber-500/30 bg-amber-500/10" : "bg-card/60"
          }`}
        >
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700/80 dark:text-amber-400/80">Unread Alerts</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-3xl font-serif font-black text-amber-600 dark:text-amber-400">{unreadCount}</h3>
              <span className="relative flex h-3 w-3">
                {unreadCount > 0 && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </>
                )}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setCategoryFilter("finance")}
          className={`rounded-2xl border-border/40 backdrop-blur-xl cursor-pointer transition-all hover:border-emerald-500/40 ${
            categoryFilter === "finance" ? "ring-2 ring-emerald-500/30 bg-emerald-500/10" : "bg-card/60"
          }`}
        >
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/80">Finance & Dues</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-3xl font-serif font-black text-emerald-600 dark:text-emerald-400">{financeCount}</h3>
              <DollarSign className="w-5 h-5 text-emerald-500/40" />
            </div>
          </CardContent>
        </Card>

        <Card 
          onClick={() => setCategoryFilter("meeting")}
          className={`rounded-2xl border-border/40 backdrop-blur-xl cursor-pointer transition-all hover:border-purple-500/40 ${
            categoryFilter === "meeting" ? "ring-2 ring-purple-500/30 bg-purple-500/10" : "bg-card/60"
          }`}
        >
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-700/80 dark:text-purple-400/80">Meetings & Rotas</p>
            <div className="flex items-baseline justify-between mt-1">
              <h3 className="text-3xl font-serif font-black text-purple-600 dark:text-purple-400">{meetingCount}</h3>
              <Calendar className="w-5 h-5 text-purple-500/40" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filter and Search Navigation Bar */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Pill Filters */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-muted/40 backdrop-blur-xl border border-border/40 w-full sm:w-auto">
            {[
              { id: "all", label: "All" },
              { id: "unread", label: `Unread (${unreadCount})` },
              { id: "finance", label: "Finance & Dues" },
              { id: "meeting", label: "Meetings & Events" },
              { id: "voice", label: "Student Voices" },
              { id: "system", label: "System & Governance" },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  categoryFilter === tab.id
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Priority Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search alerts..."
                className="pl-9 h-10 bg-background/50 border-border/50 rounded-xl text-xs"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-10 text-xs w-[120px] rounded-xl bg-background/50 border-border/50">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning / Dues</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="success">Success</SelectItem>
              </SelectContent>
            </Select>

            {notifications.some(n => n.read) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearRead}
                className="h-10 rounded-xl text-xs text-muted-foreground hover:text-rose-600"
                title="Clear all read notifications"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Notifications List Feed */}
      <motion.div variants={itemVariants} className="space-y-3">
        {loading ? (
          <Card className="rounded-3xl border-border/40 p-12 text-center bg-card/40">
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-sm font-medium text-muted-foreground">Loading notifications feed...</p>
            </div>
          </Card>
        ) : filteredNotifications.length === 0 ? (
          <Card className="rounded-3xl border-border/40 p-12 text-center bg-card/40">
            <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Bell className="h-12 w-12 opacity-20 mb-2" />
              <h3 className="font-bold text-base text-foreground">No Notifications Found</h3>
              <p className="text-xs max-w-sm">
                {categoryFilter === "unread" 
                  ? "You have no unread notifications. You are all caught up!" 
                  : "No notifications matching your search and category filter."}
              </p>
            </div>
          </Card>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((item) => {
              const routeInfo = resolveRouteInfo(item);
              const style = typeStyles[item.type] || typeStyles.info;
              const IconComp = style.icon;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-5 rounded-3xl border transition-all relative overflow-hidden group ${
                    !item.read 
                      ? "bg-card border-primary/30 shadow-md shadow-primary/5" 
                      : "bg-card/50 border-border/40 opacity-85 hover:opacity-100 hover:border-border/80"
                  }`}
                >
                  {/* Unread Left Border Accent */}
                  {!item.read && (
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary rounded-l-full" />
                  )}

                  <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Left: Icon & Content */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      <div className={`p-2.5 rounded-2xl shrink-0 mt-0.5 ${style.badge}`}>
                        <IconComp className="w-5 h-5" />
                      </div>

                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-base text-foreground leading-snug">
                            {item.title}
                          </h4>
                          <Badge variant="outline" className={`text-[10px] font-bold uppercase tracking-wider py-0 px-2 ${style.badge}`}>
                            {item.type}
                          </Badge>
                          {!item.read && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-primary text-primary-foreground">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground/90 leading-relaxed whitespace-pre-line font-medium">
                          {item.message}
                        </p>

                        {/* Patron / Official Feedback Box */}
                        {item.feedback && (
                          <div className="mt-2.5 p-3 rounded-2xl bg-muted/40 border border-border/40 text-xs text-muted-foreground space-y-1">
                            <span className="font-bold text-foreground text-[10px] uppercase tracking-wider flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-primary" /> Official Response / Notes:
                            </span>
                            <p className="italic">{item.feedback}</p>
                          </div>
                        )}

                        {/* Metadata Footer */}
                        <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground pt-1.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground/60" />
                            {item.created_at ? formatDistanceToNow(new Date(item.created_at), { addSuffix: true }) : "Recently"}
                          </span>

                          {item.sender_name && (
                            <span className="flex items-center gap-1">
                              <Shield className="w-3 h-3 text-muted-foreground/60" />
                              From: <strong>{item.sender_name}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Quick Action Controls */}
                    <div className="flex flex-wrap sm:flex-col items-end gap-2 shrink-0 self-end sm:self-start">
                      {/* Deep Link Button */}
                      {routeInfo && (
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!item.read) handleToggleRead(item);
                            navigate(routeInfo.path);
                          }}
                          className="h-8 rounded-xl text-xs font-bold bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground border border-primary/20 shadow-sm gap-1.5"
                        >
                          <span>{routeInfo.label}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      )}

                      <div className="flex items-center gap-1.5">
                        {/* Patron Feedback button for meeting requests */}
                        {item.type === "meeting" && isPatronOrAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedNotif(item);
                              setFeedbackText(item.feedback || "");
                            }}
                            className="h-8 rounded-xl text-xs font-bold text-primary border-primary/30 hover:bg-primary/10"
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            {item.feedback ? "Edit Reply" : "Reply"}
                          </Button>
                        )}

                        {/* Mark Read Toggle */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleRead(item)}
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground"
                          title={item.read ? "Mark as Unread" : "Mark as Read"}
                        >
                          {item.read ? <CheckCheck className="w-4 h-4 text-muted-foreground/60" /> : <Check className="w-4 h-4 text-emerald-600" />}
                        </Button>

                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteNotification(item.id)}
                          className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
                          title="Dismiss / Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: SEND NOTIFICATION / ANNOUNCEMENT */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
        <DialogContent className="max-w-lg rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
          <div className="p-6 bg-primary/5 border-b border-border/20">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                <Send className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl font-black text-foreground">
                  Dispatch Council Notification
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Broadcast school-wide announcements, role-targeted directives, or personal chits.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="p-6 max-h-[75vh] overflow-y-auto">
            <form onSubmit={handleSendNotification} className="space-y-4">
              {/* Target Audience */}
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Recipient Target *
                </Label>
                <Select 
                  value={sendTargetType} 
                  onValueChange={(val: any) => setSendTargetType(val)}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs font-semibold">
                    <SelectValue placeholder="Select target audience" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="broadcast">📢 Broadcast to All Council Members</SelectItem>
                    <SelectItem value="role">👥 Specific Council Role / Docket</SelectItem>
                    <SelectItem value="user">👤 Individual Member / Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Role Picker */}
              {sendTargetType === "role" && (
                <div className="space-y-2">
                  <Label htmlFor="target_role" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Select Council Role *
                  </Label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger id="target_role" className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="councillor">Stream Councillors</SelectItem>
                      <SelectItem value="secretary_finance">Finance Secretary</SelectItem>
                      <SelectItem value="secretary_welfare">Welfare Secretary</SelectItem>
                      <SelectItem value="secretary_health">Health Secretary</SelectItem>
                      <SelectItem value="general_secretary">General Secretary</SelectItem>
                      <SelectItem value="disciplinary_committee">Disciplinary Committee</SelectItem>
                      <SelectItem value="electoral_commission">Electoral Commission</SelectItem>
                      <SelectItem value="patron">School Patron</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* User Picker */}
              {sendTargetType === "user" && (
                <div className="space-y-2">
                  <Label htmlFor="target_user" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Select Individual Recipient *
                  </Label>
                  <Select value={targetUserId} onValueChange={setTargetUserId}>
                    <SelectTrigger id="target_user" className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs">
                      <SelectValue placeholder="Choose a member" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-56">
                      {availableUsers.map(u => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          {u.profile?.full_name || u.username} ({u.roles?.[0]?.replace('_', ' ') || 'Member'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title & Priority Type */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="notif_title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Headline / Title *
                  </Label>
                  <Input
                    id="notif_title"
                    className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs font-semibold"
                    placeholder="e.g. Urgent Assembly Duty Briefing"
                    value={newNotifTitle}
                    onChange={e => setNewNotifTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notif_type" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Category *
                  </Label>
                  <Select value={newNotifType} onValueChange={setNewNotifType}>
                    <SelectTrigger id="notif_type" className="h-11 rounded-xl bg-muted/30 border-border/50 text-xs">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="warning">Warning / Dues</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <Label htmlFor="notif_msg" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Announcement Body *
                </Label>
                <Textarea
                  id="notif_msg"
                  rows={4}
                  className="rounded-xl bg-muted/30 border-border/50 text-xs resize-none leading-relaxed"
                  placeholder="Type the full message content or directives..."
                  value={newNotifMessage}
                  onChange={e => setNewNotifMessage(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <Button 
                  type="button" 
                  variant="outline" 
                  className="h-11 rounded-xl text-xs"
                  onClick={() => setIsSendDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSending}
                  className="h-11 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg shadow-primary/20 text-xs px-6 gap-2"
                >
                  {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {isSending ? "Dispatching..." : "Send Announcement"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: PATRON / OFFICER FEEDBACK RESPONSE */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedNotif} onOpenChange={open => !open && setSelectedNotif(null)}>
        <DialogContent className="max-w-md rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
          <div className="p-6 bg-primary/5 border-b border-border/20">
            <DialogTitle className="font-serif text-xl font-black">
              Meeting / Query Response
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Submit your remarks or confirmed schedule. The requesting official will be notified.
            </DialogDescription>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/40 text-xs space-y-1">
              <span className="font-bold text-foreground block">Original Request:</span>
              <p className="text-muted-foreground">{selectedNotif?.message}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fb_text" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Your Response / Decision *
              </Label>
              <Textarea
                id="fb_text"
                rows={4}
                className="rounded-xl bg-muted/30 border-border/50 text-xs resize-none leading-relaxed"
                placeholder="e.g. Confirmed for Thursday 4:30 PM in Patron's office. Please bring the docket review sheets."
                value={feedbackText}
                onChange={e => setFeedbackText(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="p-4 bg-muted/20 border-t border-border/20 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-xl text-xs"
              onClick={() => setSelectedNotif(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isSubmittingFeedback || !feedbackText.trim()}
              onClick={handleSubmitFeedback}
              className="h-10 rounded-xl font-bold bg-primary text-primary-foreground text-xs px-5 gap-2"
            >
              {isSubmittingFeedback ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {isSubmittingFeedback ? "Sending..." : "Submit Response"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
