/**
 * Arthur D. Little - Global Health Platform
 * Selection Summary Panel Component
 * 
 * Floating panel showing selected country with continue action
 * Updated: Single country selection mode
 */

import { useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight, Globe, MapPin } from "lucide-react";
import { cn, getApiBaseUrl } from "../../../lib/utils";

interface SelectedCountry {
  iso_code: string;
  name: string;
  flag_url: string | null;
}

interface SelectionSummaryProps {
  selectedCountry: SelectedCountry;  // Single country
  onClear: () => void;
  onContinue: () => void;
  className?: string;
}

export function SelectionSummary({
  selectedCountry,
  onClear,
  onContinue,
  className,
}: SelectionSummaryProps) {
  const [imgError, setImgError] = useState(false);
  const apiBaseUrl = getApiBaseUrl();
  const fullFlagUrl = selectedCountry.flag_url ? `${apiBaseUrl}${selectedCountry.flag_url}` : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
        "bg-slate-900/98 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl",
        "max-w-md w-[90vw]",
        className
      )}
    >
      {/* Single Country Display */}
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
            <MapPin className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-center gap-3">
            {fullFlagUrl && !imgError ? (
              <img
                src={fullFlagUrl}
                alt={selectedCountry.name}
                className="w-8 h-5 object-cover rounded shadow-sm"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-8 h-5 flex items-center justify-center rounded bg-slate-700/60 border border-slate-600/40 text-[9px] font-medium text-slate-400">
                {selectedCountry.iso_code.slice(0, 2)}
              </div>
            )}
            <div>
              <h4 className="text-sm font-semibold text-white">{selectedCountry.name}</h4>
              <p className="text-xs text-slate-400">Selected for analysis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
          
          <motion.button
            onClick={onContinue}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white text-sm font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Globe className="w-4 h-4" />
            Continue
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default SelectionSummary;
