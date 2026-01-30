/**
 * Arthur D. Little - Global Health Platform
 * Leaderboard Page - Global Rankings
 * Viewport-fit design with no scrolling
 */

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Medal,
  Shield,
  ShieldCheck,
  ShieldAlert,
  TrendingDown,
  Loader2,
  AlertTriangle,
  Crown,
  Award,
  Globe,
  Users,
  ShieldQuestion,
  Building2,
  MapPin
} from "lucide-react";
import { fetchAllCountries, MOCK_COUNTRY_DATA } from "../services/api";
import { cn, getMaturityStage } from "../lib/utils";
import { CountryFlag } from "../components";
import type { CountryListItem } from "../types/country";

// G20 ISO codes (Alpha-3)
const G20_COUNTRIES = [
  "ARG", "AUS", "BRA", "CAN", "CHN", "FRA", "DEU", "IND", "IDN", "ITA",
  "JPN", "MEX", "RUS", "SAU", "ZAF", "KOR", "TUR", "GBR", "USA", "EUR"
];

// GCC (Gulf Cooperation Council) ISO codes (Alpha-3)
const GCC_COUNTRIES = ["BHR", "KWT", "OMN", "QAT", "SAU", "ARE"];

// Continent mapping for regional filters
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
  SEN: "Africa", SYC: "Africa", SLE: "Africa", SOM: "Africa", ZAF: "Africa",
  SSD: "Africa", SDN: "Africa", TZA: "Africa", TGO: "Africa", TUN: "Africa",
  UGA: "Africa", ZMB: "Africa", ZWE: "Africa",
  // North America
  CAN: "North America", USA: "North America", MEX: "North America",
  // Latin America & Caribbean
  ARG: "Latin America", BHS: "Latin America", BRB: "Latin America", BLZ: "Latin America", 
  BOL: "Latin America", BRA: "Latin America", CHL: "Latin America", COL: "Latin America", 
  CRI: "Latin America", CUB: "Latin America", DOM: "Latin America", ECU: "Latin America", 
  SLV: "Latin America", GTM: "Latin America", GUY: "Latin America", HTI: "Latin America", 
  HND: "Latin America", JAM: "Latin America", NIC: "Latin America", PAN: "Latin America", 
  PRY: "Latin America", PER: "Latin America", SUR: "Latin America", TTO: "Latin America", 
  URY: "Latin America", VEN: "Latin America",
  // Asia
  AFG: "Asia", ARM: "Asia", AZE: "Asia", BHR: "Asia", BGD: "Asia", BTN: "Asia",
  BRN: "Asia", KHM: "Asia", CHN: "Asia", CYP: "Asia", GEO: "Asia", IND: "Asia",
  IDN: "Asia", IRN: "Asia", IRQ: "Asia", ISR: "Asia", JPN: "Asia", JOR: "Asia",
  KAZ: "Asia", KWT: "Asia", KGZ: "Asia", LAO: "Asia", LBN: "Asia", MYS: "Asia",
  MDV: "Asia", MNG: "Asia", MMR: "Asia", NPL: "Asia", PRK: "Asia", OMN: "Asia",
  PAK: "Asia", PHL: "Asia", QAT: "Asia", SAU: "Asia", SGP: "Asia", KOR: "Asia",
  LKA: "Asia", SYR: "Asia", TWN: "Asia", TJK: "Asia", THA: "Asia", TLS: "Asia",
  TUR: "Asia", TKM: "Asia", ARE: "Asia", UZB: "Asia", VNM: "Asia", YEM: "Asia",
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

// Filter types
type FilterType = "global" | "g20" | "gcc" | "europe" | "asia" | "africa" | "north_america" | "latin_america" | "oceania" | "high_confidence";

// Extended country data with mock enrichment
interface LeaderboardCountry extends CountryListItem {
  fatal_accident_rate: number | null;
  data_coverage: number | null;
  governance_score: number | null;
  pillar1_score: number | null;
  pillar2_score: number | null;
  pillar3_score: number | null;
}

/**
 * Get trophy/medal icon for top 3 ranks
 */
function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-amber-400" />;
    case 2:
      return <Medal className="w-5 h-5 text-slate-300" />;
    case 3:
      return <Award className="w-5 h-5 text-amber-600" />;
    default:
      return null;
  }
}

/**
 * Get confidence shield based on data coverage
 */
