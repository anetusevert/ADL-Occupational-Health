/**
 * Arthur D. Little - Global Health Platform
 * Overall Summary Page
 * 
 * Comprehensive McKinsey-grade strategic assessment report
 * bringing together all pillars into a unified analysis.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

interface PillarSummary {
  id: string;
  name: string;
  score: number | null;
  assessment: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}

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
  const avgScore = Object.values(scores).filter(s => s !== null).reduce((a, b) => a + (b ?? 0), 0) / 
    Object.values(scores).filter(s => s !== null).length;
  
  const weakestPillar = Object.entries(scores)
    .filter(([, v]) => v !== null)
    .sort(([, a], [, b]) => (a ?? 0) - (b ?? 0))[0];
  
  const strongestPillar = Object.entries(scores)
    .filter(([, v]) => v !== null)
    .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0];

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
  
  // Return fallback
  return generateSummaryFallback(isoCode, {});
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface PillarCardProps {
  pillar: typeof PILLARS[0];
  score: number | null;
  countryIso: string;
  onNavigate: () => void;
}

function PillarCard({ pillar, score, countryIso, onNavigate }: PillarCardProps) {
  const Icon = pillar.icon;
  
  return (
    <motion.button
      onClick={onNavigate}
      whileHover={{ scale: 1.02 }}
      className={cn(
        "group p-4 rounded-xl border text-left transition-all",
        pillar.bgColor,
        pillar.borderColor,
        "hover:shadow-lg"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          pillar.bgColor,
          "border",
          pillar.borderColor
        )}>
          <Icon className={cn("w-5 h-5", pillar.color)} />
        </div>
        
        {score !== null && (
          <div className={cn(
            "text-2xl font-bold",
            score >= 60 ? "text-emerald-400" : 
            score >= 40 ? "text-amber-400" : "text-red-400"
          )}>
            {score.toFixed(0)}%
          </div>
        )}
      </div>
      
      <h4 className="text-sm font-semibold text-white mb-1">
        {pillar.name}
      </h4>
      
      <div className={cn(
        "flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity",
        pillar.color
      )}>
        <span>View Architecture</span>
        <ChevronRight className="w-3 h-3" />
      </div>
    </motion.button>
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
      // Try API first, then fallback
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
  
  // Top 5 leaders
  const leaders = useMemo(() => {
    if (!geoData?.countries || !iso) return [];
    return geoData.countries
      .filter(c => c.iso_code !== iso)
      .map(c => ({
        ...c,
        ohi: getEffectiveOHIScore(c.maturity_score, c.governance_score, c.pillar1_score, c.pillar2_score, c.pillar3_score),
      }))
      .filter(c => c.ohi !== null)
      .sort((a, b) => (b.ohi ?? 0) - (a.ohi ?? 0))
      .slice(0, 5);
  }, [geoData, iso]);
  
  // Loading state
  if (geoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }
  
  // Error state
  if (geoError || !currentCountry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          
          <CountryFlag
            isoCode={currentCountry.iso_code}
            flagUrl={currentCountry.flag_url}
            size="lg"
            className="shadow-lg"
          />
          
          <div>
            <h1 className="text-xl font-bold text-white">{currentCountry.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Overall Summary</span>
              <span className="text-sm text-white/50">Strategic Assessment</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* OHI Score */}
          {ohiScore !== null && (
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <ADLIcon className="w-6 h-6" />
              <div>
                <p className="text-xs text-white/50">ADL OHI Score</p>
                <p className="text-xl font-bold text-cyan-400">{ohiScore.toFixed(1)}</p>
              </div>
            </div>
          )}
          
          {/* Comparison Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">Compare:</span>
            <select
              value={comparisonIso || ""}
              onChange={(e) => setComparisonIso(e.target.value || null)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">Global Benchmark</option>
              {leaders.map(c => (
                <option key={c.iso_code} value={c.iso_code}>
                  {c.name} ({c.ohi?.toFixed(0)}%)
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Executive Summary */}
          <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Executive Summary</h2>
              <button
                onClick={() => refetchReport()}
                disabled={reportLoading}
                className="ml-auto p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className={cn("w-4 h-4 text-white/50", reportLoading && "animate-spin")} />
              </button>
            </div>
            
            {reportLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {report?.executive_summary.map((para, i) => (
                  <p key={i} className="text-sm text-white/70 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}
          </section>
          
          {/* Framework Assessment Grid */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="w-5 h-5 text-white/60" />
              <h2 className="text-lg font-semibold text-white">Framework Assessment</h2>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              {PILLARS.map(pillar => {
                const score = currentCountry[pillar.scoreField as keyof typeof currentCountry] as number | null;
                return (
                  <PillarCard
                    key={pillar.id}
                    pillar={pillar}
                    score={score}
                    countryIso={currentCountry.iso_code}
                    onNavigate={() => navigate(`/country/${currentCountry.iso_code}/${pillar.route}`)}
                  />
                );
              })}
            </div>
          </section>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Strategic Priorities */}
            <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-semibold text-white">Strategic Priorities</h2>
              </div>
              
              <div className="space-y-3">
                {report?.strategic_priorities.map((priority, i) => (
                  <div 
                    key={i}
                    className={cn(
                      "p-4 rounded-xl border",
                      priority.urgency === "high" 
                        ? "bg-red-500/10 border-red-500/30" 
                        : priority.urgency === "medium"
                          ? "bg-amber-500/10 border-amber-500/30"
                          : "bg-slate-700/50 border-slate-600"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-white">{priority.priority}</h4>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium uppercase",
                        priority.urgency === "high" 
                          ? "bg-red-500/20 text-red-400"
                          : priority.urgency === "medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-600 text-slate-300"
                      )}>
                        {priority.urgency}
                      </span>
                    </div>
                    <p className="text-xs text-white/60">{priority.rationale}</p>
                    {priority.pillar && (
                      <p className="text-xs text-white/40 mt-2">Pillar: {priority.pillar}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
            
            {/* Global Positioning Radar */}
            <section className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-semibold text-white">Global Positioning</h2>
              </div>
              
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="dimension" 
                      tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 11 }} 
                    />
                    <PolarRadiusAxis 
                      domain={[0, 100]} 
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                      axisLine={false}
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
                      }}
                      labelStyle={{ color: "white" }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: "10px" }}
                      formatter={(value) => <span className="text-white/70 text-xs">{value}</span>}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>
          
          {/* Overall Assessment */}
          {report?.overall_assessment && (
            <section className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl border border-cyan-500/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <ADLIcon className="w-5 h-5" />
                <h2 className="text-lg font-semibold text-white">Overall Assessment</h2>
              </div>
              <p className="text-sm text-white/70 leading-relaxed">
                {report.overall_assessment}
              </p>
            </section>
          )}
          
        </div>
      </main>
    </div>
  );
}

export default OverallSummary;
