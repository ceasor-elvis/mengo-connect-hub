import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

export default function GalleryManagerPage() {
  const { hasPermission } = useAuth();
  const canManageGallery = hasPermission("manage_blog");
  
  const [gallery, setGallery] = useState<any[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [galleryCaption, setGalleryCaption] = useState("");
  const [galleryFile, setGalleryFile] = useState<string | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);

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
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold font-heading">Gallery Manager</h1>
        <p className="text-sm text-muted-foreground">Manage the photos displayed in the public 3D gallery.</p>
      </div>

      {canManageGallery && (
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
      )}
      
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          Gallery Management
        </h3>
        {loadingGallery ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : gallery.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-lg bg-muted/20">No photos in gallery.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((photo) => (
              <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden border bg-muted shadow-sm hover:shadow-md transition-shadow">
                <img src={photo.url} alt={photo.caption} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center">
                  <p className="text-[11px] font-semibold text-white line-clamp-2 mb-1.5">{photo.caption || "No caption"}</p>
                  
                  {/* Uploader additional information */}
                  <div className="text-[9px] text-stone-300 font-mono space-y-0.5 mb-3">
                    <p>Role: {photo.owner_role ? photo.owner_role.replace('_', ' ').toUpperCase() : "COUNCIL"}</p>
                    {photo.owner_class && (
                      <p>Class: {photo.owner_class} {photo.owner_stream || ""}</p>
                    )}
                    <p>Date: {photo.created_at ? new Date(photo.created_at).toLocaleDateString() : ""}</p>
                  </div>

                  {canManageGallery && (
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      className="h-7 px-2.5 text-[10px] font-bold" 
                      onClick={() => handleDeletePhoto(photo.id)}
                    >
                      <X className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
