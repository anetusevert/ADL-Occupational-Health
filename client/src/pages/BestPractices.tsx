/**
 * Arthur D. Little - Global Health Platform
 * Best Practices Compendium Page
 * 
 * A comprehensive guide to occupational health best practices
 * organized by framework pillars and strategic questions.
 */

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Sparkles } from "lucide-react";
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

  // Fetch pillars overview
  const pillarsQuery = useQuery({
    queryKey: ["best-practices", "pillars"],
    queryFn: fetchPillars,
  });

  // Fetch pillar detail
  const pillarDetailQuery = useQuery({
    queryKey: ["best-practices", "pillar", selectedPillar],
    queryFn: () => fetchPillarDetail(selectedPillar!),
    enabled: !!selectedPillar && view === "pillar-detail",
  });

  // Fetch question best practice
  const questionQuery = useQuery({
    queryKey: ["best-practices", "question", selectedQuestion],
    queryFn: () => fetchBestPractice(selectedQuestion!),
    enabled: !!selectedQuestion && view === "question",
  });

  // Fetch country best practice
  const countryQuery = useQuery({
    queryKey: ["best-practices", "country", selectedCountry, selectedQuestion],
    queryFn: () => fetchCountryBestPractice(selectedCountry!, selectedQuestion!),
    enabled: !!selectedCountry && !!selectedQuestion && isCountryModalOpen,
  });

  // Generate best practice mutation
  const generateMutation = useMutation({
    mutationFn: (questionId: string) => generateBestPractice(questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["best-practices", "question", selectedQuestion] });
      queryClient.invalidateQueries({ queryKey: ["best-practices", "pillars"] });
      queryClient.invalidateQueries({ queryKey: ["best-practices", "pillar", selectedPillar] });
    },
  });

  // Generate country best practice mutation
  const generateCountryMutation = useMutation({
    mutationFn: ({ isoCode, questionId }: { isoCode: string; questionId: string }) =>
      generateCountryBestPractice(isoCode, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ["best-practices", "country", selectedCountry, selectedQuestion] 
      });
      queryClient.invalidateQueries({ queryKey: ["best-practices", "question", selectedQuestion] });
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
                Best Practices Compendium
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h1>
              <p className="text-slate-400 text-sm">
                Global standards and leading country approaches
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
                    Explore best practices across the four pillars of occupational health.
                    Each pillar contains strategic questions with evidence-based guidance.
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
        onClose={handleCloseCountryModal}
        onGenerate={handleGenerateCountry}
      />
    </div>
  );
}
