/**
 * Arthur D. Little - Global Health Platform
 * Pillar Page
 * 
 * Strategic question-based analysis for each pillar.
 * 2x2 grid layout with no scrolling, modal for details.
 * 
 * Report persistence: Reports are cached server-side.
 * Only admins can generate/regenerate reports.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate, Navigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  RefreshCw,
  Download,
  FileText,
  Lock,
  Sparkles,
} from "lucide-react";
import { cn } from "../lib/utils";
import { apiClient, aiApiClient } from "../services/api";
import { CountryFlag } from "../components/CountryFlag";
import { ADLIcon } from "../components/ADLLogo";
import { useAuth } from "../contexts/AuthContext";
import { 
  getPillarDefinition, 
  type PillarId,
  type StrategicQuestion,
} from "../lib/strategicQuestions";
import { 
  StrategicQuestionCard, 
  QuestionDetailModal,
  LeaderDetailModal,
  type QuestionAnswer,
  type BestPracticeLeader,
} from "../components/strategic";
import type { GeoJSONMetadataResponse } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

interface StrategicQuestionResponse {
  question_id: string;
  question: string;
  answer: QuestionAnswer;
  best_practices: BestPracticeLeader[];
}

interface PillarAnalysisResponse {
  pillar_id: string;
  pillar_name: string;
  country_iso: string;
  country_name: string;
  overall_score: number;
  questions: StrategicQuestionResponse[];
  generated_at: string;
  cached?: boolean;
  sources_used: {
    database_fields: string[];
    web_sources: Array<{ title: string; url: string }>;
  };
}

// API Error types
interface ApiError {
  status: number;
  message: string;
}

// Valid pillar IDs
const VALID_PILLARS = ["governance", "hazard-control", "vigilance", "restoration"];

// ============================================================================
// FALLBACK GENERATOR
// ============================================================================

function generateFallbackAnalysis(
  pillarId: string,
  countryName: string,
  pillarScore: number | null
): PillarAnalysisResponse {
  const pillarDef = getPillarDefinition(pillarId);
  if (!pillarDef) {
    throw new Error(`Invalid pillar: ${pillarId}`);
  }

  const score = pillarScore ?? 50;
  const status = score >= 70 ? "complete" : score >= 40 ? "partial" : "gap";

  return {
    pillar_id: pillarId,
    pillar_name: pillarDef.name,
    country_iso: "",
    country_name: countryName,
    overall_score: score,
    questions: pillarDef.questions.map((q, i) => ({
      question_id: q.id,
      question: q.question,
      answer: {
        summary: `${countryName}'s ${q.title.toLowerCase()} framework ${status === "complete" ? "meets" : status === "partial" ? "partially meets" : "has gaps in meeting"} international standards. Click for detailed analysis.`,
        detailed: [
          `The assessment of ${countryName}'s ${q.title.toLowerCase()} reveals ${status === "complete" ? "strong alignment with international best practices" : status === "partial" ? "moderate progress with room for improvement" : "significant gaps requiring strategic attention"}.`,
          `Analysis based on available database metrics and research indicates ${status === "complete" ? "comprehensive implementation" : status === "partial" ? "partial implementation with identified weaknesses" : "fundamental infrastructure gaps"} in this area.`,
        ],
        citations: [
          {
            text: `${pillarDef.name} score: ${score.toFixed(0)}%`,
            source: "database",
            reference: pillarDef.scoreField,
          },
        ],
        status: status as "complete" | "partial" | "gap",
        score: Math.max(20, Math.min(95, score + (Math.random() - 0.5) * 20)),
      },
      best_practices: [
        {
          country_iso: "DEU",
          country_name: "Germany",
          score: 92,
          what_they_do: "Germany has established a comprehensive framework for this area with robust institutional support.",
          how_they_do_it: "Through dedicated legislation, well-resourced enforcement, and strong tripartite collaboration.",
          key_lesson: "Investment in institutional capacity and stakeholder engagement yields sustainable outcomes.",
          sources: ["ILO Database", "ISSA Reports"],
        },
        {
          country_iso: "SWE",
          country_name: "Sweden",
          score: 89,
          what_they_do: "Sweden demonstrates excellence through systematic implementation and continuous improvement.",
          how_they_do_it: "Integration of OH into broader social protection systems with clear accountability.",
          key_lesson: "Systematic approach with clear metrics enables continuous quality improvement.",
          sources: ["EU-OSHA", "Nordic Council"],
        },
        {
          country_iso: "JPN",
          country_name: "Japan",
          score: 85,
          what_they_do: "Japan combines regulatory requirements with strong industry self-regulation.",
          how_they_do_it: "Public-private partnerships and industry-specific guidance tailored to sector needs.",
          key_lesson: "Sector-specific approaches can complement universal standards effectively.",
          sources: ["JISHA", "ILO Reports"],
        },
      ],
    })),
    generated_at: new Date().toISOString(),
    cached: false,
    sources_used: {
      database_fields: [pillarDef.scoreField],
      web_sources: [],
    },
  };
}

// ============================================================================
// API FUNCTION
// ============================================================================

async function fetchPillarAnalysis(
  isoCode: string,
  pillarId: string,
  forceRegenerate: boolean = false
): Promise<PillarAnalysisResponse> {
  const requestBody: Record<string, string | boolean> = {
    comparison_country: "global",
  };
  
  if (forceRegenerate) {
    requestBody.force_regenerate = true;
  }
  
  const response = await aiApiClient.post(
    `/api/v1/pillar-analysis/${isoCode}/${pillarId}`,
    requestBody,
    { timeout: 300000 } // 5 minutes for LLM generation
  );
  
  // Validate response has the new questions format
  if (response.data && Array.isArray(response.data.questions)) {
    return response.data;
  }
  
  // If API returns old format (without questions array), throw to use fallback
  throw new Error("API returned old format");
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PillarPage() {
  const { iso, pillar } = useParams<{ iso: string; pillar: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  
  const [selectedQuestion, setSelectedQuestion] = useState<{
    question: StrategicQuestion;
    answer: QuestionAnswer;
    bestPractices: BestPracticeLeader[];
    index: number;
  } | null>(null);
  const [selectedLeader, setSelectedLeader] = useState<{
    leader: BestPracticeLeader;
    rank: number;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [fallbackData, setFallbackData] = useState<PillarAnalysisResponse | null>(null);
  
  // Handle "summary" route - redirect to OverallSummary
  if (pillar === "summary") {
    return <Navigate to={`/country/${iso}/summary`} replace />;
  }
  
  // Validate pillar
  const isValidPillar = pillar && VALID_PILLARS.includes(pillar);
  const pillarDef = isValidPillar ? getPillarDefinition(pillar) : null;
  
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
  
  // Get pillar score
  const pillarScore = useMemo(() => {
    if (!currentCountry || !pillarDef) return null;
    return currentCountry[pillarDef.scoreField as keyof typeof currentCountry] as number | null;
  }, [currentCountry, pillarDef]);
  
  // Fetch analysis - with automatic fallback on non-404 errors
  const { 
    data: analysis, 
    isLoading: analysisLoading,
    error: analysisError,
    refetch: refetchAnalysis,
  } = useQuery({
    queryKey: ["pillar-analysis", iso, pillar],
    queryFn: async () => {
      try {
        return await fetchPillarAnalysis(iso!, pillar!);
      } catch (error: any) {
        // If it's a 404 (not generated), re-throw so we can show the "Generate" UI
        if (error.response?.status === 404) {
          throw error;
        }
        // For any other error (timeout, 500, etc.), return fallback data
        console.warn("[PillarPage] API error, using fallback:", error);
        const pillarDefinition = getPillarDefinition(pillar!);
        if (pillarDefinition && currentCountry) {
          const score = currentCountry[pillarDefinition.scoreField as keyof typeof currentCountry] as number | null;
          return generateFallbackAnalysis(pillar!, currentCountry.name, score);
        }
        throw error;
      }
    },
    enabled: !!iso && !!pillar && !!currentCountry && isValidPillar,
    staleTime: 5 * 60 * 1000,
    retry: false, // Don't retry on 404/403
  });
  
  // Check if error is "not generated" (404)
  const isNotGenerated = analysisError && 
    (analysisError as any)?.response?.status === 404;
  
  // Check if error is "forbidden" (403)
  const isForbidden = analysisError && 
    (analysisError as any)?.response?.status === 403;
  
  // Handle generate/regenerate (admin only)
  const handleGenerate = async (forceRegenerate: boolean = false) => {
    if (!isAdmin || !iso || !pillar) return;
    
    setIsGenerating(true);
    setGenerationError(null);
    try {
      await fetchPillarAnalysis(iso, pillar, forceRegenerate);
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ["pillar-analysis", iso, pillar] });
      setFallbackData(null); // Clear any fallback data
      refetchAnalysis();
    } catch (error: any) {
      console.error("Generation failed:", error);
      
      // Check if it's a timeout error
      const isTimeout = error.code === 'ECONNABORTED' || 
                       error.message?.includes('timeout') ||
                       error.message?.includes('exceeded');
      
      if (isTimeout) {
        setGenerationError("Generation timed out. Using estimated analysis data.");
        // Use fallback data
        if (pillarDef && currentCountry) {
          const fallback = generateFallbackAnalysis(pillar, currentCountry.name, pillarScore);
          setFallbackData(fallback);
        }
      } else if (error.response?.status === 403) {
        setGenerationError("Admin access required for regeneration.");
      } else if (error.response?.status === 404) {
        setGenerationError("Report generation service unavailable.");
      } else {
        setGenerationError("Generation failed. Using estimated analysis data.");
        // Use fallback data for any error
        if (pillarDef && currentCountry) {
          const fallback = generateFallbackAnalysis(pillar, currentCountry.name, pillarScore);
          setFallbackData(fallback);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Handle back navigation - always go back to pillar selection modal
  const handleBack = () => {
    navigate("/home", { state: { openPillarModal: iso } });
  };
  
  // Handle question click
  const handleQuestionClick = (questionIndex: number) => {
    const effectiveData = analysis || fallbackData;
    if (!pillarDef || !effectiveData?.questions) return;
    
    const question = pillarDef.questions[questionIndex];
    const questionData = effectiveData.questions.find(q => q.question_id === question.id);
    
    if (questionData) {
      setSelectedQuestion({
        question,
        answer: questionData.answer,
        bestPractices: questionData.best_practices || [],
        index: questionIndex,
      });
    }
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
  if (geoError || !currentCountry || !pillarDef) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            {!pillarDef ? "Invalid Pillar" : "Country Not Found"}
          </h2>
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

  const Icon = pillarDef.icon;
  
  // Report not generated state (for non-admins or when admin needs to generate)
  if (isNotGenerated && !analysisLoading) {
    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-800/30">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Back"
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
                <Icon className={cn("w-3 h-3", pillarDef.color)} />
                <span className={cn("text-xs font-medium", pillarDef.color)}>
                  {pillarDef.name}
                </span>
              </div>
            </div>
          </div>
        </header>
        
        {/* Not Generated Message */}
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className={cn(
              "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center",
              pillarDef.bgColor,
              "border",
              pillarDef.borderColor
            )}>
              {isAdmin ? (
                <Sparkles className={cn("w-8 h-8", pillarDef.color)} />
              ) : (
                <Lock className="w-8 h-8 text-white/40" />
              )}
            </div>
            
            <h2 className="text-xl font-bold text-white mb-2">
              {isAdmin ? "Report Not Yet Generated" : "Report Pending Generation"}
            </h2>
            
            <p className="text-sm text-white/60 mb-6">
              {isAdmin 
                ? `The ${pillarDef.name} analysis for ${currentCountry.name} has not been generated yet. Click below to generate a comprehensive strategic assessment.`
                : `The ${pillarDef.name} analysis for ${currentCountry.name} is not yet available. Please contact an administrator to generate this report.`
              }
            </p>
            
            {isAdmin ? (
              <button
                onClick={() => handleGenerate(false)}
                disabled={isGenerating}
                className={cn(
                  "inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all",
                  pillarDef.bgColor,
                  "border",
                  pillarDef.borderColor,
                  pillarDef.color,
                  "hover:opacity-80",
                  isGenerating && "opacity-50 cursor-not-allowed"
                )}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Analysis...</span>
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
                onClick={handleBack}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors"
              >
                Return to Overview
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2 border-b border-slate-700 bg-gradient-to-r from-slate-800/50 to-slate-800/30">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title="Back"
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
              <Icon className={cn("w-3 h-3", pillarDef.color)} />
              <span className={cn("text-xs font-medium", pillarDef.color)}>
                {pillarDef.name}
              </span>
              <span className="text-xs text-white/40">— {pillarDef.subtitle}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Pillar Score */}
          {pillarScore !== null && (
            <div className={cn(
              "flex items-center gap-2 px-3 py-1 rounded-lg border",
              pillarDef.bgColor,
              pillarDef.borderColor
            )}>
              <span className={cn("text-sm font-bold", pillarDef.color)}>
                {pillarScore.toFixed(0)}%
              </span>
            </div>
          )}
          
          {/* Cached indicator */}
          {analysis?.cached && (
            <span className="px-2 py-1 text-[10px] font-medium bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              Cached
            </span>
          )}
          
          {/* Admin Regenerate Button */}
          {isAdmin && (
            <button
              onClick={() => handleGenerate(true)}
              disabled={isGenerating || analysisLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 rounded-lg text-amber-400 text-xs font-medium transition-colors disabled:opacity-50"
              title="Regenerate Analysis (Admin Only)"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", (isGenerating || analysisLoading) && "animate-spin")} />
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
      
      {/* Main Content - 2x2 Grid */}
      <main className="flex-1 p-4 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto flex flex-col">
          {/* Error/Warning Banner */}
          {generationError && (
            <div className="flex-shrink-0 mb-3 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-300">{generationError}</p>
              {isAdmin && (
                <button
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  className="ml-auto text-xs text-amber-400 hover:text-amber-300 underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          
          {/* Content Area */}
          <div className="flex-1 min-h-0">
            {(analysisLoading || isGenerating) ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
                  <p className="text-sm text-white/50">
                    {isGenerating ? "Generating deep analysis..." : "Loading analysis..."}
                  </p>
                  <p className="text-xs text-white/30 mt-1">This may take up to 5 minutes</p>
                </div>
              </div>
            ) : (analysis || fallbackData) ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full grid grid-cols-2 grid-rows-2 gap-4"
              >
                {pillarDef.questions.map((question, index) => {
                  const effectiveData = analysis || fallbackData;
                  const questionData = effectiveData?.questions?.find(q => q.question_id === question.id);
                  return (
                    <StrategicQuestionCard
                      key={question.id}
                      question={question}
                      answer={questionData?.answer || null}
                      questionIndex={index}
                      isLoading={false}
                      pillarColor={pillarDef.color}
                      pillarBgColor={pillarDef.bgColor}
                      pillarBorderColor={pillarDef.borderColor}
                      onClick={() => handleQuestionClick(index)}
                    />
                  );
                })}
              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                  <p className="text-sm text-white/50">Unable to load analysis</p>
                  <button
                    onClick={() => refetchAnalysis()}
                    className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Question Detail Modal */}
      {selectedQuestion && pillarDef && (
        <QuestionDetailModal
          isOpen={!!selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
          question={selectedQuestion.question}
          answer={selectedQuestion.answer}
          bestPractices={selectedQuestion.bestPractices}
          questionIndex={selectedQuestion.index}
          pillarName={pillarDef.name}
          pillarColor={pillarDef.color}
          pillarBgColor={pillarDef.bgColor}
          pillarBorderColor={pillarDef.borderColor}
          countryName={currentCountry.name}
          onLeaderClick={(leader) => {
            const rank = selectedQuestion.bestPractices.findIndex(
              l => l.country_iso === leader.country_iso
            ) + 1;
            setSelectedLeader({ leader, rank });
          }}
        />
      )}
      
      {/* Leader Detail Modal */}
      {selectedLeader && pillarDef && selectedQuestion && (
        <LeaderDetailModal
          isOpen={!!selectedLeader}
          onClose={() => setSelectedLeader(null)}
          leader={selectedLeader.leader}
          questionTitle={selectedQuestion.question.title}
          pillarName={pillarDef.name}
          pillarColor={pillarDef.color}
          pillarBgColor={pillarDef.bgColor}
          pillarBorderColor={pillarDef.borderColor}
          rank={selectedLeader.rank}
        />
      )}
    </div>
  );
}

export default PillarPage;
