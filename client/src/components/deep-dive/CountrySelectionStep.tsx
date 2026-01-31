/**
 * Arthur D. Little - Global Health Platform
 * Country Selection Step - Immersive Multi-Select Experience
 * 
 * Step 1 of the Deep Dive Wizard
 * Features:
 * - Equal treatment of all regions in unified grid
 * - Multi-country selection with visual feedback
 * - Select entire regions with one click
 * - Smart search with typeahead
 * - Selection summary panel
 * - Flags displayed for all countries
 * 
 * Updated: 2026-01-31
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Landmark,
  Building2,
  Compass,
  MapPin,
  Palmtree,
  Check,
  Flag,
} from "lucide-react";
import { type CountryDeepDiveItem } from "../../services/api";
import { cn } from "../../lib/utils";
import { FloatingParticles, GradientOrbs, PulseWaves, SelectionSummary } from "./shared";
import { REGIONS, SORTED_REGIONS, type RegionDefinition } from "../../data/regions";

// Icon mapping for regions
const REGION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  landmark: Landmark,
  building2: Building2,
  compass: Compass,
  globe: Globe,
  mapPin: MapPin,
  palmtree: Palmtree,
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", stiffness: 300, damping: 25 },
  },
};

interface CountrySelectionStepProps {
  countries: CountryDeepDiveItem[];
  isLoading: boolean;
  error: Error | null;
  selectedCountries: string[];
  onSelectCountry: (isoCode: string) => void;
  onDeselectCountry: (isoCode: string) => void;
  onSelectMultiple: (isoCodes: string[]) => void;
  onClearSelection: () => void;
  onContinue: () => void;
  onRetry: () => void;
}

export function CountrySelectionStep({
  countries,
  isLoading,
  error,
  selectedCountries,
  onSelectCountry,
  onDeselectCountry,
  onSelectMultiple,
  onClearSelection,
  onContinue,
  onRetry,
}: CountrySelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Group countries by region
  const countriesByRegion = useMemo(() => {
    const grouped: Record<string, CountryDeepDiveItem[]> = {};
    Object.entries(REGIONS).forEach(([regionId, region]) => {
      grouped[regionId] = countries
        .filter((c) => region.countries.includes(c.iso_code))
        .sort((a, b) => a.name.localeCompare(b.name));
    });
    return grouped;
  }, [countries]);

  // Get selected country data
  const selectedCountryData = useMemo(() => {
    return selectedCountries
      .map((iso) => countries.find((c) => c.iso_code === iso))
      .filter((c): c is CountryDeepDiveItem => c !== undefined);
  }, [selectedCountries, countries]);

  // Filter countries by search
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return countries
      .filter((c) => c.name.toLowerCase().includes(query) || c.iso_code.toLowerCase().includes(query))
      .slice(0, 8);
  }, [countries, searchQuery]);

  // Check if entire region is selected
  const isRegionFullySelected = useCallback(
    (regionId: string) => {
      const regionCountries = countriesByRegion[regionId] || [];
      if (regionCountries.length === 0) return false;
      return regionCountries.every((c) => selectedCountries.includes(c.iso_code));
    },
    [countriesByRegion, selectedCountries]
  );

  // Get count of selected countries in region
  const getRegionSelectedCount = useCallback(
    (regionId: string) => {
      const regionCountries = countriesByRegion[regionId] || [];
      return regionCountries.filter((c) => selectedCountries.includes(c.iso_code)).length;
    },
    [countriesByRegion, selectedCountries]
  );

  // Handle region selection
  const handleSelectRegion = useCallback(
    (regionId: string) => {
      const regionCountries = countriesByRegion[regionId] || [];
      const regionIsoCodes = regionCountries.map((c) => c.iso_code);
      if (isRegionFullySelected(regionId)) {
        regionIsoCodes.forEach((iso) => onDeselectCountry(iso));
      } else {
        onSelectMultiple(regionIsoCodes);
      }
    },
    [countriesByRegion, isRegionFullySelected, onSelectMultiple, onDeselectCountry]
  );

  // Handle individual country toggle
  const handleCountryToggle = useCallback(
    (isoCode: string) => {
      if (selectedCountries.includes(isoCode)) {
        onDeselectCountry(isoCode);
      } else {
        onSelectCountry(isoCode);
      }
    },
    [selectedCountries, onSelectCountry, onDeselectCountry]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center relative overflow-hidden">
        <GradientOrbs count={3} />
        <FloatingParticles color="purple" count={30} />
        <motion.div className="text-center relative z-10" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div className="relative w-32 h-32 mx-auto mb-8">
            <PulseWaves color="purple" count={3} size={120} duration={2} />
            <Globe className="w-14 h-14 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading Countries</h3>
          <p className="text-slate-400 text-sm">Preparing your global selection experience...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center relative overflow-hidden">
        <GradientOrbs count={2} />
        <motion.div className="text-center max-w-md px-6 relative z-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Failed to Load Countries</h3>
          <p className="text-sm text-slate-400 mb-6">{error.message}</p>
          <motion.button
            onClick={onRetry}
            className="px-5 py-2.5 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-300 text-sm font-medium flex items-center gap-2 mx-auto hover:bg-purple-500/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800">
      <GradientOrbs count={4} />
      <FloatingParticles color="purple" count={20} />

      {/* Header */}
      <motion.div className="flex-shrink-0 px-8 py-6 relative z-20" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <motion.h2 className="text-3xl font-bold text-white mb-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                Select Countries
              </motion.h2>
              <motion.p className="text-slate-400" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                Choose one or more countries for strategic deep dive analysis
              </motion.p>
            </div>
            <motion.div className="flex items-center gap-4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <div className="px-4 py-2 bg-slate-800/50 border border-slate-700/40 rounded-xl">
                <span className="text-sm text-slate-400">
                  <span className="text-white font-medium">{countries.length}</span> countries available
                </span>
              </div>
            </motion.div>
          </div>

          {/* Search Bar */}
          <motion.div ref={searchRef} className="relative max-w-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries by name or code..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800/80 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all backdrop-blur-sm"
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-slate-800/98 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-[100]"
                >
                  {searchResults.map((country, index) => (
                    <motion.button
                      key={country.iso_code}
                      onClick={() => {
                        handleCountryToggle(country.iso_code);
                        setSearchQuery("");
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                        selectedCountries.includes(country.iso_code) ? "bg-purple-500/20" : "hover:bg-slate-700/50"
                      )}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <CountryFlag country={country} size="md" />
                      <span className="flex-1 text-sm text-white">{country.name}</span>
                      {selectedCountries.includes(country.iso_code) && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content - All Regions Grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-40 relative z-10">
        <motion.div className="max-w-6xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SORTED_REGIONS.map((region) => (
              <motion.div key={region.id} variants={itemVariants}>
                <RegionCard
                  region={region}
                  countries={countriesByRegion[region.id] || []}
                  selectedCountries={selectedCountries}
                  isExpanded={expandedRegion === region.id}
                  onToggleExpand={() => setExpandedRegion(expandedRegion === region.id ? null : region.id)}
                  onSelectRegion={() => handleSelectRegion(region.id)}
                  onCountryToggle={handleCountryToggle}
                  isFullySelected={isRegionFullySelected(region.id)}
                  selectedCount={getRegionSelectedCount(region.id)}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Selection Summary Panel */}
      <AnimatePresence>
        {selectedCountries.length > 0 && (
          <SelectionSummary selectedCountries={selectedCountryData} onRemove={onDeselectCountry} onClear={onClearSelection} onContinue={onContinue} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Country Flag Component - always shows flag or styled placeholder
interface CountryFlagProps {
  country: CountryDeepDiveItem;
  size?: "sm" | "md" | "lg";
}

function CountryFlag({ country, size = "md" }: CountryFlagProps) {
  const sizeClasses = {
    sm: "w-5 h-3.5",
    md: "w-6 h-4",
    lg: "w-8 h-5",
  };

  if (country.flag_url) {
    return (
      <img 
        src={country.flag_url} 
        alt={country.name} 
        className={cn("object-cover rounded shadow-sm", sizeClasses[size])} 
      />
    );
  }

  // Fallback: styled placeholder with country code
  return (
    <div className={cn(
      "flex items-center justify-center rounded bg-slate-700/60 border border-slate-600/40",
      sizeClasses[size]
    )}>
      <Flag className="w-2.5 h-2.5 text-slate-500" />
    </div>
  );
}

// Region Card Component - unified styling for all regions
interface RegionCardProps {
  region: RegionDefinition;
  countries: CountryDeepDiveItem[];
  selectedCountries: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectRegion: () => void;
  onCountryToggle: (isoCode: string) => void;
  isFullySelected: boolean;
  selectedCount: number;
}

function RegionCard({ region, countries, selectedCountries, isExpanded, onToggleExpand, onSelectRegion, onCountryToggle, isFullySelected, selectedCount }: RegionCardProps) {
  const Icon = REGION_ICONS[region.iconName] || Globe;

  return (
    <motion.div 
      className={cn(
        "relative overflow-hidden rounded-xl border transition-all bg-gradient-to-br from-slate-800/60 to-slate-900/60",
        isFullySelected 
          ? "border-purple-500/50 ring-2 ring-purple-500/20" 
          : "border-slate-700/50 hover:border-slate-600/60"
      )} 
      whileHover={{ scale: 1.01 }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center">
              <Icon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{region.name}</h4>
              <p className="text-xs text-slate-500">{countries.length} countries</p>
            </div>
          </div>
          <motion.button 
            onClick={onToggleExpand} 
            className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
          >
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onSelectRegion(); }}
            className={cn(
              "flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5",
              isFullySelected 
                ? "bg-purple-500/30 border-purple-500/50 text-purple-300" 
                : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
            )}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isFullySelected ? <><CheckCircle2 className="w-3 h-3" /> Selected</> : <><Check className="w-3 h-3" /> Select All</>}
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full" 
              initial={{ width: 0 }} 
              animate={{ width: `${(selectedCount / Math.max(countries.length, 1)) * 100}%` }} 
              transition={{ duration: 0.3 }} 
            />
          </div>
          <span className="text-[10px] text-slate-500">{selectedCount}/{countries.length}</span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} 
            animate={{ height: "auto", opacity: 1 }} 
            exit={{ height: 0, opacity: 0 }} 
            transition={{ duration: 0.3 }} 
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
              <div className="grid grid-cols-1 gap-1.5">
                {countries.map((country, index) => (
                  <CountryChip 
                    key={country.iso_code} 
                    country={country} 
                    isSelected={selectedCountries.includes(country.iso_code)} 
                    onToggle={() => onCountryToggle(country.iso_code)} 
                    delay={index * 0.015} 
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Country Chip Component - consistent styling with flags
interface CountryChipProps {
  country: CountryDeepDiveItem;
  isSelected: boolean;
  onToggle: () => void;
  delay?: number;
}

function CountryChip({ country, isSelected, onToggle, delay = 0 }: CountryChipProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-all text-left w-full",
        isSelected 
          ? "bg-purple-500/20 border-purple-500/40" 
          : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/50"
      )}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <CountryFlag country={country} size="md" />
      <span className={cn("flex-1 text-xs truncate", isSelected ? "text-white font-medium" : "text-slate-300")}>
        {country.name}
      </span>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <CheckCircle2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
        </motion.div>
      )}
    </motion.button>
  );
}

export default CountrySelectionStep;
