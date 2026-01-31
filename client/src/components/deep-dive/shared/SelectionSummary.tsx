/**
 * Arthur D. Little - Global Health Platform
 * Selection Summary Panel Component
 * 
 * Floating panel showing selected countries with remove capability
 * Re-applied: 2026-01-31
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, Globe, Users } from "lucide-react";
import { cn, getApiBaseUrl } from "../../../lib/utils";

interface SelectedCountry {
  iso_code: string;
  name: string;
  flag_url: string | null;
}

interface SelectionSummaryProps {
  selectedCountries: SelectedCountry[];
  onRemove: (isoCode: string) => void;
  onClear: () => void;
  onContinue: () => void;
  className?: string;
}

export function SelectionSummary({
  selectedCountries,
  onRemove,
  onClear,
  onContinue,
  className,
}: SelectionSummaryProps) {
  if (selectedCountries.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={cn(
        "fixed bottom-20 left-1/2 -translate-x-1/2 z-50",
        "bg-slate-900/98 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl",
        "max-w-2xl w-[90vw]",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">
              {selectedCountries.length} {selectedCountries.length === 1 ? "Country" : "Countries"} Selected
            </h4>
            <p className="text-xs text-slate-500">Click to remove</p>
          </div>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1"
        >
          Clear all
        </button>
      </div>

      {/* Selected Countries Grid */}
      <div className="p-3 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex flex-wrap gap-2">
          <AnimatePresence mode="popLayout">
            {selectedCountries.map((country) => (
              <CountryChip key={country.iso_code} country={country} onRemove={onRemove} />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer with Continue Button */}
      <div className="px-4 py-3 border-t border-slate-700/50 flex justify-end">
        <motion.button
          onClick={onContinue}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white text-sm font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Globe className="w-4 h-4" />
          Continue to Topics
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

// Country Chip with proper flag URL handling
function CountryChip({ country, onRemove }: { country: SelectedCountry; onRemove: (iso: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const apiBaseUrl = getApiBaseUrl();
  const fullFlagUrl = country.flag_url ? `${apiBaseUrl}${country.flag_url}` : null;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => onRemove(country.iso_code)}
      className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-lg hover:bg-red-500/20 hover:border-red-500/40 transition-all group"
    >
      {fullFlagUrl && !imgError ? (
        <img
          src={fullFlagUrl}
          alt={country.name}
          className="w-5 h-3.5 object-cover rounded shadow-sm"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="w-5 h-3.5 flex items-center justify-center rounded bg-slate-700/60 border border-slate-600/40 text-[7px] font-medium text-slate-400">
          {country.iso_code.slice(0, 2)}
        </div>
      )}
      <span className="text-xs text-slate-300 group-hover:text-red-300 transition-colors">
        {country.name}
      </span>
      <X className="w-3 h-3 text-slate-500 group-hover:text-red-400 transition-colors" />
    </motion.button>
  );
}

export default SelectionSummary;
