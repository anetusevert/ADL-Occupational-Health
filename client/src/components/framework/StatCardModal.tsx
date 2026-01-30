/**
 * GOHIP Platform - Stat Card Modal Component
 * Modal for displaying detailed information about framework statistics
 * 
 * Displays content for: Components, Metrics, Best Practices, Maturity Levels
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Crown,
  Shield,
  Eye,
  Heart,
  Layers,
  Target,
  Award,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { statCardContent, type StatCardContent } from "../../data/frameworkContent";
import { cn } from "../../lib/utils";

type StatCardType = "components" | "metrics" | "bestPractices" | "maturityLevels";

interface StatCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  cardType: StatCardType | null;
}

// Icon mapping for components
const iconMap: Record<string, React.ElementType> = {
  Crown,
  Shield,
  Eye,
  Heart,
};

// Color mapping
const colorMap: Record<string, {
  bg: string;
  border: string;
  text: string;
  glow: string;
}> = {
  purple: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-400",
    glow: "shadow-blue-500/20",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
    glow: "shadow-emerald-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    glow: "shadow-amber-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    glow: "shadow-red-500/20",
  },
  orange: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    glow: "shadow-orange-500/20",
  },
  yellow: {
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/30",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
  },
};

// Modal header icon and color based on card type
const cardTypeConfig: Record<StatCardType, {
  icon: React.ElementType;
  color: string;
  gradient: string;
}> = {
  components: {
    icon: Layers,
    color: "cyan",
    gradient: "from-cyan-500/30 to-cyan-600/10",
  },
  metrics: {
    icon: Target,
    color: "emerald",
    gradient: "from-emerald-500/30 to-emerald-600/10",
  },
  bestPractices: {
    icon: Award,
    color: "amber",
    gradient: "from-amber-500/30 to-amber-600/10",
  },
  maturityLevels: {
    icon: TrendingUp,
    color: "purple",
    gradient: "from-purple-500/30 to-purple-600/10",
  },
};

/**
 * Component Card - For displaying framework components
 */
function ComponentCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const Icon = item.icon ? iconMap[item.icon] : Layers;
  const colors = item.color ? colorMap[item.color] : colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.4 }}
      className={cn(
        "p-5 rounded-xl border backdrop-blur-sm transition-all duration-300",
        colors.bg,
        colors.border,
        "hover:shadow-lg",
        colors.glow
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          colors.bg,
          colors.border,
          "border"
        )}>
          <Icon className={cn("w-6 h-6", colors.text)} />
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-white mb-2">{item.name}</h4>
          <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Metric Card - For displaying assessment metrics
 */
function MetricCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const colors = item.color ? colorMap[item.color] : colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.05 + index * 0.03, duration: 0.3 }}
      className={cn(
        "p-3 rounded-lg border backdrop-blur-sm",
        "bg-slate-800/50 border-slate-700/50",
        "hover:bg-slate-700/50 transition-colors"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-2 h-8 rounded-full",
            colors.bg.replace("/10", "/50")
          )} />
          <div>
            <h5 className="text-sm font-medium text-white">{item.name}</h5>
            <p className="text-xs text-slate-400">{item.description}</p>
          </div>
        </div>
        {item.value && (
          <span className={cn(
            "text-xs font-mono px-2 py-1 rounded",
            colors.bg,
            colors.text
          )}>
            {item.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Best Practice Card - For displaying country examples
 */
function BestPracticeCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const colors = item.color ? colorMap[item.color] : colorMap.cyan;
  const [country, practice] = item.name.split(" - ");

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
      className={cn(
        "p-4 rounded-xl border backdrop-blur-sm",
        colors.bg,
        colors.border
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          "bg-slate-800/50"
        )}>
          <Award className={cn("w-5 h-5", colors.text)} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-sm font-semibold", colors.text)}>{country}</span>
            <ChevronRight className="w-3 h-3 text-slate-500" />
            <span className="text-xs text-slate-400">{practice}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Maturity Level Card - For displaying maturity stages
 */
function MaturityCard({ item, index }: { item: StatCardContent["items"][0]; index: number }) {
  const colors = item.color ? colorMap[item.color] : colorMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.1 + index * 0.1, duration: 0.4, type: "spring" }}
      className={cn(
        "p-5 rounded-xl border backdrop-blur-sm relative overflow-hidden",
        colors.bg,
        colors.border
      )}
    >
      {/* Level Indicator Bar */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
        className={cn(
          "absolute top-0 left-0 right-0 h-1 origin-left",
          colors.bg.replace("/10", "/50")
        )}
      />

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={cn("text-lg font-bold", colors.text)}>{item.name}</span>
            {item.value && (
              <span className={cn(
                "text-xs font-mono px-2 py-0.5 rounded",
                "bg-slate-800/50 text-slate-300"
              )}>
                Score: {item.value}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{item.description}</p>
        </div>
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
          colors.bg,
          colors.border,
          "border"
        )}>
          <TrendingUp className={cn("w-6 h-6", colors.text)} />
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Stat Card Modal Component
 */
export function StatCardModal({ isOpen, onClose, cardType }: StatCardModalProps) {
  if (!cardType) return null;

  const content = statCardContent[cardType];
  const config = cardTypeConfig[cardType];
  const Icon = config.icon;

  const renderContent = () => {
    switch (cardType) {
      case "components":
        return (
          <div className="space-y-4">
            {content.items.map((item, index) => (
              <ComponentCard key={item.name} item={item} index={index} />
            ))}
          </div>
        );
      case "metrics":
        return (
          <div className="grid grid-cols-1 gap-2">
            {content.items.map((item, index) => (
              <MetricCard key={item.name} item={item} index={index} />
            ))}
          </div>
        );
      case "bestPractices":
        return (
          <div className="space-y-3">
            {content.items.map((item, index) => (
              <BestPracticeCard key={item.name} item={item} index={index} />
            ))}
          </div>
        );
      case "maturityLevels":
        return (
          <div className="space-y-4">
            {content.items.map((item, index) => (
              <MaturityCard key={item.name} item={item} index={index} />
            ))}
          </div>
        );
      default:
        return null;
    }
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
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[700px] md:max-h-[85vh] bg-slate-900/95 border border-slate-700/50 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col backdrop-blur-xl"
          >
            {/* Header */}
            <div className={cn(
              "relative px-6 py-5 border-b border-slate-700/50 flex-shrink-0",
              `bg-gradient-to-r ${config.gradient}`
            )}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center",
                    colorMap[config.color].bg,
                    colorMap[config.color].border,
                    "border"
                  )}
                >
                  <Icon className={cn("w-7 h-7", colorMap[config.color].text)} />
                </motion.div>
                <div>
                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.3 }}
                    className="text-xl font-bold text-white"
                  >
                    {content.title}
                  </motion.h2>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                    className={cn("text-sm", colorMap[config.color].text)}
                  >
                    {content.subtitle}
                  </motion.p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.3 }}
                className="text-slate-300 text-sm leading-relaxed mb-6"
              >
                {content.description}
              </motion.p>

              {/* Dynamic Content */}
              {renderContent()}
            </div>

            {/* Bottom Glow */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className={cn(
                "absolute bottom-0 left-0 right-0 h-32 pointer-events-none",
                `bg-gradient-to-t from-${config.color}-500/5 to-transparent`
              )}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default StatCardModal;
