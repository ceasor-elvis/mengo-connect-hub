import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Plus, Image as ImageIcon, X, Link as LinkIcon, Check, AlertCircle } from "lucide-react";
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
        // status is automatically set to Pending by the backend
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
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold font-heading">Blog Manager</h1>
        <p className="text-sm text-muted-foreground">Manage and review public blog posts.</p>
      </div>

      {canCreateBlog && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> 
              {editingBlogId ? "Edit Post" : "Create New Post"}
            </h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="mb-1 block">Blog Title</Label>
                <Input 
                  id="title"
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. End of Term Events" 
                  className="max-w-xl"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Content (BlockNote)</Label>
                <div className="bg-white text-black min-h-[400px] border rounded-md p-2 overflow-hidden prose-sm max-w-none shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
                    <BlockNoteView editor={editor} theme="light" />
                </div>
              </div>

              <div className="space-y-3">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setCoverMode("upload")}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      coverMode === "upload" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    <ImageIcon className="inline w-3 h-3 mr-1" />Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverMode("url")}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      coverMode === "url" ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"
                    }`}
                  >
                    <LinkIcon className="inline w-3 h-3 mr-1" />Paste URL
                  </button>
                </div>

                {coverMode === "upload" ? (
                  <div className="relative max-w-xl">
                    {coverImage ? (
                      <div className="relative rounded-lg overflow-hidden border h-48 bg-muted">
                        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setCoverImage(null)}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/20 hover:bg-muted/40 transition-colors">
                        <ImageIcon className="w-8 h-8 text-muted-foreground/50 mb-2" />
                        <span className="text-sm text-muted-foreground">Click to upload cover image</span>
                        <span className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, GIF, WebP</span>
                        <input type="file" accept="image/*" onChange={handleCoverFileChange} className="hidden" />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2 max-w-xl">
                    <Input
                      value={coverUrlInput}
                      onChange={e => setCoverUrlInput(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                    {coverUrlInput && (
                      <div className="rounded-lg overflow-hidden border h-48 bg-muted">
                        <img src={coverUrlInput} alt="Cover preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <Button onClick={handlePost} disabled={posting || !title} className="min-w-[150px]">
                  {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />} 
                  {editingBlogId ? "Submit Edits for Review" : "Submit for Review"}
                </Button>
                {editingBlogId && (
                  <Button variant="outline" onClick={handleCancelEdit} disabled={posting} className="min-w-[100px]">
                    Cancel Edit
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          Recent Posts
        </h3>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : blogs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">No posts available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {blogs.map((b) => {
              const isAuthor = b.author_id === user?.id;
              return (
                <Card key={b.id} className="overflow-hidden">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    {b.media_url && b.media_type === "image" && (
                      <div className="md:w-48 h-48 flex-shrink-0">
                        <img src={b.media_url} alt={b.title} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="p-6 flex-1 space-y-2 text-wrap break-words min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-xl">{b.title}</h4>
                            <Badge variant={b.status === "Approved" ? "default" : b.status === "Rejected" ? "destructive" : "secondary"}>
                              {b.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            By {b.author_name || b.author} • {new Date(b.created_at).toLocaleDateString()} at {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      {b.status === "Rejected" && b.rejection_reason && (
                        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md flex gap-2 items-start">
                          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-semibold block mb-1">Rejection Reason:</span>
                            {b.rejection_reason}
                          </div>
                        </div>
                      )}
                      
                      <div className="line-clamp-3 overflow-hidden relative max-h-[100px] text-sm text-muted-foreground">
                         <BlockNoteRenderer data={b.content} />
                      </div>
                      
                      <div className="pt-4 flex items-center justify-between flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => window.open(`/blog?blogId=${b.id}`, "_blank")}>Read Full Post</Button>
                        <div className="flex items-center gap-2 flex-wrap">
                          {canManageBlog && b.status === "Pending" && (
                            <>
                              <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(b.id)}>
                                <Check className="w-4 h-4 mr-1" /> Approve
                              </Button>
                              <Button variant="destructive" size="sm" onClick={() => setRejectingId(b.id)}>
                                <X className="w-4 h-4 mr-1" /> Reject
                              </Button>
                            </>
                          )}
                          {(isAuthor || canManageBlog) && (
                            <Button variant="outline" size="sm" className="border-primary text-primary hover:bg-primary hover:text-white" onClick={() => handleEditBlog(b)}>
                              Edit
                            </Button>
                          )}
                          {canManageBlog && (
                            <Button variant="destructive" size="sm" onClick={() => setDeleteConfirmId(b.id)}>Delete</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(isOpen) => !isOpen && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the blog post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!rejectingId} onOpenChange={(isOpen) => !isOpen && setRejectingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Blog Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Reason for Rejection</Label>
              <Textarea 
                placeholder="Explain why this post is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectingId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={executeReject} disabled={!rejectionReason.trim()}>Confirm Rejection</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
