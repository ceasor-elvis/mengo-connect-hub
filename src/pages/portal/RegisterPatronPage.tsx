import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Shield, Loader2, Briefcase, MapPin, Hash, Trash2, Edit2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function RegisterPatronPage() {
  const { hasPermission } = useAuth();
  const isAdminAbsolute = hasPermission("manage_permissions");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [existingPatron, setExistingPatron] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    title: "",
    fullName: "",
    staffId: "",
    department: "",
    officeLocation: "",
    username: "",
    password: "",
  });

  const fetchPatron = async () => {
    setFetching(true);
    try {
      const res = await api.get("/users/all-profiles/");
      const profiles = Array.isArray(res.data) ? res.data : (res.data.results || []);
      const patron = profiles.find((p: any) => p.role === "patron");
      setExistingPatron(patron);
      if (patron) {
        // Try to separate title from name if possible
        const titles = ["Mr.", "Mrs.", "Ms.", "Dr.", "Rev.", "Hon."];
        let title = "";
        let fullName = patron.full_name;
        
        for (const t of titles) {
          if (patron.full_name.startsWith(t)) {
            title = t;
            fullName = patron.full_name.replace(t, "").trim();
            break;
          }
        }

        setFormData({
          title,
          fullName,
          staffId: patron.staff_id || "",
          department: patron.department || "",
          officeLocation: patron.office_location || "",
          username: patron.username || "",
          password: "", // Keep password empty for updates unless specifically handled
        });
      }
    } catch (e: any) {
      toast.error("Failed to load patron data");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchPatron();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.staffId || !formData.username || (!isEditing && !formData.password)) {
      toast.error("Please fill in all required fields (*)");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && existingPatron) {
        await api.patch(`/users/${existingPatron.user_id}/profile/admin/`, {
          username: formData.username,
          full_name: `${formData.title} ${formData.fullName}`.trim(),
          staff_id: formData.staffId,
          department: formData.department,
          office_location: formData.officeLocation,
          role: "patron"
        });
        toast.success(`Patron details updated successfully!`);
        setIsEditing(false);
      } else {
        await api.post("/users/register/", {
          username: formData.username,
          password: formData.password,
          full_name: `${formData.title} ${formData.fullName}`.trim(),
          role: "patron",
          staff_id: formData.staffId,
          department: formData.department,
          office_location: formData.officeLocation,
        });
        toast.success(`Patron ${formData.fullName} has been registered!`);
      }
      fetchPatron();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Action failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingPatron) return;
    if (!window.confirm(`Are you sure you want to remove ${existingPatron.full_name}? This will securely wipe their system information and demote their role permanently.`)) return;

    setLoading(true);
    try {
      await api.patch(`/users/${existingPatron.user_id}/profile/admin/`, {
        full_name: "Removed Council Patron",
        staff_id: "REMOVED",
        department: "N/A",
        office_location: "N/A",
        role: "councillor"
      });
      toast.success("Patron securely anonymized and removed from office.");
      setExistingPatron(null);
      setFormData({
        title: "",
        fullName: "",
        staffId: "",
        department: "",
        officeLocation: "",
        username: "",
        password: "",
      });
    } catch (e: any) {
      toast.error(e.response?.data?.detail || "Failed to remove patron completely.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">Checking for existing records...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" /> Council Body: Patron Management
        </h1>
        <p className="mt-2 text-muted-foreground">
          {existingPatron 
            ? "Manage the school's Council Patron. You can update details or replace the current patron."
            : "Formally appoint and register the school's Council Patron."}
        </p>
      </div>

      {existingPatron && !isEditing ? (
        <Card className="border-primary/20 shadow-lg overflow-hidden">
          <div className="bg-primary/5 p-6 border-b border-primary/10">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-primary">{existingPatron.full_name}</h2>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Council Patron</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit Details
                </Button>
                {isAdminAbsolute && (
                  <Button variant="destructive" size="sm" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                )}
              </div>
            </div>
          </div>
          <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Staff ID</p>
                <p className="font-mono text-sm bg-muted/50 px-2 py-1 rounded inline-block">{existingPatron.staff_id || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Department</p>
                <p className="text-sm font-medium">{existingPatron.department || "Not Specified"}</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Username</p>
                <p className="text-sm font-medium">@{existingPatron.username}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Office Location</p>
                <p className="text-sm font-medium">{existingPatron.office_location || "Not Specified"}</p>
              </div>
            </div>
          </CardContent>
          <div className="bg-amber-50 p-4 border-t border-amber-100">
            <p className="text-xs text-amber-800 flex items-center gap-2">
              <Shield className="h-3 w-3" /> To register a new patron, you must remove the existing one first.
            </p>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleRegister} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">{isEditing ? "Edit Patron Details" : "Register New Patron"}</h2>
            {isEditing && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" /> Cancel Edit
              </Button>
            )}
          </div>
          
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Patron Professional Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-1 space-y-2">
                  <Label>Title</Label>
                  <Select value={formData.title} onValueChange={(v) => handleChange("title", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Title" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Mr.", "Mrs.", "Ms.", "Dr.", "Rev.", "Hon."].map(t => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label>Full Name *</Label>
                  <Input 
                    placeholder="Official Name" 
                    value={formData.fullName} 
                    onChange={(e) => handleChange("fullName", e.target.value)} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Hash className="h-3 w-3" /> Staff ID *
                  </Label>
                  <Input 
                    placeholder="e.g. MSS/STAFF/001" 
                    value={formData.staffId} 
                    onChange={(e) => handleChange("staffId", e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3" /> Department
                  </Label>
                  <Input 
                    placeholder="e.g. Sciences / Administration" 
                    value={formData.department} 
                    onChange={(e) => handleChange("department", e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Office Location
                </Label>
                <Input 
                  placeholder="e.g. Main Admin Block, Room 4" 
                  value={formData.officeLocation} 
                  onChange={(e) => handleChange("officeLocation", e.target.value)} 
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Shield className="h-4 w-4" /> Account Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Username *</Label>
                  <Input 
                    placeholder="e.g. patron01" 
                    value={formData.username} 
                    onChange={(e) => handleChange("username", e.target.value.toLowerCase().replace(/\s/g, ""))} 
                  />
                </div>
                {!isEditing && (
                  <div className="space-y-2">
                    <Label>Temporary Password *</Label>
                    <Input 
                      type="password" 
                      placeholder="Min. 6 characters" 
                      value={formData.password} 
                      onChange={(e) => handleChange("password", e.target.value)} 
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : isEditing ? (
              <Edit2 className="mr-2 h-4 w-4" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {loading ? (isEditing ? "Updating..." : "Registering...") : (isEditing ? "Save Changes" : "Register Council Patron")}
          </Button>
        </form>
      )}
    </div>
  );
}
