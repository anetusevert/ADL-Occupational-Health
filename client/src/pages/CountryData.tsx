/**
 * Arthur D. Little - Global Health Platform
 * Country Data Registry - Three-Panel Interactive Layout
 * 
 * Features:
 * - Left Panel: Country selection with search (no limit)
 * - Middle Panel: Data layers with drill-down to individual metrics
 * - Right Panel: Live pivot table with drag-and-drop
 * - Real-time dynamic updates
 * - Excel export
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Table2,
  Search,
  X,
  Globe,
  Check,
  Layers,
  Shield,
  AlertOctagon,
  Eye,
  HeartPulse,
  Brain,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  AlertTriangle,
  GripVertical,
  GripHorizontal,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  fetchCountryDataCountries,
  fetchCountryDataCategories,
  fetchPivotTable,
} from "../services/api";
import type {
  CountryDataSummary,
  CategoryInfo,
  PivotTableResponse,
  PivotRow,
  PivotCountryMeta,
} from "../services/api";
import { cn, getApiBaseUrl } from "../lib/utils";

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_STYLES: Record<
  string,
  { gradient: string; border: string; bg: string; icon: React.ElementType; color: string }
> = {
  governance: {
    gradient: "from-purple-500 to-purple-600",
    border: "border-purple-500/50",
    bg: "bg-purple-500/10",
    icon: Shield,
    color: "text-purple-400",
  },
  pillar_1_hazard: {
    gradient: "from-red-500 to-orange-500",
    border: "border-red-500/50",
    bg: "bg-red-500/10",
    icon: AlertOctagon,
    color: "text-red-400",
  },
  pillar_2_vigilance: {
    gradient: "from-cyan-500 to-blue-500",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    icon: Eye,
    color: "text-cyan-400",
  },
  pillar_3_restoration: {
    gradient: "from-emerald-500 to-green-500",
    border: "border-emerald-500/50",
    bg: "bg-emerald-500/10",
    icon: HeartPulse,
    color: "text-emerald-400",
  },
  intelligence_governance: {
    gradient: "from-violet-500 to-purple-500",
    border: "border-violet-500/50",
    bg: "bg-violet-500/10",
    icon: Brain,
    color: "text-violet-400",
  },
  intelligence_hazard: {
    gradient: "from-orange-500 to-red-500",
    border: "border-orange-500/50",
    bg: "bg-orange-500/10",
    icon: Brain,
    color: "text-orange-400",
  },
  intelligence_vigilance: {
    gradient: "from-blue-500 to-cyan-500",
    border: "border-blue-500/50",
    bg: "bg-blue-500/10",
    icon: Brain,
    color: "text-blue-400",
  },
  intelligence_restoration: {
    gradient: "from-green-500 to-emerald-500",
    border: "border-green-500/50",
    bg: "bg-green-500/10",
    icon: Brain,
    color: "text-green-400",
  },
  intelligence_economic: {
    gradient: "from-amber-500 to-yellow-500",
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    icon: Brain,
    color: "text-amber-400",
  },
};

const DEFAULT_STYLE = {
  gradient: "from-slate-500 to-slate-600",
  border: "border-slate-500/50",
  bg: "bg-slate-500/10",
  icon: Layers,
  color: "text-slate-400",
};

// ============================================================================
// EXCEL EXPORT
// ============================================================================

async function exportToExcel(data: PivotTableResponse, _selectedCategories: string[]) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const headers = ["Metric", "Unit", ...data.countries.map((c) => `${c.name} (${c.iso_code})`)];
  const rows = data.rows.map((row) => [
    row.metric.name,
    row.metric.unit || "-",
    ...row.values.map((v) => v.formatted_value),
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = [{ wch: 30 }, { wch: 12 }, ...data.countries.map(() => ({ wch: 15 }))];
  XLSX.utils.book_append_sheet(wb, ws, "Country Data");

  const dateStr = new Date().toISOString().split("T")[0].replace(/-/g, "");
  XLSX.writeFile(wb, `GOHIP_CountryData_${data.countries.length}countries_${dateStr}.xlsx`);
}

// ============================================================================
// COUNTRY PANEL (LEFT)
// ============================================================================

interface CountryPanelProps {
  countries: CountryDataSummary[];
  selectedCountries: string[];
  onSelectionChange: (selected: string[]) => void;
}

function CountryPanel({ countries, selectedCountries, onSelectionChange }: CountryPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const q = searchQuery.toLowerCase();
    return countries.filter((c) => c.name.toLowerCase().includes(q) || c.iso_code.toLowerCase().includes(q));
  }, [countries, searchQuery]);

  const handleToggle = (iso: string) => {
    if (selectedCountries.includes(iso)) {
      onSelectionChange(selectedCountries.filter((c) => c !== iso));
    } else {
      onSelectionChange([...selectedCountries, iso]);
    }
  };

  const handleSelectAll = () => onSelectionChange(filteredCountries.map((c) => c.iso_code));
  const handleClearAll = () => onSelectionChange([]);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Countries</h2>
            <p className="text-xs text-slate-400">
              {selectedCountries.length} of {countries.length} selected
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-slate-800/80 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mt-3">
          <button onClick={handleSelectAll} className="flex-1 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors">
            Select All
          </button>
          <button onClick={handleClearAll} className="flex-1 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors">
            Clear
          </button>
        </div>
      </div>

      {/* Country List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredCountries.map((country) => {
          const isSelected = selectedCountries.includes(country.iso_code);
          return (
            <motion.button
              key={country.iso_code}
              onClick={() => handleToggle(country.iso_code)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 p-2 rounded-lg transition-all duration-200",
                isSelected
                  ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40"
                  : "hover:bg-slate-800/50 border border-transparent"
              )}
            >
              {/* Flag */}
              <div className="flex-shrink-0 w-8 h-6 rounded overflow-hidden shadow-sm bg-slate-700">
                {country.flag_url ? (
                  <img src={`${getApiBaseUrl()}${country.flag_url}`} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Globe className="w-3 h-3 text-slate-500" />
                  </div>
                )}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0 text-left">
                <p className={cn("text-sm font-medium truncate", isSelected ? "text-white" : "text-slate-300")}>
                  {country.name}
                </p>
              </div>

              {/* Checkbox */}
              <div className={cn(
                "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                isSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-600"
              )}>
                {isSelected && <Check className="w-3 h-3 text-white" />}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// DATA LAYER PANEL (MIDDLE)
