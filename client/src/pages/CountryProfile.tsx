/**
 * Arthur D. Little - Global Health Platform
 * Country Profile Page - Comprehensive Country Assessment View
 * Viewport-fit layout: Map & Stats (left) | Framework Tiles & Pillars (right)
 */

import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Shield,
  Eye,
  HeartPulse,
  Crown,
} from "lucide-react";
import { CountryFlag } from "../components";
import { CountryMiniMap } from "../components/CountryMiniMap";
import { CountryStatsPanel } from "../components/CountryStatsPanel";
import { FrameworkReportTiles } from "../components/FrameworkReportTiles";
import { fetchCountryWithMockFallback } from "../services/api";
import { cn, getMaturityStage } from "../lib/utils";
import { calculateDataCoverage } from "../lib/dataCoverage";

/**
 * Data Confidence Badge Component
 */
function DataConfidenceBadge({ score }: { score: number }) {
  let bgColor: string;
  let textColor: string;
  let label: string;
  let Icon: typeof ShieldCheck;

  if (score >= 80) {
    bgColor = "bg-emerald-500/20";
    textColor = "text-emerald-400";
    label = "High Confidence";
    Icon = ShieldCheck;
  } else if (score >= 50) {
    bgColor = "bg-yellow-500/20";
    textColor = "text-yellow-400";
    label = "Medium Confidence";
    Icon = ShieldAlert;
  } else {
    bgColor = "bg-red-500/20";
    textColor = "text-red-400";
    label = "Low Confidence";
    Icon = ShieldQuestion;
  }

  return (
    <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", bgColor)}>
      <Icon className={cn("w-4 h-4", textColor)} />
      <div className="flex flex-col">
        <span className={cn("text-xs font-semibold", textColor)}>
          {score}% Data Coverage
        </span>
        <span className="text-[10px] text-slate-400">{label}</span>
      </div>
    </div>
  );
}

/**
 * Compact Pillar Card Component
 */
interface PillarCardProps {
  title: string;
  subtitle: string;
  icon: React.ElementType;
  score: number | null;
  color: string;
  bgColor: string;
  borderColor: string;
  metrics: { label: string; value: string | number | boolean | null | undefined }[];
  delay?: number;
}

