import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Scale, Plus, AlertCircle, FileText, CheckCircle2, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface DCCase {
  id: string;
  offender_name: string;
  category: string;
  description: string;
  status: 'Pending' | 'Under Investigation' | 'Summoned' | 'Closed';
  reported_by: string;
  created_at: string;
}

export default function DisciplinaryPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<DCCase[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [offender, setOffender] = useState("");
  const [category, setCategory] = useState("Insubordination");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCases = async () => {
    try {
      const { data } = await api.get("/dc-cases/");
      setCases(data.results || []);
    } catch (error) {
      toast.error("Failed to load cases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offender.trim() || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSubmitting(true);
    try {
      const finalCategory = category === "Other" ? customCategory : category;
      await api.post("/dc-cases/", {
        offender_name: offender,
        category: finalCategory,
        description,
        reported_by: user?.id,
      });
      toast.success("Case reported successfully");
      setOffender("");
      setDescription("");
      setCustomCategory("");
      fetchCases();
    } catch (error) {
      toast.error("Failed to report case");
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/dc-cases/${id}/`, { status });
      toast.success(`Status updated to ${status}`);
      fetchCases();
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Under Investigation': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'Summoned': return <Scale className="h-4 w-4 text-purple-500" />;
      case 'Closed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold flex items-center gap-2">
            <Scale className="h-6 w-6 text-primary" />
            Disciplinary Committee (DC)
          </h1>
          <p className="text-muted-foreground text-sm">Case management and disciplinary records.</p>
        </div>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="active">Active Cases</TabsTrigger>
          <TabsTrigger value="report">Report New Case</TabsTrigger>
          <TabsTrigger value="docs">DC Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <div className="grid gap-4">
            {loading ? (
              <p className="text-center py-8 animate-pulse">Loading cases...</p>
            ) : cases.length === 0 ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">No active cases found.</CardContent></Card>
            ) : (
              cases.map((c) => (
                <Card key={c.id} className="overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="p-4 flex flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-lg font-semibold">{c.offender_name}</CardTitle>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getStatusIcon(c.status)} {c.status}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{c.category}</Badge>
                      <span className="text-[10px] text-muted-foreground">Reported: {new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-balance leading-relaxed italic border-l-2 pl-3 border-muted">
                      "{c.description}"
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateStatus(c.id, 'Under Investigation')}>Investigate</Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => updateStatus(c.id, 'Summoned')}>Summon</Button>
                      <Button variant="ghost" size="sm" className="text-xs hover:text-green-600" onClick={() => updateStatus(c.id, 'Closed')}>Close Case</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader><CardTitle>Case Information Report</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleReport} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="offender">Offender / Student Name *</Label>
                  <Input id="offender" value={offender} onChange={(e) => setOffender(e.target.value)} placeholder="Full name of the student" required />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Category *</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Insubordination">Insubordination</SelectItem>
                        <SelectItem value="Dress Code">Dress Code</SelectItem>
                        <SelectItem value="Theft">Theft</SelectItem>
                        <SelectItem value="Bullying">Bullying</SelectItem>
                        <SelectItem value="Other">Other (Type below)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {category === "Other" && (
                    <div className="grid gap-2">
                      <Label htmlFor="custom">Custom Category *</Label>
                      <Input id="custom" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} placeholder="Enter category" />
                    </div>
                  )}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="desc">Detailed Description *</Label>
                  <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide full context of the incident..." rows={4} required />
                </div>

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Submitting..." : "Submit Report to DC"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="docs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Case Documentation</CardTitle>
              <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1" /> Add Document</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Disciplinary_Procedures_2026.pdf</p>
                      <p className="text-[10px] text-muted-foreground">Official Guidelines</p>
                    </div>
                  </div>
                  <Badge variant="outline">View</Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">Summon_Template_Official.docx</p>
                      <p className="text-[10px] text-muted-foreground">Template</p>
                    </div>
                  </div>
                  <Badge variant="outline">Download</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