// ============================================================================

interface DataLayerPanelProps {
  categories: CategoryInfo[];
  selectedCategories: string[];
  selectedMetrics: string[];
  onCategoryChange: (categories: string[]) => void;
  onMetricChange: (metrics: string[]) => void;
  pivotData: PivotTableResponse | undefined;
}

function DataLayerPanel({
  categories,
  selectedCategories,
  selectedMetrics,
  onCategoryChange,
  onMetricChange,
  pivotData,
}: DataLayerPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (catId: string) => {
    if (selectedCategories.includes(catId)) {
      onCategoryChange(selectedCategories.filter((c) => c !== catId));
      // Remove metrics from this category
      if (pivotData) {
        const categoryMetrics = pivotData.rows
          .filter((r) => r.metric.id.startsWith(catId) || selectedCategories.includes(catId))
          .map((r) => r.metric.id);
        onMetricChange(selectedMetrics.filter((m) => !categoryMetrics.includes(m)));
      }
    } else {
      onCategoryChange([...selectedCategories, catId]);
    }
  };

  const toggleExpand = (catId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const coreCategories = categories.filter((c) => !c.id.startsWith("intelligence_"));
  const intelligenceCategories = categories.filter((c) => c.id.startsWith("intelligence_"));

  const totalMetrics = selectedCategories.reduce((sum, catId) => {
    const cat = categories.find((c) => c.id === catId);
    return sum + (cat?.metric_count || 0);
  }, 0);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Data Layers</h2>
            <p className="text-xs text-slate-400">
              {selectedCategories.length} categories • {totalMetrics} metrics
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onCategoryChange(categories.map((c) => c.id))}
            className="flex-1 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            All
          </button>
          <button
            onClick={() => onCategoryChange(coreCategories.map((c) => c.id))}
            className="flex-1 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Core
          </button>
          <button
            onClick={() => onCategoryChange([])}
            className="flex-1 py-1.5 text-xs bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Core Framework */}
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Core Framework
          </p>
          {coreCategories.map((category) => {
            const style = CATEGORY_STYLES[category.id] || DEFAULT_STYLE;
            const isSelected = selectedCategories.includes(category.id);
            const isExpanded = expandedCategories.includes(category.id);
            const Icon = style.icon;

            return (
              <div key={category.id} className="mb-1">
                <div
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer",
                    isSelected ? `${style.bg} ${style.border} border` : "hover:bg-slate-800/50 border border-transparent"
                  )}
                >
                  <button onClick={() => toggleExpand(category.id)} className="p-0.5">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", isSelected ? "bg-white/10" : "bg-slate-700/50")}>
                    <Icon className={cn("w-4 h-4", style.color)} />
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => toggleCategory(category.id)}>
                    <p className={cn("text-sm font-medium truncate", isSelected ? "text-white" : "text-slate-300")}>
                      {category.name}
                    </p>
                    <p className="text-[10px] text-slate-500">{category.metric_count} metrics</p>
                  </div>
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className={cn(
                      "w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer",
                      isSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-600"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>

                {/* Expanded Metrics */}
                <AnimatePresence>
                  {isExpanded && isSelected && pivotData && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-8 mt-1 space-y-0.5"
                    >
                      {pivotData.rows
                        .slice(0, category.metric_count)
                        .map((row) => (
                          <div
                            key={row.metric.id}
                            className="flex items-center gap-2 py-1 px-2 rounded text-xs text-slate-400 hover:bg-slate-800/30 cursor-pointer"
                          >
                            <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                            <span className="truncate">{row.metric.name}</span>
                            {row.metric.unit && (
                              <span className="text-slate-600 text-[10px]">({row.metric.unit})</span>
                            )}
                          </div>
                        ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Intelligence Data */}
        <div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-1">
            Intelligence Data
          </p>
          {intelligenceCategories.map((category) => {
            const style = CATEGORY_STYLES[category.id] || DEFAULT_STYLE;
            const isSelected = selectedCategories.includes(category.id);
            const Icon = style.icon;

            return (
              <div
                key={category.id}
                onClick={() => toggleCategory(category.id)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg transition-all cursor-pointer mb-1",
                  isSelected ? `${style.bg} ${style.border} border` : "hover:bg-slate-800/50 border border-transparent"
                )}
              >
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", isSelected ? "bg-white/10" : "bg-slate-700/50")}>
                  <Icon className={cn("w-3.5 h-3.5", style.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs font-medium truncate", isSelected ? "text-white" : "text-slate-300")}>
                    {category.name.replace("Intelligence: ", "")}
                  </p>
                </div>
                <span className="text-[10px] text-slate-500">{category.metric_count}</span>
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0",
                  isSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-600"
                )}>
                  {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SORTABLE TABLE COMPONENTS
// ============================================================================

function SortableColumnHeader({ country, isActive }: { country: PivotCountryMeta; isActive?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: country.iso_code });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <th ref={setNodeRef} style={style} className={cn(
      "text-center p-2 text-xs font-semibold text-white bg-slate-800/70 min-w-[100px] max-w-[120px] relative group",
      isDragging && "opacity-50",
      isActive && "bg-cyan-500/20"
    )}>
      <div className="flex flex-col items-center gap-1">
        <button {...attributes} {...listeners} className="absolute top-0.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 rounded bg-slate-700/50">
          <GripHorizontal className="w-3 h-3 text-slate-400" />
        </button>
        {country.flag_url && (
          <img src={`${getApiBaseUrl()}${country.flag_url}`} alt="" className="w-8 h-5 object-cover rounded shadow mt-3" />
        )}
        <span className="font-medium truncate max-w-full text-[11px]">{country.name}</span>
      </div>
    </th>
  );
}

function SortableMetricRow({ row, countryOrder, rowIndex, isActive }: {
  row: PivotRow;
  countryOrder: string[];
  rowIndex: number;
  isActive?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.metric.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const orderedValues = useMemo(() => countryOrder.map((iso) => row.values.find((v) => v.iso_code === iso)!).filter(Boolean), [row.values, countryOrder]);
  const allNumericValues = orderedValues.map((v) => v.value).filter((v): v is number => typeof v === "number");
  const min = allNumericValues.length > 1 ? Math.min(...allNumericValues) : null;
  const max = allNumericValues.length > 1 ? Math.max(...allNumericValues) : null;

  const getValueStyle = (value: string | number | boolean | null): string => {
    if (typeof value !== "number" || min === null || max === null || min === max) return "";
    if (row.metric.lower_is_better) {
      if (value === min) return "text-emerald-400";
      if (value === max) return "text-red-400";
    } else {
      if (value === max) return "text-emerald-400";
      if (value === min) return "text-red-400";
    }
    return "";
  };

  return (
    <tr ref={setNodeRef} style={style} className={cn(
      "border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors group",
      isDragging && "opacity-50",
      isActive && "bg-indigo-500/10",
      rowIndex % 2 === 0 ? "bg-slate-900/20" : ""
    )}>
      <td className="p-2 sticky left-0 bg-slate-900/95 z-10 min-w-[180px]">
        <div className="flex items-center gap-1.5">
          <button {...attributes} {...listeners} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 rounded bg-slate-700/50">
            <GripVertical className="w-3 h-3 text-slate-400" />
          </button>
          <div className="min-w-0">
            <span className="text-xs text-white font-medium block truncate">{row.metric.name}</span>
            {row.metric.unit && <span className="text-[10px] text-slate-500">({row.metric.unit})</span>}
          </div>
        </div>
      </td>
      {orderedValues.map((cell) => (
        <td key={`${row.metric.id}-${cell.iso_code}`} className="p-2 text-center">
          <span className={cn("text-xs font-medium", cell.formatted_value === "N/A" ? "text-slate-500" : getValueStyle(cell.value) || "text-white")}>
            {cell.formatted_value}
          </span>
        </td>
      ))}
    </tr>
  );
}

// ============================================================================
// PIVOT TABLE PANEL (RIGHT)
// ============================================================================

interface PivotPanelProps {
  data: PivotTableResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedCountries: string[];
  selectedCategories: string[];
  onExport: () => void;
}

function PivotPanel({ data, isLoading, error, selectedCountries, selectedCategories, onExport }: PivotPanelProps) {
  const [countryOrder, setCountryOrder] = useState<string[]>([]);
  const [metricOrder, setMetricOrder] = useState<string[]>([]);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Update order when data changes
  useEffect(() => {
    if (data) {
      setCountryOrder(data.countries.map((c) => c.iso_code));
      setMetricOrder(data.rows.map((r) => r.metric.id));
    }
  }, [data]);

  const orderedCountries = useMemo(() => countryOrder.map((iso) => data?.countries.find((c) => c.iso_code === iso)!).filter(Boolean), [countryOrder, data]);
  const orderedRows = useMemo(() => metricOrder.map((id) => data?.rows.find((r) => r.metric.id === id)!).filter(Boolean), [metricOrder, data]);

  const handleColumnDragEnd = (event: DragEndEvent) => {
    setActiveColumnId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCountryOrder((items) => arrayMove(items, items.indexOf(active.id as string), items.indexOf(over.id as string)));
    }
  };

  const handleRowDragEnd = (event: DragEndEvent) => {
    setActiveRowId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMetricOrder((items) => arrayMove(items, items.indexOf(active.id as string), items.indexOf(over.id as string)));
    }
  };

  const handleReset = () => {
    if (data) {
      setCountryOrder(data.countries.map((c) => c.iso_code));
      setMetricOrder(data.rows.map((r) => r.metric.id));
    }
  };

  const showSelectPrompt = selectedCountries.length === 0 || selectedCategories.length === 0;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Table2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Pivot Table</h2>
              <p className="text-xs text-slate-400">
                {data ? `${data.countries.length} countries • ${data.total_metrics} metrics` : "Select data to generate"}
              </p>
            </div>
          </div>

          {data && (
            <div className="flex items-center gap-2">
              <button onClick={handleReset} className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors">
                <RotateCcw className="w-4 h-4" />
              </button>
              <button onClick={onExport} className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-shadow">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          )}
        </div>

        {/* Legend */}
        {data && (
          <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              <span>Best</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-400" />
              <span>Worst</span>
            </div>
            <span className="text-slate-600">|</span>
            <span>Drag to reorder columns & rows</span>
          </div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm text-slate-400">Generating table...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-white">Failed to load data</p>
            </div>
          </div>
        ) : showSelectPrompt ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                <Sparkles className="w-8 h-8 text-slate-600" />
              </div>
              <p className="text-white font-medium mb-1">Select Countries & Data Layers</p>
              <p className="text-sm text-slate-500">
                Choose countries from the left panel and data layers from the middle panel to generate your pivot table
              </p>
            </div>
          </div>
        ) : data && orderedCountries.length > 0 && orderedRows.length > 0 ? (
          <div className="p-2">
            <table className="w-full border-collapse text-xs">
              <thead className="sticky top-0 z-20">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveColumnId(e.active.id as string)} onDragEnd={handleColumnDragEnd}>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left p-2 text-xs font-semibold text-white bg-slate-800 sticky left-0 z-30 min-w-[180px]">Metric</th>
                    <SortableContext items={countryOrder} strategy={horizontalListSortingStrategy}>
                      {orderedCountries.map((country) => (
                        <SortableColumnHeader key={country.iso_code} country={country} isActive={activeColumnId === country.iso_code} />
                      ))}
                    </SortableContext>
                  </tr>
                  <DragOverlay>
                    {activeColumnId && data.countries.find((c) => c.iso_code === activeColumnId) && (
                      <div className="bg-slate-800 border-2 border-cyan-500 rounded-lg p-2 shadow-2xl text-center">
                        <span className="text-white text-xs font-medium">{data.countries.find((c) => c.iso_code === activeColumnId)?.name}</span>
                      </div>
                    )}
                  </DragOverlay>
                </DndContext>
              </thead>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={(e) => setActiveRowId(e.active.id as string)} onDragEnd={handleRowDragEnd}>
                <tbody>
                  <SortableContext items={metricOrder} strategy={verticalListSortingStrategy}>
                    {orderedRows.map((row, index) => (
                      <SortableMetricRow key={row.metric.id} row={row} countryOrder={countryOrder} rowIndex={index} isActive={activeRowId === row.metric.id} />
                    ))}
                  </SortableContext>
                </tbody>
                <DragOverlay>
                  {activeRowId && data.rows.find((r) => r.metric.id === activeRowId) && (
                    <div className="bg-slate-800 border-2 border-indigo-500 rounded-lg p-2 shadow-2xl flex items-center gap-2">
                      <GripVertical className="w-3 h-3 text-slate-400" />
                      <span className="text-white text-xs font-medium">{data.rows.find((r) => r.metric.id === activeRowId)?.metric.name}</span>
                    </div>
                  )}
                </DragOverlay>
              </DndContext>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CountryData() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);

  // Fetch countries
  const { data: countriesData, isLoading: countriesLoading, error: countriesError } = useQuery({
    queryKey: ["country-data-countries"],
    queryFn: fetchCountryDataCountries,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["country-data-categories"],
    queryFn: fetchCountryDataCategories,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch pivot table (real-time as selections change)
  const { data: pivotData, isLoading: pivotLoading, error: pivotError } = useQuery({
    queryKey: ["pivot-table", selectedCountries, selectedCategories],
    queryFn: () => fetchPivotTable(selectedCountries, selectedCategories),
    enabled: selectedCountries.length > 0 && selectedCategories.length > 0,
    staleTime: 30 * 1000,
  });

  const handleExport = useCallback(async () => {
    if (!pivotData) return;
    await exportToExcel(pivotData, selectedCategories);
  }, [pivotData, selectedCategories]);

  const isLoading = countriesLoading || categoriesLoading;
  const hasError = countriesError || categoriesError;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
          <p className="text-white font-medium">Loading Data Registry...</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-white font-medium">Failed to load data registry</p>
          <p className="text-sm text-slate-400 mt-1">Please ensure the backend is running</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Compact Header */}
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Table2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Country Data Registry</h1>
            <p className="text-xs text-slate-400">Interactive pivot table with {countriesData?.total || 0} countries</p>
          </div>
        </div>
      </div>

      {/* Three-Column Layout - Responsive */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 overflow-auto lg:overflow-hidden">
        {/* Left Panel: Countries */}
        <div className="lg:col-span-3 overflow-hidden min-h-[250px] lg:min-h-0">
          <CountryPanel
            countries={countriesData?.countries || []}
            selectedCountries={selectedCountries}
            onSelectionChange={setSelectedCountries}
          />
        </div>

        {/* Middle Panel: Data Layers (3 cols) */}
        <div className="col-span-3 overflow-hidden">
          <DataLayerPanel
            categories={categoriesData?.categories || []}
            selectedCategories={selectedCategories}
            selectedMetrics={selectedMetrics}
            onCategoryChange={setSelectedCategories}
            onMetricChange={setSelectedMetrics}
            pivotData={pivotData}
          />
        </div>

        {/* Right Panel: Pivot Table */}
        <div className="md:col-span-2 lg:col-span-6 overflow-hidden min-h-[300px] lg:min-h-0">
          <PivotPanel
            data={pivotData}
            isLoading={pivotLoading}
            error={pivotError}
            selectedCountries={selectedCountries}
            selectedCategories={selectedCategories}
            onExport={handleExport}
          />
        </div>
      </div>
    </div>
  );
}

export default CountryData;
