import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Trash2, Plus, Image as ImageIcon, Loader2, Upload } from "lucide-react";
import { useActivityLog } from "@/hooks/useActivityLog";

interface BackgroundImage {
  id: string;
  title: string;
  file_url: string;
}

export default function HomeLayoutPage() {
  const [images, setImages] = useState<BackgroundImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { log } = useActivityLog();

  const fetchImages = async () => {
    try {
      const { data } = await api.get("/home-layouts/");
      const entries = Array.isArray(data) ? data : data.results || [];
      setImages(entries);
    } catch (error) {
      toast.error("Failed to load background images");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's an image
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", "slideshow_img");

    try {
      await api.post("/home-layouts/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Background uploaded successfully!");
      log("uploaded a new homepage background", "layout");
      fetchImages();
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/home-layouts/${id}/`);
      toast.success("Image removed");
      log("removed a homepage background", "layout");
      fetchImages();
    } catch (error) {
      toast.error("Failed to delete image");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="font-serif text-2xl font-bold text-primary sm:text-3xl">Home Layout Manager</h1>
        <p className="text-sm text-muted-foreground">Manage the background images seen on the website's landing page.</p>
      </div>

      <Card className="border-primary/10 shadow-sm overflow-hidden">
        <CardHeader className="bg-primary/5 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload New Background
          </CardTitle>
          <CardDescription>Images will cycle in a smooth slideshow on the home page.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/20 rounded-xl p-10 bg-muted/30 transition-colors hover:bg-muted/50">
            <input 
              type="file" 
              id="bg-upload" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload} 
              disabled={uploading}
            />
            <Label 
              htmlFor="bg-upload" 
              className={`flex flex-col items-center gap-4 cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : ""}`}
            >
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                {uploading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImageIcon className="h-8 w-8 text-primary" />}
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">{uploading ? "Uploading..." : "Click to select image"}</p>
                <p className="text-sm text-muted-foreground">Recommended: High resolution landscape photos (1920x1080)</p>
              </div>
            </Label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-primary" />
          <h2 className="font-bold text-xl">Active Slideshow Images</h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
        ) : images.length === 0 ? (
          <Card className="border-dashed py-16 text-center text-muted-foreground italic">
            No custom backgrounds uploaded yet. The default school photos are active.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((img) => (
              <Card key={img.id} className="group overflow-hidden border-border/50 hover:shadow-lg transition-all duration-300">
                <div className="aspect-video relative overflow-hidden">
                  <img 
                    src={img.file_url} 
                    alt="Background" 
                    className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(img.id)} className="h-10 w-10">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-3 bg-card border-t flex justify-between items-center">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase">{String(img.id).split('-')[0]}</span>
                  <p className="text-xs font-bold text-primary">Active in Slideshow</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
