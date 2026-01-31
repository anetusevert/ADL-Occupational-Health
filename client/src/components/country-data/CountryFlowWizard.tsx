/**
 * Country Flow Wizard - Main Orchestrator
 * Animated two-phase flow for country data selection
 * 
 * Phase 1: Country Selection (with regional groupings)
 * Phase 2: Data Layer Selection (with Framework-style tiles)
 * 
 * Live pivot table visible throughout both phases
 */

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronLeft, 
  Globe, 
  Layers, 
  Sparkles,
  ArrowRight,
  Check,
} from "lucide-react";
import { cn, getApiBaseUrl } from "../../lib/utils";
import { RegionSelector } from "./RegionSelector";
import { DataLayerTiles } from "./DataLayerTiles";
import { AnimatedPivotPanel } from "./AnimatedPivotPanel";
import type { CountryDataSummary, CategoryInfo, PivotTableResponse } from "../../services/api";

// =============================================================================
// ANIMATION CONSTANTS (matching Framework page)
// =============================================================================

const smoothEase = [0.25, 0.46, 0.45, 0.94] as const;

const phaseTransition = {
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 30 },
  transition: { duration: 0.4, ease: smoothEase },
};

// =============================================================================
// TYPES
// =============================================================================

type FlowPhase = "countries" | "data-layers";

interface CountryFlowWizardProps {
  countries: CountryDataSummary[];
  categories: CategoryInfo[];
  selectedCountries: string[];
  selectedCategories: string[];
  onCountriesChange: (countries: string[]) => void;
  onCategoriesChange: (categories: string[]) => void;
  pivotData: PivotTableResponse | undefined;
  pivotLoading: boolean;
  pivotError: Error | null;
  onExport: () => void;
}

// =============================================================================
// PHASE INDICATOR COMPONENT
// =============================================================================

interface PhaseIndicatorProps {
  currentPhase: FlowPhase;
  selectedCountriesCount: number;
  selectedCategoriesCount: number;
  onPhaseClick: (phase: FlowPhase) => void;
}

