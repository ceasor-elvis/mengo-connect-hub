import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Loader2, RefreshCcw } from "lucide-react";
import HierarchyTree, { TREE } from "@/components/portal/HierarchyTree";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";

export default function HierarchyPage() {
  const { profile, roles } = useAuth();
  const [councillors, setCouncillors] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");

  const isAdminOrCP = roles?.some(r => ["adminabsolute", "chairperson"].includes(r));

  useEffect(() => {
    if (isAdminOrCP) {
      api.get("/users/councillors/")
        .then(({ data }) => setCouncillors(Array.isArray(data) ? data : data.results || []))
        .catch(() => toast.error("Failed to load members"))
        .finally(() => setLoadingUsers(false));
    }
  }, [isAdminOrCP]);

  const handleAssign = async () => {
    if (!selectedUser || !selectedRole) return;
    setUpdating(true);
    try {
      await api.post("/users/upgrade-role/", {
        user_id: selectedUser,
        new_role: selectedRole,
      });
      toast.success("Cabinet position updated!");
      setRefreshKey(prev => prev + 1);
      setSelectedRole("");
      setSelectedUser("");
    } catch (e) {
      toast.error("Failed to update position");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-xl font-bold sm:text-2xl flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Council Hierarchy
          </h1>
          <p className="text-xs text-muted-foreground">Organizational structure and Cabinet management</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
          <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Refresh View
        </Button>
      </div>

      {isAdminOrCP && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider">
              <UserPlus className="h-4 w-4" /> Manage Cabinet Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-muted-foreground">1. Select Member</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select a councillor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {councillors.map(c => (
                      <SelectItem key={c.user_id} value={c.user_id}>{c.full_name} ({c.student_class})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[11px] uppercase font-bold text-muted-foreground">2. Assign Position</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {TREE.map(node => (
                      <SelectItem key={node.role} value={node.role}>{node.label}</SelectItem>
                    ))}
                    <SelectItem value="councillor">Strip to Mere Councillor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleAssign} 
                disabled={updating || !selectedUser || !selectedRole}
                className="w-full"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />} 
                Confirm Assignment
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic">
              Note: Assigning a leadership position will automatically update their permissions and the public hierarchy tree.
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2 px-3 sm:px-6 border-b mb-4">
          <CardTitle className="text-sm font-semibold">Council Structure & Current Officers</CardTitle>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          <HierarchyTree refreshKey={refreshKey} />
        </CardContent>
      </Card>
    </div>
  );
}
