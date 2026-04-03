import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save, Send, FileText } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { useAuth } from "@/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Challenge { description: string; when: string; impact: string; }
interface Solution { problem: string; description: string; benefit: string; }

export default function MonthlyReportForm({ onSuccess }: { onSuccess: () => void }) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showOfficeSelect, setShowOfficeSelect] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState("");
  
  // Section 1: Basic Details
  const [formData, setFormData] = useState({
    monthDate: new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" }),
    classStream: "",
    classTeacher: "",
    generalPerformance: "",
    generalChallenges: "",
    adminSupport: "",
    positiveHighlights: "",
    maleCouncillor: "",
    femaleCouncillor: "",
    monitor: "",
    monitress: "",
    student1: "",
    student2: "",
    councilName: "VINE STUDENTS' COUNCIL BODY"
  });

  // Autofill from profile
  useEffect(() => {
    if (profile?.student_class) {
      setFormData(prev => ({ ...prev, classStream: profile.student_class }));
    }
  }, [profile]);

  const OFFICES = [
    { id: "chairperson", label: "Chairperson" },
    { id: "vice_chairperson", label: "Vice Chairperson" },
    { id: "speaker", label: "Speaker" },
    { id: "general_secretary", label: "General Secretary" },
    { id: "patron", label: "Patron / Staff Office" },
    { id: "electoral_commission", label: "Electoral Commission" }
  ];

  // Section 2: Dynamic Tables
  const [challenges, setChallenges] = useState<Challenge[]>([{ description: "", when: "", impact: "" }]);
  const [solutions, setSolutions] = useState<Solution[]>([{ problem: "", description: "", benefit: "" }]);

  const addChallenge = () => setChallenges([...challenges, { description: "", when: "", impact: "" }]);
  const removeChallenge = (idx: number) => setChallenges(challenges.filter((_, i) => i !== idx));
  
  const addSolution = () => setSolutions([...solutions, { problem: "", description: "", benefit: "" }]);
  const removeSolution = (idx: number) => setSolutions(solutions.filter((_, i) => i !== idx));

  const generatePDF = async () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 15;

    const addImageToDoc = (src: string, x: number, y: number, w: number, h: number, format: string) => {
      return new Promise<void>((resolve) => {
        const img = new Image();
        img.src = src;
        img.crossOrigin = "Anonymous";
        img.onload = () => { doc.addImage(img, format, x, y, w, h); resolve(); };
        img.onerror = () => resolve();
      });
    };

    try {
      await Promise.all([
        addImageToDoc(mengoBadge, 15, 10, 20, 20, "JPEG"),
        addImageToDoc(unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
      ]);
    } catch(e) { console.error("Logo load failed", e); }

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    doc.text(formData.councilName.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(10);
    doc.text("MONTHLY REPORT", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(9);
    doc.text(`Month and Date: ${formData.monthDate}`, 15, y); y += 6;
    doc.text(`Class and Stream: ${formData.classStream}`, 15, y); y += 6;
    doc.text(`Class Teacher: ${formData.classTeacher}`, 15, y); y += 10;

    const addSection = (title: string, content: string) => {
      doc.setFont("helvetica", "bold"); doc.text(title, 15, y); y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(content || "N/A", pageW - 30);
      doc.text(lines, 15, y);
      y += (lines.length * 5) + 5;
    };

    addSection("General Class Performance:", formData.generalPerformance);
    addSection("General School Challenges:", formData.generalChallenges);

    // Table 1: Class Challenges
    doc.setFont("helvetica", "bold"); doc.text("Class challenges encountered this month", 15, y); y += 5;
    const drawTable = (headers: string[], rows: any[]) => {
      const colW = (pageW - 30) / headers.length;
      doc.setFillColor(240, 240, 240); doc.rect(15, y, pageW - 30, 7, "F");
      headers.forEach((h, i) => doc.text(h, 15 + (i * colW) + 2, y + 5));
      y += 7;
      doc.setFont("helvetica", "normal");
      rows.forEach(row => {
        const rowData = Object.values(row);
        let maxLines = 1;
        const processed = rowData.map(txt => {
           const l = doc.splitTextToSize(txt as string || "", colW - 4);
           if (l.length > maxLines) maxLines = l.length;
           return l;
        });
        const rowH = (maxLines * 4) + 2;
        if (y + rowH > 280) { doc.addPage(); y = 20; }
        processed.forEach((lines, i) => doc.text(lines, 15 + (i * colW) + 2, y + 4));
        doc.rect(15, y, pageW - 30, rowH);
        y += rowH;
      });
      y += 5;
    };

    drawTable(["Problem Description", "When it occurred", "Impact on Class"], challenges);
    drawTable(["Problem to address", "Solution description", "Benefit"], solutions);

    addSection("Requests for administrative support:", formData.adminSupport);
    addSection("Positive highlights this month:", formData.positiveHighlights);

    // Signatories
    if (y > 240) { doc.addPage(); y = 20; }
    const sigY = y;
    const col2 = pageW / 2 + 5;
    const drawSig = (lbl: string, val: string, x: number, lineY: number) => {
      doc.setFont("helvetica", "bold"); doc.text(lbl, x, lineY);
      doc.setFont("helvetica", "normal"); doc.text(val || "___________________", x, lineY + 6);
    };

    drawSig("MALE COUNCILLOR:", formData.maleCouncillor, 15, sigY);
    drawSig("FEMALE COUNCILLOR:", formData.femaleCouncillor, col2, sigY);
    drawSig("MONITOR:", formData.monitor, 15, sigY + 15);
    drawSig("MONITRESS:", formData.monitress, col2, sigY + 15);
    drawSig("STUDENT:", formData.student1, 15, sigY + 30);
    drawSig("STUDENT:", formData.student2, col2, sigY + 30);

    // Footer
    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("ANOINTED TO BEAR FRUIT", pageW / 2, 285, { align: "center" });

    return doc.output("blob");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const pdfBlob = await generatePDF();
      const fileName = `Monthly_Report_${formData.classStream.replace(/\s+/g, "_")}_${formData.monthDate.split(" ").join("_")}.pdf`;
      
      const fd = new FormData();
      fd.append("title", fileName.replace(".pdf", ""));
      fd.append("category", "Reports");
      fd.append("access_level", "shared");
      fd.append("target_office", selectedOffice);
      fd.append("file", pdfBlob, fileName);

      await api.post("/documents/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Monthly Report submitted successfully!");
      onSuccess();
    } catch (err) {
      toast.error("Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center">Section 1: Class Identification</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Month and Date *</Label>
              <Input placeholder="e.g. March 2026" value={formData.monthDate} onChange={e => setFormData({...formData, monthDate: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Council / Organization Name *</Label>
              <Input placeholder="e.g. VINE STUDENTS' COUNCIL" value={formData.councilName} onChange={e => setFormData({...formData, councilName: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label>Class and Stream *</Label>
              <Input placeholder="e.g. S.2 NORTH" value={formData.classStream} onChange={e => setFormData({...formData, classStream: e.target.value})} required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Class Teacher</Label>
              <Input placeholder="Full Name" value={formData.classTeacher} onChange={e => setFormData({...formData, classTeacher: e.target.value})} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Section 2: Class Performance & Challenges</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-2">
            <Label>General Class Performance (Notes on strengths/progress)</Label>
            <Textarea value={formData.generalPerformance} onChange={e => setFormData({...formData, generalPerformance: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>General School Challenges</Label>
            <Textarea value={formData.generalChallenges} onChange={e => setFormData({...formData, generalChallenges: e.target.value})} />
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label className="font-bold">Specific Class Challenges Encountered</Label>
              <Button type="button" size="sm" variant="outline" onClick={addChallenge}><Plus className="h-3 w-3 mr-1"/> Add Row</Button>
            </div>
            {challenges.map((c, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 border p-3 rounded-lg relative group">
                <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-background border" onClick={() => removeChallenge(i)}><Trash2 className="h-3 w-3"/></Button>
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Problem Description</Label>
                  <Input value={c.description} onChange={e => {
                    const n = [...challenges]; n[i].description = e.target.value; setChallenges(n);
                  }} />
                </div>
                <div className="space-y-1">
                   <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">When it occurred</Label>
                   <Input value={c.when} onChange={e => {
                    const n = [...challenges]; n[i].when = e.target.value; setChallenges(n);
                  }} />
                </div>
                <div className="space-y-1">
                   <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Impact on class</Label>
                   <Input value={c.impact} onChange={e => {
                    const n = [...challenges]; n[i].impact = e.target.value; setChallenges(n);
                  }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center">Section 3: Solutions & Administrative Requests</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-3">
             <div className="flex items-center justify-between">
                <Label className="font-bold">Proposed Solutions to Challenges</Label>
                <Button type="button" size="sm" variant="outline" onClick={addSolution}><Plus className="h-3 w-3 mr-1"/> Add Row</Button>
             </div>
             {solutions.map((s, i) => (
               <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 border p-3 rounded-lg relative group">
                 <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-background border" onClick={() => removeSolution(i)}><Trash2 className="h-3 w-3"/></Button>
                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Problem</Label>
                    <Input value={s.problem} onChange={e => {
                      const n = [...solutions]; n[i].problem = e.target.value; setSolutions(n);
                    }} />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Solution Description</Label>
                    <Input value={s.description} onChange={e => {
                      const n = [...solutions]; n[i].description = e.target.value; setSolutions(n);
                    }} />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-tighter">Benefit</Label>
                    <Input value={s.benefit} onChange={e => {
                      const n = [...solutions]; n[i].benefit = e.target.value; setSolutions(n);
                    }} />
                 </div>
               </div>
             ))}
          </div>

          <div className="space-y-2">
            <Label>Requests for Administrative Support</Label>
            <Textarea value={formData.adminSupport} onChange={e => setFormData({...formData, adminSupport: e.target.value})} />
          </div>
          <div className="space-y-2">
            <Label>Positive Highlights this Month</Label>
            <Textarea value={formData.positiveHighlights} onChange={e => setFormData({...formData, positiveHighlights: e.target.value})} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center">Section 4: Signatories</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Male Councillor</Label><Input value={formData.maleCouncillor} onChange={e => setFormData({...formData, maleCouncillor: e.target.value})} /></div>
          <div className="space-y-2"><Label>Female Councillor</Label><Input value={formData.femaleCouncillor} onChange={e => setFormData({...formData, femaleCouncillor: e.target.value})} /></div>
          <div className="space-y-2"><Label>Monitor</Label><Input value={formData.monitor} onChange={e => setFormData({...formData, monitor: e.target.value})} /></div>
          <div className="space-y-2"><Label>Monitress</Label><Input value={formData.monitress} onChange={e => setFormData({...formData, monitress: e.target.value})} /></div>
          <div className="space-y-2"><Label>Student 1</Label><Input value={formData.student1} onChange={e => setFormData({...formData, student1: e.target.value})} /></div>
          <div className="space-y-2"><Label>Student 2</Label><Input value={formData.student2} onChange={e => setFormData({...formData, student2: e.target.value})} /></div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end pt-4 pb-8">
        <Button variant="ghost" type="button" onClick={onSuccess}>Cancel</Button>
        <Dialog open={showOfficeSelect} onOpenChange={setShowOfficeSelect}>
          <DialogTrigger asChild>
            <Button type="button" size="lg" disabled={loading}>
               <Send className="mr-2 h-4 w-4"/> Submit Report to Office
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Choose Target Office</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Select target official/office:</Label>
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger><SelectValue placeholder="Choose an office" /></SelectTrigger>
                  <SelectContent>
                    {OFFICES.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleSubmit} 
                disabled={loading || !selectedOffice} 
                className="w-full h-12"
              >
                {loading ? "Generating & Sending..." : `Confirm Submission`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </form>
  );
}

function Loader2({className}: {className?: string}) {
  return <FileText className={className} />;
}
