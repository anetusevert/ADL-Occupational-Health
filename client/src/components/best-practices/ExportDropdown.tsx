/**
 * Arthur D. Little - Global Health Platform
 * Export Dropdown Component for Best Practices
 * 
 * Reusable dropdown menu for PDF and Word export options.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, File, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface ExportDropdownProps {
  onExportPDF: () => Promise<void>;
  onExportWord: () => Promise<void>;
  disabled?: boolean;
  className?: string;
}

export function ExportDropdown({
  onExportPDF,
  onExportWord,
  disabled = false,
  className,
}: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<"pdf" | "word" | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportPDF = async () => {
    setIsExporting("pdf");
    try {
      await onExportPDF();
    } catch (error) {
      console.error("PDF export failed:", error);
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  const handleExportWord = async () => {
    setIsExporting("word");
    try {
      await onExportWord();
    } catch (error) {
      console.error("Word export failed:", error);
    } finally {
      setIsExporting(null);
      setIsOpen(false);
    }
  };

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isExporting !== null}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
          "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400",
          "hover:bg-emerald-500/30 hover:border-emerald-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
        whileHover={!disabled && !isExporting ? { scale: 1.02 } : undefined}
        whileTap={!disabled && !isExporting ? { scale: 0.98 } : undefined}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>Export</span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", isOpen && "rotate-180")} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 z-50"
          >
            <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden">
              <div className="p-1">
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting !== null}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                    "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isExporting === "pdf" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                  ) : (
                    <FileText className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium">Export as PDF</div>
                    <div className="text-xs text-slate-500">High-quality document</div>
                  </div>
                </button>

                <button
                  onClick={handleExportWord}
                  disabled={isExporting !== null}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                    "text-slate-300 hover:bg-slate-700/50 hover:text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  {isExporting === "word" ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  ) : (
                    <File className="w-4 h-4 text-blue-400" />
                  )}
                  <div>
                    <div className="text-sm font-medium">Export as Word</div>
                    <div className="text-xs text-slate-500">Editable document</div>
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ExportDropdown;
