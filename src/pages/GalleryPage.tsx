import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Image as ImageIcon, Download, Maximize2 } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Photo {
  id: number;
  url: string; // The URL returned by the API
  caption?: string;
  created_at: string;
}

const CATEGORIES = ["All", "Leadership", "Assemblies", "Welfare", "Sports"];

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    api.get("/gallery/")
      .then(({ data }) => {
        const list = Array.isArray(data) ? data : data.results || [];
        setPhotos(list);
      })
      .catch((err) => console.error("Failed to load gallery photos", err))
      .finally(() => setLoading(false));
  }, []);

  // Helper to categorize photos client-side based on caption keywords
  const getCategory = (photo: Photo): string => {
    const caption = (photo.caption || "").toLowerCase();
    if (caption.includes("chairperson") || caption.includes("vice") || caption.includes("executive") || caption.includes("retreat") || caption.includes("inauguration") || caption.includes("swearing") || caption.includes("meet")) {
      return "Leadership";
    }
    if (caption.includes("assembly") || caption.includes("general") || caption.includes("hall") || caption.includes("debate")) {
      return "Assemblies";
    }
    if (caption.includes("welfare") || caption.includes("health") || caption.includes("sanitation") || caption.includes("hygiene") || caption.includes("wellness")) {
      return "Welfare";
    }
    if (caption.includes("sports") || caption.includes("games") || caption.includes("athletics") || caption.includes("football") || caption.includes("run")) {
      return "Sports";
    }
    return "Assemblies"; // Default categorization to keep grid populated
  };

  const filteredPhotos = photos.filter((p) => {
    if (activeTab === "All") return true;
    return getCategory(p) === activeTab;
  });

  const nextImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
  }, [lightboxIndex, filteredPhotos.length]);

  const prevImage = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
  }, [lightboxIndex, filteredPhotos.length]);

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, nextImage, prevImage]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      
      {/* ── HEADER ─────────────────────────────────────────────────── */}
      <section className="bg-[#130709] text-white py-16 md:py-24 relative overflow-hidden border-b border-white/5 text-center">
        <div className="absolute inset-0 opacity-[0.03] bg-pattern pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative z-10 container mx-auto px-6 max-w-3xl">
          <Badge variant="outline" className="border-gold/30 text-gold mb-3 bg-gold/5 uppercase tracking-widest text-[9px] py-1 px-3">
            MCH Photo Journal
          </Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-black tracking-tight mb-4 text-white">
            Moments in Council Leadership
          </h1>
          <p className="text-white/60 text-sm sm:text-base font-light leading-relaxed max-w-xl mx-auto">
            A visual documentation of student government activities, debates, community outreaches, and sports campaigns at Mengo Senior School.
          </p>
        </div>
      </section>

      {/* ── FILTER TABS ────────────────────────────────────────────── */}
      <div className="container mx-auto px-6 mt-10 md:mt-12 text-center">
        <div className="flex flex-wrap justify-center gap-2 border-b border-border/50 pb-4 max-w-xl mx-auto">
          {CATEGORIES.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                activeTab === tab 
                  ? "bg-primary text-white shadow-md shadow-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTENT GRID ───────────────────────────────────────────── */}
      <div className="container mx-auto px-6 mt-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-xs uppercase tracking-widest font-mono">Loading Gallery...</p>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground space-y-3">
            <ImageIcon className="w-12 h-12 mx-auto opacity-20" />
            <p className="text-base font-serif italic">No photos available in this category.</p>
            <p className="text-xs">Timeline and gallery updates will appear here once published.</p>
          </div>
        ) : (
          <motion.div 
            layout 
            className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
          >
            {filteredPhotos.map((photo, index) => (
              <motion.div
                layout
                key={photo.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="break-inside-avoid relative overflow-hidden rounded-2xl border border-border/30 bg-card group cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                onClick={() => setLightboxIndex(index)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Mengo Council"}
                  className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-500 rounded-t-2xl"
                />
                
                {/* Text and hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-left">
                  <span className="text-gold text-[8px] font-black uppercase tracking-widest mb-1">
                    {getCategory(photo)}
                  </span>
                  <p className="text-white text-xs font-serif leading-snug line-clamp-2">
                    {photo.caption || "Mengo Senior School Student Council Event"}
                  </p>
                  <div className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 p-1.5 rounded-full backdrop-blur-sm transition-colors">
                    <Maximize2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>

                {/* Mobile subtitle fallback */}
                <div className="p-3 text-left block sm:hidden">
                  <span className="text-primary text-[8px] font-black uppercase tracking-widest">
                    {getCategory(photo)}
                  </span>
                  <p className="text-foreground text-xs font-serif leading-snug line-clamp-1 mt-0.5">
                    {photo.caption || "Mengo Senior School Student Council Event"}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* ── LIGHTBOX WINDOW ────────────────────────────────────────── */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex flex-col items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            {/* Upper controls */}
            <div className="absolute top-4 inset-x-0 px-6 flex items-center justify-between z-55">
              <span className="text-white/60 text-xs font-mono tracking-widest">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <div className="flex items-center gap-3">
                <a 
                  href={filteredPhotos[lightboxIndex].url}
                  download
                  onClick={(e) => e.stopPropagation()}
                  className="p-2 text-white/80 hover:text-white transition-colors"
                  title="Download Image"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 text-white/80 hover:text-white transition-colors focus:outline-none"
                  title="Close Lightbox"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Left/Right Buttons */}
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-full backdrop-blur-sm transition-all focus:outline-none z-55"
              title="Previous"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 p-3 text-white/60 hover:text-white hover:bg-white/5 rounded-full backdrop-blur-sm transition-all focus:outline-none z-55"
              title="Next"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Image display container */}
            <div 
              className="relative max-w-4xl max-h-[75vh] px-4 flex items-center justify-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={lightboxIndex}
                  src={filteredPhotos[lightboxIndex].url}
                  alt={filteredPhotos[lightboxIndex].caption || "Lightbox View"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className="max-w-full max-h-[75vh] object-contain rounded-xl border border-white/10 shadow-2xl"
                />
              </AnimatePresence>
            </div>

            {/* Caption & category description */}
            <div 
              className="absolute bottom-6 max-w-2xl px-6 text-center select-none"
              onClick={(e) => e.stopPropagation()}
            >
              <Badge variant="outline" className="border-gold/30 text-gold mb-2 bg-gold/5 uppercase tracking-widest text-[8px] py-0.5 px-2.5">
                {getCategory(filteredPhotos[lightboxIndex])}
              </Badge>
              <p className="text-white text-base sm:text-lg font-serif leading-relaxed">
                {filteredPhotos[lightboxIndex].caption || "Mengo Senior School Student Council Initiatives"}
              </p>
              
              {/* Additional uploader metadata */}
              <div className="mt-3 text-white/50 text-[10px] sm:text-xs font-mono flex items-center justify-center gap-3 flex-wrap">
                <span>By: {filteredPhotos[lightboxIndex].owner_role ? filteredPhotos[lightboxIndex].owner_role.replace('_', ' ').toUpperCase() : "COUNCIL OFFICER"}</span>
                {filteredPhotos[lightboxIndex].owner_class && (
                  <span>Class: {filteredPhotos[lightboxIndex].owner_class} {filteredPhotos[lightboxIndex].owner_stream || ""}</span>
                )}
                <span>Date: {filteredPhotos[lightboxIndex].created_at ? new Date(filteredPhotos[lightboxIndex].created_at).toLocaleDateString() : ""}</span>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
