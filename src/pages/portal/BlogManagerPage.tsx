import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Plus, Image as ImageIcon, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { BlockNoteRenderer } from "@/components/blog/BlockNoteRenderer";

export default function BlogManagerPage() {
  const { profile } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null); // base64 or URL
  const [coverMode, setCoverMode] = useState<"upload" | "url">("upload");
  const [coverUrlInput, setCoverUrlInput] = useState("");

  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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

  const fetchGallery = async () => {
    try {
      const { data } = await api.get("/gallery/");
      setGallery(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingGallery(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchGallery();
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
      await api.post("/blogs/", {
        title,
        content: JSON.stringify(blocks),
        media_url: finalCover || null,
        media_type: finalCover ? "image" : "none",
        author: profile?.full_name || "Publicity Office",
      });
      
      toast.success("Blog Posted!");
      setTitle("");
      setCoverImage(null);
      setCoverUrlInput("");
      setCoverMode("upload");
      editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]); 
      fetchBlogs();
    } catch (e: any) {
      toast.error("Failed to post blog");
      console.error(e);
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this blog post?")) return;
    try {
      await api.delete(`/blogs/${id}/`);
      toast.success("Blog deleted successfully");
      fetchBlogs();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to delete blog");
    }
  };

  const handleGalleryUpload = async () => {
    if (!galleryFile) {
      toast.error("Please select an image to upload");
      return;
    }
    setUploadingGallery(true);
    try {
      await api.post("/gallery/", {
        caption: galleryCaption,
        url: galleryFile,
      });
      toast.success("Photo added to Gallery!");
      setGalleryCaption("");
      setGalleryFile(null);
      fetchGallery();
    } catch (e: any) {
      console.error("Gallery upload error:", e.response?.data || e.message || e);
      toast.error("Failed to upload photo. Check console for details.");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeletePhoto = async (id: number) => {
    try {
      await api.delete(`/gallery/${id}/`);
      toast.success("Photo deleted");
      fetchGallery();
    } catch (e) {
      toast.error("Failed to delete photo");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGalleryFile(reader.result as string);
      };
      reader.readAsDataURL(file);
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
        <h1 className="font-serif text-2xl font-bold font-heading">Content Manager</h1>
        <p className="text-sm text-muted-foreground">Manage public announcements and the gallery feed.</p>
      </div>

      <Tabs defaultValue="blog" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Blog Editor
          </TabsTrigger>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Gallery Manager
          </TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Create New Post</h2>
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
                    <div className="relative">
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
                    <div className="space-y-2">
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

                <Button onClick={handlePost} disabled={posting || !title} className="mt-2 min-w-[150px]">
                  {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />} 
                  Post Announcement
                </Button>
              </div>
            </CardContent>
          </Card>

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
              <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">No posts yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {blogs.map((b) => (
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
                            <h4 className="font-bold text-xl">{b.title}</h4>
                            <p className="text-xs text-muted-foreground mt-1">
                              By {b.author} • {new Date(b.created_at).toLocaleDateString()} at {new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        
                        <div className="line-clamp-6 overflow-hidden relative max-h-[250px]">
                          <BlockNoteRenderer data={b.content} />
                          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
                        </div>
                        
                        <div className="pt-4 flex items-center justify-between">
                          <Button variant="outline" size="sm" onClick={() => toast.info("Full view coming soon!")}>Read Full Post</Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteBlog(b.id)}>Delete Blog</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add to Gallery Feed</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="caption" className="mb-1 block">Photo Caption</Label>
                    <Input 
                      id="caption"
                      value={galleryCaption} 
                      onChange={e => setGalleryCaption(e.target.value)} 
                      placeholder="e.g. Football Finals 2025" 
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block">Select Photo (Local Upload)</Label>
                    <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
                  </div>
                  <Button onClick={handleGalleryUpload} disabled={uploadingGallery || !galleryFile} className="w-full">
                    {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} 
                    Upload to Gallery
                  </Button>
                </div>
                <div className="aspect-video rounded-lg bg-muted/30 border-2 border-dashed flex items-center justify-center overflow-hidden">
                   {galleryFile ? (
                     <img src={galleryFile} alt="Preview" className="h-full w-full object-cover" />
                   ) : (
                     <div className="text-center p-6">
                       <ImageIcon className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                       <p className="text-sm text-muted-foreground italic">Preview of your selected photo will appear here.</p>
                     </div>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-muted-foreground" />
              Gallery Management
            </h3>
            <p className="text-sm text-muted-foreground">Manage the photos displayed in the public 3D gallery.</p>

            {loadingGallery ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : gallery.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">No photos in gallery.</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {gallery.map((photo) => (
                  <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted">
                    <img src={photo.url} alt={photo.caption} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                      <p className="text-[10px] text-white line-clamp-2 mb-2">{photo.caption || "No caption"}</p>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="h-7 px-2 text-[10px]" 
                        onClick={() => handleDeletePhoto(photo.id)}
                      >
                        <X className="h-3 w-3 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
