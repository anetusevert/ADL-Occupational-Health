/**
 * Arthur D. Little - Global Health Platform
 * Comparison Dashboard Component
 * 
 * Zero-scroll dashboard layout with:
 * - Compact country header with ADL Score badges
 * - 4 pillar tiles in horizontal layout
 * - Critical gaps bar at footer
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeftRight,
  ChevronDown,
  Search,
  RefreshCw,
} from "lucide-react";
import { cn, getApiBaseUrl, getCountryFlag } from "../../lib/utils";
import { ADLScoreBadge } from "./ADLScoreBadge";
import { CompactPillarTile, PILLAR_CONFIGS, type PillarId } from "./CompactPillarTile";
import { CriticalGapsBar } from "./CriticalGapsBar";
import { PillarDetailModal } from "./PillarDetailModal";
import type { Country } from "../../types/country";

// ============================================================================
// PROPS
// ============================================================================

interface ComparisonDashboardProps {
  leftCountry: Country;
  rightCountry: Country;
  countriesMap: Map<string, Country>;
  countries: Country[];
  onLeftChange: (iso: string) => void;
  onRightChange: (iso: string) => void;
  onReset: () => void;
  onMetricClick: (
    metricId: string,
    metricName: string,
    leftValue: string | number | boolean | null | undefined,
    rightValue: string | number | boolean | null | undefined,
    suffix: string,
    lowerIsBetter: boolean,
    pillarName: string,
    pillarColor: string
  ) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ComparisonDashboard({
  leftCountry,
  rightCountry,
  countriesMap,
  countries,
  onLeftChange,
  onRightChange,
  onReset,
  onMetricClick,
}: ComparisonDashboardProps) {
  const [activePillar, setActivePillar] = useState<PillarId | null>(null);

  const handlePillarClick = (pillarId: PillarId) => {
    setActivePillar(pillarId);
  };

  const closePillarModal = () => {
    setActivePillar(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col h-full"
    >
      {/* Header: Country Cards */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex-shrink-0 mb-4"
      >
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center justify-between">
            {/* Left Country */}
            <CompactCountryCard
              country={leftCountry}
              countries={countries}
              countriesMap={countriesMap}
              excludeValue={rightCountry.iso_code}
              onChange={onLeftChange}
              side="left"
            />

            {/* VS Indicator */}
            <div className="flex flex-col items-center mx-4">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-purple-400 font-bold mt-1">VS</span>
            </div>

            {/* Right Country */}
            <CompactCountryCard
              country={rightCountry}
              countries={countries}
              countriesMap={countriesMap}
              excludeValue={leftCountry.iso_code}
              onChange={onRightChange}
              side="right"
            />

            {/* Reset Button */}
            <button
              onClick={onReset}
              className="ml-4 p-2 rounded-lg bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Change countries"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Main Content: Pillar Tiles */}
      <div className="flex-1 flex flex-col justify-center mb-4">
        <div className="grid grid-cols-4 gap-4">
          {PILLAR_CONFIGS.map((config, index) => (
            <CompactPillarTile
              key={config.id}
              pillarId={config.id}
              leftCountry={leftCountry}
              rightCountry={rightCountry}
              onClick={() => handlePillarClick(config.id)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Footer: Critical Gaps */}
      <div className="flex-shrink-0">
        <CriticalGapsBar
          leftCountry={leftCountry}
          rightCountry={rightCountry}
          onGapClick={onMetricClick}
        />
      </div>

      {/* Pillar Detail Modal */}
      <PillarDetailModal
        isOpen={activePillar !== null}
        onClose={closePillarModal}
        pillarId={activePillar}
        leftCountry={leftCountry}
        rightCountry={rightCountry}
        onMetricClick={onMetricClick}
      />
    </motion.div>
  );
}

// ============================================================================
// COMPACT COUNTRY CARD
// ============================================================================

interface CompactCountryCardProps {
  country: Country;
  countries: Country[];
  countriesMap: Map<string, Country>;
  excludeValue: string;
  onChange: (iso: string) => void;
  side: "left" | "right";
}

function CompactCountryCard({
  country,
  countries,
  countriesMap,
  excludeValue,
  onChange,
  side,
}: CompactCountryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const flagUrl = country.flag_url
    ? `${getApiBaseUrl()}${country.flag_url}`
    : null;

  const filteredCountries = useMemo(() => {
    return countries
      .filter((c) => c.iso_code !== excludeValue)
      .filter((c) => {
        if (!searchQuery) return true;
        const name = c.name?.toLowerCase() || "";
        return (
          name.includes(searchQuery.toLowerCase()) ||
          c.iso_code.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
  }, [countries, excludeValue, searchQuery]);

  return (
    <div className="relative flex-1">
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all",
          "bg-slate-900/50 border",
          isOpen ? "border-purple-500/50" : "border-transparent hover:border-slate-600"
        )}
      >
        {/* Flag */}
        <div className="w-14 h-10 rounded-lg overflow-hidden shadow-lg bg-slate-700/50 flex items-center justify-center flex-shrink-0">
          {flagUrl ? (
            <img
              src={flagUrl}
              alt={country.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
          ) : (
            <span className="text-3xl">{getCountryFlag(country.iso_code)}</span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{country.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{country.iso_code}</span>
            {country.data_coverage_score != null && (
              <span className="text-xs text-slate-500">
                • {country.data_coverage_score}% coverage
              </span>
            )}
          </div>
        </div>

        {/* ADL Score */}
        <ADLScoreBadge
          score={country.maturity_score}
          size="sm"
          showStage={true}
          animate={false}
        />

        {/* Chevron */}
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 transition-transform flex-shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </motion.div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden",
              side === "left" ? "left-0" : "right-0"
            )}
          >
            {/* Search */}
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Country List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((c) => {
                  const cFlagUrl = c.flag_url
                    ? `${getApiBaseUrl()}${c.flag_url}`
                    : null;

                  return (
                    <button
                      key={c.iso_code}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(c.iso_code);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors",
                        c.iso_code === country.iso_code && "bg-purple-500/20"
                      )}
                    >
                      {cFlagUrl ? (
                        <img
                          src={cFlagUrl}
                          alt={c.name}
                          className="w-6 h-4 object-cover rounded shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-lg">
                          {getCountryFlag(c.iso_code)}
                        </span>
                      )}
                      <span className="flex-1 text-left text-white text-sm">
                        {c.name}
                      </span>
                      <span className="text-xs text-slate-500">{c.iso_code}</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false);
            setSearchQuery("");
          }}
        />
      )}
    </div>
  );
}

export default ComparisonDashboard;
