import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, ImageIcon, XCircle, Loader2 } from "lucide-react";

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  title: string;
}

export default function DocumentViewer({ isOpen, onClose, fileUrl, title }: DocumentViewerProps) {
  if (!fileUrl) return null;

  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(fileUrl);
  const isPDF = /\.pdf$/i.test(fileUrl) || fileUrl === "#"; // Mock simulation treats '#' as PDF for now

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = fileUrl;
    a.download = title;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-4 border-b bg-slate-50 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-1.5 rounded">
              {isImage ? <ImageIcon className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-primary" />}
            </div>
            <DialogTitle className="text-sm font-semibold truncate max-w-[200px] sm:max-w-md">
              {title}
            </DialogTitle>
          </div>
          <div className="flex items-center gap-2 pr-8">
             <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={handleDownload}>
               <Download className="h-3.5 w-3.5" /> Download
             </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 bg-slate-100 flex items-center justify-center overflow-auto relative">
          {isPDF ? (
            <iframe
              src="https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
              className="w-full h-full border-none"
              title={title}
            />
          ) : isImage ? (
            <img
              src={fileUrl}
              alt={title}
              className="max-w-full max-h-full object-contain shadow-lg rounded-sm"
            />
          ) : (
            <div className="text-center p-12 bg-white rounded-2xl shadow-sm border border-slate-200">
               <XCircle className="h-12 w-12 text-slate-300 mx-auto mb-4" />
               <p className="text-slate-600 font-medium italic">Preview not available for this file type.</p>
               <Button variant="default" className="mt-6" onClick={handleDownload}>
                 <Download className="h-4 w-4 mr-2" /> Download to View Locally
               </Button>
            </div>
          )}
        </div>

        <DialogFooter className="p-3 bg-white border-t flex sm:justify-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
              Secure Document Viewer • Mengo Connect Hub
            </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
