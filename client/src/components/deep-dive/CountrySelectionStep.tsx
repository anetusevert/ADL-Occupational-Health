/**
 * Arthur D. Little - Global Health Platform
 * Country Selection Step - Immersive Multi-Select Experience
 * 
 * Step 1 of the Deep Dive Wizard
 * Features:
 * - Region-first approach with GCC featured prominently
 * - Multi-country selection with visual feedback
 * - Select entire regions with one click
 * - Smart search with typeahead
 * - Selection summary panel
 * 
 * Re-applied: 2026-01-31
 */

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Landmark,
  Building2,
  Compass,
  MapPin,
  Palmtree,
  Crown,
  Check,
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
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
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
  const [expandedRegion, setExpandedRegion] = useState<string | null>("gcc");

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
      .slice(0, 10);
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
      <FloatingParticles color="cyan" count={25} />

      {/* Header */}
      <motion.div className="flex-shrink-0 px-8 py-6 relative z-10" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
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
          <motion.div className="relative max-w-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries by name or code..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all backdrop-blur-sm"
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50"
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
                      transition={{ delay: index * 0.05 }}
                    >
                      {country.flag_url ? (
                        <img src={country.flag_url} alt="" className="w-6 h-4 object-cover rounded shadow-sm" />
                      ) : (
                        <span className="w-6 text-xs text-slate-500">{country.iso_code}</span>
                      )}
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

      {/* Main Content - Region Cards */}
      <div className="flex-1 overflow-y-auto px-8 pb-32 relative z-10">
        <motion.div className="max-w-6xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
          {/* GCC Featured Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <GCCFeaturedCard
              countries={countriesByRegion["gcc"] || []}
              selectedCountries={selectedCountries}
              isExpanded={expandedRegion === "gcc"}
              onToggleExpand={() => setExpandedRegion(expandedRegion === "gcc" ? null : "gcc")}
              onSelectRegion={() => handleSelectRegion("gcc")}
              onCountryToggle={handleCountryToggle}
              isFullySelected={isRegionFullySelected("gcc")}
              selectedCount={getRegionSelectedCount("gcc")}
            />
          </motion.div>

          {/* Other Regions Grid */}
          <motion.div variants={itemVariants} className="mb-4">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4">Geographic Regions</h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SORTED_REGIONS.filter((r) => r.id !== "gcc").map((region) => (
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

// GCC Featured Card Component
interface GCCFeaturedCardProps {
  countries: CountryDeepDiveItem[];
  selectedCountries: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onSelectRegion: () => void;
  onCountryToggle: (isoCode: string) => void;
  isFullySelected: boolean;
  selectedCount: number;
}

