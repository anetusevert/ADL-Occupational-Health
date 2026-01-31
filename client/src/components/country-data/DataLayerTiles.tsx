/**
 * Data Layer Tiles Component
 * Framework-style animated tiles for data layer selection
 * 
 * Features:
 * - Animated tiles matching InteractiveTemple design
 * - Core Framework section (Governance + 3 Pillars)
 * - Intelligence Data section
 * - Staggered entrance animations
 * - Glow and hover effects
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  AlertOctagon,
  Eye,
  HeartPulse,
  Brain,
  Layers,
  Check,
  ChevronRight,
  Sparkles,
  Database,
} from "lucide-react";
import { cn } from "../../lib/utils";
import type { CategoryInfo } from "../../services/api";
import type { LucideIcon } from "lucide-react";

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

const smoothEase = [0.25, 0.46, 0.45, 0.94] as const;

const tileVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: smoothEase,
    },
  }),
};

// =============================================================================
// CATEGORY STYLING
// =============================================================================

interface CategoryStyle {
  icon: LucideIcon;
  color: string;
  gradient: string;
  gradientFrom: string;
  gradientTo: string;
  glowColor: string;
  description: string;
}

const CATEGORY_STYLES: Record<string, CategoryStyle> = {
  governance: {
    icon: Shield,
    color: "purple",
    gradient: "from-purple-500 to-violet-600",
    gradientFrom: "from-purple-500/20",
    gradientTo: "to-violet-600/10",
    glowColor: "shadow-purple-500/20",
    description: "Legal frameworks, ratifications, and institutional structures",
  },
  pillar_1_hazard: {
    icon: AlertOctagon,
    color: "red",
    gradient: "from-red-500 to-orange-500",
    gradientFrom: "from-red-500/20",
    gradientTo: "to-orange-500/10",
    glowColor: "shadow-red-500/20",
    description: "Hazard prevention and workplace safety controls",
  },
  pillar_2_vigilance: {
    icon: Eye,
    color: "cyan",
    gradient: "from-cyan-500 to-blue-500",
    gradientFrom: "from-cyan-500/20",
    gradientTo: "to-blue-500/10",
    glowColor: "shadow-cyan-500/20",
    description: "Health surveillance and monitoring systems",
  },
  pillar_3_restoration: {
    icon: HeartPulse,
    color: "emerald",
    gradient: "from-emerald-500 to-green-500",
    gradientFrom: "from-emerald-500/20",
    gradientTo: "to-green-500/10",
    glowColor: "shadow-emerald-500/20",
    description: "Rehabilitation and return-to-work programs",
  },
  intelligence_governance: {
    icon: Brain,
    color: "violet",
    gradient: "from-violet-500 to-purple-600",
    gradientFrom: "from-violet-500/20",
    gradientTo: "to-purple-600/10",
    glowColor: "shadow-violet-500/20",
    description: "Governance intelligence and policy analysis",
  },
  intelligence_hazard: {
    icon: Brain,
    color: "orange",
    gradient: "from-orange-500 to-red-500",
    gradientFrom: "from-orange-500/20",
    gradientTo: "to-red-500/10",
    glowColor: "shadow-orange-500/20",
    description: "Hazard burden and risk assessment data",
  },
  intelligence_vigilance: {
    icon: Brain,
    color: "blue",
    gradient: "from-blue-500 to-cyan-500",
    gradientFrom: "from-blue-500/20",
    gradientTo: "to-cyan-500/10",
    glowColor: "shadow-blue-500/20",
    description: "Health system capacity metrics",
  },
  intelligence_restoration: {
    icon: Brain,
    color: "green",
    gradient: "from-green-500 to-emerald-500",
    gradientFrom: "from-green-500/20",
    gradientTo: "to-emerald-500/10",
    glowColor: "shadow-green-500/20",
    description: "Social support and safety net indicators",
  },
  intelligence_economic: {
    icon: Brain,
    color: "amber",
    gradient: "from-amber-500 to-yellow-500",
    gradientFrom: "from-amber-500/20",
    gradientTo: "to-yellow-500/10",
    glowColor: "shadow-amber-500/20",
    description: "Economic context and workforce data",
  },
};

const DEFAULT_STYLE: CategoryStyle = {
  icon: Layers,
  color: "slate",
  gradient: "from-slate-500 to-slate-600",
  gradientFrom: "from-slate-500/20",
  gradientTo: "to-slate-600/10",
  glowColor: "shadow-slate-500/20",
  description: "Data layer metrics",
};

// =============================================================================
// TYPES
// =============================================================================

interface DataLayerTilesProps {
  categories: CategoryInfo[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedCountriesCount: number;
}

// =============================================================================
// DATA LAYER TILE
// =============================================================================

interface DataLayerTileProps {
  category: CategoryInfo;
  style: CategoryStyle;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
  isCore?: boolean;
}

function DataLayerTile({
  category,
  style,
  index,
  isSelected,
  onToggle,
  isCore = false,
}: DataLayerTileProps) {
  const Icon = style.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      custom={index}
      variants={tileVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative cursor-pointer rounded-lg border backdrop-blur-md transition-all duration-300 overflow-hidden",
        "bg-gradient-to-b",
        style.gradientFrom,
        style.gradientTo,
        isSelected
          ? "border-cyan-400/50 shadow-md shadow-cyan-900/20"
          : "border-white/10 hover:border-white/20",
        isCore ? "px-3 py-2.5" : "px-2.5 py-2"
      )}
    >
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          <motion.div
            className={cn(
              "flex-shrink-0 rounded-lg flex items-center justify-center",
              `bg-gradient-to-br ${style.gradient}`,
              isCore ? "w-9 h-9" : "w-7 h-7",
              "shadow-md"
            )}
            animate={{
              rotate: isSelected ? [0, -3, 3, 0] : 0,
            }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            <Icon className={cn("text-white", isCore ? "w-4 h-4" : "w-3.5 h-3.5")} />
          </motion.div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                className={cn(
                  "font-semibold transition-colors duration-300 truncate",
                  isCore ? "text-sm" : "text-xs",
                  isSelected ? "text-white" : "text-slate-200"
                )}
              >
                {category.name.replace("Intelligence: ", "")}
              </h3>
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full flex items-center justify-center bg-cyan-500"
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Metric count */}
          <div
            className={cn(
              "flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold",
              isSelected
                ? "bg-cyan-500/30 text-cyan-300"
                : "bg-slate-700/50 text-slate-400"
            )}
          >
            {category.metric_count}
          </div>
        </div>

        {/* Hover-revealed description */}
        <AnimatePresence>
          {isHovered && isCore && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="mt-2 pt-2 border-t border-white/10"
            >
              <p className="text-[10px] text-slate-400 leading-relaxed">
                {style.description}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {["ILO Ratified", "Inspector Density"].map((metric, i) => (
                  <span
                    key={i}
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400"
                  >
                    {metric}
                  </span>
                ))}
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-700/50 text-slate-400">
                  +{Math.max(0, category.metric_count - 2)} more
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom border accent when selected */}
      <motion.div
        className={cn(
          "absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg",
          `bg-gradient-to-r ${style.gradient}`
        )}
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{
          opacity: isSelected ? 0.8 : 0,
          scaleX: isSelected ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}

