import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { user, profile } = useAuth();

  const [username, setUsername] = useState(user?.username || "");
  const [profileDesc, setProfileDesc] = useState((profile as any)?.description || "");
  const [profilePic, setProfilePic] = useState((profile as any)?.profile_pic || "");
  const [savingProfile, setSavingProfile] = useState(false);

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
        description: profileDesc,
        profile_pic: profilePic,
      });
      toast.success("Profile updated! (Refresh to see header update)");
    } catch(e) {
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
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
              value={profileDesc}
              onChange={e => setProfileDesc(e.target.value)}
              rows={4}
              placeholder="Tell the school about yourself..."
            />
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile}>
            {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