function PhaseIndicator({ 
  currentPhase, 
  selectedCountriesCount, 
  selectedCategoriesCount,
  onPhaseClick 
}: PhaseIndicatorProps) {
  const phases = [
    { 
      id: "countries" as const, 
      label: "Countries", 
      icon: Globe, 
      count: selectedCountriesCount,
      description: "Select regions & countries"
    },
    { 
      id: "data-layers" as const, 
      label: "Data Layers", 
      icon: Layers, 
      count: selectedCategoriesCount,
      description: "Choose metrics to analyze"
    },
  ];

  return (
    <div className="flex items-center gap-4 mb-6">
      {phases.map((phase, index) => {
        const isActive = currentPhase === phase.id;
        const isCompleted = 
          (phase.id === "countries" && currentPhase === "data-layers" && selectedCountriesCount > 0);
        const Icon = phase.icon;

        return (
          <div key={phase.id} className="flex items-center">
            <motion.button
              onClick={() => onPhaseClick(phase.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex items-center gap-3 px-5 py-3 rounded-xl border transition-all duration-300",
                isActive
                  ? "bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                  : isCompleted
                  ? "bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50"
                  : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600"
              )}
            >
              {/* Icon */}
              <motion.div 
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors relative",
                  isActive
                    ? "bg-cyan-500/20"
                    : isCompleted
                    ? "bg-emerald-500/20"
                    : "bg-slate-700/50"
                )}
                animate={{
                  scale: isActive ? [1, 1.05, 1] : 1,
                }}
                transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <Check className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                ) : (
                  <Icon className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-cyan-400" : "text-slate-400"
                  )} />
                )}
              </motion.div>

              {/* Label & Count */}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "font-semibold transition-colors",
                    isActive ? "text-white" : isCompleted ? "text-emerald-300" : "text-slate-300"
                  )}>
                    {phase.label}
                  </span>
                  {phase.count > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        isActive
                          ? "bg-cyan-500/30 text-cyan-300"
                          : isCompleted
                          ? "bg-emerald-500/30 text-emerald-300"
                          : "bg-slate-700 text-slate-400"
                      )}
                    >
                      {phase.count}
                    </motion.span>
                  )}
                </div>
                <span className="text-xs text-slate-500">{phase.description}</span>
              </div>

              {/* Active indicator dot */}
              {isActive && (
                <motion.div
                  layoutId="phase-indicator"
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
                />
              )}
            </motion.button>

            {/* Connector arrow */}
            {index < phases.length - 1 && (
              <motion.div
                animate={{ x: isCompleted ? [0, 5, 0] : 0 }}
                transition={{ repeat: isCompleted ? Infinity : 0, duration: 1.5 }}
                className="mx-3"
              >
                <ChevronRight className={cn(
                  "w-5 h-5 transition-colors",
                  isCompleted ? "text-emerald-400" : "text-slate-600"
                )} />
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// CONTINUE BUTTON
// =============================================================================

interface ContinueButtonProps {
  selectedCount: number;
  onClick: () => void;
  phase: FlowPhase;
}

function ContinueButton({ selectedCount, onClick, phase }: ContinueButtonProps) {
  const isEnabled = selectedCount > 0;
  const label = phase === "countries" 
    ? `Continue with ${selectedCount} ${selectedCount === 1 ? "country" : "countries"}`
    : `Analyze ${selectedCount} ${selectedCount === 1 ? "layer" : "layers"}`;

  return (
    <motion.button
      onClick={onClick}
      disabled={!isEnabled}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={isEnabled ? { scale: 1.02, y: -2 } : {}}
      whileTap={isEnabled ? { scale: 0.98 } : {}}
      className={cn(
        "flex items-center justify-center gap-3 px-6 py-3 rounded-xl font-semibold transition-all duration-300",
        isEnabled
          ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
          : "bg-slate-800/50 text-slate-500 cursor-not-allowed border border-slate-700/50"
      )}
    >
      {phase === "countries" ? (
        <>
          <span>{label}</span>
          <ArrowRight className="w-5 h-5" />
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5" />
          <span>{label}</span>
        </>
      )}
    </motion.button>
  );
}

// =============================================================================
// BACK BUTTON WITH SELECTION PREVIEW
// =============================================================================

interface BackButtonProps {
  onClick: () => void;
  selectedCountries: string[];
  countryMap: Map<string, CountryDataSummary>;
}

function BackButton({ onClick, selectedCountries, countryMap }: BackButtonProps) {
  const displayedCountries = selectedCountries.slice(0, 5);
  const remainingCount = selectedCountries.length - displayedCountries.length;

  return (
    <div className="flex items-center justify-between">
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02, x: -2 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all"
      >
        <ChevronLeft className="w-4 h-4" />
        <span className="text-sm font-medium">Back to Countries</span>
      </motion.button>

      {/* Selected countries preview */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-2"
      >
        <span className="text-xs text-slate-500">Analyzing:</span>
        <div className="flex items-center -space-x-2">
          {displayedCountries.map((iso, i) => {
            const country = countryMap.get(iso);
            return (
              <motion.div
                key={iso}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="w-6 h-6 rounded-full border-2 border-slate-800 overflow-hidden bg-slate-700"
                title={country?.name}
              >
                {country?.flag_url ? (
                  <img 
                    src={`${getApiBaseUrl()}${country.flag_url}`} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Globe className="w-3 h-3 text-slate-500" />
                  </div>
                )}
              </motion.div>
            );
          })}
          {remainingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="w-6 h-6 rounded-full border-2 border-slate-800 bg-slate-700 flex items-center justify-center"
            >
              <span className="text-[9px] font-bold text-slate-400">+{remainingCount}</span>
            </motion.div>
          )}
        </div>
        <span className="text-xs font-medium text-cyan-400">
          {selectedCountries.length} {selectedCountries.length === 1 ? "country" : "countries"}
        </span>
      </motion.div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CountryFlowWizard({
  countries,
  categories,
  selectedCountries,
  selectedCategories,
  onCountriesChange,
  onCategoriesChange,
  pivotData,
  pivotLoading,
  pivotError,
  onExport,
}: CountryFlowWizardProps) {
  const [currentPhase, setCurrentPhase] = useState<FlowPhase>("countries");

  // Create a map for quick country lookup
  const countryMap = useMemo(() => {
    const map = new Map<string, CountryDataSummary>();
    countries.forEach(c => map.set(c.iso_code, c));
    return map;
  }, [countries]);

  // Handle phase navigation
  const handleContinue = useCallback(() => {
    if (currentPhase === "countries" && selectedCountries.length > 0) {
      setCurrentPhase("data-layers");
    }
  }, [currentPhase, selectedCountries.length]);

  const handleBack = useCallback(() => {
    if (currentPhase === "data-layers") {
      setCurrentPhase("countries");
    }
  }, [currentPhase]);

  const handlePhaseClick = useCallback((phase: FlowPhase) => {
    // Only allow going back to countries, or forward if countries are selected
    if (phase === "countries" || selectedCountries.length > 0) {
      setCurrentPhase(phase);
    }
  }, [selectedCountries.length]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Phase Indicator */}
      <div className="flex-shrink-0">
        <PhaseIndicator
          currentPhase={currentPhase}
          selectedCountriesCount={selectedCountries.length}
          selectedCategoriesCount={selectedCategories.length}
          onPhaseClick={handlePhaseClick}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-5 min-h-0 overflow-hidden">
        {/* Left Panel: Selection Interface */}
        <div className="w-[45%] flex flex-col min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {currentPhase === "countries" ? (
              <motion.div
                key="countries-phase"
                {...phaseTransition}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                {/* Region Selector */}
                <div className="flex-1 overflow-hidden">
                  <RegionSelector
                    countries={countries}
                    countryMap={countryMap}
                    selectedCountries={selectedCountries}
                    onSelectionChange={onCountriesChange}
                  />
                </div>

                {/* Continue Button */}
                <div className="flex-shrink-0 mt-4 flex justify-end">
                  <ContinueButton
                    selectedCount={selectedCountries.length}
                    onClick={handleContinue}
                    phase="countries"
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="data-layers-phase"
                {...phaseTransition}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                {/* Back Button with Selection Preview */}
                <div className="flex-shrink-0 mb-3">
                  <BackButton 
                    onClick={handleBack} 
                    selectedCountries={selectedCountries}
                    countryMap={countryMap}
                  />
                </div>

                {/* Data Layer Tiles */}
                <div className="flex-1 overflow-hidden">
                  <DataLayerTiles
                    categories={categories}
                    selectedCategories={selectedCategories}
                    onCategoriesChange={onCategoriesChange}
                    selectedCountriesCount={selectedCountries.length}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel: Live Pivot Table */}
        <div className="w-[55%] min-h-0 overflow-hidden">
          <AnimatedPivotPanel
            data={pivotData}
            isLoading={pivotLoading}
            error={pivotError}
            selectedCountries={selectedCountries}
            selectedCategories={selectedCategories}
            countryMap={countryMap}
            onExport={onExport}
            phase={currentPhase}
          />
        </div>
      </div>
    </div>
  );
}

export default CountryFlowWizard;
