/**
 * Arthur D. Little - Global Health Platform
 * Leader Comparison Card Component
 * 
 * Displays a leader country with side-by-side metric comparison
 * Shows what the leader does better and gap analysis
 */

import { motion } from "framer-motion";
import { Crown, TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { cn, getApiBaseUrl, getCountryFlag } from "../lib/utils";
import type { Country } from "../types/country";
import type { PillarType, PillarMetricComparison, RankedCountry } from "../lib/pillarRankings";
import { PILLAR_CONFIG, comparePillarMetrics, getLeaderAdvantages } from "../lib/pillarRankings";

// ============================================================================
// PROPS
// ============================================================================

interface LeaderComparisonCardProps {
  currentCountry: Country;
  leader: RankedCountry;
  pillar: PillarType;
  currentRank: number | null;
  showFullComparison?: boolean;
  className?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function LeaderComparisonCard({
  currentCountry,
  leader,
  pillar,
  currentRank,
  showFullComparison = false,
  className,
}: LeaderComparisonCardProps) {
  const config = PILLAR_CONFIG[pillar];
  const comparisons = comparePillarMetrics(currentCountry, leader.country, pillar);
  const advantages = getLeaderAdvantages(currentCountry, leader.country, pillar, 5);

  const leaderFlagUrl = leader.flag_url
    ? `${getApiBaseUrl()}${leader.flag_url}`
    : null;

  const currentFlagUrl = currentCountry.flag_url
    ? `${getApiBaseUrl()}${currentCountry.flag_url}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden",
        className
      )}
    >
      {/* Header: Leader vs Current */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {/* Leader */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {leaderFlagUrl ? (
                <img
                  src={leaderFlagUrl}
                  alt={leader.name}
                  className="w-10 h-7 object-cover rounded shadow"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-2xl">{getCountryFlag(leader.iso_code)}</span>
              )}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
                <Crown className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{leader.name}</p>
              <p className="text-xs text-amber-400">#{leader.rank} • {leader.score.toFixed(0)}%</p>
            </div>
          </div>

          {/* VS Indicator */}
          <div className="px-3">
            <span className="text-xs font-bold text-slate-500">VS</span>
          </div>

          {/* Current Country */}
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-white text-right">{currentCountry.name}</p>
              <p className="text-xs text-slate-400 text-right">
                {currentRank ? `#${currentRank}` : "N/A"}
              </p>
            </div>
            {currentFlagUrl ? (
              <img
                src={currentFlagUrl}
                alt={currentCountry.name}
                className="w-10 h-7 object-cover rounded shadow"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-2xl">{getCountryFlag(currentCountry.iso_code)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Key Advantages */}
      {advantages.length > 0 && (
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/30">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
            What {leader.name} Does Better
          </p>
          <div className="space-y-2">
            {advantages.slice(0, 3).map((adv) => (
              <div
                key={adv.metric}
                className="flex items-center justify-between p-2 bg-amber-500/10 rounded-lg border border-amber-500/20"
              >
                <span className="text-sm text-white">{adv.label}</span>
                <span className="text-sm font-semibold text-amber-400">
                  +{adv.gap}% better
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Metric Comparison */}
      {showFullComparison && (
        <div className="p-4">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-3">
            Metric Comparison
          </p>
          <div className="space-y-2">
            {comparisons.map((comparison) => (
              <MetricComparisonRow
                key={comparison.metric}
                comparison={comparison}
                leaderName={leader.name}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// METRIC COMPARISON ROW
// ============================================================================

interface MetricComparisonRowProps {
  comparison: PillarMetricComparison;
  leaderName: string;
}

function MetricComparisonRow({ comparison, leaderName }: MetricComparisonRowProps) {
  const { label, currentValue, leaderValue, gap, lowerIsBetter } = comparison;

  // Determine if current is better, worse, or equal
  let status: "better" | "worse" | "equal" | "na" = "na";
  if (gap !== null) {
    if (gap > 5) status = "worse";
    else if (gap < -5) status = "better";
    else status = "equal";
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-700/30 last:border-0">
      {/* Metric Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{label}</p>
      </div>

      {/* Current Value */}
      <div className="w-24 text-right">
        <span className="text-sm font-mono text-slate-300">
          {formatComparisonValue(currentValue)}
        </span>
      </div>

      {/* Gap Indicator */}
      <div className="w-16 flex justify-center">
        {gap !== null ? (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
              status === "better" && "bg-emerald-500/20 text-emerald-400",
              status === "worse" && "bg-red-500/20 text-red-400",
              status === "equal" && "bg-slate-500/20 text-slate-400"
            )}
          >
            {status === "better" && <TrendingUp className="w-3 h-3" />}
            {status === "worse" && <TrendingDown className="w-3 h-3" />}
            {status === "equal" && <Minus className="w-3 h-3" />}
            {Math.abs(gap)}%
          </div>
        ) : (
          <span className="text-xs text-slate-500">—</span>
        )}
      </div>

      {/* Leader Value */}
      <div className="w-24 text-right">
        <span className="text-sm font-mono text-amber-400">
          {formatComparisonValue(leaderValue)}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// COMPACT LEADER BADGE
// ============================================================================

interface LeaderBadgeProps {
  leader: RankedCountry;
  pillar: PillarType;
  className?: string;
}

export function LeaderBadge({ leader, pillar, className }: LeaderBadgeProps) {
  const config = PILLAR_CONFIG[pillar];
  const flagUrl = leader.flag_url
    ? `${getApiBaseUrl()}${leader.flag_url}`
    : null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full",
        "bg-amber-500/10 border border-amber-500/30",
        className
      )}
    >
      <Crown className="w-3.5 h-3.5 text-amber-400" />
      {flagUrl ? (
        <img
          src={flagUrl}
          alt={leader.name}
          className="w-5 h-3.5 object-cover rounded-sm"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <span className="text-sm">{getCountryFlag(leader.iso_code)}</span>
      )}
      <span className="text-xs font-medium text-amber-400">{leader.name}</span>
      <span className="text-xs text-amber-400/60">{leader.score.toFixed(0)}%</span>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function formatComparisonValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1);
  }
  return String(value);
}

export default LeaderComparisonCard;
