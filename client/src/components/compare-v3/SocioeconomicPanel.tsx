/**
 * Socioeconomic Panel Component
 * 
 * Animated bar charts comparing socioeconomic indicators between countries.
 */

import { motion } from "framer-motion";
import { 
  DollarSign, 
  Users, 
  Heart, 
  Activity,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { cn } from "../../lib/utils";

interface SocioeconomicMetric {
  name: string;
  saudi: string;
  comparison: string;
  insight?: string;
}

interface SocioeconomicPanelProps {
  comparison: {
    summary?: string;
    metrics?: SocioeconomicMetric[];
  } | null;
  comparisonName: string;
}

const metricIcons: Record<string, React.ElementType> = {
  "GDP per Capita": DollarSign,
  "Population": Users,
  "Health Expenditure": Heart,
  "Life Expectancy": Activity,
  "HDI Score": GraduationCap,
  "Labor Force": Briefcase,
};

function getIcon(name: string) {
  for (const [key, icon] of Object.entries(metricIcons)) {
    if (name.toLowerCase().includes(key.toLowerCase())) {
      return icon;
    }
  }
  return Activity;
}

function parseValue(value: string): number {
  // Extract numeric value from formatted string
  const cleaned = value.replace(/[^0-9.]/g, "");
  return parseFloat(cleaned) || 0;
}

function normalizeValues(saudi: number, comparison: number): { saudiPct: number; compPct: number } {
  const max = Math.max(saudi, comparison);
  if (max === 0) return { saudiPct: 50, compPct: 50 };
  return {
    saudiPct: (saudi / max) * 100,
    compPct: (comparison / max) * 100,
  };
}

export function SocioeconomicPanel({
  comparison,
  comparisonName,
}: SocioeconomicPanelProps) {
  if (!comparison?.metrics || comparison.metrics.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
          <DollarSign className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Socioeconomic Comparison</h3>
          <p className="text-xs text-slate-400">Economic and demographic indicators</p>
        </div>
      </div>

      {/* Summary */}
      {comparison.summary && (
        <p className="text-sm text-slate-300 mb-6">{comparison.summary}</p>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs text-slate-400">Saudi Arabia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-xs text-slate-400">{comparisonName}</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {comparison.metrics.slice(0, 6).map((metric, index) => {
          const Icon = getIcon(metric.name);
          const saudiNum = parseValue(metric.saudi);
          const compNum = parseValue(metric.comparison);
          const { saudiPct, compPct } = normalizeValues(saudiNum, compNum);
          
          return (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-slate-900/50 rounded-xl p-4"
            >
              {/* Metric Header */}
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-medium text-white">{metric.name}</span>
              </div>

              {/* Values */}
              <div className="space-y-2">
                {/* Saudi Arabia */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-16 truncate">Saudi</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${saudiPct}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium w-20 text-right truncate">
                    {metric.saudi}
                  </span>
                </div>

                {/* Comparison Country */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-16 truncate">{comparisonName.split(" ")[0]}</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${compPct}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 + 0.1 }}
                      className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full"
                    />
                  </div>
                  <span className="text-xs text-purple-400 font-medium w-20 text-right truncate">
                    {metric.comparison}
                  </span>
                </div>
              </div>

              {/* Insight */}
              {metric.insight && (
                <p className="text-[10px] text-slate-500 mt-2 line-clamp-2">
                  {metric.insight}
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

export default SocioeconomicPanel;
