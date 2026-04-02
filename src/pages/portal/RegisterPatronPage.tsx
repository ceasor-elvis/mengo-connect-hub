import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserPlus, Shield, Loader2, Briefcase, MapPin, Hash } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

export default function RegisterPatronPage() {
  const [loading, setLoading] = useState(false);
  
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

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.staffId || !formData.username || !formData.password) {
      toast.error("Please fill in all required fields (*)");
      return;
    }

    setLoading(true);
    try {
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
      // Reset form
      setFormData({
        title: "",
        fullName: "",
        staffId: "",
        department: "",
        officeLocation: "",
        username: "",
        password: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to register Patron.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Council Body: Register Patron
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Formally appoint and register the school's Council Patron.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Patron Personal Details</CardTitle>
            <CardDescription>Professional information for the Council Patron.</CardDescription>
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
          <CardHeader>
            <CardTitle className="text-sm font-bold uppercase tracking-wider">Account Credentials</CardTitle>
            <CardDescription>These details will be used for system login.</CardDescription>
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
              <div className="space-y-2">
                <Label>Temporary Password *</Label>
                <Input 
                  type="password" 
                  placeholder="Min. 6 characters" 
                  value={formData.password} 
                  onChange={(e) => handleChange("password", e.target.value)} 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <UserPlus className="mr-2 h-4 w-4" />
          )}
          {loading ? "Registering Patron..." : "Register Council Patron"}
        </Button>
      </form>
    </div>
  );
}
