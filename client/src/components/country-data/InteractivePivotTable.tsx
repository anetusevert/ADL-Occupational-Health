/**
 * Interactive Pivot Table Component
 * Drag-and-drop reorderable table for country data analysis
 */

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
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
  GripVertical,
  GripHorizontal,
  Download,
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Table2,
} from "lucide-react";
import { cn, getFlagImageUrl } from "../../lib/utils";
import type { PivotTableResponse, PivotRow, PivotCountryMeta } from "../../services/api";

// ============================================================================
// SORTABLE COLUMN HEADER
// ============================================================================

interface SortableColumnHeaderProps {
  country: PivotCountryMeta;
  isActive?: boolean;
}

function SortableColumnHeader({ country, isActive }: SortableColumnHeaderProps) {
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
    <th
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-center p-2 sm:p-3 text-xs sm:text-sm font-semibold text-white bg-slate-800/50 min-w-[100px] sm:min-w-[130px] relative group",
        isDragging && "opacity-50",
        isActive && "bg-cyan-500/20"
      )}
    >
      <div className="flex flex-col items-center gap-1">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded bg-slate-700/50 hover:bg-slate-600/50"
        >
          <GripHorizontal className="w-4 h-4 text-slate-400" />
        </button>

        {country.flag_url && (
          <img
            src={`${getApiBaseUrl()}${country.flag_url}`}
            alt=""
            className="w-10 h-6 object-cover rounded shadow-md mt-4"
          />
        )}
        <span className="font-medium">{country.name}</span>
        <span className="text-xs text-slate-500">{country.iso_code}</span>
      </div>
    </th>
  );
}

// Column Header Overlay (shown while dragging)
function ColumnHeaderOverlay({ country }: { country: PivotCountryMeta }) {
  return (
    <div className="bg-slate-800 border-2 border-cyan-500 rounded-lg p-3 shadow-2xl shadow-cyan-500/20">
      <div className="flex flex-col items-center gap-1">
        {country.flag_url && (
          <img
            src={`${getApiBaseUrl()}${country.flag_url}`}
            alt=""
            className="w-10 h-6 object-cover rounded shadow-md"
          />
        )}
        <span className="text-white font-medium text-sm">{country.name}</span>
        <span className="text-xs text-slate-400">{country.iso_code}</span>
      </div>
    </div>
  );
}

// ============================================================================
// SORTABLE METRIC ROW
// ============================================================================

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

  // Reorder values based on country order
  const orderedValues = useMemo(() => {
    return countryOrder.map((iso) => {
      return row.values.find((v) => v.iso_code === iso)!;
    }).filter(Boolean);
  }, [row.values, countryOrder]);

  // Calculate best/worst for styling
  const allNumericValues = orderedValues
    .map((v) => v.value)
    .filter((v): v is number => typeof v === "number" && v !== null);

  const min = allNumericValues.length > 1 ? Math.min(...allNumericValues) : null;
  const max = allNumericValues.length > 1 ? Math.max(...allNumericValues) : null;

  const getValueStyle = (value: string | number | boolean | null): string => {
    if (typeof value !== "number" || value === null || min === null || max === null) {
      return "";
    }
    if (min === max) return "";

    const isMin = value === min;
    const isMax = value === max;

    if (row.metric.lower_is_better) {
      if (isMin) return "text-emerald-400";
      if (isMax) return "text-red-400";
    } else {
      if (isMax) return "text-emerald-400";
      if (isMin) return "text-red-400";
    }
    return "";
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={cn(
        "border-b border-slate-700/30 hover:bg-slate-800/30 transition-colors group",
        isDragging && "opacity-50 bg-slate-800/50",
        isActive && "bg-indigo-500/10",
        rowIndex % 2 === 0 ? "bg-slate-900/20" : "bg-slate-800/10"
      )}
    >
      {/* Metric Name Cell */}
      <td className="p-2 sm:p-3 sticky left-0 bg-slate-900/95 z-10 min-w-[160px] sm:min-w-[220px]">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded bg-slate-700/50 hover:bg-slate-600/50 flex-shrink-0"
          >
            <GripVertical className="w-4 h-4 text-slate-400" />
          </button>

          <div className="flex flex-col min-w-0">
            <span className="text-sm text-white font-medium truncate">
              {row.metric.name}
            </span>
            <div className="flex items-center gap-2">
              {row.metric.unit && (
                <span className="text-xs text-slate-500">
                  ({row.metric.unit})
                </span>
              )}
              {row.metric.lower_is_better && (
                <span className="text-[10px] text-amber-400/70 flex items-center gap-0.5">
                  <TrendingDown className="w-3 h-3" />
                  lower better
                </span>
              )}
            </div>
          </div>
        </div>
      </td>

      {/* Value Cells */}
      {orderedValues.map((cell) => {
        const valueStyle = getValueStyle(cell.value);

        return (
          <td
            key={`${row.metric.id}-${cell.iso_code}`}
            className="p-2 sm:p-3 text-center min-w-[100px] sm:min-w-[130px]"
          >
            <span
              className={cn(
                "text-sm font-medium",
                cell.formatted_value === "N/A"
                  ? "text-slate-500"
                  : valueStyle || "text-white"
              )}
            >
              {cell.formatted_value}
            </span>
          </td>
        );
      })}
    </tr>
  );
}

