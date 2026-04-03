import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { InteractiveCalendar } from "@/components/calendar/InteractiveCalendar";
import { MasonryGallery } from "@/components/gallery/MasonryGallery";
import { DomeGallery } from "@/components/gallery/DomeGallery";
import { Button } from "@/components/ui/button";
import { Grid, Globe } from "lucide-react";

export default function PublicBlogPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingProgs, setLoadingProgs] = useState(true);
   const [gallery, setGallery] = useState<any[]>([]);
   const [loadingGallery, setLoadingGallery] = useState(true);
   const [galleryView, setGalleryView] = useState<"masonry" | "dome">("masonry");

  useEffect(() => {
    api.get("/blogs/")
      .then(({ data }) => setBlogs(data.results || []))
      .catch(() => {})
      .finally(() => setLoadingBlogs(false));
      
    api.get("/programmes/")
      .then(({ data }) => setProgrammes(data.results || []))
      .catch(() => {})
      .finally(() => setLoadingProgs(false));

    api.get("/gallery/")
      .then(({ data }) => setGallery(data.results || []))
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

            <TabsContent value="blog" className="space-y-6">
              {loadingBlogs ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">Loading updates...</div>
              ) : blogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No blog posts available at the moment.</div>
              ) : (
                <div className="space-y-6">
                  {blogs.map(b => (
                    <div key={b.id} className="rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                      <h3 className="font-bold text-2xl mb-2">{b.title}</h3>
                      <p className="text-xs text-primary mb-4 font-medium px-2 py-1 bg-primary/10 rounded-full inline-block">
                        {b.author} • {new Date(b.created_at).toLocaleDateString()}
                      </p>
                      
                      {b.media_url && b.media_type === "image" && (
                        <div className="my-5 overflow-hidden rounded-lg bg-muted text-center border shadow-sm">
                          <img src={b.media_url} alt="Blog Attachment" className="max-h-[60vh] w-full object-contain mx-auto" />
                        </div>
                      )}
                      {b.media_url && b.media_type === "video" && (
                        <div className="my-5 overflow-hidden rounded-lg bg-muted border shadow-sm flex justify-center">
                          <video src={b.media_url} controls className="max-h-[60vh] w-full max-w-3xl" />
                        </div>
                      )}

                      <p className="text-card-foreground text-base leading-relaxed whitespace-pre-wrap">{b.content}</p>
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