function getConfidenceShield(coverage: number | null) {
  if (coverage === null) {
    return {
      icon: ShieldQuestion,
      color: "text-slate-500",
      bgColor: "bg-slate-500/10",
      label: "Unknown"
    };
  }
  
  if (coverage >= 80) {
    return {
      icon: ShieldCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      label: "High"
    };
  }
  
  if (coverage >= 50) {
    return {
      icon: Shield,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      label: "Medium"
    };
  }
  
  return {
    icon: ShieldAlert,
    color: "text-red-400",
    bgColor: "bg-red-500/10",
    label: "Low"
  };
}

export function Leaderboard() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterType>("global");

  // Fetch countries data
  const { data, isLoading, error } = useQuery({
    queryKey: ["countries"],
    queryFn: fetchAllCountries,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Enrich countries with mock data for fatality rate, data coverage, and pillar scores
  const enrichedCountries: LeaderboardCountry[] = useMemo(() => {
    if (!data?.countries) return [];
    
    return data.countries.map((country) => {
      const mockData = MOCK_COUNTRY_DATA[country.iso_code];
      const score = country.maturity_score;
      
      // Generate simulated data coverage based on maturity score
      // Higher maturity countries tend to have better data systems
      const simulatedCoverage = score 
        ? Math.min(100, Math.max(30, score + Math.random() * 20 - 10))
        : null;
      
      // Generate simulated fatality rate inversely related to maturity score
      const simulatedFatalityRate = score
        ? Math.max(0.2, 5.0 - (score / 100) * 4.5 + (Math.random() * 0.5 - 0.25))
        : null;
      
      // Generate simulated pillar scores based on maturity score (0-100 scale)
      // Each pillar varies slightly around the base maturity score
      const baseScore = score ? (score / 4) * 100 : null; // Convert 1-4 scale to 0-100
      const governanceScore = baseScore !== null 
        ? Math.min(100, Math.max(0, baseScore + (Math.random() * 15 - 7.5)))
        : null;
      const pillar1Score = baseScore !== null 
        ? Math.min(100, Math.max(0, baseScore + (Math.random() * 15 - 7.5)))
        : null;
      const pillar2Score = baseScore !== null 
        ? Math.min(100, Math.max(0, baseScore + (Math.random() * 15 - 7.5)))
        : null;
      const pillar3Score = baseScore !== null 
        ? Math.min(100, Math.max(0, baseScore + (Math.random() * 15 - 7.5)))
        : null;
      
      return {
        ...country,
        fatal_accident_rate: mockData?.pillar_1_hazard?.fatal_accident_rate ?? simulatedFatalityRate,
        data_coverage: mockData?.data_coverage_score ?? simulatedCoverage,
        governance_score: governanceScore,
        pillar1_score: pillar1Score,
        pillar2_score: pillar2Score,
        pillar3_score: pillar3Score,
      };
    });
  }, [data]);

  // Apply filters and sort by maturity score (high to low)
  const filteredAndSortedCountries = useMemo(() => {
    let filtered = [...enrichedCountries];
    
    // Apply filters
    switch (activeFilter) {
      case "g20":
        filtered = filtered.filter((c) => G20_COUNTRIES.includes(c.iso_code));
        break;
      case "gcc":
        filtered = filtered.filter((c) => GCC_COUNTRIES.includes(c.iso_code));
        break;
      case "europe":
        filtered = filtered.filter((c) => CONTINENT_MAP[c.iso_code] === "Europe");
        break;
      case "asia":
        filtered = filtered.filter((c) => CONTINENT_MAP[c.iso_code] === "Asia");
        break;
      case "africa":
        filtered = filtered.filter((c) => CONTINENT_MAP[c.iso_code] === "Africa");
        break;
      case "north_america":
        filtered = filtered.filter((c) => CONTINENT_MAP[c.iso_code] === "North America");
        break;
      case "latin_america":
        filtered = filtered.filter((c) => CONTINENT_MAP[c.iso_code] === "Latin America");
        break;
      case "oceania":
        filtered = filtered.filter((c) => CONTINENT_MAP[c.iso_code] === "Oceania");
        break;
      case "high_confidence":
        filtered = filtered.filter((c) => c.data_coverage !== null && c.data_coverage > 80);
        break;
      default:
        // "global" - show all
        break;
    }
    
    // Sort by maturity score (high to low), nulls at bottom
    filtered.sort((a, b) => {
      if (a.maturity_score === null && b.maturity_score === null) return 0;
      if (a.maturity_score === null) return 1;
      if (b.maturity_score === null) return -1;
      return b.maturity_score - a.maturity_score;
    });
    
    return filtered;
  }, [enrichedCountries, activeFilter]);

  // Calculate top score for gap calculation
  const topScore = useMemo(() => {
    if (filteredAndSortedCountries.length === 0) return 0;
    return filteredAndSortedCountries[0]?.maturity_score ?? 0;
  }, [filteredAndSortedCountries]);

  // Calculate total countries for bottom 5 calculation
  const totalCountries = filteredAndSortedCountries.length;

  // Get row styling based on rank
  const getRowStyle = (rank: number) => {
    // Top 3 - no special background, just the trophy icons
    if (rank <= 10) {
      return "bg-emerald-500/10 hover:bg-emerald-500/15";
    }
    if (rank > totalCountries - 5 && totalCountries > 5) {
      return "bg-red-500/10 hover:bg-red-500/15";
    }
    return "hover:bg-slate-800/50";
  };

  // Filter buttons configuration
  const filterButtons: { id: FilterType; label: string; icon: React.ElementType }[] = [
    { id: "global", label: "Global", icon: Globe },
    { id: "g20", label: "G20", icon: Users },
    { id: "gcc", label: "GCC", icon: Building2 },
    { id: "europe", label: "Europe", icon: MapPin },
    { id: "asia", label: "Asia", icon: MapPin },
    { id: "africa", label: "Africa", icon: MapPin },
    { id: "north_america", label: "N. America", icon: MapPin },
    { id: "latin_america", label: "Latin America", icon: MapPin },
    { id: "oceania", label: "Oceania", icon: MapPin },
    { id: "high_confidence", label: "High Confidence", icon: ShieldCheck },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header - Fixed */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Global Rankings
            </h1>
            <p className="text-white/40 text-sm">
              Occupational Health Maturity Leaderboard
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filter Buttons */}
          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg p-1">
            {filterButtons.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveFilter(id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                  activeFilter === id
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-white/40 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              {filteredAndSortedCountries.length} Ranked
            </span>
          </div>
        </div>
      </div>

      {/* Leaderboard Table - Scrollable */}
      <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
        {/* Table Header */}
        <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 bg-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Ranking Engine</h2>
            </div>
            <span className="text-white/30 text-xs">Sorted by Maturity Score</span>
          </div>
        </div>

        {/* Table Content - Scrollable */}
        <div className="flex-1 overflow-auto scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <span className="ml-3 text-slate-400">Loading rankings...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Connection Error</h3>
              <p className="text-slate-400 mb-4">Unable to fetch country data.</p>
              <p className="text-sm text-slate-500">
                Make sure the backend server is running at http://localhost:8002
              </p>
            </div>
          ) : filteredAndSortedCountries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Trophy className="w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Countries Found</h3>
              <p className="text-slate-400">
                {activeFilter !== "global" 
                  ? "Try adjusting your filter settings." 
                  : "No country data available."
                }
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/20">
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider w-20">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Country
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Maturity Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Governance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Hazard Control
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Health Vigilance
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Restoration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Fatality Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Data Confidence
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Gap to #1
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {filteredAndSortedCountries.map((country, index) => {
                  const rank = index + 1;
                  const maturityStage = getMaturityStage(country.maturity_score);
                  const confidence = getConfidenceShield(country.data_coverage);
                  const ConfidenceIcon = confidence.icon;
                  const gap = country.maturity_score !== null ? topScore - country.maturity_score : null;
                  
                  return (
                    <tr
                      key={country.iso_code}
                      onClick={() => navigate(`/country/${country.iso_code}`)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        getRowStyle(rank)
                      )}
                    >
                      {/* Rank */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getRankIcon(rank)}
                          <span className={cn(
                            "font-mono font-bold",
                            rank === 1 ? "text-amber-400 text-lg" :
                            rank === 2 ? "text-slate-300 text-lg" :
                            rank === 3 ? "text-amber-600 text-lg" :
                            "text-slate-400"
                          )}>
                            #{rank}
                          </span>
                        </div>
                      </td>

                      {/* Country (Flag + Name) */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <CountryFlag 
                            isoCode={country.iso_code} 
                            flagUrl={country.flag_url} 
                            size="md" 
                          />
                          <div>
                            <p className="text-white font-medium">{country.name}</p>
                            <p className="text-xs text-slate-500 font-mono">{country.iso_code}</p>
                          </div>
                        </div>
                      </td>

                      {/* Maturity Score (Badge) */}
                      <td className="px-4 py-3">
                        {country.maturity_score !== null ? (
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-3 py-1 rounded-lg font-mono font-bold text-sm",
                              maturityStage.bgColor,
                              maturityStage.color
                            )}>
                              {country.maturity_score.toFixed(1)}
                            </span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded border",
                              maturityStage.bgColor,
                              maturityStage.borderColor,
                              maturityStage.color
                            )}>
                              {maturityStage.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">No data</span>
                        )}
                      </td>

                      {/* Governance Score */}
                      <td className="px-4 py-3">
                        {country.governance_score !== null ? (
                          <span className={cn(
                            "font-mono text-sm",
                            country.governance_score >= 75 ? "text-emerald-400" :
                            country.governance_score >= 50 ? "text-lime-400" :
                            country.governance_score >= 25 ? "text-orange-400" :
                            "text-red-400"
                          )}>
                            {country.governance_score.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      {/* Pillar 1: Hazard Control */}
                      <td className="px-4 py-3">
                        {country.pillar1_score !== null ? (
                          <span className={cn(
                            "font-mono text-sm",
                            country.pillar1_score >= 75 ? "text-emerald-400" :
                            country.pillar1_score >= 50 ? "text-lime-400" :
                            country.pillar1_score >= 25 ? "text-orange-400" :
                            "text-red-400"
                          )}>
                            {country.pillar1_score.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      {/* Pillar 2: Health Vigilance */}
                      <td className="px-4 py-3">
                        {country.pillar2_score !== null ? (
                          <span className={cn(
                            "font-mono text-sm",
                            country.pillar2_score >= 75 ? "text-emerald-400" :
                            country.pillar2_score >= 50 ? "text-lime-400" :
                            country.pillar2_score >= 25 ? "text-orange-400" :
                            "text-red-400"
                          )}>
                            {country.pillar2_score.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      {/* Pillar 3: Restoration */}
                      <td className="px-4 py-3">
                        {country.pillar3_score !== null ? (
                          <span className={cn(
                            "font-mono text-sm",
                            country.pillar3_score >= 75 ? "text-emerald-400" :
                            country.pillar3_score >= 50 ? "text-lime-400" :
                            country.pillar3_score >= 25 ? "text-orange-400" :
                            "text-red-400"
                          )}>
                            {country.pillar3_score.toFixed(0)}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      {/* Fatality Rate */}
                      <td className="px-4 py-3">
                        {country.fatal_accident_rate !== null ? (
                          <span className={cn(
                            "font-mono text-sm",
                            country.fatal_accident_rate < 1.0 ? "text-emerald-400" :
                            country.fatal_accident_rate < 2.0 ? "text-yellow-400" :
                            country.fatal_accident_rate < 3.0 ? "text-orange-400" :
                            "text-red-400"
                          )}>
                            {country.fatal_accident_rate.toFixed(2)}
                            <span className="text-slate-500 text-xs ml-1">per 100k</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">—</span>
                        )}
                      </td>

                      {/* Data Confidence (Shield) */}
                      <td className="px-4 py-3">
                        <div className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
                          confidence.bgColor
                        )}>
                          <ConfidenceIcon className={cn("w-4 h-4", confidence.color)} />
                          <span className={cn("text-xs font-medium", confidence.color)}>
                            {confidence.label}
                          </span>
                          {country.data_coverage !== null && (
                            <span className="text-slate-500 text-xs ml-1">
                              ({country.data_coverage.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Gap to #1 */}
                      <td className="px-4 py-3 text-right">
                        {gap !== null ? (
                          rank === 1 ? (
                            <span className="text-amber-400 font-medium flex items-center justify-end gap-1">
                              <Crown className="w-4 h-4" />
                              Leader
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono flex items-center justify-end gap-1">
                              <TrendingDown className="w-4 h-4 text-slate-500" />
                              (-{gap.toFixed(1)})
                            </span>
                          )
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Legend Footer */}
        {filteredAndSortedCountries.length > 0 && (
          <div className="flex-shrink-0 px-4 py-2.5 border-t border-white/5 bg-white/5">
            <div className="flex flex-wrap items-center gap-4 text-[10px] text-white/30">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500/40"></div>
                <span>Top 10</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-red-500/30 border border-red-500/40"></div>
                <span>Bottom 5</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>Gold</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Medal className="w-3 h-3 text-slate-300" />
                <span>Silver</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Award className="w-3 h-3 text-amber-600" />
                <span>Bronze</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
