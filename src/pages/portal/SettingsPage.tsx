import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";

export default function SettingsPage() {
  const { profile, hasAnyRole } = useAuth();
  
  const [profileName, setProfileName] = useState(profile?.full_name || "");
  const [profileDesc, setProfileDesc] = useState((profile as any)?.description || "");
  const [profilePic, setProfilePic] = useState((profile as any)?.profile_pic || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const canEditName = hasAnyRole(["chairperson", "patron", "adminabsolute"]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload: any = { description: profileDesc, profile_pic: profilePic };
      if (canEditName) payload.full_name = profileName;
      await api.patch('/users/me/profile/', payload);
      toast.success("Profile updated globally! (Refresh to see header update)");
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

      <Card>
        <CardHeader>
          <CardTitle>Edit Your Profile</CardTitle>
          <CardDescription>Update your public information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input 
              value={profileName} 
              onChange={e => setProfileName(e.target.value)} 
              disabled={!canEditName} 
            />
            {!canEditName && <p className="text-xs text-muted-foreground">Only Admins can change official names.</p>}
          </div>
          <div className="space-y-2">
            <Label>Profile Picture URL</Label>
            <Input 
              value={profilePic} 
              onChange={e => setProfilePic(e.target.value)} 
              placeholder="https://example.com/photo.jpg" 
            />
            {profilePic && <img src={profilePic} alt="Preview" className="h-16 w-16 rounded-full border object-cover mt-2" />}
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
