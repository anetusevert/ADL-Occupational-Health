/**
 * Arthur D. Little - Global Health Platform
 * Deep Dive Wizard - Main Orchestrator
 * 
 * 3-Step Wizard for Country Deep Dive Analysis:
 * 1. Country Selection (multi-select with regions)
 * 2. Topic Selection (visual gallery)
 * 3. Report Display (reading mode with export)
 * 
 * Re-applied: 2026-01-31
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  getStrategicDeepDiveCountries,
  generateStrategicDeepDive,
  type CountryDeepDiveItem, 
  type TopicStatus 
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { exportToPDF, exportToWord } from "../../services/reportExport";
import { CountrySelectionStep } from "./CountrySelectionStep";
import { TopicSelectionStep } from "./TopicSelectionStep";
import { ReportDisplayStep } from "./ReportDisplayStep";
import { StepIndicator, FloatingParticles } from "./shared";

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
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export function DeepDiveWizard() {
  const { user } = useAuth();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  
  // Selection state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Report state
  const [report, setReport] = useState<string | null>(null);
  const [topicStatusMap, setTopicStatusMap] = useState<Record<string, TopicStatus>>({});

  // Fetch countries
  const {
    data: countriesResponse,
    isLoading: isLoadingCountries,
    error: countriesError,
    refetch: refetchCountries,
  } = useQuery({
    queryKey: ["deepDiveCountries"],
    queryFn: getStrategicDeepDiveCountries,
  });

  // Extract countries array from response
  const countries = countriesResponse?.countries ?? [];

  // Get selected country data objects
  const selectedCountriesData = useMemo(() => {
    return selectedCountries
      .map((iso) => countries.find((c) => c.iso_code === iso))
      .filter((c): c is CountryDeepDiveItem => c !== undefined);
  }, [selectedCountries, countries]);

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ countryIso, topic }: { countryIso: string; topic: string }) => {
      const response = await generateStrategicDeepDive(countryIso, topic);
      return response;
    },
    onSuccess: (data) => {
      // Extract the markdown report from the nested structure
      setReport(data.report?.report || null);
    },
  });

  // Country selection handlers
  const handleSelectCountry = useCallback((isoCode: string) => {
    setSelectedCountries((prev) => {
      if (prev.includes(isoCode)) return prev;
      return [...prev, isoCode];
    });
  }, []);

  const handleDeselectCountry = useCallback((isoCode: string) => {
    setSelectedCountries((prev) => prev.filter((c) => c !== isoCode));
  }, []);

  const handleSelectMultiple = useCallback((isoCodes: string[]) => {
    setSelectedCountries((prev) => {
      const newSet = new Set([...prev, ...isoCodes]);
      return Array.from(newSet);
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setSelectedCountries([]);
  }, []);

  // Navigation handlers
  const handleContinueFromCountries = useCallback(() => {
    if (selectedCountries.length > 0) {
      setDirection(1);
      setCurrentStep(2);
    }
  }, [selectedCountries]);

  const handleSelectTopic = useCallback(
    (topic: string) => {
      setSelectedTopic(topic);
      setDirection(1);
      setCurrentStep(3);
      
      // Generate report for first selected country
      if (selectedCountries.length > 0) {
        generateReportMutation.mutate({
          countryIso: selectedCountries[0],
          topic,
        });
      }
    },
    [selectedCountries, generateReportMutation]
  );

  const handleBackToCountries = useCallback(() => {
    setDirection(-1);
    setCurrentStep(1);
    setSelectedTopic(null);
    setReport(null);
  }, []);

  const handleBackToTopics = useCallback(() => {
    setDirection(-1);
    setCurrentStep(2);
    setReport(null);
  }, []);

  const handleRetryReport = useCallback(() => {
    if (selectedCountries.length > 0 && selectedTopic) {
      generateReportMutation.mutate({
        countryIso: selectedCountries[0],
        topic: selectedTopic,
      });
    }
  }, [selectedCountries, selectedTopic, generateReportMutation]);

  // Export handlers
  const handleExportPDF = useCallback(async () => {
    if (!report || !selectedCountriesData[0]) return;
    await exportToPDF({
      userName: user?.full_name || user?.email?.split("@")[0] || "User",
      countryName: selectedCountriesData[0].name,
      topicName: selectedTopic || "Report",
      report,
    });
  }, [report, selectedCountriesData, selectedTopic, user]);

  const handleExportWord = useCallback(async () => {
    if (!report || !selectedCountriesData[0]) return;
    await exportToWord({
      userName: user?.full_name || user?.email?.split("@")[0] || "User",
      countryName: selectedCountriesData[0].name,
      topicName: selectedTopic || "Report",
      report,
    });
  }, [report, selectedCountriesData, selectedTopic, user]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <FloatingParticles color="purple" count={15} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Step Indicator */}
      <div className="flex-shrink-0 pt-6 px-8 relative z-10">
        <StepIndicator currentStep={currentStep} />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden relative z-10">
        <AnimatePresence mode="wait" custom={direction}>
          {currentStep === 1 && (
            <motion.div
              key="step1"
              className="h-full"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
            >
              <CountrySelectionStep
                countries={countries}
                isLoading={isLoadingCountries}
                error={countriesError as Error | null}
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
              key="step2"
              className="h-full"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
            >
              <TopicSelectionStep
                selectedCountries={selectedCountriesData}
                topicStatusMap={topicStatusMap}
                onSelectTopic={handleSelectTopic}
                onBack={handleBackToCountries}
              />
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              className="h-full"
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
            >
              <ReportDisplayStep
                country={selectedCountriesData[0] || null}
                topic={selectedTopic}
                report={report}
                isLoading={generateReportMutation.isPending}
                error={generateReportMutation.error as Error | null}
                onBack={handleBackToTopics}
                onRetry={handleRetryReport}
                onExportPDF={handleExportPDF}
                onExportWord={handleExportWord}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default DeepDiveWizard;
