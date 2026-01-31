/**
 * Arthur D. Little - Global Health Platform
 * Framework Analysis Modal
 * Full-screen modal for pillar details with clickable metrics
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  AlertTriangle,
  Eye,
  HeartPulse,
  Crown,
  Info,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { cn, getMaturityStage } from "../lib/utils";
import type { Country } from "../types/country";

// =============================================================================
// TYPES
// =============================================================================

export interface PillarData {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  score: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  metrics: MetricData[];
}

export interface MetricData {
  id: string;
  label: string;
  value: string | number | boolean | null | undefined;
  rawValue: string | number | boolean | null | undefined;
  description?: string;
  source?: string;
  relevance?: string;
}

interface FrameworkAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillar: PillarData | null;
  countryName: string;
  isoCode: string;
  onMetricClick?: (metric: MetricData, pillar: PillarData) => void;
}

// =============================================================================
// PILLAR ICON MAPPING
// =============================================================================

const PILLAR_ICONS: Record<string, React.ElementType> = {
  governance: Crown,
  pillar1: AlertTriangle,
  pillar2: Eye,
  pillar3: HeartPulse,
};

// =============================================================================
// METRIC CARD COMPONENT
// =============================================================================

interface MetricCardProps {
  metric: MetricData;
  pillarColor: string;
  index: number;
  onClick: () => void;
}

function MetricCard({ metric, pillarColor, index, onClick }: MetricCardProps) {
  // Format display value
  const displayValue = (() => {
    if (metric.value === null || metric.value === undefined) return "N/A";
    if (typeof metric.value === "boolean") return metric.value ? "Yes" : "No";
    return String(metric.value);
  })();

  // Determine status color
  const getStatusColor = () => {
    if (metric.value === null || metric.value === undefined) return "text-white/30";
    if (typeof metric.value === "boolean") {
      return metric.value ? "text-emerald-400" : "text-red-400";
    }
    return "text-white";
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      onClick={onClick}
      className={cn(
        "group relative w-full text-left p-4 rounded-xl border transition-all duration-200",
        "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      )}
    >
      {/* Content */}
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-white/50 mb-1">{metric.label}</p>
          <p className={cn("text-lg font-bold", getStatusColor())}>
            {displayValue}
          </p>
        </div>
        
        {/* Click indicator */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Info className="w-4 h-4 text-cyan-400" />
          <ChevronRight className="w-4 h-4 text-white/40" />
        </div>
      </div>

      {/* Hover highlight line */}
      <motion.div
        className={cn("absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl", pillarColor)}
        initial={{ scaleX: 0 }}
        whileHover={{ scaleX: 1 }}
        transition={{ duration: 0.2 }}
      />
    </motion.button>
  );
}

// =============================================================================
// MAIN MODAL COMPONENT
// =============================================================================

export function FrameworkAnalysisModal({
  isOpen,
  onClose,
  pillar,
  countryName,
  isoCode,
  onMetricClick,
}: FrameworkAnalysisModalProps) {
  if (!pillar) return null;

  const Icon = pillar.icon;
  const maturity = getMaturityStage(pillar.score);

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed inset-4 md:inset-8 lg:inset-16 z-50",
              "bg-slate-900 rounded-2xl border border-slate-700/50",
              "flex flex-col overflow-hidden",
              "shadow-2xl shadow-black/50"
            )}
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 px-6 py-4 border-b border-slate-700/50",
              "bg-gradient-to-r",
              pillar.gradientFrom,
              pillar.gradientTo
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Pillar Icon */}
                  <motion.div
                    initial={{ rotate: -10, scale: 0.9 }}
                    animate={{ rotate: 0, scale: 1 }}
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      "bg-gradient-to-br shadow-lg",
                      pillar.bgColor
                    )}
                  >
                    <Icon className={cn("w-7 h-7", pillar.color)} />
                  </motion.div>

                  {/* Title */}
                  <div>
                    <h2 className="text-xl font-bold text-white">{pillar.title}</h2>
                    <p className="text-sm text-white/60">{pillar.subtitle}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {countryName} ({isoCode})
                    </p>
                  </div>
                </div>

                {/* Score Badge & Close */}
                <div className="flex items-center gap-4">
                  {pillar.score !== null && (
                    <div className={cn(
                      "px-4 py-2 rounded-lg text-lg font-bold",
                      maturity.bgColor, maturity.color
                    )}>
                      {pillar.score.toFixed(0)}%
                    </div>
                  )}
                  
                  <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10"
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-adl-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-white mb-1">About this Pillar</h3>
                    <p className="text-sm text-white/60">
                      {getPillarDescription(pillar.id)}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Metrics Grid */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">
                  Metrics ({pillar.metrics.length})
                </h3>
                <p className="text-xs text-white/40 mb-4">
                  Click on any metric to see detailed explanation and source information
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pillar.metrics.map((metric, index) => (
                  <MetricCard
                    key={metric.id}
                    metric={metric}
                    pillarColor={`bg-gradient-to-r ${pillar.gradientFrom} ${pillar.gradientTo}`}
                    index={index}
                    onClick={() => onMetricClick?.(metric, pillar)}
                  />
                ))}
              </div>

              {/* Empty state if no metrics */}
              {pillar.metrics.length === 0 && (
                <div className="text-center py-12">
                  <Info className="w-12 h-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No metrics available for this pillar</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-slate-700/50 bg-slate-900/80">
              <div className="flex items-center justify-between">
                <p className="text-xs text-white/40">
                  ADL Occupational Health Framework v2.0
                </p>
                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getPillarDescription(pillarId: string): string {
  const descriptions: Record<string, string> = {
    governance: "The Governance layer assesses the institutional and regulatory framework for occupational health. This includes ILO convention ratifications, inspector density, mental health policies, and overall strategic capacity to implement and enforce workplace safety standards.",
    pillar1: "Hazard Control (Pillar 1) evaluates the effectiveness of hazard prevention and workplace safety controls. Key indicators include fatal accident rates, carcinogen exposure levels, heat stress regulations, and overall control maturity.",
    pillar2: "Health Vigilance (Pillar 2) measures the capacity for health surveillance and early detection. This encompasses surveillance systems, disease detection rates, vulnerability indices, and worker health monitoring capabilities.",
    pillar3: "Restoration (Pillar 3) assesses the rehabilitation and compensation systems. This includes payer mechanisms, reintegration laws, rehabilitation access scores, and return-to-work success rates.",
  };
  
  return descriptions[pillarId] || "This pillar provides key indicators for occupational health assessment.";
}

export default FrameworkAnalysisModal;
