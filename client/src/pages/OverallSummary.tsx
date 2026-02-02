/**
 * Arthur D. Little - Global Health Platform
 * Overall Summary Page
 * 
 * Comprehensive McKinsey-grade strategic assessment report
 * bringing together all pillars into a unified analysis.
 * 
 * Viewport-fit design with no scrolling.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  FileText,
  Crown, 
  Shield, 
  Eye, 
  HeartPulse,
  Globe2,
  Loader2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Target,
  ChevronRight,
  BarChart3,
  MapPin,
  Users,
  Building2,
  Award,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { cn, getEffectiveOHIScore } from "../lib/utils";
import { apiClient, aiApiClient } from "../services/api";
import { CountryFlag } from "../components/CountryFlag";
import { ADLIcon } from "../components/ADLLogo";
import type { GeoJSONMetadataResponse } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

interface StrategicPriority {
  priority: string;
  rationale: string;
  pillar: string;
  urgency: "high" | "medium" | "low";
}

interface SummaryReportData {
  executive_summary: string[];
  strategic_priorities: StrategicPriority[];
  overall_assessment: string;
  generated_at: string;
}

// ============================================================================
// PILLAR CONFIGS
// ============================================================================

const PILLARS: Array<{
  id: string;
  name: string;
  route: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  scoreField: string;
}> = [
  {
    id: "governance",
    name: "Governance",
    route: "governance",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    scoreField: "governance_score",
  },
  {
    id: "hazard-control",
    name: "Hazard Control",
    route: "hazard-control",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    scoreField: "pillar1_score",
  },
  {
    id: "vigilance",
    name: "Vigilance",
    route: "vigilance",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    scoreField: "pillar2_score",
  },
  {
    id: "restoration",
    name: "Restoration",
    route: "restoration",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    scoreField: "pillar3_score",
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSummaryFallback(countryName: string, scores: Record<string, number | null>): SummaryReportData {
  const validScores = Object.values(scores).filter(s => s !== null);
  const avgScore = validScores.length > 0 
    ? validScores.reduce((a, b) => a + (b ?? 0), 0) / validScores.length 
    : 0;
  
  const sortedPillars = Object.entries(scores)
    .filter(([, v]) => v !== null)
    .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0));
  
  const weakestPillar = sortedPillars[0];
  const strongestPillar = sortedPillars[sortedPillars.length - 1];

  return {
    executive_summary: [
      `${countryName}'s occupational health system demonstrates ${avgScore >= 60 ? "solid" : avgScore >= 40 ? "moderate" : "developing"} overall performance across the four framework pillars with an average score of ${avgScore.toFixed(0)}%.`,
      `The strongest performance is observed in ${strongestPillar ? PILLARS.find(p => p.scoreField === strongestPillar[0])?.name || strongestPillar[0] : "multiple areas"}, while ${weakestPillar ? PILLARS.find(p => p.scoreField === weakestPillar[0])?.name || weakestPillar[0] : "certain areas"} represents the primary opportunity for strategic improvement.`,
      "The framework assessment identifies key infrastructure gaps and provides benchmarks against global leaders in each domain.",
    ],
    strategic_priorities: [
      {
        priority: "Address critical infrastructure gaps",
        rationale: "Focus resources on components with the largest performance deficit relative to peer countries",
        pillar: weakestPillar ? PILLARS.find(p => p.scoreField === weakestPillar[0])?.name || "" : "",
        urgency: "high",
      },
      {
        priority: "Leverage existing strengths",
        rationale: "Build upon areas of demonstrated capability to create sustainable competitive advantages",
        pillar: strongestPillar ? PILLARS.find(p => p.scoreField === strongestPillar[0])?.name || "" : "",
        urgency: "medium",
      },
      {
        priority: "Align with international standards",
        rationale: "ILO convention alignment improves both domestic outcomes and international standing",
        pillar: "Governance",
        urgency: "medium",
      },
    ],
    overall_assessment: `${countryName} exhibits a ${avgScore >= 70 ? "mature" : avgScore >= 50 ? "developing" : "foundational"} occupational health framework. The architecture maps reveal specific component-level opportunities for targeted investment and policy development. Benchmarking against global leaders provides actionable insights for strategic prioritization.`,
    generated_at: new Date().toISOString(),
  };
}

async function fetchSummaryReport(
  isoCode: string,
  comparisonIso: string | null
): Promise<SummaryReportData> {
  try {
    const requestBody: Record<string, string> = {
      comparison_country: comparisonIso || "global",
    };
    
    const response = await aiApiClient.post(
      `/api/v1/summary-report/${isoCode}`,
      requestBody,
      { timeout: 180000 }
    );
    
    if (response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn("[OverallSummary] AI report unavailable, using fallback", error);
  }
  
  return generateSummaryFallback(isoCode, {});
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface PillarCardCompactProps {
  pillar: typeof PILLARS[0];
  score: number | null;
  onNavigate: () => void;
}

function PillarCardCompact({ pillar, score, onNavigate }: PillarCardCompactProps) {
  const Icon = pillar.icon;
  
  return (
    <motion.button
      onClick={onNavigate}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "group p-3 rounded-xl border text-left transition-all flex items-center gap-3",
        pillar.bgColor,
        pillar.borderColor,
        "hover:shadow-lg"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
        pillar.bgColor,
        "border",
        pillar.borderColor
      )}>
        <Icon className={cn("w-4 h-4", pillar.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-semibold text-white truncate">
          {pillar.name}
        </h4>
      </div>
      
      {score !== null && (
        <div className={cn(
          "text-lg font-bold flex-shrink-0",
          score >= 60 ? "text-emerald-400" : 
          score >= 40 ? "text-amber-400" : "text-red-400"
        )}>
          {score.toFixed(0)}%
        </div>
      )}
      
      <ChevronRight className={cn(
        "w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
        pillar.color
      )} />
    </motion.button>
  );
}

interface ComparisonSelectorProps {
  selectedIso: string | null;
  leaders: Array<{
    iso_code: string;
    name: string;
    flag_url?: string;
    ohi: number | null;
  }>;
  onSelect: (iso: string | null) => void;
}

function ComparisonSelector({ selectedIso, leaders, onSelect }: ComparisonSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedCountry = selectedIso ? leaders.find(c => c.iso_code === selectedIso) : null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          "bg-white/5 hover:bg-white/10 border border-white/10"
        )}
      >
        {selectedCountry ? (
          <>
            <CountryFlag isoCode={selectedCountry.iso_code} flagUrl={selectedCountry.flag_url} size="xs" />
            <span className="text-white flex-1 text-left truncate">{selectedCountry.name}</span>
            <span className="text-white/50 text-xs">{selectedCountry.ohi?.toFixed(0)}%</span>
          </>
        ) : (
          <>
            <Globe2 className="w-4 h-4 text-cyan-400" />
            <span className="text-white/70 flex-1 text-left">Global Benchmark</span>
          </>
        )}
        <ChevronDown className={cn("w-4 h-4 text-white/50 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <button
              onClick={() => { onSelect(null); setIsOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5",
                !selectedIso && "bg-white/10"
              )}
            >
              <Globe2 className="w-4 h-4 text-cyan-400" />
              <span className="text-white flex-1 text-left">Global Benchmark</span>
            </button>
            
            {leaders.map(country => (
              <button
                key={country.iso_code}
                onClick={() => { onSelect(country.iso_code); setIsOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5",
                  selectedIso === country.iso_code && "bg-white/10"
                )}
              >
                <CountryFlag isoCode={country.iso_code} flagUrl={country.flag_url} size="xs" />
                <span className="text-white flex-1 text-left truncate">{country.name}</span>
                <span className="text-white/50 text-xs">{country.ohi?.toFixed(0)}%</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OverallSummary() {
  const { iso } = useParams<{ iso: string }>();
  const navigate = useNavigate();
  const [comparisonIso, setComparisonIso] = useState<string | null>(null);
  
  // Fetch countries data
  const { data: geoData, isLoading: geoLoading, error: geoError } = useQuery({
    queryKey: ["geojson-metadata"],
    queryFn: async (): Promise<GeoJSONMetadataResponse> => {
      const response = await apiClient.get<GeoJSONMetadataResponse>("/api/v1/countries/geojson-metadata");
      return response.data;
    },
    staleTime: 60 * 1000,
  });
  
  // Find current country
  const currentCountry = useMemo(() => {
    if (!geoData?.countries || !iso) return null;
    return geoData.countries.find(c => c.iso_code === iso);
  }, [geoData, iso]);
  
  // Get comparison country
  const comparisonCountry = useMemo(() => {
    if (!geoData?.countries || !comparisonIso) return null;
    return geoData.countries.find(c => c.iso_code === comparisonIso);
  }, [geoData, comparisonIso]);
  
  // Calculate global averages
  const globalAverages = useMemo(() => {
    if (!geoData?.countries) return null;
    const countries = geoData.countries.filter(c => 
      c.governance_score != null || c.pillar1_score != null || 
      c.pillar2_score != null || c.pillar3_score != null
    );
    
    const avgField = (field: keyof typeof countries[0]) => {
      const valid = countries.filter(c => c[field] != null);
      if (valid.length === 0) return null;
      return valid.reduce((sum, c) => sum + (c[field] as number || 0), 0) / valid.length;
    };
    
    return {
      governance: avgField("governance_score"),
      hazardControl: avgField("pillar1_score"),
      vigilance: avgField("pillar2_score"),
      restoration: avgField("pillar3_score"),
    };
  }, [geoData]);
  
  // Prepare radar data
  const radarData = useMemo(() => {
    if (!currentCountry) return [];
    
    const dimensions = [
      { key: "Governance", current: currentCountry.governance_score, global: globalAverages?.governance },
      { key: "Hazard Control", current: currentCountry.pillar1_score, global: globalAverages?.hazardControl },
      { key: "Vigilance", current: currentCountry.pillar2_score, global: globalAverages?.vigilance },
      { key: "Restoration", current: currentCountry.pillar3_score, global: globalAverages?.restoration },
    ];
    
    return dimensions.map(d => ({
      dimension: d.key,
      current: d.current ?? 0,
      benchmark: comparisonCountry 
        ? (comparisonCountry[PILLARS.find(p => p.name === d.key)?.scoreField as keyof typeof comparisonCountry] as number ?? 0)
        : (d.global ?? 0),
    }));
  }, [currentCountry, comparisonCountry, globalAverages]);
  
  // Fetch AI report
  const scores = useMemo(() => {
    if (!currentCountry) return {};
    return {
      governance_score: currentCountry.governance_score,
      pillar1_score: currentCountry.pillar1_score,
      pillar2_score: currentCountry.pillar2_score,
      pillar3_score: currentCountry.pillar3_score,
    };
  }, [currentCountry]);
  
  const { 
    data: report, 
    isLoading: reportLoading,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["summary-report", iso, comparisonIso],
    queryFn: async () => {
      try {
        return await fetchSummaryReport(iso!, comparisonIso);
      } catch {
        return generateSummaryFallback(currentCountry?.name || iso!, scores);
      }
    },
    enabled: !!iso && !!currentCountry,
    staleTime: 5 * 60 * 1000,
  });
  
  // Calculate overall OHI score
  const ohiScore = useMemo(() => {
    if (!currentCountry) return null;
    return getEffectiveOHIScore(
      currentCountry.maturity_score,
      currentCountry.governance_score,
      currentCountry.pillar1_score,
      currentCountry.pillar2_score,
      currentCountry.pillar3_score
    );
  }, [currentCountry]);
  
  // Top 5 leaders (for comparison)
  const leaders = useMemo(() => {
    if (!geoData?.countries || !iso) return [];
    return geoData.countries
      .filter(c => c.iso_code !== iso)
      .map(c => ({
        iso_code: c.iso_code,
        name: c.name,
        flag_url: c.flag_url,
        ohi: getEffectiveOHIScore(c.maturity_score, c.governance_score, c.pillar1_score, c.pillar2_score, c.pillar3_score),
      }))
      .filter(c => c.ohi !== null)
      .sort((a, b) => (b.ohi ?? 0) - (a.ohi ?? 0))
      .slice(0, 5);
  }, [geoData, iso]);
  
  // Calculate averages for stats
  const avgPillarScore = useMemo(() => {
    if (!currentCountry) return null;
    const scores = [
      currentCountry.governance_score,
      currentCountry.pillar1_score,
      currentCountry.pillar2_score,
      currentCountry.pillar3_score,
    ].filter(s => s !== null);
    if (scores.length === 0) return null;
    return scores.reduce((a, b) => a + (b ?? 0), 0) / scores.length;
  }, [currentCountry]);
  
  // Find strongest and weakest pillars
  const pillarAnalysis = useMemo(() => {
    if (!currentCountry) return { strongest: null, weakest: null };
    
    const pillarScores = PILLARS.map(p => ({
      ...p,
      score: currentCountry[p.scoreField as keyof typeof currentCountry] as number | null,
    })).filter(p => p.score !== null);
    
    if (pillarScores.length === 0) return { strongest: null, weakest: null };
    
    pillarScores.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    
    return {
      strongest: pillarScores[0],
      weakest: pillarScores[pillarScores.length - 1],
    };
  }, [currentCountry]);
  
  // Loading state
  if (geoLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }
  
  // Error state
  if (geoError || !currentCountry) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Country Not Found</h2>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          
          <CountryFlag
            isoCode={currentCountry.iso_code}
            flagUrl={currentCountry.flag_url}
            size="md"
            className="shadow-lg"
          />
          
          <div>
            <h1 className="text-lg font-bold text-white">{currentCountry.name}</h1>
            <div className="flex items-center gap-2">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Overall Summary</span>
            </div>
          </div>
        </div>
        
        {/* OHI Score Badge */}
        {ohiScore !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
            <ADLIcon className="w-5 h-5" />
            <div className="text-center">
              <p className="text-[10px] text-white/50 leading-none">ADL OHI</p>
              <p className="text-lg font-bold text-cyan-400 leading-none">{ohiScore.toFixed(1)}</p>
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content - No Scroll */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="h-full grid grid-cols-3 gap-4">
          
          {/* Left Column: Executive Summary + Framework */}
          <div className="col-span-2 flex flex-col gap-4 overflow-hidden">
            
            {/* Executive Summary - Structured */}
            <section className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 p-4 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">Executive Summary</h2>
                <button
                  onClick={() => refetchReport()}
                  disabled={reportLoading}
                  className="ml-auto p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5 text-white/50", reportLoading && "animate-spin")} />
                </button>
              </div>
              
              {reportLoading ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <div className="flex-1 overflow-hidden flex flex-col gap-3">
                  {/* Key Stats Row */}
                  <div className="flex-shrink-0 grid grid-cols-4 gap-2">
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <BarChart3 className="w-3 h-3 text-cyan-400" />
                      </div>
                      <p className="text-lg font-bold text-white">{avgPillarScore?.toFixed(0) || "—"}%</p>
                      <p className="text-[10px] text-white/40">Avg Score</p>
                    </div>
                    
                    {pillarAnalysis.strongest && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="w-3 h-3 text-emerald-400" />
                        </div>
                        <p className="text-lg font-bold text-emerald-400">{pillarAnalysis.strongest.score?.toFixed(0)}%</p>
                        <p className="text-[10px] text-white/40 truncate">{pillarAnalysis.strongest.name}</p>
                      </div>
                    )}
                    
                    {pillarAnalysis.weakest && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingDown className="w-3 h-3 text-red-400" />
                        </div>
                        <p className="text-lg font-bold text-red-400">{pillarAnalysis.weakest.score?.toFixed(0)}%</p>
                        <p className="text-[10px] text-white/40 truncate">{pillarAnalysis.weakest.name}</p>
                      </div>
                    )}
                    
                    <div className="bg-white/5 rounded-lg p-2 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Award className="w-3 h-3 text-amber-400" />
                      </div>
                      <p className="text-lg font-bold text-white">
                        {ohiScore !== null && ohiScore >= 3.5 ? "A" : ohiScore !== null && ohiScore >= 3.0 ? "B" : ohiScore !== null && ohiScore >= 2.0 ? "C" : "D"}
                      </p>
                      <p className="text-[10px] text-white/40">Rating</p>
                    </div>
                  </div>
                  
                  {/* Summary Paragraphs */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {report?.executive_summary.map((para, i) => (
                      <p key={i} className="text-xs text-white/70 leading-relaxed">
                        {para}
                      </p>
                    ))}
                    
                    {/* Overall Assessment inline */}
                    {report?.overall_assessment && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <p className="text-xs text-white/70 leading-relaxed">
                          <span className="font-medium text-cyan-400">Assessment: </span>
                          {report.overall_assessment}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
            
            {/* Framework Assessment - Compact Row */}
            <section className="flex-shrink-0">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-white/60" />
                <h2 className="text-sm font-semibold text-white">Framework Pillars</h2>
              </div>
              
              <div className="grid grid-cols-4 gap-2">
                {PILLARS.map(pillar => {
                  const score = currentCountry[pillar.scoreField as keyof typeof currentCountry] as number | null;
                  return (
                    <PillarCardCompact
                      key={pillar.id}
                      pillar={pillar}
                      score={score}
                      onNavigate={() => navigate(`/country/${currentCountry.iso_code}/${pillar.route}`)}
                    />
                  );
                })}
              </div>
            </section>
            
            {/* Strategic Priorities - Compact */}
            <section className="flex-shrink-0 bg-slate-800/50 rounded-xl border border-slate-700 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-semibold text-white">Strategic Priorities</h2>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {report?.strategic_priorities.slice(0, 3).map((priority, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "p-2 rounded-lg border",
                      priority.urgency === "high" 
                        ? "bg-red-500/10 border-red-500/30" 
                        : priority.urgency === "medium"
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-slate-700/50 border-slate-600"
                    )}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <h4 className="text-xs font-semibold text-white line-clamp-1">{priority.priority}</h4>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase flex-shrink-0",
                        priority.urgency === "high" 
                          ? "bg-red-500/20 text-red-400"
                          : priority.urgency === "medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-600 text-slate-300"
                      )}>
                        {priority.urgency}
                      </span>
                    </div>
                    <p className="text-[10px] text-white/50 line-clamp-2">{priority.rationale}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          
          {/* Right Column: Global Positioning with Comparison */}
          <div className="flex flex-col gap-4 overflow-hidden">
            
            {/* Global Positioning - Large Radar */}
            <section className="flex-1 bg-slate-800/50 rounded-xl border border-slate-700 p-4 flex flex-col overflow-hidden">
              <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                <Globe2 className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-semibold text-white">Global Positioning</h2>
              </div>
              
              {/* Top 5 Leaders */}
              <div className="flex-shrink-0 mb-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Top 5 Best Practice Countries</p>
                <div className="flex gap-1">
                  {leaders.map((leader, idx) => (
                    <button
                      key={leader.iso_code}
                      onClick={() => setComparisonIso(leader.iso_code)}
                      className={cn(
                        "flex-1 flex flex-col items-center p-1.5 rounded-lg transition-colors",
                        comparisonIso === leader.iso_code 
                          ? "bg-cyan-500/20 border border-cyan-500/40" 
                          : "bg-white/5 hover:bg-white/10 border border-transparent"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold mb-1",
                        idx === 0 ? "text-amber-400" : "text-white/40"
                      )}>
                        #{idx + 1}
                      </span>
                      <CountryFlag isoCode={leader.iso_code} flagUrl={leader.flag_url} size="xs" />
                      <span className="text-[10px] text-white/60 mt-1 truncate w-full text-center">
                        {leader.ohi?.toFixed(0)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Comparison Selector */}
              <div className="flex-shrink-0 mb-3">
                <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1.5">Compare Against</p>
                <ComparisonSelector
                  selectedIso={comparisonIso}
                  leaders={leaders}
                  onSelect={setComparisonIso}
                />
              </div>
              
              {/* Large Radar Chart */}
              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="dimension" 
                      tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 10 }} 
                    />
                    <PolarRadiusAxis 
                      domain={[0, 100]} 
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 9 }}
                      axisLine={false}
                      tickCount={5}
                    />
                    <Radar
                      name={currentCountry.name}
                      dataKey="current"
                      stroke="#22d3ee"
                      fill="#22d3ee"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                    <Radar
                      name={comparisonCountry?.name || "Global Average"}
                      dataKey="benchmark"
                      stroke="#a78bfa"
                      fill="#a78bfa"
                      fillOpacity={0.15}
                      strokeWidth={2}
                      strokeDasharray="4 4"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "#1e293b", 
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        fontSize: "11px",
                      }}
                      labelStyle={{ color: "white" }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: "5px" }}
                      formatter={(value) => <span className="text-white/70 text-[10px]">{value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
            
          </div>
        </div>
      </main>
    </div>
  );
}

export default OverallSummary;
