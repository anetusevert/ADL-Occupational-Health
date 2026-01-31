/**
 * Region Selector Component
 * Animated region cards with expandable country grids
 * 
 * Features:
 * - Region cards with Framework-style animations
 * - Expandable country grids within each region
 * - Search functionality across all countries
 * - Quick select/deselect regions
 * - Selection summary with animated chips
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Users,
  Landmark,
  Building2,
  Compass,
  MapPin,
  Palmtree,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, getApiBaseUrl } from "../../lib/utils";
import { SORTED_REGIONS, type RegionDefinition, type RegionIconName } from "../../data/regions";
import type { CountryDataSummary } from "../../services/api";

// Icon resolver for region icons
const REGION_ICONS: Record<RegionIconName, LucideIcon> = {
  landmark: Landmark,
  building2: Building2,
  compass: Compass,
  globe: Globe,
  mapPin: MapPin,
  palmtree: Palmtree,
};

// =============================================================================
// ANIMATION CONSTANTS
// =============================================================================

const smoothEase = [0.25, 0.46, 0.45, 0.94] as const;

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { 
      delay: i * 0.08, 
      duration: 0.5, 
      ease: smoothEase 
    }
  }),
};

const countryCardVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { 
      delay: i * 0.02, 
      duration: 0.25, 
      ease: smoothEase 
    }
  }),
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } }
};

// =============================================================================
// TYPES
// =============================================================================

interface RegionSelectorProps {
  countries: CountryDataSummary[];
  countryMap: Map<string, CountryDataSummary>;
  selectedCountries: string[];
  onSelectionChange: (countries: string[]) => void;
}

// =============================================================================
// SEARCH BAR
// =============================================================================

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

function SearchBar({ value, onChange, resultCount, totalCount }: SearchBarProps) {
  return (
    <div className="relative mb-4">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
      <input
        type="text"
        placeholder="Search countries by name or code..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-12 pr-12 py-3 bg-slate-800/80 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
      />
      {value && (
        <>
          <span className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-slate-500">
            {resultCount}/{totalCount}
          </span>
          <button 
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}

// =============================================================================
// SELECTION SUMMARY
// =============================================================================

interface SelectionSummaryProps {
  selectedCountries: string[];
  countryMap: Map<string, CountryDataSummary>;
  onRemove: (iso: string) => void;
  onClear: () => void;
}

function SelectionSummary({ selectedCountries, countryMap, onRemove, onClear }: SelectionSummaryProps) {
  if (selectedCountries.length === 0) return null;

  const displayedCountries = selectedCountries.slice(0, 8);
  const remainingCount = selectedCountries.length - displayedCountries.length;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">
            {selectedCountries.length} {selectedCountries.length === 1 ? "country" : "countries"} selected
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="popLayout">
          {displayedCountries.map((iso) => {
            const country = countryMap.get(iso);
            return (
              <motion.div
                key={iso}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-cyan-500/20 border border-cyan-500/30 rounded-lg group"
              >
                {country?.flag_url && (
                  <img 
                    src={`${getApiBaseUrl()}${country.flag_url}`} 
                    alt="" 
                    className="w-4 h-3 rounded object-cover"
                  />
                )}
                <span className="text-xs text-cyan-300">{country?.name || iso}</span>
                <button
                  onClick={() => onRemove(iso)}
                  className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-500/30 transition-all"
                >
                  <X className="w-3 h-3 text-red-400" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
        
        {remainingCount > 0 && (
          <motion.span
            layout
            className="px-2 py-1 bg-slate-700/50 rounded-lg text-xs text-slate-400"
          >
            +{remainingCount} more
          </motion.span>
        )}
      </div>
    </motion.div>
  );
}

// =============================================================================
// REGION CARD
// =============================================================================

interface RegionCardProps {
  region: RegionDefinition;
  index: number;
  countries: CountryDataSummary[];
  selectedCountries: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onToggleCountry: (iso: string) => void;
  searchQuery: string;
}

function RegionCard({
  region,
  index,
  countries,
  selectedCountries,
  isExpanded,
  onToggleExpand,
  onSelectAll,
  onDeselectAll,
  onToggleCountry,
  searchQuery,
}: RegionCardProps) {
  const Icon = REGION_ICONS[region.iconName];
  
  // Filter countries in this region
  const regionCountries = useMemo(() => {
    return countries.filter(c => region.countries.includes(c.iso_code));
  }, [countries, region.countries]);

  // Further filter by search
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return regionCountries;
    const q = searchQuery.toLowerCase();
    return regionCountries.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.iso_code.toLowerCase().includes(q)
    );
  }, [regionCountries, searchQuery]);

  // Count selected in this region
  const selectedInRegion = useMemo(() => {
    return regionCountries.filter(c => selectedCountries.includes(c.iso_code)).length;
  }, [regionCountries, selectedCountries]);

  const allSelected = selectedInRegion === regionCountries.length && regionCountries.length > 0;
  const someSelected = selectedInRegion > 0 && !allSelected;

  // Hide region if search has no results in it
  if (searchQuery && filteredCountries.length === 0) {
    return null;
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className="mb-3"
    >
      {/* Region Header */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onToggleExpand}
        className={cn(
          "relative cursor-pointer rounded-xl border backdrop-blur-md transition-all duration-300 overflow-hidden",
          "bg-gradient-to-r from-slate-800/80 to-slate-800/60",
          isExpanded
            ? "border-slate-500/50 shadow-lg shadow-slate-800/50"
            : "border-slate-700/50 hover:border-slate-600/50"
        )}
      >
        {/* Subtle glow effect on expand */}
        <motion.div
          className="absolute inset-0 bg-slate-600/5 opacity-0 transition-opacity duration-300"
          animate={{ opacity: isExpanded ? 0.4 : 0 }}
        />

        <div className="relative z-10 p-4 flex items-center gap-4">
          {/* Icon */}
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-700 shadow-lg shadow-slate-900/30"
            animate={{
              rotate: isExpanded ? [0, -3, 3, 0] : 0,
            }}
            transition={{ duration: 0.4 }}
          >
            <Icon className="w-6 h-6 text-slate-200" />
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white">{region.name}</h3>
              {someSelected && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300">
                  {selectedInRegion}/{regionCountries.length}
                </span>
              )}
              {allSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300"
                >
                  <Check className="w-3 h-3" />
                  All
                </motion.span>
              )}
            </div>
            <p className="text-sm text-slate-400">{region.description}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                allSelected ? onDeselectAll() : onSelectAll();
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                allSelected
                  ? "bg-red-500/20 text-red-300 hover:bg-red-500/30"
                  : "bg-slate-600/30 text-slate-300 hover:bg-slate-600/50"
              )}
            >
              {allSelected ? "Deselect" : "Select All"}
            </motion.button>

            {/* Expand/Collapse */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown className="w-5 h-5 text-slate-400" />
            </motion.div>
          </div>
        </div>

        {/* Subtle bottom accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-xl bg-gradient-to-r from-slate-500/50 via-slate-400/30 to-slate-500/50"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{
            opacity: isExpanded ? 0.6 : 0,
            scaleX: isExpanded ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Expanded Country Grid */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: smoothEase }}
            className="overflow-hidden"
          >
            <div className="pt-3 pb-1 px-1">
              <div className="grid grid-cols-3 gap-2">
                <AnimatePresence mode="popLayout">
                  {filteredCountries.map((country, i) => {
                    const isSelected = selectedCountries.includes(country.iso_code);
                    
                    return (
                      <motion.button
                        key={country.iso_code}
                        custom={i}
                        variants={countryCardVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        onClick={() => onToggleCountry(country.iso_code)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className={cn(
                          "relative flex items-center gap-2 p-2.5 rounded-lg border transition-all duration-200",
                          isSelected
                            ? "bg-cyan-500/15 border-cyan-500/40 shadow-md shadow-cyan-900/10"
                            : "bg-slate-800/50 border-slate-700/30 hover:bg-slate-700/50 hover:border-slate-600"
                        )}
                      >
                        {/* Flag */}
                        <div className="flex-shrink-0 w-8 h-5 rounded overflow-hidden shadow-sm bg-slate-700">
                          {country.flag_url ? (
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
                        </div>

                        {/* Name */}
                        <span className={cn(
                          "flex-1 text-left text-xs font-medium truncate",
                          isSelected ? "text-white" : "text-slate-300"
                        )}>
                          {country.name}
                        </span>

                        {/* Selection indicator */}
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors",
                          isSelected ? "bg-cyan-500 border-cyan-500" : "border-slate-600"
                        )}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function RegionSelector({
  countries,
  countryMap,
  selectedCountries,
  onSelectionChange,
}: RegionSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRegions, setExpandedRegions] = useState<string[]>(["gcc"]); // GCC expanded by default

  // Toggle region expansion
  const toggleExpand = useCallback((regionId: string) => {
    setExpandedRegions(prev => 
      prev.includes(regionId) 
        ? prev.filter(id => id !== regionId)
        : [...prev, regionId]
    );
  }, []);

  // Select all countries in a region
  const selectAllInRegion = useCallback((regionId: string) => {
    const region = SORTED_REGIONS.find(r => r.id === regionId);
    if (!region) return;

    const regionCountryCodes = countries
      .filter(c => region.countries.includes(c.iso_code))
      .map(c => c.iso_code);

    const newSelection = [...new Set([...selectedCountries, ...regionCountryCodes])];
    onSelectionChange(newSelection);
  }, [countries, selectedCountries, onSelectionChange]);

  // Deselect all countries in a region
  const deselectAllInRegion = useCallback((regionId: string) => {
    const region = SORTED_REGIONS.find(r => r.id === regionId);
    if (!region) return;

    const newSelection = selectedCountries.filter(
      iso => !region.countries.includes(iso)
    );
    onSelectionChange(newSelection);
  }, [selectedCountries, onSelectionChange]);

  // Toggle single country
  const toggleCountry = useCallback((iso: string) => {
    if (selectedCountries.includes(iso)) {
      onSelectionChange(selectedCountries.filter(c => c !== iso));
    } else {
      onSelectionChange([...selectedCountries, iso]);
    }
  }, [selectedCountries, onSelectionChange]);

  // Remove country from selection
  const removeCountry = useCallback((iso: string) => {
    onSelectionChange(selectedCountries.filter(c => c !== iso));
  }, [selectedCountries, onSelectionChange]);

  // Clear all selections
  const clearAll = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Filter count for search
  const filteredCount = useMemo(() => {
    if (!searchQuery) return countries.length;
    const q = searchQuery.toLowerCase();
    return countries.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.iso_code.toLowerCase().includes(q)
    ).length;
  }, [countries, searchQuery]);

  return (
    <div className="h-full flex flex-col bg-slate-900/50 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-700/50 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Select Countries</h2>
            <p className="text-xs text-slate-400">
              Choose by region or search for specific countries
            </p>
          </div>
        </div>

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredCount}
          totalCount={countries.length}
        />

        {/* Selection Summary */}
        <AnimatePresence>
          <SelectionSummary
            selectedCountries={selectedCountries}
            countryMap={countryMap}
            onRemove={removeCountry}
            onClear={clearAll}
          />
        </AnimatePresence>
      </div>

      {/* Region List */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {SORTED_REGIONS.map((region, index) => (
          <RegionCard
            key={region.id}
            region={region}
            index={index}
            countries={countries}
            selectedCountries={selectedCountries}
            isExpanded={expandedRegions.includes(region.id)}
            onToggleExpand={() => toggleExpand(region.id)}
            onSelectAll={() => selectAllInRegion(region.id)}
            onDeselectAll={() => deselectAllInRegion(region.id)}
            onToggleCountry={toggleCountry}
            searchQuery={searchQuery}
          />
        ))}
      </div>
    </div>
  );
}

export default RegionSelector;
