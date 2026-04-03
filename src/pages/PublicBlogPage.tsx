import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { InteractiveCalendar } from "@/components/calendar/InteractiveCalendar";
import { MasonryGallery } from "@/components/gallery/MasonryGallery";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Calendar, User, Share2, Heart, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

function BlogCard({ blog }: { blog: any }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const contentThreshold = 200; // Character count before showing "Read More"
  const isLongContent = blog.content.length > contentThreshold;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group rounded-2xl border bg-card shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      <div className="p-6 sm:p-8">
        <LayoutGroup>
          <motion.h3 layout className="font-serif text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
            {blog.title}
          </motion.h3>

          <motion.div layout className="flex flex-wrap gap-4 mb-6 text-xs font-medium text-muted-foreground border-b pb-4">
            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
              <User className="h-3.5 w-3.5 text-primary" />
              {blog.author}
            </span>
            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {new Date(blog.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </motion.div>

          <AnimatePresence mode="wait">
            {blog.media_url && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 overflow-hidden rounded-xl bg-muted border shadow-inner relative group/media"
              >
                {blog.media_type === "image" ? (
                  <img 
                    src={blog.media_url} 
                    alt="Blog Cover" 
                    className="max-h-[60vh] w-full object-cover transition-transform duration-700 group-hover/media:scale-105" 
                  />
                ) : (
                  <video src={blog.media_url} controls className="max-h-[60vh] w-full" />
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover/media:opacity-100 transition-opacity">
                   <p className="text-white text-[10px] uppercase tracking-widest font-bold">Press to Expand Media</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="relative">
            <motion.p 
              layout
              className={`text-card-foreground text-base leading-relaxed whitespace-pre-wrap ${!isExpanded && isLongContent ? 'line-clamp-4' : ''}`}
            >
              {blog.content}
            </motion.p>
            
            {!isExpanded && isLongContent && (
              <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            )}
          </motion.div>

          {(isLongContent) && (
            <motion.div layout className="mt-4 flex justify-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-primary hover:text-primary/80 hover:bg-primary/5 font-bold gap-2 text-xs uppercase tracking-tighter"
              >
                {isExpanded ? (
                  <><ChevronUp className="h-4 w-4" /> Show Less</>
                ) : (
                  <><ChevronDown className="h-4 w-4" /> Read More</>
                )}
              </Button>
            </motion.div>
          )}

          <motion.div layout className="mt-8 pt-4 border-t flex items-center justify-between">
             <div className="flex items-center gap-4">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsLiked(!isLiked)}
                  className={`gap-2 h-9 rounded-full ${isLiked ? 'text-red-500 bg-red-50' : 'text-muted-foreground'}`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-[10px] font-bold">24+</span>
                </Button>
                <Button variant="ghost" size="sm" className="gap-2 h-9 rounded-full text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-[10px] font-bold">8</span>
                </Button>
             </div>
             <Button variant="ghost" size="icon" className="text-muted-foreground rounded-full h-9 w-9">
                <Share2 className="h-4 w-4" />
             </Button>
          </motion.div>
        </LayoutGroup>
      </div>
    </motion.div>
  );
}

export default function PublicBlogPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [programmes, setProgrammes] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [loadingProgs, setLoadingProgs] = useState(true);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);

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
                <div className="space-y-8">
                  {blogs.map(b => (
                    <BlogCard key={b.id} blog={b} />
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
                    events={programmes
                      .filter((p) => p.visibility === "public")
                      .map((p) => ({
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
              {loadingGallery ? (
                <div className="text-center py-12 text-muted-foreground animate-pulse">Loading gallery...</div>
              ) : gallery.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">No photos in the gallery yet.</div>
              ) : (
                <div className="rounded-2xl border bg-card shadow-sm overflow-hidden">
                   <MasonryGallery images={gallery} />
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
