/**
 * Arthur D. Little - Global Health Platform
 * Compare Page V2 - Premium Framework Comparison
 * 
 * Complete redesign with:
 * - Zero-scroll experience
 * - Premium animations matching Framework screen
 * - Flow-based UX (selection -> comparison)
 * - ADL Score branding
 * - Interactive pillar tiles with modals
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { fetchComparisonCountries } from "../services/api";
import { CountrySelectionOverlay } from "../components/compare/CountrySelectionOverlay";
import { ComparisonDashboard } from "../components/compare/ComparisonDashboard";
import { MetricDetailModal } from "../components/compare/MetricDetailModal";
import type { Country } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

type Phase = "selection" | "comparison";

interface ModalState {
  isOpen: boolean;
  metricId: string | null;
  metricName: string;
  leftValue: string | number | boolean | null | undefined;
  rightValue: string | number | boolean | null | undefined;
  suffix: string;
  lowerIsBetter: boolean;
  pillarName: string;
  pillarColor: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CompareV2() {
  // Phase state
  const [phase, setPhase] = useState<Phase>("selection");
  
  // Country selection state
  const [leftCountry, setLeftCountry] = useState<string>("SAU");
  const [rightCountry, setRightCountry] = useState<string>("DEU");
  
  // Metric detail modal state
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    metricId: null,
    metricName: "",
    leftValue: null,
    rightValue: null,
    suffix: "",
    lowerIsBetter: false,
    pillarName: "",
    pillarColor: "cyan",
  });

  // Fetch all countries with full pillar data
  const { data: comparisonData, isLoading, error } = useQuery({
    queryKey: ["comparison-countries"],
    queryFn: fetchComparisonCountries,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Create a map of countries by ISO code for quick lookup
  const countriesMap = useMemo(() => {
    if (!comparisonData?.countries) return new Map<string, Country>();
    return new Map(comparisonData.countries.map((c) => [c.iso_code, c]));
  }, [comparisonData]);

  // Get list of countries
  const countries = useMemo(() => {
    return comparisonData?.countries || [];
  }, [comparisonData]);

  // Ensure selected countries exist in the database
  useEffect(() => {
    if (countries.length > 0) {
      if (!countriesMap.has(leftCountry)) {
        const firstAvailable = countries[0]?.iso_code;
        if (firstAvailable) setLeftCountry(firstAvailable);
      }
      if (!countriesMap.has(rightCountry)) {
        const secondAvailable = countries.find(c => c.iso_code !== leftCountry)?.iso_code || countries[0]?.iso_code;
        if (secondAvailable) setRightCountry(secondAvailable);
      }
    }
  }, [countries, countriesMap, leftCountry, rightCountry]);

  // Get selected country data
  const leftData = countriesMap.get(leftCountry);
  const rightData = countriesMap.get(rightCountry);

  // Handlers
  const handleCompare = () => {
    if (leftData && rightData) {
      setPhase("comparison");
    }
  };

  const handleReset = () => {
    setPhase("selection");
  };

  const openMetricModal = (
    metricId: string,
    metricName: string,
    leftValue: string | number | boolean | null | undefined,
    rightValue: string | number | boolean | null | undefined,
    suffix: string = "",
    lowerIsBetter: boolean = false,
    pillarName: string = "Metric",
    pillarColor: string = "cyan"
  ) => {
    setModalState({
      isOpen: true,
      metricId,
      metricName,
      leftValue,
      rightValue,
      suffix,
      lowerIsBetter,
      pillarName,
      pillarColor,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader totalCountries={0} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 text-cyan-400"
          >
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading countries from database...</span>
          </motion.div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex flex-col">
        <PageHeader totalCountries={0} />
        <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-white font-medium text-sm">
              Failed to load comparison data
            </p>
            <p className="text-xs text-white/40 mt-1">
              Please ensure the ETL pipeline has been run to populate the database.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header */}
      <PageHeader totalCountries={comparisonData?.total || 0} />

      {/* Main Content with Phase Transitions */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {phase === "selection" && (
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <CountrySelectionOverlay
                countries={countries}
                countriesMap={countriesMap}
                leftCountry={leftCountry}
                rightCountry={rightCountry}
                onLeftChange={setLeftCountry}
                onRightChange={setRightCountry}
                onCompare={handleCompare}
              />
            </motion.div>
          )}

          {phase === "comparison" && leftData && rightData && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <ComparisonDashboard
                leftCountry={leftData}
                rightCountry={rightData}
                countriesMap={countriesMap}
                countries={countries}
                onLeftChange={(iso) => {
                  setLeftCountry(iso);
                }}
                onRightChange={(iso) => {
                  setRightCountry(iso);
                }}
                onReset={handleReset}
                onMetricClick={openMetricModal}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Metric Detail Modal */}
      {leftData && rightData && (
        <MetricDetailModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          metricId={modalState.metricId}
          metricName={modalState.metricName}
          leftCountry={leftData}
          rightCountry={rightData}
          leftValue={modalState.leftValue}
          rightValue={modalState.rightValue}
          suffix={modalState.suffix}
          lowerIsBetter={modalState.lowerIsBetter}
          pillarName={modalState.pillarName}
          pillarColor={modalState.pillarColor}
        />
      )}
    </div>
  );
}

// ============================================================================
// PAGE HEADER
// ============================================================================

function PageHeader({ totalCountries }: { totalCountries: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex-shrink-0 flex items-center gap-4 mb-4"
    >
      <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
        <ArrowLeftRight className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Framework Comparison
        </h1>
        <p className="text-white/40 text-sm">
          Side-by-side 25-metric analysis • {totalCountries} countries available
        </p>
      </div>
    </motion.div>
  );
}

export default CompareV2;
