import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, profile } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [profileBio, setProfileBio] = useState((profile as any)?.bio || "");
  const [profilePic, setProfilePic] = useState((profile as any)?.profile_pic || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Slideshow Management State
  const [slideshowImages, setSlideshowImages] = useState<any[]>([]);
  const [loadingSlideshow, setLoadingSlideshow] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState(false);

  const isAdmin = useAuth().hasAnyRole(["adminabsolute", "chairperson"]);

  const fetchSlides = async () => {
    if (!isAdmin) return;
    setLoadingSlideshow(true);
    try {
      const { data } = await api.get("/documents/");
      const entries = Array.isArray(data) ? data : data.results || [];
      const slides = entries.filter((d: any) => d.title === "slideshow_img");
      setSlideshowImages(slides);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSlideshow(false);
    }
  };

  useEffect(() => {
    fetchSlides();
  }, [isAdmin]);

  const handleUploadSlide = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSlide(true);
    try {
      const formData = new FormData();
      formData.append("title", "slideshow_img");
      formData.append("category", "Other");
      formData.append("access_level", "public");
      formData.append("file", file);

      await api.post("/documents/", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Slideshow image uploaded!");
      fetchSlides();
    } catch (err) {
      toast.error("Failed to upload slide.");
    } finally {
      setUploadingSlide(false);
    }
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm("Remove this image from the slideshow?")) return;
    try {
      await api.delete(`/documents/${id}/`);
      toast.success("Image removed.");
      fetchSlides();
    } catch (err) {
      toast.error("Failed to delete image.");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePic(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await api.patch('/users/me/profile/', {
        username,
        bio: profileBio,
        profile_pic: profilePic,
      });
      toast.success("Profile updated! (Refresh to see header update)");
    } catch(e) {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setChangingPassword(true);
    try {
      await api.post('/users/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold">Profile Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your public information on the council portal.</p>
      </div>

      {/* Read-Only Info — set during registration */}
      <Card className="border-stone-200 bg-stone-50/50 dark:bg-stone-900/30">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            Registration Details
          </CardTitle>
          <CardDescription className="text-xs">These fields were set during registration and cannot be changed here.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <div className="h-9 flex items-center rounded-md border border-stone-200 bg-stone-100/70 dark:bg-stone-800/50 px-3 text-sm font-medium text-foreground">
              {profile?.full_name || "—"}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Class</Label>
              <div className="h-9 flex items-center rounded-md border border-stone-200 bg-stone-100/70 dark:bg-stone-800/50 px-3 text-sm text-foreground">
                {(profile as any)?.student_class || "—"}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Stream</Label>
              <div className="h-9 flex items-center rounded-md border border-stone-200 bg-stone-100/70 dark:bg-stone-800/50 px-3 text-sm text-foreground">
                {(profile as any)?.stream || "—"}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Gender</Label>
              <div className="h-9 flex items-center rounded-md border border-stone-200 bg-stone-100/70 dark:bg-stone-800/50 px-3 text-sm text-foreground capitalize">
                {(profile as any)?.gender || "—"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Editable Info */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Password</Label>
            <Input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input
                type="password"
                placeholder="Min. 6 chars"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                placeholder="Confirm"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <Button 
            variant="outline"
            className="border-primary/20 text-primary hover:bg-primary/5"
            onClick={handleChangePassword} 
            disabled={changingPassword}
          >
            {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Editable Info */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
          <CardDescription>Update your username, bio, and profile picture.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Your display username"
            />
          </div>
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <div className="flex items-center gap-4 mt-2">
              <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-muted">
                {profilePic ? (
                  <img src={profilePic} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">None</div>
                )}
              </div>
              <div>
                <Label htmlFor="picture" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
                    Upload Picture
                  </div>
                </Label>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Introduction / Bio</Label>
            <Textarea
              value={profileBio}
              onChange={e => setProfileBio(e.target.value)}
              rows={4}
              placeholder="Tell the school about yourself..."
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Admin Slideshow Management */}
      {isAdmin && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Hero Slideshow Management</CardTitle>
            <CardDescription>Upload or remove images displayed on the homepage background slideshow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
              <div>
                <Label htmlFor="slide_upload" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2">
                    {uploadingSlide ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                    Upload New Image
                  </div>
                </Label>
                <Input
                  id="slide_upload"
                  type="file"
                  accept="image/*"
                  onChange={handleUploadSlide}
                  className="hidden"
                  disabled={uploadingSlide}
                />
              </div>
              <p className="text-xs text-muted-foreground">Images should ideally be 1920x1080 (16:9) format.</p>
            </div>

            <div className="pt-4">
              <Label className="mb-2 block">Current Custom Images ({slideshowImages.length})</Label>
              {loadingSlideshow ? (
                <div className="flex items-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading slides...</div>
              ) : slideshowImages.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-primary/20 text-center opacity-70">
                  <p className="text-xs font-medium italic">No custom images uploaded yet. Homepage is using defaults.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {slideshowImages.map((doc: any) => {
                    const fileUrl = doc.file_url || doc.file || "#";
                    return (
                      <div key={doc.id} className="relative group rounded-lg overflow-hidden border bg-background aspect-video shadow-sm">
                        <img src={fileUrl} alt="Slide" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeleteSlide(doc.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
