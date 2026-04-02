import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function BlogManagerPage() {
  const { profile } = useAuth();
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("none");

  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  const fetchBlogs = async () => {
    try {
      const { data } = await api.get("/blogs/");
      setBlogs(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGallery = async () => {
    try {
      const { data } = await api.get("/gallery/");
      setGallery(data.results || []);
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
    if (!title || !content) return;
    setPosting(true);
    try {
      await api.post("/blogs/", {
        title,
        content,
        media_url: mediaType !== "none" ? mediaUrl : null,
        media_type: mediaType,
        author: profile?.full_name || "Publicity Office",
      });
      toast.success("Blog Posted!");
      setTitle("");
      setContent("");
      setMediaUrl("");
      setMediaType("none");
      fetchBlogs();
    } catch (e: any) {
      toast.error("Failed to post blog");
    } finally {
      setPosting(false);
    }
  };

  const handleGalleryUpload = async () => {
    // In a real app we'd use FormData, here we simulate with a placeholder URL if no "file"
    setUploadingGallery(true);
    try {
      await api.post("/gallery/", {
        caption: galleryCaption,
        url: galleryFile || "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80",
      });
      toast.success("Photo added to Gallery!");
      setGalleryCaption("");
      setGalleryFile(null);
      fetchGallery();
    } catch (e) {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingGallery(false);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold">Blog & Gallery Manager</h1>
        <p className="text-sm text-muted-foreground">Manage public announcements and the 3D photo feed.</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Create New Post</h2>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. End of Term Events" />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Write announcement..." />
            </div>
            <div>
               <Label>Attach Media (Optional)</Label>
               <div className="flex gap-2 mt-1">
                 <Select value={mediaType} onValueChange={setMediaType}>
                   <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                   <SelectContent>
                     <SelectItem value="none">No Media</SelectItem>
                     <SelectItem value="image">Image</SelectItem>
                     <SelectItem value="video">Video</SelectItem>
                   </SelectContent>
                 </Select>
                 <Input 
                   value={mediaUrl} 
                   onChange={e => setMediaUrl(e.target.value)} 
                   placeholder="Paste Image or Video URL..." 
                   disabled={mediaType === "none"} 
                   className="flex-1" 
                 />
               </div>
            </div>
            <Button onClick={handlePost} disabled={posting || !title || !content}>
              {posting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />} Post to Homepage
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4" /> Add to Gallery Feed</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <Label>Photo Caption</Label>
                <Input value={galleryCaption} onChange={e => setGalleryCaption(e.target.value)} placeholder="e.g. Football Finals 2025" />
              </div>
              <div>
                <Label>Select Photo (Local Upload)</Label>
                <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
              </div>
              <Button onClick={handleGalleryUpload} disabled={uploadingGallery || (!galleryFile && !galleryCaption)} className="w-full">
                {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Add Photo
              </Button>
            </div>
            <div className="border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden">
               {galleryFile ? (
                 <img src={galleryFile} alt="Preview" className="h-full w-full object-cover" />
               ) : (
                 <p className="text-xs text-muted-foreground italic text-center px-4">Preview of your selected photo will appear here.</p>
               )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold">Recent Posts</h3>
        {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : 
         blogs.length === 0 ? <p className="text-sm text-muted-foreground">No posts yet.</p> :
         blogs.map((b) => (
           <Card key={b.id}>
             <CardContent className="p-4 space-y-2">
               <h4 className="font-bold">{b.title}</h4>
               <p className="text-xs text-muted-foreground">{b.author} • {new Date(b.created_at).toLocaleString()}</p>
               {b.media_url && b.media_type === "image" && (
                 <img src={b.media_url} alt="Media" className="my-2 max-h-48 rounded-md object-cover" />
               )}
               {b.media_url && b.media_type === "video" && (
                 <video src={b.media_url} controls className="my-2 max-h-48 w-full max-w-sm rounded-md" />
               )}
               <p className="text-sm whitespace-pre-wrap">{b.content}</p>
             </CardContent>
           </Card>
         ))}
      </div>
    </div>
  );
}
