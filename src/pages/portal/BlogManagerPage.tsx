import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Plus, Calendar, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function BlogManagerPage() {
  const { profile } = useAuth();
  
  // Blog State
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [posting, setPosting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("none");

  // Gallery State
  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  // Timeline State
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(true);
  const [tTitle, setTTitle] = useState("");
  const [tDate, setTDate] = useState("");
  const [tStatus, setTStatus] = useState<any>("Upcoming");
  const [tLocation, setTLocation] = useState("");
  const [tDescription, setTDescription] = useState("");
  const [postingTimeline, setPostingTimeline] = useState(false);

  const fetchBlogs = async () => {
    try {
      const { data } = await api.get("/blogs/");
      setBlogs(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBlogs(false);
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

  const fetchTimeline = async () => {
    try {
      const { data } = await api.get("/timeline/");
      setTimeline(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingTimeline(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
    fetchGallery();
    fetchTimeline();
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

  const handleTimelinePost = async () => {
    if (!tTitle || !tDate) return;
    setPostingTimeline(true);
    try {
      await api.post("/timeline/", {
        title: tTitle,
        date: tDate,
        status: tStatus,
        location: tLocation,
        description: tDescription
      });
      toast.success("Timeline Event Added!");
      setTTitle("");
      setTDate("");
      setTLocation("");
      setTDescription("");
      fetchTimeline();
    } catch (e) {
      toast.error("Failed to add event");
    } finally {
      setPostingTimeline(false);
    }
  };

  const deleteTimelineEvent = async (id: string) => {
    try {
      await api.delete(`/timeline/${id}`);
      toast.success("Event removed");
      fetchTimeline();
    } catch (e) {
      toast.error("Failed to delete event");
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
        <h1 className="font-serif text-2xl font-bold">Public Content Manager</h1>
        <p className="text-sm text-muted-foreground">Manage blogs, the 3D gallery, and the council journey timeline.</p>
      </div>

      <Tabs defaultValue="blog" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px]">
          <TabsTrigger value="blog">Blog & Feed</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* BLOG TAB */}
        <TabsContent value="blog" className="space-y-6 pt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Create New Post</h2>
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

          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Recent Posts</h3>
            {loadingBlogs ? <p className="text-sm text-muted-foreground italic">Loading posts...</p> : 
             blogs.length === 0 ? <p className="text-sm text-muted-foreground italic">No posts yet.</p> :
             blogs.map((b) => (
               <Card key={b.id}>
                 <CardContent className="p-4 space-y-2">
                   <h4 className="font-bold">{b.title}</h4>
                   <p className="text-xs text-muted-foreground">{b.author} • {new Date(b.created_at).toLocaleString()}</p>
                   {b.media_url && b.media_type === "image" && (
                     <img src={b.media_url} alt="Media" className="my-2 max-h-48 rounded-md object-cover w-full md:w-auto" />
                   )}
                   <p className="text-sm whitespace-pre-wrap line-clamp-3">{b.content}</p>
                 </CardContent>
               </Card>
             ))}
          </div>
        </TabsContent>

        {/* GALLERY TAB */}
        <TabsContent value="gallery" className="space-y-6 pt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Add to Gallery Feed</h2>
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
                <div className="border rounded-lg bg-muted/30 flex items-center justify-center overflow-hidden h-40">
                   {galleryFile ? (
                     <img src={galleryFile} alt="Preview" className="h-full w-full object-cover" />
                   ) : (
                     <p className="text-xs text-muted-foreground italic text-center px-4">Preview will appear here.</p>
                   )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TIMELINE TAB */}
        <TabsContent value="timeline" className="space-y-6 pt-4">
          <Card>
            <CardContent className="p-4 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Add Timeline Milestone</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label>Event Title</Label>
                    <Input value={tTitle} onChange={e => setTTitle(e.target.value)} placeholder="e.g. Annual General Meeting" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Date</Label>
                      <Input value={tDate} onChange={e => setTDate(e.target.value)} placeholder="e.g. Oct 12, 2026" />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Select value={tStatus} onValueChange={setTStatus}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Upcoming">Upcoming</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Location</Label>
                    <Input value={tLocation} onChange={e => setTLocation(e.target.value)} placeholder="e.g. Main Library" />
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Brief Description</Label>
                    <Textarea value={tDescription} onChange={e => setTDescription(e.target.value)} rows={4} placeholder="Describe the milestone..." />
                  </div>
                  <Button onClick={handleTimelinePost} disabled={postingTimeline || !tTitle || !tDate} className="w-full">
                    {postingTimeline ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />} Save Milestone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h3 className="font-semibold">Current Journey Milestones</h3>
            {loadingTimeline ? <p className="text-sm text-muted-foreground italic">Loading journey...</p> : 
             timeline.length === 0 ? <p className="text-sm text-muted-foreground italic">No milestones yet.</p> :
             <div className="grid gap-3">
               {timeline.map((item) => (
                 <Card key={item.id} className="border-l-4 border-l-gold">
                   <CardContent className="p-4 flex justify-between items-start">
                     <div>
                       <h4 className="font-bold">{item.title}</h4>
                       <p className="text-xs text-muted-foreground">{item.date} • {item.location}</p>
                       <p className="text-sm mt-2 line-clamp-2">{item.description}</p>
                     </div>
                     <Button variant="ghost" size="icon" onClick={() => deleteTimelineEvent(item.id)} className="text-destructive">
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </CardContent>
                 </Card>
               ))}
             </div>
            }
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
