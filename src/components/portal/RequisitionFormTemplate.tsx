import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Send, FileText, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import jsPDF from "jspdf";
import mengoBadge from "@/assets/mengo-badge.jpg";
import { unsaLogoB64 } from "@/assets/unsaBase64";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface BudgetRow { description: string; quantity: number; unitCost: number; amount: number; }

export default function RequisitionFormTemplate({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showOfficeSelect, setShowOfficeSelect] = useState(false);
  const [selectedOffice, setSelectedOffice] = useState("");

  const [formData, setFormData] = useState({
    title: "VINE STUDENTS' COUNCIL BODY",
    department: "",
    reason: "",
    totalInWords: "",
    requestedBy: "",
    date: new Date().toLocaleDateString("en-UG", { day: "numeric", month: "long", year: "numeric" })
  });

  const [rows, setRows] = useState<BudgetRow[]>([{ description: "", quantity: 1, unitCost: 0, amount: 0 }]);

  const addRow = () => setRows([...rows, { description: "", quantity: 1, unitCost: 0, amount: 0 }]);
  const removeRow = (idx: number) => setRows(rows.filter((_, i) => i !== idx));

  const updateRow = (idx: number, field: keyof BudgetRow, val: any) => {
    const newRows = [...rows];
    (newRows[idx] as any)[field] = val;
    if (field === "quantity" || field === "unitCost") {
      newRows[idx].amount = newRows[idx].quantity * newRows[idx].unitCost;
    }
    setRows(newRows);
  };

  const totalAmount = rows.reduce((sum, r) => sum + r.amount, 0);

  const OFFICES = [
    { id: "secretary_finance", label: "Secretary Finance" },
    { id: "chairperson", label: "Chairperson" },
    { id: "patron_pending_chairperson", label: "Patron (Requires Chairperson Approval)" }
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
    doc.text(formData.title.toUpperCase(), pageW / 2, y, { align: "center" });
    y += 10; doc.setFontSize(12);
    doc.text("OFFICIAL REQUISITION VOUCHER", pageW / 2, y, { align: "center" });
    y += 10;

    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Date: ${formData.date}`, 15, y); 
    doc.text(`Dept: ${formData.department || "General"}`, pageW - 60, y);
    y += 10;

    doc.setFont("helvetica", "bold"); doc.text("Reason for Funds:", 15, y); y += 5;
    doc.setFont("helvetica", "normal");
    const reasonLines = doc.splitTextToSize(formData.reason || "N/A", pageW - 30);
    doc.text(reasonLines, 15, y);
    y += (reasonLines.length * 5) + 5;

    // Budget Table
    const headers = ["Description", "Qty", "Unit Cost", "Amount (UGX)"];
    const colW = [(pageW - 30) * 0.45, (pageW - 30) * 0.1, (pageW - 30) * 0.2, (pageW - 30) * 0.25];
    
    doc.setFillColor(240, 240, 240); doc.rect(15, y, pageW - 30, 7, "F");
    doc.setFont("helvetica", "bold");
    let currentX = 15;
    headers.forEach((h, i) => {
      doc.text(h, currentX + 2, y + 5);
      currentX += colW[i];
    });
    y += 7;

    doc.setFont("helvetica", "normal");
    rows.forEach(r => {
      let maxLines = 1;
      const descLines = doc.splitTextToSize(r.description || "", colW[0] - 4);
      maxLines = Math.max(maxLines, descLines.length);
      const rowH = (maxLines * 4) + 2;
      
      if (y + rowH > 280) { doc.addPage(); y = 20; }
      
      let rowX = 15;
      doc.text(descLines, rowX + 2, y + 4); rowX += colW[0];
      doc.text(r.quantity.toString(), rowX + 2, y + 4); rowX += colW[1];
      doc.text(r.unitCost.toLocaleString(), rowX + 2, y + 4); rowX += colW[2];
      doc.text(r.amount.toLocaleString(), rowX + 2, y + 4);
      
      doc.rect(15, y, pageW - 30, rowH);
      y += rowH;
    });

    // Total Row
    doc.setFont("helvetica", "bold");
    doc.rect(15, y, pageW - 30, 8);
    doc.text("TOTAL:", 15 + colW[0] + colW[1] + colW[2] - 15, y + 6);
    doc.text(totalAmount.toLocaleString(), 15 + colW[0] + colW[1] + colW[2] + 2, y + 6);
    y += 12;

    doc.text("Amount in Words:", 15, y); y += 5;
    doc.setFont("helvetica", "normal");
    const wordLines = doc.splitTextToSize(formData.totalInWords || "N/A", pageW - 30);
    doc.text(wordLines, 15, y);
    y += (wordLines.length * 5) + 15;

    // Signatures
    const sigY = y;
    doc.setFont("helvetica", "bold");
    doc.text("REQUESTED BY:", 15, sigY);
    doc.text("DATE:", 15, sigY + 12);
    
    doc.text("AUTHORISED BY (CP):", pageW / 2 + 5, sigY);
    doc.text("APPROVED BY (Patron):", pageW / 2 + 5, sigY + 12);
    
    doc.setFont("helvetica", "normal");
    doc.text(formData.requestedBy || "________________", 45, sigY);
    doc.text(formData.date, 45, sigY + 12);
    
    doc.text("________________", pageW / 2 + 50, sigY);
    doc.text("________________", pageW / 2 + 50, sigY + 12);

    doc.setTextColor(150, 0, 0); doc.setFont("helvetica", "bold"); doc.setFontSize(10);
    doc.text("ANOINTED TO BEAR FRUIT", pageW / 2, 285, { align: "center" });

    doc.setTextColor(180, 180, 180); doc.setFont("helvetica", "normal"); doc.setFontSize(7);
    doc.text("Designed & Initiated by Katumba Andrew Felix", pageW / 2, 292, { align: "center" });

    return doc.output("blob");
  };

  const handleDownloadPreview = async () => {
    setLoading(true);
    try {
      const pdfBlob = await generatePDF();
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Voucher_Preview_${formData.department.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Voucher Preview downloaded!");
    } catch (e) {
      toast.error("Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const pdfBlob = await generatePDF();
      const fileName = `Requisition_${formData.department.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const fd = new FormData();
      fd.append("title", `Requisition: ${formData.reason.slice(0, 20)}...`);
      fd.append("category", "Finance");
      fd.append("access_level", "shared");
      fd.append("target_office", selectedOffice);
      fd.append("file", pdfBlob, fileName);
      await api.post("/documents/", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success("Financial Requisition submitted!");
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
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center text-primary">Financial Requisition Voucher</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Council Name</Label><Input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
              <div className="space-y-1"><Label>Department / Office</Label><Input value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} placeholder="e.g. Welfare" /></div>
              <div className="md:col-span-2 space-y-1"><Label>Reason for Funds *</Label><Textarea value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="Explain why funds are needed..." /></div>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-widest">Budget Breakdown</CardTitle>
          <Button type="button" size="sm" variant="outline" onClick={addRow}><Plus className="h-3 w-3 mr-1"/> Add Item</Button>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-2 border p-3 rounded-lg relative group">
              <Button type="button" variant="ghost" size="icon" className="absolute -top-2 -right-2 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity bg-background border" onClick={() => removeRow(i)} disabled={rows.length === 1}><Trash2 className="h-3 w-3"/></Button>
              <div className="md:col-span-5 space-y-1"><Label className="text-[10px] font-bold">Item Description</Label><Input value={r.description} onChange={e => updateRow(i, "description", e.target.value)} /></div>
              <div className="md:col-span-1 space-y-1"><Label className="text-[10px] font-bold">Qty</Label><Input type="number" value={r.quantity} onChange={e => updateRow(i, "quantity", Number(e.target.value))} /></div>
              <div className="md:col-span-3 space-y-1"><Label className="text-[10px] font-bold">Unit Cost</Label><Input type="number" value={r.unitCost} onChange={e => updateRow(i, "unitCost", Number(e.target.value))} /></div>
              <div className="md:col-span-3 space-y-1"><Label className="text-[10px] font-bold">Amount</Label><p className="h-10 flex items-center px-3 border rounded bg-muted/30 text-xs font-bold">UGX {r.amount.toLocaleString()}</p></div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
             <p className="text-lg font-bold">Total: <span className="text-primary">UGX {totalAmount.toLocaleString()}</span></p>
          </div>
          <div className="space-y-1"><Label>Total Amount in Words *</Label><Input value={formData.totalInWords} onChange={e => setFormData({...formData, totalInWords: e.target.value})} placeholder="e.g. Two Hundred Thousand Shillings Only" /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="bg-muted/50">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-center">Submission Info</CardTitle>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
           <div className="space-y-1"><Label>Requested By (Your Name) *</Label><Input value={formData.requestedBy} onChange={e => setFormData({...formData, requestedBy: e.target.value})} /></div>
           <div className="space-y-1"><Label>Date</Label><Input value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 justify-end pt-4 pb-8">
        <Button variant="ghost" type="button" onClick={onSuccess}>Cancel</Button>
        <Button 
          variant="outline" 
          type="button" 
          onClick={handleDownloadPreview} 
          disabled={loading || !formData.reason || !totalAmount}
          className="border-primary text-primary hover:bg-primary/5"
        >
          <IndianRupee className="mr-2 h-4 w-4"/> Download PDF Voucher
        </Button>
        <Dialog open={showOfficeSelect} onOpenChange={setShowOfficeSelect}>
          <DialogTrigger asChild>
            <Button type="button" size="lg" disabled={loading || !formData.reason || !totalAmount}>
               <Send className="mr-2 h-4 w-4"/> Submit Requisition
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Choose Target Office</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Required Approval Flow:</Label>
                <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                  <SelectTrigger><SelectValue placeholder="Select target office" /></SelectTrigger>
                  <SelectContent>{OFFICES.map(o => <SelectItem key={o.id} value={o.id}>{o.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit} disabled={loading || !selectedOffice} className="w-full h-12">{loading ? "Sending..." : `Submit Voucher`}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
