/**
 * Arthur D. Little - Global Health Platform
 * Strategic Insight Component
 * 
 * Displays pattern-based insights with visual indicators
 */

import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Lightbulb, AlertTriangle, TrendingUp, Target } from "lucide-react";

interface StrategicInsightProps {
  insight: string;
  type?: "info" | "warning" | "opportunity" | "strength";
  className?: string;
  delay?: number;
}

const TYPE_CONFIG = {
  info: {
    icon: Lightbulb,
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    iconColor: "text-blue-400",
    label: "Strategic Insight",
  },
  warning: {
    icon: AlertTriangle,
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    iconColor: "text-amber-400",
    label: "Attention Required",
  },
  opportunity: {
    icon: TrendingUp,
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    iconColor: "text-purple-400",
    label: "Opportunity",
  },
  strength: {
    icon: Target,
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    label: "Strength",
  },
};

export function StrategicInsight({ 
  insight, 
  type = "info", 
  className,
  delay = 0 
}: StrategicInsightProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border",
        config.bgColor,
        config.borderColor,
        className
      )}
    >
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
        config.bgColor
      )}>
        <Icon className={cn("w-4 h-4", config.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-xs font-semibold mb-1", config.iconColor)}>
          {config.label}
        </p>
        <p className="text-sm text-white/70 leading-relaxed">
          {insight}
        </p>
      </div>
    </motion.div>
  );
}

/**
 * Compact inline insight for smaller spaces
 */
interface InlineInsightProps {
  insight: string;
  className?: string;
}

export function InlineInsight({ insight, className }: InlineInsightProps) {
  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50",
      className
    )}>
      <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
      <p className="text-xs text-white/60 italic">
        {insight}
      </p>
    </div>
  );
}

export default StrategicInsight;
