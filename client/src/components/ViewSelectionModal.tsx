/**
 * Arthur D. Little - Global Health Platform
 * View Selection Modal
 * 
 * Modal shown when user clicks a country, allowing them to choose
 * which visualization view they want to see.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Layers, GitBranch, Radar, Table2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CountryFlag } from "./CountryFlag";
import { cn } from "../lib/utils";

export type ViewType = "layers" | "flow" | "radar" | "summary";

interface ViewOption {
  id: ViewType;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

const VIEW_OPTIONS: ViewOption[] = [
  {
    id: "layers",
    title: "National OH System Layers",
    subtitle: "Onion Model",
    description: "Concentric view of Policy, Infrastructure, and Workplace implementation layers with hierarchical analysis.",
    icon: Layers,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
  },
  {
    id: "flow",
    title: "System Logic Flow",
    subtitle: "Input → Process → Outcome",
    description: "Linear flow mapping resources and laws through operational processes to health outcomes.",
    icon: GitBranch,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
  },
  {
    id: "radar",
    title: "Comparative Benchmark",
    subtitle: "5-Dimension Radar",
    description: "Spider chart comparing Governance, Financing, Capacity, Implementation, and Impact against benchmarks.",
    icon: Radar,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
  },
  {
    id: "summary",
    title: "Summary Comparison",
    subtitle: "Data Table",
    description: "Side-by-side metrics table for quick data verification against comparison countries and global averages.",
    icon: Table2,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
  },
];

interface ViewSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  countryIso: string;
  countryName: string;
  countryFlagUrl?: string;
}

export function ViewSelectionModal({
  isOpen,
  onClose,
  countryIso,
  countryName,
  countryFlagUrl,
}: ViewSelectionModalProps) {
  const navigate = useNavigate();

  const handleSelectView = (viewType: ViewType) => {
    navigate(`/country/${countryIso}?view=${viewType}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-3xl pointer-events-auto overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-slate-800/50">
                <div className="flex items-center gap-4">
                  <CountryFlag
                    isoCode={countryIso}
                    flagUrl={countryFlagUrl}
                    size="lg"
                    className="shadow-lg"
                  />
                  <div>
                    <h2 className="text-xl font-bold text-white">{countryName}</h2>
                    <p className="text-sm text-white/50">Select a view to analyze</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              {/* View Options Grid */}
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {VIEW_OPTIONS.map((view, index) => {
                    const Icon = view.icon;
                    return (
                      <motion.button
                        key={view.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleSelectView(view.id)}
                        className={cn(
                          "group relative p-5 rounded-xl border text-left transition-all duration-200",
                          "hover:scale-[1.02] hover:shadow-lg",
                          view.bgColor,
                          view.borderColor,
                          "hover:border-opacity-60"
                        )}
                      >
                        {/* Icon */}
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center mb-4",
                          view.bgColor,
                          "border",
                          view.borderColor
                        )}>
                          <Icon className={cn("w-6 h-6", view.color)} />
                        </div>

                        {/* Content */}
                        <h3 className="text-base font-semibold text-white mb-1">
                          {view.title}
                        </h3>
                        <p className={cn("text-xs font-medium mb-2", view.color)}>
                          {view.subtitle}
                        </p>
                        <p className="text-xs text-white/50 leading-relaxed">
                          {view.description}
                        </p>

                        {/* Hover indicator */}
                        <div className={cn(
                          "absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity",
                          "text-xs font-medium",
                          view.color
                        )}>
                          Select →
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Footer hint */}
              <div className="px-5 pb-5">
                <p className="text-xs text-white/30 text-center">
                  Each view includes AI-powered deep analysis specific to {countryName}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default ViewSelectionModal;