function PillarCard({ 
  title, 
  subtitle, 
  icon: Icon, 
  score, 
  color, 
  bgColor, 
  borderColor,
  metrics,
  delay = 0 
}: PillarCardProps) {
  const maturity = getMaturityStage(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "bg-white/5 backdrop-blur-sm rounded-lg border overflow-hidden",
        "hover:bg-white/8 transition-all duration-200",
        borderColor
      )}
    >
      {/* Compact Header */}
      <div className={cn("px-3 py-2 border-b border-white/10", bgColor)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", bgColor)}>
              <Icon className={cn("w-4 h-4", color)} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-white">{title}</h3>
              <p className="text-[9px] text-white/40">{subtitle}</p>
            </div>
          </div>
          {score !== null && (
            <div className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold",
              maturity.bgColor, maturity.color
            )}>
              {score.toFixed(0)}%
            </div>
          )}
        </div>
      </div>

      {/* Compact Metrics */}
      <div className="p-2 space-y-1">
        {metrics.slice(0, 3).map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between py-0.5">
            <span className="text-[9px] text-white/50 truncate">{metric.label}</span>
            <span className={cn(
              "text-[10px] font-medium ml-2",
              metric.value === null || metric.value === undefined ? "text-white/30" :
              typeof metric.value === "boolean" ? (metric.value ? "text-emerald-400" : "text-red-400") :
              "text-white"
            )}>
              {metric.value === null || metric.value === undefined ? "N/A" :
               typeof metric.value === "boolean" ? (metric.value ? "Yes" : "No") :
               metric.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export function CountryProfile() {
  const { iso } = useParams<{ iso: string }>();

  // Fetch country data
  const {
    data: country,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["country", iso],
    queryFn: () => fetchCountryWithMockFallback(iso!),
    enabled: !!iso,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-3 text-adl-accent">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading country profile...</span>
        </div>
      </div>
    );
  }

  if (error || !country) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-400 mb-2">Country Not Found</h2>
          <p className="text-slate-400 mb-4">Could not load data for: {iso}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Map
          </Link>
        </div>
      </div>
    );
  }

  const maturity = getMaturityStage(country.maturity_score);
  const dataCoverage = calculateDataCoverage(country);

  // Prepare pillar data
  const pillars = [
    {
      id: "governance",
      title: "Governance",
      subtitle: "Strategic Capacity",
      icon: Crown,
      score: country.governance?.strategic_capacity_score ?? null,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/20",
      metrics: [
        { label: "ILO C187 Ratified", value: country.governance?.ilo_c187_status },
        { label: "ILO C155 Ratified", value: country.governance?.ilo_c155_status },
        { label: "Inspector Density", value: country.governance?.inspector_density ? `${country.governance.inspector_density}/10k` : null },
      ],
    },
    {
      id: "pillar1",
      title: "Hazard Control",
      subtitle: "Risk Management",
      icon: AlertTriangle,
      score: country.pillar_1_hazard?.control_maturity_score ?? null,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      metrics: [
        { label: "Fatal Rate", value: country.pillar_1_hazard?.fatal_accident_rate ? `${country.pillar_1_hazard.fatal_accident_rate.toFixed(2)}/100k` : null },
        { label: "Carcinogen Exp.", value: country.pillar_1_hazard?.carcinogen_exposure_pct ? `${country.pillar_1_hazard.carcinogen_exposure_pct}%` : null },
        { label: "Heat Stress Reg.", value: country.pillar_1_hazard?.heat_stress_reg_type },
      ],
    },
    {
      id: "pillar2",
      title: "Vigilance",
      subtitle: "Detection",
      icon: Eye,
      score: country.pillar_2_vigilance?.disease_detection_rate ?? null,
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
      metrics: [
        { label: "Surveillance", value: country.pillar_2_vigilance?.surveillance_logic },
        { label: "Detection Rate", value: country.pillar_2_vigilance?.disease_detection_rate ? `${country.pillar_2_vigilance.disease_detection_rate}%` : null },
        { label: "Vulnerability", value: country.pillar_2_vigilance?.vulnerability_index ? `${country.pillar_2_vigilance.vulnerability_index}/100` : null },
      ],
    },
    {
      id: "pillar3",
      title: "Restoration",
      subtitle: "Compensation",
      icon: HeartPulse,
      score: country.pillar_3_restoration?.rehab_access_score ?? null,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      metrics: [
        { label: "Payer Mechanism", value: country.pillar_3_restoration?.payer_mechanism },
        { label: "Reintegration Law", value: country.pillar_3_restoration?.reintegration_law },
        { label: "Rehab Access", value: country.pillar_3_restoration?.rehab_access_score ? `${country.pillar_3_restoration.rehab_access_score}/100` : null },
      ],
    },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 mb-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs mb-2"
        >
          <ArrowLeft className="w-3 h-3" />
          Back to Overview
        </Link>

        {/* Country Header - Compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CountryFlag 
              isoCode={country.iso_code} 
              flagUrl={country.flag_url} 
              size="lg" 
              className="shadow-lg"
            />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                {country.name}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/40">{country.iso_code}</span>
                {country.maturity_score !== null && (
                  <div className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-semibold",
                    maturity.bgColor, maturity.color
                  )}>
                    Stage {maturity.stage}: {maturity.label}
                  </div>
                )}
                <DataConfidenceBadge score={dataCoverage} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Two Column Layout - No Scroll */}
      <div className="flex-1 min-h-0 grid lg:grid-cols-2 gap-3 overflow-hidden">
        {/* LEFT COLUMN: Map & Country Stats */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Mini Map - Compact */}
          <CountryMiniMap 
            isoCode={country.iso_code} 
            countryName={country.name}
            className="h-36 flex-shrink-0"
          />

          {/* Country Statistics - World Bank Data */}
          <CountryStatsPanel 
            isoCode={country.iso_code}
            countryName={country.name}
            className="flex-1 min-h-0"
          />
        </div>

        {/* RIGHT COLUMN: Framework Tiles & Pillars */}
        <div className="flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Framework Report Tiles - 2x2 Grid */}
          <FrameworkReportTiles 
            isoCode={country.iso_code} 
            countryName={country.name}
            className="flex-shrink-0"
          />

          {/* Framework Pillars - Compact Temple Layout */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-adl-accent" />
                <h2 className="text-xs font-semibold text-white">Framework Analysis</h2>
              </div>
              <span className="text-[9px] text-white/30">ADL OH Framework v3.0</span>
            </div>

            {/* Temple Structure: Governance on top, 3 pillars below */}
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              {/* Governance Layer - Full Width Top */}
              <PillarCard {...pillars[0]} delay={0.1} />
              
              {/* Connection Pillars Visual */}
              <div className="flex justify-center gap-1.5 py-0.5">
                <div className="w-1 h-2 bg-purple-500/30 rounded-full" />
                <div className="w-1 h-2 bg-blue-500/30 rounded-full" />
                <div className="w-1 h-2 bg-teal-500/30 rounded-full" />
                <div className="w-1 h-2 bg-amber-500/30 rounded-full" />
              </div>
              
              {/* Three Pillars - Equal Width Row */}
              <div className="grid grid-cols-3 gap-2 flex-1 min-h-0">
                <PillarCard {...pillars[1]} delay={0.2} />
                <PillarCard {...pillars[2]} delay={0.3} />
                <PillarCard {...pillars[3]} delay={0.4} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CountryProfile;
