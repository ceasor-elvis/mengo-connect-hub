import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Save, X, Edit, MoveRight, Layers, ArrowDown } from "lucide-react";
import { RoleNode, ICON_MAP, useHierarchy, DEFAULT_TREE } from "@/hooks/useHierarchy";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

const COLOR_OPTIONS = [
  { label: "Primary (Gold/Blue)", value: "bg-primary text-primary-foreground" },
  { label: "Accent", value: "bg-accent text-accent-foreground" },
  { label: "Muted", value: "bg-muted text-muted-foreground" },
  { label: "Destructive", value: "bg-destructive text-destructive-foreground" }
];

export default function StructureEditor({ onTreeUpdated }: { onTreeUpdated: () => void }) {
  const { tree: initialTree, loading } = useHierarchy();
  const [nodes, setNodes] = useState<RoleNode[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setNodes(JSON.parse(JSON.stringify(initialTree))); // Deep copy
    }
  }, [initialTree, loading]);

  const handleAddNode = () => {
    const newNode: RoleNode = {
      role: `new_role_${Date.now()}`,
      label: "New Role",
      iconName: "User",
      color: "bg-muted text-muted-foreground",
      children: []
    };
    setNodes([...nodes, newNode]);
    setSelectedRole(newNode.role);
  };

  const handleDeleteNode = (roleToRemove: string) => {
    let newNodes = nodes.filter(n => n.role !== roleToRemove);
    // Remove references from parents
    newNodes = newNodes.map(n => ({
      ...n,
      children: n.children.filter(c => c !== roleToRemove)
    }));
    setNodes(newNodes);
    if (selectedRole === roleToRemove) setSelectedRole(null);
  };

  const updateSelectedNode = (updates: Partial<RoleNode>) => {
    setNodes(nodes.map(n => n.role === selectedRole ? { ...n, ...updates } : n));
  };

  const updateRoleID = (newRole: string) => {
    if (!selectedRole || newRole === selectedRole) return;
    if (nodes.some(n => n.role === newRole)) {
      toast.error("Role identifier must be unique!");
      return;
    }
    
    // Update the node's role and all parent references
    const oldRole = selectedRole;
    setNodes(nodes.map(n => {
      if (n.role === oldRole) return { ...n, role: newRole };
      if (n.children.includes(oldRole)) {
        return { ...n, children: n.children.map(c => c === oldRole ? newRole : c) };
      }
      return n;
    }));
    setSelectedRole(newRole);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/hierarchy-tree/", JSON.stringify(nodes));
      toast.success("Cabinet structure updated successfully!");
      onTreeUpdated();
    } catch (e) {
      toast.error("Failed to save tree structure.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefault = () => {
    if (confirm("Are you sure you want to restore the default Mengo Connect Hub hierarchy? This will overwrite your current layout.")) {
      setNodes(JSON.parse(JSON.stringify(DEFAULT_TREE)));
      setSelectedRole(null);
    }
  };

  const selectedNode = nodes.find(n => n.role === selectedRole);

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading editor...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <Card className="col-span-1 border overflow-hidden flex flex-col">
        <div className="bg-muted p-3 border-b flex justify-between items-center">
          <h3 className="font-bold text-sm tracking-widest uppercase flex items-center gap-2">
            <Layers className="h-4 w-4" /> All Nodes
          </h3>
          <Button size="sm" variant="outline" onClick={handleAddNode} className="h-8 shadow-sm">
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Role
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-2">
            {nodes.map(node => {
              const TheIcon = ICON_MAP[node.iconName] || ICON_MAP.User;
              return (
                <div 
                  key={node.role}
                  onClick={() => setSelectedRole(node.role)}
                  className={`flex items-center justify-between p-2 rounded-md cursor-pointer border transition-colors ${selectedRole === node.role ? 'bg-primary/10 border-primary' : 'bg-background hover:bg-muted'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-sm ${node.color} opacity-90`}>
                      <TheIcon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{node.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{node.role}</p>
                    </div>
                  </div>
                  {nodes.some(n => n.children.includes(node.role)) && (
                    <Badge variant="outline" className="text-[9px] h-4">Sub</Badge>
                  )}
                </div>
              );
            })}
            {nodes.length === 0 && (
               <p className="text-sm text-center p-4 text-muted-foreground">No roles configured.</p>
            )}
          </div>
        </ScrollArea>
      </Card>

      <Card className="col-span-1 lg:col-span-2 border flex flex-col">
         {selectedNode ? (
            <>
               <div className="p-4 border-b bg-muted/30 flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                     <Edit className="h-4 w-4" /> Edit Role: {selectedNode.label}
                  </h3>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedRole(null)}>
                     <X className="h-4 w-4" />
                  </Button>
               </div>
               <ScrollArea className="flex-1 p-6">
                  <div className="space-y-6 max-w-xl">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Label (Display Name)</Label>
                           <Input 
                              value={selectedNode.label} 
                              onChange={(e) => updateSelectedNode({ label: e.target.value })} 
                           />
                        </div>
                        <div className="space-y-2">
                           <Label>Unique ID (role)</Label>
                           {/* Handling ID change requires more care, using a controlled update */}
                           <Input 
                              value={selectedNode.role} 
                              onChange={(e) => {
                                 // Very naive update loop handler, normally requires a separate form state or strict blur.
                                 // For this, we'll just block spaces and weird chars.
                                 const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                                 // updateRoleID(val); // In full form, we'd only apply on blur, doing it simple here:
                                 setNodes(nodes.map(n => n.role === selectedRole ? { ...n, role: val } : n));
                                 setSelectedRole(val); // dangerous React loop hack! Actually, this will break parent links if changed while typing. 
                                 // Better approach: Disable editing role ID for simplicity, or have complex sync. 
                                 // Let's just update the label and use the auto-generated ID for new nodes, OR only allow edit on blur.
                              }}
                              disabled={true} 
                           />
                           <p className="text-[10px] text-muted-foreground">Role IDs are immutable once created to preserve system links.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label>Icon</Label>
                           <Select 
                              value={selectedNode.iconName} 
                              onValueChange={(val) => updateSelectedNode({ iconName: val })}
                           >
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {Object.keys(ICON_MAP).map(key => (
                                    <SelectItem key={key} value={key}>{key}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                        <div className="space-y-2">
                           <Label>Color Map</Label>
                           <Select 
                              value={selectedNode.color} 
                              onValueChange={(val) => updateSelectedNode({ color: val })}
                           >
                              <SelectTrigger>
                                 <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                 {COLOR_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

                     <div className="space-y-3 pt-4 border-t">
                        <Label>Direct Subordinates (Children Nodes)</Label>
                        <p className="text-[11px] text-muted-foreground leading-tight">
                           Select rolls that fall directly under this office in the hierarchy.
                        </p>
                        
                        <div className="bg-muted/30 border rounded-md p-3 space-y-2">
                           {selectedNode.children.map(childRole => {
                              const childNode = nodes.find(n => n.role === childRole);
                              return (
                                 <div key={childRole} className="flex items-center justify-between text-sm bg-background p-2 rounded border">
                                    <span className="flex items-center gap-2">
                                       <ArrowDown className="text-muted-foreground w-3 h-3" />
                                       {childNode?.label || childRole}
                                    </span>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive"
                                       onClick={() => updateSelectedNode({ children: selectedNode.children.filter(c => c !== childRole)})}
                                    >
                                       <X className="w-3 h-3"/>
                                    </Button>
                                 </div>
                              );
                           })}

                           <Select onValueChange={(val) => {
                              if (!selectedNode.children.includes(val) && val !== selectedNode.role) {
                                 // Check for cyclic dependency 1 level deep (prevent simple A -> B, B -> A)
                                 const targetNode = nodes.find(n => n.role === val);
                                 if (targetNode?.children.includes(selectedNode.role)) {
                                    toast.error("Cyclic hierarchy detected! Cannot add parent as child.");
                                    return;
                                 }
                                 updateSelectedNode({ children: [...selectedNode.children, val] });
                              }
                           }}>
                              <SelectTrigger className="w-full mt-2">
                                 <SelectValue placeholder="Add subordinate role..." />
                              </SelectTrigger>
                              <SelectContent>
                                 {nodes
                                    .filter(n => n.role !== selectedNode.role && !selectedNode.children.includes(n.role))
                                    .map(n => (
                                    <SelectItem key={n.role} value={n.role}>{n.label}</SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     </div>

                     <div className="pt-8 flex justify-end">
                        <Button variant="destructive" onClick={() => handleDeleteNode(selectedNode.role)} className="w-full sm:w-auto">
                           <Trash2 className="w-4 h-4 mr-2" /> Delete Node
                        </Button>
                     </div>
                  </div>
               </ScrollArea>
            </>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
               <Layers className="w-16 h-16 opacity-20" />
               <p>Select a node from the list to edit its properties and connections, or add a new role.</p>
            </div>
         )}
         
         <div className="p-4 border-t bg-muted/20 flex justify-between items-center">
            <Button variant="outline" className="text-xs" onClick={handleRestoreDefault}>
               Restore Defaults
            </Button>
            <Button onClick={handleSave} disabled={saving}>
               <Save className="w-4 h-4 mr-2" />
               {saving ? "Saving..." : "Publish Structure"}
            </Button>
         </div>
      </Card>
    </div>
  );
}