// Row Overlay (shown while dragging)
function MetricRowOverlay({ row }: { row: PivotRow }) {
  return (
    <div className="bg-slate-800 border-2 border-indigo-500 rounded-lg p-3 shadow-2xl shadow-indigo-500/20 flex items-center gap-3">
      <GripVertical className="w-4 h-4 text-slate-400" />
      <div>
        <span className="text-white font-medium text-sm">{row.metric.name}</span>
        {row.metric.unit && (
          <span className="text-xs text-slate-400 ml-2">({row.metric.unit})</span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN INTERACTIVE PIVOT TABLE
// ============================================================================

interface InteractivePivotTableProps {
  data: PivotTableResponse;
  onBack: () => void;
  onExport: () => void;
}

export function InteractivePivotTable({
  data,
  onBack,
  onExport,
}: InteractivePivotTableProps) {
  // State for column and row order
  const [countryOrder, setCountryOrder] = useState<string[]>(() =>
    data.countries.map((c) => c.iso_code)
  );
  const [metricOrder, setMetricOrder] = useState<string[]>(() =>
    data.rows.map((r) => r.metric.id)
  );

  // Drag state
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);

  // Sensors for drag-and-drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get ordered countries
  const orderedCountries = useMemo(() => {
    return countryOrder
      .map((iso) => data.countries.find((c) => c.iso_code === iso)!)
      .filter(Boolean);
  }, [countryOrder, data.countries]);

  // Get ordered rows
  const orderedRows = useMemo(() => {
    return metricOrder
      .map((id) => data.rows.find((r) => r.metric.id === id)!)
      .filter(Boolean);
  }, [metricOrder, data.rows]);

  // Column drag handlers
  const handleColumnDragStart = (event: DragStartEvent) => {
    setActiveColumnId(event.active.id as string);
  };

  const handleColumnDragEnd = (event: DragEndEvent) => {
    setActiveColumnId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setCountryOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Row drag handlers
  const handleRowDragStart = (event: DragStartEvent) => {
    setActiveRowId(event.active.id as string);
  };

  const handleRowDragEnd = (event: DragEndEvent) => {
    setActiveRowId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMetricOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Reset order
  const handleResetOrder = useCallback(() => {
    setCountryOrder(data.countries.map((c) => c.iso_code));
    setMetricOrder(data.rows.map((r) => r.metric.id));
  }, [data]);

  // Active items for overlays
  const activeColumn = activeColumnId
    ? data.countries.find((c) => c.iso_code === activeColumnId)
    : null;
  const activeRow = activeRowId
    ? data.rows.find((r) => r.metric.id === activeRowId)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-4"
    >
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30 flex-shrink-0">
            <Table2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-white">
              Interactive Results
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 truncate">
              <span className="hidden sm:inline">Drag columns and rows to reorder • </span>
              {data.total_metrics} metrics • {data.countries.length} countries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Reset Button */}
          <motion.button
            onClick={handleResetOrder}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset Order</span>
          </motion.button>

          {/* Export Button */}
          <motion.button
            onClick={onExport}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-shadow text-sm sm:text-base"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export to Excel</span>
            <span className="sm:hidden">Export</span>
          </motion.button>
        </div>
      </div>

      {/* Legend - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-xs text-slate-400 bg-slate-800/30 rounded-lg px-4 py-2">
        <div className="hidden md:flex items-center gap-2">
          <GripHorizontal className="w-4 h-4" />
          <span>Drag column headers to reorder countries</span>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          <span>Drag rows to reorder metrics</span>
        </div>
        <p className="md:hidden text-center">Scroll horizontally to view all data</p>
        <div className="flex items-center justify-center sm:justify-end gap-4 sm:ml-auto">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Best</span>
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span>Worst</span>
          </div>
        </div>
      </div>

      {/* Table Container - Responsive wrapper */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto max-h-[60vh] sm:max-h-[500px] overflow-y-auto -webkit-overflow-scrolling-touch">
          <table className="w-full border-collapse">
            {/* Table Header with Draggable Columns */}
            <thead className="sticky top-0 z-20">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleColumnDragStart}
                onDragEnd={handleColumnDragEnd}
              >
                <tr className="border-b border-slate-700/50">
                  {/* Fixed Metric Column Header */}
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-semibold text-white bg-slate-800 sticky left-0 z-30 min-w-[160px] sm:min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span>Metric</span>
                    </div>
                  </th>

                  {/* Sortable Country Headers */}
                  <SortableContext
                    items={countryOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {orderedCountries.map((country) => (
                      <SortableColumnHeader
                        key={country.iso_code}
                        country={country}
                        isActive={activeColumnId === country.iso_code}
                      />
                    ))}
                  </SortableContext>
                </tr>

                {/* Column Drag Overlay */}
                <DragOverlay>
                  {activeColumn && <ColumnHeaderOverlay country={activeColumn} />}
                </DragOverlay>
              </DndContext>
            </thead>

            {/* Table Body with Draggable Rows */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleRowDragStart}
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

              {/* Row Drag Overlay */}
              <DragOverlay>
                {activeRow && <MetricRowOverlay row={activeRow} />}
              </DragOverlay>
            </DndContext>
          </table>
        </div>
      </div>

      {/* Back Button */}
      <div className="flex justify-start pt-2">
        <motion.button
          onClick={onBack}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-slate-700/50 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Data Layers</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default InteractivePivotTable;
