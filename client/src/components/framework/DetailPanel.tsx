/**
 * GOHIP Platform - Detail Panel Component
 * Framework Block Detail Display (Enhanced with Extended Content & Tabs)
 * 
 * Phase 6: Interactive Framework Visualization
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Database,
  Target,
  BookOpen,
  ChevronRight,
  HelpCircle,
  Globe,
  AlertTriangle,
  BarChart3,
  Link2,
  FileText,
  ExternalLink,
  Clock,
  Building2,
  CheckCircle2,
} from "lucide-react";
import { getBlockById, getDataSourceByName, type DataSourceDetail } from "../../data/frameworkContent";
import { cn } from "../../lib/utils";

type TabType = "overview" | "data";

interface DetailPanelProps {
  blockId: string | null;
  onClose: () => void;
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  delay?: number;
  defaultOpen?: boolean;
}

/**
 * Collapsible Section Component
 */
function Section({ title, icon, children, delay = 0 }: SectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 text-slate-300">
        {icon}
        <h4 className="text-sm font-semibold uppercase tracking-wide">{title}</h4>
      </div>
      {children}
    </motion.div>
  );
}

/**
 * Data Source Card Component
 */
function DataSourceCard({ 
  sourceName, 
  detail, 
  index, 
  color,
  onSelect 
}: { 
  sourceName: string; 
  detail: DataSourceDetail | undefined;
  index: number;
  color: string;
  onSelect: (detail: DataSourceDetail) => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
      onClick={() => detail && onSelect(detail)}
      className={cn(
        "w-full p-4 rounded-xl border text-left transition-all duration-200",
        "bg-slate-800/50 border-slate-700/50",
        detail && "hover:bg-slate-700/50 hover:border-slate-600/50 cursor-pointer group",
        !detail && "opacity-60 cursor-default"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Organization Logo or Icon */}
        <div className={cn(
          "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white/5 border border-slate-700/50 overflow-hidden",
          detail?.logoUrl && "p-1.5"
        )}>
          {detail?.logoUrl ? (
            <img 
              src={detail.logoUrl} 
              alt={detail.organization}
              className="w-full h-full object-contain"
              onError={(e) => {
                // Fallback to icon on image load error
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Database className={cn(
            "w-5 h-5", 
            `text-${color}-400`,
            detail?.logoUrl && "hidden"
          )} />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-medium text-white truncate">
            {sourceName}
          </h5>
          {detail && (
            <>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {detail.description.slice(0, 100)}...
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className={cn(
                  "text-[10px] px-2 py-0.5 rounded-full",
                  detail.sourceType === 'international' && "bg-blue-500/20 text-blue-300",
                  detail.sourceType === 'government' && "bg-purple-500/20 text-purple-300",
                  detail.sourceType === 'registry' && "bg-emerald-500/20 text-emerald-300",
                  detail.sourceType === 'survey' && "bg-amber-500/20 text-amber-300",
                  detail.sourceType === 'research' && "bg-cyan-500/20 text-cyan-300",
                )}>
                  {detail.sourceType}
                </span>
                <span className="text-[10px] text-slate-500">
                  {detail.organization}
                </span>
              </div>
            </>
          )}
          {!detail && (
            <p className="text-xs text-slate-500 mt-1">
              Details coming soon
            </p>
          )}
        </div>
        {detail && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ChevronRight className="w-4 h-4 text-slate-500" />
          </div>
        )}
      </div>
    </motion.button>
  );
}

/**
 * Data Source Detail Modal
 */
function DataSourceDetailView({ 
  detail, 
  onBack,
  color 
}: { 
  detail: DataSourceDetail; 
  onBack: () => void;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ChevronRight className="w-4 h-4 rotate-180" />
        Back to Data Sources
      </button>

      {/* Header with Logo */}
      <div className={cn(
        "p-4 rounded-xl border",
        `bg-${color}-500/10 border-${color}-500/20`
      )}>
        <div className="flex items-start gap-4">
          {/* Organization Logo */}
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center bg-white/10 border border-white/20 overflow-hidden p-2"
          )}>
            {detail.logoUrl ? (
              <img 
                src={detail.logoUrl} 
                alt={detail.organization}
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Database className={cn("w-6 h-6", `text-${color}-400`)} />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-white">{detail.name}</h4>
            <p className={cn("text-sm", `text-${color}-300/80`)}>{detail.organization}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-300">
          <FileText className="w-4 h-4" />
          <h5 className="text-sm font-semibold uppercase tracking-wide">Description</h5>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed">
          {detail.description}
        </p>
      </div>

      {/* Metadata Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Update Frequency</span>
          </div>
          <p className="text-sm text-white">{detail.updateFrequency}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Coverage</span>
          </div>
          <p className="text-sm text-white">{detail.coverage}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Reliability</span>
          </div>
          <p className={cn(
            "text-sm font-medium",
            detail.reliability === 'High' && "text-emerald-400",
            detail.reliability === 'Medium' && "text-yellow-400",
            detail.reliability === 'Variable' && "text-orange-400",
          )}>{detail.reliability}</p>
        </div>
        <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-wide">Source Type</span>
          </div>
          <p className="text-sm text-white capitalize">{detail.sourceType}</p>
        </div>
      </div>

      {/* Feeds Into */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-slate-300">
          <Link2 className="w-4 h-4" />
          <h5 className="text-sm font-semibold uppercase tracking-wide">Feeds Into</h5>
        </div>
        <div className="flex flex-wrap gap-2">
          {detail.feedsInto.map((item, idx) => (
            <span
              key={idx}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium",
                `bg-${color}-500/15 text-${color}-300 border border-${color}-500/20`
              )}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* URL Link - Always visible and prominent */}
      <a
        href={detail.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center justify-center gap-3 p-4 rounded-xl border transition-all group",
          `bg-${color}-500/10 border-${color}-500/30 hover:bg-${color}-500/20 hover:border-${color}-500/50`,
          `text-${color}-300`
        )}
      >
        {detail.logoUrl && (
          <div className="w-6 h-6 flex items-center justify-center bg-white/10 rounded overflow-hidden p-0.5">
            <img 
              src={detail.logoUrl} 
              alt="" 
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}
        <span className="text-sm font-semibold">Visit {detail.organization}</span>
        <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
      </a>
    </motion.div>
  );
}

/**
 * Detail Panel Component - Enhanced with Extended Content & Tabs
 */
export function DetailPanel({ blockId, onClose }: DetailPanelProps) {
  const block = blockId ? getBlockById(blockId) : null;
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceDetail | null>(null);

  // Reset state when block changes
  if (!block) {
    return null;
  }

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <BookOpen className="w-4 h-4" /> },
    { id: "data", label: "Data Sources", icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <AnimatePresence mode="wait">
      {block && (
        <motion.div
          key={block.id}
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 50, scale: 0.95 }}
          transition={{
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
          className={cn(
            "relative rounded-2xl border backdrop-blur-xl overflow-hidden h-full flex flex-col",
            "bg-black/90 border-white/10",
            "shadow-2xl shadow-black/70"
          )}
        >
          {/* Gradient Header */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className={cn(
              "relative px-6 py-5 bg-gradient-to-r flex-shrink-0",
              block.gradientFrom,
              block.gradientTo
            )}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={cn(
                "absolute top-4 right-4 p-2 rounded-lg transition-all duration-200",
                "bg-white/10 hover:bg-white/20 text-white/70 hover:text-white"
              )}
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header Content */}
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 200,
                }}
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center",
                  `bg-${block.color}-500/30`
                )}
              >
                <block.icon className={cn("w-7 h-7", `text-${block.color}-300`)} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.3 }}
                  className="text-xl font-bold text-white"
                >
                  {block.title}
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  className={cn("text-sm", `text-${block.color}-300/80`)}
                >
                  {block.subtitle}
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <div className="flex-shrink-0 px-4 pt-4">
            <div className="flex gap-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedDataSource(null);
                  }}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    activeTab === tab.id
                      ? `bg-${block.color}-500/20 text-${block.color}-300 border border-${block.color}-500/30`
                      : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content Body - Scrollable */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === "data" ? (
                <motion.div
                  key="data-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {selectedDataSource ? (
                    <DataSourceDetailView
                      detail={selectedDataSource}
                      onBack={() => setSelectedDataSource(null)}
                      color={block.color}
                    />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-4">
                        <Database className={cn("w-5 h-5", `text-${block.color}-400`)} />
                        <h4 className="text-lg font-semibold text-white">Data Sources</h4>
                        <span className="text-xs text-slate-400 ml-auto">
                          {block.dataSources.length} sources
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-4">
                        These data sources feed into the {block.title.toLowerCase()} assessment. Click on any source to learn more.
                      </p>
                      <div className="space-y-3">
                        {block.dataSources.map((source, index) => {
                          const detail = getDataSourceByName(source);
                          return (
                            <DataSourceCard
                              key={index}
                              sourceName={source}
                              detail={detail}
                              index={index}
                              color={block.color}
                              onSelect={setSelectedDataSource}
                            />
                          );
                        })}
                      </div>
                    </>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="overview-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
            {/* Core Objective */}
            <Section
              title="Core Objective"
              icon={<Target className="w-4 h-4" />}
              delay={0.35}
            >
              <div
                className={cn(
                  "p-4 rounded-lg border",
                  `bg-${block.color}-500/10 border-${block.color}-500/20`
                )}
              >
                <p className="text-slate-200 leading-relaxed text-sm">
                  {block.coreObjective}
                </p>
              </div>
            </Section>

            {/* Overview / Description */}
            <Section
              title="Overview"
              icon={<BookOpen className="w-4 h-4" />}
              delay={0.4}
            >
              <p className="text-slate-300 leading-relaxed text-sm">
                {block.description}
              </p>
            </Section>

            {/* Why It Matters */}
            <Section
              title="Why It Matters"
              icon={<AlertTriangle className="w-4 h-4" />}
              delay={0.45}
            >
              <p className="text-slate-300 leading-relaxed text-sm italic border-l-2 border-${block.color}-500/50 pl-4">
                "{block.relevance}"
              </p>
            </Section>

            {/* Key Assessment Questions */}
            <Section
              title="Key Assessment Questions"
              icon={<HelpCircle className="w-4 h-4" />}
              delay={0.5}
            >
              <ul className="space-y-2">
                {block.keyQuestions.map((question, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + index * 0.03, duration: 0.3 }}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className={cn("text-xs font-bold mt-0.5", `text-${block.color}-400`)}>
                      Q{index + 1}
                    </span>
                    <span>{question}</span>
                  </motion.li>
                ))}
              </ul>
            </Section>

            {/* Best Practice Examples */}
            <Section
              title="Best Practice Examples"
              icon={<Globe className="w-4 h-4" />}
              delay={0.6}
            >
              <div className="space-y-3">
                {block.bestPracticeExamples.map((example, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 + index * 0.05, duration: 0.3 }}
                    className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-sm font-semibold", `text-${block.color}-400`)}>
                        {example.country}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {example.practice}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Section>

            {/* Common Challenges */}
            <Section
              title="Common Challenges"
              icon={<AlertTriangle className="w-4 h-4" />}
              delay={0.75}
            >
              <ul className="space-y-2">
                {block.commonChallenges.map((challenge, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + index * 0.03, duration: 0.3 }}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
                    <ChevronRight
                      className={cn("w-4 h-4 mt-0.5 flex-shrink-0 text-red-400/70")}
                    />
                    <span>{challenge}</span>
                  </motion.li>
                ))}
              </ul>
            </Section>

            {/* Scoring Criteria */}
            <Section
              title="Scoring Criteria"
              icon={<BarChart3 className="w-4 h-4" />}
              delay={0.9}
            >
              <div className="space-y-2">
                {block.scoringCriteria.map((criteria, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.95 + index * 0.05, duration: 0.3 }}
                    className={cn(
                      "p-3 rounded-lg border",
                      index === 0 && "bg-emerald-500/10 border-emerald-500/30",
                      index === 1 && "bg-yellow-500/10 border-yellow-500/30",
                      index === 2 && "bg-orange-500/10 border-orange-500/30",
                      index === 3 && "bg-red-500/10 border-red-500/30"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cn(
                        "text-sm font-semibold",
                        index === 0 && "text-emerald-400",
                        index === 1 && "text-yellow-400",
                        index === 2 && "text-orange-400",
                        index === 3 && "text-red-400"
                      )}>
                        {criteria.level}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {criteria.score}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {criteria.description}
                    </p>
                  </motion.div>
                ))}
              </div>
            </Section>

            {/* Interaction with Other Pillars */}
            <Section
              title="Interaction with Other Pillars"
              icon={<Link2 className="w-4 h-4" />}
              delay={1.1}
            >
              <div
                className={cn(
                  "p-4 rounded-lg border bg-slate-800/30 border-slate-700/50"
                )}
              >
                <p className="text-slate-300 leading-relaxed text-sm">
                  {block.interactionWithOtherPillars}
                </p>
              </div>
            </Section>

            {/* Data Sources */}
            <Section
              title="Data Sources"
              icon={<Database className="w-4 h-4" />}
              delay={1.2}
            >
              <ul className="space-y-2">
                {block.dataSources.map((source, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.25 + index * 0.03, duration: 0.3 }}
                    className="flex items-start gap-2 text-sm text-slate-400"
                  >
                    <ChevronRight
                      className={cn("w-4 h-4 mt-0.5 flex-shrink-0", `text-${block.color}-400`)}
                    />
                    <span>{source}</span>
                  </motion.li>
                ))}
              </ul>
            </Section>

            {/* Key Metrics */}
            <Section
              title="Key Metrics"
              icon={<Target className="w-4 h-4" />}
              delay={1.3}
            >
              <div className="flex flex-wrap gap-2">
                {block.keyMetrics.map((metric, index) => (
                  <motion.span
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.35 + index * 0.05, duration: 0.3 }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium",
                      `bg-${block.color}-500/15 text-${block.color}-300 border border-${block.color}-500/20`
                    )}
                  >
                    {metric}
                  </motion.span>
                ))}
              </div>
            </Section>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.5 }}
            className={cn(
              "absolute bottom-0 left-0 right-0 h-32 pointer-events-none",
              `bg-gradient-to-t from-${block.color}-500/5 to-transparent`
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DetailPanel;
