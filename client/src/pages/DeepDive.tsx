/**
 * Arthur D. Little - Global Health Platform
 * Deep Dive - Strategic Analysis Engine
 * Viewport-fit design with no scrolling
 */

import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Loader2,
  Brain,
  Database,
  Globe,
  Sparkles,
  Target,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  Lightbulb,
  Terminal,
  FileText,
  Zap,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
} from "lucide-react";

import { fetchAllCountries, runDeepDive, getDeepDiveTopics } from "../services/api";
import type { CountryListItem } from "../types/country";
import { cn, getCountryFlag } from "../lib/utils";

// ============================================================================
// TYPES
// ============================================================================

interface AgentLogEntry {
  timestamp: string;
  agent: string;
  status: string;
  message: string;
  emoji: string;
}

interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface DeepDiveResult {
  success: boolean;
  strategy_name: string;
  country_name: string;
  iso_code: string;
  topic: string;
  key_findings: string[];
  swot_analysis: SWOTAnalysis;
  recommendation: string;
  executive_summary: string;
  agent_log: AgentLogEntry[];
  generated_at: string;
  source: string;
}

interface Topic {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/**
 * Searchable Country Dropdown
 */
function CountrySelector({
  countries,
  selectedIso,
  onSelect,
  isLoading,
  disabled,
}: {
  countries: CountryListItem[];
  selectedIso: string | null;
  onSelect: (iso: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.iso_code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  const selectedCountry = countries.find((c) => c.iso_code === selectedIso);

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={isLoading || disabled}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3",
          "bg-slate-800/80 border border-slate-600/50 rounded-xl",
          "text-left transition-all duration-200",
          "hover:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/30",
          isOpen && "border-cyan-500/50 ring-2 ring-cyan-500/30",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          ) : selectedCountry ? (
            <>
              <span className="text-2xl">{getCountryFlag(selectedCountry.iso_code)}</span>
              <div>
                <p className="text-white font-medium">{selectedCountry.name}</p>
                <p className="text-xs text-slate-400">{selectedCountry.iso_code}</p>
              </div>
            </>
          ) : (
            <>
              <Globe className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">Select a country to analyze...</span>
            </>
          )}
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-slate-400">No countries found</div>
              ) : (
                filteredCountries.map((country) => (
                  <button
                    key={country.iso_code}
                    onClick={() => {
                      onSelect(country.iso_code);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                      "hover:bg-slate-700/50",
                      selectedIso === country.iso_code && "bg-cyan-500/20"
                    )}
                  >
                    <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{country.name}</p>
                      <p className="text-xs text-slate-400">{country.iso_code}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Topic Selector Cards
 */
function TopicSelector({
  topics,
  selectedTopic,
  onSelect,
  disabled,
}: {
  topics: Topic[];
  selectedTopic: string;
  onSelect: (topic: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {topics.map((topic) => (
        <button
          key={topic.id}
          onClick={() => !disabled && onSelect(topic.name)}
          disabled={disabled}
          className={cn(
            "p-3 rounded-xl border text-left transition-all duration-200",
            selectedTopic === topic.name
              ? "bg-cyan-500/20 border-cyan-500/50 ring-2 ring-cyan-500/20"
              : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <p className="text-sm font-medium text-white truncate">{topic.name}</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{topic.description}</p>
        </button>
      ))}
    </div>
  );
}

/**
 * Agent Activity Log Console
 */
function AgentActivityLog({
  entries,
  isRunning,
}: {
  entries: AgentLogEntry[];
  isRunning: boolean;
}) {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-400" />;
      case "querying":
      case "researching":
      case "synthesizing":
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400" />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case "DataAgent":
        return "text-purple-400";
      case "ResearchAgent":
        return "text-amber-400";
      case "Orchestrator":
        return "text-cyan-400";
      default:
        return "text-slate-400";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Console Header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 border-b border-slate-700/50">
        <Terminal className="w-4 h-4 text-emerald-400" />
        <span className="text-sm font-mono text-emerald-400">Agent Activity Log</span>
        {isRunning && (
          <span className="ml-auto flex items-center gap-2 text-xs text-cyan-400">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing...
          </span>
        )}
      </div>

      {/* Console Content */}
      <div className="p-4 font-mono text-sm max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="text-slate-500 text-center py-8">
            Waiting for analysis to start...
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              // Skip malformed entries
              if (!entry || !entry.agent) return null;
              
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-start gap-3"
                >
                  <span className="text-slate-500 text-xs whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                  {getStatusIcon(entry.status)}
                  <span className="text-lg">{entry.emoji}</span>
                  <span className={cn("font-semibold", getAgentColor(entry.agent))}>
                    [{entry.agent}]
                  </span>
                  <span className="text-slate-300">{entry.message}</span>
                </motion.div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * SWOT Analysis Visualization
 */
function SWOTGrid({ swot }: { swot: SWOTAnalysis }) {
  const quadrants = [
    {
      title: "Strengths",
      items: swot.strengths,
      icon: TrendingUp,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "Weaknesses",
      items: swot.weaknesses,
      icon: TrendingDown,
      color: "text-red-400",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
    },
    {
      title: "Opportunities",
      items: swot.opportunities,
      icon: Lightbulb,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Threats",
      items: swot.threats,
      icon: AlertTriangle,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/30",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {quadrants.map((q) => (
        <div
          key={q.title}
          className={cn("rounded-xl border p-4", q.bgColor, q.borderColor)}
        >
          <div className="flex items-center gap-2 mb-3">
            <q.icon className={cn("w-5 h-5", q.color)} />
            <h4 className={cn("font-semibold", q.color)}>{q.title}</h4>
          </div>
          <ul className="space-y-2">
            {q.items.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full", q.color.replace("text-", "bg-"))} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Strategic Report Panel
 */
function StrategicReport({ result }: { result: DeepDiveResult }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
      {/* Report Header */}
      <div className="bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-slate-700/50 p-6">
        <div className="flex items-center gap-2 text-cyan-400 mb-2">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium uppercase tracking-wider">
            Strategic Analysis Report
          </span>
        </div>
        <h2 className="text-2xl font-bold text-white">{result.strategy_name}</h2>
        <div className="flex items-center gap-4 mt-3 text-sm text-slate-400">
          <span className="flex items-center gap-1">
            <Globe className="w-4 h-4" />
            {result.country_name}
          </span>
          <span className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            {result.topic}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {new Date(result.generated_at).toLocaleString()}
          </span>
          <span className={cn(
            "px-2 py-0.5 rounded text-xs",
            "bg-emerald-500/20 text-emerald-400"
          )}>
            Expert Analysis
          </span>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6 space-y-8">
        {/* Executive Summary */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Executive Summary
          </h3>
          <p className="text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-700/30">
            {result.executive_summary}
          </p>
        </section>

        {/* Key Findings */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Key Findings
          </h3>
          <ul className="space-y-3">
            {result.key_findings.map((finding, idx) => (
              <motion.li
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-3 text-slate-300"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center text-sm font-medium">
                  {idx + 1}
                </span>
                {finding}
              </motion.li>
            ))}
          </ul>
        </section>

        {/* SWOT Analysis */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-400" />
            SWOT Analysis
          </h3>
          <SWOTGrid swot={result.swot_analysis} />
        </section>

        {/* Strategic Recommendation */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <ArrowRight className="w-5 h-5 text-emerald-400" />
            Strategic Recommendation
          </h3>
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-slate-200 leading-relaxed">{result.recommendation}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DeepDive() {
  // State
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>("Rehabilitation & Return-to-Work");
  const [agentLog, setAgentLog] = useState<AgentLogEntry[]>([]);
  const [result, setResult] = useState<DeepDiveResult | null>(null);

  // Fetch countries list
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries-list"],
    queryFn: fetchAllCountries,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch suggested topics
  const { data: topicsData } = useQuery({
    queryKey: ["deep-dive-topics"],
    queryFn: getDeepDiveTopics,
    staleTime: 60 * 60 * 1000, // 1 hour
  });

  // Deep dive mutation
  const deepDiveMutation = useMutation({
    mutationFn: ({ iso_code, topic }: { iso_code: string; topic: string }) =>
      runDeepDive(iso_code, topic),
    onMutate: () => {
      setAgentLog([]);
      setResult(null);
    },
    onSuccess: (data) => {
      setAgentLog(data.agent_log || []);
      setResult(data);
    },
    onError: (error: Error) => {
      setAgentLog((prev) => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          agent: "System",
          status: "error",
          message: `Analysis failed: ${error.message}`,
          emoji: "❌",
        },
      ]);
    },
  });

  // Handlers
  const handleRunAnalysis = () => {
    if (!selectedIso) return;
    deepDiveMutation.mutate({ iso_code: selectedIso, topic: selectedTopic });
  };

  const countries = countriesData?.countries ?? [];
  const topics = topicsData?.topics ?? [
    { id: "rehabilitation", name: "Rehabilitation & Return-to-Work", description: "Analyze rehabilitation infrastructure", keywords: [] },
    { id: "hazard", name: "Hazard Control & Prevention", description: "Evaluate safety measures", keywords: [] },
    { id: "surveillance", name: "Health Surveillance Systems", description: "Assess monitoring systems", keywords: [] },
    { id: "governance", name: "Policy & Governance", description: "Review regulatory framework", keywords: [] },
  ];

  const isRunning = deepDiveMutation.isPending;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Strategic Deep Dive
            </h1>
            <p className="text-white/40 text-sm">
              Advanced Analysis Engine
            </p>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={handleRunAnalysis}
          disabled={!selectedIso || isRunning}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-200 text-sm",
            selectedIso && !isRunning
              ? "bg-adl-accent text-white hover:bg-adl-blue-light"
              : "bg-white/5 text-white/30 cursor-not-allowed"
          )}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Run Analysis
            </>
          )}
        </button>
      </div>

      {/* Configuration Panel */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 space-y-6">
        {/* Country Selection */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            Select Country
          </label>
          <CountrySelector
            countries={countries}
            selectedIso={selectedIso}
            onSelect={setSelectedIso}
            isLoading={isLoadingCountries}
            disabled={isRunning}
          />
        </div>

        {/* Topic Selection */}
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
            <Target className="w-4 h-4 text-purple-400" />
            Select Analysis Topic
          </label>
          <TopicSelector
            topics={topics}
            selectedTopic={selectedTopic}
            onSelect={setSelectedTopic}
            disabled={isRunning}
          />
        </div>

        {/* Agent Info */}
        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
          <h4 className="text-sm font-medium text-slate-300 mb-3">Data Sources</h4>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="text-sm text-slate-400">DataAgent</span>
              <span className="text-xs text-slate-500">Internal Metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-slate-400">ResearchAgent</span>
              <span className="text-xs text-slate-500">Web Research</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-slate-400">Orchestrator</span>
              <span className="text-xs text-slate-500">Data Synthesis</span>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Content - Split View */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Agent Activity Log */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Agent Activity</h2>
          </div>
          <AgentActivityLog entries={agentLog} isRunning={isRunning} />

          {/* Quick status cards when running */}
          {isRunning && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 text-center">
                <Database className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                <p className="text-xs text-purple-400">DataAgent</p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
                <Globe className="w-6 h-6 text-amber-400 mx-auto mb-1" />
                <p className="text-xs text-amber-400">ResearchAgent</p>
              </div>
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 text-center">
                <Brain className="w-6 h-6 text-cyan-400 mx-auto mb-1" />
                <p className="text-xs text-cyan-400">Orchestrator</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Results / Placeholder */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Strategic Report</h2>
          </div>

          {result ? (
            <StrategicReport result={result} />
          ) : (
            <div className="bg-slate-800/30 border border-slate-700/50 border-dashed rounded-xl p-12 text-center">
              {isRunning ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                  <p className="text-slate-400">
                    Generating strategic analysis...
                  </p>
                  <p className="text-sm text-slate-500">
                    This typically takes 5-15 seconds
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400">
                    Select a country and topic, then click "Run Deep Dive" to generate
                    strategic intelligence.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Full-width report when complete */}
      {result && (
        <div className="border-t border-slate-700/50 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Full Analysis Report
            </h2>
            <button
              onClick={handleRunAnalysis}
              disabled={isRunning}
              className="flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300"
            >
              <RefreshCw className={cn("w-4 h-4", isRunning && "animate-spin")} />
              Re-run Analysis
            </button>
          </div>
          <StrategicReport result={result} />
        </div>
      )}

      {/* Footer */}
      <div className="text-xs text-slate-500 text-center py-4 border-t border-slate-800">
        Powered by Arthur D. Little Advanced Analytics | Data Analysis + Research + Strategic Insights
        <br />
        ADL Occupational Health Framework v2.0
      </div>
    </div>
  );
}

export default DeepDive;
