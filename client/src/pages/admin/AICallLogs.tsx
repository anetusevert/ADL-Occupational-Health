/**
 * Arthur D. Little - Global Health Platform
 * AI Call Logs - Admin Dashboard
 * View persistent traces of all AI API calls
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  RefreshCw,
  TrendingUp,
  Zap,
  Server,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAICallTraces,
  getAICallStats,
  type AICallTrace,
  type AICallTracesFilters,
} from "../../services/auth";
import { cn } from "../../lib/utils";

// Provider colors
const providerColors: Record<string, string> = {
  openai: "bg-green-500/20 text-green-400 border-green-500/30",
  anthropic: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  google: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  azure_openai: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  mistral: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ollama: "bg-slate-500/20 text-slate-400 border-slate-500/30",
};

// Operation type display names
const operationNames: Record<string, string> = {
  connection_test: "Connection Test",
  strategic_assessment: "Strategic Assessment",
  strategic_deep_dive: "Strategic Deep Dive",
  openai_web_search: "OpenAI Web Search",
  orchestrator_synthesis: "Orchestrator Synthesis",
  metric_explanation: "Metric Explanation",
};

function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function AICallLogs() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AICallTracesFilters>({
    page: 1,
    page_size: 25,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch traces
  const {
    data: tracesData,
    isLoading: tracesLoading,
    error: tracesError,
    refetch: refetchTraces,
  } = useQuery({
    queryKey: ["ai-call-traces", filters],
    queryFn: () => getAICallTraces({ ...filters, page }),
  });

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["ai-call-stats"],
    queryFn: () => getAICallStats(30),
  });

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const handleFilterChange = (key: keyof AICallTracesFilters, value: string | boolean | undefined) => {
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      page: 1,
      [key]: value === "" ? undefined : value,
    }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters({ page: 1, page_size: 25 });
  };

  if (tracesLoading && !tracesData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (tracesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-red-400">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Failed to load AI call traces
      </div>
    );
  }

  const totalPages = tracesData ? Math.ceil(tracesData.total / (filters.page_size || 25)) : 0;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              AI Call Logs
            </h1>
            <p className="text-white/40 text-sm">
              Persistent traces of all AI provider API calls
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-colors",
              showFilters
                ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            )}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button
            onClick={() => refetchTraces()}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 text-white/60 rounded-lg font-medium text-sm hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {statsData && !statsLoading && (
        <div className="flex-shrink-0 grid grid-cols-4 gap-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Total Calls (30d)</p>
                <p className="text-2xl font-bold text-white">{statsData.total_calls}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Success Rate</p>
                <p className="text-2xl font-bold text-white">{statsData.success_rate}%</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Avg Latency</p>
                <p className="text-2xl font-bold text-white">{formatLatency(statsData.avg_latency_ms)}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-white/40 text-xs">Errors (30d)</p>
                <p className="text-2xl font-bold text-white">{statsData.error_count}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="flex-shrink-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 mb-4"
        >
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs text-white/40 mb-1">Provider</label>
              <select
                value={filters.provider || ""}
                onChange={(e) => handleFilterChange("provider", e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm min-w-[140px]"
              >
                <option value="">All Providers</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="azure_openai">Azure OpenAI</option>
                <option value="mistral">Mistral</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1">Operation</label>
              <select
                value={filters.operation_type || ""}
                onChange={(e) => handleFilterChange("operation_type", e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm min-w-[180px]"
              >
                <option value="">All Operations</option>
                <option value="connection_test">Connection Test</option>
                <option value="strategic_assessment">Strategic Assessment</option>
                <option value="strategic_deep_dive">Strategic Deep Dive</option>
                <option value="openai_web_search">OpenAI Web Search</option>
                <option value="orchestrator_synthesis">Orchestrator Synthesis</option>
                <option value="metric_explanation">Metric Explanation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1">Status</label>
              <select
                value={filters.success === undefined ? "" : filters.success.toString()}
                onChange={(e) => handleFilterChange("success", e.target.value === "" ? undefined : e.target.value === "true")}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm min-w-[120px]"
              >
                <option value="">All</option>
                <option value="true">Success</option>
                <option value="false">Error</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-white/40 mb-1">Country</label>
              <input
                type="text"
                placeholder="ISO Code"
                value={filters.country_iso_code || ""}
                onChange={(e) => handleFilterChange("country_iso_code", e.target.value.toUpperCase())}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm w-24"
                maxLength={3}
              />
            </div>

            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </motion.div>
      )}

      {/* Traces Table */}
      <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
              <tr className="border-b border-slate-700/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Latency
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {tracesData?.traces.map((trace: AICallTrace) => (
                <tr
                  key={trace.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">
                    {formatDate(trace.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border",
                        providerColors[trace.provider] || "bg-slate-500/20 text-slate-400 border-slate-500/30"
                      )}
                    >
                      <Server className="w-3 h-3" />
                      {trace.provider}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white/80 font-mono">
                    {trace.model_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60">
                    {operationNames[trace.operation_type] || trace.operation_type}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60 font-mono">
                    {trace.country_iso_code || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-white/60 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatLatency(trace.latency_ms)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {trace.success ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        Success
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-red-400 text-sm cursor-help"
                        title={trace.error_message || "Unknown error"}
                      >
                        <XCircle className="w-4 h-4" />
                        Error
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {(tracesData?.traces?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-white/40">
                    No traces found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {tracesData && tracesData.total > 0 && (
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
            <p className="text-sm text-white/40">
              Showing {((page - 1) * (filters.page_size || 25)) + 1} to{" "}
              {Math.min(page * (filters.page_size || 25), tracesData.total)} of{" "}
              {tracesData.total} traces
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  page === 1
                    ? "text-white/20 cursor-not-allowed"
                    : "text-white/60 hover:bg-white/10"
                )}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-sm text-white/60 px-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className={cn(
                  "p-2 rounded-lg transition-colors",
                  page >= totalPages
                    ? "text-white/20 cursor-not-allowed"
                    : "text-white/60 hover:bg-white/10"
                )}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
