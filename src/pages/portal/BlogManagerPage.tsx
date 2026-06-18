import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FileText, Loader2, Plus, Image as ImageIcon, X, Link as LinkIcon, Check, AlertCircle, Edit3, Newspaper, ImagePlus, Globe } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { BlockNoteRenderer } from "@/components/blog/BlockNoteRenderer";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function BlogManagerPage() {
  const { profile, user, hasPermission } = useAuth();
  const canManageBlog = hasPermission("manage_blog");
  const canCreateBlog = hasPermission("view_blog");
  
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [editingBlogId, setEditingBlogId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverMode, setCoverMode] = useState<"upload" | "url">("upload");
  const [coverUrlInput, setCoverUrlInput] = useState("");

  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const editor = useCreateBlockNote();
  
  const fetchBlogs = async () => {
    try {
      const { data } = await api.get("/blogs/");
      setBlogs(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handlePost = async () => {
    if (!title || !editor) {
      toast.error("Please provide a title");
      return;
    }
    
    try {
      const blocks = editor.document;
      if (blocks.length === 0 || (blocks.length === 1 && blocks[0].type === "paragraph" && !blocks[0].content)) {
        toast.error("Please provide some content");
        return;
      }

      setPosting(true);
      const finalCover = coverMode === "url" ? coverUrlInput.trim() : coverImage;
      const payload: any = {
        title,
        content: JSON.stringify(blocks),
        media_type: finalCover ? "image" : "none",
      };

      if (!editingBlogId) {
        payload.media_url = finalCover || null;
      } else {
        if (finalCover && finalCover.startsWith("data:image/")) {
          payload.media_url = finalCover;
        } else if (!finalCover) {
          payload.media_url = null;
        }
      }

      if (editingBlogId) {
        await api.patch(`/blogs/${editingBlogId}/`, payload);
        toast.success("Blog Updated! It has been moved to Pending for review.");
      } else {
        await api.post("/blogs/", payload);
        toast.success("Blog Posted! It is now Pending review.");
      }
      
      handleCancelEdit();
      fetchBlogs();
    } catch (e: any) {
      toast.error(`Failed to ${editingBlogId ? 'update' : 'post'} blog`);
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const handleEditBlog = (blog: any) => {
    setEditingBlogId(blog.id);
    setTitle(blog.title);
    
    if (blog.media_url) {
      setCoverImage(blog.media_url);
      setCoverMode("upload");
    } else {
      setCoverImage(null);
      setCoverUrlInput("");
      setCoverMode("upload");
    }

    try {
      const parsedBlocks = typeof blog.content === "string" ? JSON.parse(blog.content) : blog.content;
      if (Array.isArray(parsedBlocks)) {
        editor?.replaceBlocks(editor.document, parsedBlocks);
      }
    } catch {
      editor?.replaceBlocks(editor.document, [{ type: "paragraph", content: blog.content || "" }]);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingBlogId(null);
    setTitle("");
    setCoverImage(null);
    setCoverUrlInput("");
    setCoverMode("upload");
    editor?.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
  };

  const executeDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/blogs/${deleteConfirmId}/`);
      toast.success("Blog deleted successfully");
      fetchBlogs();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete blog");
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/blogs/${id}/`, { status: "Approved" });
      toast.success("Blog Approved!");
      fetchBlogs();
    } catch (e) {
      toast.error("Failed to approve blog");
    }
  };

  const executeReject = async () => {
    if (!rejectingId) return;
    try {
      await api.patch(`/blogs/${rejectingId}/`, { 
        status: "Rejected", 
        rejection_reason: rejectionReason 
      });
      toast.success("Blog Rejected");
      setRejectingId(null);
      setRejectionReason("");
      fetchBlogs();
    } catch (e) {
      toast.error("Failed to reject blog");
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 relative"
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute -top-32 -left-24 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider"
          >
            <Newspaper className="w-3 h-3" /> Public Communications
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Blog Manager
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Draft, review, and publish council announcements and articles. Keep the student body informed with engaging content.
          </p>
        </div>
      </section>

      {/* Editor Section */}
      {canCreateBlog && (
        <Card className="border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-6 md:p-8 space-y-6">
            <h2 className="text-xl font-serif font-bold flex items-center gap-2 mb-6 text-foreground">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
                <Edit3 className="h-5 w-5 text-cyan-500" />
              </div>
              {editingBlogId ? "Edit Publication" : "Draft New Publication"}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Article Title</Label>
                  <Input 
                    id="title"
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    placeholder="Enter an engaging title..." 
                    className="bg-muted/30 border-border/50 text-lg font-bold rounded-2xl h-14 px-5 focus-visible:ring-cyan-500/20"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Article Content</Label>
                  <div className="bg-background text-black min-h-[400px] border border-border/50 rounded-2xl overflow-hidden shadow-sm transition-all focus-within:ring-2 focus-within:ring-cyan-500/20">
                    <BlockNoteView editor={editor} theme="light" className="min-h-[400px] p-2" />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cover Media</Label>
                  <div className="bg-muted/30 p-4 rounded-2xl border border-border/50 space-y-4">
                    <div className="flex items-center gap-2 bg-background p-1.5 rounded-xl shadow-sm border border-border/40">
                      <button
                        type="button"
                        onClick={() => setCoverMode("upload")}
                        className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all ${
                          coverMode === "upload" ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <ImageIcon className="inline w-3 h-3 mr-1.5" />Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverMode("url")}
                        className={`flex-1 text-[11px] font-bold px-3 py-2 rounded-lg transition-all ${
                          coverMode === "url" ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-muted-foreground hover:bg-muted/50"
                        }`}
                      >
                        <LinkIcon className="inline w-3 h-3 mr-1.5" />URL
                      </button>
                    </div>

                    {coverMode === "upload" ? (
                      <div className="relative w-full aspect-video">
                        {coverImage ? (
                          <div className="relative rounded-xl overflow-hidden border border-border/50 h-full w-full bg-black group">
                            <img src={coverImage} alt="Cover" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                            <button
                              type="button"
                              onClick={() => setCoverImage(null)}
                              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-rose-500 transition-colors backdrop-blur-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-border/60 rounded-xl cursor-pointer bg-background hover:bg-muted/40 transition-colors group">
                            <div className="p-3 bg-cyan-500/5 rounded-full mb-2 group-hover:scale-110 transition-transform">
                              <ImagePlus className="w-6 h-6 text-cyan-500" />
                            </div>
                            <span className="text-xs font-bold text-muted-foreground">Select image</span>
                            <span className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider">PNG, JPG, WebP</span>
                            <input type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                          </label>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Input
                          value={coverUrlInput}
                          onChange={e => setCoverUrlInput(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="bg-background border-border/50 rounded-xl"
                        />
                        {coverUrlInput && (
                          <div className="rounded-xl overflow-hidden border border-border/50 aspect-video bg-black">
                            <img src={coverUrlInput} alt="Cover preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 space-y-3">
                  <Button 
                    onClick={handlePost} 
                    disabled={posting || !title} 
                    className="w-full h-12 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 bg-cyan-600 hover:bg-cyan-700 text-white transition-all"
                  >
                    {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Globe className="h-4 w-4 mr-2" />} 
                    {editingBlogId ? "Submit Edits for Review" : "Submit for Publication"}
                  </Button>
                  {editingBlogId && (
                    <Button variant="outline" onClick={handleCancelEdit} disabled={posting} className="w-full h-12 rounded-xl font-bold">
                      Discard Edits
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blog List Section */}
      <div className="space-y-6 pt-4">
        <h3 className="font-serif text-2xl font-bold flex items-center gap-3">
          Latest Publications
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <div className="h-10 w-10 border-4 border-cyan-500 border-t-transparent rounded-full drop-shadow-lg" />
            </motion.div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-muted/20 border border-border/40 rounded-3xl backdrop-blur-xl">
            <Newspaper className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-foreground">No posts available</h3>
            <p className="text-sm text-muted-foreground mt-1">Draft a new post to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnimatePresence>
              {blogs.map((b) => {
                const isAuthor = b.author_id === user?.id;
                return (
                  <motion.div key={b.id} variants={itemVariants} layout initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}>
                    <Card className="h-full overflow-hidden rounded-3xl border-border/40 bg-card/40 backdrop-blur-xl hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-300 group flex flex-col">
                      {b.media_url && b.media_type === "image" && (
                        <div className="h-48 w-full overflow-hidden relative">
                          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
                          <img src={b.media_url} alt={b.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      )}
                      
                      <CardContent className="p-6 flex-1 flex flex-col z-20">
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              className={`text-[9px] uppercase font-black tracking-widest border-none shadow-sm ${
                                b.status === "Approved" ? "bg-emerald-500/10 text-emerald-600" :
                                b.status === "Rejected" ? "bg-rose-500/10 text-rose-600" :
                                "bg-amber-500/10 text-amber-600"
                              }`}
                            >
                              {b.status}
                            </Badge>
                          </div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground shrink-0 text-right">
                            {new Date(b.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>

                        <h4 className="font-serif text-2xl font-bold leading-tight group-hover:text-cyan-600 transition-colors mb-3 line-clamp-2">
                          {b.title}
                        </h4>

                        <div className="text-sm text-muted-foreground/80 line-clamp-3 mb-6 relative">
                          <BlockNoteRenderer data={b.content} />
                        </div>
                        
                        {b.status === "Rejected" && b.rejection_reason && (
                          <div className="mt-auto mb-6 bg-rose-500/5 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs p-3 rounded-xl flex gap-2 items-start shadow-inner">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            <div>
                              <span className="font-black uppercase tracking-widest block mb-0.5 text-[9px]">Rejection Reason</span>
                              {b.rejection_reason}
                            </div>
                          </div>
                        )}
                        
                        <div className="mt-auto pt-4 border-t border-border/20 flex items-center justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                              <span className="text-xs font-bold">{b.author_name ? b.author_name.charAt(0).toUpperCase() : 'A'}</span>
                            </div>
                            <span className="text-xs font-bold text-foreground truncate">{b.author_name || b.author}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 rounded-lg text-xs font-bold" onClick={() => window.open(`/blog?blogId=${b.id}`, "_blank")}>
                              Read Post
                            </Button>
                            
                            {(isAuthor || canManageBlog) && (
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => handleEditBlog(b)}>
                                <Edit3 className="w-3.5 h-3.5" />
                              </Button>
                            )}

                            {canManageBlog && b.status === "Pending" && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg bg-primary text-primary-foreground border-none hover:bg-primary/90">
                                    <Check className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-border/50 shadow-xl bg-background/90 backdrop-blur-xl p-2 min-w-[160px]">
                                  <DropdownMenuItem className="text-xs font-bold text-emerald-600 rounded-lg p-2 focus:bg-emerald-500/10 focus:text-emerald-700" onClick={() => handleApprove(b.id)}>
                                    <Check className="w-4 h-4 mr-2" /> Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-xs font-bold text-rose-600 rounded-lg p-2 focus:bg-rose-500/10 focus:text-rose-700" onClick={() => setRejectingId(b.id)}>
                                    <X className="w-4 h-4 mr-2" /> Reject
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            
                            {canManageBlog && (
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10" onClick={() => setDeleteConfirmId(b.id)}>
                                <X className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(isOpen) => !isOpen && setDeleteConfirmId(null)}>
        <AlertDialogContent className="rounded-3xl border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">Delete Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this blog post from the public feed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl border-border/50">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-500/20">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejectingId} onOpenChange={(isOpen) => !isOpen && setRejectingId(null)}>
        <DialogContent className="rounded-3xl border-border/40 bg-background/80 backdrop-blur-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Reject Publication</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reason for Rejection *</Label>
              <Textarea 
                placeholder="Explain why this post is being rejected to the author..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="bg-muted/30 border-border/50 rounded-xl focus-visible:ring-rose-500/20"
              />
            </div>
            <DialogFooter className="pt-4 border-t border-border/20">
              <Button variant="outline" className="rounded-xl border-border/50" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="destructive" className="rounded-xl font-bold shadow-lg shadow-rose-500/20" onClick={executeReject} disabled={!rejectionReason.trim()}>Confirm Rejection</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
