/**
 * Arthur D. Little - Global Health Platform
 * Report Display Step - Immersive Reading Experience
 * 
 * Step 3 of the Deep Dive Wizard - Cinematic report presentation
 * Features:
 * - Full-width reading mode with optimal line width
 * - Sticky header that minimizes on scroll
 * - Section navigation with scroll spy
 * - Smooth section transitions as user scrolls
 * - Typography optimized for long reading
 * - PDF and Word export with personalized filenames
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  ChevronLeft,
  FileText,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  AlertTriangle,
  Target,
  Zap,
  Download,
  Trash2,
  Loader2,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Globe,
  Home,
  FileDown,
  FileType,
  BookOpen,
  List,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import {
  type CountryDeepDiveItem,
  type StrategicDeepDiveReport,
} from "../../services/api";
import { cn } from "../../lib/utils";
import { FloatingParticles, GradientOrbs } from "./shared";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 25,
    },
  },
};

const swotVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.3 + i * 0.1, duration: 0.4, ease: "easeOut" },
  }),
};

// Section IDs for navigation
const SECTION_IDS = {
  summary: "executive-summary",
  findings: "key-findings",
  swot: "swot-analysis",
  recommendations: "strategic-recommendations",
  interventions: "priority-interventions",
  quality: "data-quality",
};

interface ReportDisplayStepProps {
  report: StrategicDeepDiveReport | null | undefined;
  isLoading: boolean;
  selectedCountries: Array<{ iso_code: string; name: string; flag_url: string | null }>;
  selectedTopic: string;
  onBack: () => void;
  onReset: () => void;
  onDelete: () => void;
  onExportPDF: () => void;
  onExportWord: () => void;
  userName?: string;
}

export function ReportDisplayStep({
  report,
  isLoading,
  selectedCountries,
  selectedTopic,
  onBack,
  onReset,
  onDelete,
  onExportPDF,
  onExportWord,
  userName = "User",
}: ReportDisplayStepProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState<string>("executive-summary");
  const [isNavExpanded, setIsNavExpanded] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Scroll tracking for header
  const { scrollY } = useScroll({ container: scrollRef });
  const headerHeight = useTransform(scrollY, [0, 100], [80, 56]);
  const headerOpacity = useTransform(scrollY, [0, 50], [1, 0.95]);

  // Toggle section collapse
  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  }, []);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && scrollRef.current) {
      const containerTop = scrollRef.current.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const offset = elementTop - containerTop + scrollRef.current.scrollTop - 100;
      
      scrollRef.current.scrollTo({
        top: offset,
        behavior: "smooth",
      });
    }
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const sections = Object.values(SECTION_IDS);
      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const containerRect = container.getBoundingClientRect();
          if (rect.top <= containerRect.top + 150 && rect.bottom > containerRect.top + 100) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden">
        <GradientOrbs count={3} />
        <FloatingParticles color="purple" count={20} />
        
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div className="relative w-28 h-28 mx-auto mb-8">
            <motion.div
              className="absolute inset-0 border-4 border-purple-500/20 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-3 border-4 border-t-purple-500 border-r-transparent border-b-transparent border-l-transparent rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <Brain className="w-12 h-12 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Strategic Analysis</h3>
          <motion.p
            className="text-slate-400 text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Preparing your comprehensive report...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // No report state
  if (!report) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden">
        <GradientOrbs count={2} />
        <FloatingParticles color="cyan" count={15} />
        
        {/* Header */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-slate-700/40 relative z-10">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all"
              whileHover={{ scale: 1.02, x: -3 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </motion.button>

            <span className="text-slate-600">|</span>
            <span className="text-white font-medium">{selectedCountries[0]?.name}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400 text-sm">{selectedTopic}</span>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center relative z-10">
          <motion.div
            className="text-center max-w-md px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-28 h-28 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-slate-700/40"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(100, 116, 139, 0.2)",
                  "0 0 40px rgba(100, 116, 139, 0.3)",
                  "0 0 0px rgba(100, 116, 139, 0.2)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FileText className="w-14 h-14 text-slate-500" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white mb-3">Report Not Available</h3>
            <p className="text-slate-400 mb-8">
              This topic has not been generated yet for {selectedCountries[0]?.name}.
              Request generation from the admin panel.
            </p>
            <div className="flex items-center justify-center gap-4">
              <motion.button
                onClick={onBack}
                className="px-5 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-300 text-sm font-medium hover:bg-slate-700/60 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Select Another Topic
              </motion.button>
              <motion.button
                onClick={onReset}
                className="px-5 py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300 text-sm font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Home className="w-4 h-4" />
                Start Over
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Get sections that exist in the report
  const availableSections = [
    { id: SECTION_IDS.summary, label: "Executive Summary", exists: !!report.executive_summary },
    { id: SECTION_IDS.findings, label: "Key Findings", exists: (report.key_findings?.length || 0) > 0 },
    { id: SECTION_IDS.swot, label: "SWOT Analysis", exists: (report.strengths?.length || 0) > 0 || (report.weaknesses?.length || 0) > 0 },
    { id: SECTION_IDS.recommendations, label: "Recommendations", exists: (report.strategic_recommendations?.length || 0) > 0 },
    { id: SECTION_IDS.interventions, label: "Interventions", exists: (report.priority_interventions?.length || 0) > 0 },
    { id: SECTION_IDS.quality, label: "Data Quality", exists: !!report.data_quality_notes },
  ].filter(s => s.exists);

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <GradientOrbs count={3} />
      </div>

      {/* Left Navigation Sidebar */}
      <motion.aside
        className={cn(
          "flex-shrink-0 border-r border-slate-700/40 bg-slate-900/80 backdrop-blur-xl relative z-20 transition-all duration-300",
          isNavExpanded ? "w-64" : "w-16"
        )}
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="h-full flex flex-col">
          {/* Nav Toggle */}
          <div className="p-4 border-b border-slate-700/40">
            <button
              onClick={() => setIsNavExpanded(!isNavExpanded)}
              className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <List className="w-5 h-5 text-slate-400" />
              {isNavExpanded && <span className="ml-2 text-sm text-slate-400">Contents</span>}
            </button>
          </div>

          {/* Section Navigation */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {availableSections.map((section, index) => (
              <motion.button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                  activeSection === section.id
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.05 }}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  activeSection === section.id ? "bg-purple-400" : "bg-slate-600"
                )} />
                {isNavExpanded && (
                  <span className="text-sm truncate">{section.label}</span>
                )}
              </motion.button>
            ))}
          </nav>

          {/* Actions */}
          {isNavExpanded && (
            <div className="p-4 border-t border-slate-700/40 space-y-2">
              <button
                onClick={onReset}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors text-sm"
              >
                <Globe className="w-4 h-4" />
                New Analysis
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Sticky Header */}
        <motion.header
          className="flex-shrink-0 px-8 border-b border-slate-700/40 bg-slate-900/90 backdrop-blur-xl sticky top-0 z-30"
          style={{ height: headerHeight }}
        >
          <motion.div 
            className="h-full flex items-center justify-between"
            style={{ opacity: headerOpacity }}
          >
            {/* Left: Navigation & Title */}
            <div className="flex items-center gap-4">
              <motion.button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Topics</span>
              </motion.button>

              <div className="flex items-center gap-3">
                {selectedCountries[0]?.flag_url && (
                  <img
                    src={selectedCountries[0].flag_url}
                    alt=""
                    className="w-8 h-5 object-cover rounded shadow"
                  />
                )}
                <div>
                  <h1 className="text-lg font-semibold text-white">{selectedTopic}</h1>
                  <p className="text-xs text-slate-400">{selectedCountries[0]?.name}</p>
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              {/* Export Dropdown */}
              <div className="relative">
                <motion.button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Download className="w-4 h-4" />
                  Export
                  <ChevronDown className={cn("w-4 h-4 transition-transform", showExportMenu && "rotate-180")} />
                </motion.button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      <button
                        onClick={() => {
                          onExportPDF();
                          setShowExportMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                      >
                        <FileDown className="w-4 h-4 text-red-400" />
                        Export as PDF
                      </button>
                      <button
                        onClick={() => {
                          onExportWord();
                          setShowExportMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors"
                      >
                        <FileType className="w-4 h-4 text-blue-400" />
                        Export as Word
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                onClick={onDelete}
                className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </motion.header>

        {/* Scrollable Report Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          <motion.article
            className="max-w-4xl mx-auto px-8 py-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Report Header */}
            <motion.header
              className="text-center mb-12"
              variants={sectionVariants}
            >
              <motion.div
                className="flex items-center justify-center gap-4 mb-6"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {selectedCountries[0]?.flag_url && (
                  <motion.img
                    src={selectedCountries[0].flag_url}
                    alt={selectedCountries[0].name}
                    className="w-20 h-12 object-cover rounded-lg shadow-xl border-2 border-slate-700"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                  />
                )}
              </motion.div>

              <h1 className="text-4xl font-bold text-white mb-3">
                {report.strategy_name || selectedCountries[0]?.name}
              </h1>
              <p className="text-xl text-purple-400 mb-6">{selectedTopic}</p>

              {/* Meta info */}
              <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
                {report.generated_at && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {new Date(report.generated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                )}
                {report.ai_provider && (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Powered by {report.ai_provider}
                  </span>
                )}
              </div>
            </motion.header>

            {/* Executive Summary */}
            {report.executive_summary && (
              <ReportSection
                id={SECTION_IDS.summary}
                title="Executive Summary"
                icon={Brain}
                iconColor="text-purple-400"
                isCollapsed={collapsedSections.has(SECTION_IDS.summary)}
                onToggle={() => toggleSection(SECTION_IDS.summary)}
              >
                <div className="bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent rounded-xl border border-purple-500/20 p-6">
                  <p className="text-slate-300 leading-relaxed text-lg">
                    {report.executive_summary}
                  </p>
                </div>
              </ReportSection>
            )}

            {/* Key Findings */}
            {report.key_findings && report.key_findings.length > 0 && (
              <ReportSection
                id={SECTION_IDS.findings}
                title="Key Findings"
                icon={Target}
                iconColor="text-cyan-400"
                isCollapsed={collapsedSections.has(SECTION_IDS.findings)}
                onToggle={() => toggleSection(SECTION_IDS.findings)}
              >
                <div className="space-y-4">
                  {report.key_findings.map((finding, index) => (
                    <motion.div
                      key={index}
                      className={cn(
                        "p-5 rounded-xl border-l-4 bg-slate-800/40 border border-slate-700/40",
                        finding.impact_level === "high"
                          ? "border-l-red-500"
                          : finding.impact_level === "medium"
                          ? "border-l-amber-500"
                          : "border-l-slate-500"
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="text-base font-semibold text-white">{finding.title}</h4>
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wide",
                          finding.impact_level === "high"
                            ? "bg-red-500/20 text-red-400"
                            : finding.impact_level === "medium"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-slate-700/50 text-slate-400"
                        )}>
                          {finding.impact_level} impact
                        </span>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{finding.description}</p>
                    </motion.div>
                  ))}
                </div>
              </ReportSection>
            )}

            {/* SWOT Analysis */}
            {(report.strengths?.length || report.weaknesses?.length || 
              report.opportunities?.length || report.threats?.length) && (
              <ReportSection
                id={SECTION_IDS.swot}
                title="SWOT Analysis"
                icon={AlertTriangle}
                iconColor="text-amber-400"
                isCollapsed={collapsedSections.has(SECTION_IDS.swot)}
                onToggle={() => toggleSection(SECTION_IDS.swot)}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Strengths */}
                  <motion.div
                    className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5"
                    custom={0}
                    variants={swotVariants}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-base font-semibold text-emerald-400">Strengths</h4>
                    </div>
                    <ul className="space-y-3">
                      {report.strengths?.map((item, i) => (
                        <li key={i} className="text-sm text-slate-300">
                          <span className="font-medium text-white">{item.title}</span>
                          <span className="text-slate-400"> — {item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Weaknesses */}
                  <motion.div
                    className="bg-red-500/5 border border-red-500/20 rounded-xl p-5"
                    custom={1}
                    variants={swotVariants}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingDown className="w-5 h-5 text-red-400" />
                      <h4 className="text-base font-semibold text-red-400">Weaknesses</h4>
                    </div>
                    <ul className="space-y-3">
                      {report.weaknesses?.map((item, i) => (
                        <li key={i} className="text-sm text-slate-300">
                          <span className="font-medium text-white">{item.title}</span>
                          <span className="text-slate-400"> — {item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Opportunities */}
                  <motion.div
                    className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5"
                    custom={2}
                    variants={swotVariants}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <h4 className="text-base font-semibold text-amber-400">Opportunities</h4>
                    </div>
                    <ul className="space-y-3">
                      {report.opportunities?.map((item, i) => (
                        <li key={i} className="text-sm text-slate-300">
                          <span className="font-medium text-white">{item.title}</span>
                          <span className="text-slate-400"> — {item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Threats */}
                  <motion.div
                    className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-5"
                    custom={3}
                    variants={swotVariants}
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <AlertCircle className="w-5 h-5 text-purple-400" />
                      <h4 className="text-base font-semibold text-purple-400">Threats</h4>
                    </div>
                    <ul className="space-y-3">
                      {report.threats?.map((item, i) => (
                        <li key={i} className="text-sm text-slate-300">
                          <span className="font-medium text-white">{item.title}</span>
                          <span className="text-slate-400"> — {item.description}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </div>
              </ReportSection>
            )}

            {/* Strategic Recommendations */}
            {report.strategic_recommendations && report.strategic_recommendations.length > 0 && (
              <ReportSection
                id={SECTION_IDS.recommendations}
                title="Strategic Recommendations"
                icon={Zap}
                iconColor="text-yellow-400"
                isCollapsed={collapsedSections.has(SECTION_IDS.recommendations)}
                onToggle={() => toggleSection(SECTION_IDS.recommendations)}
              >
                <div className="space-y-4">
                  {report.strategic_recommendations.map((rec, index) => (
                    <motion.div
                      key={index}
                      className="bg-gradient-to-r from-slate-800/60 to-slate-800/40 rounded-xl border border-slate-700/40 p-5"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="text-base font-semibold text-white">{rec.title}</h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wide",
                            rec.priority === "critical"
                              ? "bg-red-500/20 text-red-400"
                              : rec.priority === "high"
                              ? "bg-amber-500/20 text-amber-400"
                              : rec.priority === "medium"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-slate-700/50 text-slate-400"
                          )}>
                            {rec.priority}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-700/50 text-slate-400">
                            {rec.timeline}
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-400 leading-relaxed">{rec.description}</p>
                    </motion.div>
                  ))}
                </div>
              </ReportSection>
            )}

            {/* Priority Interventions */}
            {report.priority_interventions && report.priority_interventions.length > 0 && (
              <ReportSection
                id={SECTION_IDS.interventions}
                title="Priority Interventions"
                icon={CheckCircle2}
                iconColor="text-emerald-400"
                isCollapsed={collapsedSections.has(SECTION_IDS.interventions)}
                onToggle={() => toggleSection(SECTION_IDS.interventions)}
              >
                <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 p-6">
                  <ol className="space-y-4">
                    {report.priority_interventions.map((intervention, index) => (
                      <motion.li
                        key={index}
                        className="flex items-start gap-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.05 }}
                      >
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-400">
                          {index + 1}
                        </span>
                        <span className="text-slate-300 pt-1 leading-relaxed">{intervention}</span>
                      </motion.li>
                    ))}
                  </ol>
                </div>
              </ReportSection>
            )}

            {/* Data Quality Notes */}
            {report.data_quality_notes && (
              <ReportSection
                id={SECTION_IDS.quality}
                title="Data Quality Notes"
                icon={BookOpen}
                iconColor="text-slate-400"
                isCollapsed={collapsedSections.has(SECTION_IDS.quality)}
                onToggle={() => toggleSection(SECTION_IDS.quality)}
              >
                <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-5">
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {report.data_quality_notes}
                  </p>
                </div>
              </ReportSection>
            )}

            {/* Footer */}
            <motion.footer
              className="mt-16 pt-8 border-t border-slate-700/40 text-center"
              variants={sectionVariants}
            >
              <p className="text-sm text-slate-500 mb-6">
                Generated by Arthur D. Little Strategic Deep Dive Agent
              </p>
              <div className="flex items-center justify-center gap-4">
                <motion.button
                  onClick={onBack}
                  className="px-5 py-2.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-300 text-sm font-medium hover:bg-slate-700/60 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Another Topic
                </motion.button>
                <motion.button
                  onClick={onReset}
                  className="px-5 py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300 text-sm font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Globe className="w-4 h-4" />
                  Analyze Another Country
                </motion.button>
              </div>
            </motion.footer>
          </motion.article>
        </div>
      </div>

      {/* Click outside to close export menu */}
      {showExportMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowExportMenu(false)} 
        />
      )}
    </div>
  );
}

// Report Section Component
interface ReportSectionProps {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  isCollapsed: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ReportSection({
  id,
  title,
  icon: Icon,
  iconColor,
  isCollapsed,
  onToggle,
  children,
}: ReportSectionProps) {
  return (
    <motion.section
      id={id}
      className="mb-10"
      variants={sectionVariants}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between group mb-5"
      >
        <div className="flex items-center gap-3">
          <Icon className={cn("w-6 h-6", iconColor)} />
          <h2 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
            {title}
          </h2>
        </div>
        <motion.div
          animate={{ rotate: isCollapsed ? 0 : 180 }}
          transition={{ duration: 0.2 }}
          className="text-slate-500 group-hover:text-slate-300"
        >
          <ChevronUp className="w-5 h-5" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

export default ReportDisplayStep;
