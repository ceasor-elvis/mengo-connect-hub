import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Save, X, Edit, ArrowDown, RotateCcw, Layers } from "lucide-react";
import { RoleNode, ICON_MAP, useHierarchy, DEFAULT_TREE } from "@/hooks/useHierarchy";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const COLOR_OPTIONS = [
  { label: "Primary",    value: "bg-primary text-primary-foreground",       swatch: "bg-primary" },
  { label: "Accent",     value: "bg-accent text-accent-foreground",          swatch: "bg-accent" },
  { label: "Muted",      value: "bg-muted text-muted-foreground",            swatch: "bg-muted" },
  { label: "Destructive",value: "bg-destructive text-destructive-foreground",swatch: "bg-destructive" },
];

export default function StructureEditor({ onTreeUpdated }: { onTreeUpdated: () => void }) {
  const { tree: initialTree, loading } = useHierarchy();
  const [nodes, setNodes] = useState<RoleNode[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      setNodes(JSON.parse(JSON.stringify(initialTree)));
    }
  }, [initialTree, loading]);

  const handleAddNode = () => {
    const newNode: RoleNode = {
      role: `new_role_${Date.now()}`,
      label: "New Role",
      iconName: "User",
      color: "bg-muted text-muted-foreground",
      children: [],
    };
    setNodes([...nodes, newNode]);
    setSelectedRole(newNode.role);
  };

  const handleDeleteNode = (roleToRemove: string) => {
    let newNodes = nodes.filter((n) => n.role !== roleToRemove);
    newNodes = newNodes.map((n) => ({
      ...n,
      children: n.children.filter((c) => c !== roleToRemove),
    }));
    setNodes(newNodes);
    if (selectedRole === roleToRemove) setSelectedRole(null);
  };

  const updateSelectedNode = (updates: Partial<RoleNode>) => {
    setNodes(nodes.map((n) => (n.role === selectedRole ? { ...n, ...updates } : n)));
  };

  const updateRoleID = (newRole: string) => {
    if (!selectedRole || newRole === selectedRole) return;
    if (nodes.some((n) => n.role === newRole)) {
      toast.error("Role identifier must be unique!");
      return;
    }
    const oldRole = selectedRole;
    setNodes(
      nodes.map((n) => {
        if (n.role === oldRole) return { ...n, role: newRole };
        if (n.children.includes(oldRole)) {
          return { ...n, children: n.children.map((c) => (c === oldRole ? newRole : c)) };
        }
        return n;
      })
    );
    setSelectedRole(newRole);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/users/hierarchy-tree/", nodes);
      toast.success("Cabinet structure published!");
      onTreeUpdated();
    } catch {
      toast.error("Failed to save tree structure.");
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefault = () => {
    setNodes(JSON.parse(JSON.stringify(DEFAULT_TREE)));
    setSelectedRole(null);
    toast.info("Default structure restored. Click Publish to save.");
  };

  const selectedNode = nodes.find((n) => n.role === selectedRole);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading editor…
      </div>
    );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 h-full min-h-[560px]">
      {/* ── Node List Panel ── */}
      <div className="lg:col-span-2 flex flex-col border border-border/50 rounded-2xl bg-card/60 backdrop-blur-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between bg-muted/30">
          <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
            <Layers className="h-3.5 w-3.5" /> All Roles
          </span>
          <Button size="sm" variant="outline" onClick={handleAddNode} className="h-7 text-xs font-bold rounded-lg">
            <Plus className="h-3 w-3 mr-1" /> Add
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-3 space-y-1.5">
            <AnimatePresence>
              {nodes.map((node) => {
                const TheIcon = ICON_MAP[node.iconName] || ICON_MAP.User;
                const isParent = nodes.some((n) => n.children.includes(node.role));
                const isChild = nodes.some((n) => n.children.includes(node.role));
                return (
                  <motion.div
                    key={node.role}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    onClick={() => setSelectedRole(node.role)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer border transition-all duration-200 ${
                      selectedRole === node.role
                        ? "bg-primary/10 border-primary/40 shadow-sm"
                        : "bg-background/60 hover:bg-muted/60 border-transparent hover:border-border/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`p-1.5 rounded-lg ${node.color} shrink-0`}>
                        <TheIcon className="w-3 h-3" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{node.label}</p>
                        <p className="text-[9px] text-muted-foreground font-mono truncate">{node.role}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0 ml-1">
                      {isChild && (
                        <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-bold">Sub</Badge>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {nodes.length === 0 && (
              <p className="text-xs text-center p-6 text-muted-foreground italic">No roles configured.</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ── Edit Panel ── */}
      <div className="lg:col-span-3 flex flex-col border border-border/50 rounded-2xl bg-card/60 backdrop-blur-sm overflow-hidden">
        {selectedNode ? (
          <>
            <div className="px-5 py-3.5 border-b border-border/40 flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4 text-primary" />
                <span className="font-bold text-sm">
                  Editing: <span className="text-primary">{selectedNode.label}</span>
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setSelectedRole(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-5 space-y-5">
                {/* Display Name + Role ID */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Display Name</Label>
                    <Input
                      value={selectedNode.label}
                      onChange={(e) => updateSelectedNode({ label: e.target.value })}
                      className="h-10 rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Role ID</Label>
                    <Input
                      key={selectedNode.role}
                      defaultValue={selectedNode.role}
                      className="h-10 rounded-xl text-sm font-mono"
                      onBlur={(e) => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, "");
                        e.target.value = val;
                        updateRoleID(val);
                      }}
                    />
                    <p className="text-[9px] text-muted-foreground">Letters, numbers and underscores only.</p>
                  </div>
                </div>

                {/* Icon + Color */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Icon</Label>
                    <Select value={selectedNode.iconName} onValueChange={(val) => updateSelectedNode({ iconName: val })}>
                      <SelectTrigger className="h-10 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(ICON_MAP).map((key) => {
                          const IconComp = ICON_MAP[key];
                          return (
                            <SelectItem key={key} value={key}>
                              <span className="flex items-center gap-2">
                                <IconComp className="h-3.5 w-3.5" /> {key}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Color</Label>
                    <Select value={selectedNode.color} onValueChange={(val) => updateSelectedNode({ color: val })}>
                      <SelectTrigger className="h-10 rounded-xl text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLOR_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <span className="flex items-center gap-2">
                              <span className={`h-3 w-3 rounded-full ${opt.swatch}`} />
                              {opt.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Live Preview */}
                <div className="p-4 rounded-2xl border border-border/40 bg-muted/20 flex items-center justify-center">
                  {(() => {
                    const PreviewIcon = ICON_MAP[selectedNode.iconName] || ICON_MAP.User;
                    return (
                      <div className={`flex flex-col items-center gap-2 rounded-xl p-4 ${selectedNode.color} shadow-md w-28`}>
                        <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                          <PreviewIcon className="h-6 w-6" />
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-80 text-center">{selectedNode.label}</p>
                        <p className="text-[8px] opacity-50 italic">Vacant</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Children / Subordinates */}
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Subordinates (Direct Children)
                  </Label>
                  <div className="bg-muted/20 border border-border/40 rounded-xl p-3 space-y-2">
                    {selectedNode.children.length === 0 && (
                      <p className="text-[10px] text-center text-muted-foreground italic py-2">No subordinates yet.</p>
                    )}
                    {selectedNode.children.map((childRole) => {
                      const childNode = nodes.find((n) => n.role === childRole);
                      const ChildIcon = childNode ? ICON_MAP[childNode.iconName] || ICON_MAP.User : ICON_MAP.User;
                      return (
                        <div key={childRole} className="flex items-center justify-between text-sm bg-background/60 px-3 py-2 rounded-lg border border-border/30">
                          <span className="flex items-center gap-2 text-xs font-semibold">
                            <ArrowDown className="text-muted-foreground w-3 h-3" />
                            {childNode ? (
                              <span className="flex items-center gap-1.5">
                                <ChildIcon className="h-3 w-3 text-muted-foreground" />
                                {childNode.label}
                              </span>
                            ) : childRole}
                          </span>
                          <Button
                            variant="ghost" size="sm"
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 rounded-md"
                            onClick={() => updateSelectedNode({ children: selectedNode.children.filter((c) => c !== childRole) })}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      );
                    })}
                    <Select
                      onValueChange={(val) => {
                        if (!selectedNode.children.includes(val) && val !== selectedNode.role) {
                          const targetNode = nodes.find((n) => n.role === val);
                          if (targetNode?.children.includes(selectedNode.role)) {
                            toast.error("Cyclic hierarchy detected!");
                            return;
                          }
                          updateSelectedNode({ children: [...selectedNode.children, val] });
                        }
                      }}
                    >
                      <SelectTrigger className="w-full mt-1 h-9 rounded-xl text-xs">
                        <SelectValue placeholder="+ Add subordinate role…" />
                      </SelectTrigger>
                      <SelectContent>
                        {nodes
                          .filter((n) => n.role !== selectedNode.role && !selectedNode.children.includes(n.role))
                          .map((n) => (
                            <SelectItem key={n.role} value={n.role}>{n.label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Delete */}
                <div className="pt-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full rounded-xl h-10 text-xs font-bold uppercase tracking-wide">
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete This Role
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-serif text-xl">Delete Role?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete <strong>{selectedNode.label}</strong>? It will be removed from the hierarchy and any parent connections.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteNode(selectedNode.role)}
                          className="rounded-xl h-11 font-bold bg-rose-600 hover:bg-rose-700 text-white"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-3">
            <Layers className="w-14 h-14 opacity-10" />
            <p className="text-sm font-medium">Select a role from the list to edit it, or add a new one.</p>
          </div>
        )}

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-border/40 bg-muted/10 flex justify-between items-center gap-3 shrink-0">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="h-9 text-xs font-bold rounded-xl uppercase tracking-wide">
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Restore Defaults
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-3xl border-border/40 backdrop-blur-xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-serif text-xl">Restore Default Structure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will overwrite your current layout with the default Mengo Senior School hierarchy. Your custom roles will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl h-11 font-bold">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRestoreDefault}
                  className="rounded-xl h-11 font-bold bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Yes, Restore
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button onClick={handleSave} disabled={saving} className="h-9 px-6 rounded-xl text-xs font-black uppercase tracking-wide">
            <Save className="w-3.5 h-3.5 mr-1.5" />
            {saving ? "Publishing…" : "Publish Structure"}
          </Button>
        </div>
      </div>
    </div>
  );
}
