/**
 * Country Selection Step Component
 * Step 1: Select countries with visual grid and search
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight, Globe, Check } from "lucide-react";
import { cn, getApiBaseUrl } from "../../lib/utils";
import type { CountryDataSummary } from "../../services/api";

interface CountrySelectionStepProps {
  countries: CountryDataSummary[];
  selectedCountries: string[];
  onSelectionChange: (selected: string[]) => void;
  onContinue: () => void;
  maxSelections?: number;
}

export function CountrySelectionStep({
  countries,
  selectedCountries,
  onSelectionChange,
  onContinue,
  maxSelections = 10,
}: CountrySelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.iso_code.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);

  const handleToggleCountry = (isoCode: string) => {
    if (selectedCountries.includes(isoCode)) {
      onSelectionChange(selectedCountries.filter((c) => c !== isoCode));
    } else if (selectedCountries.length < maxSelections) {
      onSelectionChange([...selectedCountries, isoCode]);
    }
  };

  const handleRemoveCountry = (isoCode: string) => {
    onSelectionChange(selectedCountries.filter((c) => c !== isoCode));
  };

  const selectedCountryData = useMemo(() => {
    return selectedCountries
      .map((iso) => countries.find((c) => c.iso_code === iso))
      .filter(Boolean) as CountryDataSummary[];
  }, [selectedCountries, countries]);

  const canContinue = selectedCountries.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center border border-cyan-500/30">
            <Globe className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Select Countries
            </h2>
            <p className="text-sm text-slate-400">
              Choose up to {maxSelections} countries to analyze
            </p>
          </div>
        </div>
        <div className="text-sm text-slate-400">
          <span className="text-cyan-400 font-semibold">
            {selectedCountries.length}
          </span>
          /{maxSelections} selected
        </div>
      </div>

      {/* Selected Countries Chips */}
      <AnimatePresence>
        {selectedCountryData.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Selected Countries
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedCountryData.map((country, index) => (
                  <motion.div
                    key={country.iso_code}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 rounded-lg"
                  >
                    {country.flag_url && (
                      <img
                        src={`${getApiBaseUrl()}${country.flag_url}`}
                        alt=""
                        className="w-5 h-3 object-cover rounded shadow-sm"
                      />
                    )}
                    <span className="text-sm text-white font-medium">
                      {country.name}
                    </span>
                    <button
                      onClick={() => handleRemoveCountry(country.iso_code)}
                      className="text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          placeholder="Search countries by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Country Grid */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 max-h-[400px] overflow-y-auto scrollbar-thin">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {filteredCountries.map((country) => {
            const isSelected = selectedCountries.includes(country.iso_code);
            const isDisabled =
              !isSelected && selectedCountries.length >= maxSelections;

            return (
              <motion.button
                key={country.iso_code}
                onClick={() => handleToggleCountry(country.iso_code)}
                disabled={isDisabled}
                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                className={cn(
                  "relative p-3 rounded-lg border transition-all duration-200 text-left group",
                  isSelected
                    ? "bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/10"
                    : "bg-slate-800/50 border-slate-700/50 hover:border-slate-600",
                  isDisabled && "opacity-40 cursor-not-allowed"
                )}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* Flag */}
                <div className="flex justify-center mb-2">
                  {country.flag_url ? (
                    <img
                      src={`${getApiBaseUrl()}${country.flag_url}`}
                      alt=""
                      className="w-10 h-7 object-cover rounded shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-7 bg-slate-700 rounded flex items-center justify-center">
                      <Globe className="w-4 h-4 text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Country Info */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-xs font-medium truncate",
                      isSelected ? "text-white" : "text-slate-300"
                    )}
                  >
                    {country.name}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {country.iso_code}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {filteredCountries.length === 0 && (
          <div className="py-12 text-center">
            <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No countries found</p>
            <p className="text-sm text-slate-500 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>

      {/* Continue Button */}
      <div className="flex justify-end">
        <motion.button
          onClick={onContinue}
          disabled={!canContinue}
          whileHover={canContinue ? { scale: 1.02 } : {}}
          whileTap={canContinue ? { scale: 0.98 } : {}}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300",
            canContinue
              ? "bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40"
              : "bg-slate-700 text-slate-400 cursor-not-allowed"
          )}
        >
          <span>Continue to Data Layers</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>
    </motion.div>
  );
}

export default CountrySelectionStep;
