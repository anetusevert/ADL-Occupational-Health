/**
 * GOHIP Platform - Interactive Pillar Grid Component
 * Phase 12: Deep Dive Interactive Tiles
 * Phase 26: AI-Powered Metric Explanations
 * 
 * Features:
 * - 2x2 grid of summary cards
 * - Click-to-expand animation with framer-motion
 * - Full data density in expanded view
 * - AI-generated metric explanations (admin only)
 * - Dark glassmorphism styling
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Shield,
  AlertTriangle,
  Eye,
  HeartPulse,
  CheckCircle2,
  XCircle,
  Minus,
  X,
  Database,
  Link as LinkIcon,
  Sparkles,
  Loader2,
  ExternalLink,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus as MinusIcon,
  RefreshCw,
  Globe,
} from "lucide-react";
import { cn, getMaturityStage, formatNumber, formatBoolean } from "../lib/utils";
import { getMetricExplanations, generatePillarExplanations } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import type { Country } from "../types/country";

interface InteractivePillarGridProps {
  country: Country;
  className?: string;
}

// Card configuration types
interface CardConfig {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Shield;
  colorTheme: "purple" | "red" | "cyan" | "emerald";
  gradientFrom: string;
  gradientTo: string;
  borderHover: string;
}

const cardConfigs: CardConfig[] = [
  {
    id: "governance",
    title: "Governance Layer",
    subtitle: "Strategic Capacity & Policy",
    icon: Shield,
    colorTheme: "purple",
    gradientFrom: "from-purple-500/10",
    gradientTo: "to-purple-900/5",
    borderHover: "hover:border-purple-500/50",
  },
  {
    id: "pillar1",
    title: "Pillar 1: Hazard Control",
    subtitle: "Occupational Risk Management",
    icon: AlertTriangle,
    colorTheme: "red",
    gradientFrom: "from-red-500/10",
    gradientTo: "to-red-900/5",
    borderHover: "hover:border-red-500/50",
  },
  {
    id: "pillar2",
    title: "Pillar 2: Health Vigilance",
    subtitle: "Surveillance & Detection",
    icon: Eye,
    colorTheme: "cyan",
    gradientFrom: "from-cyan-500/10",
    gradientTo: "to-cyan-900/5",
    borderHover: "hover:border-cyan-500/50",
  },
  {
    id: "pillar3",
    title: "Pillar 3: Restoration",
    subtitle: "Compensation & Rehabilitation",
    icon: HeartPulse,
    colorTheme: "emerald",
    gradientFrom: "from-emerald-500/10",
    gradientTo: "to-emerald-900/5",
    borderHover: "hover:border-emerald-500/50",
  },
];

// Color mapping for dynamic classes
const colorMap = {
  purple: {
    iconBg: "bg-gradient-to-br from-purple-500 to-purple-700",
    badge: "bg-purple-500/20 text-purple-300",
    border: "border-purple-500/60",
    glow: "shadow-purple-500/20",
    ring: "ring-purple-400/30",
  },
  red: {
    iconBg: "bg-gradient-to-br from-red-500 to-red-700",
    badge: "bg-red-500/20 text-red-300",
    border: "border-red-500/60",
    glow: "shadow-red-500/20",
    ring: "ring-red-400/30",
  },
  cyan: {
    iconBg: "bg-gradient-to-br from-cyan-500 to-cyan-700",
    badge: "bg-cyan-500/20 text-cyan-300",
    border: "border-cyan-500/60",
    glow: "shadow-cyan-500/20",
    ring: "ring-cyan-400/30",
  },
  emerald: {
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-700",
    badge: "bg-emerald-500/20 text-emerald-300",
    border: "border-emerald-500/60",
    glow: "shadow-emerald-500/20",
    ring: "ring-emerald-400/30",
  },
};

// Animation variants
const cardVariants = {
  collapsed: {
    scale: 1,
    zIndex: 1,
  },
  expanded: {
    scale: 1,
    zIndex: 50,
  },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { delay: 0.2, duration: 0.3 }
  },
};

export function InteractivePillarGrid({ country, className }: InteractivePillarGridProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const handleCardClick = (cardId: string) => {
    setExpandedCard(cardId);
  };

  const handleClose = () => {
    setExpandedCard(null);
  };

  // Get score for each card
  const getCardScore = (cardId: string): number | null => {
    switch (cardId) {
      case "governance":
        return country.governance?.strategic_capacity_score ?? null;
      case "pillar1":
        return country.pillar_1_hazard?.control_maturity_score ?? null;
      case "pillar2":
        return country.pillar_2_vigilance?.disease_detection_rate ?? null;
      case "pillar3":
        return country.pillar_3_restoration?.rehab_access_score ?? null;
      default:
        return null;
    }
  };

  // Get summary metrics for collapsed view
  const getSummaryMetrics = (cardId: string): { label: string; value: string }[] => {
    switch (cardId) {
      case "governance":
        return [
          { label: "ILO C187", value: formatBoolean(country.governance?.ilo_c187_status ?? null) },
          { label: "Inspector Density", value: formatNumber(country.governance?.inspector_density) },
        ];
      case "pillar1":
        return [
          { label: "Fatality Rate", value: formatNumber(country.pillar_1_hazard?.fatal_accident_rate) },
          { label: "Carcinogen Exp", value: `${formatNumber(country.pillar_1_hazard?.carcinogen_exposure_pct, 1)}%` },
        ];
      case "pillar2":
        return [
          { label: "Detection Rate", value: `${formatNumber(country.pillar_2_vigilance?.disease_detection_rate, 0)}%` },
          { label: "Vulnerability", value: `${formatNumber(country.pillar_2_vigilance?.vulnerability_index, 0)}/100` },
        ];
      case "pillar3":
        return [
          { label: "Rehab Access", value: `${formatNumber(country.pillar_3_restoration?.rehab_access_score, 0)}/100` },
          { label: "Sickness Absence", value: `${formatNumber(country.pillar_3_restoration?.sickness_absence_days, 0)} days` },
        ];
      default:
        return [];
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Grid Container */}
      <div className="grid md:grid-cols-2 gap-6">
        {cardConfigs.map((config, index) => {
          const score = getCardScore(config.id);
          const maturity = getMaturityStage(score);
          const colors = colorMap[config.colorTheme];
          const summaryMetrics = getSummaryMetrics(config.id);
          const Icon = config.icon;
          const isExpanded = expandedCard === config.id;

          return (
            <motion.div
              key={config.id}
              layoutId={`card-${config.id}`}
              variants={cardVariants}
              initial="collapsed"
              animate={isExpanded ? "expanded" : "collapsed"}
              onClick={() => !isExpanded && handleCardClick(config.id)}
              whileHover={!isExpanded ? { scale: 1.02, y: -4 } : {}}
              whileTap={!isExpanded ? { scale: 0.98 } : {}}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
              className={cn(
                "rounded-xl border backdrop-blur-sm p-6 cursor-pointer transition-colors duration-300",
                "bg-slate-800/50 border-slate-700/50",
                config.borderHover,
                !isExpanded && "hover:shadow-lg"
              )}
              style={{
                originX: index % 2 === 0 ? 0 : 1,
                originY: index < 2 ? 0 : 1,
              }}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colors.iconBg)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{config.title}</h3>
                  <p className="text-xs text-slate-400">{config.subtitle}</p>
                </div>
                {score !== null && (
                  <div className={cn("px-3 py-1 rounded-full text-sm font-medium", maturity.bgColor, maturity.color)}>
                    {formatNumber(score, 0)}%
                  </div>
                )}
              </div>

              {/* Summary Metrics */}
              <div className="grid grid-cols-2 gap-3">
                {summaryMetrics.map((metric, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">{metric.label}</p>
                    <p className="text-sm font-medium text-white">{metric.value}</p>
                  </div>
                ))}
              </div>

              {/* Click hint */}
              <p className="text-xs text-slate-500 mt-4 text-center">
                Click to explore full metrics →
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Expanded Card Overlay */}
      <AnimatePresence>
        {expandedCard && (
          <>
            {/* Backdrop */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
            />

            {/* Expanded Card */}
            <ExpandedCard
              cardId={expandedCard}
              country={country}
              onClose={handleClose}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// EXPANDED CARD COMPONENT
// ============================================================================

interface ExpandedCardProps {
  cardId: string;
  country: Country;
  onClose: () => void;
}

function ExpandedCard({ cardId, country, onClose }: ExpandedCardProps) {
  const config = cardConfigs.find((c) => c.id === cardId)!;
  const colors = colorMap[config.colorTheme];
  const Icon = config.icon;
  const { isAdmin } = useAuth();
  
  // State for hover-based interaction
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [showSourceModal, setShowSourceModal] = useState(false);

  // Fetch stored explanations on mount
  const { data: explanationsData, isLoading: isLoadingExplanations, refetch } = useQuery({
    queryKey: ["metric-explanations", country.iso_code, cardId],
    queryFn: () => getMetricExplanations(country.iso_code, cardId),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Mutation for generating explanations (admin only)
  const generateMutation = useMutation({
    mutationFn: () => generatePillarExplanations(country.iso_code, cardId),
    onSuccess: () => {
      refetch(); // Refetch after generation
    },
  });

  const explanations = explanationsData?.explanations || [];
  
  // Find the explanation for the hovered metric
  const rawExplanation = hoveredMetric 
    ? explanations.find(e => e.metric_name === hoveredMetric)
    : null;
  
  // Normalize the explanation to handle both old and new field names
  const activeExplanation = rawExplanation ? {
    ...rawExplanation,
    value: rawExplanation.metric_value || rawExplanation.value || "N/A",
    perspective: rawExplanation.performance_rating || rawExplanation.perspective || "moderate",
  } : null;

  // Get score and maturity
  const getScore = (): number | null => {
    switch (cardId) {
      case "governance":
        return country.governance?.strategic_capacity_score ?? null;
      case "pillar1":
        return country.pillar_1_hazard?.control_maturity_score ?? null;
      case "pillar2":
        return country.pillar_2_vigilance?.disease_detection_rate ?? null;
      case "pillar3":
        return country.pillar_3_restoration?.rehab_access_score ?? null;
      default:
        return null;
    }
  };

  const score = getScore();
  const maturity = getMaturityStage(score);

  // Get perspective color and icon
  const getPerspectiveStyle = (perspective: string) => {
    switch (perspective) {
      case "excellent":
        return { color: "text-emerald-400", bg: "bg-emerald-500/20", icon: TrendingUp };
      case "good":
        return { color: "text-green-400", bg: "bg-green-500/20", icon: TrendingUp };
      case "moderate":
        return { color: "text-yellow-400", bg: "bg-yellow-500/20", icon: MinusIcon };
      case "concerning":
        return { color: "text-orange-400", bg: "bg-orange-500/20", icon: TrendingDown };
      case "critical":
        return { color: "text-red-400", bg: "bg-red-500/20", icon: TrendingDown };
      default:
        return { color: "text-slate-400", bg: "bg-slate-500/20", icon: MinusIcon };
    }
  };

  return (
    <motion.div
      layoutId={`card-${cardId}`}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
      }}
      className={cn(
        "fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50",
        "w-[90vw] max-w-5xl max-h-[85vh] overflow-y-auto",
        "rounded-2xl border-2 backdrop-blur-xl",
        "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
        colors.border,
        "shadow-2xl",
        colors.glow,
        "ring-1",
        colors.ring
      )}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
      >
        <X className="w-5 h-5 text-slate-400" />
      </button>

      {/* Content */}
      <motion.div
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        className="p-8"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", colors.iconBg)}>
            <Icon className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">{config.title}</h2>
            <p className="text-sm text-slate-400">{config.subtitle}</p>
          </div>
          {score !== null && (
            <div className="text-right">
              <div className={cn("text-4xl font-bold", maturity.color)}>
                {formatNumber(score, 0)}%
              </div>
              <div className={cn("text-sm", maturity.color)}>
                Stage {maturity.stage}: {maturity.label}
              </div>
            </div>
          )}
        </div>

        {/* Data Sources - Small icons */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-xs text-slate-500">Data Sources:</span>
          <button
            onClick={() => setShowSourceModal(true)}
            className="flex items-center gap-1.5 px-2 py-1 bg-slate-800/50 rounded-lg text-xs text-cyan-400 hover:bg-slate-700/50 transition-colors"
          >
            <LinkIcon className="w-3 h-3" />
            View Sources
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Data Grid - Hover-based Interaction */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Metrics Data (Hover to select) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-lg font-semibold text-white">Metrics Data</h3>
              <span className="text-xs text-white/40 ml-2">Hover to explore</span>
            </div>
            <div className="space-y-1 bg-slate-900/50 rounded-xl p-4">
              {cardId === "governance" && (
                <HoverableGovernanceMetrics 
                  governance={country.governance} 
                  hoveredMetric={hoveredMetric}
                  onHover={setHoveredMetric}
                  hasExplanation={(name) => explanations.some(e => e.metric_name === name)}
                />
              )}
              {cardId === "pillar1" && (
                <HoverablePillar1Metrics 
                  pillar={country.pillar_1_hazard}
                  hoveredMetric={hoveredMetric}
                  onHover={setHoveredMetric}
                  hasExplanation={(name) => explanations.some(e => e.metric_name === name)}
                />
              )}
              {cardId === "pillar2" && (
                <HoverablePillar2Metrics 
                  pillar={country.pillar_2_vigilance}
                  hoveredMetric={hoveredMetric}
                  onHover={setHoveredMetric}
                  hasExplanation={(name) => explanations.some(e => e.metric_name === name)}
                />
              )}
              {cardId === "pillar3" && (
                <HoverablePillar3Metrics 
                  pillar={country.pillar_3_restoration}
                  hoveredMetric={hoveredMetric}
                  onHover={setHoveredMetric}
                  hasExplanation={(name) => explanations.some(e => e.metric_name === name)}
                />
              )}
            </div>
            
            {/* Admin Generate Button - Only visible to admin */}
            {isAdmin && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => generateMutation.mutate()}
                  disabled={generateMutation.isPending}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all",
                    explanations.length > 0
                      ? "bg-slate-700/50 text-white/60 hover:text-white hover:bg-slate-600/50"
                      : "bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                  )}
                >
                  {generateMutation.isPending ? (
                    <><Loader2 className="w-3 h-3 animate-spin" />Processing...</>
                  ) : explanations.length > 0 ? (
                    <><RefreshCw className="w-3 h-3" />Refresh Analysis</>
                  ) : (
                    <><Sparkles className="w-3 h-3" />Initialize Analysis</>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Country Analysis (Dynamic based on hover) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Country Analysis</h3>
            </div>
            
            <div className="bg-slate-900/50 rounded-xl p-4 min-h-[350px]">
              {isLoadingExplanations ? (
                <div className="flex flex-col items-center justify-center h-full py-8">
                  <Loader2 className="w-6 h-6 text-purple-400 animate-spin mb-3" />
                  <p className="text-sm text-white/60">Loading analysis...</p>
                </div>
              ) : activeExplanation ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={hoveredMetric}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {/* Metric Header */}
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold text-white mb-1">{activeExplanation.metric_name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          getPerspectiveStyle(activeExplanation.perspective).bg,
                          getPerspectiveStyle(activeExplanation.perspective).color
                        )}>
                          {activeExplanation.perspective}
                        </span>
                        <span className="text-xs text-white/50">Value: {activeExplanation.value}</span>
                      </div>
                    </div>

                    {/* Performance Bar Chart */}
                    <div className="mb-4 bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/60">Performance vs Global</span>
                        <span className="text-xs font-medium text-cyan-400">
                          {activeExplanation.percentile_rank ? `${Math.round(activeExplanation.percentile_rank)}th percentile` : "N/A"}
                        </span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${activeExplanation.percentile_rank || 50}%` }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          className={cn(
                            "h-full rounded-full",
                            (activeExplanation.percentile_rank || 50) >= 70 ? "bg-emerald-500" :
                            (activeExplanation.percentile_rank || 50) >= 40 ? "bg-yellow-500" : "bg-red-500"
                          )}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-white/40">
                        <span>Low</span>
                        <span>Global Avg</span>
                        <span>High</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-white/80 mb-2">What This Means</h5>
                      <p className="text-sm text-white/70 leading-relaxed">{activeExplanation.explanation}</p>
                    </div>

                    {/* Performance Analysis */}
                    {activeExplanation.performance_analysis && (
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-white/80 mb-2">Country Performance</h5>
                        <p className="text-sm text-white/70 leading-relaxed">{activeExplanation.performance_analysis}</p>
                      </div>
                    )}

                    {/* Comparison Stats */}
                    {activeExplanation.comparison_data && (
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        {activeExplanation.global_average && (
                          <div className="bg-slate-800/30 rounded-lg p-2">
                            <p className="text-xs text-white/40">Global Avg</p>
                            <p className="text-sm font-medium text-white">{activeExplanation.global_average}</p>
                          </div>
                        )}
                        {activeExplanation.comparison_data.best_in_class && (
                          <div className="bg-slate-800/30 rounded-lg p-2">
                            <p className="text-xs text-white/40">Best in Class</p>
                            <p className="text-sm font-medium text-emerald-400">{activeExplanation.comparison_data.best_in_class}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              ) : explanations.length > 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <BarChart3 className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-white/60 font-medium mb-1">Hover over a metric</p>
                  <p className="text-sm text-white/40">
                    Hover over any metric on the left to see detailed analysis
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                  <BarChart3 className="w-10 h-10 text-slate-600 mb-3" />
                  <p className="text-white/60 font-medium mb-1">Analysis Not Available</p>
                  <p className="text-sm text-white/40">
                    {isAdmin
                      ? 'Click "Initialize Analysis" to create metric explanations'
                      : "Analysis for this pillar is being prepared. Please check back later."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Source Links Modal */}
      <AnimatePresence>
        {showSourceModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSourceModal(false)}
              className="fixed inset-0 bg-black/50 z-[60]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] w-[90vw] max-w-md bg-slate-900 rounded-xl border border-slate-700 p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Data Sources</h3>
                <button
                  onClick={() => setShowSourceModal(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              <SourceLinks cardId={cardId} country={country} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// NO DATA PLACEHOLDER (Phase 20.1)
// ============================================================================

function NoDataPlaceholder({ pillarName }: { pillarName: string }) {
  return (
    <div className="text-center py-6">
      <Database className="w-10 h-10 text-slate-600 mx-auto mb-3" />
      <p className="text-slate-400 font-medium mb-1">No Data Available</p>
      <p className="text-slate-500 text-sm">
        {pillarName} metrics have not been collected for this country yet.
      </p>
      <p className="text-amber-400/70 text-xs mt-3">
        This is a data gap that requires investigation.
      </p>
    </div>
  );
}

// ============================================================================
// HOVERABLE METRIC COMPONENTS (Phase 26.5)
// ============================================================================

interface HoverableMetricRowProps {
  label: string;
  value: string | number | boolean | null | undefined;
  suffix?: string;
  type?: "number" | "boolean" | "enum";
  highlight?: boolean;
  metricName: string;
  hoveredMetric: string | null;
  onHover: (name: string | null) => void;
  hasExplanation: boolean;
}

function HoverableMetricRow({ 
  label, 
  value, 
  suffix, 
  type = "number", 
  highlight,
  metricName,
  hoveredMetric,
  onHover,
  hasExplanation
}: HoverableMetricRowProps) {
  let displayValue: React.ReactNode;
  let icon: React.ReactNode = null;
  const isHovered = hoveredMetric === metricName;

  if (value === null || value === undefined) {
    displayValue = "N/A";
    icon = <Minus className="w-4 h-4 text-slate-500" />;
  } else if (type === "boolean") {
    displayValue = formatBoolean(value as boolean);
    icon = value ? (
      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    );
  } else if (type === "enum") {
    displayValue = String(value);
  } else {
    displayValue = typeof value === "number" ? formatNumber(value) : String(value);
  }

  return (
    <div 
      className={cn(
        "flex items-center justify-between py-2.5 px-2 -mx-2 rounded-lg border-b border-slate-700/30 last:border-0 cursor-pointer transition-all duration-200",
        isHovered && "bg-purple-500/10 border-purple-500/30",
        hasExplanation && !isHovered && "hover:bg-slate-800/50"
      )}
      onMouseEnter={() => hasExplanation && onHover(metricName)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-2">
        {hasExplanation && (
          <div className={cn(
            "w-1.5 h-1.5 rounded-full transition-colors",
            isHovered ? "bg-purple-400" : "bg-slate-600"
          )} />
        )}
        <span className={cn(
          "text-sm transition-colors",
          isHovered ? "text-white" : "text-slate-400"
        )}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <span
          className={cn(
            "text-sm font-medium transition-colors",
            highlight ? "text-red-400" : isHovered ? "text-white" : "text-white"
          )}
        >
          {displayValue}
          {suffix && value !== null && value !== undefined && (
            <span className="text-slate-500 ml-1">{suffix}</span>
          )}
        </span>
      </div>
    </div>
  );
}

function HoverableGovernanceMetrics({ 
  governance, 
  hoveredMetric, 
  onHover,
  hasExplanation 
}: { 
  governance: Country["governance"];
  hoveredMetric: string | null;
  onHover: (name: string | null) => void;
  hasExplanation: (name: string) => boolean;
}) {
  if (!governance) {
    return <NoDataPlaceholder pillarName="Governance" />;
  }
  
  return (
    <>
      <HoverableMetricRow 
        label="ILO C187 (Promotional Framework)" 
        value={governance.ilo_c187_status} 
        type="boolean"
        metricName="ILO C187 (Promotional Framework)"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("ILO C187 (Promotional Framework)")}
      />
      <HoverableMetricRow 
        label="ILO C155 (OSH Convention)" 
        value={governance.ilo_c155_status} 
        type="boolean"
        metricName="ILO C155 (OSH Convention)"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("ILO C155 (OSH Convention)")}
      />
      <HoverableMetricRow 
        label="Inspector Density" 
        value={governance.inspector_density} 
        suffix="per 10,000 workers"
        metricName="Inspector Density"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Inspector Density")}
      />
      <HoverableMetricRow 
        label="Mental Health Policy" 
        value={governance.mental_health_policy} 
        type="boolean"
        metricName="Mental Health Policy"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Mental Health Policy")}
      />
      <HoverableMetricRow 
        label="Strategic Capacity Score" 
        value={governance.strategic_capacity_score} 
        suffix="%"
        metricName="Strategic Capacity Score"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Strategic Capacity Score")}
      />
    </>
  );
}

function HoverablePillar1Metrics({ 
  pillar, 
  hoveredMetric, 
  onHover,
  hasExplanation 
}: { 
  pillar: Country["pillar_1_hazard"];
  hoveredMetric: string | null;
  onHover: (name: string | null) => void;
  hasExplanation: (name: string) => boolean;
}) {
  if (!pillar) {
    return <NoDataPlaceholder pillarName="Hazard Control" />;
  }
  
  return (
    <>
      <HoverableMetricRow 
        label="Fatal Accident Rate" 
        value={pillar.fatal_accident_rate} 
        suffix="per 100,000"
        highlight={pillar.fatal_accident_rate !== null && pillar.fatal_accident_rate !== undefined && pillar.fatal_accident_rate > 2.0}
        metricName="Fatal Accident Rate"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Fatal Accident Rate")}
      />
      <HoverableMetricRow 
        label="Carcinogen Exposure" 
        value={pillar.carcinogen_exposure_pct} 
        suffix="% workforce"
        metricName="Carcinogen Exposure"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Carcinogen Exposure")}
      />
      <HoverableMetricRow 
        label="Heat Stress Regulation" 
        value={pillar.heat_stress_reg_type} 
        type="enum"
        metricName="Heat Stress Regulation"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Heat Stress Regulation")}
      />
      <HoverableMetricRow 
        label="OEL Compliance" 
        value={pillar.oel_compliance_pct} 
        suffix="%"
        highlight={pillar.oel_compliance_pct !== null && pillar.oel_compliance_pct !== undefined && pillar.oel_compliance_pct < 70}
        metricName="OEL Compliance"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("OEL Compliance")}
      />
      <HoverableMetricRow 
        label="Control Maturity Score" 
        value={pillar.control_maturity_score} 
        suffix="%"
        metricName="Control Maturity Score"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Control Maturity Score")}
      />
    </>
  );
}

function HoverablePillar2Metrics({ 
  pillar, 
  hoveredMetric, 
  onHover,
  hasExplanation 
}: { 
  pillar: Country["pillar_2_vigilance"];
  hoveredMetric: string | null;
  onHover: (name: string | null) => void;
  hasExplanation: (name: string) => boolean;
}) {
  if (!pillar) {
    return <NoDataPlaceholder pillarName="Health Vigilance" />;
  }
  
  return (
    <>
      <HoverableMetricRow 
        label="Surveillance Logic" 
        value={pillar.surveillance_logic} 
        type="enum"
        metricName="Surveillance Logic"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Surveillance Logic")}
      />
      <HoverableMetricRow 
        label="Disease Detection Rate" 
        value={pillar.disease_detection_rate} 
        suffix="%"
        metricName="Disease Detection Rate"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Disease Detection Rate")}
      />
      <HoverableMetricRow 
        label="Vulnerability Index" 
        value={pillar.vulnerability_index} 
        suffix="/100"
        highlight={pillar.vulnerability_index !== null && pillar.vulnerability_index !== undefined && pillar.vulnerability_index > 50}
        metricName="Vulnerability Index"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Vulnerability Index")}
      />
      <HoverableMetricRow 
        label="Migrant Worker %" 
        value={pillar.migrant_worker_pct} 
        suffix="%"
        highlight={pillar.migrant_worker_pct !== null && pillar.migrant_worker_pct !== undefined && pillar.migrant_worker_pct > 30}
        metricName="Migrant Worker %"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Migrant Worker %")}
      />
    </>
  );
}

function HoverablePillar3Metrics({ 
  pillar, 
  hoveredMetric, 
  onHover,
  hasExplanation 
}: { 
  pillar: Country["pillar_3_restoration"];
  hoveredMetric: string | null;
  onHover: (name: string | null) => void;
  hasExplanation: (name: string) => boolean;
}) {
  if (!pillar) {
    return <NoDataPlaceholder pillarName="Restoration" />;
  }
  
  return (
    <>
      <HoverableMetricRow 
        label="Payer Mechanism" 
        value={pillar.payer_mechanism} 
        type="enum"
        metricName="Payer Mechanism"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Payer Mechanism")}
      />
      <HoverableMetricRow 
        label="Reintegration Law" 
        value={pillar.reintegration_law} 
        type="boolean"
        metricName="Reintegration Law"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Reintegration Law")}
      />
      <HoverableMetricRow 
        label="Sickness Absence Days" 
        value={pillar.sickness_absence_days} 
        suffix="days/year"
        metricName="Sickness Absence Days"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Sickness Absence Days")}
      />
      <HoverableMetricRow 
        label="Rehab Access Score" 
        value={pillar.rehab_access_score} 
        suffix="/100"
        metricName="Rehab Access Score"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Rehab Access Score")}
      />
      <HoverableMetricRow 
        label="Return-to-Work Success" 
        value={pillar.return_to_work_success_pct} 
        suffix="%"
        highlight={pillar.return_to_work_success_pct !== null && pillar.return_to_work_success_pct !== undefined && pillar.return_to_work_success_pct < 50}
        metricName="Return-to-Work Success"
        hoveredMetric={hoveredMetric}
        onHover={onHover}
        hasExplanation={hasExplanation("Return-to-Work Success")}
      />
    </>
  );
}

// ============================================================================
// SOURCE LINKS COMPONENT
// ============================================================================

function SourceLinks({ cardId, country }: { cardId: string; country: Country }) {
  let sourceUrls: Record<string, string> | null = null;

  switch (cardId) {
    case "governance":
      sourceUrls = country.governance?.source_urls ?? null;
      break;
    case "pillar1":
      sourceUrls = country.pillar_1_hazard?.source_urls ?? null;
      break;
    case "pillar2":
      sourceUrls = country.pillar_2_vigilance?.source_urls ?? null;
      break;
    case "pillar3":
      sourceUrls = country.pillar_3_restoration?.source_urls ?? null;
      break;
  }

  if (!sourceUrls || Object.keys(sourceUrls).length === 0) {
    return (
      <div className="text-slate-500 text-sm">
        <p>No source URLs available for this pillar.</p>
        <p className="mt-2 text-xs">
          Default sources: ILO ILOSTAT, World Bank, WHO Global Health Observatory
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(sourceUrls).map(([label, url]) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <LinkIcon className="w-3 h-3" />
          {label}
        </a>
      ))}
    </div>
  );
}

// ============================================================================
// METRIC ROW COMPONENT (Enhanced for Expanded View)
// ============================================================================

export default InteractivePillarGrid;