function GCCFeaturedCard({ countries, selectedCountries, isExpanded, onToggleExpand, onSelectRegion, onCountryToggle, isFullySelected, selectedCount }: GCCFeaturedCardProps) {
  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border transition-all",
        "bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-transparent",
        isFullySelected ? "border-amber-500/50 ring-2 ring-amber-500/20" : "border-amber-500/30 hover:border-amber-500/50"
      )}
      whileHover={{ scale: 1.005 }}
    >
      <motion.div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-amber-400/10 to-amber-500/5" animate={{ x: ["-100%", "100%"] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} />

      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <motion.div
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/40 flex items-center justify-center"
              animate={{ boxShadow: ["0 0 20px rgba(245, 158, 11, 0.2)", "0 0 40px rgba(245, 158, 11, 0.4)", "0 0 20px rgba(245, 158, 11, 0.2)"] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Crown className="w-7 h-7 text-amber-400" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">Gulf Cooperation Council</h3>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-sm text-amber-400/80">Strategic Focus Region - 6 Countries</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <motion.button
              onClick={(e) => { e.stopPropagation(); onSelectRegion(); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                isFullySelected ? "bg-amber-500/30 border border-amber-500/50 text-amber-300" : "bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isFullySelected ? <><CheckCircle2 className="w-4 h-4" /> All Selected</> : <><Check className="w-4 h-4" /> Select All ({countries.length})</>}
            </motion.button>
            <motion.button onClick={onToggleExpand} className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:text-white transition-colors">
              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </motion.button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-slate-800/60 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full" initial={{ width: 0 }} animate={{ width: `${(selectedCount / countries.length) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
          <span className="text-xs text-slate-400">{selectedCount}/{countries.length} selected</span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-6 pb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {countries.map((country, index) => (
                <CountryChip key={country.iso_code} country={country} isSelected={selectedCountries.includes(country.iso_code)} onToggle={() => onCountryToggle(country.iso_code)} delay={index * 0.05} accentColor="amber" />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Region Card Component
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

  const getColorStyles = (color: string, isFullySelected: boolean) => {
    const styles: Record<string, { border: string; iconBg: string; text: string; button: string; progress: string }> = {
      blue: {
        border: isFullySelected ? "border-blue-500/50 ring-2 ring-blue-500/20" : "border-blue-500/30 hover:border-blue-500/50",
        iconBg: "from-blue-500/30 to-blue-600/20 border-blue-500/40",
        text: "text-blue-400",
        button: isFullySelected ? "bg-blue-500/30 border-blue-500/50 text-blue-300" : "bg-blue-500/20 border-blue-500/30 text-blue-400",
        progress: "from-blue-500 to-blue-400",
      },
      rose: {
        border: isFullySelected ? "border-rose-500/50 ring-2 ring-rose-500/20" : "border-rose-500/30 hover:border-rose-500/50",
        iconBg: "from-rose-500/30 to-rose-600/20 border-rose-500/40",
        text: "text-rose-400",
        button: isFullySelected ? "bg-rose-500/30 border-rose-500/50 text-rose-300" : "bg-rose-500/20 border-rose-500/30 text-rose-400",
        progress: "from-rose-500 to-rose-400",
      },
      emerald: {
        border: isFullySelected ? "border-emerald-500/50 ring-2 ring-emerald-500/20" : "border-emerald-500/30 hover:border-emerald-500/50",
        iconBg: "from-emerald-500/30 to-emerald-600/20 border-emerald-500/40",
        text: "text-emerald-400",
        button: isFullySelected ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-300" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
        progress: "from-emerald-500 to-emerald-400",
      },
      orange: {
        border: isFullySelected ? "border-orange-500/50 ring-2 ring-orange-500/20" : "border-orange-500/30 hover:border-orange-500/50",
        iconBg: "from-orange-500/30 to-orange-600/20 border-orange-500/40",
        text: "text-orange-400",
        button: isFullySelected ? "bg-orange-500/30 border-orange-500/50 text-orange-300" : "bg-orange-500/20 border-orange-500/30 text-orange-400",
        progress: "from-orange-500 to-orange-400",
      },
      cyan: {
        border: isFullySelected ? "border-cyan-500/50 ring-2 ring-cyan-500/20" : "border-cyan-500/30 hover:border-cyan-500/50",
        iconBg: "from-cyan-500/30 to-cyan-600/20 border-cyan-500/40",
        text: "text-cyan-400",
        button: isFullySelected ? "bg-cyan-500/30 border-cyan-500/50 text-cyan-300" : "bg-cyan-500/20 border-cyan-500/30 text-cyan-400",
        progress: "from-cyan-500 to-cyan-400",
      },
    };
    return styles[color] || styles.blue;
  };

  const styles = getColorStyles(region.color, isFullySelected);

  return (
    <motion.div className={cn("relative overflow-hidden rounded-xl border transition-all bg-gradient-to-br from-slate-800/40 to-slate-900/40", styles.border)} whileHover={{ scale: 1.01 }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br border flex items-center justify-center", styles.iconBg)}>
              <Icon className={cn("w-5 h-5", styles.text)} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">{region.name}</h4>
              <p className="text-xs text-slate-500">{countries.length} countries</p>
            </div>
          </div>
          <motion.button onClick={onToggleExpand} className="p-1.5 rounded-lg bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
            <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <motion.button
            onClick={(e) => { e.stopPropagation(); onSelectRegion(); }}
            className={cn("flex-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5", styles.button)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isFullySelected ? <><CheckCircle2 className="w-3 h-3" /> Selected</> : <><Check className="w-3 h-3" /> Select All</>}
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 bg-slate-800/60 rounded-full overflow-hidden">
            <motion.div className={cn("h-full bg-gradient-to-r rounded-full", styles.progress)} initial={{ width: 0 }} animate={{ width: `${(selectedCount / Math.max(countries.length, 1)) * 100}%` }} transition={{ duration: 0.3 }} />
          </div>
          <span className="text-[10px] text-slate-500">{selectedCount}/{countries.length}</span>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
            <div className="px-4 pb-4 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
              <div className="grid grid-cols-2 gap-2">
                {countries.map((country, index) => (
                  <CountryChip key={country.iso_code} country={country} isSelected={selectedCountries.includes(country.iso_code)} onToggle={() => onCountryToggle(country.iso_code)} delay={index * 0.02} accentColor={region.color} compact />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Country Chip Component
interface CountryChipProps {
  country: CountryDeepDiveItem;
  isSelected: boolean;
  onToggle: () => void;
  delay?: number;
  accentColor?: string;
  compact?: boolean;
}

function CountryChip({ country, isSelected, onToggle, delay = 0, accentColor = "purple", compact = false }: CountryChipProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-2 rounded-lg border transition-all text-left",
        compact ? "px-2 py-1.5" : "px-3 py-2",
        isSelected ? "bg-slate-700/60 border-slate-500/50" : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60"
      )}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {country.flag_url ? (
        <img src={country.flag_url} alt="" className={cn("object-cover rounded shadow-sm", compact ? "w-5 h-3" : "w-6 h-4")} />
      ) : (
        <span className={cn("text-slate-500", compact ? "text-[9px]" : "text-[10px]")}>{country.iso_code}</span>
      )}
      <span className={cn("truncate", compact ? "text-[11px]" : "text-xs", isSelected ? "text-white" : "text-slate-300")}>{country.name}</span>
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto">
          <CheckCircle2 className={cn("text-emerald-400", compact ? "w-3 h-3" : "w-4 h-4")} />
        </motion.div>
      )}
    </motion.button>
  );
}

export default CountrySelectionStep;