// =============================================================================
// QUICK ACTION BUTTONS
// =============================================================================

interface QuickActionsProps {
  onSelectAll: () => void;
  onSelectCore: () => void;
  onClear: () => void;
  selectedCount: number;
  totalCount: number;
}

function QuickActions({ onSelectAll, onSelectCore, onClear, selectedCount, totalCount }: QuickActionsProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={onSelectAll}
        className={cn(
          "flex-1 py-2 text-xs font-medium rounded-lg border transition-all",
          selectedCount === totalCount
            ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
            : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-700/50"
        )}
      >
        All Layers
      </button>
      <button
        onClick={onSelectCore}
        className="flex-1 py-2 text-xs font-medium bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
      >
        Core Only
      </button>
      <button
        onClick={onClear}
        className="flex-1 py-2 text-xs font-medium bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
      >
        Clear
      </button>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DataLayerTiles({
  categories,
  selectedCategories,
  onCategoriesChange,
  selectedCountriesCount,
}: DataLayerTilesProps) {
  // Separate core and intelligence categories
  const { coreCategories, intelligenceCategories } = useMemo(() => {
    const core = categories.filter((c) => !c.id.startsWith("intelligence_"));
    const intel = categories.filter((c) => c.id.startsWith("intelligence_"));
    return { coreCategories: core, intelligenceCategories: intel };
  }, [categories]);

  // Toggle category selection
  const toggleCategory = useCallback(
    (categoryId: string) => {
      if (selectedCategories.includes(categoryId)) {
        onCategoriesChange(selectedCategories.filter((c) => c !== categoryId));
      } else {
        onCategoriesChange([...selectedCategories, categoryId]);
      }
    },
    [selectedCategories, onCategoriesChange]
  );

  // Quick actions
  const selectAll = useCallback(() => {
    onCategoriesChange(categories.map((c) => c.id));
  }, [categories, onCategoriesChange]);

  const selectCore = useCallback(() => {
    onCategoriesChange(coreCategories.map((c) => c.id));
  }, [coreCategories, onCategoriesChange]);

  const clearAll = useCallback(() => {
    onCategoriesChange([]);
  }, [onCategoriesChange]);

  // Count total metrics
  const totalMetrics = useMemo(() => {
    return selectedCategories.reduce((sum, catId) => {
      const cat = categories.find((c) => c.id === catId);
      return sum + (cat?.metric_count || 0);
    }, 0);
  }, [selectedCategories, categories]);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Database className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-white">Select Data Layers</h2>
            <p className="text-[10px] text-slate-400">
              Analyzing {selectedCountriesCount} {selectedCountriesCount === 1 ? "country" : "countries"}
            </p>
          </div>
          {totalMetrics > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1.5 px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-lg"
            >
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span className="text-xs font-bold text-indigo-300">{totalMetrics} metrics</span>
            </motion.div>
          )}
        </div>

        <QuickActions
          onSelectAll={selectAll}
          onSelectCore={selectCore}
          onClear={clearAll}
          selectedCount={selectedCategories.length}
          totalCount={categories.length}
        />
      </div>

      {/* Compact Tiles Grid - fits without scroll */}
      <div className="flex-1 p-3 overflow-y-auto">
        {/* Core Framework Section */}
        <div className="mb-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-2"
          >
            <Shield className="w-3 h-3 text-purple-400" />
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Core Framework
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-purple-500/30 to-transparent" />
          </motion.div>

          <div className="space-y-1.5">
            {coreCategories.map((category, index) => {
              const style = CATEGORY_STYLES[category.id] || DEFAULT_STYLE;
              return (
                <DataLayerTile
                  key={category.id}
                  category={category}
                  style={style}
                  index={index}
                  isSelected={selectedCategories.includes(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  isCore={true}
                />
              );
            })}
          </div>
        </div>

        {/* Compact Connector */}
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="flex justify-center py-1"
        >
          <div className="w-0.5 h-4 bg-gradient-to-b from-purple-500/30 via-indigo-500/30 to-amber-500/30 rounded-full" />
        </motion.div>

        {/* Intelligence Data Section */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex items-center gap-2 mb-2"
          >
            <Brain className="w-3 h-3 text-amber-400" />
            <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              Intelligence Data
            </h3>
            <div className="flex-1 h-px bg-gradient-to-r from-amber-500/30 to-transparent" />
          </motion.div>

          <div className="grid grid-cols-2 gap-1.5">
            {intelligenceCategories.map((category, index) => {
              const style = CATEGORY_STYLES[category.id] || DEFAULT_STYLE;
              return (
                <DataLayerTile
                  key={category.id}
                  category={category}
                  style={style}
                  index={index + coreCategories.length}
                  isSelected={selectedCategories.includes(category.id)}
                  onToggle={() => toggleCategory(category.id)}
                  isCore={false}
                />
              );
            })}
          </div>
        </div>

        {/* Compact Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-3 pt-2 border-t border-slate-700/30"
        >
          <p className="text-[9px] text-slate-500 text-center">
            Hover over Core tiles to see details. Click to toggle selection.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default DataLayerTiles;
