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

// Helper to extract text from structured item or string
function getItemText(item: any): { title: string; description: string; meta?: string } {
  if (typeof item === 'string') {
    return { title: '', description: item };
  }
  if (typeof item === 'object' && item !== null) {
    const title = item.title || '';
    const description = item.description || '';
    // Build meta info from various possible fields
    const metaParts: string[] = [];
    if (item.impact_level) metaParts.push(`Impact: ${item.impact_level}`);
    if (item.severity) metaParts.push(`Severity: ${item.severity}`);
    if (item.potential) metaParts.push(`Potential: ${item.potential}`);
    if (item.risk_level) metaParts.push(`Risk: ${item.risk_level}`);
    if (item.priority) metaParts.push(`Priority: ${item.priority}`);
    if (item.timeline) metaParts.push(`Timeline: ${item.timeline}`);
    return { title, description, meta: metaParts.join(' | ') };
  }
  return { title: '', description: String(item) };
}

function formatReportAsMarkdown(report: StrategicDeepDiveReport): string {
  // Validate input has expected structure
  if (!report || typeof report !== 'object') {
    console.error('[DeepDive] Invalid report input:', report);
    return '# Error\n\nInvalid report data received. Please try regenerating the report.';
  }
  
  // Check for expected fields
  if (!report.iso_code && !report.country_name && !report.status) {
    console.error('[DeepDive] Report missing expected fields. Keys received:', Object.keys(report));
    return '# Error\n\nReport data is malformed. The response does not contain expected fields.\n\nPlease try regenerating the report.';
  }
  
  // Check if status indicates no report yet
  if (report.status === 'not_started' || report.status === 'processing') {
    return `# Report ${report.status === 'processing' ? 'In Progress' : 'Not Started'}\n\nThe report for ${report.country_name || 'this country'} has not been generated yet.\n\nPlease generate the report first.`;
  }
  
  const sections: string[] = [];
  
  // ==========================================================================
  // COVER / TITLE SECTION
  // ==========================================================================
  if (report.strategy_name) {
    sections.push(`# ${report.strategy_name}`);
    sections.push(`## Strategic Intelligence Briefing: ${report.country_name || 'Unknown'}`);
  } else {
    sections.push(`# Strategic Intelligence Briefing: ${report.country_name || 'Unknown'}`);
  }
  sections.push(`**Topic:** ${report.topic || 'Comprehensive Analysis'}`);
  sections.push('');
  
  // ==========================================================================
  // EXECUTIVE SUMMARY
  // ==========================================================================
  if (report.executive_summary) {
    sections.push('## Executive Summary');
    sections.push(report.executive_summary);
    sections.push('');
  }
  
  // Strategic Narrative (additional context)
  if (report.strategic_narrative) {
    sections.push('### Strategic Context');
    sections.push(report.strategic_narrative);
    sections.push('');
  }
  
  // ==========================================================================
  // COUNTRY CONTEXT
  // ==========================================================================
  if (report.health_profile || report.workforce_insights) {
    sections.push('## Country Context');
    
    if (report.health_profile) {
      sections.push('### Health Profile');
      sections.push(report.health_profile);
      sections.push('');
    }
    
    if (report.workforce_insights) {
      sections.push('### Workforce Insights');
      sections.push(report.workforce_insights);
      sections.push('');
    }
  }
  
  // ==========================================================================
  // KEY FINDINGS
  // ==========================================================================
  if (report.key_findings && report.key_findings.length > 0) {
    sections.push('## Key Findings');
    sections.push('');
    report.key_findings.forEach((finding: any, index: number) => {
      const { title, description, meta } = getItemText(finding);
      if (title) {
        sections.push(`### ${index + 1}. ${title}`);
        if (meta) sections.push(`*${meta}*`);
        sections.push(description);
      } else {
        sections.push(`**${index + 1}.** ${description}`);
      }
      sections.push('');
    });
  }
  
  // ==========================================================================
  // SWOT ANALYSIS
  // ==========================================================================
  const hasSwot = (report.strengths && report.strengths.length > 0) ||
                  (report.weaknesses && report.weaknesses.length > 0) ||
                  (report.opportunities && report.opportunities.length > 0) ||
                  (report.threats && report.threats.length > 0);
  
  if (hasSwot) {
    sections.push('## SWOT Analysis');
    sections.push('');
    
    // Strengths
    if (report.strengths && report.strengths.length > 0) {
      sections.push('### Strengths');
      report.strengths.forEach((item: any) => {
        const { title, description } = getItemText(item);
        if (title) {
          sections.push(`- **${title}:** ${description}`);
        } else {
          sections.push(`- ${description}`);
        }
      });
      sections.push('');
    }
    
    // Weaknesses
    if (report.weaknesses && report.weaknesses.length > 0) {
      sections.push('### Weaknesses');
      report.weaknesses.forEach((item: any) => {
        const { title, description, meta } = getItemText(item);
        if (title) {
          sections.push(`- **${title}${meta ? ` (${meta})` : ''}:** ${description}`);
        } else {
          sections.push(`- ${description}`);
        }
      });
      sections.push('');
    }
    
    // Opportunities
    if (report.opportunities && report.opportunities.length > 0) {
      sections.push('### Opportunities');
      report.opportunities.forEach((item: any) => {
        const { title, description, meta } = getItemText(item);
        if (title) {
          sections.push(`- **${title}${meta ? ` (${meta})` : ''}:** ${description}`);
        } else {
          sections.push(`- ${description}`);
        }
      });
      sections.push('');
    }
    
    // Threats
    if (report.threats && report.threats.length > 0) {
      sections.push('### Threats');
      report.threats.forEach((item: any) => {
        const { title, description, meta } = getItemText(item);
        if (title) {
          sections.push(`- **${title}${meta ? ` (${meta})` : ''}:** ${description}`);
        } else {
          sections.push(`- ${description}`);
        }
      });
      sections.push('');
    }
  }
  
  // ==========================================================================
  // STRATEGIC RECOMMENDATIONS
  // ==========================================================================
  if (report.strategic_recommendations && report.strategic_recommendations.length > 0) {
    sections.push('## Strategic Recommendations');
    sections.push('');
    report.strategic_recommendations.forEach((rec: any, index: number) => {
      const { title, description, meta } = getItemText(rec);
      if (title) {
        sections.push(`### ${index + 1}. ${title}`);
        if (meta) sections.push(`*${meta}*`);
        sections.push(description);
      } else {
        sections.push(`**${index + 1}.** ${description}`);
      }
      sections.push('');
    });
  }
  
  // ==========================================================================
  // PRIORITY INTERVENTIONS
  // ==========================================================================
  if (report.priority_interventions && report.priority_interventions.length > 0) {
    sections.push('## Priority Interventions');
    sections.push('*Immediate actions for the first 90 days*');
    sections.push('');
    report.priority_interventions.forEach((intervention: string, index: number) => {
      sections.push(`${index + 1}. ${intervention}`);
    });
    sections.push('');
  }
  
  // ==========================================================================
  // ACTION ITEMS / IMPLEMENTATION ROADMAP
  // ==========================================================================
  if (report.action_items && report.action_items.length > 0) {
    sections.push('## Implementation Roadmap');
    sections.push('');
    sections.push('| Action | Responsible Party | Timeline |');
    sections.push('|--------|-------------------|----------|');
    report.action_items.forEach((item: any) => {
      const action = item.action || '';
      const party = item.responsible_party || '';
      const timeline = item.timeline || '';
      sections.push(`| ${action} | ${party} | ${timeline} |`);
    });
    sections.push('');
  }
  
  // ==========================================================================
  // BENCHMARKING
  // ==========================================================================
  if (report.peer_comparison || report.global_ranking_context || (report.benchmark_countries && report.benchmark_countries.length > 0)) {
    sections.push('## Benchmarking & Peer Analysis');
    sections.push('');
    
    if (report.peer_comparison) {
      sections.push('### Regional Peer Comparison');
      sections.push(report.peer_comparison);
      sections.push('');
    }
    
    if (report.global_ranking_context) {
      sections.push('### Global Ranking Context');
      sections.push(report.global_ranking_context);
      sections.push('');
    }
    
    if (report.benchmark_countries && report.benchmark_countries.length > 0) {
      sections.push('### Benchmark Countries');
      sections.push('*Countries to learn from:*');
      sections.push('');
      report.benchmark_countries.forEach((country: any) => {
        const name = country.name || country.iso_code || 'Unknown';
        const reason = country.reason || '';
        sections.push(`- **${name}:** ${reason}`);
      });
      sections.push('');
    }
  }
  
  // ==========================================================================
  // FOOTER
  // ==========================================================================
  sections.push('---');
  const footerParts: string[] = [];
  if (report.generated_at) {
    footerParts.push(`Generated: ${new Date(report.generated_at).toLocaleString()}`);
  }
  if (report.model_used) {
    const modelDisplay = report.model_used.includes('fallback') 
      ? `${report.model_used} (faster model used due to timeout)`
      : report.model_used;
    footerParts.push(`Model: ${modelDisplay}`);
  }
  if (footerParts.length > 0) {
    sections.push(`*${footerParts.join(' | ')}*`);
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
