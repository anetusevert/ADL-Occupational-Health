/**
 * Framework Comparison Grid Component
 * 
 * 4 pillar tiles showing animated comparison charts.
 */

import { motion } from "framer-motion";
import { 
  Crown, 
  Shield, 
  Eye, 
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface PillarAnalysis {
  pillar: string;
  pillar_id?: string;
  saudi_score: number;
  comparison_score: number;
  gap_percentage?: number;
  headline?: string;
  saudi_assessment?: string;
  comparison_assessment?: string;
  key_differences?: string[];
  priority_actions?: string[];
  key_metrics?: Array<{
    name: string;
    saudi: string;
    comparison: string;
    gap?: string;
  }>;
}

interface FrameworkComparisonGridProps {
  analysis: PillarAnalysis[];
  comparisonName: string;
  onPillarClick: (pillar: PillarAnalysis) => void;
}

const pillarConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  barColor: string;
}> = {
  Governance: {
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    barColor: "from-purple-600 to-purple-400",
  },
  "Hazard Control": {
    icon: Shield,
    color: "text-red-400",
    bgColor: "bg-red-500/20",
    borderColor: "border-red-500/30",
    barColor: "from-red-600 to-red-400",
  },
  "Health Vigilance": {
    icon: Eye,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    barColor: "from-cyan-600 to-cyan-400",
  },
  Vigilance: {
    icon: Eye,
    color: "text-cyan-400",
    bgColor: "bg-cyan-500/20",
    borderColor: "border-cyan-500/30",
    barColor: "from-cyan-600 to-cyan-400",
  },
  Restoration: {
    icon: Heart,
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    barColor: "from-emerald-600 to-emerald-400",
  },
};

function getPillarConfig(pillarName: string) {
  for (const [key, config] of Object.entries(pillarConfig)) {
    if (pillarName.toLowerCase().includes(key.toLowerCase())) {
      return config;
    }
  }
  return pillarConfig.Governance;
}

export function FrameworkComparisonGrid({
  analysis,
  comparisonName,
  onPillarClick,
}: FrameworkComparisonGridProps) {
  if (!analysis || analysis.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Framework Comparison</h3>
        <p className="text-xs text-slate-400">Click any pillar for deep dive</p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {analysis.map((pillar, index) => {
          const config = getPillarConfig(pillar.pillar);
          const Icon = config.icon;
          const gap = pillar.comparison_score - pillar.saudi_score;
          const isAhead = gap < 0;
          const gapAbs = Math.abs(gap);
          
          return (
            <motion.div
              key={pillar.pillar}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => onPillarClick(pillar)}
              className={cn(
                "relative bg-slate-800/50 backdrop-blur-md rounded-2xl p-5 cursor-pointer group",
                "border transition-all hover:shadow-lg",
                config.borderColor,
                `hover:shadow-${config.color.replace("text-", "")}/20`
              )}
            >
              {/* Background Glow */}
              <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity",
                config.bgColor
              )} />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    config.bgColor
                  )}>
                    <Icon className={cn("w-5 h-5", config.color)} />
                  </div>
                  
                  {/* Gap Indicator */}
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium",
                    isAhead 
                      ? "bg-emerald-500/20 text-emerald-400" 
                      : gapAbs > 20
                        ? "bg-red-500/20 text-red-400"
                        : "bg-amber-500/20 text-amber-400"
                  )}>
                    {isAhead ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : gapAbs > 0 ? (
                      <TrendingDown className="w-3 h-3" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                    {isAhead ? "+" : "-"}{gapAbs.toFixed(0)}
                  </div>
                </div>

                {/* Pillar Name */}
                <h4 className="text-white font-semibold mb-3">{pillar.pillar}</h4>

                {/* Score Comparison */}
                <div className="space-y-2">
                  {/* Saudi Arabia */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-12">Saudi</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pillar.saudi_score}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs text-emerald-400 font-bold w-8 text-right">
                      {pillar.saudi_score.toFixed(0)}
                    </span>
                  </div>

                  {/* Comparison */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 w-12 truncate">
                      {comparisonName.split(" ")[0]}
                    </span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pillar.comparison_score}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 + 0.1 }}
                        className={cn("h-full rounded-full bg-gradient-to-r", config.barColor)}
                      />
                    </div>
                    <span className={cn("text-xs font-bold w-8 text-right", config.color)}>
                      {pillar.comparison_score.toFixed(0)}
                    </span>
                  </div>
                </div>

                {/* Headline */}
                {pillar.headline && (
                  <p className="text-[10px] text-slate-400 mt-3 line-clamp-2">
                    {pillar.headline}
                  </p>
                )}

                {/* Click Indicator */}
                <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ChevronRight className={cn("w-4 h-4", config.color)} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default FrameworkComparisonGrid;
