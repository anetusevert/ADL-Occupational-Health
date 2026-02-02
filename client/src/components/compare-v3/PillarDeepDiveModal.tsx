/**
 * Pillar Deep Dive Modal Component
 * 
 * Full modal showing detailed pillar comparison with metrics.
 */

import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Crown, 
  Shield, 
  Eye, 
  Heart,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "../../lib/utils";

interface PillarMetric {
  name: string;
  saudi: string;
  comparison: string;
  gap?: string;
}

interface PillarData {
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
  key_metrics?: PillarMetric[];
}

interface PillarDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillar: PillarData | null;
  comparisonName: string;
}

const pillarConfig: Record<string, {
  icon: React.ElementType;
  color: string;
  chartColor: string;
}> = {
  Governance: { icon: Crown, color: "purple", chartColor: "#a855f7" },
  "Hazard Control": { icon: Shield, color: "red", chartColor: "#ef4444" },
  "Health Vigilance": { icon: Eye, color: "cyan", chartColor: "#06b6d4" },
  Vigilance: { icon: Eye, color: "cyan", chartColor: "#06b6d4" },
  Restoration: { icon: Heart, color: "emerald", chartColor: "#10b981" },
};

function getPillarConfig(pillarName: string) {
  for (const [key, config] of Object.entries(pillarConfig)) {
    if (pillarName.toLowerCase().includes(key.toLowerCase())) {
      return config;
    }
  }
  return pillarConfig.Governance;
}

export function PillarDeepDiveModal({
  isOpen,
  onClose,
  pillar,
  comparisonName,
}: PillarDeepDiveModalProps) {
  if (!pillar) return null;

  const config = getPillarConfig(pillar.pillar);
  const Icon = config.icon;
  const gap = pillar.comparison_score - pillar.saudi_score;
  const isAhead = gap < 0;

  // Prepare chart data
  const chartData = [
    { name: "Saudi Arabia", score: pillar.saudi_score, fill: "#10b981" },
    { name: comparisonName, score: pillar.comparison_score, fill: config.chartColor },
  ];

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
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 z-[101] bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className={cn(
              "flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-700",
              `bg-${config.color}-500/10`
            )}>
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  `bg-${config.color}-500/20 border border-${config.color}-500/30`
                )}>
                  <Icon className={cn("w-6 h-6", `text-${config.color}-400`)} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{pillar.pillar}</h2>
                  <p className="text-sm text-slate-400">Deep Dive Analysis</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Score Comparison Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart */}
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Score Comparison</h3>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" domain={[0, 100]} stroke="#64748b" />
                        <YAxis type="category" dataKey="name" stroke="#64748b" width={100} />
                        <Tooltip
                          contentStyle={{ 
                            backgroundColor: "#1e293b", 
                            border: "1px solid #334155",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Gap Summary */}
                  <div className={cn(
                    "mt-4 flex items-center justify-center gap-2 py-2 rounded-lg",
                    isAhead ? "bg-emerald-500/20" : "bg-amber-500/20"
                  )}>
                    {isAhead ? (
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-amber-400" />
                    )}
                    <span className={cn(
                      "text-sm font-medium",
                      isAhead ? "text-emerald-400" : "text-amber-400"
                    )}>
                      Saudi Arabia is {isAhead ? "ahead" : "behind"} by {Math.abs(gap).toFixed(0)} points
                    </span>
                  </div>
                </div>

                {/* Assessments */}
                <div className="space-y-4">
                  {/* Saudi Assessment */}
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <span className="text-sm font-medium text-emerald-400">Saudi Arabia</span>
                    </div>
                    <p className="text-sm text-slate-300">{pillar.saudi_assessment}</p>
                  </div>

                  {/* Comparison Assessment */}
                  <div className={cn(
                    "border rounded-xl p-4",
                    `bg-${config.color}-500/10 border-${config.color}-500/20`
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn("w-3 h-3 rounded-full", `bg-${config.color}-500`)} />
                      <span className={cn("text-sm font-medium", `text-${config.color}-400`)}>
                        {comparisonName}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300">{pillar.comparison_assessment}</p>
                  </div>
                </div>
              </div>

              {/* Key Metrics */}
              {pillar.key_metrics && pillar.key_metrics.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-4">Key Metrics</h3>
                  <div className="space-y-3">
                    {pillar.key_metrics.map((metric, index) => (
                      <motion.div
                        key={metric.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
                      >
                        <span className="text-sm text-white">{metric.name}</span>
                        <div className="flex items-center gap-6">
                          <span className="text-sm text-emerald-400">{metric.saudi}</span>
                          <ArrowRight className="w-4 h-4 text-slate-500" />
                          <span className={cn("text-sm", `text-${config.color}-400`)}>
                            {metric.comparison}
                          </span>
                          {metric.gap && (
                            <span className="text-xs text-slate-500">{metric.gap}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Differences */}
              {pillar.key_differences && pillar.key_differences.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Key Differences
                  </h3>
                  <ul className="space-y-2">
                    {pillar.key_differences.map((diff, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-amber-400 mt-1">•</span>
                        {diff}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Priority Actions */}
              {pillar.priority_actions && pillar.priority_actions.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-6">
                  <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Priority Actions for Saudi Arabia
                  </h3>
                  <ul className="space-y-2">
                    {pillar.priority_actions.map((action, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                        <span className="text-emerald-400 mt-1">{index + 1}.</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default PillarDeepDiveModal;
