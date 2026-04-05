import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { InteractiveCalendar } from "@/components/calendar/InteractiveCalendar";
import { MasonryGallery } from "@/components/gallery/MasonryGallery";
import { DomeGallery } from "@/components/gallery/DomeGallery";
import { Button } from "@/components/ui/button";
import { Grid, Globe } from "lucide-react";
import { BlockNoteRenderer } from "@/components/blog/BlockNoteRenderer";

/** Extract plain text from BlockNote JSON for list previews */
function extractExcerpt(content: string | any[] | null, maxChars = 160): string {
  try {
    const blocks: any[] = typeof content === 'string' ? JSON.parse(content) : (Array.isArray(content) ? content : []);
    const text = blocks
      .map((b: any) => {
        const inline = Array.isArray(b.content) ? b.content.map((c: any) => c.text || '').join('') : '';
        return inline;
      })
      .filter(Boolean)
      .join(' ');
    return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
  } catch {
    return '';
  }
}

export default function PublicBlogPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingProgs, setLoadingProgs] = useState(true);
   const [gallery, setGallery] = useState<any[]>([]);
   const [loadingGallery, setLoadingGallery] = useState(true);
   const [galleryView, setGalleryView] = useState<"masonry" | "dome">("masonry");
   const [selectedBlog, setSelectedBlog] = useState<any | null>(null);

  useEffect(() => {
    api.get("/blogs/")
      .then(({ data }) => setBlogs(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoadingBlogs(false));
      
    api.get("/programmes/")
      .then(({ data }) => {
         const fetched = Array.isArray(data) ? data : data.results || [];
         setProgrammes(fetched.filter((p: any) => p.visibility === 'public'));
      })
      .catch(() => {})
      .finally(() => setLoadingProgs(false));

    api.get("/gallery/")
      .then(({ data }) => setGallery(Array.isArray(data) ? data : data.results || []))
      .catch(() => {})
      .finally(() => setLoadingGallery(false));
  }, []);

  return (
    <div className="min-h-screen bg-muted/10 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl text-primary">Council Blog, Calendar & Gallery</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
            Stay up to date with the latest news, announcements, and a visual feed of life at Mengo Senior School.
          </p>
        </div>

        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="blog" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted shadow-sm">
              <TabsTrigger value="blog">Blog Updates</TabsTrigger>
              <TabsTrigger value="calendar">Termly Calendar</TabsTrigger>
              <TabsTrigger value="gallery">Event Gallery</TabsTrigger>
            </TabsList>

            <TabsContent value="blog" className="space-y-6 relative">
              {loadingBlogs ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">Loading updates...</div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No blog posts available at the moment.</div>
              ) : selectedBlog ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedBlog(null)} className="mb-4">
                    ← Back to posts
                  </Button>
                  <div className="rounded-xl border bg-card p-6 sm:p-10 shadow-lg">
                    <h1 className="font-bold text-3xl sm:text-4xl mb-6">{selectedBlog.title}</h1>
                    <div className="flex items-center gap-3 mb-8 pb-6 border-b">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                         {(selectedBlog.author || "A").slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{selectedBlog.author}</p>
                        <p className="text-xs text-muted-foreground">{new Date(selectedBlog.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    
                    {selectedBlog.media_url && selectedBlog.media_type === "image" && (
                      <div className="my-8 overflow-hidden rounded-lg bg-muted text-center border shadow-sm">
                        <img src={selectedBlog.media_url} alt="Blog Attachment" className="max-h-[70vh] w-full object-contain mx-auto" />
                      </div>
                    )}
                    {selectedBlog.media_url && selectedBlog.media_type === "video" && (
                      <div className="my-8 overflow-hidden rounded-lg bg-muted border shadow-sm flex justify-center">
                        <video src={selectedBlog.media_url} controls className="max-h-[70vh] w-full max-w-3xl" />
                      </div>
                    )}

                    <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none mt-6">
                      <BlockNoteRenderer data={selectedBlog.content} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-0 divide-y rounded-xl border bg-card shadow-sm overflow-hidden">
                  {blogs.map(b => (
                    <div 
                      key={b.id} 
                      className="flex justify-between items-start p-4 sm:p-6 cursor-pointer hover:bg-muted/30 transition-colors group"
                      onClick={() => setSelectedBlog(b)}
                    >
                      <div className="flex-1 pr-4 sm:pr-6 min-w-0">
                        {/* Author */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-5 h-5 rounded-sm bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
                            {b.author ? b.author.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            In <span className="text-foreground font-medium">Council Updates</span> by {b.author}
                          </span>
                        </div>

                        {/* Title */}
                        <h2 className="font-bold text-base sm:text-lg leading-snug mb-1 group-hover:text-primary transition-colors">
                          {b.title}
                        </h2>

                        {/* Content excerpt — plain text so line-clamp works correctly */}
                        {extractExcerpt(b.content) && (
                          <p className="text-muted-foreground text-sm leading-relaxed mb-3 hidden sm:block line-clamp-2">
                            {extractExcerpt(b.content)}
                          </p>
                        )}

                        {/* Meta + Read more */}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>✦ {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span>⏱ {Math.max(1, Math.ceil((b.content?.length || 0) / 1000))} min read</span>
                          <span className="ml-auto text-primary font-medium hidden sm:inline">Read more →</span>
                        </div>
                      </div>

                      {/* Thumbnail */}
                      {b.media_url && b.media_type === "image" ? (
                        <div className="w-20 h-20 sm:w-32 sm:h-28 shrink-0 rounded-md overflow-hidden bg-muted border ml-2">
                          <img src={b.media_url} alt={b.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-32 sm:h-28 shrink-0 rounded-md bg-primary/5 border flex items-center justify-center ml-2">
                          <span className="text-2xl sm:text-3xl font-bold text-primary/20">
                            {b.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="calendar">
              {loadingProgs ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">Loading calendar...</div>
              ) : (
                <Card className="p-4 sm:p-6 shadow-sm w-full bg-card">
                  <InteractiveCalendar
                    events={programmes.map((p) => ({
                      id: p.id,
                      title: p.title,
                      start: p.event_date ? new Date(p.event_date) : new Date(),
                      end: p.event_date ? new Date(p.event_date) : new Date(),
                      resource: p,
                    }))}
                  />
                </Card>
              )}
            </TabsContent>

            <TabsContent value="gallery">
              <div className="mb-4 flex justify-end gap-2 px-1">
                <Button 
                  variant={galleryView === "masonry" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setGalleryView("masonry")}
                  className="rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider"
                >
                  <Grid className="w-3.5 h-3.5 mr-1.5" /> Grid View
                </Button>
                <Button 
                  variant={galleryView === "dome" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setGalleryView("dome")}
                  className="rounded-full px-4 h-8 text-[11px] font-bold uppercase tracking-wider"
                >
                  <Globe className="w-3.5 h-3.5 mr-1.5" /> 3D Sphere
                </Button>
              </div>

              {loadingGallery ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">Loading gallery...</div>
              ) : gallery.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No photos in the gallery yet.</div>
              ) : (
                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                  {galleryView === "masonry" ? (
                    <MasonryGallery images={gallery} />
                  ) : (
                    <div className="py-8 bg-black/5">
                       <DomeGallery images={gallery} />
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
