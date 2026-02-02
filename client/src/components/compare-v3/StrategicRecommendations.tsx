/**
 * Strategic Recommendations Component
 * 
 * Displays prioritized AI-generated recommendations with animations.
 */

import { motion } from "framer-motion";
import { 
  Target, 
  Zap, 
  Clock, 
  TrendingUp,
  ChevronRight,
  Star,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface Recommendation {
  priority: number;
  title: string;
  recommendation: string;
  rationale?: string;
  expected_impact?: string;
  complexity?: string;
  timeline?: string;
  quick_win?: boolean;
}

interface StrategicRecommendationsProps {
  recommendations: Recommendation[];
  onRecommendationClick?: (rec: Recommendation) => void;
}

const complexityColors: Record<string, { bg: string; text: string; border: string }> = {
  low: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30" },
  medium: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/30" },
  high: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30" },
};

const timelineColors: Record<string, { bg: string; text: string }> = {
  "Short-term": { bg: "bg-cyan-500/20", text: "text-cyan-400" },
  "Medium-term": { bg: "bg-purple-500/20", text: "text-purple-400" },
  "Long-term": { bg: "bg-slate-500/20", text: "text-slate-400" },
};

export function StrategicRecommendations({
  recommendations,
  onRecommendationClick,
}: StrategicRecommendationsProps) {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
          <Target className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Strategic Recommendations</h3>
          <p className="text-xs text-slate-400">Prioritized actions for Saudi Arabia</p>
        </div>
      </div>

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.slice(0, 5).map((rec, index) => {
          const complexity = complexityColors[rec.complexity?.toLowerCase() || "medium"];
          const timeline = rec.timeline 
            ? timelineColors[rec.timeline] || timelineColors["Medium-term"]
            : timelineColors["Medium-term"];
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
              onClick={() => onRecommendationClick?.(rec)}
              className={cn(
                "relative bg-slate-900/50 rounded-xl p-4 border border-slate-700/50",
                "hover:border-slate-600 transition-all cursor-pointer group"
              )}
            >
              {/* Priority Badge */}
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center",
                  rec.priority === 1 ? "bg-amber-500/20 border border-amber-500/30" :
                  rec.priority === 2 ? "bg-purple-500/20 border border-purple-500/30" :
                  "bg-slate-700/50 border border-slate-600/50"
                )}>
                  <span className={cn(
                    "text-lg font-bold",
                    rec.priority === 1 ? "text-amber-400" :
                    rec.priority === 2 ? "text-purple-400" :
                    "text-slate-400"
                  )}>
                    {rec.priority}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-white font-medium truncate">
                      {rec.title || rec.recommendation?.split('.')[0]}
                    </h4>
                    {rec.quick_win && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                        <Zap className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-medium text-emerald-400">Quick Win</span>
                      </span>
                    )}
                  </div>

                  {/* Recommendation Text */}
                  <p className="text-sm text-slate-300 mb-3 line-clamp-2">
                    {rec.recommendation}
                  </p>

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap items-center gap-2">
                    {rec.complexity && (
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-medium border",
                        complexity.bg, complexity.text, complexity.border
                      )}>
                        {rec.complexity} complexity
                      </span>
                    )}
                    {rec.timeline && (
                      <span className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium",
                        timeline.bg, timeline.text
                      )}>
                        <Clock className="w-3 h-3" />
                        {rec.timeline}
                      </span>
                    )}
                    {rec.expected_impact && (
                      <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-700/50 text-[10px] text-slate-300">
                        <TrendingUp className="w-3 h-3" />
                        {rec.expected_impact.substring(0, 40)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default StrategicRecommendations;
