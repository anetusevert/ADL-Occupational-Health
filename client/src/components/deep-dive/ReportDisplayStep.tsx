/**
 * Arthur D. Little - Global Health Platform
 * Report Display Step - Immersive Reading Experience
 * 
 * Step 3 of the Deep Dive Wizard - Reading-focused report viewer
 * Re-applied: 2026-01-31
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  FileType,
  Loader2,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ChevronRight,
  ListTree,
  Eye,
  Sparkles,
} from "lucide-react";
import { cn, getApiBaseUrl } from "../../lib/utils";
import { GradientOrbs, FloatingParticles } from "./shared";

interface ReportSection {
  id: string;
  title: string;
  content: string;
  level: number;
}

interface ReportDisplayStepProps {
  country: { iso_code: string; name: string; flag_url: string | null } | null;
  topic: string | null;
  report: string | null;
  isLoading: boolean;
  isGenerating?: boolean; // true when AI is generating (vs just fetching)
  error: Error | null;
  onBack: () => void;
  onRetry: () => void;
  onExportPDF: () => void;
  onExportWord: () => void;
}

// Parse report into sections
function parseReportSections(report: string): ReportSection[] {
  const lines = report.split("\n");
  const sections: ReportSection[] = [];
  let currentSection: ReportSection | null = null;
  let contentBuffer: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);

    if (h1Match || h2Match || h3Match) {
      if (currentSection) {
        currentSection.content = contentBuffer.join("\n").trim();
        sections.push(currentSection);
      }
      const title = h1Match?.[1] || h2Match?.[1] || h3Match?.[1] || "";
      const level = h1Match ? 1 : h2Match ? 2 : 3;
      currentSection = {
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title,
        content: "",
        level,
      };
      contentBuffer = [];
    } else {
      contentBuffer.push(line);
    }
  }

  if (currentSection) {
    currentSection.content = contentBuffer.join("\n").trim();
    sections.push(currentSection);
  }

  return sections;
}

// Country flag with proper URL and error handling
function CountryFlagHeader({ country }: { country: { iso_code: string; name: string; flag_url: string | null } | null }) {
  const [imgError, setImgError] = useState(false);
  const apiBaseUrl = getApiBaseUrl();
  
  if (!country) return null;
  
  const fullFlagUrl = country.flag_url ? `${apiBaseUrl}${country.flag_url}` : null;
  
  if (fullFlagUrl && !imgError) {
    return (
      <img 
        src={fullFlagUrl} 
        alt={country.name} 
        className="w-8 h-5 object-cover rounded shadow-lg border border-slate-700"
        onError={() => setImgError(true)}
      />
    );
  }
  
  // Fallback: show country code
  return (
    <div className="w-8 h-5 flex items-center justify-center rounded bg-slate-700/60 border border-slate-600/40 text-[8px] font-medium text-slate-400">
      {country.iso_code.slice(0, 2)}
    </div>
  );
}

// Render markdown content
function renderMarkdown(content: string): string {
  return content
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)+/gs, "<ul>$&</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br />")
    .replace(/^(.+)$/gm, (match) => {
      if (!match.startsWith("<") && match.trim()) {
        return `<p>${match}</p>`;
      }
      return match;
    });
}

export function ReportDisplayStep({
  country,
  topic,
  report,
  isLoading,
  isGenerating = false,
  error,
  onBack,
  onRetry,
  onExportPDF,
  onExportWord,
}: ReportDisplayStepProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const sections = report ? parseReportSections(report) : [];

  // Scroll spy
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -60% 0px" }
    );
    Object.values(sectionRefs.current).forEach((ref) => ref && observer.observe(ref));
    return () => observer.disconnect();
  }, [sections]);

  const scrollToSection = useCallback((id: string) => {
    const el = sectionRefs.current[id];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const toggleSection = useCallback((id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center relative overflow-hidden">
        <GradientOrbs count={3} />
        <FloatingParticles color="emerald" count={30} />
        <motion.div className="text-center max-w-md px-6 relative z-10" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <motion.div className="w-24 h-24 mx-auto mb-6 relative" animate={{ rotate: isGenerating ? 360 : 0 }} transition={{ duration: 8, repeat: isGenerating ? Infinity : 0, ease: "linear" }}>
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-500/30 to-indigo-500/30 border border-purple-500/40" />
            <div className="absolute inset-2 rounded-xl bg-slate-900/80 flex items-center justify-center">
              {isGenerating ? (
                <Sparkles className="w-8 h-8 text-purple-400" />
              ) : (
                <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              )}
            </div>
          </motion.div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {isGenerating ? "Generating Your Report" : "Loading Report"}
          </h3>
          <p className="text-slate-400 text-sm mb-4">
            {isGenerating 
              ? `AI is analyzing occupational health data for ${country?.name || "your selection"}...`
              : `Fetching report for ${country?.name || "your selection"}...`
            }
          </p>
          <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
              <motion.div key={i} className="w-2 h-2 rounded-full bg-purple-500" animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }} />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Error state - check if it's "not available" vs actual error
  if (error) {
    const isNotAvailable = error.message.includes("not yet available");
    
    return (
      <div className="h-full flex items-center justify-center relative overflow-hidden">
        <GradientOrbs count={2} />
        <motion.div className="text-center max-w-md px-6 relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {isNotAvailable ? (
            <>
              <div className="w-24 h-24 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-500/20">
                <BookOpen className="w-12 h-12 text-amber-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Report Not Available</h3>
              <p className="text-sm text-slate-400 mb-6">
                This strategic deep dive report has not been generated yet. 
                Please check back later or contact an administrator.
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Report Generation Failed</h3>
              <p className="text-sm text-slate-400 mb-6">{error.message}</p>
            </>
          )}
          <div className="flex gap-3 justify-center">
            <motion.button onClick={onBack} className="px-4 py-2 bg-slate-700/50 border border-slate-600/40 rounded-xl text-slate-300 text-sm font-medium flex items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <ChevronLeft className="w-4 h-4" />
              Go Back
            </motion.button>
            {!isNotAvailable && (
              <motion.button onClick={onRetry} className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300 text-sm font-medium flex items-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <GradientOrbs count={2} />

      {/* Header */}
      <motion.div className="flex-shrink-0 px-6 py-4 border-b border-slate-800/80 backdrop-blur-sm bg-slate-900/70 sticky top-0 z-20" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button onClick={onBack} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-white transition-all" whileHover={{ scale: 1.02, x: -2 }} whileTap={{ scale: 0.98 }}>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </motion.button>
            <div className="flex items-center gap-3">
              <CountryFlagHeader country={country} />
              <div>
                <h2 className="text-lg font-semibold text-white line-clamp-1">{topic}</h2>
                <p className="text-xs text-slate-500">{country?.name}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button onClick={() => setShowSidebar(!showSidebar)} className={cn("p-2 rounded-lg border transition-all", showSidebar ? "bg-purple-500/20 border-purple-500/40 text-purple-400" : "bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-white")} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <ListTree className="w-4 h-4" />
            </motion.button>
            
            <div className="relative">
              <motion.button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white text-sm font-medium shadow-lg shadow-purple-500/25" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Download className="w-4 h-4" />
                Export
                <ChevronDown className="w-4 h-4" />
              </motion.button>
              <AnimatePresence>
                {showExportMenu && (
                  <motion.div initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} className="absolute top-full right-0 mt-2 w-48 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50">
                    <button onClick={() => { onExportPDF(); setShowExportMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors">
                      <FileText className="w-5 h-5 text-red-400" />
                      <div>
                        <span className="text-sm text-white block">Download PDF</span>
                        <span className="text-xs text-slate-500">Formatted document</span>
                      </div>
                    </button>
                    <button onClick={() => { onExportWord(); setShowExportMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-700/50 transition-colors">
                      <FileType className="w-5 h-5 text-blue-400" />
                      <div>
                        <span className="text-sm text-white block">Download Word</span>
                        <span className="text-xs text-slate-500">Editable document</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
        {/* Sidebar */}
        <AnimatePresence>
          {showSidebar && sections.length > 0 && (
            <motion.aside initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="flex-shrink-0 border-r border-slate-800/80 bg-slate-900/50 backdrop-blur-sm overflow-hidden">
              <div className="p-4 h-full overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-medium text-slate-400">Contents</h3>
                </div>
                <nav className="space-y-1">
                  {sections.filter((s) => s.level <= 2).map((section) => (
                    <motion.button key={section.id} onClick={() => scrollToSection(section.id)} className={cn("w-full text-left px-3 py-2 rounded-lg text-sm transition-all", section.level === 1 ? "font-medium" : "pl-6 text-sm", activeSection === section.id ? "bg-purple-500/20 text-purple-300 border-l-2 border-purple-500" : "text-slate-400 hover:text-white hover:bg-slate-800/50")} whileHover={{ x: 2 }}>
                      {section.title}
                    </motion.button>
                  ))}
                </nav>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Report Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto px-8 py-8">
          <div className="max-w-3xl mx-auto">
            {sections.map((section, index) => {
              const isCollapsed = collapsedSections.has(section.id);

              return (
                <motion.div key={section.id} id={section.id} ref={(el) => { sectionRefs.current[section.id] = el; }} className={cn("mb-8", section.level === 1 && "mt-12 first:mt-0")} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <button onClick={() => section.level <= 2 && toggleSection(section.id)} className={cn("w-full text-left flex items-center gap-3 group", section.level <= 2 && "cursor-pointer")}>
                    {section.level <= 2 && (
                      <motion.div animate={{ rotate: isCollapsed ? -90 : 0 }} className="text-slate-500 group-hover:text-slate-400">
                        <ChevronDown className="w-5 h-5" />
                      </motion.div>
                    )}
                    <h2 className={cn(section.level === 1 && "text-2xl font-bold text-white", section.level === 2 && "text-xl font-semibold text-white", section.level === 3 && "text-lg font-medium text-slate-200")}>{section.title}</h2>
                  </button>
                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                        <div className={cn("prose prose-invert prose-slate max-w-none mt-4", section.level <= 2 && "pl-8")} dangerouslySetInnerHTML={{ __html: renderMarkdown(section.content) }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportDisplayStep;
