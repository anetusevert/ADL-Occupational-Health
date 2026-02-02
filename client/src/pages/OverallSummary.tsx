/**
 * Arthur D. Little - Global Health Platform
 * Overall Summary Page
 * 
 * Document-viewer style strategic assessment report.
 * McKinsey-grade executive summary with clickable priorities.
 * No scrolling - content fits viewport.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  ChevronRight,
  RefreshCw,
  Target,
  Download,
  Lock,
  Sparkles,
} from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, ResponsiveContainer, Tooltip } from "recharts";
import { cn, getEffectiveOHIScore } from "../lib/utils";
import { apiClient, aiApiClient } from "../services/api";
import { CountryFlag } from "../components/CountryFlag";
import { ADLIcon } from "../components/ADLLogo";
import { useAuth } from "../contexts/AuthContext";
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
  cached?: boolean;
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

// Map pillar names to routes
const PILLAR_NAME_TO_ROUTE: Record<string, string> = {
  "Governance": "governance",
  "Hazard Control": "hazard-control",
  "Vigilance": "vigilance",
  "Restoration": "restoration",
};

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
      "The framework assessment identifies key infrastructure gaps and provides benchmarks against global leaders in each domain. Strategic prioritization should focus on high-impact interventions that address systemic weaknesses while leveraging existing institutional strengths.",
      `Regional benchmarking indicates that ${countryName} performs ${avgScore >= 55 ? "above" : avgScore >= 45 ? "near" : "below"} the regional average, with particular opportunities for improvement in enforcement capacity and surveillance infrastructure.`,
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
  comparisonIso: string | null,
  forceRegenerate: boolean = false
): Promise<SummaryReportData> {
  const requestBody: Record<string, string | boolean> = {
    comparison_country: comparisonIso || "global",
  };
  
  if (forceRegenerate) {
    requestBody.force_regenerate = true;
  }
  
  const response = await aiApiClient.post(
    `/api/v1/summary-report/${isoCode}`,
    requestBody,
    { timeout: 180000 }
  );
  
  if (response.data) {
    return response.data;
  }
  
  throw new Error("No data returned");
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface ClickablePriorityProps {
  priority: StrategicPriority;
  index: number;
  countryIso: string;
  onNavigate: (route: string) => void;
}

function ClickablePriority({ priority, index, countryIso, onNavigate }: ClickablePriorityProps) {
  const pillarRoute = PILLAR_NAME_TO_ROUTE[priority.pillar];
  const pillarConfig = PILLARS.find(p => p.name === priority.pillar);
  const Icon = pillarConfig?.icon || Target;
  
  return (
    <motion.button
      onClick={() => pillarRoute && onNavigate(`/country/${countryIso}/${pillarRoute}`)}
      whileHover={{ scale: 1.01, x: 4 }}
      className={cn(
        "w-full p-3 rounded-lg border text-left transition-all group",
        priority.urgency === "high" 
          ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" 
          : priority.urgency === "medium"
            ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
            : "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60">
          {index + 1}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-white">{priority.priority}</h4>
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
              priority.urgency === "high" 
                ? "bg-red-500/20 text-red-400"
                : priority.urgency === "medium"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-slate-600 text-slate-300"
            )}>
              {priority.urgency}
            </span>
          </div>
          <p className="text-xs text-white/60 mb-2">{priority.rationale}</p>
          
          {priority.pillar && (
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
              pillarConfig?.bgColor || "bg-white/10",
              pillarConfig?.borderColor || "border-white/20",
              "border"
            )}>
              <Icon className={cn("w-3 h-3", pillarConfig?.color || "text-white/60")} />
              <span className={pillarConfig?.color || "text-white/60"}>{priority.pillar}</span>
              <ChevronRight className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", pillarConfig?.color || "text-white/60")} />
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

interface PillarNavButtonProps {
  pillar: typeof PILLARS[0];
  score: number | null;
  countryIso: string;
  onNavigate: () => void;
}

function PillarNavButton({ pillar, score, onNavigate }: PillarNavButtonProps) {
  const Icon = pillar.icon;
  
  return (
    <motion.button
      onClick={onNavigate}
      whileHover={{ scale: 1.03 }}
      className={cn(
        "flex flex-col items-center gap-1 p-2 rounded-lg border transition-all",
        pillar.bgColor,
        pillar.borderColor,
        "hover:shadow-lg"
      )}
    >
      <Icon className={cn("w-5 h-5", pillar.color)} />
      <span className="text-[10px] font-medium text-white/70">{pillar.name}</span>
      {score !== null && (
        <span className={cn(
          "text-sm font-bold",
          score >= 60 ? "text-emerald-400" : 
          score >= 40 ? "text-amber-400" : "text-red-400"
        )}>
          {score.toFixed(0)}%
        </span>
      )}
    </motion.button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function OverallSummary() {
  const { iso } = useParams<{ iso: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [comparisonIso, setComparisonIso] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showComparisonDropdown, setShowComparisonDropdown] = useState(false);
  
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
  
  // Fetch report
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
    error: reportError,
    refetch: refetchReport,
  } = useQuery({
    queryKey: ["summary-report", iso, comparisonIso],
    queryFn: async () => {
      return await fetchSummaryReport(iso!, comparisonIso);
    },
    enabled: !!iso && !!currentCountry,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry on 404/403
  });
  
  // Check if error is "not generated" (404)
  const isNotGenerated = reportError && 
    (reportError as any)?.response?.status === 404;
  
  // Handle generate/regenerate (admin only)
  const handleGenerate = async (forceRegenerate: boolean = false) => {
    if (!isAdmin || !iso) return;
    
    setIsRegenerating(true);
    try {
      await fetchSummaryReport(iso, comparisonIso, forceRegenerate);
      // Invalidate cache to refetch
      queryClient.invalidateQueries({ queryKey: ["summary-report", iso] });
      refetchReport();
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsRegenerating(false);
    }
  };
  
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
        iso_code: c.iso_code,
        name: c.name,
        flag_url: c.flag_url,
        ohi: getEffectiveOHIScore(c.maturity_score, c.governance_score, c.pillar1_score, c.pillar2_score, c.pillar3_score),
      }))
      .filter(c => c.ohi !== null)
      .sort((a, b) => (b.ohi ?? 0) - (a.ohi ?? 0))
      .slice(0, 5);
  }, [geoData, iso]);
  
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
            onClick={() => navigate("/home")}
            className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }
  
  // Report not generated state
  if (isNotGenerated && !reportLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home")}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Back to Global Map"
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
              <h1 className="text-base font-bold text-white">{currentCountry.name}</h1>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">Strategic Assessment</span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Not Generated Message */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30">
              {isAdmin ? (
                <Sparkles className="w-8 h-8 text-cyan-400" />
              ) : (
                <Lock className="w-8 h-8 text-white/40" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              {isAdmin ? "Report Not Yet Generated" : "Report Pending Generation"}
            </h2>
            
            <p className="text-sm text-white/60 mb-6">
              {isAdmin 
                ? `The strategic assessment for ${currentCountry.name} has not been generated yet. Click below to generate a comprehensive executive summary.`
                : `The strategic assessment for ${currentCountry.name} is not yet available. Please contact an administrator to generate this report.`
              }
            </p>
            
            {isAdmin ? (
              <button
                onClick={() => handleGenerate(false)}
                disabled={isRegenerating}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                  "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400",
                  "hover:bg-cyan-500/30",
                  isRegenerating && "opacity-50 cursor-not-allowed"
                )}
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Report...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>Generate Report</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate("/home")}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Return to Global Map
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Back to Global Map"
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
            <h1 className="text-base font-bold text-white">{currentCountry.name}</h1>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Strategic Assessment</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* OHI Score */}
          {ohiScore !== null && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <ADLIcon className="w-4 h-4" />
              <span className="text-sm font-bold text-cyan-400">{ohiScore.toFixed(1)}</span>
            </div>
          )}
          
          {/* Cached indicator */}
          {report?.cached && (
            <span className="px-2 py-1 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              Cached
            </span>
          )}
          
          {/* Admin Regenerate Button */}
          {isAdmin && (
            <button
              onClick={() => handleGenerate(true)}
              disabled={isRegenerating || reportLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-medium transition-colors disabled:opacity-50"
              title="Regenerate Report (Admin Only)"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", (isRegenerating || reportLoading) && "animate-spin")} />
              <span>Regenerate</span>
            </button>
          )}
          
          {/* Export PDF Button */}
          <button
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-medium transition-colors"
            title="Export PDF Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </header>
      
      {/* Document Viewer Container */}
      <main className="flex-1 p-4 overflow-hidden flex items-center justify-center">
        <div className="w-full h-full max-w-6xl">
          {/* Paper-like Document */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full bg-slate-800/80 rounded-2xl border border-slate-600/50 shadow-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Document Header */}
            <div className="flex-shrink-0 px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800 to-slate-800/50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">Executive Summary</h2>
                  <p className="text-xs text-white/50 mt-0.5">{currentCountry.name} — Occupational Health Strategic Assessment</p>
                </div>
                <div className="flex items-center gap-2">
                  <ADLIcon className="w-8 h-8 opacity-50" />
                </div>
              </div>
            </div>
            
            {/* Document Content */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left: Report Content */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col">
                {reportLoading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-white/50">Generating strategic assessment...</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                    {/* Executive Summary Text */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                      <div className="h-full overflow-y-auto pr-2 space-y-3 scrollbar-thin">
                        {report?.executive_summary.map((para, i) => (
                          <p key={i} className="text-sm text-white/80 leading-relaxed">
                            {para}
                          </p>
                        ))}
                        
                        {report?.overall_assessment && (
                          <div className="pt-3 mt-3 border-t border-white/10">
                            <p className="text-sm text-white/80 leading-relaxed">
                              <span className="font-semibold text-cyan-400">Strategic Outlook: </span>
                              {report.overall_assessment}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Strategic Priorities */}
                    <div className="flex-shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-amber-400" />
                        <h3 className="text-sm font-semibold text-white">Strategic Priorities</h3>
                        <span className="text-[10px] text-white/40">(Click to explore)</span>
                      </div>
                      
                      <div className="space-y-2">
                        {report?.strategic_priorities.slice(0, 3).map((priority, i) => (
                          <ClickablePriority
                            key={i}
                            priority={priority}
                            index={i}
                            countryIso={currentCountry.iso_code}
                            onNavigate={(route) => navigate(route, { state: { from: 'summary' } })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Right: Sidebar */}
              <div className="w-72 flex-shrink-0 border-l border-slate-700/50 p-4 flex flex-col gap-4 overflow-hidden bg-slate-800/30">
                {/* Framework Pillars */}
                <div className="flex-shrink-0">
                  <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Framework Pillars</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {PILLARS.map(pillar => {
                      const score = currentCountry[pillar.scoreField as keyof typeof currentCountry] as number | null;
                      return (
                        <PillarNavButton
                          key={pillar.id}
                          pillar={pillar}
                          score={score}
                          countryIso={currentCountry.iso_code}
                          onNavigate={() => navigate(`/country/${currentCountry.iso_code}/${pillar.route}`, { state: { from: 'summary' } })}
                        />
                      );
                    })}
                  </div>
                </div>
                
                {/* Global Positioning */}
                <div className="flex-1 min-h-0 flex flex-col">
                  <h3 className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Global Positioning</h3>
                  
                  {/* Comparison Selector */}
                  <div className="relative mb-2">
                    <button
                      onClick={() => setShowComparisonDropdown(!showComparisonDropdown)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                    >
                      {comparisonCountry ? (
                        <>
                          <CountryFlag isoCode={comparisonCountry.iso_code} flagUrl={comparisonCountry.flag_url} size="xs" />
                          <span className="text-white flex-1 text-left truncate">{comparisonCountry.name}</span>
                        </>
                      ) : (
                        <>
                          <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="text-white/70 flex-1 text-left">Global Average</span>
                        </>
                      )}
                      <ChevronDown className={cn("w-3.5 h-3.5 text-white/50 transition-transform", showComparisonDropdown && "rotate-180")} />
                    </button>
                    
                    <AnimatePresence>
                      {showComparisonDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                        >
                          <button
                            onClick={() => { setComparisonIso(null); setShowComparisonDropdown(false); }}
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-white/5",
                              !comparisonIso && "bg-white/10"
                            )}
                          >
                            <Globe2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="text-white">Global Average</span>
                          </button>
                          
                          {leaders.map(leader => (
                            <button
                              key={leader.iso_code}
                              onClick={() => { setComparisonIso(leader.iso_code); setShowComparisonDropdown(false); }}
                              className={cn(
                                "w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-white/5",
                                comparisonIso === leader.iso_code && "bg-white/10"
                              )}
                            >
                              <CountryFlag isoCode={leader.iso_code} flagUrl={leader.flag_url} size="xs" />
                              <span className="text-white flex-1 text-left truncate">{leader.name}</span>
                              <span className="text-white/50">{leader.ohi?.toFixed(0)}%</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  {/* Top Leaders */}
                  <div className="mb-2">
                    <p className="text-[10px] text-white/40 mb-1.5">Top Performers</p>
                    <div className="flex gap-1">
                      {leaders.slice(0, 5).map((leader, idx) => (
                        <button
                          key={leader.iso_code}
                          onClick={() => setComparisonIso(leader.iso_code)}
                          className={cn(
                            "flex-1 flex flex-col items-center p-1 rounded transition-colors",
                            comparisonIso === leader.iso_code 
                              ? "bg-cyan-500/20 ring-1 ring-cyan-500/40" 
                              : "bg-white/5 hover:bg-white/10"
                          )}
                          title={leader.name}
                        >
                          <CountryFlag isoCode={leader.iso_code} flagUrl={leader.flag_url} size="xs" />
                          <span className={cn(
                            "text-[9px] mt-0.5",
                            idx === 0 ? "text-amber-400 font-bold" : "text-white/50"
                          )}>
                            #{idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Radar Chart */}
                  <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis 
                          dataKey="dimension" 
                          tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 9 }} 
                        />
                        <PolarRadiusAxis 
                          domain={[0, 100]} 
                          tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8 }}
                          axisLine={false}
                          tickCount={4}
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
                          name={comparisonCountry?.name || "Global Avg"}
                          dataKey="benchmark"
                          stroke="#a78bfa"
                          fill="#a78bfa"
                          fillOpacity={0.15}
                          strokeWidth={1.5}
                          strokeDasharray="3 3"
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "#1e293b", 
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "6px",
                            fontSize: "10px",
                          }}
                          labelStyle={{ color: "white" }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: "5px" }}
                          formatter={(value) => <span className="text-white/60 text-[9px]">{value}</span>}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Document Footer */}
            <div className="flex-shrink-0 px-6 py-2 border-t border-slate-700/50 bg-slate-800/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ADLIcon className="w-4 h-4 opacity-40" />
                <span className="text-[10px] text-white/30">Arthur D. Little — Occupational Health Intelligence Platform</span>
              </div>
              <span className="text-[10px] text-white/30">
                {report?.generated_at ? new Date(report.generated_at).toLocaleDateString() : new Date().toLocaleDateString()}
              </span>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}

export default OverallSummary;
