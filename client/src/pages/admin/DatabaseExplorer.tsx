/**
 * Arthur D. Little - GOSI Pitch Tool
 * Database Explorer Page - Admin Only
 * 
 * Shows all database tables, their sources, row counts, and field definitions.
 * Helps administrators understand where data comes from and where it's used.
 */

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Table2,
  Search,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  Hash,
  Layers,
  Globe2,
  FileText,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn, getApiBaseUrl } from "../../lib/utils";

// Types
interface FieldInfo {
  name: string;
  type: string;
  nullable: boolean;
  primary_key: boolean;
  foreign_key?: string;
  description?: string;
  source?: string;
  ui_usage: string[];
}

interface TableInfo {
  name: string;
  row_count: number;
  fields: FieldInfo[];
  description?: string;
  data_sources: string[];
  last_updated?: string;
  ui_pages: string[];
}

interface DatabaseOverview {
  total_tables: number;
  total_records: number;
  tables: TableInfo[];
  data_sources: Record<string, any>;
  generated_at: string;
}

// API fetch function
async function fetchDatabaseOverview(): Promise<DatabaseOverview> {
  const token = localStorage.getItem("gohip_token");
  
  const response = await fetch(`${getApiBaseUrl()}/api/v1/admin/database`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Authentication required. Please log in again.");
    }
    if (response.status === 403) {
      throw new Error("Admin access required.");
    }
    throw new Error("Failed to fetch database overview");
  }
  
  return response.json();
}

