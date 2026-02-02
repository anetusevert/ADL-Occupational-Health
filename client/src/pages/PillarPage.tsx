/**
 * Arthur D. Little - Global Health Platform
 * Pillar Page
 * 
 * Generic page component for individual pillar analysis.
 * Shows architecture map, AI analysis, and benchmark comparison.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
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
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { apiClient, aiApiClient } from "../services/api";
import { CountryFlag } from "../components/CountryFlag";
import { PillarArchitectureMap } from "../components/architecture";
import { getArchitecture, type PillarArchitecture } from "../lib/architectureDefinitions";
import type { GeoJSONMetadataResponse } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

type PillarId = "governance" | "hazard-control" | "vigilance" | "restoration";

interface PillarConfig {
  id: PillarId;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  scoreField: string;
}

const PILLAR_CONFIGS: Record<PillarId, PillarConfig> = {
  governance: {
    id: "governance",
    name: "Governance",
    subtitle: "Strategic Capacity",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    scoreField: "governance_score",
  },
  "hazard-control": {
    id: "hazard-control",
    name: "Hazard Control",
    subtitle: "Prevention & Risk",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    scoreField: "pillar1_score",
  },
  vigilance: {
    id: "vigilance",
    name: "Vigilance",
    subtitle: "Surveillance & Detection",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/10",
    borderColor: "border-teal-500/30",
    scoreField: "pillar2_score",
  },
  restoration: {
    id: "restoration",
    name: "Restoration",
    subtitle: "Compensation & Recovery",
    icon: HeartPulse,
    color: "text-amber-400",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    scoreField: "pillar3_score",
  },
};

// ============================================================================
// AI ANALYSIS TYPES
// ============================================================================

interface KeyInsight {
  insight: string;
  implication: string;
}

interface Recommendation {
  action: string;
  rationale: string;
  expected_impact: string;
}

interface PillarAnalysisData {
  title: string;
  analysis_paragraphs: string[];
  key_insights: KeyInsight[];
  recommendations: Recommendation[];
  generated_at: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateClientFallback(pillarId: string, countryName: string): PillarAnalysisData {
  const titles: Record<string, string> = {
    governance: "Governance & Strategic Capacity Assessment",
    "hazard-control": "Hazard Control & Prevention Analysis",
    vigilance: "Surveillance & Health Vigilance Review",
    restoration: "Restoration & Compensation Architecture Analysis",
  };

  const descriptions: Record<string, string[]> = {
    governance: [
      `This analysis examines ${countryName}'s occupational health governance architecture, including ILO convention ratification, labor inspection capacity, and strategic policy frameworks.`,
      "Effective governance requires alignment between international commitments, national legislation, and institutional capacity for enforcement.",
      "The architecture map highlights key components and identifies where global leaders excel in building robust governance infrastructure."
    ],
    "hazard-control": [
      `${countryName}'s hazard control infrastructure encompasses occupational exposure limits, workplace safety standards, and prevention mechanisms.`,
      "A comprehensive control framework includes both regulatory standards and operational capacity to monitor, enforce, and continuously improve workplace safety.",
      "Component-level analysis reveals specific areas where targeted investment could significantly reduce occupational hazard exposure."
    ],
    vigilance: [
      `The vigilance architecture for ${countryName} covers health surveillance systems, disease detection capabilities, and vulnerable population monitoring.`,
      "Effective surveillance requires both systematic screening programs and robust reporting mechanisms to capture emerging occupational health threats.",
      "Gaps in detection capacity often lead to underreporting of occupational diseases and delayed intervention for affected workers."
    ],
    restoration: [
      `${countryName}'s restoration architecture follows the ILO framework for workers' compensation and rehabilitation, from acute care through return-to-work.`,
      "The rehabilitation chain—medical, vocational, and social reintegration—determines how effectively injured workers recover and return to productive employment.",
      "Payer architecture and legal frameworks establish who bears responsibility and how quickly affected workers receive support."
    ],
  };

  return {
    title: titles[pillarId] || "Pillar Analysis",
    analysis_paragraphs: descriptions[pillarId] || ["Analysis content is being generated."],
    key_insights: [
      { insight: "Architecture component assessment available", implication: "Explore each component for detailed scoring" },
      { insight: "Global leader benchmarks shown", implication: "Top 3 performers identified for each component" }
    ],
    recommendations: [
      { 
        action: "Review component-level gaps", 
        rationale: "Targeted improvement requires identifying specific weaknesses", 
        expected_impact: "Focused resource allocation for maximum impact" 
      }
    ],
    generated_at: new Date().toISOString(),
  };
}

async function fetchPillarAnalysis(
  isoCode: string,
  pillarId: string,
  comparisonIso: string | null
): Promise<PillarAnalysisData> {
  // Try the AI endpoint for pillar analysis
  try {
    const requestBody: Record<string, string> = {
      comparison_country: comparisonIso || "global",
    };
    
    const response = await aiApiClient.post(
      `/api/v1/pillar-analysis/${isoCode}/${pillarId}`,
      requestBody,
      { timeout: 120000 }
    );
    
    if (response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn("[PillarPage] AI analysis unavailable, using fallback", error);
  }
  
  // Return client-side fallback
  return generateClientFallback(pillarId, isoCode);
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface CountrySelectorProps {
  currentIso: string;
  currentName: string;
  currentFlagUrl?: string;
  selectedComparisonIso: string | null;
  countries: Array<{
    iso_code: string;
    name: string;
    flag_url?: string;
    score: number | null;
  }>;
  onSelect: (iso: string | null) => void;
}

function CountrySelector({
  currentIso,
  currentName,
  currentFlagUrl,
  selectedComparisonIso,
  countries,
  onSelect,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Get top 5 leaders
  const leaders = useMemo(() => {
    return countries
      .filter(c => c.score !== null && c.iso_code !== currentIso)
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 5);
  }, [countries, currentIso]);
  
  const selectedCountry = selectedComparisonIso
    ? countries.find(c => c.iso_code === selectedComparisonIso)
    : null;
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
          "bg-white/5 hover:bg-white/10 border border-white/10"
        )}
      >
        {selectedCountry ? (
          <>
            <CountryFlag isoCode={selectedCountry.iso_code} flagUrl={selectedCountry.flag_url} size="xs" />
            <span className="text-white">{selectedCountry.name}</span>
          </>
        ) : (
          <>
            <Globe2 className="w-4 h-4 text-white/50" />
            <span className="text-white/70">Global Benchmark</span>
          </>
        )}
        <ChevronDown className={cn("w-4 h-4 text-white/50 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute top-full right-0 mt-1 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Global option */}
            <button
              onClick={() => { onSelect(null); setIsOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5",
                !selectedComparisonIso && "bg-white/10"
              )}
            >
              <Globe2 className="w-5 h-5 text-cyan-400" />
              <span className="text-white">Global Benchmark</span>
            </button>
            
            {/* Top 5 Leaders */}
            <div className="border-t border-white/10 pt-1">
              <p className="px-3 py-1 text-xs text-white/40 font-medium">Top 5 Leaders</p>
              {leaders.map(country => (
                <button
                  key={country.iso_code}
                  onClick={() => { onSelect(country.iso_code); setIsOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-white/5",
                    selectedComparisonIso === country.iso_code && "bg-white/10"
                  )}
                >
                  <CountryFlag isoCode={country.iso_code} flagUrl={country.flag_url} size="xs" />
                  <span className="text-white flex-1 text-left">{country.name}</span>
                  <span className="text-white/50 text-xs">{country.score?.toFixed(0)}%</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

// Valid pillar IDs
const VALID_PILLARS = ["governance", "hazard-control", "vigilance", "restoration"];

export function PillarPage() {
  const { iso, pillar } = useParams<{ iso: string; pillar: string }>();
  const navigate = useNavigate();
  const [comparisonIso, setComparisonIso] = useState<string | null>(null);
  
  // Handle "summary" route - redirect to OverallSummary
  if (pillar === "summary") {
    return <Navigate to={`/country/${iso}/summary`} replace />;
  }
  
  // Validate pillar - must be one of the valid pillars
  const isValidPillar = pillar && VALID_PILLARS.includes(pillar);
  const pillarConfig = isValidPillar ? PILLAR_CONFIGS[pillar as PillarId] : null;
  const architecture = isValidPillar ? getArchitecture(pillar) : null;
  
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
  
  // Transform countries for architecture map (needs Record<string, unknown> format)
  const allCountriesData = useMemo(() => {
    return (geoData?.countries || []).map(c => ({
      iso_code: c.iso_code,
      code: c.iso_code,
      name: c.name,
      flag_url: c.flag_url,
      governance_score: c.governance_score,
      pillar1_score: c.pillar1_score,
      pillar2_score: c.pillar2_score,
      pillar3_score: c.pillar3_score,
      maturity_score: c.maturity_score,
      // Add mapped fields for architecture
      strategic_capacity_score: c.governance_score,
      control_maturity_score: c.pillar1_score,
      disease_detection_rate: c.pillar2_score,
      rehab_access_score: c.pillar3_score,
    })) as Record<string, unknown>[];
  }, [geoData]);
  
  // Get pillar score for comparison selector
  const countryScores = useMemo(() => {
    if (!pillarConfig) return [];
    return allCountriesData.map(c => ({
      iso_code: String(c.iso_code),
      name: String(c.name),
      flag_url: c.flag_url as string | undefined,
      score: c[pillarConfig.scoreField] as number | null,
    }));
  }, [allCountriesData, pillarConfig]);
  
  // Fetch AI analysis
  const { 
    data: analysis, 
    isLoading: analysisLoading,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ["pillar-analysis", iso, pillar, comparisonIso],
    queryFn: () => fetchPillarAnalysis(iso!, pillar!, comparisonIso),
    enabled: !!iso && !!pillar,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  
  // Loading state
  if (geoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }
  
  // Error state
  if (geoError || !currentCountry || !pillarConfig || !architecture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {!currentCountry ? "Country Not Found" : !pillarConfig ? "Invalid Pillar" : "Error Loading Data"}
          </h2>
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
  
  const Icon = pillarConfig.icon;
  const pillarScore = currentCountry[pillarConfig.scoreField as keyof typeof currentCountry] as number | null;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <header className={cn(
        "flex items-center justify-between px-6 py-4 border-b",
        pillarConfig.borderColor,
        pillarConfig.bgColor
      )}>
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
              <div className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center",
                pillarConfig.bgColor,
                pillarConfig.borderColor,
                "border"
              )}>
                <Icon className={cn("w-4 h-4", pillarConfig.color)} />
              </div>
              <span className={cn("text-sm font-medium", pillarConfig.color)}>
                {pillarConfig.name}
              </span>
              <span className="text-sm text-white/50">
                {pillarConfig.subtitle}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Pillar Score */}
          {pillarScore !== null && (
            <div className={cn(
              "px-4 py-2 rounded-xl",
              pillarConfig.bgColor,
              pillarConfig.borderColor,
              "border"
            )}>
              <span className={cn("text-2xl font-bold", pillarConfig.color)}>
                {pillarScore.toFixed(0)}%
              </span>
            </div>
          )}
          
          {/* Comparison Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-white/50">Compare:</span>
            <CountrySelector
              currentIso={currentCountry.iso_code}
              currentName={currentCountry.name}
              currentFlagUrl={currentCountry.flag_url}
              selectedComparisonIso={comparisonIso}
              countries={countryScores}
              onSelect={setComparisonIso}
            />
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Architecture Map */}
        <div className="flex-1 p-6 overflow-y-auto">
          <PillarArchitectureMap
            architecture={architecture}
            currentCountry={allCountriesData.find(c => c.iso_code === iso) || {}}
            allCountries={allCountriesData}
          />
        </div>
        
        {/* Right: AI Analysis Panel */}
        <div className={cn(
          "w-[420px] border-l flex flex-col",
          pillarConfig.borderColor,
          pillarConfig.bgColor
        )}>
          {/* Panel Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className={cn("w-5 h-5", pillarConfig.color)} />
              <span className="text-sm font-semibold text-white">AI Analysis</span>
            </div>
            <button
              onClick={() => refetchAnalysis()}
              disabled={analysisLoading}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <RefreshCw className={cn(
                "w-4 h-4 text-white/50",
                analysisLoading && "animate-spin"
              )} />
            </button>
          </div>
          
          {/* Panel Content */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {analysisLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
                  <p className="text-sm text-white/50">Generating analysis...</p>
                </div>
              </div>
            ) : analysisError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-white/50">Unable to load analysis</p>
              </div>
            ) : analysis ? (
              <>
                {/* Title */}
                <h3 className="text-base font-semibold text-white">
                  {analysis.title}
                </h3>
                
                {/* Paragraphs */}
                <div className="space-y-3">
                  {analysis.analysis_paragraphs.map((para, i) => (
                    <p key={i} className="text-sm text-white/70 leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
                
                {/* Key Insights */}
                {analysis.key_insights.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                        Key Insights
                      </span>
                    </div>
                    <div className="space-y-3">
                      {analysis.key_insights.map((insight, i) => (
                        <div key={i} className="bg-white/5 rounded-lg p-3">
                          <p className="text-sm font-medium text-white mb-1">{insight.insight}</p>
                          <p className="text-xs text-white/50">{insight.implication}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Recommendations */}
                {analysis.recommendations.length > 0 && (
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <ArrowRight className={cn("w-4 h-4", pillarConfig.color)} />
                      <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
                        Recommendations
                      </span>
                    </div>
                    <div className="space-y-3">
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className={cn(
                          "rounded-lg p-3 border",
                          pillarConfig.bgColor,
                          pillarConfig.borderColor
                        )}>
                          <p className={cn("text-sm font-medium mb-1", pillarConfig.color)}>
                            {rec.action}
                          </p>
                          <p className="text-xs text-white/60 mb-2">{rec.rationale}</p>
                          <p className="text-xs text-white/40">
                            <span className="font-medium">Impact:</span> {rec.expected_impact}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

export default PillarPage;
