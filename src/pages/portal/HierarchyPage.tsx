import { useState } from "react";
import { Network, Sparkles, RefreshCcw } from "lucide-react";
import StructureEditor from "@/components/portal/StructureEditor";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function HierarchyPage() {
  const { roles } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 relative min-h-screen">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />

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
              Council Hierarchy Structure
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-11 font-medium uppercase tracking-widest">
            Configure Organizational Roles, Reporting Lines & Cabinet Composition
          </p>
        </div>
      </motion.div>

      {/* ── Structure Editor Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="relative rounded-3xl border border-border/40 bg-card/60 backdrop-blur-xl shadow-xl overflow-hidden p-4 sm:p-6"
      >
        <StructureEditor
          key={refreshKey}
          onTreeUpdated={() => setRefreshKey((p) => p + 1)}
        />
      </motion.div>
    </div>
  );
}