export function DatabaseExplorer() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["database-overview"],
    queryFn: fetchDatabaseOverview,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter tables based on search and category
  const filteredTables = data?.tables.filter((table) => {
    const matchesSearch =
      !searchQuery ||
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.data_sources.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "all" ||
      (selectedCategory === "core" && ["countries", "governance_layer", "pillar_1_hazard", "pillar_2_vigilance", "pillar_3_restoration"].includes(table.name)) ||
      (selectedCategory === "intelligence" && ["country_intelligence", "country_deep_dives"].includes(table.name)) ||
      (selectedCategory === "best_practices" && table.name.includes("best_practice")) ||
      (selectedCategory === "config" && ["users", "agents", "ai_config", "metric_definitions", "maturity_scoring_rules"].includes(table.name)) ||
      (selectedCategory === "cached" && table.name.includes("cached"));

    return matchesSearch && matchesCategory;
  }) || [];

  const categories = [
    { id: "all", label: "All Tables", count: data?.tables?.length ?? 0 },
    { id: "core", label: "Core Framework", count: 5 },
    { id: "intelligence", label: "Intelligence", count: 2 },
    { id: "best_practices", label: "Best Practices", count: 2 },
    { id: "config", label: "Configuration", count: 5 },
    { id: "cached", label: "Cached Reports", count: 2 },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-shrink-0 mb-6"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
            <Database className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-white tracking-tight">
              Database Explorer
            </h1>
            <p className="text-white/40 text-sm">
              View all tables, data sources, and where information is used
            </p>
          </div>
        </div>

        {/* Stats */}
        {data && (
          <div className="grid grid-cols-4 gap-4 mb-4">
            <StatCard
              icon={<Table2 className="w-4 h-4" />}
              label="Tables"
              value={data.total_tables.toString()}
              color="emerald"
            />
            <StatCard
              icon={<Hash className="w-4 h-4" />}
              label="Total Records"
              value={data.total_records.toLocaleString()}
              color="cyan"
            />
            <StatCard
              icon={<Globe2 className="w-4 h-4" />}
              label="External Sources"
              value="10+"
              color="purple"
            />
            <StatCard
              icon={<Clock className="w-4 h-4" />}
              label="Last Scan"
              value={new Date(data.generated_at).toLocaleTimeString()}
              color="amber"
            />
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search tables, fields, or sources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                  selectedCategory === cat.id
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800/50 text-slate-400 border border-transparent hover:bg-slate-700/50"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <span className="ml-3 text-slate-300">Loading database schema...</span>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-20 text-red-400">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <span>Failed to load database information. Admin access required.</span>
          </div>
        )}

        {data && !isLoading && (
          <div className="space-y-3">
            {filteredTables.map((table, index) => (
              <TableCard
                key={table.name}
                table={table}
                isExpanded={expandedTable === table.name}
                onToggle={() => setExpandedTable(expandedTable === table.name ? null : table.name)}
                index={index}
              />
            ))}

            {filteredTables.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                No tables match your search criteria
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "cyan" | "purple" | "amber";
}) {
  const colors = {
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    purple: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  };

  return (
    <div className={cn("rounded-lg border p-3", colors[color])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs opacity-80">{label}</span>
      </div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}

// Table Card Component
function TableCard({
  table,
  isExpanded,
  onToggle,
  index,
}: {
  table: TableInfo;
  isExpanded: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
            <Table2 className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-left">
            <h3 className="text-white font-medium">{table.name}</h3>
            {table.description && (
              <p className="text-xs text-slate-400 mt-0.5">{table.description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-medium text-white">
              {table.row_count.toLocaleString()} rows
            </div>
            <div className="text-xs text-slate-500">
              {table.fields.length} fields
            </div>
          </div>
          <div className="flex gap-1">
            {table.data_sources.slice(0, 2).map((source) => (
              <span
                key={source}
                className="px-2 py-1 bg-slate-700/50 rounded text-[10px] text-slate-400"
              >
                {source}
              </span>
            ))}
            {table.data_sources.length > 2 && (
              <span className="px-2 py-1 bg-slate-700/50 rounded text-[10px] text-slate-400">
                +{table.data_sources.length - 2}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </motion.div>
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              {/* UI Usage */}
              {table.ui_pages.length > 0 && (
                <div className="bg-slate-900/50 rounded-lg p-3">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Layers className="w-3 h-3" />
                    Used In UI
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {table.ui_pages.map((page) => (
                      <span
                        key={page}
                        className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs"
                      >
                        {page}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data Sources */}
              <div className="bg-slate-900/50 rounded-lg p-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Globe2 className="w-3 h-3" />
                  Data Sources
                </h4>
                <div className="flex flex-wrap gap-2">
                  {table.data_sources.map((source) => (
                    <span
                      key={source}
                      className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-xs flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {source}
                    </span>
                  ))}
                </div>
              </div>

              {/* Fields Table */}
              <div className="bg-slate-900/50 rounded-lg overflow-hidden">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider p-3 flex items-center gap-2 border-b border-slate-700/50">
                  <FileText className="w-3 h-3" />
                  Fields ({table.fields.length})
                </h4>
                <div className="max-h-64 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="text-left px-3 py-2 text-slate-400 font-medium">Name</th>
                        <th className="text-left px-3 py-2 text-slate-400 font-medium">Type</th>
                        <th className="text-left px-3 py-2 text-slate-400 font-medium">Source</th>
                        <th className="text-center px-3 py-2 text-slate-400 font-medium">PK</th>
                        <th className="text-center px-3 py-2 text-slate-400 font-medium">Null</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {table.fields.map((field) => (
                        <tr key={field.name} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2 text-white font-mono">
                            {field.name}
                            {field.foreign_key && (
                              <span className="ml-1 text-purple-400 text-[10px]">
                                → {field.foreign_key}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-400">{field.type}</td>
                          <td className="px-3 py-2">
                            {field.source ? (
                              <span className="text-cyan-400">{field.source}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {field.primary_key && (
                              <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-400 rounded text-[10px]">
                                PK
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {field.nullable ? (
                              <span className="text-slate-500">Yes</span>
                            ) : (
                              <span className="text-red-400">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Last Updated */}
              {table.last_updated && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3" />
                  Last updated: {new Date(table.last_updated).toLocaleString()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default DatabaseExplorer;
