/**
 * Arthur D. Little - Global Health Platform
 * Country Data Registry - Animated Flow Experience
 * 
 * Features:
 * - Two-phase guided flow (Countries → Data Layers)
 * - Regional country groupings with GCC priority
 * - Framework-style animated tiles for data selection
 * - Live pivot table with animations
 * - Real-time dynamic updates
 * - Excel export
 */

import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Table2, Loader2, AlertTriangle } from "lucide-react";
import {
  fetchCountryDataCountries,
  fetchCountryDataCategories,
  fetchPivotTable,
} from "../services/api";
import type { PivotTableResponse } from "../services/api";
import { CountryFlowWizard } from "../components/country-data";

// =============================================================================
// EXCEL EXPORT
// =============================================================================

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

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CountryData() {
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Fetch countries
  const {
    data: countriesData,
    isLoading: countriesLoading,
    error: countriesError,
  } = useQuery({
    queryKey: ["country-data-countries"],
    queryFn: fetchCountryDataCountries,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch categories
  const {
    data: categoriesData,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useQuery({
    queryKey: ["country-data-categories"],
    queryFn: fetchCountryDataCategories,
    staleTime: 10 * 60 * 1000,
  });

  // Fetch pivot table (real-time as selections change)
  const {
    data: pivotData,
    isLoading: pivotLoading,
    error: pivotError,
  } = useQuery({
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

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-cyan-400" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center"
          >
            <p className="text-white font-semibold text-lg">Loading Data Registry</p>
            <p className="text-slate-400 text-sm mt-1">
              Preparing {countriesData?.total || 196} countries...
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <AlertTriangle className="w-14 h-14 text-red-400 mx-auto mb-4" />
          </motion.div>
          <p className="text-white font-semibold text-lg">Failed to load data registry</p>
          <p className="text-sm text-slate-400 mt-2">
            Please ensure the backend is running and try again
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-shrink-0 flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25"
          >
            <Table2 className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-2xl font-bold text-white"
            >
              Country Data Registry
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-slate-400"
            >
              Interactive analysis across {countriesData?.total || 0} countries
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Flow Wizard */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex-1 min-h-0 overflow-hidden"
      >
        <CountryFlowWizard
          countries={countriesData?.countries || []}
          categories={categoriesData?.categories || []}
          selectedCountries={selectedCountries}
          selectedCategories={selectedCategories}
          onCountriesChange={setSelectedCountries}
          onCategoriesChange={setSelectedCategories}
          pivotData={pivotData}
          pivotLoading={pivotLoading}
          pivotError={pivotError}
          onExport={handleExport}
        />
      </motion.div>
    </div>
  );
}

export default CountryData;
