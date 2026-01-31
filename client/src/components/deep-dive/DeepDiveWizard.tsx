/**
 * Arthur D. Little - Global Health Platform
 * Deep Dive Wizard - Main Container
 * 
 * Full-screen immersive wizard for Country Deep Dive experience
 * Step 1: Country Selection (Multi-select with regions)
 * Step 2: Topic Selection (Visual gallery)
 * Step 3: Report Display (Immersive reading)
 * 
 * Features:
 * - Multi-country selection with region support
 * - Enhanced step transitions
 * - PDF and Word export with personalized filenames
 */

import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";
import {
  getStrategicDeepDiveCountries,
  getStrategicDeepDiveReport,
  getCountryTopicStatuses,
  deleteStrategicDeepDive,
  type CountryDeepDiveItem,
  type TopicStatus,
} from "../../services/api";
import { exportToPDF, exportToWord } from "../../services/reportExport";
import { useAuth } from "../../contexts/AuthContext";
import { StepIndicator } from "./shared";
import { CountrySelectionStep } from "./CountrySelectionStep";
import { TopicSelectionStep } from "./TopicSelectionStep";
import { ReportDisplayStep } from "./ReportDisplayStep";

// Animation variants for step transitions
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
};

const stepTransition = {
  x: { type: "spring", stiffness: 300, damping: 30 },
  opacity: { duration: 0.4 },
  scale: { duration: 0.4 },
};

export function DeepDiveWizard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
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

  // Get primary selected country (first in list)
  const primaryCountry = selectedCountries[0] || null;

  // Fetch report for selected country AND topic
  const { 
    data: report, 
    isLoading: isLoadingReport,
    refetch: refetchReport 
  } = useQuery({
    queryKey: ["strategic-deep-dive-report", primaryCountry, selectedTopic],
    queryFn: () => primaryCountry ? getStrategicDeepDiveReport(primaryCountry, selectedTopic) : null,
    enabled: !!primaryCountry && currentStep === 3,
    staleTime: 60 * 1000,
    retry: false,
  });

  // Fetch topic statuses for selected country
  const { data: topicStatuses } = useQuery({
    queryKey: ["strategic-deep-dive-topic-statuses", primaryCountry],
    queryFn: () => primaryCountry ? getCountryTopicStatuses(primaryCountry) : null,
    enabled: !!primaryCountry,
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

  // Get selected countries data
  const selectedCountriesData = useMemo(() => {
    if (!countriesData) return [];
    return selectedCountries
      .map(iso => countriesData.countries.find(c => c.iso_code === iso))
      .filter((c): c is CountryDeepDiveItem => c !== undefined);
  }, [selectedCountries, countriesData]);

  // Navigation handlers
  const goToStep = useCallback((step: number) => {
    setDirection(step > currentStep ? 1 : -1);
    setCurrentStep(step);
  }, [currentStep]);

  // Country selection handlers
  const handleSelectCountry = useCallback((isoCode: string) => {
    setSelectedCountries(prev => {
      if (prev.includes(isoCode)) return prev;
      return [...prev, isoCode];
    });
  }, []);

  const handleDeselectCountry = useCallback((isoCode: string) => {
    setSelectedCountries(prev => prev.filter(iso => iso !== isoCode));
  }, []);

  const handleSelectMultiple = useCallback((isoCodes: string[]) => {
    setSelectedCountries(prev => {
      const newSet = new Set([...prev, ...isoCodes]);
      return Array.from(newSet);
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCountries([]);
  }, []);

  const handleContinueFromCountries = useCallback(() => {
    if (selectedCountries.length > 0) {
      setDirection(1);
      setCurrentStep(2);
    }
  }, [selectedCountries]);

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
    setSelectedCountries([]);
    setSelectedTopic("Comprehensive Occupational Health Assessment");
    setCurrentStep(1);
  }, []);

  // Handle delete report
  const handleDeleteReport = useCallback(async () => {
    if (!primaryCountry) return;
    if (confirm(`Are you sure you want to delete the "${selectedTopic}" report for this country?`)) {
      try {
        await deleteStrategicDeepDive(primaryCountry, selectedTopic);
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-countries"] });
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-topic-statuses", primaryCountry] });
        queryClient.invalidateQueries({ queryKey: ["strategic-deep-dive-report", primaryCountry, selectedTopic] });
      } catch (error) {
        alert("Failed to delete report: " + (error instanceof Error ? error.message : "Unknown error"));
      }
    }
  }, [primaryCountry, selectedTopic, queryClient]);

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (!report || !selectedCountriesData[0]) return;
    
    try {
      await exportToPDF({
        userName: user?.full_name || user?.email?.split("@")[0] || "User",
        countryName: selectedCountriesData[0].name,
        topicName: selectedTopic,
        report,
      });
    } catch (error) {
      console.error("PDF export failed:", error);
      alert("Failed to export PDF. Please try again.");
    }
  }, [report, selectedCountriesData, selectedTopic, user]);

  const handleExportWord = useCallback(async () => {
    if (!report || !selectedCountriesData[0]) return;
    
    try {
      await exportToWord({
        userName: user?.full_name || user?.email?.split("@")[0] || "User",
        countryName: selectedCountriesData[0].name,
        topicName: selectedTopic,
        report,
      });
    } catch (error) {
      console.error("Word export failed:", error);
      alert("Failed to export Word document. Please try again.");
    }
  }, [report, selectedCountriesData, selectedTopic, user]);

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header with Step Indicator */}
      <motion.header 
        className="flex-shrink-0 px-6 py-4 border-b border-slate-700/40 bg-slate-900/80 backdrop-blur-xl z-50"
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
            {selectedCountries.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/40 rounded-lg">
                <span className="text-xs text-purple-300">
                  {selectedCountries.length} selected
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
                selectedCountries={selectedCountries}
                onSelectCountry={handleSelectCountry}
                onDeselectCountry={handleDeselectCountry}
                onSelectMultiple={handleSelectMultiple}
                onClearSelection={handleClearSelection}
                onContinue={handleContinueFromCountries}
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
                selectedCountries={selectedCountriesData}
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
                selectedCountries={selectedCountriesData}
                selectedTopic={selectedTopic}
                onBack={handleBack}
                onReset={handleReset}
                onDelete={handleDeleteReport}
                onExportPDF={handleExportPDF}
                onExportWord={handleExportWord}
                userName={user?.full_name || user?.email?.split("@")[0] || "User"}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DeepDiveWizard;
