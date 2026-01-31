/**
 * Arthur D. Little - Global Health Platform
 * Deep Dive Wizard - Main Container
 * 
 * Full-screen immersive wizard for Country Deep Dive experience
 * Step 1: Country Selection
 * Step 2: Topic Selection  
 * Step 3: Report Display
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X } from "lucide-react";
import {
  getStrategicDeepDiveCountries,
  getStrategicDeepDiveReport,
  getCountryTopicStatuses,
  deleteStrategicDeepDive,
  type CountryDeepDiveItem,
  type StrategicDeepDiveReport,
  type TopicStatus,
} from "../../services/api";
import { StepIndicator } from "./shared";
import { CountrySelectionStep } from "./CountrySelectionStep";
import { TopicSelectionStep } from "./TopicSelectionStep";
import { ReportDisplayStep } from "./ReportDisplayStep";

// Animation variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

const stepTransition = {
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.3 },
};

export function DeepDiveWizard() {
  const queryClient = useQueryClient();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("Comprehensive Occupational Health Assessment");
  
  // Fetch countries with auto-refresh
  const { 
    data: countriesData, 
    isLoading: isLoadingCountries, 
    error: countriesError,
    refetch: refetchCountries 
  } = useQuery({
    queryKey: ["strategic-deep-dive-countries"],
    queryFn: getStrategicDeepDiveCountries,
    staleTime: 10 * 1000,
    refetchInterval: 15 * 1000,
    retry: 2,
  });

  // Fetch report for selected country AND topic
  const { 
    data: report, 
    isLoading: isLoadingReport,
    refetch: refetchReport 
  } = useQuery({
    queryKey: ["strategic-deep-dive-report", selectedCountry, selectedTopic],
    queryFn: () => selectedCountry ? getStrategicDeepDiveReport(selectedCountry, selectedTopic) : null,
    enabled: !!selectedCountry && currentStep === 3,
    staleTime: 60 * 1000,
    retry: false,
  });

  // Fetch topic statuses for selected country
  const { data: topicStatuses } = useQuery({
    queryKey: ["strategic-deep-dive-topic-statuses", selectedCountry],
    queryFn: () => selectedCountry ? getCountryTopicStatuses(selectedCountry) : null,
    enabled: !!selectedCountry,
    staleTime: 30 * 1000,
    refetchInterval: 15 * 1000,
  });

  // Build topic status map
  const topicStatusMap = useMemo(() => {
    const map: Record<string, TopicStatus> = {};
    if (topicStatuses?.topics) {
      topicStatuses.topics.forEach(ts => {
        map[ts.topic] = ts;
      });
    }
    return map;
  }, [topicStatuses]);

  // Get selected country data
  const selectedCountryData = useMemo(() => {
    if (!selectedCountry || !countriesData) return null;
    return countriesData.countries.find(c => c.iso_code === selectedCountry) || null;
  }, [selectedCountry, countriesData]);

  // Navigation handlers
  const goToStep = useCallback((step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  }, [currentStep]);

  const handleCountrySelect = useCallback((isoCode: string) => {
    setSelectedCountry(isoCode);
    setDirection(1);
    setCurrentStep(2);
  }, []);

  const handleTopicSelect = useCallback((topic: string) => {
    setSelectedTopic(topic);
    setDirection(1);
    setCurrentStep(3);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleReset = useCallback(() => {
    setDirection(-1);
    setSelectedCountry(null);
    setSelectedTopic("Comprehensive Occupational Health Assessment");
    setCurrentStep(1);
  }, []);

  // Handle delete report
  const handleDeleteReport = useCallback(async () => {
    if (!selectedCountry) return;
    if (confirm(`Are you sure you want to delete the "${selectedTopic}" report for this country?`)) {
      try {
        await deleteStrategicDeepDive(selectedCountry, selectedTopic);
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-countries"] });
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-topic-statuses", selectedCountry] });
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-report", selectedCountry, selectedTopic] });
      } catch (error) {
        alert("Failed to delete report: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    }
  }, [selectedCountry, selectedTopic, queryClient]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header with Step Indicator */}
      <motion.header 
        className="flex-shrink-0 px-6 py-4 border-b border-slate-700/40 bg-slate-900/80 backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center gap-3">
            <motion.div 
              className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(147, 51, 234, 0.3)",
                  "0 0 20px rgba(147, 51, 234, 0.5)",
                  "0 0 0px rgba(147, 51, 234, 0.3)"
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Brain className="w-5 h-5 text-purple-400" />
            </motion.div>
            <div>
              <h1 className="text-lg font-semibold text-white tracking-tight">
                Strategic Deep Dive
              </h1>
              <p className="text-white/40 text-xs">
                AI-Powered Country Analysis
              </p>
            </div>
          </div>

          {/* Step Indicator */}
          <StepIndicator 
            currentStep={currentStep} 
            onStepClick={goToStep}
            canNavigateBack={true}
          />

          {/* Stats/Actions */}
          <div className="flex items-center gap-3">
            {countriesData && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 border border-slate-700/40 rounded-lg">
                <span className="text-xs text-slate-400">
                  {countriesData.completed} / {countriesData.total_count} analyzed
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Main Content - Step Container */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="country-step"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="absolute inset-0"
            >
              <CountrySelectionStep
                countries={countriesData?.countries || []}
                isLoading={isLoadingCountries}
                error={countriesError}
                onSelectCountry={handleCountrySelect}
                onRetry={() => refetchCountries()}
              />
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="topic-step"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="absolute inset-0"
            >
              <TopicSelectionStep
                selectedCountry={selectedCountryData}
                topicStatusMap={topicStatusMap}
                onSelectTopic={handleTopicSelect}
                onBack={handleBack}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="report-step"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
              className="absolute inset-0"
            >
              <ReportDisplayStep
                report={report}
                isLoading={isLoadingReport}
                selectedCountry={selectedCountryData}
                selectedTopic={selectedTopic}
                onBack={handleBack}
                onReset={handleReset}
                onDelete={handleDeleteReport}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DeepDiveWizard;
