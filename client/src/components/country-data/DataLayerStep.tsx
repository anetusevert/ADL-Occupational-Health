/**
 * Data Layer Selection Step Component
 * Step 2: Choose data layers/categories with color-coded cards
 */

import { motion } from "framer-motion";
import {
  Layers,
  ChevronRight,
  ChevronLeft,
  Shield,
  AlertOctagon,
  Eye,
  HeartPulse,
  Brain,
  Check,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { CategoryInfo } from "../../services/api";

// Category color mapping based on framework pillars
const CATEGORY_STYLES: Record<
  string,
  { gradient: string; border: string; icon: React.ElementType; color: string }
> = {
  governance: {
    gradient: "from-purple-500/20 to-purple-600/20",
    border: "border-purple-500/50",
    icon: Shield,
    color: "text-purple-400",
  },
  pillar_1_hazard: {
    gradient: "from-red-500/20 to-orange-500/20",
    border: "border-red-500/50",
    icon: AlertOctagon,
    color: "text-red-400",
  },
  pillar_2_vigilance: {
    gradient: "from-cyan-500/20 to-blue-500/20",
    border: "border-cyan-500/50",
    icon: Eye,
    color: "text-cyan-400",
  },
  pillar_3_restoration: {
    gradient: "from-emerald-500/20 to-green-500/20",
    border: "border-emerald-500/50",
    icon: HeartPulse,
    color: "text-emerald-400",
  },
  intelligence_governance: {
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/50",
    icon: Brain,
    color: "text-violet-400",
  },
  intelligence_hazard: {
    gradient: "from-orange-500/20 to-red-500/20",
    border: "border-orange-500/50",
    icon: Brain,
    color: "text-orange-400",
  },
  intelligence_vigilance: {
    gradient: "from-blue-500/20 to-cyan-500/20",
    border: "border-blue-500/50",
    icon: Brain,
    color: "text-blue-400",
  },
  intelligence_restoration: {
    gradient: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/50",
    icon: Brain,
    color: "text-green-400",
  },
  intelligence_economic: {
    gradient: "from-amber-500/20 to-yellow-500/20",
    border: "border-amber-500/50",
    icon: Brain,
    color: "text-amber-400",
  },
};

const DEFAULT_STYLE = {
  gradient: "from-slate-500/20 to-slate-600/20",
  border: "border-slate-500/50",
  icon: Layers,
  color: "text-slate-400",
};

interface DataLayerStepProps {
  categories: CategoryInfo[];
  selectedCategories: string[];
  onSelectionChange: (selected: string[]) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function DataLayerStep({
  categories,
  selectedCategories,
  onSelectionChange,
  onBack,
  onContinue,
}: DataLayerStepProps) {
  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      onSelectionChange(selectedCategories.filter((c) => c !== categoryId));
    } else {
      onSelectionChange([...selectedCategories, categoryId]);
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(categories.map((c) => c.id));
  };

  const handleSelectNone = () => {
    onSelectionChange([]);
  };

  const handleSelectCorePillars = () => {
    const corePillars = [
      "governance",
      "pillar_1_hazard",
      "pillar_2_vigilance",
      "pillar_3_restoration",
    ];
    onSelectionChange(corePillars.filter((p) => categories.some((c) => c.id === p)));
  };

  const handleSelectIntelligence = () => {
    const intelligence = categories
      .filter((c) => c.id.startsWith("intelligence_"))
      .map((c) => c.id);
    onSelectionChange(intelligence);
  };

  const canContinue = selectedCategories.length > 0;

  // Group categories
  const coreCategories = categories.filter(
    (c) => !c.id.startsWith("intelligence_")
  );
  const intelligenceCategories = categories.filter((c) =>
    c.id.startsWith("intelligence_")
  );

  const totalMetrics = selectedCategories.reduce((total, catId) => {
    const cat = categories.find((c) => c.id === catId);
    return total + (cat?.metric_count || 0);
  }, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
            <Layers className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Choose Data Layers
            </h2>
            <p className="text-sm text-slate-400">
              Select the categories you want to analyze
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          <span className="text-indigo-400 font-semibold">{totalMetrics}</span>{" "}
          metrics selected
        </div>
      </div>

      {/* Quick Select Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleSelectAll}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 transition-colors"
        >
          Select All
        </button>
        <button
          onClick={handleSelectCorePillars}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 transition-colors"
        >
          Core Framework Only
        </button>
        <button
          onClick={handleSelectIntelligence}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 transition-colors"
        >
          Intelligence Only
        </button>
        <button
          onClick={handleSelectNone}
          className="px-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600 transition-colors"
        >
          Clear All
        </button>
      </div>

      {/* Core Framework Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Core Framework
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {coreCategories.map((category, index) => {
            const style = CATEGORY_STYLES[category.id] || DEFAULT_STYLE;
            const isSelected = selectedCategories.includes(category.id);
            const Icon = style.icon;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleToggleCategory(category.id)}
                className={cn(
                  "relative p-4 rounded-xl border transition-all duration-300 text-left group",
                  isSelected
                    ? `bg-gradient-to-br ${style.gradient} ${style.border} shadow-lg`
                    : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600"
                )}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      isSelected
                        ? `bg-white/10 ${style.color}`
                        : "bg-slate-700/50 text-slate-400"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium text-sm truncate",
                        isSelected ? "text-white" : "text-slate-300"
                      )}
                    >
                      {category.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {category.metric_count} metrics
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Intelligence Categories */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">
          Intelligence Data
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {intelligenceCategories.map((category, index) => {
            const style = CATEGORY_STYLES[category.id] || DEFAULT_STYLE;
            const isSelected = selectedCategories.includes(category.id);
            const Icon = style.icon;

            return (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                onClick={() => handleToggleCategory(category.id)}
                className={cn(
                  "relative p-3 rounded-xl border transition-all duration-300 text-left group",
                  isSelected
                    ? `bg-gradient-to-br ${style.gradient} ${style.border} shadow-lg`
                    : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600"
                )}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                      isSelected
                        ? `bg-white/10 ${style.color}`
                        : "bg-slate-700/50 text-slate-400"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-medium text-xs truncate",
                        isSelected ? "text-white" : "text-slate-300"
                      )}
                    >
                      {category.name.replace("Intelligence: ", "")}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {category.metric_count} metrics
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back</span>
        </motion.button>

        <motion.button
          onClick={onContinue}
          disabled={!canContinue}
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
            canContinue
              ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          <span>Generate Results</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default DataLayerStep;
