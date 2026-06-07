import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bug, Lightbulb, MessageSquarePlus, MessageSquare, AlertCircle, CheckCircle2, Circle, Clock, CheckCircle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

interface Feedback {
  id: number;
  user_name: string;
  category: string;
  title: string;
  description: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function SystemFeedbackPage() {
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission("manage_system_updates") || user?.roles?.some(r => r === 'adminabsolute');
  
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    category: "Suggestion",
    title: "",
    description: ""
  });
  
  // Admin response state
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [adminStatus, setAdminStatus] = useState("In Progress");

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/system-feedback/");
      setFeedbackList(Array.isArray(data) ? data : data.results || []);
    } catch (error) {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/system-feedback/", formData);
      toast.success("Feedback submitted successfully");
      setIsDialogOpen(false);
      setFormData({ category: "Suggestion", title: "", description: "" });
      fetchFeedback();
    } catch (error) {
      toast.error("Failed to submit feedback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminUpdate = async () => {
    if (!selectedFeedback) return;
    
    try {
      await api.patch(`/system-feedback/${selectedFeedback.id}/`, {
        status: adminStatus,
        admin_response: adminResponse
      });
      toast.success("Feedback updated");
      setSelectedFeedback(null);
      fetchFeedback();
    } catch (error) {
      toast.error("Failed to update feedback");
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'In Progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Closed': return 'bg-muted/50 text-muted-foreground border-border/50';
      default: return 'bg-muted/50 text-muted-foreground border-border/50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Open': return <Circle className="h-3 w-3 mr-1" />;
      case 'In Progress': return <Clock className="h-3 w-3 mr-1" />;
      case 'Resolved': return <CheckCircle2 className="h-3 w-3 mr-1" />;
      case 'Closed': return <CheckCircle className="h-3 w-3 mr-1" />;
      default: return <Circle className="h-3 w-3 mr-1" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'Bug': return <Bug className="h-4 w-4 text-rose-500" />;
      case 'Feature': return <Lightbulb className="h-4 w-4 text-amber-500" />;
      default: return <MessageSquare className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto space-y-8 pb-12 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-rose-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-end">
        <section className="flex flex-col gap-2 relative flex-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider w-fit"
          >
            <MessageSquarePlus className="w-3 h-3" /> System Diagnostics
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
             Developer Feedback
          </h1>
          <p className="text-muted-foreground/80 mt-1 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
             Report bugs, suggest features, or provide feedback directly to the Absolute Admin engineers.
          </p>
        </section>

        {!isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-xl font-bold shadow-lg shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 text-white shrink-0">
                <MessageSquarePlus className="mr-2 h-5 w-5" /> Submit Feedback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
               <div className="p-6 border-b border-border/20 bg-indigo-500/5">
                 <DialogTitle className="font-serif text-2xl font-black text-indigo-600 flex items-center gap-2">
                   Submit System Feedback
                 </DialogTitle>
                 <DialogDescription className="mt-1">
                   Help us improve the MSS Council Hub by reporting issues or suggesting new ideas.
                 </DialogDescription>
               </div>
               <div className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Category</label>
                       <Select value={formData.category} onValueChange={(val) => setFormData({...formData, category: val})}>
                         <SelectTrigger className="h-11 bg-muted/30 border-border/50 rounded-xl">
                           <SelectValue />
                         </SelectTrigger>
                         <SelectContent className="rounded-xl">
                           <SelectItem value="Bug">Bug Report</SelectItem>
                           <SelectItem value="Feature">Feature Request</SelectItem>
                           <SelectItem value="Suggestion">General Suggestion</SelectItem>
                           <SelectItem value="Other">Other</SelectItem>
                         </SelectContent>
                       </Select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</label>
                       <Input 
                         placeholder="Short summary of the issue or idea" 
                         className="h-11 bg-muted/30 border-border/50 rounded-xl"
                         value={formData.title}
                         onChange={e => setFormData({...formData, title: e.target.value})}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</label>
                       <Textarea 
                         placeholder="Please provide as much detail as possible..." 
                         className="min-h-[120px] resize-none bg-muted/30 border-border/50 rounded-xl"
                         value={formData.description}
                         onChange={e => setFormData({...formData, description: e.target.value})}
                         required
                       />
                     </div>
                     <div className="flex justify-end pt-4 border-t border-border/40 mt-6">
                        <Button type="button" variant="ghost" className="mr-2 rounded-xl" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20">
                          {isSubmitting ? "Submitting..." : "Submit to Engineers"}
                        </Button>
                     </div>
                  </form>
               </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Admin Action Dialog */}
      <Dialog open={!!selectedFeedback} onOpenChange={(open) => !open && setSelectedFeedback(null)}>
         <DialogContent className="max-w-lg rounded-3xl border-border/40 bg-background/95 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
            <div className="p-6 border-b border-border/20 bg-muted/10">
               <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="outline" className={`mb-2 font-black tracking-widest uppercase text-[10px] ${getStatusColor(selectedFeedback?.status || '')}`}>
                      {getStatusIcon(selectedFeedback?.status || '')}
                      {selectedFeedback?.status}
                    </Badge>
                    <DialogTitle className="font-serif text-xl font-bold">{selectedFeedback?.title}</DialogTitle>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                       <span>Reported by <strong>{selectedFeedback?.user_name}</strong></span>
                       <span>•</span>
                       <span>{new Date(selectedFeedback?.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
                     {selectedFeedback && getCategoryIcon(selectedFeedback.category)}
                  </div>
               </div>
            </div>
            <div className="p-6 space-y-6">
               <div>
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">User Description</label>
                 <div className="p-4 rounded-xl bg-muted/30 border border-border/50 text-sm whitespace-pre-wrap">
                   {selectedFeedback?.description}
                 </div>
               </div>
               
               <div className="space-y-4 pt-4 border-t border-border/40">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Update Status</label>
                    <Select value={adminStatus} onValueChange={setAdminStatus}>
                      <SelectTrigger className="h-11 bg-muted/30 border-border/50 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Resolved">Resolved</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admin Response to User</label>
                    <Textarea 
                      placeholder="Type a response or resolution note here..."
                      className="min-h-[100px] resize-none bg-muted/30 border-border/50 rounded-xl"
                      value={adminResponse}
                      onChange={e => setAdminResponse(e.target.value)}
                    />
                  </div>
               </div>

               <div className="flex justify-end pt-2">
                 <Button onClick={handleAdminUpdate} className="rounded-xl bg-primary hover:bg-primary/90 font-bold">
                   Save & Notify User
                 </Button>
               </div>
            </div>
         </DialogContent>
      </Dialog>

      {/* Feedback Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
         {loading ? (
            Array(3).fill(0).map((_, i) => (
               <Card key={i} className="h-[200px] animate-pulse bg-muted/20 border-border/30 rounded-3xl" />
            ))
         ) : feedbackList.length === 0 ? (
            <div className="col-span-full h-48 rounded-3xl border border-border/40 border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/5 backdrop-blur-xl">
               <AlertCircle className="h-10 w-10 opacity-20 mb-3" />
               <p className="font-medium">No feedback tickets have been submitted yet.</p>
            </div>
         ) : (
            <AnimatePresence>
              {feedbackList.map(feedback => (
                 <motion.div key={feedback.id} variants={itemVariants} layoutId={`feedback-${feedback.id}`}>
                    <Card className="h-full rounded-3xl border-border/40 bg-card/60 backdrop-blur-xl shadow-sm hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:border-indigo-500/20 group relative overflow-hidden flex flex-col">
                       {feedback.status === 'Resolved' && (
                         <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-[100%] transition-colors duration-500" />
                       )}
                       <CardHeader className="p-5 pb-3">
                         <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className={`font-black tracking-widest uppercase text-[9px] px-2 py-0.5 ${getStatusColor(feedback.status)}`}>
                              {getStatusIcon(feedback.status)}
                              {feedback.status}
                            </Badge>
                            <div className="p-1.5 rounded-md bg-muted/50 border border-border/50">
                               {getCategoryIcon(feedback.category)}
                            </div>
                         </div>
                         <CardTitle className="text-lg font-serif font-bold line-clamp-1">{feedback.title}</CardTitle>
                         <div className="flex items-center justify-between mt-1">
                            <span className="text-xs font-bold text-muted-foreground">{feedback.user_name}</span>
                            <span className="text-[10px] text-muted-foreground/60">{new Date(feedback.created_at).toLocaleDateString()}</span>
                         </div>
                       </CardHeader>
                       <CardContent className="p-5 pt-0 flex-1 flex flex-col">
                          <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                            {feedback.description}
                          </p>
                          
                          {feedback.admin_response && (
                            <div className="mt-auto mb-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">Admin Response</p>
                              <p className="text-xs text-foreground/80 line-clamp-2">{feedback.admin_response}</p>
                            </div>
                          )}

                          {isAdmin && (
                            <Button 
                              variant="outline" 
                              className="w-full rounded-xl mt-auto opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => {
                                setSelectedFeedback(feedback);
                                setAdminStatus(feedback.status);
                                setAdminResponse(feedback.admin_response || "");
                              }}
                            >
                              Manage Ticket
                            </Button>
                          )}
                       </CardContent>
                    </Card>
                 </motion.div>
              ))}
            </AnimatePresence>
         )}
      </div>
    </motion.div>
  );
}
