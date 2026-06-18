import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Lock, ShieldAlert, LogOut, ImagePlus, Settings2, Fingerprint, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SettingsPage() {
  const { user, profile, hasPermission } = useAuth();
  const isAdmin = hasPermission("manage_permissions");

  const [username, setUsername] = useState(user?.username || "");
  const [profileBio, setProfileBio] = useState((profile as any)?.bio || "");
  const [profilePic, setProfilePic] = useState((profile as any)?.profile_pic || "");
  const [newProfilePic, setNewProfilePic] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Council Config state
  const [orgName, setOrgName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [chairpersonName, setChairpersonName] = useState("");
  const [chairpersonQuote, setChairpersonQuote] = useState("");
  const [chairpersonTitle, setChairpersonTitle] = useState("");
  const [chairpersonTenure, setChairpersonTenure] = useState("");
  const [chairpersonInitials, setChairpersonInitials] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setProfilePic(dataUrl);
        setNewProfilePic(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const payload: Record<string, any> = { username, bio: profileBio };
      if (newProfilePic) {
        payload.profile_pic = newProfilePic;
      }
      await api.patch('/users/me/profile/', payload);
      setNewProfilePic(null);
      toast.success("Profile updated successfully!");
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
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
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

  useEffect(() => {
    const fetchConfig = async () => {
      if (!isAdmin && !['chairperson', 'general_secretary', 'adminabsolute'].includes(profile?.role || '')) return;
        try {
          const { data } = await api.get('/council-config/');
          setOrgName(data.org_name || "");
          setSlogan(data.slogan || "");
          setChairpersonName(data.chairperson_name || "");
          setChairpersonQuote(data.chairperson_quote || "");
          setChairpersonTitle(data.chairperson_title || "");
          setChairpersonTenure(data.chairperson_tenure || "");
          setChairpersonInitials(data.chairperson_initials || "");
        } catch (err) { /* silent fail */ }
    };
    fetchConfig();
  }, [isAdmin, profile?.role]);

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.post('/council-config/', { 
        org_name: orgName, 
        slogan,
        chairperson_name: chairpersonName,
        chairperson_quote: chairpersonQuote,
        chairperson_title: chairpersonTitle,
        chairperson_tenure: chairpersonTenure,
        chairperson_initials: chairpersonInitials,
      });
      toast.success("Council configuration updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to update configuration");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-black tracking-tight flex items-center gap-3">
          <Fingerprint className="w-8 h-8 text-primary" />
          Command Center Identity
        </h1>
        <p className="mt-2 text-sm text-muted-foreground font-medium">Manage your secure council profile and system configurations.</p>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-6">
        {/* Read-Only Info */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldCheck className="w-32 h-32" />
            </div>
            <CardHeader className="pb-4 relative z-10">
              <CardTitle className="text-lg flex items-center gap-2 font-serif font-black">
                <Lock className="h-4 w-4 text-emerald-500" />
                Verified Registration Details
              </CardTitle>
              <CardDescription className="text-xs font-medium">These immutable fields were established during your council induction.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal Full Name</Label>
                <div className="h-12 flex items-center rounded-xl bg-muted/50 px-4 text-sm font-bold text-foreground font-mono tracking-wide">
                  {profile?.full_name || "—"}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Class</Label>
                  <div className="h-12 flex items-center rounded-xl bg-muted/50 px-4 text-sm font-bold text-foreground font-mono">
                    {(profile as any)?.student_class || "—"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stream</Label>
                  <div className="h-12 flex items-center rounded-xl bg-muted/50 px-4 text-sm font-bold text-foreground font-mono">
                    {(profile as any)?.stream || "—"}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender</Label>
                  <div className="h-12 flex items-center rounded-xl bg-muted/50 px-4 text-sm font-bold text-foreground capitalize font-mono">
                    {(profile as any)?.gender || "—"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Editable Info */}
        <motion.div variants={itemVariants}>
          <Card className="border-border/50 bg-card/40 backdrop-blur-xl shadow-lg">
            <CardHeader>
              <CardTitle className="font-serif font-black text-xl">Identity Customization</CardTitle>
              <CardDescription className="text-xs font-medium">Personalize your system handle, biography, and avatar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="col-span-1 flex flex-col items-center justify-start space-y-3">
                  <div className="relative h-28 w-28 overflow-hidden rounded-full border-4 border-background shadow-xl bg-muted">
                    {profilePic ? (
                      <img src={profilePic} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                        <ImagePlus className="w-8 h-8 opacity-50" />
                      </div>
                    )}
                  </div>
                  <Label htmlFor="picture" className="cursor-pointer w-full">
                    <div className="w-full h-10 rounded-xl bg-secondary hover:bg-secondary/80 flex items-center justify-center text-xs font-bold transition-all shadow-sm">
                      Change Avatar
                    </div>
                  </Label>
                  <Input id="picture" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                
                <div className="col-span-3 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Username</Label>
                    <Input
                      value={username}
                      onChange={e => setUsername(e.target.value.replace(/\s/g, ""))}
                      className="bg-background/50 h-12 rounded-xl focus-visible:ring-primary/20 font-mono"
                      placeholder="e.g. shadow"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Bio / Introduction</Label>
                    <Textarea
                      value={profileBio}
                      onChange={e => setProfileBio(e.target.value)}
                      rows={4}
                      className="bg-background/50 rounded-xl focus-visible:ring-primary/20 resize-none"
                      placeholder="Brief description of your role and vision..."
                    />
                  </div>
                  <Button onClick={handleSaveProfile} disabled={savingProfile} className="h-12 rounded-xl w-full font-bold shadow-lg shadow-primary/20">
                    {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Apply Identity Changes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Info */}
        <motion.div variants={itemVariants}>
          <Card className="border-red-500/20 bg-red-500/5 backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ShieldAlert className="w-32 h-32 text-red-500" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="font-serif font-black text-xl text-red-600 dark:text-red-400">Security Credentials</CardTitle>
              <CardDescription className="text-xs font-medium text-red-600/70 dark:text-red-400/70">Update your access key to maintain system integrity.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Access Key</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  className="bg-background/50 h-12 rounded-xl focus-visible:ring-red-500/20"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">New Access Key</Label>
                  <Input
                    type="password"
                    placeholder="Min. 8 chars"
                    className="bg-background/50 h-12 rounded-xl focus-visible:ring-red-500/20"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confirm New Access Key</Label>
                  <Input
                    type="password"
                    placeholder="Confirm"
                    className="bg-background/50 h-12 rounded-xl focus-visible:ring-red-500/20"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                variant="outline"
                className="h-12 rounded-xl w-full border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold"
                onClick={handleChangePassword} 
                disabled={changingPassword}
              >
                {changingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update Credentials
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Organization Settings — Chairperson only */}
        {(isAdmin || ['chairperson', 'general_secretary', 'adminabsolute'].includes(profile?.role || '')) && (
          <motion.div variants={itemVariants}>
            <Card className="border-amber-500/20 bg-amber-500/5 backdrop-blur-xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <Settings2 className="w-32 h-32 text-amber-500" />
              </div>
              <CardHeader className="relative z-10">
                <CardTitle className="font-serif font-black text-xl text-amber-600 dark:text-amber-400">Global Council Settings</CardTitle>
                <CardDescription className="text-xs font-medium text-amber-600/70 dark:text-amber-400/70">Modify system-wide organization variables.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Organization Entity Name</Label>
                    <Input
                      value={orgName}
                      onChange={e => setOrgName(e.target.value)}
                      className="bg-background/50 h-12 rounded-xl focus-visible:ring-amber-500/20 font-bold"
                      placeholder="e.g. MENGO SENIOR SCHOOL COUNCIL BODY"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Slogan</Label>
                    <Input
                      value={slogan}
                      onChange={e => setSlogan(e.target.value)}
                      className="bg-background/50 h-12 rounded-xl focus-visible:ring-amber-500/20 font-bold italic"
                      placeholder="e.g. ANOINTED TO BEAR FRUIT"
                    />
                  </div>
                </div>

                <div className="border-t border-amber-500/20 pt-6 space-y-4">
                  <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 tracking-tight">Homepage Executive Display</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Executive Title</Label>
                      <Input
                        value={chairpersonTitle}
                        onChange={e => setChairpersonTitle(e.target.value)}
                        className="bg-background/50 h-12 rounded-xl focus-visible:ring-amber-500/20"
                        placeholder="e.g. Student Council Chairperson"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tenure Designation</Label>
                      <Input
                        value={chairpersonTenure}
                        onChange={e => setChairpersonTenure(e.target.value)}
                        className="bg-background/50 h-12 rounded-xl focus-visible:ring-amber-500/20"
                        placeholder="e.g. Mengo Senior School · 2025/2026"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Official Address / Quote</Label>
                    <Textarea
                      value={chairpersonQuote}
                      onChange={e => setChairpersonQuote(e.target.value)}
                      rows={4}
                      className="bg-background/50 rounded-xl focus-visible:ring-amber-500/20 resize-none font-serif text-lg leading-relaxed"
                      placeholder="Enter the official address or quote..."
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleSaveConfig} 
                  disabled={savingConfig} 
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-lg shadow-amber-500/20"
                >
                  {savingConfig && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Commit Global Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
