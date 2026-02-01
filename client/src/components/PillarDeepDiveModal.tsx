/**
 * Arthur D. Little - Global Health Platform
 * Pillar Deep Dive Modal
 * 
 * Comprehensive pillar analysis with:
 * - Country's architecture and metrics
 * - Global ranking context
 * - Leader comparison with gap analysis
 * - Strategic insights
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  AlertTriangle,
  Eye,
  HeartPulse,
  Crown,
  TrendingUp,
  TrendingDown,
  Globe2,
  Award,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  Minus,
} from "lucide-react";
import { cn, getMaturityStage, getApiBaseUrl, getCountryFlag } from "../lib/utils";
import { LeaderComparisonCard, LeaderBadge } from "./LeaderComparisonCard";
import type { Country } from "../types/country";
import type { PillarType, RankedCountry, PillarRankingResult } from "../lib/pillarRankings";
import { PILLAR_CONFIG, getPillarScore, comparePillarMetrics } from "../lib/pillarRankings";

// =============================================================================
// TYPES
// =============================================================================

interface PillarDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  pillar: PillarType | null;
  country: Country;
  rankingResult: PillarRankingResult | null;
  allCountries: Country[];
}

// =============================================================================
// PILLAR ICONS
// =============================================================================

const PILLAR_ICONS: Record<PillarType, React.ElementType> = {
  governance: Crown,
  hazard_control: AlertTriangle,
  vigilance: Eye,
  restoration: HeartPulse,
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function PillarDeepDiveModal({
  isOpen,
  onClose,
  pillar,
  country,
  rankingResult,
  allCountries,
}: PillarDeepDiveModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "comparison">("overview");

  if (!pillar || !isOpen) return null;

  const config = PILLAR_CONFIG[pillar];
  const Icon = PILLAR_ICONS[pillar];
  const score = getPillarScore(country, pillar);
  const stage = getMaturityStage(score ? score / 25 : null); // Convert 0-100 to 1-4 scale for stage

  const topLeader = rankingResult?.leaders[0] ?? null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-4 md:inset-8 lg:inset-12 z-50 flex flex-col bg-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden"
          >
            {/* Header */}
            <div className={cn("flex-shrink-0 border-b border-slate-700/50", config.bgColor)}>
              <div className="p-6">
                <div className="flex items-start justify-between">
                  {/* Pillar Info */}
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center",
                      config.bgColor,
                      "border",
                      config.borderColor
                    )}>
                      <Icon className={cn("w-7 h-7", config.color)} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{config.label}</h2>
                      <p className="text-sm text-white/60 mt-1">{config.description}</p>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6 text-white/60" />
                  </button>
                </div>

                {/* Score and Ranking Bar */}
                <div className="flex items-center gap-6 mt-6">
                  {/* Country Score */}
                  <div className="flex items-center gap-3">
                    <CountryFlag country={country} size="md" />
                    <div>
                      <p className="text-lg font-bold text-white">{country.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn(
                          "text-2xl font-bold",
                          score !== null ? config.color : "text-slate-500"
                        )}>
                          {score !== null ? `${score.toFixed(0)}%` : "N/A"}
                        </span>
                        {rankingResult?.currentCountry && (
                          <span className="text-sm text-white/40">
                            Ranked #{rankingResult.currentCountry.rank} of {rankingResult.totalCountries}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Gap to Leader */}
                  {topLeader && score !== null && (
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="text-center">
                        <p className="text-xs text-white/40 uppercase tracking-wider">Gap to #1</p>
                        <p className="text-lg font-bold text-amber-400">
                          {(topLeader.score - score).toFixed(0)}%
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20" />
                      <LeaderBadge leader={topLeader} pillar={pillar} />
                    </div>
                  )}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                  <TabButton
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                    icon={Info}
                    label="Country Architecture"
                  />
                  <TabButton
                    active={activeTab === "comparison"}
                    onClick={() => setActiveTab("comparison")}
                    icon={Globe2}
                    label="Leader Comparison"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "overview" ? (
                <OverviewTab
                  country={country}
                  pillar={pillar}
                  config={config}
                />
              ) : (
                <ComparisonTab
                  country={country}
                  pillar={pillar}
                  rankingResult={rankingResult}
                  config={config}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// TAB BUTTON
// =============================================================================

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
        active
          ? "bg-white/10 text-white"
          : "text-white/50 hover:text-white hover:bg-white/5"
      )}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

// =============================================================================
// OVERVIEW TAB - Country's Architecture
// =============================================================================

interface OverviewTabProps {
  country: Country;
  pillar: PillarType;
  config: typeof PILLAR_CONFIG[PillarType];
}

function OverviewTab({ country, pillar, config }: OverviewTabProps) {
  const metrics = getMetricsForPillar(country, pillar);

  return (
    <div className="p-6 space-y-6">
      {/* Section: How This Country is Set Up */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-white/60" />
          {country.name}'s {config.label} Architecture
        </h3>
        <p className="text-sm text-white/60 mb-4">
          Understanding how {country.name} has structured its {config.label.toLowerCase()} systems and policies.
        </p>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.map((metric, index) => (
            <MetricDetailCard
              key={metric.id}
              metric={metric}
              config={config}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Section: Key Observations */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-white/60" />
          Key Observations
        </h3>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <KeyObservations metrics={metrics} pillar={pillar} countryName={country.name} />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COMPARISON TAB - Leaders Analysis
// =============================================================================

interface ComparisonTabProps {
  country: Country;
  pillar: PillarType;
  rankingResult: PillarRankingResult | null;
  config: typeof PILLAR_CONFIG[PillarType];
}

function ComparisonTab({ country, pillar, rankingResult, config }: ComparisonTabProps) {
  if (!rankingResult || rankingResult.leaders.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-full">
        <div className="text-center">
          <Globe2 className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No ranking data available for comparison</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Top 3 Leaders */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-amber-400" />
          Global Leaders in {config.label}
        </h3>
        <p className="text-sm text-white/60 mb-4">
          Compare {country.name}'s approach against the top-performing countries in {config.label.toLowerCase()}.
        </p>

        <div className="space-y-4">
          {rankingResult.leaders.slice(0, 3).map((leader, index) => (
            <LeaderComparisonCard
              key={leader.iso_code}
              currentCountry={country}
              leader={leader}
              pillar={pillar}
              currentRank={rankingResult.currentCountry?.rank ?? null}
              showFullComparison={index === 0}
            />
          ))}
        </div>
      </div>

      {/* Ranking Context */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-white/60" />
          Global Ranking Context
        </h3>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <RankingContext
            country={country}
            pillar={pillar}
            rankingResult={rankingResult}
          />
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// METRIC DETAIL CARD
// =============================================================================

interface MetricInfo {
  id: string;
  label: string;
  value: string | number | boolean | null;
  description: string;
  interpretation: string;
  isGood: boolean | null;
}

interface MetricDetailCardProps {
  metric: MetricInfo;
  config: typeof PILLAR_CONFIG[PillarType];
  index: number;
}

function MetricDetailCard({ metric, config, index }: MetricDetailCardProps) {
  const displayValue = formatMetricValue(metric.value);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-slate-800/50 rounded-xl p-4 border border-slate-700/50",
        "hover:border-slate-600/50 transition-all"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-medium text-white">{metric.label}</h4>
        {metric.isGood !== null && (
          <div className={cn(
            "w-5 h-5 rounded-full flex items-center justify-center",
            metric.isGood ? "bg-emerald-500/20" : "bg-red-500/20"
          )}>
            {metric.isGood ? (
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            ) : (
              <XCircle className="w-3 h-3 text-red-400" />
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={cn("text-2xl font-bold mb-2", config.color)}>
        {displayValue}
      </div>

      {/* Description */}
      <p className="text-xs text-white/50 mb-2">{metric.description}</p>

      {/* Interpretation */}
      {metric.interpretation && (
        <div className="pt-2 border-t border-slate-700/50">
          <p className="text-xs text-white/40 italic">{metric.interpretation}</p>
        </div>
      )}
    </motion.div>
  );
}

// =============================================================================
// KEY OBSERVATIONS
// =============================================================================

interface KeyObservationsProps {
  metrics: MetricInfo[];
  pillar: PillarType;
  countryName: string;
}

function KeyObservations({ metrics, pillar, countryName }: KeyObservationsProps) {
  const strengths = metrics.filter((m) => m.isGood === true);
  const weaknesses = metrics.filter((m) => m.isGood === false);
  const neutral = metrics.filter((m) => m.isGood === null);

  return (
    <div className="space-y-4">
      {/* Strengths */}
      {strengths.length > 0 && (
        <div>
          <p className="text-sm font-medium text-emerald-400 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Strengths ({strengths.length})
          </p>
          <ul className="space-y-1">
            {strengths.map((s) => (
              <li key={s.id} className="text-sm text-white/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                {s.label}: {formatMetricValue(s.value)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div>
          <p className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
            <XCircle className="w-4 h-4" />
            Areas for Improvement ({weaknesses.length})
          </p>
          <ul className="space-y-1">
            {weaknesses.map((w) => (
              <li key={w.id} className="text-sm text-white/70 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {w.label}: {formatMetricValue(w.value)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* No clear assessment */}
      {strengths.length === 0 && weaknesses.length === 0 && (
        <p className="text-sm text-white/50">
          Insufficient data to provide detailed observations for {countryName}'s {PILLAR_CONFIG[pillar].label.toLowerCase()} architecture.
        </p>
      )}
    </div>
  );
}

// =============================================================================
// RANKING CONTEXT
// =============================================================================

interface RankingContextProps {
  country: Country;
  pillar: PillarType;
  rankingResult: PillarRankingResult;
}

function RankingContext({ country, pillar, rankingResult }: RankingContextProps) {
  const { currentCountry, leaders, totalCountries } = rankingResult;
  
  if (!currentCountry) {
    return (
      <p className="text-sm text-white/50">
        {country.name} does not have sufficient data for ranking in {PILLAR_CONFIG[pillar].label}.
      </p>
    );
  }

  const percentile = Math.round((1 - (currentCountry.rank - 1) / totalCountries) * 100);
  const topLeader = leaders[0];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">Global Position</span>
        <span className="text-sm font-semibold text-white">
          #{currentCountry.rank} of {totalCountries} countries
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-white/60">Percentile</span>
        <span className={cn(
          "text-sm font-semibold",
          percentile >= 75 ? "text-emerald-400" :
          percentile >= 50 ? "text-amber-400" :
          "text-red-400"
        )}>
          Top {100 - percentile}%
        </span>
      </div>
      {topLeader && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/60">Gap to Leader ({topLeader.name})</span>
          <span className="text-sm font-semibold text-amber-400">
            {(topLeader.score - currentCountry.score).toFixed(1)} points
          </span>
        </div>
      )}

      {/* Visual Progress Bar */}
      <div className="mt-4">
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${currentCountry.score}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn("h-full rounded-full", PILLAR_CONFIG[pillar].bgColor.replace("/10", "/50"))}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/40">0%</span>
          <span className="text-xs text-white/40">100%</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COUNTRY FLAG COMPONENT
// =============================================================================

interface CountryFlagProps {
  country: Country;
  size?: "sm" | "md" | "lg";
}

function CountryFlag({ country, size = "md" }: CountryFlagProps) {
  const flagUrl = country.flag_url
    ? `${getApiBaseUrl()}${country.flag_url}`
    : null;

  const sizeClasses = {
    sm: "w-6 h-4",
    md: "w-10 h-7",
    lg: "w-16 h-11",
  };

  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={country.name}
        className={cn(sizeClasses[size], "object-cover rounded shadow")}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = "none";
        }}
      />
    );
  }

  return (
    <span className={cn(
      size === "sm" ? "text-lg" : size === "md" ? "text-2xl" : "text-4xl"
    )}>
      {getCountryFlag(country.iso_code)}
    </span>
  );
}

// =============================================================================
// HELPERS
// =============================================================================

function formatMetricValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(1);
  }
  return String(value);
}

function getMetricsForPillar(country: Country, pillar: PillarType): MetricInfo[] {
  const metrics: MetricInfo[] = [];

  switch (pillar) {
    case "governance":
      metrics.push(
        {
          id: "ilo_c187",
          label: "ILO C187 Ratified",
          value: country.governance?.ilo_c187_status ?? null,
          description: "Ratification of ILO's Promotional Framework for OSH Convention",
          interpretation: country.governance?.ilo_c187_status
            ? "Country has committed to international OSH standards"
            : "Consider ratifying for stronger international alignment",
          isGood: country.governance?.ilo_c187_status ?? null,
        },
        {
          id: "ilo_c155",
          label: "ILO C155 Ratified",
          value: country.governance?.ilo_c155_status ?? null,
          description: "Ratification of ILO's Occupational Safety and Health Convention",
          interpretation: country.governance?.ilo_c155_status
            ? "Strong foundation for worker protection laws"
            : "Fundamental convention for workplace safety",
          isGood: country.governance?.ilo_c155_status ?? null,
        },
        {
          id: "inspector_density",
          label: "Inspector Density",
          value: country.governance?.inspector_density ?? null,
          description: "Number of labor inspectors per 10,000 workers",
          interpretation: getInspectorInterpretation(country.governance?.inspector_density),
          isGood: country.governance?.inspector_density !== null
            ? country.governance.inspector_density >= 1.0
            : null,
        },
        {
          id: "mental_health",
          label: "Mental Health Policy",
          value: country.governance?.mental_health_policy ?? null,
          description: "Existence of workplace mental health policies",
          interpretation: country.governance?.mental_health_policy
            ? "Progressive approach to psychosocial risks"
            : "Growing area of concern globally",
          isGood: country.governance?.mental_health_policy ?? null,
        },
        {
          id: "strategic_capacity",
          label: "Strategic Capacity Score",
          value: country.governance?.strategic_capacity_score ?? null,
          description: "Overall governance and strategic capability index (0-100)",
          interpretation: getScoreInterpretation(country.governance?.strategic_capacity_score, "governance"),
          isGood: country.governance?.strategic_capacity_score !== null
            ? country.governance.strategic_capacity_score >= 60
            : null,
        }
      );
      break;

    case "hazard_control":
      metrics.push(
        {
          id: "fatal_rate",
          label: "Fatal Accident Rate",
          value: country.pillar_1_hazard?.fatal_accident_rate ?? null,
          description: "Workplace fatalities per 100,000 workers",
          interpretation: getFatalRateInterpretation(country.pillar_1_hazard?.fatal_accident_rate),
          isGood: country.pillar_1_hazard?.fatal_accident_rate !== null
            ? country.pillar_1_hazard.fatal_accident_rate < 3.0
            : null,
        },
        {
          id: "carcinogen",
          label: "Carcinogen Exposure",
          value: country.pillar_1_hazard?.carcinogen_exposure_pct ?? null,
          description: "Percentage of workers exposed to carcinogens",
          interpretation: "Lower exposure indicates better hazard controls",
          isGood: country.pillar_1_hazard?.carcinogen_exposure_pct !== null
            ? country.pillar_1_hazard.carcinogen_exposure_pct < 10
            : null,
        },
        {
          id: "heat_stress",
          label: "Heat Stress Regulation",
          value: country.pillar_1_hazard?.heat_stress_reg_type ?? null,
          description: "Type of heat stress regulation in place",
          interpretation: getHeatStressInterpretation(country.pillar_1_hazard?.heat_stress_reg_type),
          isGood: country.pillar_1_hazard?.heat_stress_reg_type === "Strict" ? true :
                  country.pillar_1_hazard?.heat_stress_reg_type === "None" ? false : null,
        },
        {
          id: "oel_compliance",
          label: "OEL Compliance",
          value: country.pillar_1_hazard?.oel_compliance_pct ?? null,
          description: "Occupational Exposure Limits compliance rate",
          interpretation: "Higher compliance indicates better chemical hazard management",
          isGood: country.pillar_1_hazard?.oel_compliance_pct !== null
            ? country.pillar_1_hazard.oel_compliance_pct >= 80
            : null,
        },
        {
          id: "control_maturity",
          label: "Control Maturity Score",
          value: country.pillar_1_hazard?.control_maturity_score ?? null,
          description: "Overall hazard control maturity index (0-100)",
          interpretation: getScoreInterpretation(country.pillar_1_hazard?.control_maturity_score, "hazard"),
          isGood: country.pillar_1_hazard?.control_maturity_score !== null
            ? country.pillar_1_hazard.control_maturity_score >= 60
            : null,
        }
      );
      break;

    case "vigilance":
      metrics.push(
        {
          id: "surveillance",
          label: "Surveillance System",
          value: country.pillar_2_vigilance?.surveillance_logic ?? null,
          description: "Type of occupational health surveillance approach",
          interpretation: getSurveillanceInterpretation(country.pillar_2_vigilance?.surveillance_logic),
          isGood: country.pillar_2_vigilance?.surveillance_logic === "Risk-Based" ? true :
                  country.pillar_2_vigilance?.surveillance_logic === "None" ? false : null,
        },
        {
          id: "disease_detection",
          label: "Disease Detection Rate",
          value: country.pillar_2_vigilance?.disease_detection_rate ?? null,
          description: "Rate of occupational disease identification",
          interpretation: "Higher rates indicate better detection systems",
          isGood: country.pillar_2_vigilance?.disease_detection_rate !== null
            ? country.pillar_2_vigilance.disease_detection_rate >= 50
            : null,
        },
        {
          id: "vulnerability",
          label: "Vulnerability Index",
          value: country.pillar_2_vigilance?.vulnerability_index ?? null,
          description: "Workforce vulnerability to occupational health risks (0-100, lower is better)",
          interpretation: "Lower vulnerability indicates more resilient workforce",
          isGood: country.pillar_2_vigilance?.vulnerability_index !== null
            ? country.pillar_2_vigilance.vulnerability_index < 40
            : null,
        },
        {
          id: "disease_reporting",
          label: "Disease Reporting Rate",
          value: country.pillar_2_vigilance?.occupational_disease_reporting_rate ?? null,
          description: "Rate of occupational disease reporting",
          interpretation: "Higher rates suggest better awareness and compliance",
          isGood: country.pillar_2_vigilance?.occupational_disease_reporting_rate !== null
            ? country.pillar_2_vigilance.occupational_disease_reporting_rate >= 70
            : null,
        }
      );
      break;

    case "restoration":
      metrics.push(
        {
          id: "payer_mechanism",
          label: "Payer Mechanism",
          value: country.pillar_3_restoration?.payer_mechanism ?? null,
          description: "Compensation system type",
          interpretation: getPayerInterpretation(country.pillar_3_restoration?.payer_mechanism),
          isGood: country.pillar_3_restoration?.payer_mechanism === "No-Fault" ? true : null,
        },
        {
          id: "reintegration",
          label: "Reintegration Law",
          value: country.pillar_3_restoration?.reintegration_law ?? null,
          description: "Legal requirement for workplace reintegration",
          interpretation: country.pillar_3_restoration?.reintegration_law
            ? "Strong legal framework for return-to-work"
            : "May rely on voluntary employer programs",
          isGood: country.pillar_3_restoration?.reintegration_law ?? null,
        },
        {
          id: "rehab_access",
          label: "Rehab Access Score",
          value: country.pillar_3_restoration?.rehab_access_score ?? null,
          description: "Accessibility of rehabilitation services (0-100)",
          interpretation: getScoreInterpretation(country.pillar_3_restoration?.rehab_access_score, "rehabilitation"),
          isGood: country.pillar_3_restoration?.rehab_access_score !== null
            ? country.pillar_3_restoration.rehab_access_score >= 60
            : null,
        },
        {
          id: "rtw_success",
          label: "Return to Work Success",
          value: country.pillar_3_restoration?.return_to_work_success_pct ?? null,
          description: "Percentage of injured workers successfully returning to work",
          interpretation: "Higher rates indicate effective restoration programs",
          isGood: country.pillar_3_restoration?.return_to_work_success_pct !== null
            ? country.pillar_3_restoration.return_to_work_success_pct >= 70
            : null,
        },
        {
          id: "absence_days",
          label: "Sickness Absence Days",
          value: country.pillar_3_restoration?.sickness_absence_days ?? null,
          description: "Average days of sickness absence per worker",
          interpretation: "Lower numbers may indicate faster recovery or underreporting",
          isGood: null, // Complex interpretation
        }
      );
      break;
  }

  return metrics;
}

function getInspectorInterpretation(density: number | null | undefined): string {
  if (density === null || density === undefined) return "No data available";
  if (density >= 1.5) return "Exceeds ILO recommendation of 1 per 10,000 workers";
  if (density >= 1.0) return "Meets ILO recommendation";
  if (density >= 0.5) return "Below ILO recommendation, limited enforcement capacity";
  return "Significantly under-resourced for effective enforcement";
}

function getFatalRateInterpretation(rate: number | null | undefined): string {
  if (rate === null || rate === undefined) return "No data available";
  if (rate < 1.0) return "Excellent - among the safest globally";
  if (rate < 3.0) return "Good - below global average";
  if (rate < 5.0) return "Concerning - above global average";
  return "Critical - significantly elevated risk";
}

function getHeatStressInterpretation(type: string | null | undefined): string {
  if (!type) return "No data available";
  if (type === "Strict") return "Comprehensive mandatory protections in place";
  if (type === "Advisory") return "Guidelines exist but not legally binding";
  return "No specific regulations - workers may be at risk";
}

function getSurveillanceInterpretation(type: string | null | undefined): string {
  if (!type) return "No data available";
  if (type === "Risk-Based") return "Proactive, targeted approach to high-risk sectors";
  if (type === "Mandatory") return "Universal but may lack prioritization";
  return "Limited systematic health monitoring";
}

function getPayerInterpretation(type: string | null | undefined): string {
  if (!type) return "No data available";
  if (type === "No-Fault") return "Workers compensated regardless of fault - faster, more certain benefits";
  return "May require proving employer negligence - can delay compensation";
}

function getScoreInterpretation(score: number | null | undefined, area: string): string {
  if (score === null || score === undefined) return "No data available";
  if (score >= 80) return `Excellent ${area} capacity - global leader`;
  if (score >= 60) return `Good ${area} systems in place`;
  if (score >= 40) return `Developing ${area} infrastructure`;
  return `Limited ${area} capacity - significant investment needed`;
}

export default PillarDeepDiveModal;
