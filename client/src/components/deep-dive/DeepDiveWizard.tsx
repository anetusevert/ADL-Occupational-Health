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
  getStrategicDeepDiveReport,
  type CountryDeepDiveItem, 
  type TopicStatus,
  type StrategicDeepDiveReport,
} from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { exportToPDF, exportToWord } from "../../services/reportExport";
import { CountrySelectionStep } from "./CountrySelectionStep";
import { TopicSelectionStep } from "./TopicSelectionStep";
import { ReportDisplayStep } from "./ReportDisplayStep";
import { StepIndicator, FloatingParticles } from "./shared";

// =============================================================================
// HELPER: Convert report object to markdown string for display
// =============================================================================

function formatReportAsMarkdown(report: StrategicDeepDiveReport): string {
  // Validate input has expected structure
  if (!report || typeof report !== 'object') {
    console.error('[DeepDive] Invalid report input:', report);
    return '# Error\n\nInvalid report data received. Please try regenerating the report.';
  }
  
  // Check for expected fields - report should have iso_code, country_name, or status
  if (!report.iso_code && !report.country_name && !report.status) {
    console.error('[DeepDive] Report missing expected fields. Keys received:', Object.keys(report));
    return '# Error\n\nReport data is malformed. The response does not contain expected fields.\n\nPlease try regenerating the report.';
  }
  
  // Check if status indicates no report yet
  if (report.status === 'not_started' || report.status === 'processing') {
    return `# Report ${report.status === 'processing' ? 'In Progress' : 'Not Started'}\n\nThe report for ${report.country_name || 'this country'} has not been generated yet.\n\nPlease generate the report first.`;
  }
  
  const sections: string[] = [];
  
  // Title
  sections.push(`# Strategic Intelligence Briefing: ${report.country_name || 'Unknown'}`);
  sections.push(`**Topic:** ${report.topic || 'Comprehensive Analysis'}`);
  sections.push('');
  
  // Executive Summary
  if (report.executive_summary) {
    sections.push('## Executive Summary');
    sections.push(report.executive_summary);
    sections.push('');
  }
  
  // Strategy Name
  if (report.strategy_name) {
    sections.push('## Strategic Approach');
    sections.push(`**${report.strategy_name}**`);
    if (report.strategic_narrative) {
      sections.push('');
      sections.push(report.strategic_narrative);
    }
    sections.push('');
  }
  
  // Key Findings
  if (report.key_findings && report.key_findings.length > 0) {
    sections.push('## Key Findings');
    report.key_findings.forEach((finding: any) => {
      sections.push(`### ${finding.title || 'Finding'}`);
      sections.push(finding.description || '');
      if (finding.impact_level) {
        sections.push(`**Impact Level:** ${finding.impact_level}`);
      }
      sections.push('');
    });
  }
  
  // SWOT Analysis
  const hasSwot = report.strengths?.length || report.weaknesses?.length || 
                  report.opportunities?.length || report.threats?.length;
  if (hasSwot) {
    sections.push('## SWOT Analysis');
    
    if (report.strengths?.length) {
      sections.push('### Strengths');
      report.strengths.forEach((s: any) => {
        const title = typeof s === 'string' ? s : (s.title || 'Strength');
        const desc = typeof s === 'string' ? '' : (s.description || '');
        sections.push(`- **${title}**${desc ? `: ${desc}` : ''}`);
      });
      sections.push('');
    }
    if (report.weaknesses?.length) {
      sections.push('### Weaknesses');
      report.weaknesses.forEach((w: any) => {
        const title = typeof w === 'string' ? w : (w.title || 'Weakness');
        const desc = typeof w === 'string' ? '' : (w.description || '');
        sections.push(`- **${title}**${desc ? `: ${desc}` : ''}`);
      });
      sections.push('');
    }
    if (report.opportunities?.length) {
      sections.push('### Opportunities');
      report.opportunities.forEach((o: any) => {
        const title = typeof o === 'string' ? o : (o.title || 'Opportunity');
        const desc = typeof o === 'string' ? '' : (o.description || '');
        sections.push(`- **${title}**${desc ? `: ${desc}` : ''}`);
      });
      sections.push('');
    }
    if (report.threats?.length) {
      sections.push('### Threats');
      report.threats.forEach((t: any) => {
        const title = typeof t === 'string' ? t : (t.title || 'Threat');
        const desc = typeof t === 'string' ? '' : (t.description || '');
        sections.push(`- **${title}**${desc ? `: ${desc}` : ''}`);
      });
      sections.push('');
    }
  }
  
  // Strategic Recommendations
  if (report.strategic_recommendations?.length) {
    sections.push('## Strategic Recommendations');
    report.strategic_recommendations.forEach((rec: any, index: number) => {
      const title = rec.title || `Recommendation ${index + 1}`;
      sections.push(`### ${title}`);
      if (rec.description) sections.push(rec.description);
      if (rec.priority) sections.push(`**Priority:** ${rec.priority}`);
      if (rec.timeline) sections.push(`**Timeline:** ${rec.timeline}`);
      sections.push('');
    });
  }
  
  // Action Items
  if (report.action_items?.length) {
    sections.push('## Action Items');
    report.action_items.forEach((item: any) => {
      const action = typeof item === 'string' ? item : (item.action || item.title || 'Action');
      sections.push(`- ${action}`);
    });
    sections.push('');
  }
  
  // Peer Comparison
  if (report.peer_comparison) {
    sections.push('## Peer Comparison');
    sections.push(report.peer_comparison);
    sections.push('');
  }
  
  // Global Ranking Context
  if (report.global_ranking_context) {
    sections.push('## Global Ranking Context');
    sections.push(report.global_ranking_context);
    sections.push('');
  }
  
  // Data Quality Notes
  if (report.data_quality_notes) {
    sections.push('## Data Quality Notes');
    sections.push(report.data_quality_notes);
    sections.push('');
  }
  
  // Generated timestamp
  if (report.generated_at) {
    sections.push('---');
    sections.push(`*Report generated: ${new Date(report.generated_at).toLocaleString()}*`);
  }
  
  return sections.join('\n');
}

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
  const { user, isAdmin } = useAuth();
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(0);
  
  // Selection state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  
  // Report state
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // true when AI is generating
  const [isFetching, setIsFetching] = useState(false); // true when fetching existing report
  const [reportError, setReportError] = useState<Error | null>(null);
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

  // Fetch or generate report for a country/topic
  const fetchOrGenerateReport = useCallback(
    async (countryIso: string, topic: string) => {
      setReport(null);
      setReportError(null);
      setIsFetching(true);
      setIsGenerating(false);

      try {
        // First, check if report already exists and is completed
        const existingReport = await getStrategicDeepDiveReport(countryIso, topic);
        
        // Debug: Log what we received
        console.log('[DeepDive] Existing report check:', {
          hasReport: !!existingReport,
          status: existingReport?.status,
          hasExpectedFields: !!(existingReport?.iso_code || existingReport?.country_name),
        });
        
        if (existingReport && existingReport.status === 'completed') {
          // Validate report structure before formatting
          if (!existingReport.iso_code && !existingReport.country_name) {
            console.error('[DeepDive] Existing report has invalid structure:', Object.keys(existingReport));
            setReportError(new Error("Report data appears to be malformed. Please try regenerating."));
            setIsFetching(false);
            return;
          }
          
          // Report exists and is completed - convert to markdown and display
          const markdownReport = formatReportAsMarkdown(existingReport);
          console.log('[DeepDive] Formatted report length:', markdownReport.length);
          setReport(markdownReport);
          setIsFetching(false);
          return;
        }
        
        // No existing completed report
        setIsFetching(false);
        
        if (isAdmin) {
          // Admin can auto-generate the report (synchronous - returns full report)
          setIsGenerating(true);
          const generated = await generateStrategicDeepDive(countryIso, topic);
          
          console.log('[DeepDive] Generated report:', {
            success: generated.success,
            hasReport: !!generated.report,
            error: generated.error,
          });
          
          if (generated.success && generated.report) {
            // Validate report structure before formatting
            if (!generated.report.iso_code && !generated.report.country_name) {
              console.error('[DeepDive] Generated report has invalid structure:', Object.keys(generated.report));
              setReportError(new Error("Generated report data appears to be malformed. Please try again."));
              return;
            }
            
            // Convert report object to markdown for display
            const markdownReport = formatReportAsMarkdown(generated.report);
            console.log('[DeepDive] Formatted generated report length:', markdownReport.length);
            setReport(markdownReport);
          } else {
            // Check for error message from backend
            const errorMsg = generated.error || "Report generation completed but no content was returned.";
            setReportError(new Error(errorMsg));
          }
        } else {
          // Regular users see a message that report is not available
          setReportError(new Error("This report is not yet available. Please check back later or contact an administrator to generate it."));
        }
        
      } catch (err: any) {
        // Extract detailed error message from server response if available
        const serverMessage = err?.response?.data?.detail || err?.response?.data?.message;
        const errorMessage = serverMessage || (err instanceof Error ? err.message : "Failed to load report");
        setReportError(new Error(errorMessage));
      } finally {
        setIsFetching(false);
        setIsGenerating(false);
      }
    },
    [isAdmin]
  );

  const handleSelectTopic = useCallback(
    (topic: string) => {
      setSelectedTopic(topic);
      setDirection(1);
      setCurrentStep(3);
      
      // Fetch or generate report for first selected country
      if (selectedCountries.length > 0) {
        fetchOrGenerateReport(selectedCountries[0], topic);
      }
    },
    [selectedCountries, fetchOrGenerateReport]
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

  // Retry fetching/generating report (on error)
  const handleRetryReport = useCallback(() => {
    if (selectedCountries.length > 0 && selectedTopic) {
      fetchOrGenerateReport(selectedCountries[0], selectedTopic);
    }
  }, [selectedCountries, selectedTopic, fetchOrGenerateReport]);

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
                isLoading={isFetching || isGenerating}
                isGenerating={isGenerating}
                error={reportError}
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
