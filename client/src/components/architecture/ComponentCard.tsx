/**
 * Arthur D. Little - Global Health Platform
 * Component Card
 * 
 * Individual component display within architecture map.
 * Shows status, score, and top 3 leaders for that component.
 */

import { motion } from "framer-motion";
import { Crown, TrendingUp, TrendingDown, Minus, Info, ChevronRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { CountryFlag } from "../CountryFlag";
import type { ArchitectureComponent } from "../../lib/architectureDefinitions";
import type { ComponentScore, CountryComponentScore } from "../../lib/architectureRankings";
import { getStatusColor, getStatusBgColor, getStatusBorderColor } from "../../lib/architectureRankings";

interface ComponentCardProps {
  component: ArchitectureComponent;
  score: ComponentScore;
  leaders: CountryComponentScore[];
  currentCountryIso: string;
  onViewDetails?: () => void;
  pillarColor: string;
}

export function ComponentCard({
  component,
  score,
  leaders,
  currentCountryIso,
  onViewDetails,
  pillarColor,
}: ComponentCardProps) {
  // Check if current country is a leader
  const currentCountryRank = leaders.findIndex(l => l.iso_code === currentCountryIso);
  const isLeader = currentCountryRank >= 0;
  
  // Get status icon
  const StatusIcon = score.status === "complete" 
    ? TrendingUp 
    : score.status === "partial" 
      ? Minus 
      : TrendingDown;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative rounded-xl border p-4 transition-all duration-200",
        getStatusBgColor(score.status),
        getStatusBorderColor(score.status),
        "hover:shadow-lg hover:scale-[1.02]"
      )}
    >
      {/* Status indicator */}
      <div className="absolute -top-2 -right-2">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center",
          score.status === "complete" ? "bg-emerald-500" :
          score.status === "partial" ? "bg-amber-500" : "bg-red-500"
        )}>
          <StatusIcon className="w-4 h-4 text-white" />
        </div>
      </div>
      
      {/* Header */}
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-white mb-1">
          {component.name}
        </h4>
        <p className="text-xs text-white/50 leading-relaxed">
          {component.description}
        </p>
      </div>
      
      {/* Score display */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "text-2xl font-bold",
          getStatusColor(score.status)
        )}>
          {score.rawValue !== null ? (
            <>
              {typeof score.rawValue === "boolean" ? (
                score.rawValue ? "Yes" : "No"
              ) : typeof score.rawValue === "number" ? (
                component.scoreType === "percentage" 
                  ? `${score.rawValue.toFixed(1)}%`
                  : score.rawValue.toFixed(1)
              ) : (
                String(score.rawValue)
              )}
            </>
          ) : (
            <span className="text-white/30">N/A</span>
          )}
        </div>
        <div className={cn(
          "px-2 py-1 rounded text-xs font-medium",
          getStatusBgColor(score.status),
          getStatusColor(score.status)
        )}>
          {score.score}%
        </div>
      </div>
      
      {/* Leaders section */}
      <div className="border-t border-white/10 pt-3">
        <div className="flex items-center gap-1 mb-2">
          <Crown className={cn("w-3 h-3", `text-${pillarColor}-400`)} />
          <span className="text-xs text-white/40">Top Performers</span>
        </div>
        
        {leaders.length > 0 ? (
          <div className="space-y-1.5">
            {leaders.map((leader, index) => (
              <div 
                key={leader.iso_code}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 rounded-lg",
                  leader.iso_code === currentCountryIso 
                    ? "bg-white/10 border border-white/20" 
                    : "bg-white/5"
                )}
              >
                <span className={cn(
                  "text-xs font-bold w-4",
                  index === 0 ? "text-amber-400" :
                  index === 1 ? "text-slate-300" : "text-amber-700"
                )}>
                  #{index + 1}
                </span>
                <CountryFlag
                  isoCode={leader.iso_code}
                  flagUrl={leader.flag_url}
                  size="xs"
                />
                <span className={cn(
                  "text-xs flex-1 truncate",
                  leader.iso_code === currentCountryIso 
                    ? "text-white font-medium" 
                    : "text-white/70"
                )}>
                  {leader.name}
                </span>
                <span className="text-xs text-white/50">
                  {leader.score}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-white/30 italic">No data available</p>
        )}
      </div>
      
      {/* Sub-questions hint */}
      {component.subQuestions.length > 0 && onViewDetails && (
        <button
          onClick={onViewDetails}
          className={cn(
            "mt-3 flex items-center gap-1 text-xs group-hover:opacity-100 opacity-50 transition-opacity",
            `text-${pillarColor}-400`
          )}
        >
          <Info className="w-3 h-3" />
          <span>{component.subQuestions.length} key questions</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
      
      {/* Leader badge if current country is top 3 */}
      {isLeader && (
        <div className={cn(
          "absolute -top-2 -left-2 px-2 py-0.5 rounded-full text-xs font-bold",
          "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
        )}>
          #{currentCountryRank + 1} Global
        </div>
      )}
    </motion.div>
  );
}

export default ComponentCard;
