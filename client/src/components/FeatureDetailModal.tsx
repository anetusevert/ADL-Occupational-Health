/**
 * Arthur D. Little - Feature Detail Modal
 * Animated modal displaying detailed information about platform features
 * Used on the landing page for tile interactions
 */

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Shield,
  Eye,
  Heart,
  Globe2,
  MapPin,
  BarChart3,
  TrendingUp,
  Zap,
  Target,
  LineChart,
  ArrowRight,
  CheckCircle2,
  Database,
} from "lucide-react";
import { cn } from "../lib/utils";

export type FeatureType = "framework" | "countries" | "simulator";

interface FeatureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: FeatureType;
  onAccessPlatform: () => void;
}

// Data source configurations with colors
const DATA_SOURCES = {
  worldBank: { name: "World Bank", shortName: "WB", color: "text-amber-400", bg: "bg-amber-500/10" },
  ilo: { name: "International Labour Organization", shortName: "ILO", color: "text-blue-400", bg: "bg-blue-500/10" },
  who: { name: "World Health Organization", shortName: "WHO", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  oecd: { name: "OECD", shortName: "OECD", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  undp: { name: "UN Development Programme", shortName: "UNDP", color: "text-sky-400", bg: "bg-sky-500/10" },
};

// Feature content configurations
const FEATURE_CONTENT = {
  framework: {
    title: "Framework Analysis",
    subtitle: "ADL Occupational Health Intelligence Framework",
    icon: Crown,
    color: "purple",
    gradient: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/30",
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-400",
    description: "Our proprietary framework evaluates national occupational health systems through four interconnected pillars, providing a comprehensive 360° assessment of workplace safety maturity.",
    pillars: [
      { icon: Crown, name: "Governance", desc: "Regulatory & institutional capacity", color: "text-purple-400" },
      { icon: Shield, name: "Prevention", desc: "Hazard control & risk management", color: "text-blue-400" },
      { icon: Eye, name: "Vigilance", desc: "Surveillance & early detection", color: "text-emerald-400" },
      { icon: Heart, name: "Restoration", desc: "Compensation & rehabilitation", color: "text-amber-400" },
    ],
    features: [
      "Weighted scoring across 50+ indicators",
      "ADL OHI Score: 1.0-4.0 maturity scale",
      "Benchmarking against global leaders",
      "Gap analysis and recommendations",
    ],
    sources: ["ilo", "who", "worldBank", "oecd"],
  },
  countries: {
    title: "Country Profiles",
    subtitle: "Comprehensive Intelligence for 196 Nations",
    icon: Globe2,
    color: "cyan",
    gradient: "from-cyan-500/20 to-cyan-600/5",
    borderColor: "border-cyan-500/30",
    iconBg: "bg-cyan-500/20",
    iconColor: "text-cyan-400",
    description: "Deep-dive into any nation's occupational health landscape with rich data profiles covering economic context, health outcomes, regulatory environment, and workforce demographics.",
    stats: [
      { value: "196", label: "Countries Covered", icon: MapPin },
      { value: "50+", label: "Key Metrics", icon: BarChart3 },
      { value: "Real-time", label: "Data Updates", icon: Zap },
    ],
    features: [
      "GDP, population & labor force data",
      "Life expectancy & health indicators",
      "ILO convention ratification status",
      "Regional and income-level comparisons",
      "Historical trend analysis",
    ],
    sources: ["worldBank", "ilo", "who", "undp"],
  },
  simulator: {
    title: "Policy Simulation",
    subtitle: "Model Interventions & Forecast Impact",
    icon: TrendingUp,
    color: "emerald",
    gradient: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30",
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    description: "An interactive policy laboratory that lets you model intervention scenarios and see projected outcomes on health metrics, economic costs, and workforce productivity.",
    capabilities: [
      { icon: Target, name: "Scenario Modeling", desc: "Test policy changes" },
      { icon: LineChart, name: "Impact Forecasting", desc: "Project outcomes over time" },
      { icon: Zap, name: "Real-time Analysis", desc: "Instant feedback on decisions" },
    ],
    features: [
      "What-if scenario testing",
      "Budget allocation optimization",
      "ROI projections for interventions",
      "Comparative policy analysis",
      "Export simulation reports",
    ],
    sources: ["ilo", "who", "worldBank"],
  },
};

export function FeatureDetailModal({
  isOpen,
  onClose,
  feature,
  onAccessPlatform,
}: FeatureDetailModalProps) {
  const content = FEATURE_CONTENT[feature];
  const Icon = content.icon;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

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
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed inset-4 sm:inset-8 md:inset-12 lg:inset-16 xl:inset-24 m-auto",
              "max-w-3xl h-fit max-h-[85vh] overflow-auto",
              "bg-slate-900/95 backdrop-blur-xl rounded-2xl border shadow-2xl z-[101]",
              content.borderColor
            )}
          >
            {/* Header */}
            <div className={cn(
              "sticky top-0 z-10 px-6 py-5 border-b border-white/10",
              "bg-gradient-to-r", content.gradient
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    content.iconBg
                  )}>
                    <Icon className={cn("w-7 h-7", content.iconColor)} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{content.title}</h2>
                    <p className="text-sm text-white/50 mt-0.5">{content.subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-white/50 hover:text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <p className="text-white/70 leading-relaxed">
                {content.description}
              </p>

              {/* Feature-specific content */}
              {feature === "framework" && (
                <>
                  {/* Pillars Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {content.pillars.map((pillar) => {
                      const PillarIcon = pillar.icon;
                      return (
                        <motion.div
                          key={pillar.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
                        >
                          <PillarIcon className={cn("w-6 h-6 mx-auto mb-2", pillar.color)} />
                          <p className="text-sm font-medium text-white">{pillar.name}</p>
                          <p className="text-[10px] text-white/40 mt-1">{pillar.desc}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}

              {feature === "countries" && (
                <>
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {content.stats.map((stat) => {
                      const StatIcon = stat.icon;
                      return (
                        <div
                          key={stat.label}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
                        >
                          <StatIcon className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
                          <p className="text-xl font-bold text-white">{stat.value}</p>
                          <p className="text-[10px] text-white/40">{stat.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {feature === "simulator" && (
                <>
                  {/* Capabilities */}
                  <div className="grid grid-cols-3 gap-3">
                    {content.capabilities.map((cap) => {
                      const CapIcon = cap.icon;
                      return (
                        <div
                          key={cap.name}
                          className="bg-white/5 rounded-xl p-4 border border-white/10 text-center"
                        >
                          <CapIcon className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                          <p className="text-sm font-medium text-white">{cap.name}</p>
                          <p className="text-[10px] text-white/40 mt-1">{cap.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Features List */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-adl-accent" />
                  Key Capabilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {content.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/60">
                      <div className="w-1.5 h-1.5 rounded-full bg-adl-accent flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Sources */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Database className="w-4 h-4 text-white/50" />
                  Powered By
                </h3>
                <div className="flex flex-wrap gap-2">
                  {content.sources.map((sourceKey) => {
                    const source = DATA_SOURCES[sourceKey as keyof typeof DATA_SOURCES];
                    return (
                      <div
                        key={sourceKey}
                        className={cn(
                          "px-3 py-1.5 rounded-lg border border-white/10",
                          source.bg
                        )}
                      >
                        <span className={cn("text-xs font-medium", source.color)}>
                          {source.shortName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="sticky bottom-0 px-6 py-4 bg-slate-900/90 border-t border-white/10">
              <motion.button
                onClick={onAccessPlatform}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "w-full py-3 rounded-xl font-semibold text-white",
                  "bg-adl-accent hover:bg-adl-blue-light",
                  "transition-all duration-200",
                  "shadow-lg shadow-adl-accent/30",
                  "flex items-center justify-center gap-2"
                )}
              >
                Explore {content.title}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default FeatureDetailModal;
