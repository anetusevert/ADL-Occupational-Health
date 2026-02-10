/**
 * Global Generation Status Bar
 * 
 * Shows all active AI generations across the app.
 * Displayed at the top of the page when any generation is in progress.
 */

import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";
import { useGeneration } from "../contexts/GenerationContext";
import { cn } from "../lib/utils";

export function GenerationStatusBar() {
  const { activeGenerations, hasActiveGenerations, completeGeneration } = useGeneration();
  
  const generations = Object.values(activeGenerations);
  
  if (!hasActiveGenerations) return null;
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-lg"
      >
        <div className="max-w-screen-2xl mx-auto px-4 py-2">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-hide">
            {/* Label */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </motion.div>
              <span className="text-xs font-medium text-white/70">
                Processing{generations.length > 1 ? "" : ""}
              </span>
            </div>
            
            {/* Separator */}
            <div className="w-px h-6 bg-white/10 flex-shrink-0" />
            
            {/* Generation items */}
            <div className="flex items-center gap-3 flex-1">
              {generations.map((gen) => (
                <motion.div
                  key={gen.isoCode}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs",
                    gen.failed > 0 
                      ? "bg-red-500/20 border border-red-500/30" 
                      : gen.message?.includes("complete") || gen.message?.includes("ready")
                        ? "bg-emerald-500/20 border border-emerald-500/30"
                        : "bg-cyan-500/20 border border-cyan-500/30"
                  )}
                >
                  {/* Status icon */}
                  {gen.failed > 0 ? (
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : gen.message?.includes("complete") || gen.message?.includes("ready") ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                  )}
                  
                  {/* Country name */}
                  <span className="font-medium text-white">{gen.countryName}</span>
                  
                  {/* Progress or message */}
                  <span className="text-white/60">
                    {gen.inProgress && gen.inProgress !== "initializing" 
                      ? `${gen.inProgress}` 
                      : gen.message}
                  </span>
                  
                  {/* Progress indicator */}
                  {gen.total > 0 && !gen.message?.includes("complete") && (
                    <span className="text-white/40">
                      ({gen.completed}/{gen.total})
                    </span>
                  )}
                  
                  {/* Close button for completed/failed */}
                  {(gen.message?.includes("complete") || gen.message?.includes("ready") || gen.failed > 0) && (
                    <button
                      onClick={() => completeGeneration(gen.isoCode)}
                      className="ml-1 p-0.5 hover:bg-white/10 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-white/40 hover:text-white" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
            
            {/* Processing indicator */}
            {generations.some(g => !g.message?.includes("complete") && !g.message?.includes("ready") && g.failed === 0) && (
              <div className="flex items-center gap-2 flex-shrink-0 text-xs text-white/50">
                <div className="flex gap-0.5">
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: 0.2, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                  <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1, delay: 0.4, repeat: Infinity }}
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                  />
                </div>
                <span>Processing...</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
