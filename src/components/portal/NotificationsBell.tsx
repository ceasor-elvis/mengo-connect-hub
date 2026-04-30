import { useEffect, useState } from "react";
import { Bell, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Notification {
  id: string;
  user_id?: string;
  sender_id?: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  feedback?: string | null;
}

export default function NotificationsBell() {
  const { user, roles } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Resolve a route from the notification's type and title/message
  const resolveRoute = (n: Notification): string | null => {
    const t = (n.type || "").toLowerCase();
    const title = (n.title || "").toLowerCase();
    const msg = (n.message || "").toLowerCase();
    const combined = title + " " + msg;

    if (t === "meeting") return "/portal/programmes";
    if (combined.includes("requisition")) return "/portal/requisitions";
    if (combined.includes("programme") || combined.includes("event")) return "/portal/programmes";
    if (combined.includes("issue")) return "/portal/student-voices";
    if (combined.includes("application") || combined.includes("election")) return "/portal/elections";
    if (combined.includes("blog") || combined.includes("announcement")) return "/portal/blog";
    if (combined.includes("rota")) return "/portal/rota";
    if (combined.includes("document")) return "/portal/documents";
    if (combined.includes("gallery")) return "/portal/gallery";
    if (combined.includes("action plan")) return "/portal/action-plans";
    if (combined.includes("disciplinary")) return "/portal/dc-cases";
    if (combined.includes("report")) return "/portal/reports";
    return null; // no specific page — stay on current
  };

  const handleNotifClick = async (n: Notification) => {
    // Mark as read
    if (!n.read) {
      try { await api.patch(`/notifications/${n.id}/`, { read: true }); } catch {}
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    }
    // Navigate
    const route = resolveRoute(n);
    if (route) {
      setPopoverOpen(false);
      navigate(route);
    }
  };
  
  // Feedback state
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n) => n && !n.read).length : 0;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get("/notifications/", { params: { limit: 20 } });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setNotifications(list);
    } catch (e) {
      console.error("Failed to load notifications", e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    if (!user) return;
    try {
      await api.post("/notifications/mark-all-read/");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error("Failed to mark notifications as read", e);
    }
  };

  const handleGiveFeedback = (notification: Notification) => {
    setSelectedNotif(notification);
    setFeedbackText(notification.feedback || "");
    setPopoverOpen(false);
  };

  const submitFeedback = async () => {
    if (!selectedNotif || !feedbackText.trim()) return;
    setIsSubmitting(true);
    try {
      // 1. Update original notification
      await api.patch(`/notifications/${selectedNotif.id}/`, {
        feedback: feedbackText,
        read: true
      });

      // 2. Send notification to requester if sender_id exists
      if (selectedNotif.sender_id) {
        await api.post("/notifications/", {
          user_id: selectedNotif.sender_id,
          title: "💬 Meeting Response",
          message: `The Patron responded to your meeting request: "${feedbackText}"`,
          type: "info"
        });
      }

      toast.success("Feedback sent successfully");
      setSelectedNotif(null);
      setFeedbackText("");
      fetchNotifications();
    } catch (e) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeColors: Record<string, string> = {
    info: "bg-primary/10 text-primary",
    warning: "bg-accent/20 text-accent-foreground",
    success: "bg-green-100 text-green-800",
    error: "bg-destructive/10 text-destructive",
    meeting: "bg-amber-100 text-amber-800 border-amber-200",
  };

  const isPatron = roles.includes("patron") || roles.includes("adminabsolute");

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-8 w-8">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={markAllRead}>
                Mark all read
              </Button>
            )}
          </div>
          <ScrollArea className="h-72 w-full">
            {!Array.isArray(notifications) || notifications.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">No notifications yet</p>
            ) : (
              <div className="divide-y text-left">
                {(notifications as any[]).map((n) => {
                  if (!n) return null;
                  const route = resolveRoute(n);
                  return (
                    <div
                      key={n.id}
                      className={`px-3 py-2 transition-colors ${!n.read ? "bg-primary/5" : ""} ${route ? "cursor-pointer hover:bg-muted/60" : ""}`}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className={`text-[9px] mt-0.5 shrink-0 ${typeColors[n.type] || ""}`}>
                          {n.type}
                        </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground">{n.message}</p>
                        {n.feedback && (
                          <div className="mt-1 p-1.5 bg-muted rounded text-[9px] italic text-muted-foreground">
                            <span className="font-bold border-r pr-1 mr-1">Feedback</span>
                            {n.feedback}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[9px] text-muted-foreground">
                            {n.created_at ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true }) : "recently"}
                          </p>
                          {n.type === "meeting" && isPatron && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-5 py-0 px-1.5 text-[9px] text-primary"
                              onClick={() => handleGiveFeedback(n)}
                            >
                              <MessageSquare className="h-2 w-2 mr-1" />
                              {n.feedback ? "Edit Feedback" : "Give Feedback"}
                            </Button>
                          )}
                        </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      <Dialog open={!!selectedNotif} onOpenChange={(open) => !open && setSelectedNotif(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Meeting Feedback</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-2 bg-muted rounded-md text-[10px] text-muted-foreground">
              <p className="font-bold mb-1">Request Detail:</p>
              {selectedNotif?.message}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Your Response</label>
              <Textarea
                placeholder="Submit your feedback or response to this meeting request..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
                className="text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setSelectedNotif(null)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitFeedback} disabled={isSubmitting || !feedbackText.trim()}>
              {isSubmitting ? "Sending..." : "Submit Response"}
              <Send className="ml-2 h-3 w-3" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
