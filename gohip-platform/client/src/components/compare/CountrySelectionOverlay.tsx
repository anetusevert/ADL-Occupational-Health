/**
 * Arthur D. Little - Global Health Platform
 * Country Selection Overlay Component
 * 
 * Full-screen animated overlay for initial country selection
 * Two large country selector cards with search functionality
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ArrowLeftRight,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { cn, getApiBaseUrl, getCountryFlag } from "../../lib/utils";
import { ADLScoreBadge } from "./ADLScoreBadge";
import type { Country } from "../../types/country";

// ============================================================================
// PROPS
// ============================================================================

interface CountrySelectionOverlayProps {
  countries: Country[];
  countriesMap: Map<string, Country>;
  leftCountry: string;
  rightCountry: string;
  onLeftChange: (iso: string) => void;
  onRightChange: (iso: string) => void;
  onCompare: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CountrySelectionOverlay({
  countries,
  countriesMap,
  leftCountry,
  rightCountry,
  onLeftChange,
  onRightChange,
  onCompare,
}: CountrySelectionOverlayProps) {
  const leftData = countriesMap.get(leftCountry);
  const rightData = countriesMap.get(rightCountry);

  const canCompare = leftData && rightData && leftCountry !== rightCountry;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center h-full px-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">
          Compare Countries
        </h1>
        <p className="text-slate-400">
          Select two countries to compare their occupational health frameworks
        </p>
      </motion.div>

      {/* Selection Cards */}
      <div className="flex items-center gap-6 mb-8">
        {/* Left Country Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <CountrySelectionCard
            label="First Country"
            value={leftCountry}
            onChange={onLeftChange}
            countries={countries}
            countriesMap={countriesMap}
            excludeValue={rightCountry}
            side="left"
          />
        </motion.div>

        {/* VS Divider */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 200 }}
          className="flex flex-col items-center"
        >
          <div className="w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500/50 flex items-center justify-center">
            <ArrowLeftRight className="w-6 h-6 text-purple-400" />
          </div>
          <span className="text-purple-400 font-bold text-lg mt-2">VS</span>
        </motion.div>

        {/* Right Country Card */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <CountrySelectionCard
            label="Second Country"
            value={rightCountry}
            onChange={onRightChange}
            countries={countries}
            countriesMap={countriesMap}
            excludeValue={leftCountry}
            side="right"
          />
        </motion.div>
      </div>

      {/* Compare Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        whileHover={{ scale: canCompare ? 1.02 : 1 }}
        whileTap={{ scale: canCompare ? 0.98 : 1 }}
        onClick={canCompare ? onCompare : undefined}
        disabled={!canCompare}
        className={cn(
          "flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all",
          canCompare
            ? "bg-gradient-to-r from-purple-500 to-purple-700 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        )}
      >
        <Sparkles className="w-5 h-5" />
        Compare Frameworks
      </motion.button>
    </motion.div>
  );
}

// ============================================================================
// COUNTRY SELECTION CARD
// ============================================================================

interface CountrySelectionCardProps {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  countries: Country[];
  countriesMap: Map<string, Country>;
  excludeValue?: string;
  side: "left" | "right";
}

function CountrySelectionCard({
  label,
  value,
  onChange,
  countries,
  countriesMap,
  excludeValue,
  side,
}: CountrySelectionCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCountry = countriesMap.get(value);

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

  const flagUrl = selectedCountry?.flag_url
    ? `${getApiBaseUrl()}${selectedCountry.flag_url}`
    : null;

  return (
    <div className="relative">
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className={cn(
          "w-72 bg-slate-800/80 backdrop-blur-md border rounded-2xl p-6 cursor-pointer transition-all",
          isOpen
            ? "border-purple-500/50 shadow-lg shadow-purple-500/20"
            : "border-slate-700/50 hover:border-slate-600"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Label */}
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
          {label}
        </p>

        {/* Flag & Country */}
        <div className="flex flex-col items-center">
          {/* Large Flag */}
          <div className="w-24 h-16 rounded-lg overflow-hidden shadow-lg mb-4 bg-slate-700/50 flex items-center justify-center">
            {flagUrl ? (
              <img
                src={flagUrl}
                alt={selectedCountry?.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
            ) : (
              <span className="text-5xl">
                {getCountryFlag(value)}
              </span>
            )}
          </div>

          {/* Country Name */}
          <h3 className="text-xl font-bold text-white mb-1">
            {selectedCountry?.name || value}
          </h3>
          <p className="text-sm text-slate-500 mb-3">{value}</p>

          {/* ADL Score Badge */}
          <ADLScoreBadge
            score={selectedCountry?.maturity_score}
            size="sm"
            showStage={true}
            animate={false}
          />
        </div>

        {/* Chevron */}
        <div className="absolute top-4 right-4">
          <ChevronDown
            className={cn(
              "w-5 h-5 text-slate-400 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </div>
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
              "absolute z-50 w-72 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden",
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
                  className="w-full pl-9 pr-8 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchQuery("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                  >
                    <X className="w-3 h-3 text-slate-500" />
                  </button>
                )}
              </div>
            </div>

            {/* Country List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No countries found
                </div>
              ) : (
                filteredCountries.map((country) => {
                  const countryFlagUrl = country.flag_url
                    ? `${getApiBaseUrl()}${country.flag_url}`
                    : null;

                  return (
                    <button
                      key={country.iso_code}
                      onClick={(e) => {
                        e.stopPropagation();
                        onChange(country.iso_code);
                        setIsOpen(false);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors",
                        country.iso_code === value && "bg-purple-500/20"
                      )}
                    >
                      {countryFlagUrl ? (
                        <img
                          src={countryFlagUrl}
                          alt={country.name}
                          className="w-8 h-5 object-cover rounded shadow-sm"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                          }}
                        />
                      ) : (
                        <span className="text-xl w-8">
                          {getCountryFlag(country.iso_code)}
                        </span>
                      )}
                      <div className="flex-1 text-left">
                        <span className="text-white text-sm">{country.name}</span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {country.iso_code}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
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

export default CountrySelectionOverlay;
