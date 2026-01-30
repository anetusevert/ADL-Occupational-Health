/**
 * GOHIP Platform - Intelligence Panel Component
 * =============================================
 * 
 * Displays deep intelligence data from the database for a country.
 * Shows data from multiple sources: CPI, HDI, IHME GBD, WJP, EPI, OECD
 */

import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Shield,
  Heart,
  Briefcase,
  Globe,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { fetchCountryIntelligence } from "../services/api";
import { cn } from "../lib/utils";

interface IntelligencePanelProps {
  isoCode: string;
  countryName: string;
  compact?: boolean;
}

/**
 * Format number with appropriate precision
 */
function formatValue(value: number | null | undefined, decimals = 1, prefix = "", suffix = ""): string {
  if (value === null || value === undefined) return "N/A";
  return `${prefix}${value.toFixed(decimals)}${suffix}`;
}

/**
 * Get score color based on value (0-100 scale)
 */
function getScoreColor(score: number | null): string {
  if (score === null) return "text-slate-500";
  if (score >= 70) return "text-emerald-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 30) return "text-orange-400";
  return "text-red-400";
}

/**
 * Score indicator with trend
 */
function ScoreIndicator({ label, value, maxValue = 100, inverse = false }: {
  label: string;
  value: number | null;
  maxValue?: number;
  inverse?: boolean;
}) {
  const normalizedScore = value !== null ? (value / maxValue) * 100 : null;
  const displayScore = inverse && normalizedScore !== null ? 100 - normalizedScore : normalizedScore;
  
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="text-xs text-white/60">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("text-xs font-medium", getScoreColor(displayScore))}>
          {value !== null ? value.toFixed(1) : "N/A"}
        </span>
        {value !== null && (
          <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full rounded-full transition-all",
                displayScore !== null && displayScore >= 70 ? "bg-emerald-500" :
                displayScore !== null && displayScore >= 50 ? "bg-yellow-500" :
                displayScore !== null && displayScore >= 30 ? "bg-orange-500" :
                "bg-red-500"
              )}
              style={{ width: `${Math.min(100, displayScore || 0)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Intelligence category card
 */
function IntelligenceCategory({ 
  title, 
  icon: Icon, 
  color, 
  children,
  defaultExpanded = true 
}: {
  title: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between p-2.5 hover:bg-white/5 transition-colors",
          color
        )}
      >
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium text-white">{title}</span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-white/50" />
        ) : (
          <ChevronDown className="w-3 h-3 text-white/50" />
        )}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-2.5 pb-2.5"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Main Intelligence Panel Component
 */
export function IntelligencePanel({ isoCode, countryName: _countryName, compact = false }: IntelligencePanelProps) {
  const [expanded, setExpanded] = useState(!compact);
  
  const { data: intelligence, isLoading, isError } = useQuery({
    queryKey: ["country-intelligence", isoCode],
    queryFn: () => fetchCountryIntelligence(isoCode),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
  
  if (isLoading) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-cyan-500/20 p-4">
        <div className="flex items-center gap-2 text-cyan-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading intelligence data...</span>
        </div>
      </div>
    );
  }
  
  if (isError || !intelligence) {
    return (
      <div className="bg-slate-800/50 rounded-xl border border-yellow-500/20 p-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">Intelligence data not available</span>
        </div>
        <p className="text-xs text-white/40 mt-1">Run ETL to populate intelligence data for this country.</p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 rounded-xl border border-cyan-500/20 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-cyan-500/10 to-transparent hover:from-cyan-500/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-cyan-500/20 rounded-lg flex items-center justify-center">
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-white">Deep Intelligence</h3>
            <p className="text-[10px] text-white/40">Multi-source database insights</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {intelligence.scores.overall_intelligence_score !== null && (
            <div className="text-right">
              <div className={cn(
                "text-lg font-bold",
                getScoreColor(intelligence.scores.overall_intelligence_score)
              )}>
                {intelligence.scores.overall_intelligence_score.toFixed(0)}
              </div>
              <div className="text-[9px] text-white/40">Overall Score</div>
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-white/50" />
          ) : (
            <ChevronDown className="w-4 h-4 text-white/50" />
          )}
        </div>
      </button>
      
      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="p-3 space-y-2"
          >
            {/* Score Summary */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              <div className="bg-purple-500/10 rounded-lg p-2 text-center">
                <div className={cn("text-sm font-bold", getScoreColor(intelligence.scores.governance_intelligence_score))}>
                  {formatValue(intelligence.scores.governance_intelligence_score, 0)}
                </div>
                <div className="text-[9px] text-white/40">Governance</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                <div className={cn("text-sm font-bold", getScoreColor(intelligence.scores.hazard_intelligence_score))}>
                  {formatValue(intelligence.scores.hazard_intelligence_score, 0)}
                </div>
                <div className="text-[9px] text-white/40">Hazard</div>
              </div>
              <div className="bg-cyan-500/10 rounded-lg p-2 text-center">
                <div className={cn("text-sm font-bold", getScoreColor(intelligence.scores.vigilance_intelligence_score))}>
                  {formatValue(intelligence.scores.vigilance_intelligence_score, 0)}
                </div>
                <div className="text-[9px] text-white/40">Vigilance</div>
              </div>
              <div className="bg-emerald-500/10 rounded-lg p-2 text-center">
                <div className={cn("text-sm font-bold", getScoreColor(intelligence.scores.restoration_intelligence_score))}>
                  {formatValue(intelligence.scores.restoration_intelligence_score, 0)}
                </div>
                <div className="text-[9px] text-white/40">Restoration</div>
              </div>
            </div>
            
            {/* Categories */}
            <IntelligenceCategory 
              title="Governance & Rule of Law" 
              icon={Shield} 
              color="text-purple-400"
              defaultExpanded={false}
            >
              <ScoreIndicator label="Corruption Index (CPI)" value={intelligence.governance.corruption_perception_index} />
              <ScoreIndicator label="Rule of Law (WJP)" value={intelligence.governance.rule_of_law_index} />
              <ScoreIndicator label="Gov. Effectiveness (WB)" value={intelligence.governance.government_effectiveness} maxValue={2.5} />
              <ScoreIndicator label="Regulatory Quality" value={intelligence.governance.regulatory_quality} maxValue={2.5} />
              <ScoreIndicator label="Political Stability" value={intelligence.governance.political_stability} maxValue={2.5} />
            </IntelligenceCategory>
            
            <IntelligenceCategory 
              title="Health Burden (IHME GBD)" 
              icon={Heart} 
              color="text-red-400"
              defaultExpanded={false}
            >
              <ScoreIndicator label="Occ. DALYs Total" value={intelligence.hazard.daly_occupational_total} maxValue={1000} inverse />
              <ScoreIndicator label="Injury DALYs" value={intelligence.hazard.daly_occupational_injuries} maxValue={500} inverse />
              <ScoreIndicator label="Carcinogen DALYs" value={intelligence.hazard.daly_occupational_carcinogens} maxValue={200} inverse />
              <ScoreIndicator label="EPI Score (Yale)" value={intelligence.hazard.epi_score} />
              <ScoreIndicator label="Air Quality" value={intelligence.hazard.epi_air_quality} />
            </IntelligenceCategory>
            
            <IntelligenceCategory 
              title="Health System Capacity" 
              icon={Briefcase} 
              color="text-cyan-400"
              defaultExpanded={false}
            >
              <ScoreIndicator label="UHC Coverage Index" value={intelligence.vigilance.uhc_service_coverage_index} />
              <ScoreIndicator label="Health Exp. (% GDP)" value={intelligence.vigilance.health_expenditure_gdp_pct} maxValue={15} />
              <ScoreIndicator label="Life Expectancy" value={intelligence.vigilance.life_expectancy_at_birth} maxValue={85} />
            </IntelligenceCategory>
            
            <IntelligenceCategory 
              title="Human Development" 
              icon={Globe} 
              color="text-emerald-400"
              defaultExpanded={false}
            >
              <ScoreIndicator label="HDI Score (UNDP)" value={intelligence.restoration.hdi_score} maxValue={1} />
              <ScoreIndicator label="Education Index" value={intelligence.restoration.education_index} maxValue={1} />
              <ScoreIndicator label="Labor Participation" value={intelligence.restoration.labor_force_participation} />
              <ScoreIndicator label="Unemployment" value={intelligence.restoration.unemployment_rate} maxValue={30} inverse />
            </IntelligenceCategory>
            
            {/* Economic Context */}
            <div className="bg-white/5 rounded-lg p-2.5">
              <div className="text-xs font-medium text-white/70 mb-2">Economic Context</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/50">GDP/capita (PPP)</span>
                  <span className="text-white">{formatValue(intelligence.economic.gdp_per_capita_ppp, 0, "$")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">GDP Growth</span>
                  <span className="text-white">{formatValue(intelligence.economic.gdp_growth_rate, 1, "", "%")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Industry (% GDP)</span>
                  <span className="text-white">{formatValue(intelligence.economic.industry_pct_gdp, 1, "", "%")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/50">Population</span>
                  <span className="text-white">
                    {intelligence.economic.population_total 
                      ? `${(intelligence.economic.population_total / 1_000_000).toFixed(1)}M` 
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Data Sources Footer */}
            <div className="text-[9px] text-white/30 pt-2 border-t border-white/10">
              Sources: World Bank, Transparency International, UNDP, Yale EPI, IHME GBD, WJP, OECD
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default IntelligencePanel;
