/**
 * Arthur D. Little - Feature Detail Modal
 * Animated modal displaying detailed information about platform features
 * Clean design without data sources section
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
} from "lucide-react";
import { cn } from "../lib/utils";

export type FeatureType = "framework" | "countries" | "simulator";

interface FeatureDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: FeatureType;
  onAccessPlatform: () => void;
}

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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "fixed inset-4 sm:inset-8 md:inset-12 lg:inset-20 m-auto",
              "max-w-2xl h-fit max-h-[80vh] overflow-auto",
              "bg-slate-900/95 backdrop-blur-xl rounded-2xl border shadow-2xl z-[101]",
              content.borderColor
            )}
          >
            {/* Header */}
            <div className={cn(
              "sticky top-0 z-10 px-5 py-4 border-b border-white/10",
              "bg-gradient-to-r", content.gradient
            )}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center",
                    content.iconBg
                  )}>
                    <Icon className={cn("w-6 h-6", content.iconColor)} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">{content.title}</h2>
                    <p className="text-xs text-white/50">{content.subtitle}</p>
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
            <div className="p-5 space-y-5">
              {/* Description */}
              <p className="text-sm text-white/70 leading-relaxed">
                {content.description}
              </p>

              {/* Feature-specific content */}
              {feature === "framework" && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {content.pillars.map((pillar) => {
                    const PillarIcon = pillar.icon;
                    return (
                      <motion.div
                        key={pillar.name}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 text-center"
                      >
                        <PillarIcon className={cn("w-5 h-5 mx-auto mb-1.5", pillar.color)} />
                        <p className="text-xs font-medium text-white">{pillar.name}</p>
                        <p className="text-[9px] text-white/40 mt-0.5">{pillar.desc}</p>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {feature === "countries" && (
                <div className="grid grid-cols-3 gap-2">
                  {content.stats.map((stat) => {
                    const StatIcon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 text-center"
                      >
                        <StatIcon className="w-4 h-4 text-cyan-400 mx-auto mb-1" />
                        <p className="text-lg font-bold text-white">{stat.value}</p>
                        <p className="text-[9px] text-white/40">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {feature === "simulator" && (
                <div className="grid grid-cols-3 gap-2">
                  {content.capabilities.map((cap) => {
                    const CapIcon = cap.icon;
                    return (
                      <div
                        key={cap.name}
                        className="bg-white/5 rounded-lg p-3 border border-white/10 text-center"
                      >
                        <CapIcon className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs font-medium text-white">{cap.name}</p>
                        <p className="text-[9px] text-white/40 mt-0.5">{cap.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Features List */}
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <h3 className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-adl-accent" />
                  Key Capabilities
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {content.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-white/60">
                      <div className="w-1 h-1 rounded-full bg-adl-accent flex-shrink-0" />
                      {feat}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="sticky bottom-0 px-5 py-3 bg-slate-900/90 border-t border-white/10">
              <motion.button
                onClick={onAccessPlatform}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                  "w-full py-2.5 rounded-lg font-semibold text-white text-sm",
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
