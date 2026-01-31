/**
 * Arthur D. Little - Global Health Platform
 * Report Display Step
 * 
 * Step 3 of the Deep Dive Wizard - Cinematic report presentation
 * Full-screen report with animated sections
 */

import { useRef } from "react";
import { motion } from "framer-motion";
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
  RefreshCw,
  Loader2,
  Brain,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Globe,
  Home,
} from "lucide-react";
import {
  type CountryDeepDiveItem,
  type StrategicDeepDiveReport,
  type KeyFinding,
  type SWOTItem,
  type StrategicRecommendation,
} from "../../services/api";
import { cn } from "../../lib/utils";
import { FloatingParticles } from "./shared";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

const swotVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.4 + i * 0.1, duration: 0.4 },
  }),
};

interface ReportDisplayStepProps {
  report: StrategicDeepDiveReport | null | undefined;
  isLoading: boolean;
  selectedCountry: CountryDeepDiveItem | null;
  selectedTopic: string;
  onBack: () => void;
  onReset: () => void;
  onDelete: () => void;
}

// PDF Export function
function generatePDF(report: StrategicDeepDiveReport) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${report.strategy_name || report.country_name} - Strategic Deep Dive Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #1a1a2e;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #6366f1;
        }
        .header h1 { font-size: 28px; color: #1a1a2e; margin-bottom: 8px; }
        .header .subtitle { font-size: 14px; color: #6366f1; text-transform: uppercase; letter-spacing: 2px; }
        .section { margin-bottom: 32px; }
        .section h2 { font-size: 18px; color: #1a1a2e; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
        .section p { font-size: 14px; color: #374151; }
        .findings-list { list-style: none; }
        .findings-list li { padding: 12px; margin-bottom: 8px; background: #f9fafb; border-left: 4px solid #6366f1; }
        .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .swot-box { padding: 16px; border-radius: 8px; }
        .swot-box.strengths { background: #d1fae5; border: 1px solid #10b981; }
        .swot-box.weaknesses { background: #fee2e2; border: 1px solid #ef4444; }
        .swot-box.opportunities { background: #fef3c7; border: 1px solid #f59e0b; }
        .swot-box.threats { background: #ede9fe; border: 1px solid #8b5cf6; }
        @media print { body { padding: 20px; } .section { page-break-inside: avoid; } }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="subtitle">Strategic Deep Dive Report</div>
        <h1>${report.strategy_name || report.country_name}</h1>
      </div>
      ${report.executive_summary ? `<div class="section"><h2>Executive Summary</h2><p>${report.executive_summary}</p></div>` : ''}
      ${report.key_findings?.length ? `<div class="section"><h2>Key Findings</h2><ul class="findings-list">${report.key_findings.map(f => `<li><strong>${f.title}</strong><br/>${f.description}</li>`).join('')}</ul></div>` : ''}
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

export function ReportDisplayStep({
  report,
  isLoading,
  selectedCountry,
  selectedTopic,
  onBack,
  onReset,
  onDelete,
}: ReportDisplayStepProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <FloatingParticles color="purple" count={20} />
        <motion.div
          className="text-center relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="relative w-24 h-24 mx-auto mb-6"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full" />
            <div className="absolute inset-2 border-4 border-t-purple-500 rounded-full animate-spin" />
            <Brain className="w-10 h-10 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </motion.div>
          <motion.p
            className="text-slate-400 text-sm"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading strategic analysis...
          </motion.p>
        </motion.div>
      </div>
    );
  }

  // No report state
  if (!report) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
        <FloatingParticles color="cyan" count={15} />
        
        {/* Header */}
        <div className="flex-shrink-0 px-8 py-6 border-b border-slate-700/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.button
                onClick={onBack}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                whileHover={{ scale: 1.02, x: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Back</span>
              </motion.button>

              {selectedCountry && (
                <div className="flex items-center gap-3">
                  {selectedCountry.flag_url && (
                    <img
                      src={selectedCountry.flag_url}
                      alt={selectedCountry.name}
                      className="w-8 h-5 object-cover rounded shadow"
                    />
                  )}
                  <span className="text-white font-medium">{selectedCountry.name}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 text-sm">{selectedTopic}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            className="text-center max-w-md px-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.div
              className="w-24 h-24 bg-gradient-to-br from-slate-700/30 to-slate-800/30 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700/40"
              animate={{
                boxShadow: [
                  "0 0 0px rgba(100, 116, 139, 0.2)",
                  "0 0 30px rgba(100, 116, 139, 0.3)",
                  "0 0 0px rgba(100, 116, 139, 0.2)",
                ],
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <FileText className="w-12 h-12 text-slate-500" />
            </motion.div>
            <h3 className="text-xl font-semibold text-white mb-2">No Report Available</h3>
            <p className="text-sm text-slate-400 mb-6">
              This topic has not been generated yet for {selectedCountry?.name}.
            </p>
            <div className="flex items-center justify-center gap-3">
              <motion.button
                onClick={onBack}
                className="px-4 py-2 bg-slate-800/50 border border-slate-700/40 rounded-lg text-slate-300 text-sm font-medium hover:bg-slate-700/50 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Select Another Topic
              </motion.button>
              <motion.button
                onClick={onReset}
                className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-sm font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-colors"
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

  // Report display
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      {/* Header */}
      <motion.div
        className="flex-shrink-0 px-8 py-4 border-b border-slate-700/40 bg-slate-900/80 backdrop-blur-xl"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
              whileHover={{ scale: 1.02, x: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </motion.button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={onReset}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Countries
              </button>
              <ChevronLeft className="w-3 h-3 text-slate-600 rotate-180" />
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors"
              >
                Topics
              </button>
              <ChevronLeft className="w-3 h-3 text-slate-600 rotate-180" />
              <span className="text-purple-400">Report</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => generatePDF(report)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-300 text-sm hover:bg-slate-700/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              Export PDF
            </motion.button>
            <motion.button
              onClick={onDelete}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Report Content */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
      >
        <motion.div
          className="max-w-4xl mx-auto px-8 py-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Report Header */}
          <motion.div
            className="text-center mb-10"
            variants={itemVariants}
          >
            <motion.div
              className="flex items-center justify-center gap-4 mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              {selectedCountry?.flag_url && (
                <motion.img
                  src={selectedCountry.flag_url}
                  alt={selectedCountry.name}
                  className="w-16 h-10 object-cover rounded-lg shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                />
              )}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <h1 className="text-3xl font-bold text-white">
                  {report.strategy_name || selectedCountry?.name}
                </h1>
                <p className="text-purple-400 mt-1">{selectedTopic}</p>
              </motion.div>
            </motion.div>

            {/* Meta info */}
            <motion.div
              className="flex items-center justify-center gap-4 text-xs text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {report.generated_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(report.generated_at).toLocaleDateString()}
                </span>
              )}
              {report.ai_provider && (
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {report.ai_provider}
                </span>
              )}
            </motion.div>
          </motion.div>

          {/* Executive Summary */}
          {report.executive_summary && (
            <motion.section
              className="mb-8"
              variants={itemVariants}
            >
              <div className="bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-cyan-500/10 rounded-2xl border border-purple-500/20 p-6">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  Executive Summary
                </h2>
                <p className="text-slate-300 leading-relaxed">{report.executive_summary}</p>
              </div>
            </motion.section>
          )}

          {/* Key Findings */}
          {report.key_findings && report.key_findings.length > 0 && (
            <motion.section
              className="mb-8"
              variants={itemVariants}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-cyan-400" />
                Key Findings
              </h2>
              <div className="space-y-3">
                {report.key_findings.map((finding, index) => (
                  <motion.div
                    key={index}
                    className={cn(
                      "p-4 rounded-xl border",
                      finding.impact_level === "high"
                        ? "bg-red-500/5 border-red-500/20"
                        : finding.impact_level === "medium"
                        ? "bg-amber-500/5 border-amber-500/20"
                        : "bg-slate-800/40 border-slate-700/40"
                    )}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-medium text-white mb-1">{finding.title}</h4>
                        <p className="text-xs text-slate-400">{finding.description}</p>
                      </div>
                      <span className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-medium uppercase",
                        finding.impact_level === "high"
                          ? "bg-red-500/20 text-red-400"
                          : finding.impact_level === "medium"
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-slate-700/50 text-slate-400"
                      )}>
                        {finding.impact_level}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* SWOT Analysis */}
          {(report.strengths?.length > 0 || report.weaknesses?.length > 0 ||
            report.opportunities?.length > 0 || report.threats?.length > 0) && (
            <motion.section
              className="mb-8"
              variants={itemVariants}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                SWOT Analysis
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {/* Strengths */}
                <motion.div
                  className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4"
                  custom={0}
                  variants={swotVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h3 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {report.strengths?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300">
                        <span className="font-medium text-white">{item.title}:</span> {item.description}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Weaknesses */}
                <motion.div
                  className="bg-red-500/5 border border-red-500/20 rounded-xl p-4"
                  custom={1}
                  variants={swotVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                    <TrendingDown className="w-4 h-4" />
                    Weaknesses
                  </h3>
                  <ul className="space-y-2">
                    {report.weaknesses?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300">
                        <span className="font-medium text-white">{item.title}:</span> {item.description}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Opportunities */}
                <motion.div
                  className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4"
                  custom={2}
                  variants={swotVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h3 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {report.opportunities?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300">
                        <span className="font-medium text-white">{item.title}:</span> {item.description}
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Threats */}
                <motion.div
                  className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4"
                  custom={3}
                  variants={swotVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h3 className="text-sm font-medium text-purple-400 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Threats
                  </h3>
                  <ul className="space-y-2">
                    {report.threats?.map((item, i) => (
                      <li key={i} className="text-xs text-slate-300">
                        <span className="font-medium text-white">{item.title}:</span> {item.description}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* Strategic Recommendations */}
          {report.strategic_recommendations && report.strategic_recommendations.length > 0 && (
            <motion.section
              className="mb-8"
              variants={itemVariants}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Strategic Recommendations
              </h2>
              <div className="space-y-3">
                {report.strategic_recommendations.map((rec, index) => (
                  <motion.div
                    key={index}
                    className="bg-gradient-to-r from-slate-800/60 to-slate-800/40 rounded-xl border border-slate-700/40 p-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h4 className="text-sm font-medium text-white">{rec.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-medium uppercase",
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
                        <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-slate-700/50 text-slate-400">
                          {rec.timeline}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">{rec.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Priority Interventions */}
          {report.priority_interventions && report.priority_interventions.length > 0 && (
            <motion.section
              className="mb-8"
              variants={itemVariants}
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Priority Interventions
              </h2>
              <div className="bg-slate-800/40 rounded-xl border border-slate-700/40 p-4">
                <ol className="space-y-2">
                  {report.priority_interventions.map((intervention, index) => (
                    <motion.li
                      key={index}
                      className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-medium text-emerald-400">
                        {index + 1}
                      </span>
                      <span className="text-sm text-slate-300 pt-0.5">{intervention}</span>
                    </motion.li>
                  ))}
                </ol>
              </div>
            </motion.section>
          )}

          {/* Data Quality Notes */}
          {report.data_quality_notes && (
            <motion.section
              className="mb-8"
              variants={itemVariants}
            >
              <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-4">
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Data Quality Notes
                </h3>
                <p className="text-xs text-slate-400">{report.data_quality_notes}</p>
              </div>
            </motion.section>
          )}

          {/* Footer Actions */}
          <motion.div
            className="flex items-center justify-center gap-4 pt-8 pb-4 border-t border-slate-700/40"
            variants={itemVariants}
          >
            <motion.button
              onClick={onBack}
              className="px-4 py-2 bg-slate-800/50 border border-slate-700/40 rounded-lg text-slate-300 text-sm font-medium hover:bg-slate-700/50 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Another Topic
            </motion.button>
            <motion.button
              onClick={onReset}
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-sm font-medium flex items-center gap-2 hover:bg-purple-500/30 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Globe className="w-4 h-4" />
              Analyze Another Country
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default ReportDisplayStep;
