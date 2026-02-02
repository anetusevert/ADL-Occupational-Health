/**
 * Arthur D. Little - Global Health Platform
 * Overall Summary Page
 * 
 * 4-Quadrant expandable design:
 * 1. The Report (scrollable executive summary)
 * 2. Strategic Priorities
 * 3. Framework Pillars
 * 4. Global Positioning
 * 
 * Click any quadrant to expand and view details.
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
  PlayCircle,
  CheckCircle2,
  X,
  BarChart3,
  TrendingUp,
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

type QuadrantType = "report" | "priorities" | "pillars" | "positioning";

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
    { timeout: 300000 } // 5 minutes for LLM generation
  );
  
  if (response.data) {
    return response.data;
  }
  
  throw new Error("No data returned");
}

// Generate PDF report
function generatePDFReport(
  report: SummaryReportData,
  countryName: string,
  ohiScore: number | null,
  pillars: Array<{ name: string; score: number | null }>
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${countryName} - Strategic Assessment Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.7;
          color: #1a1a2e;
          padding: 50px;
          max-width: 850px;
          margin: 0 auto;
          background: white;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 25px;
          border-bottom: 3px solid #0891b2;
        }
        .header h1 {
          font-size: 28px;
          color: #0f172a;
          margin-bottom: 8px;
          letter-spacing: -0.5px;
        }
        .header .subtitle {
          font-size: 14px;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .score-badge {
          display: inline-block;
          margin-top: 15px;
          padding: 8px 20px;
          background: linear-gradient(135deg, #0891b2 0%, #6366f1 100%);
          color: white;
          border-radius: 25px;
          font-size: 16px;
          font-weight: 600;
        }
        .section {
          margin-bottom: 35px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 15px;
          padding-bottom: 8px;
          border-bottom: 2px solid #e2e8f0;
        }
        .executive-summary p {
          margin-bottom: 18px;
          text-align: justify;
          font-size: 14px;
        }
        .pillar-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 15px;
          margin-top: 15px;
        }
        .pillar-card {
          padding: 15px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: #f8fafc;
        }
        .pillar-card h4 {
          font-size: 14px;
          color: #334155;
          margin-bottom: 5px;
        }
        .pillar-card .score {
          font-size: 24px;
          font-weight: 700;
          color: #0891b2;
        }
        .priority-item {
          padding: 15px;
          margin-bottom: 12px;
          border-left: 4px solid #f59e0b;
          background: #fffbeb;
          border-radius: 0 8px 8px 0;
        }
        .priority-item.high { border-left-color: #ef4444; background: #fef2f2; }
        .priority-item.medium { border-left-color: #f59e0b; background: #fffbeb; }
        .priority-item.low { border-left-color: #6b7280; background: #f9fafb; }
        .priority-item h4 {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 5px;
        }
        .priority-item p {
          font-size: 13px;
          color: #475569;
          margin-bottom: 5px;
        }
        .priority-item .meta {
          font-size: 11px;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .assessment-box {
          padding: 20px;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border: 1px solid #bae6fd;
          border-radius: 12px;
          font-size: 14px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 11px;
          color: #94a3b8;
        }
        @media print {
          body { padding: 30px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${countryName}</h1>
        <div class="subtitle">Occupational Health Strategic Assessment</div>
        ${ohiScore !== null ? `<div class="score-badge">OHI Score: ${ohiScore.toFixed(1)}</div>` : ''}
      </div>
      
      <div class="section executive-summary">
        <div class="section-title">Executive Summary</div>
        ${report.executive_summary.map(p => `<p>${p}</p>`).join('')}
      </div>
      
      <div class="section">
        <div class="section-title">Framework Pillars Performance</div>
        <div class="pillar-grid">
          ${pillars.map(p => `
            <div class="pillar-card">
              <h4>${p.name}</h4>
              <div class="score">${p.score !== null ? `${p.score.toFixed(0)}%` : 'N/A'}</div>
            </div>
          `).join('')}
        </div>
      </div>
      
      <div class="section">
        <div class="section-title">Strategic Priorities</div>
        ${report.strategic_priorities.map((p, i) => `
          <div class="priority-item ${p.urgency}">
            <h4>${i + 1}. ${p.priority}</h4>
            <p>${p.rationale}</p>
            <div class="meta">${p.pillar} • ${p.urgency.toUpperCase()} Priority</div>
          </div>
        `).join('')}
      </div>
      
      <div class="section">
        <div class="section-title">Strategic Assessment</div>
        <div class="assessment-box">
          ${report.overall_assessment}
        </div>
      </div>
      
      <div class="footer">
        <p>Arthur D. Little — Occupational Health Intelligence Platform</p>
        <p>Generated: ${new Date(report.generated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Trigger print after content loads
  setTimeout(() => {
    printWindow.print();
  }, 500);
}

// ============================================================================
// QUADRANT COMPONENTS
// ============================================================================

interface QuadrantCardProps {
  title: string;
  icon: React.ElementType;
  isActive: boolean;
  onClick: () => void;
  preview: React.ReactNode;
  expanded: React.ReactNode;
  className?: string;
}

function QuadrantCard({ title, icon: Icon, isActive, onClick, preview, expanded, className }: QuadrantCardProps) {
  return (
    <motion.div
      layout
      onClick={!isActive ? onClick : undefined}
      className={cn(
        "rounded-xl border transition-all overflow-hidden",
        isActive 
          ? "bg-slate-800/90 border-cyan-500/50 col-span-2 row-span-2" 
          : "bg-slate-800/50 border-slate-700/50 hover:border-cyan-500/30 cursor-pointer hover:bg-slate-800/70",
        className
      )}
    >
      {isActive ? (
        <div className="h-full flex flex-col">
          {/* Expanded Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-800/50">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-cyan-400" />
              <h3 className="font-semibold text-white">{title}</h3>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onClick(); }}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>
          {/* Expanded Content */}
          <div className="flex-1 overflow-hidden">
            {expanded}
          </div>
        </div>
      ) : (
        <div className="h-full p-4 flex flex-col">
          {/* Collapsed Header */}
          <div className="flex items-center gap-2 mb-3">
            <Icon className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-medium text-white">{title}</h3>
          </div>
          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            {preview}
          </div>
          <div className="mt-2 text-[10px] text-cyan-400/60 text-center">Click to expand</div>
        </div>
      )}
    </motion.div>
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
  const [activeQuadrant, setActiveQuadrant] = useState<QuadrantType | null>("report");
  const [comparisonIso, setComparisonIso] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showComparisonDropdown, setShowComparisonDropdown] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [fallbackReport, setFallbackReport] = useState<SummaryReportData | null>(null);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [batchGenerationStatus, setBatchGenerationStatus] = useState<{
    completed: number;
    total: number;
    message: string;
  } | null>(null);
  
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
      try {
        return await fetchSummaryReport(iso!, comparisonIso);
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw error;
        }
        console.warn("[OverallSummary] API error, using fallback:", error);
        if (currentCountry) {
          return generateSummaryFallback(currentCountry.name, scores);
        }
        throw error;
      }
    },
    enabled: !!iso && !!currentCountry,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  
  // Check if error is "not generated" (404)
  const isNotGenerated = reportError && 
    (reportError as any)?.response?.status === 404;
  
  // Handle generate/regenerate (admin only)
  const handleGenerate = async (forceRegenerate: boolean = false) => {
    if (!isAdmin || !iso) return;
    
    setIsRegenerating(true);
    setGenerationError(null);
    try {
      await fetchSummaryReport(iso, comparisonIso, forceRegenerate);
      queryClient.invalidateQueries({ queryKey: ["summary-report", iso] });
      setFallbackReport(null);
      refetchReport();
    } catch (error: any) {
      console.error("Generation failed:", error);
      
      const isTimeout = error.code === 'ECONNABORTED' || 
                       error.message?.includes('timeout') ||
                       error.message?.includes('exceeded');
      
      if (isTimeout) {
        setGenerationError("Generation timed out. Using estimated data.");
        if (currentCountry) {
          const fallback = generateSummaryFallback(currentCountry.name, scores);
          setFallbackReport(fallback);
        }
      } else if (error.response?.status === 403) {
        setGenerationError("Admin access required for regeneration.");
      } else if (error.response?.status === 404) {
        setGenerationError("Report generation service unavailable.");
      } else {
        setGenerationError("Generation failed. Using estimated data.");
        if (currentCountry) {
          const fallback = generateSummaryFallback(currentCountry.name, scores);
          setFallbackReport(fallback);
        }
      }
    } finally {
      setIsRegenerating(false);
    }
  };
  
  // Handle batch generation of all reports
  const handleBatchGenerate = async () => {
    if (!isAdmin || !iso) return;
    
    setIsBatchGenerating(true);
    setBatchGenerationStatus(null);
    
    try {
      const response = await aiApiClient.post<{
        iso_code: string;
        total: number;
        completed: number;
        in_progress: string;
        results: Record<string, string>;
        message: string;
      }>(
        `/api/v1/batch-generate/${iso}`,
        {},
        { timeout: 600000 }
      );
      
      setBatchGenerationStatus({
        completed: response.data.completed,
        total: response.data.total,
        message: response.data.message,
      });
      
      queryClient.invalidateQueries({ queryKey: ["pillar-analysis", iso] });
      queryClient.invalidateQueries({ queryKey: ["summary-report", iso] });
      refetchReport();
    } catch (error: any) {
      console.error("Batch generation error:", error);
      setBatchGenerationStatus({
        completed: 0,
        total: 5,
        message: error.response?.data?.detail || "Batch generation failed",
      });
    } finally {
      setIsBatchGenerating(false);
    }
  };
  
  // Handle PDF export
  const handleExportPDF = () => {
    const reportData = report || fallbackReport;
    if (!reportData || !currentCountry) return;
    
    const pillarsData = PILLARS.map(p => ({
      name: p.name,
      score: currentCountry[p.scoreField as keyof typeof currentCountry] as number | null,
    }));
    
    generatePDFReport(reportData, currentCountry.name, ohiScore, pillarsData);
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
  
  // All countries for comparison
  const allCountriesForComparison = useMemo(() => {
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [geoData, iso]);
  
  // Top 5 leaders
  const leaders = useMemo(() => {
    return [...allCountriesForComparison]
      .sort((a, b) => (b.ohi ?? 0) - (a.ohi ?? 0))
      .slice(0, 5);
  }, [allCountriesForComparison]);
  
  // Filtered countries for search
  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return allCountriesForComparison;
    const query = countrySearchQuery.toLowerCase();
    return allCountriesForComparison.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.iso_code.toLowerCase().includes(query)
    );
  }, [allCountriesForComparison, countrySearchQuery]);
  
  // Toggle quadrant
  const toggleQuadrant = (quadrant: QuadrantType) => {
    setActiveQuadrant(activeQuadrant === quadrant ? null : quadrant);
  };
  
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
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/home", { state: { openPillarModal: iso } })}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white/60" />
            </button>
            <CountryFlag isoCode={currentCountry.iso_code} flagUrl={currentCountry.flag_url} size="md" className="shadow-lg" />
            <div>
              <h1 className="text-base font-bold text-white">{currentCountry.name}</h1>
              <div className="flex items-center gap-1.5">
                <FileText className="w-3 h-3 text-cyan-400" />
                <span className="text-xs font-medium text-cyan-400">Strategic Assessment</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-cyan-500/10 border border-cyan-500/30">
              {isAdmin ? <Sparkles className="w-8 h-8 text-cyan-400" /> : <Lock className="w-8 h-8 text-white/40" />}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {isAdmin ? "Report Not Yet Generated" : "Report Pending Generation"}
            </h2>
            <p className="text-sm text-white/60 mb-6">
              {isAdmin 
                ? `The strategic assessment for ${currentCountry.name} has not been generated yet.`
                : `The strategic assessment for ${currentCountry.name} is not yet available.`
              }
            </p>
            {isAdmin ? (
              <button
                onClick={() => handleGenerate(false)}
                disabled={isRegenerating}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                  "bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30",
                  isRegenerating && "opacity-50 cursor-not-allowed"
                )}
              >
                {isRegenerating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /><span>Generating...</span></>
                ) : (
                  <><Sparkles className="w-5 h-5" /><span>Generate Report</span></>
                )}
              </button>
            ) : (
              <button
                onClick={() => navigate("/home", { state: { openPillarModal: iso } })}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Return to Country Options
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }
  
  const reportData = report || fallbackReport;
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-purple-500/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/home", { state: { openPillarModal: iso } })}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Back to Country Options"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <CountryFlag isoCode={currentCountry.iso_code} flagUrl={currentCountry.flag_url} size="md" className="shadow-lg" />
          <div>
            <h1 className="text-base font-bold text-white">{currentCountry.name}</h1>
            <div className="flex items-center gap-1.5">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-400">Strategic Assessment</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {ohiScore !== null && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30">
              <ADLIcon className="w-4 h-4" />
              <span className="text-sm font-bold text-cyan-400">{ohiScore.toFixed(1)}</span>
            </div>
          )}
          
          {report?.cached && (
            <span className="px-2 py-1 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              Cached
            </span>
          )}
          
          {isAdmin && (
            <>
              <button
                onClick={handleBatchGenerate}
                disabled={isBatchGenerating || reportLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-medium transition-colors disabled:opacity-50"
                title="Generate All Reports"
              >
                {isBatchGenerating ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Generating...</span></>
                ) : batchGenerationStatus?.completed === 5 ? (
                  <><CheckCircle2 className="w-3.5 h-3.5" /><span>All Ready</span></>
                ) : (
                  <><PlayCircle className="w-3.5 h-3.5" /><span>Generate All</span></>
                )}
              </button>
              
              <button
                onClick={() => handleGenerate(true)}
                disabled={isRegenerating || reportLoading}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-medium transition-colors disabled:opacity-50"
                title="Regenerate Report"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", (isRegenerating || reportLoading) && "animate-spin")} />
                <span>Regenerate</span>
              </button>
            </>
          )}
          
          <button
            onClick={handleExportPDF}
            disabled={!reportData}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-medium transition-colors disabled:opacity-50"
            title="Export PDF Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </header>
      
      {/* 4-Quadrant Grid */}
      <main className="flex-1 p-4 overflow-hidden">
        {reportLoading || isRegenerating ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
              <p className="text-sm text-white/50">{isRegenerating ? "Generating assessment..." : "Loading report..."}</p>
            </div>
          </div>
        ) : (
          <motion.div 
            layout
            className="h-full grid gap-3"
            style={{
              gridTemplateColumns: activeQuadrant ? "1fr" : "1fr 1fr",
              gridTemplateRows: activeQuadrant ? "1fr" : "1fr 1fr",
            }}
          >
            {/* Quadrant 1: The Report */}
            {(!activeQuadrant || activeQuadrant === "report") && (
              <QuadrantCard
                title="The Report"
                icon={FileText}
                isActive={activeQuadrant === "report"}
                onClick={() => toggleQuadrant("report")}
                preview={
                  <div className="space-y-2">
                    <p className="text-xs text-white/60 line-clamp-4">
                      {reportData?.executive_summary[0]}
                    </p>
                    <div className="text-[10px] text-white/40">
                      {reportData?.executive_summary.length || 0} sections • Scroll to read
                    </div>
                  </div>
                }
                expanded={
                  <div className="h-full p-4 overflow-y-auto">
                    {generationError && (
                      <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        <p className="text-xs text-amber-300">{generationError}</p>
                      </div>
                    )}
                    <div className="prose prose-sm prose-invert max-w-none">
                      <h2 className="text-xl font-bold text-white mb-4">Executive Summary</h2>
                      {reportData?.executive_summary.map((para, i) => (
                        <p key={i} className="text-sm text-white/80 leading-relaxed mb-4">
                          {para}
                        </p>
                      ))}
                      {reportData?.overall_assessment && (
                        <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                          <h3 className="text-sm font-semibold text-cyan-400 mb-2">Strategic Assessment</h3>
                          <p className="text-sm text-white/80">{reportData.overall_assessment}</p>
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            )}
            
            {/* Quadrant 2: Strategic Priorities */}
            {(!activeQuadrant || activeQuadrant === "priorities") && (
              <QuadrantCard
                title="Strategic Priorities"
                icon={Target}
                isActive={activeQuadrant === "priorities"}
                onClick={() => toggleQuadrant("priorities")}
                preview={
                  <div className="space-y-2">
                    {reportData?.strategic_priorities.slice(0, 2).map((p, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={cn(
                          "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0",
                          p.urgency === "high" ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                        )}>
                          {i + 1}
                        </span>
                        <span className="text-xs text-white/70 line-clamp-1">{p.priority}</span>
                      </div>
                    ))}
                    <div className="text-[10px] text-white/40 pt-1">
                      {reportData?.strategic_priorities.length || 0} priorities identified
                    </div>
                  </div>
                }
                expanded={
                  <div className="h-full p-4 overflow-y-auto">
                    <div className="space-y-3">
                      {reportData?.strategic_priorities.map((priority, i) => {
                        const pillarConfig = PILLARS.find(p => p.name === priority.pillar);
                        const Icon = pillarConfig?.icon || Target;
                        return (
                          <motion.button
                            key={i}
                            onClick={() => {
                              const route = PILLAR_NAME_TO_ROUTE[priority.pillar];
                              if (route) navigate(`/country/${currentCountry.iso_code}/${route}`, { state: { from: 'summary' } });
                            }}
                            whileHover={{ scale: 1.01, x: 4 }}
                            className={cn(
                              "w-full p-4 rounded-xl border text-left transition-all",
                              priority.urgency === "high" 
                                ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20" 
                                : priority.urgency === "medium"
                                  ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                                  : "bg-slate-700/50 border-slate-600 hover:bg-slate-700"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold text-white/60">
                                {i + 1}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-white">{priority.priority}</h4>
                                  <span className={cn(
                                    "px-2 py-0.5 rounded text-[10px] font-medium uppercase",
                                    priority.urgency === "high" ? "bg-red-500/20 text-red-400" :
                                    priority.urgency === "medium" ? "bg-amber-500/20 text-amber-400" :
                                    "bg-slate-600 text-slate-300"
                                  )}>
                                    {priority.urgency}
                                  </span>
                                </div>
                                <p className="text-sm text-white/60 mb-3">{priority.rationale}</p>
                                {priority.pillar && (
                                  <div className={cn(
                                    "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs",
                                    pillarConfig?.bgColor || "bg-white/10",
                                    pillarConfig?.borderColor || "border-white/20",
                                    "border"
                                  )}>
                                    <Icon className={cn("w-3 h-3", pillarConfig?.color || "text-white/60")} />
                                    <span className={pillarConfig?.color || "text-white/60"}>{priority.pillar}</span>
                                    <ChevronRight className="w-3 h-3 text-white/40" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                }
              />
            )}
            
            {/* Quadrant 3: Framework Pillars */}
            {(!activeQuadrant || activeQuadrant === "pillars") && (
              <QuadrantCard
                title="Framework Pillars"
                icon={BarChart3}
                isActive={activeQuadrant === "pillars"}
                onClick={() => toggleQuadrant("pillars")}
                preview={
                  <div className="grid grid-cols-2 gap-2">
                    {PILLARS.map(pillar => {
                      const score = currentCountry[pillar.scoreField as keyof typeof currentCountry] as number | null;
                      const Icon = pillar.icon;
                      return (
                        <div key={pillar.id} className={cn("p-2 rounded-lg border", pillar.bgColor, pillar.borderColor)}>
                          <Icon className={cn("w-3 h-3 mb-1", pillar.color)} />
                          <div className={cn("text-sm font-bold", score && score >= 60 ? "text-emerald-400" : score && score >= 40 ? "text-amber-400" : "text-red-400")}>
                            {score?.toFixed(0) || "N/A"}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                }
                expanded={
                  <div className="h-full p-4 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                      {PILLARS.map(pillar => {
                        const score = currentCountry[pillar.scoreField as keyof typeof currentCountry] as number | null;
                        const Icon = pillar.icon;
                        return (
                          <motion.button
                            key={pillar.id}
                            onClick={() => navigate(`/country/${currentCountry.iso_code}/${pillar.route}`, { state: { from: 'summary' } })}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              "p-4 rounded-xl border text-left transition-all",
                              pillar.bgColor,
                              pillar.borderColor,
                              "hover:shadow-lg"
                            )}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", pillar.bgColor)}>
                                <Icon className={cn("w-5 h-5", pillar.color)} />
                              </div>
                              <div>
                                <h4 className="font-medium text-white">{pillar.name}</h4>
                                <p className="text-xs text-white/50">View details</p>
                              </div>
                            </div>
                            <div className="flex items-end justify-between">
                              <div className={cn(
                                "text-3xl font-bold",
                                score && score >= 60 ? "text-emerald-400" : 
                                score && score >= 40 ? "text-amber-400" : "text-red-400"
                              )}>
                                {score?.toFixed(0) || "N/A"}%
                              </div>
                              <ChevronRight className={cn("w-5 h-5", pillar.color)} />
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                }
              />
            )}
            
            {/* Quadrant 4: Global Positioning */}
            {(!activeQuadrant || activeQuadrant === "positioning") && (
              <QuadrantCard
                title="Global Positioning"
                icon={Globe2}
                isActive={activeQuadrant === "positioning"}
                onClick={() => toggleQuadrant("positioning")}
                preview={
                  <div className="h-full flex flex-col">
                    <div className="flex-1 -mx-2">
                      <ResponsiveContainer width="100%" height={100}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="rgba(255,255,255,0.1)" />
                          <Radar dataKey="current" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.3} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-[10px] text-white/40 text-center">
                      vs {comparisonCountry?.name || "Global Average"}
                    </div>
                  </div>
                }
                expanded={
                  <div className="h-full p-4 flex flex-col">
                    {/* Radar Chart */}
                    <div className="flex-1 min-h-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                          <PolarGrid stroke="rgba(255,255,255,0.15)" />
                          <PolarAngleAxis dataKey="dimension" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickCount={5} />
                          <Radar name={currentCountry.name} dataKey="current" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} strokeWidth={2} />
                          <Radar name={comparisonCountry?.name || "Global Avg"} dataKey="benchmark" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.2} strokeWidth={2} strokeDasharray="4 4" />
                          <Tooltip contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
                          <Legend formatter={(value) => <span className="text-white/70 text-xs">{value}</span>} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Comparison Selector */}
                    <div className="flex-shrink-0 mt-4 relative">
                      <p className="text-xs text-white/50 mb-2">Compare with</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowComparisonDropdown(!showComparisonDropdown); setCountrySearchQuery(""); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10"
                      >
                        {comparisonCountry ? (
                          <>
                            <CountryFlag isoCode={comparisonCountry.iso_code} flagUrl={comparisonCountry.flag_url} size="sm" className="w-5 h-4" />
                            <span className="text-white flex-1 text-left truncate">{comparisonCountry.name}</span>
                            <span className="text-white/50 text-xs">{getEffectiveOHIScore(comparisonCountry.maturity_score, comparisonCountry.governance_score, comparisonCountry.pillar1_score, comparisonCountry.pillar2_score, comparisonCountry.pillar3_score)?.toFixed(0)}%</span>
                          </>
                        ) : (
                          <>
                            <Globe2 className="w-4 h-4 text-cyan-400" />
                            <span className="text-white/70 flex-1 text-left">Global Average</span>
                          </>
                        )}
                        <ChevronDown className={cn("w-4 h-4 text-white/50 transition-transform", showComparisonDropdown && "rotate-180")} />
                      </button>
                      
                      <AnimatePresence>
                        {showComparisonDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute bottom-full left-0 right-0 mb-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="p-2 border-b border-white/10">
                              <input
                                type="text"
                                placeholder="Search countries..."
                                value={countrySearchQuery}
                                onChange={(e) => setCountrySearchQuery(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs bg-slate-700 border border-slate-600 rounded text-white placeholder-white/40 focus:outline-none focus:border-cyan-500"
                                autoFocus
                              />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              <button
                                onClick={() => { setComparisonIso(null); setShowComparisonDropdown(false); }}
                                className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5", !comparisonIso && "bg-cyan-500/20")}
                              >
                                <Globe2 className="w-4 h-4 text-cyan-400" />
                                <span className="text-white font-medium">Global Average</span>
                              </button>
                              
                              {!countrySearchQuery && (
                                <div className="px-3 py-1 bg-slate-700/50">
                                  <span className="text-[10px] text-amber-400 font-medium">Top Performers</span>
                                </div>
                              )}
                              {!countrySearchQuery && leaders.map((leader, idx) => (
                                <button
                                  key={`leader-${leader.iso_code}`}
                                  onClick={() => { setComparisonIso(leader.iso_code); setShowComparisonDropdown(false); }}
                                  className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5", comparisonIso === leader.iso_code && "bg-cyan-500/20")}
                                >
                                  <span className="w-4 text-center text-amber-400 text-[10px] font-bold">#{idx + 1}</span>
                                  <CountryFlag isoCode={leader.iso_code} flagUrl={leader.flag_url} size="sm" className="w-5 h-4" />
                                  <span className="text-white flex-1 text-left truncate">{leader.name}</span>
                                  <span className="text-white/50">{leader.ohi?.toFixed(0)}%</span>
                                </button>
                              ))}
                              
                              {!countrySearchQuery && <div className="px-3 py-1 bg-slate-700/50"><span className="text-[10px] text-white/40">All Countries (A-Z)</span></div>}
                              
                              {filteredCountries.map(country => (
                                <button
                                  key={country.iso_code}
                                  onClick={() => { setComparisonIso(country.iso_code); setShowComparisonDropdown(false); }}
                                  className={cn("w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5", comparisonIso === country.iso_code && "bg-cyan-500/20")}
                                >
                                  <CountryFlag isoCode={country.iso_code} flagUrl={country.flag_url} size="sm" className="w-5 h-4" />
                                  <span className="text-white flex-1 text-left truncate">{country.name}</span>
                                  <span className="text-white/50">{country.ohi?.toFixed(0)}%</span>
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    {/* Legend */}
                    <div className="flex-shrink-0 mt-4 pt-3 border-t border-slate-700/50">
                      <div className="flex items-center justify-center gap-6 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-cyan-500/40 border border-cyan-500" />
                          <span className="text-white/60">{currentCountry.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded bg-purple-500/30 border border-purple-500 border-dashed" />
                          <span className="text-white/60">{comparisonCountry?.name || "Global Avg"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              />
            )}
          </motion.div>
        )}
      </main>
    </div>
  );
}

export default OverallSummary;
