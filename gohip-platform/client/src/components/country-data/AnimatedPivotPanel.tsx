/**
 * Animated Pivot Panel Component
 * Enhanced pivot table with entry animations and live update effects
 * 
 * Features:
 * - Animated column/row entry when data changes
 * - Phase-aware empty states
 * - Drag-and-drop reordering
 * - Value highlighting (best/worst)
 * - Export functionality
 */

import { useState, useMemo, useEffect, useCallback } from "react";
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
  Download,
  Loader2,
  AlertTriangle,
  GripVertical,
  GripHorizontal,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Sparkles,
  Globe,
  Layers,
  ArrowRight,
} from "lucide-react";
import { cn, getApiBaseUrl } from "../../lib/utils";
import type {
  CountryDataSummary,
  PivotTableResponse,
  PivotRow,
  PivotCountryMeta,
} from "../../services/api";

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

const smoothEase = [0.25, 0.46, 0.45, 0.94] as const;

const columnVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
      ease: smoothEase,
    },
  }),
  exit: { opacity: 0, x: 20, scale: 0.9, transition: { duration: 0.2 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.02,
      duration: 0.25,
      ease: smoothEase,
    },
  }),
};

// =============================================================================
// TYPES
// =============================================================================

type FlowPhase = "countries" | "data-layers";

interface AnimatedPivotPanelProps {
  data: PivotTableResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  selectedCountries: string[];
  selectedCategories: string[];
  countryMap: Map<string, CountryDataSummary>;
  onExport: () => void;
  phase: FlowPhase;
}

// =============================================================================
// SORTABLE COLUMN HEADER
// =============================================================================

interface SortableColumnHeaderProps {
  country: PivotCountryMeta;
  index: number;
  isActive?: boolean;
}

function SortableColumnHeader({ country, index, isActive }: SortableColumnHeaderProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: country.iso_code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.th
      ref={setNodeRef}
      style={style}
      custom={index}
      variants={columnVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "text-center p-2 text-xs font-semibold text-white bg-slate-800/70 min-w-[100px] max-w-[120px] relative group",
        isDragging && "opacity-50 z-50",
        isActive && "bg-cyan-500/20"
      )}
    >
      <div className="flex flex-col items-center gap-1">
        <button
          {...attributes}
          {...listeners}
          className="absolute top-0.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 rounded bg-slate-700/50"
        >
          <GripHorizontal className="w-3 h-3 text-slate-400" />
        </button>
        {country.flag_url && (
          <motion.img
            src={`${getApiBaseUrl()}${country.flag_url}`}
            alt=""
            className="w-8 h-5 object-cover rounded shadow mt-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.1 }}
          />
        )}
        <span className="font-medium truncate max-w-full text-[11px]">
          {country.name}
        </span>
      </div>
    </motion.th>
  );
}

// =============================================================================
// SORTABLE METRIC ROW
// =============================================================================

interface SortableMetricRowProps {
  row: PivotRow;
  countryOrder: string[];
  rowIndex: number;
  isActive?: boolean;
}

function SortableMetricRow({
  row,
  countryOrder,
  rowIndex,
  isActive,
}: SortableMetricRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.metric.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const orderedValues = useMemo(
    () =>
      countryOrder
        .map((iso) => row.values.find((v) => v.iso_code === iso)!)
        .filter(Boolean),
    [row.values, countryOrder]
  );

  const allNumericValues = orderedValues
    .map((v) => v.value)
    .filter((v): v is number => typeof v === "number");
  const min =
    allNumericValues.length > 1 ? Math.min(...allNumericValues) : null;
  const max =
    allNumericValues.length > 1 ? Math.max(...allNumericValues) : null;

  const getValueStyle = (value: string | number | boolean | null): string => {
    if (typeof value !== "number" || min === null || max === null || min === max)
      return "";
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
    <motion.tr
      ref={setNodeRef}
      style={style}
      custom={rowIndex}
      variants={rowVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        "border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors group",
        isDragging && "opacity-50",
        isActive && "bg-indigo-500/10",
        rowIndex % 2 === 0 ? "bg-slate-900/20" : ""
      )}
    >
      <td className="p-2 sticky left-0 bg-slate-900/95 z-10 min-w-[180px]">
        <div className="flex items-center gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-0.5 rounded bg-slate-700/50"
          >
            <GripVertical className="w-3 h-3 text-slate-400" />
          </button>
          <div className="min-w-0">
            <span className="text-xs text-white font-medium block truncate">
              {row.metric.name}
            </span>
            {row.metric.unit && (
              <span className="text-[10px] text-slate-500">
                ({row.metric.unit})
              </span>
            )}
          </div>
        </div>
      </td>
      {orderedValues.map((cell, cellIndex) => (
        <motion.td
          key={`${row.metric.id}-${cell.iso_code}`}
          className="p-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: cellIndex * 0.02 + rowIndex * 0.01 }}
        >
          <span
            className={cn(
              "text-xs font-medium",
              cell.formatted_value === "N/A"
                ? "text-slate-500"
                : getValueStyle(cell.value) || "text-white"
            )}
          >
            {cell.formatted_value}
          </span>
        </motion.td>
      ))}
    </motion.tr>
  );
}

