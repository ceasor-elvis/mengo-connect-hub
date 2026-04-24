import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Loader2, RefreshCcw, LayoutTemplate } from "lucide-react";
import HierarchyTree from "@/components/portal/HierarchyTree";
import StructureEditor from "@/components/portal/StructureEditor";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useHierarchy } from "@/hooks/useHierarchy";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { FileText } from "lucide-react";

export default function HierarchyPage() {
  const { profile, roles } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isAdminOrCP = roles?.some(r => ["adminabsolute", "chairperson"].includes(r));
  const isAbsoluteAdmin = roles?.includes("adminabsolute");

  const { tree, loading: loadingTree } = useHierarchy(refreshKey);



  const exportToPDF = async () => {
    const element = document.getElementById("hierarchy-tree-capture");
    if (!element) return;
    
    setUpdating(true);
    toast.info("Generating PDF, please wait...");
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      
      const imgW = pdfW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      
      let heightLeft = imgH;
      let position = 10;
      
      pdf.setFont("helvetica", "bold");
      pdf.text("MENGO SENIOR SCHOOL - COUNCIL HIERARCHY", pdfW / 2, 8, { align: "center" });
      
      pdf.addImage(imgData, "PNG", 10, position, imgW, imgH);
      
      pdf.save(`Council_Hierarchy_${Date.now()}.pdf`);
      toast.success("Hierarchy exported successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export hierarchy");
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToPDF} disabled={updating}>
            <FileText className="h-3.5 w-3.5 mr-2" /> Export Structure
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Refresh View
          </Button>
        </div>
      </div>

      <Tabs defaultValue="view" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="view" className="flex items-center gap-2">
            <Users className="w-4 h-4" /> Structure & Assignments
          </TabsTrigger>
          {isAbsoluteAdmin && (
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4" /> Edit Layout Structure
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="view" className="space-y-6">
          <Card>
            <CardHeader className="pb-2 px-3 sm:px-6 border-b mb-4">
              <CardTitle className="text-sm font-semibold">Council Structure & Current Officers</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6" id="hierarchy-tree-capture">
              <HierarchyTree refreshKey={refreshKey} />
            </CardContent>
          </Card>
        </TabsContent>

        {isAbsoluteAdmin && (
          <TabsContent value="edit" className="m-0 border-none p-0 outline-none">
            <StructureEditor onTreeUpdated={() => setRefreshKey(prev => prev + 1)} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
