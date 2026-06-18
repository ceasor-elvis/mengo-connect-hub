import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Image as ImageIcon, X, Images, UploadCloud, Info } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: "spring", stiffness: 100, damping: 15 } }
};

export default function GalleryManagerPage() {
  const { hasPermission } = useAuth();
  const canManageGallery = hasPermission("manage_blog");
  
  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

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
    fetchGallery();
  }, []);

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
      setIsUploadOpen(false);
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

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12 relative min-h-screen"
    >
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 relative">
        <div className="space-y-1">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-600 dark:text-pink-400 text-xs font-bold uppercase tracking-wider"
          >
            <Images className="w-3 h-3" /> Visual Media
          </motion.div>
          <h1 className="font-serif text-4xl sm:text-5xl font-black tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60">
            Gallery Manager
          </h1>
          <p className="text-muted-foreground/80 mt-2 text-sm sm:text-base font-medium max-w-xl leading-relaxed">
            Curate and manage photos displayed in the public 3D gallery. Showcase council events and student life.
          </p>
        </div>

        {canManageGallery && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl gap-2 font-bold shadow-lg shadow-pink-500/20 bg-pink-600 hover:bg-pink-700 text-white h-12 px-6">
                <UploadCloud className="h-5 w-5" /> Add New Photo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl rounded-3xl border-border/40 bg-background/80 backdrop-blur-2xl shadow-2xl p-0 overflow-hidden">
              <div className="p-6 border-b border-border/20 bg-pink-500/5">
                <DialogTitle className="font-serif text-2xl font-black text-pink-700 dark:text-pink-400">Upload to Gallery</DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Images will appear in the public 3D gallery experience.</p>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="caption" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Photo Caption</Label>
                    <Input 
                      id="caption"
                      className="bg-muted/30 rounded-xl border-border/50 focus-visible:ring-pink-500/20 h-12"
                      value={galleryCaption} 
                      onChange={e => setGalleryCaption(e.target.value)} 
                      placeholder="e.g. Football Finals 2025" 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Image File</Label>
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="bg-muted/30 rounded-xl border-border/50 file:rounded-md file:border-0 file:bg-pink-500/10 file:text-pink-600 file:font-bold file:px-3 file:py-1 h-12 pt-2 cursor-pointer hover:file:bg-pink-500/20" 
                    />
                  </div>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2 text-blue-700 dark:text-blue-400">
                    <Info className="h-4 w-4 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium leading-relaxed">For best results in the 3D gallery, use high-quality landscape (16:9) or portrait (9:16) photos.</p>
                  </div>
                  <div className="pt-2">
                    <Button onClick={handleGalleryUpload} disabled={uploadingGallery || !galleryFile} className="w-full h-12 rounded-xl font-bold bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/20 transition-all">
                      {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UploadCloud className="h-4 w-4 mr-2" />} 
                      {uploadingGallery ? "Uploading..." : "Publish to Gallery"}
                    </Button>
                  </div>
                </div>
                <div className="aspect-square sm:aspect-video md:aspect-square rounded-2xl bg-muted/20 border-2 border-dashed border-border/50 flex items-center justify-center overflow-hidden relative group">
                   {galleryFile ? (
                     <>
                       <img src={galleryFile} alt="Preview" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                         <p className="text-white font-bold text-sm line-clamp-2">{galleryCaption || "No caption provided"}</p>
                       </div>
                     </>
                   ) : (
                     <div className="text-center p-6 flex flex-col items-center">
                       <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4 border border-border/50 shadow-sm">
                         <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                       </div>
                       <p className="text-sm font-bold text-foreground">Image Preview</p>
                       <p className="text-xs text-muted-foreground mt-1 text-center max-w-[200px]">Select a file from your device to see how it will look.</p>
                     </div>
                   )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </section>
      
      {/* Gallery Grid */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-foreground">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold">Published Gallery</h3>
            <p className="text-sm text-muted-foreground font-medium">Currently visible on the public site.</p>
          </div>
        </div>

        {loadingGallery ? (
          <div className="flex justify-center py-20">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}>
              <div className="h-10 w-10 border-4 border-pink-500 border-t-transparent rounded-full drop-shadow-lg" />
            </motion.div>
          </div>
        ) : gallery.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-3xl bg-muted/10 backdrop-blur-sm">
            <Images className="h-16 w-16 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl font-bold text-foreground">Gallery is empty</h3>
            <p className="text-sm text-muted-foreground mt-1">Upload some photos to create the 3D experience.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <AnimatePresence>
              {gallery.map((photo) => (
                <motion.div key={photo.id} variants={itemVariants} layout initial="hidden" animate="visible" exit={{ opacity: 0, scale: 0.9 }}>
                  <div className="group relative aspect-[4/5] rounded-3xl overflow-hidden border border-border/40 bg-card shadow-sm hover:shadow-2xl hover:shadow-pink-500/10 hover:-translate-y-1 transition-all duration-300">
                    <img src={photo.url} alt={photo.caption} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
                      <p className="text-sm font-bold text-white line-clamp-2 mb-3 leading-snug">{photo.caption || "Untitled Image"}</p>
                      
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-white/10 text-white border-white/20 backdrop-blur-md">
                            {photo.owner_role ? photo.owner_role.replace('_', ' ') : "COUNCIL"}
                          </Badge>
                          {photo.owner_class && (
                            <Badge variant="outline" className="text-[9px] uppercase font-black tracking-widest bg-white/10 text-white border-white/20 backdrop-blur-md">
                              {photo.owner_class} {photo.owner_stream || ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                          {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : ""}
                        </p>
                      </div>

                      {canManageGallery && (
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          className="w-full h-9 rounded-xl text-xs font-bold bg-red-600/90 hover:bg-red-600 backdrop-blur-md border border-red-500/50" 
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          <X className="h-3.5 w-3.5 mr-1.5" /> Remove from Gallery
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
