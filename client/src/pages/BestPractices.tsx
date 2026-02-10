/**
 * Arthur D. Little - Global Health Platform
 * Best Practices Compendium Page
 * 
 * A comprehensive guide to occupational health best practices
 * organized by framework pillars and strategic questions.
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { FloatingParticles, GradientOrbs } from "../components/deep-dive/shared";
import { 
  PillarGrid, 
  PillarDetail, 
  QuestionDeepDive,
  CountryBestPracticeModal 
} from "../components/best-practices";
import { apiClient } from "../services/api";

// API Functions
const fetchPillars = async () => {
  const response = await apiClient.get("/api/v1/best-practices/pillars");
  return response.data;
};

const fetchPillarDetail = async (pillarId: string) => {
  const response = await apiClient.get(`/api/v1/best-practices/pillar/${pillarId}`);
  return response.data;
};

const fetchBestPractice = async (questionId: string) => {
  const response = await apiClient.get(`/api/v1/best-practices/question/${questionId}`);
  return response.data;
};

const fetchCountryBestPractice = async (isoCode: string, questionId: string) => {
  const response = await apiClient.get(`/api/v1/best-practices/country/${isoCode}/${questionId}`);
  return response.data;
};

const generateBestPractice = async (questionId: string) => {
  const response = await apiClient.post(`/api/v1/best-practices/generate/${questionId}`, {
    force_regenerate: true,
  });
  return response.data;
};

const generateCountryBestPractice = async (isoCode: string, questionId: string) => {
  const response = await apiClient.post(`/api/v1/best-practices/generate-country/${isoCode}/${questionId}`, {
    force_regenerate: true,
  });
  return response.data;
};

// View states
type ViewState = "pillars" | "pillar-detail" | "question";

// Floating indicator for active generations
function GenerationStatusIndicator({
  questionData,
  countryData,
  isPendingQuestion,
  isPendingCountry,
}: {
  questionData: any;
  countryData: any;
  isPendingQuestion: boolean;
  isPendingCountry: boolean;
}) {
  // Count active generations
  const isQuestionGenerating = questionData?.status === "generating" || isPendingQuestion;
  const isCountryGenerating = countryData?.status === "generating" || isPendingCountry;
  const activeCount = (isQuestionGenerating ? 1 : 0) + (isCountryGenerating ? 1 : 0);

  if (activeCount === 0) return null;

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-slate-800/95 backdrop-blur-lg border border-purple-500/40 rounded-xl shadow-2xl shadow-purple-500/20">
        <div className="relative">
          <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
          <div className="absolute inset-0 rounded-full bg-purple-500/20 animate-ping" />
        </div>
        <div>
          <p className="text-sm font-medium text-white">
            {activeCount} {activeCount === 1 ? "report" : "reports"} generating...
          </p>
          <p className="text-xs text-slate-400">
            You can navigate freely
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function BestPractices() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "admin";

  // Navigation state
  const [view, setView] = useState<ViewState>("pillars");
  const [selectedPillar, setSelectedPillar] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);

  // Fetch pillars overview - polls while any generation is in progress
  const pillarsQuery = useQuery({
    queryKey: ["best-practices", "pillars"],
    queryFn: fetchPillars,
    // Poll every 5 seconds while there are active generations
    refetchInterval: (query) => {
      const data = query.state.data;
      // Check if any pillar has generating questions
      const hasGenerating = data?.pillars?.some(
        (p: any) => p.generating_count > 0
      );
      return hasGenerating ? 5000 : false;
    },
  });

  // Fetch pillar detail - polls while any question is generating
  const pillarDetailQuery = useQuery({
    queryKey: ["best-practices", "pillar", selectedPillar],
    queryFn: () => fetchPillarDetail(selectedPillar!),
    enabled: !!selectedPillar && view === "pillar-detail",
    // Poll every 3 seconds while there are generating questions
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasGenerating = data?.questions?.some(
        (q: any) => q.status === "generating"
      );
      return hasGenerating ? 3000 : false;
    },
  });

  // Fetch question best practice - polls while generating
  const questionQuery = useQuery({
    queryKey: ["best-practices", "question", selectedQuestion],
    queryFn: () => fetchBestPractice(selectedQuestion!),
    enabled: !!selectedQuestion && view === "question",
    // Poll every 3 seconds while status is "generating"
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "generating" ? 3000 : false;
    },
  });

  // Fetch country best practice - polls while generating
  const countryQuery = useQuery({
    queryKey: ["best-practices", "country", selectedCountry, selectedQuestion],
    queryFn: () => fetchCountryBestPractice(selectedCountry!, selectedQuestion!),
    enabled: !!selectedCountry && !!selectedQuestion && isCountryModalOpen,
    // Poll every 3 seconds while status is "generating"
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.status === "generating" ? 3000 : false;
    },
  });

  // Generate best practice mutation (now returns 202 for background processing)
  const [generateError, setGenerateError] = useState<string | null>(null);
  const generateMutation = useMutation({
    mutationFn: (questionId: string) => generateBestPractice(questionId),
    onSuccess: (data) => {
      setGenerateError(null);
      // Whether 202 (generating) or 200 (completed), refetch to get latest status
      // The polling will take over if status is "generating"
      queryClient.invalidateQueries({ queryKey: ["best-practices", "question", selectedQuestion] });
      queryClient.invalidateQueries({ queryKey: ["best-practices", "pillars"] });
      queryClient.invalidateQueries({ queryKey: ["best-practices", "pillar", selectedPillar] });
      
      if (data?.status === "generating") {
        console.log("Generation started in background, polling will update status...");
      }
    },
    onError: (error: any) => {
      console.error("Generate error:", error);
      const message = error?.response?.data?.detail || error?.message || "Failed to generate best practices";
      setGenerateError(message);
    },
  });

  // Generate country best practice mutation (now returns 202 for background processing)
  const [generateCountryError, setGenerateCountryError] = useState<string | null>(null);
  const generateCountryMutation = useMutation({
    mutationFn: ({ isoCode, questionId }: { isoCode: string; questionId: string }) =>
      generateCountryBestPractice(isoCode, questionId),
    onSuccess: (data) => {
      setGenerateCountryError(null);
      // Whether 202 (generating) or 200 (completed), refetch to get latest status
      queryClient.invalidateQueries({ 
        queryKey: ["best-practices", "country", selectedCountry, selectedQuestion] 
      });
      queryClient.invalidateQueries({ queryKey: ["best-practices", "question", selectedQuestion] });
      
      if (data?.status === "generating") {
        console.log("Country generation started in background, polling will update status...");
      }
    },
    onError: (error: any) => {
      console.error("Generate country error:", error);
      const message = error?.response?.data?.detail || error?.message || "Failed to generate country best practice";
      setGenerateCountryError(message);
    },
  });

  // Navigation handlers
  const handleSelectPillar = useCallback((pillarId: string) => {
    setSelectedPillar(pillarId);
    setView("pillar-detail");
  }, []);

  const handleSelectQuestion = useCallback((questionId: string) => {
    setSelectedQuestion(questionId);
    setView("question");
  }, []);

  const handleBackToPillars = useCallback(() => {
    setView("pillars");
    setSelectedPillar(null);
    setSelectedQuestion(null);
  }, []);

  const handleBackToQuestions = useCallback(() => {
    setView("pillar-detail");
    setSelectedQuestion(null);
  }, []);

  const handleSelectCountry = useCallback((isoCode: string) => {
    setSelectedCountry(isoCode);
    setIsCountryModalOpen(true);
  }, []);

  const handleCloseCountryModal = useCallback(() => {
    setIsCountryModalOpen(false);
    setSelectedCountry(null);
  }, []);

  const handleGenerate = useCallback(() => {
    if (selectedQuestion) {
      generateMutation.mutate(selectedQuestion);
    }
  }, [selectedQuestion, generateMutation]);

  const handleGenerateCountry = useCallback(() => {
    if (selectedCountry && selectedQuestion) {
      generateCountryMutation.mutate({ isoCode: selectedCountry, questionId: selectedQuestion });
    }
  }, [selectedCountry, selectedQuestion, generateCountryMutation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background Effects */}
      <GradientOrbs count={4} />
      <FloatingParticles color="purple" count={25} />

      {/* Header */}
      <motion.header
        className="sticky top-0 z-40 px-8 py-6 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/40 flex items-center justify-center"
              whileHover={{ rotate: [0, -5, 5, 0] }}
            >
              <Award className="w-6 h-6 text-purple-400" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Best Practices
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h1>
              <p className="text-slate-400 text-sm">
                What the world's leading nations do differently — and how KSA can apply those lessons.
              </p>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="relative z-10 px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Pillars View */}
          {view === "pillars" && (
            <motion.div
              key="pillars"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="max-w-5xl mx-auto mb-8">
                <motion.div
                  className="text-center mb-10"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-3xl font-bold text-white mb-3">
                    Framework Pillars
                  </h2>
                  <p className="text-slate-400 max-w-2xl mx-auto">
                    For each pillar of the framework, global leaders have been identified and their approaches documented.
                    Select a pillar to explore evidence-based practices that drive measurable outcomes.
                  </p>
                </motion.div>
              </div>

              <PillarGrid
                pillarStatuses={pillarsQuery.data?.pillars || []}
                isLoading={pillarsQuery.isLoading}
                onSelectPillar={handleSelectPillar}
              />
            </motion.div>
          )}

          {/* Pillar Detail View */}
          {view === "pillar-detail" && selectedPillar && (
            <motion.div
              key="pillar-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <PillarDetail
                pillarId={pillarDetailQuery.data?.pillar_id || selectedPillar}
                pillarName={pillarDetailQuery.data?.pillar_name || "Loading..."}
                pillarDescription={pillarDetailQuery.data?.pillar_description || ""}
                questions={pillarDetailQuery.data?.questions || []}
                isLoading={pillarDetailQuery.isLoading}
                onBack={handleBackToPillars}
                onSelectQuestion={handleSelectQuestion}
              />
            </motion.div>
          )}

          {/* Question Deep Dive View */}
          {view === "question" && selectedQuestion && (
            <motion.div
              key="question"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <QuestionDeepDive
                data={questionQuery.data || null}
                isLoading={questionQuery.isLoading}
                isGenerating={generateMutation.isPending}
                isAdmin={isAdmin}
                error={generateError}
                userName={user?.name || user?.email || "User"}
                onBack={handleBackToQuestions}
                onGenerate={handleGenerate}
                onSelectCountry={handleSelectCountry}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Country Best Practice Modal */}
      <CountryBestPracticeModal
        isOpen={isCountryModalOpen}
        data={countryQuery.data || null}
        isLoading={countryQuery.isLoading}
        isGenerating={generateCountryMutation.isPending}
        isAdmin={isAdmin}
        userName={user?.name || user?.email || "User"}
        onClose={handleCloseCountryModal}
        onGenerate={handleGenerateCountry}
      />

      {/* Floating Generation Status Indicator */}
      <GenerationStatusIndicator 
        questionData={questionQuery.data}
        countryData={countryQuery.data}
        isPendingQuestion={generateMutation.isPending}
        isPendingCountry={generateCountryMutation.isPending}
      />
    </div>
  );
}
