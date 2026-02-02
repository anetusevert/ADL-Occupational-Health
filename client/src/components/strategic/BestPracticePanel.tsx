/**
 * Arthur D. Little - Global Health Platform
 * Best Practice Panel Component
 * 
 * Displays best practice leaders for a strategic question.
 * Shows what leaders do, how they do it, and key lessons.
 */

import { motion } from "framer-motion";
import { 
  Trophy,
  Lightbulb,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { CountryFlag } from "../CountryFlag";
import type { BestPracticeLeader } from "./StrategicQuestionCard";

// ============================================================================
// TYPES
// ============================================================================

interface BestPracticePanelProps {
  leaders: BestPracticeLeader[];
  pillarColor: string;
  pillarBgColor: string;
  pillarBorderColor: string;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface LeaderCardProps {
  leader: BestPracticeLeader;
  rank: number;
  pillarColor: string;
  pillarBgColor: string;
}

function LeaderCard({ leader, rank, pillarColor, pillarBgColor }: LeaderCardProps) {
  const rankColors = {
    1: "text-amber-400 bg-amber-500/20 border-amber-500/30",
    2: "text-slate-300 bg-slate-500/20 border-slate-500/30",
    3: "text-amber-600 bg-amber-700/20 border-amber-700/30",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: rank * 0.1 }}
      className="bg-slate-800/50 rounded-xl border border-slate-700 p-4"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Rank Badge */}
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          "text-sm font-bold border",
          rankColors[rank as keyof typeof rankColors] || "text-white/60 bg-white/5 border-white/10"
        )}>
          #{rank}
        </div>

        {/* Country Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CountryFlag 
              isoCode={leader.country_iso} 
              flagUrl={leader.flag_url} 
              size="sm" 
            />
            <span className="text-sm font-semibold text-white truncate">
              {leader.country_name}
            </span>
          </div>
          <div className={cn(
            "text-lg font-bold",
            leader.score >= 80 ? "text-emerald-400" :
            leader.score >= 60 ? "text-cyan-400" : "text-amber-400"
          )}>
            {leader.score.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* What They Do */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Trophy className={cn("w-3.5 h-3.5", pillarColor)} />
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            What They Do
          </span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          {leader.what_they_do}
        </p>
      </div>

      {/* How They Do It */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">
            How They Do It
          </span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          {leader.how_they_do_it}
        </p>
      </div>

      {/* Key Lesson */}
      <div className={cn(
        "p-2.5 rounded-lg border",
        pillarBgColor,
        "border-white/10"
      )}>
        <div className="flex items-center gap-1.5 mb-1">
          <Lightbulb className={cn("w-3.5 h-3.5", pillarColor)} />
          <span className={cn("text-[10px] font-medium uppercase tracking-wider", pillarColor)}>
            Key Lesson
          </span>
        </div>
        <p className="text-xs text-white/80 leading-relaxed font-medium">
          {leader.key_lesson}
        </p>
      </div>

      {/* Sources */}
      {leader.sources && leader.sources.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/5">
          <div className="flex flex-wrap gap-1">
            {leader.sources.map((source, i) => (
              <span 
                key={i}
                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-white/5 text-white/40"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BestPracticePanel({
  leaders,
  pillarColor,
  pillarBgColor,
  pillarBorderColor,
}: BestPracticePanelProps) {
  if (!leaders || leaders.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="w-8 h-8 text-white/20 mx-auto mb-2" />
        <p className="text-sm text-white/40">
          Best practice data not available
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center",
          pillarBgColor,
          "border",
          pillarBorderColor
        )}>
          <Trophy className={cn("w-4 h-4", pillarColor)} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Best Practice Leaders</h3>
          <p className="text-[10px] text-white/50">
            Top {leaders.length} performing countries in this area
          </p>
        </div>
      </div>

      {/* Leader Cards */}
      <div className="space-y-3">
        {leaders.map((leader, index) => (
          <LeaderCard
            key={leader.country_iso}
            leader={leader}
            rank={index + 1}
            pillarColor={pillarColor}
            pillarBgColor={pillarBgColor}
          />
        ))}
      </div>
    </div>
  );
}

export default BestPracticePanel;
