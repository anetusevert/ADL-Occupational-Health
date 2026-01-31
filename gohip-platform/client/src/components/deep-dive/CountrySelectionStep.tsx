/**
 * Arthur D. Little - Global Health Platform
 * Country Selection Step
 * 
 * Step 1 of the Deep Dive Wizard - Immersive country picker
 * Layout: 60% visual (left) | 40% selection panel (right)
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  MapPin,
  Sparkles,
} from "lucide-react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { type CountryDeepDiveItem } from "../../services/api";
import { cn } from "../../lib/utils";
import { FloatingParticles } from "./shared";

// Map configuration
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Continent mapping for filtering
const CONTINENT_MAP: Record<string, string> = {
  // Africa
  DZA: "Africa", AGO: "Africa", BEN: "Africa", BWA: "Africa", BFA: "Africa",
  BDI: "Africa", CPV: "Africa", CMR: "Africa", CAF: "Africa", TCD: "Africa",
  COM: "Africa", COG: "Africa", COD: "Africa", CIV: "Africa", DJI: "Africa",
  EGY: "Africa", GNQ: "Africa", ERI: "Africa", SWZ: "Africa", ETH: "Africa",
  GAB: "Africa", GMB: "Africa", GHA: "Africa", GIN: "Africa", GNB: "Africa",
  KEN: "Africa", LSO: "Africa", LBR: "Africa", LBY: "Africa", MDG: "Africa",
  MWI: "Africa", MLI: "Africa", MRT: "Africa", MUS: "Africa", MAR: "Africa",
  MOZ: "Africa", NAM: "Africa", NER: "Africa", NGA: "Africa", RWA: "Africa",
  STP: "Africa", SEN: "Africa", SYC: "Africa", SLE: "Africa", SOM: "Africa",
  ZAF: "Africa", SSD: "Africa", SDN: "Africa", TZA: "Africa", TGO: "Africa",
  TUN: "Africa", UGA: "Africa", ZMB: "Africa", ZWE: "Africa",
  // Americas
  ATG: "Americas", ARG: "Americas", BHS: "Americas", BRB: "Americas", BLZ: "Americas",
  BOL: "Americas", BRA: "Americas", CAN: "Americas", CHL: "Americas", COL: "Americas",
  CRI: "Americas", CUB: "Americas", DMA: "Americas", DOM: "Americas", ECU: "Americas",
  SLV: "Americas", GRD: "Americas", GTM: "Americas", GUY: "Americas", HTI: "Americas",
  HND: "Americas", JAM: "Americas", MEX: "Americas", NIC: "Americas", PAN: "Americas",
  PRY: "Americas", PER: "Americas", KNA: "Americas", LCA: "Americas", VCT: "Americas",
  SUR: "Americas", TTO: "Americas", USA: "Americas", URY: "Americas", VEN: "Americas",
  // Asia
  AFG: "Asia", ARM: "Asia", AZE: "Asia", BGD: "Asia", BTN: "Asia",
  BRN: "Asia", KHM: "Asia", CHN: "Asia", CYP: "Asia", GEO: "Asia", IND: "Asia",
  IDN: "Asia", IRN: "Asia", IRQ: "Asia", ISR: "Asia", JPN: "Asia", JOR: "Asia",
  KAZ: "Asia", KGZ: "Asia", LAO: "Asia", LBN: "Asia", MYS: "Asia",
  MDV: "Asia", MNG: "Asia", MMR: "Asia", NPL: "Asia", PRK: "Asia",
  PAK: "Asia", PHL: "Asia", SGP: "Asia", KOR: "Asia",
  LKA: "Asia", SYR: "Asia", TJK: "Asia", THA: "Asia", TLS: "Asia", TKM: "Asia",
  UZB: "Asia", VNM: "Asia", YEM: "Asia", PSE: "Asia", TWN: "Asia",
  // GCC
  BHR: "GCC", KWT: "GCC", OMN: "GCC", QAT: "GCC", SAU: "GCC", ARE: "GCC",
  // Europe
  ALB: "Europe", AND: "Europe", AUT: "Europe", BLR: "Europe", BEL: "Europe",
  BIH: "Europe", BGR: "Europe", HRV: "Europe", CZE: "Europe", DNK: "Europe",
  EST: "Europe", FIN: "Europe", FRA: "Europe", DEU: "Europe", GRC: "Europe",
  HUN: "Europe", ISL: "Europe", IRL: "Europe", ITA: "Europe", LVA: "Europe",
  LIE: "Europe", LTU: "Europe", LUX: "Europe", MLT: "Europe", MDA: "Europe",
  MCO: "Europe", MNE: "Europe", NLD: "Europe", MKD: "Europe", NOR: "Europe",
  POL: "Europe", PRT: "Europe", ROU: "Europe", RUS: "Europe", SMR: "Europe",
  SRB: "Europe", SVK: "Europe", SVN: "Europe", ESP: "Europe", SWE: "Europe",
  CHE: "Europe", UKR: "Europe", GBR: "Europe", VAT: "Europe",
  // Oceania
  AUS: "Oceania", FJI: "Oceania", KIR: "Oceania", MHL: "Oceania", FSM: "Oceania",
  NRU: "Oceania", NZL: "Oceania", PLW: "Oceania", PNG: "Oceania", WSM: "Oceania",
  SLB: "Oceania", TON: "Oceania", TUV: "Oceania", VUT: "Oceania",
};

const CONTINENTS = ["All", "Africa", "Americas", "Asia", "Europe", "GCC", "Oceania"] as const;

interface CountrySelectionStepProps {
  countries: CountryDeepDiveItem[];
  isLoading: boolean;
  error: Error | null;
  onSelectCountry: (isoCode: string) => void;
  onRetry: () => void;
}

export function CountrySelectionStep({
  countries,
  isLoading,
  error,
  onSelectCountry,
  onRetry,
}: CountrySelectionStepProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContinent, setSelectedContinent] = useState<string>("All");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  // Filter countries by search and continent
  const filteredCountries = useMemo(() => {
    let result = countries;

    // Filter by continent
    if (selectedContinent !== "All") {
      result = result.filter(c => CONTINENT_MAP[c.iso_code] === selectedContinent);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.iso_code.toLowerCase().includes(query)
      );
    }

    // Sort by name
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, searchQuery, selectedContinent]);

  // Get hovered country data for map highlight
  const hoveredCountryData = useMemo(() => {
    if (!hoveredCountry) return null;
    return countries.find(c => c.iso_code === hoveredCountry);
  }, [hoveredCountry, countries]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="relative w-24 h-24 mx-auto mb-6">
            <motion.div
              className="absolute inset-0 border-4 border-purple-500/20 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 border-4 border-cyan-500/30 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <Globe className="w-10 h-10 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-400 text-sm">Loading countries...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <motion.div 
          className="text-center max-w-md px-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-10 h-10 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Failed to load countries</h3>
          <p className="text-sm text-slate-400 mb-4">{error.message}</p>
          <motion.button
            onClick={onRetry}
            className="px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-lg text-purple-300 text-sm font-medium flex items-center gap-2 mx-auto hover:bg-purple-500/30 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left Side - World Map Visual (60%) */}
      <div className="flex-[6] relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <FloatingParticles color="cyan" count={30} />
        
        {/* Map Container */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <motion.div
            className="w-full h-full max-w-4xl"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 130,
                center: [0, 30],
              }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup>
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryData = countries.find(
                        c => c.iso_code === geo.properties.ISO_A3 || c.iso_code === geo.id
                      );
                      const isHovered = hoveredCountry === geo.properties.ISO_A3 || hoveredCountry === geo.id;
                      const hasReports = countryData && countryData.completed_reports > 0;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => {
                            const isoCode = geo.properties.ISO_A3 || geo.id;
                            if (countries.find(c => c.iso_code === isoCode)) {
                              setHoveredCountry(isoCode);
                            }
                          }}
                          onMouseLeave={() => setHoveredCountry(null)}
                          onClick={() => {
                            const isoCode = geo.properties.ISO_A3 || geo.id;
                            if (countries.find(c => c.iso_code === isoCode)) {
                              onSelectCountry(isoCode);
                            }
                          }}
                          style={{
                            default: {
                              fill: hasReports ? "#4f46e5" : "#374151",
                              stroke: "#1e293b",
                              strokeWidth: 0.5,
                              outline: "none",
                              transition: "all 0.3s",
                              cursor: countryData ? "pointer" : "default",
                            },
                            hover: {
                              fill: countryData ? "#8b5cf6" : "#374151",
                              stroke: countryData ? "#a78bfa" : "#1e293b",
                              strokeWidth: countryData ? 1.5 : 0.5,
                              outline: "none",
                            },
                            pressed: {
                              fill: "#7c3aed",
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </motion.div>
        </div>

        {/* Hovered Country Info */}
        <AnimatePresence>
          {hoveredCountryData && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-8 left-8 bg-slate-800/90 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 min-w-[200px]"
            >
              <div className="flex items-center gap-3">
                {hoveredCountryData.flag_url ? (
                  <img
                    src={hoveredCountryData.flag_url}
                    alt={hoveredCountryData.name}
                    className="w-10 h-7 object-cover rounded shadow-lg"
                  />
                ) : (
                  <div className="w-10 h-7 bg-slate-700 rounded flex items-center justify-center">
                    <span className="text-xs text-slate-400">{hoveredCountryData.iso_code}</span>
                  </div>
                )}
                <div>
                  <h4 className="text-white font-medium">{hoveredCountryData.name}</h4>
                  <p className="text-xs text-slate-400">
                    {hoveredCountryData.completed_reports}/13 reports
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Title Overlay */}
        <motion.div
          className="absolute top-8 left-8"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-white mb-2">Select a Country</h2>
          <p className="text-slate-400 text-sm max-w-md">
            Choose a country to explore its occupational health landscape with AI-powered strategic analysis
          </p>
        </motion.div>
      </div>

      {/* Right Side - Selection Panel (40%) */}
      <motion.div 
        className="flex-[4] flex flex-col bg-slate-900/95 border-l border-slate-700/50"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Search Bar */}
        <div className="flex-shrink-0 p-4 border-b border-slate-700/40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries..."
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/40 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all"
            />
          </div>

          {/* Continent Filters */}
          <div className="flex flex-wrap gap-2 mt-3">
            {CONTINENTS.map((continent) => (
              <motion.button
                key={continent}
                onClick={() => setSelectedContinent(continent)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  selectedContinent === continent
                    ? "bg-purple-500/30 border border-purple-500/50 text-purple-300"
                    : "bg-slate-800/50 border border-slate-700/40 text-slate-400 hover:bg-slate-700/50"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {continent}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Country List */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
          <div className="grid grid-cols-2 gap-3">
            {filteredCountries.map((country, index) => (
              <motion.button
                key={country.iso_code}
                onClick={() => onSelectCountry(country.iso_code)}
                onMouseEnter={() => setHoveredCountry(country.iso_code)}
                onMouseLeave={() => setHoveredCountry(null)}
                className={cn(
                  "group relative flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                  hoveredCountry === country.iso_code
                    ? "bg-purple-500/20 border-purple-500/40"
                    : "bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/60 hover:border-slate-600/50"
                )}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.5) }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Flag */}
                {country.flag_url ? (
                  <img
                    src={country.flag_url}
                    alt={country.name}
                    className="w-8 h-6 object-cover rounded shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-6 bg-slate-700 rounded flex items-center justify-center">
                    <span className="text-[10px] text-slate-400">{country.iso_code}</span>
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                    {country.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {country.completed_reports > 0 ? (
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded-full",
                        country.completed_reports >= 13
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-amber-500/20 text-amber-400"
                      )}>
                        {country.completed_reports}/13
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500">No reports</span>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />

                {/* Sparkle for fully analyzed */}
                {country.completed_reports >= 13 && (
                  <motion.div
                    className="absolute -top-1 -right-1"
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Empty State */}
          {filteredCountries.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center py-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <MapPin className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-white font-medium mb-1">No countries found</h3>
              <p className="text-sm text-slate-500">Try adjusting your search or filters</p>
            </motion.div>
          )}
        </div>

        {/* Footer Stats */}
        <div className="flex-shrink-0 p-4 border-t border-slate-700/40 bg-slate-800/30">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{filteredCountries.length} countries</span>
            <span>Click to analyze</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default CountrySelectionStep;
