import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText, ImageIcon, XCircle, Loader2 } from "lucide-react";

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string | null;
  title: string;
  type?: 'pdf' | 'image' | 'office' | 'auto';
}

export default function DocumentViewer({ isOpen, onClose, fileUrl, title, type = 'auto' }: DocumentViewerProps) {
  if (!fileUrl) return null;

  const getAbsoluteUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('blob:')) return url;
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const base = apiUrl.endsWith('/api') ? apiUrl.replace(/\/api$/, '') : apiUrl;
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const absoluteFileUrl = getAbsoluteUrl(fileUrl);

  const getExt = (url: string) => {
    try {
      const path = url.split('?')[0].split('#')[0];
      return path.split('.').pop()?.toLowerCase() || "";
    } catch { return ""; }
  };

  const ext = getExt(absoluteFileUrl);
  const isBlob = absoluteFileUrl.startsWith('blob:');
  
  const isImage = type === 'image' || (type === 'auto' && /^(jpg|jpeg|png|webp|gif|svg)$/i.test(ext));
  const isPDF = type === 'pdf' || isBlob || (type === 'auto' && ext === 'pdf');
  const isOffice = type === 'office' || (type === 'auto' && /^(docx|doc|xlsx|xls|pptx|ppt)$/i.test(ext));

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = absoluteFileUrl;
    a.download = title.endsWith(ext) ? title : `${title}.${ext || 'pdf'}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getViewerUrl = () => {
    if (isOffice && !isBlob) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(absoluteFileUrl)}&embedded=true`;
    }
    return absoluteFileUrl;
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
          {isPDF || isOffice ? (
            <iframe
              src={getViewerUrl()}
              className="w-full h-full border-none shadow-inner"
              title={title}
            />
          ) : isImage ? (
            <img
              src={absoluteFileUrl}
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
              Secure Document Viewer • Hermonas Copycat
            </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}