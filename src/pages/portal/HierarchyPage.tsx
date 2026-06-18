import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Network, RefreshCcw, FileText, Settings2, Sparkles } from "lucide-react";
import HierarchyTree from "@/components/portal/HierarchyTree";
import StructureEditor from "@/components/portal/StructureEditor";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { motion } from "framer-motion";

export default function HierarchyPage() {
  const { roles } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const isAbsoluteAdmin = roles?.includes("adminabsolute");

  const exportToPDF = async () => {
    const element = document.getElementById("hierarchy-tree-capture");
    if (!element) return;
    setExporting(true);
    toast.info("Generating PDF, please wait…");
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const imgW = pdfW - 20;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.setFont("helvetica", "bold");
      pdf.text("MENGO SENIOR SCHOOL — COUNCIL HIERARCHY", pdfW / 2, 8, { align: "center" });
      pdf.addImage(imgData, "PNG", 10, 14, imgW, imgH);
      pdf.save(`Council_Hierarchy_${Date.now()}.pdf`);
      toast.success("Hierarchy exported successfully!");
    } catch {
      toast.error("Failed to export hierarchy");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
              <Network className="h-5 w-5 text-primary" />
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-black tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Council Hierarchy
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-11 font-medium uppercase tracking-widest">
            Organizational Structure & Cabinet Officers
          </p>
        </div>

        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          {isAbsoluteAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditorOpen(true)}
              className="h-9 rounded-xl border-primary/20 text-primary hover:bg-primary/5 font-bold text-xs uppercase tracking-wide"
            >
              <Settings2 className="h-3.5 w-3.5 mr-2" /> Edit Structure
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRefreshKey((p) => p + 1)}
            className="h-9 rounded-xl font-bold text-xs uppercase tracking-wide"
          >
            <RefreshCcw className="h-3.5 w-3.5 mr-2" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            disabled={exporting}
            className="h-9 rounded-xl font-bold text-xs uppercase tracking-wide"
          >
            <FileText className="h-3.5 w-3.5 mr-2" /> Export PDF
          </Button>
        </div>
      </motion.div>

      {/* ── Tree ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="relative rounded-3xl border border-border/40 bg-card/40 backdrop-blur-xl shadow-xl overflow-hidden"
      >
        {/* subtle ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/3 via-transparent to-accent/3 pointer-events-none" />

        {/* watermark label */}
        <div className="absolute top-4 left-5 flex items-center gap-1.5 opacity-30 select-none pointer-events-none">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-primary">Live Structure</span>
        </div>

        <div id="hierarchy-tree-capture" className="relative z-10 pt-8">
          <HierarchyTree refreshKey={refreshKey} />
        </div>
      </motion.div>

      {/* ── Admin Edit Drawer ── */}
      {isAbsoluteAdmin && (
        <Sheet open={editorOpen} onOpenChange={setEditorOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-3xl p-0 border-l border-border/40 bg-background/95 backdrop-blur-2xl flex flex-col"
          >
            <SheetHeader className="px-6 py-4 border-b border-border/40 shrink-0">
              <SheetTitle className="font-serif text-xl font-black flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Edit Layout Structure
              </SheetTitle>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
                Add, rename, reorder or remove roles — changes publish instantly
              </p>
            </SheetHeader>
            <div className="flex-1 overflow-auto p-4">
              <StructureEditor
                onTreeUpdated={() => {
                  setRefreshKey((p) => p + 1);
                  setEditorOpen(false);
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
