import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { BlockNoteRenderer } from "@/components/blog/BlockNoteRenderer";

/** Extract plain text from BlockNote JSON for list previews */
function extractExcerpt(content: string | any[] | null, maxChars = 160): string {
  if (!content) return '';
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) return content.slice(0, maxChars);
      const text = parsed.map((b: any) => Array.isArray(b.content) ? b.content.map((c: any) => c.text || '').join('') : '').filter(Boolean).join(' ');
      return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
    } catch {
      const plainText = content.replace(/<[^>]*>/g, '');
      return plainText.length > maxChars ? plainText.slice(0, maxChars).trimEnd() + '…' : plainText;
    }
  }
  if (Array.isArray(content)) {
    const text = content.map((b: any) => Array.isArray(b.content) ? b.content.map((c: any) => c.text || '').join('') : '').filter(Boolean).join(' ');
    return text.length > maxChars ? text.slice(0, maxChars).trimEnd() + '…' : text;
  }
  return '';
}

export default function PublicBlogPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<any | null>(null);
  const location = useLocation();

  useEffect(() => {
    api.get("/blogs/?public=true")
      .then(({ data }) => {
         const fetchedBlogs = Array.isArray(data) ? data : data.results || [];
         setBlogs(fetchedBlogs);
         
         const queryParams = new URLSearchParams(location.search);
         const blogId = parseInt(queryParams.get("blogId") || "", 10);
         if (!isNaN(blogId)) {
           const foundBlog = fetchedBlogs.find((b: any) => b.id === blogId);
           if (foundBlog) setSelectedBlog(foundBlog);
         }
      })
      .catch((err) => console.error("Failed to load blog posts", err))
      .finally(() => setLoadingBlogs(false));
  }, [location.search]);

  return (
    <div className="min-h-screen bg-muted/10 pt-24 pb-16">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-bold sm:text-4xl text-primary">Council Blog & Announcements</h1>
          <p className="text-sm text-muted-foreground mt-3 max-w-2xl mx-auto">
            Stay informed with official press releases, news updates, and student council resolutions.
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {loadingBlogs ? (
            <div className="text-center py-12 text-muted-foreground animate-pulse">Loading updates...</div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No blog posts available at the moment.</div>
          ) : selectedBlog ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 text-left">
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
                    <p className="text-xs text-muted-foreground">
                      {selectedBlog.created_at ? new Date(selectedBlog.created_at).toLocaleDateString() : ""}
                    </p>
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
            <div className="flex flex-col gap-0 divide-y rounded-xl border bg-card shadow-sm overflow-hidden text-left">
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

                    {/* Content excerpt */}
                    {extractExcerpt(b.content) && (
                      <p className="text-muted-foreground text-sm leading-relaxed mb-3 hidden sm:block line-clamp-2">
                        {extractExcerpt(b.content)}
                      </p>
                    )}

                    {/* Meta + Read more */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>✦ {b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ""}</span>
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
                        {(b.title || 'U').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
