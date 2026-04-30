import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { Rocket, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function SystemUpdateModal() {
  const [update, setUpdate] = useState<any>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const res = await api.get("/system-updates/latest-unseen/");
        if (res.data) {
          setUpdate(res.data);
          // Small delay before showing modal for better UX
          setTimeout(() => setOpen(true), 1500);
        }
      } catch (e) {
        console.error("Failed to check for system updates");
      }
    };

    checkUpdates();
  }, []);

  const handleMarkSeen = async () => {
    if (!update) return;
    try {
      await api.post(`/system-updates/${update.id}/mark-seen/`);
      setOpen(false);
    } catch (e) {
      console.error("Failed to mark update as seen");
      setOpen(false);
    }
  };

  if (!update) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden p-0 border-none bg-transparent shadow-none">
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <div className="relative h-32 bg-gradient-to-r from-primary via-maroon-dark to-primary flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <motion.div
                  initial={{ rotate: -20, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="bg-white/20 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/30"
                >
                  <Rocket className="w-10 h-10 text-gold" />
                </motion.div>
                
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                      className="w-2 h-2 rounded-full bg-gold/50"
                    />
                  ))}
                </div>
              </div>

              <div className="p-8 pt-10 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                   <Sparkles className="w-4 h-4 text-gold" />
                   <span className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">New System Update</span>
                   <Sparkles className="w-4 h-4 text-gold" />
                </div>
                
                <DialogHeader>
                  <DialogTitle className="text-2xl font-serif font-black text-primary dark:text-white mb-2 leading-tight">
                    {update.title}
                  </DialogTitle>
                </DialogHeader>

                <div className="mt-4 text-slate-600 dark:text-slate-300 leading-relaxed text-left max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    {update.content.split('\n').map((line: string, i: number) => (
                      <p key={i} className="mb-3">{line}</p>
                    ))}
                  </div>
                </div>

                {update.version && (
                  <div className="mt-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-mono text-slate-500 dark:text-slate-400">
                    Version {update.version}
                  </div>
                )}

                <DialogFooter className="mt-8 sm:justify-center">
                  <Button 
                    onClick={handleMarkSeen}
                    className="w-full sm:w-auto px-10 py-6 bg-gradient-to-r from-primary to-maroon-dark hover:from-maroon-dark hover:to-primary text-white rounded-xl shadow-lg shadow-primary/30 transition-all hover:scale-105 active:scale-95 font-bold uppercase tracking-widest"
                  >
                    <CheckCircle2 className="mr-2 h-5 w-5 text-gold" /> Got it, thanks!
                  </Button>
                </DialogFooter>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
