import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Send, FileText, Users, Clock } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Attendee { name: string; position: string; }
interface Resolution { point: string; byWho: string; deadline: string; }

export default function MinutesFormTemplate({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showOfficeSelect, setShowOfficeSelect] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState("");

  const [formData, setFormData] = useState({
    meetingType: "Cabinet Meeting",
    date: new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" }),
    venue: "School Board Room",
    startTime: "09:00 AM",
    endTime: "11:30 AM",
    chairperson: "",
    secretary: "",
    agenda: "",
    deliberations: ""
  });

  const [attendees, setAttendees] = useState<Attendee[]>([{ name: "", position: "" }]);
  const [resolutions, setResolutions] = useState<Resolution[]>([{ point: "", byWho: "", deadline: "" }]);

  const addAttendee = () => setAttendees([...attendees, { name: "", position: "" }]);
  const removeAttendee = (idx: number) => setAttendees(attendees.filter((_, i) => i !== idx));

  const addResolution = () => setResolutions([...resolutions, { point: "", byWho: "", deadline: "" }]);
  const removeResolution = (idx: number) => setResolutions(resolutions.filter((_, i) => i !== idx));

  const OFFICES = [
    { id: "general_secretary", label: "General Secretary" },
    { id: "chairperson", label: "Chairperson" },
    { id: "patron", label: "Patron / Staff Office" },
    { id: "speaker", label: "Speaker" }
  ];

  const generatePDF = async () => {
    const doc = new jsPDF();
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

    await Promise.all([
      addImageToDoc(mengoBadge, 15, 10, 20, 20, "JPEG"),
      addImageToDoc(unsaLogoB64, pageW - 35, 10, 20, 20, "PNG")
    ]);

    doc.setFont("helvetica", "bold"); doc.setFontSize(14);
    doc.text("MENGO SENIOR SCHOOL", pageW / 2, y, { align: "center" });
    y += 6; doc.setFontSize(11);
    doc.text("VINE STUDENTS' COUNCIL BODY", pageW / 2, y, { align: "center" });
    y += 10; doc.setFontSize(12);
    doc.text(`${formData.meetingType.toUpperCase()} MINUTES`, pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("MEETING DETAILS:", 15, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${formData.date}`, 15, y); doc.text(`Venue: ${formData.venue}`, pageW / 2, y); y += 6;
    doc.text(`Time: ${formData.startTime} - ${formData.endTime}`, 15, y); y += 10;

    const addSection = (title: string, content: string) => {
        doc.setFont("helvetica", "bold"); doc.text(title, 15, y); y += 5;
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(content || "N/A", pageW - 30);
        doc.text(lines, 15, y);
        y += (lines.length * 5) + 5;
        if (y > 270) { doc.addPage(); y = 20; }
    };

    addSection("AGENDA:", formData.agenda);
    
    // Attendance Table
    doc.setFont("helvetica", "bold"); doc.text("MEMBERS PRESENT:", 15, y); y += 5;
    const colW = (pageW - 30) / 2;
    doc.setFillColor(240, 240, 240); doc.rect(15, y, pageW - 30, 7, "F");
    doc.text("Name", 17, y + 5); doc.text("Position", 15 + colW + 2, y + 5);
    y += 7; doc.setFont("helvetica", "normal");
    attendees.forEach(a => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(a.name || "N/A", 17, y + 4);
        doc.text(a.position || "N/A", 15 + colW + 2, y + 4);
        doc.rect(15, y, pageW - 30, 6);
        y += 6;
    });
    y += 5;

    addSection("DELIBERATIONS:", formData.deliberations);

    // Resolutions Table
    doc.setFont("helvetica", "bold"); doc.text("RESOLUTIONS & ACTION POINTS:", 15, y); y += 5;
    const resColW = [(pageW - 30) * 0.5, (pageW - 30) * 0.25, (pageW - 30) * 0.25];
    doc.setFillColor(240, 240, 240); doc.rect(15, y, pageW - 30, 7, "F");
    doc.text("Resolution", 17, y + 5); doc.text("By Who", 15 + resColW[0] + 2, y + 5); doc.text("Deadline", 15 + resColW[0] + resColW[1] + 2, y + 5);
    y += 7; doc.setFont("helvetica", "normal");
    resolutions.forEach(res => {
        const resLines = doc.splitTextToSize(res.point || "", resColW[0] - 4);
        const rowH = (resLines.length * 4) + 2;
        if (y + rowH > 270) { doc.addPage(); y = 20; }
        doc.text(resLines, 17, y + 4);
        doc.text(res.byWho || "N/A", 15 + resColW[0] + 2, y + 4);
        doc.text(res.deadline || "N/A", 15 + resColW[0] + resColW[1] + 2, y + 4);
        doc.rect(15, y, pageW - 30, rowH);
        y += rowH;
    });
    y += 10;

    // Signatories
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFont("helvetica", "bold");
    doc.text("CHAIRPERSON:", 15, y); doc.text("SECRETARY:", pageW / 2 + 5, y); y += 6;
    doc.setFont("helvetica", "normal");
    doc.text(formData.chairperson || "________________", 15, y);
    doc.text(formData.secretary || "________________", pageW / 2 + 5, y);
    y += 10;
    doc.text("SIGN: ________________", 15, y);
    doc.text("SIGN: ________________", pageW / 2 + 5, y);

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("ANOINTED TO BEAR FRUIT", pageW / 2, 285, { align: "center" });

    doc.setTextColor(180, 180, 180); doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.text("Designed & Initiated by Katumba Andrew Felix", pageW / 2, 292, { align: "center" });

    return doc.output("blob");
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const pdfBlob = await generatePDF();
      const fileName = `Minutes_${formData.meetingType.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const fd = new FormData();
      fd.append("title", `Minutes: ${formData.meetingType}`);
      fd.append("category", "Minutes");
      fd.append("access_level", "shared");
      fd.append("target_office", selectedOffice);
      fd.append("file", pdfBlob, fileName);
      await api.post("/documents/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Meeting Minutes submitted!");
      onSuccess();
    } catch (e) {
      toast.error("Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto px-1">
      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center text-primary">Meeting Minutes Recording</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Meeting Type</Label>
                <Select value={formData.meetingType} onValueChange={v => setFormData({...formData, meetingType: v})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cabinet Meeting">Cabinet Meeting</SelectItem>
                        <SelectItem value="General Meeting">General Meeting</SelectItem>
                        <SelectItem value="Emergency Meeting">Emergency Meeting</SelectItem>
                        <SelectItem value="Planning Meeting">Planning Meeting</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Venue</Label><Input value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} /></div>
              <div className="space-y-1"><Label>Date</Label><Input value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-2">
                 <div className="space-y-1"><Label>Start Time</Label><Input value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} /></div>
                 <div className="space-y-1"><Label>End Time</Label><Input value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} /></div>
              </div>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
           <CardTitle className="text-sm font-bold uppercase tracking-widest">Attendance List</CardTitle>
           <Button type="button" size="sm" variant="outline" onClick={addAttendee}><Plus className="h-3 w-3 mr-1"/> Add Person</Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {attendees.map((a, i) => (
             <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 border p-3 rounded-lg relative group">
                <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-background border" onClick={() => removeAttendee(i)} disabled={attendees.length === 1}><Trash2 className="h-3 w-3"/></Button>
                <div className="space-y-1"><Label className="text-[10px] font-bold">Member Name</Label><Input value={a.name} onChange={e => { const n = [...attendees]; n[i].name = e.target.value; setAttendees(n); }} /></div>
                <div className="space-y-1"><Label className="text-[10px] font-bold">Position</Label><Input value={a.position} onChange={e => { const n = [...attendees]; n[i].position = e.target.value; setAttendees(n); }} /></div>
             </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50">
           <CardTitle className="text-sm font-bold uppercase tracking-widest">Agenda & Deliberations</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="space-y-1"><Label>Meeting Agenda *</Label><Textarea value={formData.agenda} onChange={e => setFormData({...formData, agenda: e.target.value})} placeholder="1. Opening Prayer, 2. Previous Minutes..." /></div>
          <div className="space-y-1"><Label>Detailed Deliberations *</Label><Textarea value={formData.deliberations} onChange={e => setFormData({...formData, deliberations: e.target.value})} placeholder="Record significant discussions and debates..." rows={6} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
           <CardTitle className="text-sm font-bold uppercase tracking-widest">Resolutions</CardTitle>
           <Button type="button" size="sm" variant="outline" onClick={addResolution}><Plus className="h-3 w-3 mr-1"/> Add Point</Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
           {resolutions.map((res, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 border p-3 rounded-lg relative group">
                <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-background border" onClick={() => removeResolution(i)} disabled={resolutions.length === 1}><Trash2 className="h-3 w-3"/></Button>
                <div className="md:col-span-6 space-y-1"><Label className="text-[10px] font-bold">Resolution</Label><Input value={res.point} onChange={e => { const n = [...resolutions]; n[i].point = e.target.value; setResolutions(n); }} /></div>
                <div className="md:col-span-3 space-y-1"><Label className="text-[10px] font-bold">By Who</Label><Input value={res.byWho} onChange={e => { const n = [...resolutions]; n[i].byWho = e.target.value; setResolutions(n); }} /></div>
                <div className="md:col-span-3 space-y-1"><Label className="text-[10px] font-bold">Deadline</Label><Input value={res.deadline} onChange={e => { const n = [...resolutions]; n[i].deadline = e.target.value; setResolutions(n); }} /></div>
              </div>
           ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center">Signatories</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-1"><Label>Chairperson *</Label><Input value={formData.chairperson} onChange={e => setFormData({...formData, chairperson: e.target.value})} /></div>
           <div className="space-y-1"><Label>Secretary *</Label><Input value={formData.secretary} onChange={e => setFormData({...formData, secretary: e.target.value})} /></div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end pt-4 pb-8">
        <Button variant="ghost" type="button" onClick={onSuccess}>Cancel</Button>
        <Dialog open={showOfficeSelect} onOpenChange={setShowOfficeSelect}>
          <DialogTrigger asChild>
            <Button type="button" size="lg" disabled={loading || !formData.agenda || !formData.deliberations}>
               <Send className="mr-2 h-4 w-4"/> Submit Minutes
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Choose Target Office</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Store in Archive of:</Label>
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger><SelectValue placeholder="Select target office" /></SelectTrigger>
                  <SelectContent>{OFFICES.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={loading || !selectedOffice} className="w-full h-12">{loading ? "Uploading..." : `Confirm Submission`}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