// =============================================================================
// EMPTY STATES
// =============================================================================

interface EmptyStateProps {
  phase: FlowPhase;
  selectedCountries: number;
  selectedCategories: number;
}

function EmptyState({ phase, selectedCountries, selectedCategories }: EmptyStateProps) {
  if (phase === "countries") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex items-center justify-center"
      >
        <div className="text-center p-8 max-w-sm">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "easeInOut",
            }}
            className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/30"
          >
            <Globe className="w-10 h-10 text-cyan-400" />
          </motion.div>
          <h3 className="text-lg font-bold text-white mb-2">
            Select Countries to Begin
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            Choose countries from the regions on the left. Your selections will
            appear here as an interactive data table.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-cyan-400">
            <ArrowRight className="w-4 h-4" />
            <span>Select at least one country</span>
          </div>
        </div>
      </motion.div>
    );
  }

  if (selectedCountries > 0 && selectedCategories === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="h-full flex items-center justify-center"
      >
        <div className="text-center p-8 max-w-sm">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
            className="w-20 h-20 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/30"
          >
            <Layers className="w-10 h-10 text-indigo-400" />
          </motion.div>
          <h3 className="text-lg font-bold text-white mb-2">
            Select Data Layers
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            You have {selectedCountries}{" "}
            {selectedCountries === 1 ? "country" : "countries"} selected. Now
            choose the data layers you want to analyze.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>Click tiles to add metrics</span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full flex items-center justify-center"
    >
      <div className="text-center p-8">
        <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
          <Sparkles className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-white font-medium mb-1">Building Your Analysis</p>
        <p className="text-sm text-slate-500">
          Select countries and data layers to generate your pivot table
        </p>
      </div>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function AnimatedPivotPanel({
  data,
  isLoading,
  error,
  selectedCountries,
  selectedCategories,
  countryMap,
  onExport,
  phase,
}: AnimatedPivotPanelProps) {
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

  const orderedCountries = useMemo(
    () =>
      countryOrder
        .map((iso) => data?.countries.find((c) => c.iso_code === iso)!)
        .filter(Boolean),
    [countryOrder, data]
  );

  const orderedRows = useMemo(
    () =>
      metricOrder
        .map((id) => data?.rows.find((r) => r.metric.id === id)!)
        .filter(Boolean),
    [metricOrder, data]
  );

  const handleColumnDragEnd = useCallback((event: DragEndEvent) => {
    setActiveColumnId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCountryOrder((items) =>
        arrayMove(
          items,
          items.indexOf(active.id as string),
          items.indexOf(over.id as string)
        )
      );
    }
  }, []);

  const handleRowDragEnd = useCallback((event: DragEndEvent) => {
    setActiveRowId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMetricOrder((items) =>
        arrayMove(
          items,
          items.indexOf(active.id as string),
          items.indexOf(over.id as string)
        )
      );
    }
  }, []);

  const handleReset = useCallback(() => {
    if (data) {
      setCountryOrder(data.countries.map((c) => c.iso_code));
      setMetricOrder(data.rows.map((r) => r.metric.id));
    }
  }, [data]);

  const showEmptyState =
    selectedCountries.length === 0 || selectedCategories.length === 0;
  const hasData =
    data && orderedCountries.length > 0 && orderedRows.length > 0;

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{
                boxShadow: hasData
                  ? [
                      "0 0 0 0 rgba(16, 185, 129, 0.2)",
                      "0 0 20px 5px rgba(16, 185, 129, 0.2)",
                      "0 0 0 0 rgba(16, 185, 129, 0.2)",
                    ]
                  : "none",
              }}
              transition={{ repeat: hasData ? Infinity : 0, duration: 2 }}
              className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <Table2 className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {hasData ? "Live Data Table" : "Pivot Table"}
              </h2>
              <p className="text-xs text-slate-400">
                {data
                  ? `${data.countries.length} countries, ${data.total_metrics} metrics`
                  : "Select data to generate"}
              </p>
            </div>
          </div>

          {hasData && (
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleReset}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </motion.button>
              <motion.button
                onClick={onExport}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg text-sm font-medium shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-shadow"
              >
                <Download className="w-4 h-4" />
                Export
              </motion.button>
            </div>
          )}
        </div>

        {/* Legend */}
        {hasData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 mt-3 text-[10px] text-slate-400"
          >
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
          </motion.div>
        )}
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <Loader2 className="w-8 h-8 text-cyan-400" />
                </motion.div>
                <p className="text-sm text-slate-400">Generating table...</p>
              </div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center"
            >
              <div className="text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-white">Failed to load data</p>
              </div>
            </motion.div>
          ) : showEmptyState ? (
            <EmptyState
              key="empty"
              phase={phase}
              selectedCountries={selectedCountries.length}
              selectedCategories={selectedCategories.length}
            />
          ) : hasData ? (
            <motion.div
              key="table"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-2"
            >
              <table className="w-full border-collapse text-xs">
                <thead className="sticky top-0 z-20">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={(e) => setActiveColumnId(e.active.id as string)}
                    onDragEnd={handleColumnDragEnd}
                  >
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left p-2 text-xs font-semibold text-white bg-slate-800 sticky left-0 z-30 min-w-[180px]">
                        Metric
                      </th>
                      <SortableContext
                        items={countryOrder}
                        strategy={horizontalListSortingStrategy}
                      >
                        {orderedCountries.map((country, index) => (
                          <SortableColumnHeader
                            key={country.iso_code}
                            country={country}
                            index={index}
                            isActive={activeColumnId === country.iso_code}
                          />
                        ))}
                      </SortableContext>
                    </tr>
                    <DragOverlay>
                      {activeColumnId &&
                        data.countries.find(
                          (c) => c.iso_code === activeColumnId
                        ) && (
                          <div className="bg-slate-800 border-2 border-cyan-500 rounded-lg p-2 shadow-2xl text-center">
                            <span className="text-white text-xs font-medium">
                              {
                                data.countries.find(
                                  (c) => c.iso_code === activeColumnId
                                )?.name
                              }
                            </span>
                          </div>
                        )}
                    </DragOverlay>
                  </DndContext>
                </thead>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragStart={(e) => setActiveRowId(e.active.id as string)}
                  onDragEnd={handleRowDragEnd}
                >
                  <tbody>
                    <SortableContext
                      items={metricOrder}
                      strategy={verticalListSortingStrategy}
                    >
                      {orderedRows.map((row, index) => (
                        <SortableMetricRow
                          key={row.metric.id}
                          row={row}
                          countryOrder={countryOrder}
                          rowIndex={index}
                          isActive={activeRowId === row.metric.id}
                        />
                      ))}
                    </SortableContext>
                  </tbody>
                  <DragOverlay>
                    {activeRowId &&
                      data.rows.find((r) => r.metric.id === activeRowId) && (
                        <div className="bg-slate-800 border-2 border-indigo-500 rounded-lg p-2 shadow-2xl flex items-center gap-2">
                          <GripVertical className="w-3 h-3 text-slate-400" />
                          <span className="text-white text-xs font-medium">
                            {
                              data.rows.find((r) => r.metric.id === activeRowId)
                                ?.metric.name
                            }
                          </span>
                        </div>
                      )}
                  </DragOverlay>
                </DndContext>
              </table>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default AnimatedPivotPanel;
