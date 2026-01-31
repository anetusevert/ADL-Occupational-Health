/**
 * Arthur D. Little - Global Health Platform
 * Data Engine Page - Data Operations Center
 * Viewport-fit design with no scrolling
 * 
 * Features:
 * - Clickable data source tabs showing real data from each source
 * - Source detail modals with metrics, countries, and official links
 * - Real-time source registry with pagination
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, 
  RefreshCw, 
  ExternalLink, 
  Server, 
  Activity,
  Search,
  Filter,
  Loader2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Globe,
  X,
  FileText,
  Users,
  BarChart3,
  Link as LinkIcon
} from "lucide-react";
import { apiClient } from "../services/api";
import { VisualSyncConsole } from "../components/VisualSyncConsole";
import { cn } from "../lib/utils";

// Configuration
const ROWS_PER_PAGE = 50;

// =============================================================================
// DATA SOURCE DEFINITIONS
// =============================================================================

interface DataSourceDefinition {
  id: string;
  name: string;
  shortName: string;
  description: string;
  officialUrl: string;
  color: string;
  bgColor: string;
  borderColor: string;
  metrics: string[];
  metricPatterns: string[]; // Patterns to match in registry
}

const DATA_SOURCES: DataSourceDefinition[] = [
  {
    id: "ilo",
    name: "International Labour Organization (ILOSTAT)",
    shortName: "ILO",
    description: "Official global labor statistics including fatal and non-fatal occupational injury rates, inspector density, and social security coverage.",
    officialUrl: "https://ilostat.ilo.org/data/",
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    metrics: [
      "Fatal Accident Rate (per 100k workers)",
      "Non-Fatal Injury Rate",
      "Inspector Density (per 10k workers)",
      "ILO C187 Ratified",
      "ILO C155 Ratified"
    ],
    metricPatterns: ["fatal", "injury", "inspector", "ilo", "c187", "c155"]
  },
  {
    id: "who",
    name: "World Health Organization (GHO)",
    shortName: "WHO",
    description: "Global Health Observatory data including UHC Service Coverage Index, road traffic deaths (safety culture proxy), and health expenditure metrics.",
    officialUrl: "https://www.who.int/data/gho",
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    metrics: [
      "UHC Service Coverage Index",
      "Road Traffic Deaths (per 100k)",
      "Life Expectancy at Birth",
      "Health Workers Density"
    ],
    metricPatterns: ["uhc", "who", "road traffic", "life expectancy"]
  },
  {
    id: "worldbank",
    name: "World Bank Open Data (WDI)",
    shortName: "World Bank",
    description: "World Development Indicators including governance effectiveness, regulatory quality, health expenditure, GDP, and labor market statistics.",
    officialUrl: "https://data.worldbank.org/",
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    metrics: [
      "Government Effectiveness",
      "Regulatory Quality",
      "Rule of Law",
      "Political Stability",
      "Health Expenditure (% of GDP)",
      "GDP per Capita (PPP)",
      "Industry (% of GDP)",
      "Vulnerable Employment (%)"
    ],
    metricPatterns: ["worldbank", "world bank", "gdp", "governance", "regulatory", "industry", "expenditure"]
  },
  {
    id: "cpi",
    name: "Transparency International (CPI)",
    shortName: "CPI",
    description: "Corruption Perception Index measuring perceived levels of public sector corruption. Critical for assessing inspector integrity.",
    officialUrl: "https://www.transparency.org/cpi",
    color: "text-rose-400",
    bgColor: "bg-rose-500/20",
    borderColor: "border-rose-500/30",
    metrics: [
      "Corruption Perception Index",
      "CPI Rank"
    ],
    metricPatterns: ["corruption", "cpi"]
  },
  {
    id: "hdi",
    name: "UNDP Human Development Report",
    shortName: "HDI",
    description: "Human Development Index combining life expectancy, education, and income indicators. Maps to worker trainability and safety culture potential.",
    officialUrl: "https://hdr.undp.org/data-center/human-development-index",
    color: "text-emerald-400",
    bgColor: "bg-emerald-500/20",
    borderColor: "border-emerald-500/30",
    metrics: [
      "HDI Score",
      "HDI Rank",
      "Education Index",
      "Income Index"
    ],
    metricPatterns: ["hdi", "human development", "education index"]
  },
  {
    id: "epi",
    name: "Yale Environmental Performance Index",
    shortName: "EPI",
    description: "Environmental performance rankings including air quality, heavy metals exposure, and environmental health scores.",
    officialUrl: "https://epi.yale.edu/",
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-500/30",
    metrics: [
      "EPI Score",
      "EPI Rank",
      "Air Quality Score",
      "Environmental Health Score"
    ],
    metricPatterns: ["epi", "environmental", "air quality"]
  },
  {
    id: "gbd",
    name: "IHME Global Burden of Disease",
    shortName: "IHME GBD",
    description: "Comprehensive disease burden data including DALYs from occupational carcinogens, noise, ergonomic factors, and injuries.",
    officialUrl: "https://www.healthdata.org/research-analysis/gbd",
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/30",
    metrics: [
      "Total Occupational DALYs",
      "Occupational Injury DALYs",
      "Occupational Carcinogen DALYs",
      "Occupational Noise DALYs",
      "Occupational Deaths"
    ],
    metricPatterns: ["daly", "gbd", "ihme", "occupational death", "burden"]
  },
  {
    id: "wjp",
    name: "World Justice Project Rule of Law Index",
    shortName: "WJP",
    description: "Rule of law measurements including regulatory enforcement capacity and civil justice effectiveness.",
    officialUrl: "https://worldjusticeproject.org/rule-of-law-index/",
    color: "text-indigo-400",
    bgColor: "bg-indigo-500/20",
    borderColor: "border-indigo-500/30",
    metrics: [
      "Rule of Law Index",
      "Regulatory Enforcement Score",
      "Civil Justice Score"
    ],
    metricPatterns: ["wjp", "rule of law", "regulatory enforcement", "civil justice"]
  },
  {
    id: "oecd",
    name: "OECD Better Life Index",
    shortName: "OECD",
    description: "Work-life balance and labor market indicators for OECD member countries including hours worked and employment rates.",
    officialUrl: "https://stats.oecd.org/",
    color: "text-sky-400",
    bgColor: "bg-sky-500/20",
    borderColor: "border-sky-500/30",
    metrics: [
      "Work-Life Balance Score",
      "Annual Hours Worked",
      "Long Hours Percentage"
    ],
    metricPatterns: ["oecd", "work-life", "hours worked"]
  }
];

// =============================================================================
// TYPES
// =============================================================================

interface SourceRegistryItem {
  country_iso: string;
  country_name: string;
  metric: string;
  value: string | null;
  source_url: string | null;
}

interface SourceRegistryResponse {
  total: number;
  items: SourceRegistryItem[];
  last_updated: string | null;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function ensureAbsoluteUrl(url: string | null): string | null {
  if (!url) return null;
  const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/;
  if (!urlPattern.test(url)) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function getUrlHostname(url: string): string {
  const absoluteUrl = ensureAbsoluteUrl(url);
  if (!absoluteUrl) return url.length > 30 ? url.substring(0, 30) + "..." : url;
  try {
    return new URL(absoluteUrl).hostname;
  } catch {
    return url.substring(0, 30);
  }
}

function isValidUrl(url: string | null): boolean {
  return ensureAbsoluteUrl(url) !== null;
}

function matchesSource(item: SourceRegistryItem, source: DataSourceDefinition): boolean {
  const metricLower = item.metric.toLowerCase();
  const sourceLower = (item.source_url || "").toLowerCase();
  
  return source.metricPatterns.some(pattern => 
    metricLower.includes(pattern.toLowerCase()) || 
    sourceLower.includes(pattern.toLowerCase())
  );
}

// =============================================================================
// DATA SOURCE MODAL COMPONENT
// =============================================================================

interface DataSourceModalProps {
  source: DataSourceDefinition;
  items: SourceRegistryItem[];
  onClose: () => void;
}

function DataSourceModal({ source, items, onClose }: DataSourceModalProps) {
  const [metricFilter, setMetricFilter] = useState<string>("all");
  
  // Get items for this source
  const sourceItems = useMemo(() => 
    items.filter(item => matchesSource(item, source)),
    [items, source]
  );
  
  // Get unique metrics for this source
  const uniqueMetrics = useMemo(() => {
    const metrics = [...new Set(sourceItems.map(item => item.metric))];
    return metrics.sort();
  }, [sourceItems]);
  
  // Get unique countries for this source
  const uniqueCountries = useMemo(() => {
    const countries = new Map<string, string>();
    sourceItems.forEach(item => {
      if (!countries.has(item.country_iso)) {
        countries.set(item.country_iso, item.country_name);
      }
    });
    return Array.from(countries.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [sourceItems]);
  
  // Filter items by metric
  const filteredItems = useMemo(() => {
    if (metricFilter === "all") return sourceItems;
    return sourceItems.filter(item => item.metric === metricFilter);
  }, [sourceItems, metricFilter]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-5xl max-h-[85vh] bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className={cn("p-6 border-b border-slate-700", source.bgColor)}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className={cn(
                "w-14 h-14 rounded-xl flex items-center justify-center",
                source.bgColor, source.borderColor, "border"
              )}>
                <Database className={cn("w-7 h-7", source.color)} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{source.name}</h2>
                <p className="text-sm text-slate-400 mt-1 max-w-xl">{source.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Quick Stats - Responsive */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <LinkIcon className="w-3 h-3" />
                Official Source
              </div>
              <a
                href={source.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn("text-sm font-medium hover:underline flex items-center gap-1", source.color)}
              >
                {new URL(source.officialUrl).hostname}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <BarChart3 className="w-3 h-3" />
                Data Points
              </div>
              <div className="text-lg font-bold text-white">{sourceItems.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <FileText className="w-3 h-3" />
                Metrics
              </div>
              <div className="text-lg font-bold text-white">{uniqueMetrics.length}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-3 h-3" />
                Countries
              </div>
              <div className="text-lg font-bold text-white">{uniqueCountries.length}</div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel: Metrics & Countries */}
          <div className="w-72 border-r border-slate-700 flex flex-col overflow-hidden">
            {/* Metrics List */}
            <div className="p-4 border-b border-slate-700">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                Available Metrics
              </h3>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                <button
                  onClick={() => setMetricFilter("all")}
                  className={cn(
                    "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors",
                    metricFilter === "all"
                      ? cn(source.bgColor, source.color)
                      : "text-slate-400 hover:bg-slate-800"
                  )}
                >
                  All Metrics ({sourceItems.length})
                </button>
                {uniqueMetrics.map(metric => {
                  const count = sourceItems.filter(i => i.metric === metric).length;
                  return (
                    <button
                      key={metric}
                      onClick={() => setMetricFilter(metric)}
                      className={cn(
                        "w-full text-left px-3 py-1.5 rounded-lg text-xs transition-colors truncate",
                        metricFilter === metric
                          ? cn(source.bgColor, source.color)
                          : "text-slate-400 hover:bg-slate-800"
                      )}
                      title={metric}
                    >
                      {metric} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Countries List */}
            <div className="p-4 flex-1 overflow-hidden">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-400" />
                Countries with Data
              </h3>
              <div className="space-y-1 max-h-full overflow-y-auto pr-2">
                {uniqueCountries.map(([iso, name]) => (
                  <div
                    key={iso}
                    className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/30 rounded text-xs"
                  >
                    <span className="font-mono text-slate-500">{iso}</span>
                    <span className="text-slate-300 truncate">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Panel: Data Table */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-700 bg-slate-800/30">
              <h3 className="text-sm font-semibold text-white">
                Data Records
                <span className="ml-2 text-slate-500 font-normal">
                  ({filteredItems.length} entries)
                </span>
              </h3>
            </div>
            <div className="flex-1 overflow-auto">
              <table className="w-full">
                <thead className="sticky top-0 bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Country</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Metric</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Value</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">Source Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {filteredItems.slice(0, 100).map((item, idx) => (
                    <tr key={`${item.country_iso}-${item.metric}-${idx}`} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-slate-500">{item.country_iso}</span>
                          <span className="text-sm text-slate-300">{item.country_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-400">{item.metric}</td>
                      <td className="px-4 py-2">
                        <span className={cn("font-mono text-sm", source.color)}>
                          {item.value || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {item.source_url && isValidUrl(item.source_url) ? (
                          <a
                            href={ensureAbsoluteUrl(item.source_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {getUrlHostname(item.source_url)}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-600">
                            {item.source_url || "Internal"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredItems.length > 100 && (
                <div className="p-4 text-center text-slate-500 text-sm">
                  Showing first 100 of {filteredItems.length} records
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// DATA SOURCE TABS COMPONENT
// =============================================================================

interface DataSourceTabsProps {
  items: SourceRegistryItem[];
  onSourceClick: (source: DataSourceDefinition) => void;
}

function DataSourceTabs({ items, onSourceClick }: DataSourceTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DATA_SOURCES.map(source => {
        const count = items.filter(item => matchesSource(item, source)).length;
        const hasData = count > 0;
        
        return (
          <button
            key={source.id}
            onClick={() => hasData && onSourceClick(source)}
            disabled={!hasData}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
              hasData
                ? cn(source.bgColor, source.borderColor, source.color, "hover:scale-105 cursor-pointer")
                : "bg-slate-800/30 border-slate-700 text-slate-600 cursor-not-allowed"
            )}
          >
            {source.shortName}
            {hasData && (
              <span className="ml-1.5 text-[10px] opacity-70">({count})</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =============================================================================
// DATA SOURCE PANEL COMPONENT (Left Panel)
// =============================================================================

interface DataSourcePanelProps {
  sources: DataSourceDefinition[];
  items: SourceRegistryItem[];
  activeSourceIds: Set<string>;
  onToggleSource: (sourceId: string) => void;
  onSourceClick: (source: DataSourceDefinition) => void;
}

function DataSourcePanel({ sources, items, activeSourceIds, onToggleSource, onSourceClick }: DataSourcePanelProps) {
  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-semibold text-white">Data Sources</h2>
        </div>
        <p className="text-xs text-white/40 mt-1">Toggle sources on/off</p>
      </div>
      
      {/* Source List */}
      <div className="flex-1 overflow-auto scrollbar-thin p-3 space-y-2">
        {sources.map(source => {
          const count = items.filter(item => matchesSource(item, source)).length;
          const isActive = activeSourceIds.has(source.id);
          
          return (
            <motion.div
              key={source.id}
              className={cn(
                "p-3 rounded-lg border transition-all cursor-pointer",
                isActive
                  ? cn(source.bgColor, source.borderColor)
                  : "bg-slate-800/30 border-slate-700/50 opacity-50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div 
                  className="flex items-center gap-2 flex-1"
                  onClick={() => isActive && onSourceClick(source)}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    isActive ? source.bgColor : "bg-slate-700/50"
                  )}>
                    <Database className={cn("w-4 h-4", isActive ? source.color : "text-slate-500")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-xs font-medium truncate",
                      isActive ? "text-white" : "text-slate-400"
                    )}>
                      {source.shortName}
                    </p>
                    <p className="text-[10px] text-white/30 truncate">{source.name}</p>
                  </div>
                </div>
                
                {/* Toggle Switch */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSource(source.id);
                  }}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    isActive ? "bg-emerald-500" : "bg-slate-600"
                  )}
                >
                  <motion.div
                    className="w-4 h-4 bg-white rounded-full absolute top-0.5"
                    animate={{ left: isActive ? "1.25rem" : "0.125rem" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              
              {/* Stats */}
              <div className="flex items-center justify-between text-[10px]">
                <span className={isActive ? source.color : "text-slate-500"}>
                  {count} records
                </span>
                {isActive && count > 0 && (
                  <button
                    onClick={() => onSourceClick(source)}
                    className="text-white/40 hover:text-white/70 flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Details
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Footer Stats */}
      <div className="flex-shrink-0 p-3 border-t border-white/5 bg-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Active Sources</span>
          <span className="text-emerald-400 font-medium">{activeSourceIds.size} / {sources.length}</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LIVE OPS PANEL COMPONENT (Right Panel - Inline)
// =============================================================================

interface LiveOpsPanelProps {
  onOpenFullConsole: () => void;
  lastSync: string | null;
  totalMetrics: number;
  countriesCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function LiveOpsPanel({ onOpenFullConsole, lastSync, totalMetrics, countriesCount, onRefresh, isRefreshing }: LiveOpsPanelProps) {
  const formatDate = (isoString: string | null) => {
    if (!isoString) return "Never";
    return new Date(isoString).toLocaleString();
  };

  return (
    <div className="h-full flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/5 bg-gradient-to-r from-adl-accent/20 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-adl-accent/20 rounded-lg flex items-center justify-center border border-adl-accent/30">
              <Globe className="w-4 h-4 text-adl-accent" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Live Ops Center</h2>
              <p className="text-[10px] text-white/40">Real-time data updates</p>
            </div>
          </div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="flex-shrink-0 p-3 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-2.5 bg-slate-800/50 rounded-lg">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Total Metrics</p>
            <p className="text-lg font-bold text-white">{totalMetrics || "—"}</p>
          </div>
          <div className="p-2.5 bg-slate-800/50 rounded-lg">
            <p className="text-[10px] text-white/40 uppercase tracking-wider">Countries</p>
            <p className="text-lg font-bold text-white">{countriesCount}</p>
          </div>
        </div>
        
        <div className="p-2.5 bg-slate-800/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">Last Sync</p>
              <p className="text-xs text-white font-medium">{formatDate(lastSync)}</p>
            </div>
            <CheckCircle2 className={cn(
              "w-4 h-4",
              lastSync ? "text-emerald-400" : "text-slate-500"
            )} />
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex-1 p-3 space-y-2">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all",
            "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
            "hover:bg-emerald-500/30 hover:border-emerald-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
          {isRefreshing ? "Refreshing..." : "Refresh Data"}
        </button>
        
        <button
          onClick={onOpenFullConsole}
          className={cn(
            "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-sm transition-all",
            "bg-adl-accent text-white",
            "hover:bg-adl-blue-light"
          )}
        >
          <Activity className="w-4 h-4" />
          Open Full Console
        </button>
      </div>
      
      {/* Status Footer */}
      <div className="flex-shrink-0 p-3 border-t border-white/5 bg-white/5">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
          <span>System Online</span>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function DataEngine() {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSource, setSelectedSource] = useState<DataSourceDefinition | null>(null);
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(() => 
    new Set(DATA_SOURCES.map(s => s.id))
  );

  // Fetch source registry data
  const { 
    data: registry, 
    isLoading, 
    isError,
    refetch,
    isFetching,
    dataUpdatedAt 
  } = useQuery({
    queryKey: ["source-registry"],
    queryFn: async () => {
      const response = await apiClient.get<SourceRegistryResponse>("/api/v1/etl/registry");
      return response.data;
    },
    staleTime: 30000,
  });

  // Toggle source active state
  const handleToggleSource = (sourceId: string) => {
    setActiveSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }
      return next;
    });
  };

  // Get unique countries for filter dropdown
  const countries = useMemo(() => {
    if (!registry?.items) return [];
    const unique = [...new Set(registry.items.map(item => item.country_iso))];
    return unique.sort();
  }, [registry]);

  // Filter items by active sources, country filter, and search
  const filteredItems = useMemo(() => {
    if (!registry?.items) return [];
    
    return registry.items.filter(item => {
      // Check if any active source matches
      const matchesActiveSource = DATA_SOURCES.some(source => 
        activeSourceIds.has(source.id) && matchesSource(item, source)
      );
      if (!matchesActiveSource) return false;
      
      if (countryFilter !== "all" && item.country_iso !== countryFilter) return false;
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          item.country_name.toLowerCase().includes(searchLower) ||
          item.metric.toLowerCase().includes(searchLower) ||
          item.country_iso.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [registry, activeSourceIds, countryFilter, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCountryFilterChange = (value: string) => {
    setCountryFilter(value);
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Database className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              Data Engine
              <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-400 rounded-full">
                v2.0
              </span>
            </h1>
            <p className="text-white/40 text-sm">
              Transparency Center — Multi-Source Intelligence Hub
            </p>
          </div>
        </div>
      </div>

      {/* Three-Panel Layout - Responsive */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 overflow-auto lg:overflow-hidden">
        {/* Left Panel: Data Sources */}
        <div className="lg:col-span-3 min-h-[250px] lg:min-h-0">
          <DataSourcePanel
            sources={DATA_SOURCES}
            items={registry?.items || []}
            activeSourceIds={activeSourceIds}
            onToggleSource={handleToggleSource}
            onSourceClick={setSelectedSource}
          />
        </div>
        
        {/* Middle Panel: Data Registry (1/3) */}
        <div className="col-span-6 flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          {/* Table Header */}
          <div className="flex-shrink-0 p-3 border-b border-white/5 bg-white/5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">Source Registry</h2>
                <span className="text-white/30 text-xs">{filteredItems.length} records</span>
              </div>
              
              {/* Compact Filters */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-40 pl-8 pr-3 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                
                <select
                  value={countryFilter}
                  onChange={(e) => handleCountryFilterChange(e.target.value)}
                  className="px-2 py-1.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50"
                >
                  <option value="all">All Countries</option>
                  {countries.map(iso => (
                    <option key={iso} value={iso}>{iso}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 overflow-auto scrollbar-thin">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                <span className="ml-2 text-slate-400 text-sm">Loading...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">Connection Error</h3>
                <button
                  onClick={() => refetch()}
                  className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Database className="w-10 h-10 text-slate-600 mb-3" />
                <h3 className="text-sm font-medium text-white mb-1">No Data Found</h3>
                <p className="text-slate-400 text-xs">
                  {searchTerm || countryFilter !== "all" 
                    ? "No metrics match your filters." 
                    : "Enable sources or run ETL."
                  }
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50 bg-slate-800/20">
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase">Country</th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase">Metric</th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase">Value</th>
                    <th className="px-3 py-2 text-left text-[10px] font-medium text-slate-400 uppercase">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {paginatedItems.map((item, index) => (
                    <tr 
                      key={`${item.country_iso}-${item.metric}-${index}`}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-700/50 text-slate-300 rounded">
                            {item.country_iso}
                          </span>
                          <span className="text-white text-xs truncate max-w-[80px]" title={item.country_name}>
                            {item.country_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-slate-300 text-xs truncate block max-w-[150px]" title={item.metric}>
                          {item.metric}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-mono text-emerald-400 text-xs">
                          {item.value || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        {item.source_url && isValidUrl(item.source_url) ? (
                          <a
                            href={ensureAbsoluteUrl(item.source_url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-cyan-400 text-[10px] hover:underline"
                          >
                            <ExternalLink className="w-2.5 h-2.5" />
                            {getUrlHostname(item.source_url)}
                          </a>
                        ) : (
                          <span className="text-slate-600 text-[10px]">Internal</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Pagination Footer */}
          {filteredItems.length > 0 && (
            <div className="flex-shrink-0 px-3 py-2 border-t border-white/5 bg-white/5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-500">
                  {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length}
                </div>
                
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={cn(
                        "p-1 rounded transition-colors",
                        currentPage === 1 ? "text-slate-600" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[10px] text-slate-400 px-2">
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={cn(
                        "p-1 rounded transition-colors",
                        currentPage === totalPages ? "text-slate-600" : "text-slate-400 hover:text-white"
                      )}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Right Panel: Live Ops Center */}
        <div className="lg:col-span-3 min-h-[250px] lg:min-h-0">
          <LiveOpsPanel
            onOpenFullConsole={() => setIsConsoleOpen(true)}
            lastSync={registry?.last_updated || null}
            totalMetrics={registry?.total || 0}
            countriesCount={countries.length}
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
          />
        </div>
      </div>

      {/* Live Operations Center Modal (Full Console) */}
      <VisualSyncConsole 
        isOpen={isConsoleOpen} 
        onClose={() => setIsConsoleOpen(false)} 
      />
      
      {/* Data Source Detail Modal */}
      <AnimatePresence>
        {selectedSource && registry?.items && (
          <DataSourceModal
            source={selectedSource}
            items={registry.items}
            onClose={() => setSelectedSource(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// STATUS CARD COMPONENT
// =============================================================================

interface StatusCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  subtext: string;
  color: "cyan" | "emerald" | "amber" | "purple";
}

function StatusCard({ icon: Icon, label, value, subtext, color }: StatusCardProps) {
  const colorClasses = {
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30 text-cyan-400",
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30 text-emerald-400",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400",
  };

  const iconColorClasses = {
    cyan: "text-cyan-400",
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    purple: "text-purple-400",
  };

  return (
    <div className={cn(
      "p-4 rounded-xl bg-gradient-to-br border",
      colorClasses[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{label}</p>
          <p className="text-white text-xl font-bold">{value}</p>
          <p className="text-slate-500 text-xs mt-1">{subtext}</p>
        </div>
        <Icon className={cn("w-5 h-5", iconColorClasses[color])} />
      </div>
    </div>
  );
}

export default DataEngine;
