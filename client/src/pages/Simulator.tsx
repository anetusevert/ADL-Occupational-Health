/**
 * Arthur D. Little - Global Health Platform
 * Policy Simulator - Interactive AI-Powered Strategy Experience
 * 
 * Features:
 * - Interactive Framework Temple visualization
 * - Real-time dynamic scoring engine
 * - Live country rankings with animated position changes
 * - AI-streaming policy recommendations
 * - Gamified learning experience
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  Loader2,
  Crown,
  Shield,
  Eye,
  Heart,
  Target,
  TrendingUp,
  TrendingDown,
  Sparkles,
  RefreshCw,
  Zap,
  Trophy,
  ArrowUp,
  ArrowDown,
  FileText,
  Play,
  Pause,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { fetchAllCountries, fetchCountryWithMockFallback, aiApiClient } from "../services/api";
import type { Country, CountryListItem } from "../types/country";
import { cn, getCountryFlag, getMaturityStage } from "../lib/utils";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface SimulationMetrics {
  governance: number;
  hazardControl: number;
  healthVigilance: number;
  restoration: number;
}

interface PillarConfig {
  id: keyof SimulationMetrics;
  name: string;
  fullName: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  metrics: {
    id: string;
    label: string;
    description: string;
    impact: "high" | "medium" | "low";
  }[];
}

interface CountryRanking {
  iso_code: string;
  name: string;
  score: number;
  originalRank: number;
  projectedRank: number;
  delta: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PILLARS: PillarConfig[] = [
  {
    id: "governance",
    name: "Governance",
    fullName: "Governance Ecosystem",
    icon: Crown,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/30",
    glowColor: "shadow-purple-500/50",
    metrics: [
      { id: "policy", label: "Policy Framework", description: "National OH legislation strength", impact: "high" },
      { id: "enforcement", label: "Enforcement Capacity", description: "Inspector density & reach", impact: "high" },
      { id: "coordination", label: "Tripartite Dialogue", description: "Stakeholder collaboration", impact: "medium" },
    ],
  },
  {
    id: "hazardControl",
    name: "Hazard Control",
    fullName: "Hazard Prevention & Control",
    icon: Shield,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/30",
    glowColor: "shadow-blue-500/50",
    metrics: [
      { id: "chemical", label: "Chemical Safety", description: "OEL compliance & controls", impact: "high" },
      { id: "physical", label: "Physical Hazards", description: "Noise, ergonomics, machinery", impact: "medium" },
      { id: "climate", label: "Climate Adaptation", description: "Heat stress & outdoor protection", impact: "medium" },
    ],
  },
  {
    id: "healthVigilance",
    name: "Health Vigilance",
    fullName: "Surveillance & Detection",
    icon: Eye,
    color: "text-teal-400",
    bgColor: "bg-teal-500/20",
    borderColor: "border-teal-500/30",
    glowColor: "shadow-teal-500/50",
    metrics: [
      { id: "surveillance", label: "Disease Surveillance", description: "Detection & reporting systems", impact: "high" },
      { id: "mental", label: "Mental Health", description: "Psychosocial risk programs", impact: "medium" },
      { id: "screening", label: "Health Screening", description: "Medical surveillance coverage", impact: "medium" },
    ],
  },
  {
    id: "restoration",
    name: "Restoration",
    fullName: "Restoration & Compensation",
    icon: Heart,
    color: "text-amber-400",
    bgColor: "bg-amber-500/20",
    borderColor: "border-amber-500/30",
    glowColor: "shadow-amber-500/50",
    metrics: [
      { id: "compensation", label: "Compensation", description: "Workers' compensation coverage", impact: "high" },
      { id: "rtw", label: "Return-to-Work", description: "Rehabilitation programs", impact: "medium" },
      { id: "inclusion", label: "Informal Sector", description: "Migrant & informal worker protection", impact: "low" },
    ],
  },
];

const PILLAR_WEIGHTS = {
  governance: 0.30,
  hazardControl: 0.25,
  healthVigilance: 0.25,
  restoration: 0.20,
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function calculateMaturityScore(metrics: SimulationMetrics): number {
  const weightedScore = 
    metrics.governance * PILLAR_WEIGHTS.governance +
    metrics.hazardControl * PILLAR_WEIGHTS.hazardControl +
    metrics.healthVigilance * PILLAR_WEIGHTS.healthVigilance +
    metrics.restoration * PILLAR_WEIGHTS.restoration;
  
  return 1.0 + (weightedScore / 100) * 3.0;
}

function extractMetricsFromCountry(country: Country | null): SimulationMetrics {
  if (!country) {
    return { governance: 50, hazardControl: 50, healthVigilance: 50, restoration: 50 };
  }
  
  return {
    governance: country.governance?.strategic_capacity_score ?? 50,
    hazardControl: Math.min(100, Math.max(0, 
      100 - (country.pillar_1_hazard?.fatal_accident_rate ?? 5) * 5 + 
      (country.pillar_1_hazard?.oel_compliance_pct ?? 50) * 0.5
    )),
    healthVigilance: country.pillar_2_vigilance?.disease_detection_rate 
      ? Math.min(100, country.pillar_2_vigilance.disease_detection_rate / 2)
      : 50,
    restoration: country.pillar_3_restoration?.rehab_access_score ?? 50,
  };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Country Selector with Flags
 */
function CountrySelector({
  countries,
  selectedIso,
  onSelect,
  isLoading,
}: {
  countries: CountryListItem[];
  selectedIso: string | null;
  onSelect: (iso: string) => void;
  isLoading: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(query) || c.iso_code.toLowerCase().includes(query)
    ).slice(0, 50);
  }, [countries, searchQuery]);
  
  const selectedCountry = countries.find((c) => c.iso_code === selectedIso);
  
  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className={cn(
          "w-full flex items-center justify-between gap-3 px-4 py-3",
          "bg-slate-800/80 border border-slate-600/50 rounded-xl",
          "text-left transition-all duration-200",
          "hover:border-adl-accent/50 focus:outline-none focus:ring-2 focus:ring-adl-accent/30",
          isOpen && "border-adl-accent/50 ring-2 ring-adl-accent/30"
        )}
      >
        <div className="flex items-center gap-3">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-adl-accent animate-spin" />
          ) : selectedCountry ? (
            <>
              <span className="text-2xl">{getCountryFlag(selectedCountry.iso_code)}</span>
              <div>
                <p className="text-white font-medium">{selectedCountry.name}</p>
                <p className="text-xs text-slate-400">{selectedCountry.iso_code}</p>
              </div>
            </>
          ) : (
            <>
              <Search className="w-5 h-5 text-slate-400" />
              <span className="text-slate-400">Select a country...</span>
            </>
          )}
        </div>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform", isOpen && "rotate-180")} />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden"
          >
            <div className="p-3 border-b border-slate-700/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-adl-accent/50"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="max-h-64 overflow-y-auto">
              {filteredCountries.map((country) => (
                <button
                  key={country.iso_code}
                  onClick={() => {
                    onSelect(country.iso_code);
                    setIsOpen(false);
                    setSearchQuery("");
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                    "hover:bg-slate-700/50",
                    selectedIso === country.iso_code && "bg-adl-accent/20"
                  )}
                >
                  <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{country.name}</p>
                    <p className="text-xs text-slate-400">{country.iso_code}</p>
                  </div>
                  {country.maturity_score !== null && (
                    <span className="text-sm text-adl-accent font-mono">
                      {country.maturity_score.toFixed(1)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Interactive Framework Temple
 */
function FrameworkTemple({
  metrics,
  baselineMetrics,
  onMetricChange,
  activePillar,
  setActivePillar,
}: {
  metrics: SimulationMetrics;
  baselineMetrics: SimulationMetrics;
  onMetricChange: (pillar: keyof SimulationMetrics, value: number) => void;
  activePillar: keyof SimulationMetrics | null;
  setActivePillar: (pillar: keyof SimulationMetrics | null) => void;
}) {
  const governancePillar = PILLARS[0];
  const supportPillars = PILLARS.slice(1);
  
  return (
    <div className="h-full flex flex-col">
      {/* Governance Layer - Top */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        onClick={() => setActivePillar(activePillar === "governance" ? null : "governance")}
        className={cn(
          "flex-shrink-0 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 mb-3",
          governancePillar.bgColor,
          activePillar === "governance" 
            ? `${governancePillar.borderColor} shadow-lg ${governancePillar.glowColor}` 
            : "border-white/10 hover:border-white/20"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", governancePillar.bgColor)}>
              <Crown className={cn("w-5 h-5", governancePillar.color)} />
            </div>
            <div>
              <p className={cn("font-semibold", governancePillar.color)}>{governancePillar.name}</p>
              <p className="text-xs text-white/40">{governancePillar.fullName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-2xl font-bold", governancePillar.color)}>{metrics.governance}</p>
            <p className="text-xs text-white/40">
              {metrics.governance > baselineMetrics.governance ? "+" : ""}
              {metrics.governance - baselineMetrics.governance}
            </p>
          </div>
        </div>
        
        {/* Slider for active pillar */}
        <AnimatePresence>
          {activePillar === "governance" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-3"
            >
              <input
                type="range"
                min={0}
                max={100}
                value={metrics.governance}
                onChange={(e) => onMetricChange("governance", parseInt(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${metrics.governance}%, #334155 ${metrics.governance}%)`
                }}
              />
              <div className="grid grid-cols-3 gap-2">
                {governancePillar.metrics.map((m) => (
                  <div key={m.id} className="p-2 bg-white/5 rounded-lg">
                    <p className="text-[10px] text-white/60">{m.label}</p>
                    <p className="text-[8px] text-white/30">{m.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Connecting dots */}
      <div className="flex justify-center gap-8 py-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/20"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
      </div>
      
      {/* Three Support Pillars */}
      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
        {supportPillars.map((pillar) => {
          const Icon = pillar.icon;
          const value = metrics[pillar.id];
          const baseline = baselineMetrics[pillar.id];
          const isActive = activePillar === pillar.id;
          
          return (
            <motion.div
              key={pillar.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => setActivePillar(isActive ? null : pillar.id)}
              className={cn(
                "flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all duration-300",
                pillar.bgColor,
                isActive 
                  ? `${pillar.borderColor} shadow-lg ${pillar.glowColor}` 
                  : "border-white/10 hover:border-white/20"
              )}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", pillar.bgColor)}>
                  <Icon className={cn("w-4 h-4", pillar.color)} />
                </div>
                <div className="min-w-0">
                  <p className={cn("text-sm font-semibold truncate", pillar.color)}>{pillar.name}</p>
                </div>
              </div>
              
              <div className="flex items-end justify-between mb-2">
                <p className={cn("text-2xl font-bold", pillar.color)}>{value}</p>
                <p className={cn(
                  "text-xs",
                  value > baseline ? "text-emerald-400" : value < baseline ? "text-red-400" : "text-white/40"
                )}>
                  {value > baseline ? "+" : ""}{value - baseline}
                </p>
              </div>
              
              {/* Mini slider */}
              <input
                type="range"
                min={0}
                max={100}
                value={value}
                onChange={(e) => onMetricChange(pillar.id, parseInt(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, ${pillar.color === 'text-blue-400' ? '#3b82f6' : pillar.color === 'text-teal-400' ? '#14b8a6' : '#f59e0b'} 0%, ${pillar.color === 'text-blue-400' ? '#3b82f6' : pillar.color === 'text-teal-400' ? '#14b8a6' : '#f59e0b'} ${value}%, #334155 ${value}%)`
                }}
              />
              
              {/* Expanded metrics */}
              <AnimatePresence>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-2 space-y-1"
                  >
                    {pillar.metrics.map((m) => (
                      <div key={m.id} className="p-1.5 bg-white/5 rounded">
                        <p className="text-[9px] text-white/60">{m.label}</p>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Live Country Rankings
 */
function LiveRankings({
  selectedIso,
  selectedCountryName,
  allCountries,
  projectedScore,
  baselineScore,
}: {
  selectedIso: string | null;
  selectedCountryName: string;
  allCountries: CountryListItem[];
  projectedScore: number;
  baselineScore: number;
}) {
  // Calculate rankings
  const rankings = useMemo(() => {
    if (!selectedIso || allCountries.length === 0) return [];
    
    // Get countries with scores
    const countriesWithScores = allCountries
      .filter(c => c.maturity_score !== null)
      .map((c, idx) => ({
        iso_code: c.iso_code,
        name: c.name,
        score: c.iso_code === selectedIso ? projectedScore : (c.maturity_score ?? 0),
        originalScore: c.maturity_score ?? 0,
        originalRank: 0,
        projectedRank: 0,
        delta: 0,
      }))
      .sort((a, b) => b.originalScore - a.originalScore);
    
    // Assign original ranks
    countriesWithScores.forEach((c, i) => { c.originalRank = i + 1; });
    
    // Sort by projected score
    const projected = [...countriesWithScores].sort((a, b) => b.score - a.score);
    projected.forEach((c, i) => { c.projectedRank = i + 1; });
    
    // Calculate delta
    countriesWithScores.forEach(c => {
      const proj = projected.find(p => p.iso_code === c.iso_code);
      c.projectedRank = proj?.projectedRank ?? c.originalRank;
      c.delta = c.originalRank - c.projectedRank;
    });
    
    // Get top 10 and countries near selected
    const selectedRanking = countriesWithScores.find(c => c.iso_code === selectedIso);
    const top10 = projected.slice(0, 10);
    
    // Include selected country if not in top 10
    if (selectedRanking && !top10.find(c => c.iso_code === selectedIso)) {
      // Show top 8 + separator + selected country area
      const nearbyStart = Math.max(0, selectedRanking.projectedRank - 2);
      const nearbyEnd = Math.min(projected.length, selectedRanking.projectedRank + 2);
      const nearby = projected.slice(nearbyStart, nearbyEnd);
      
      return { type: 'split', top: top10.slice(0, 7), nearby, selectedRank: selectedRanking.projectedRank } as const;
    }
    
    return { type: 'continuous', rankings: top10 } as const;
  }, [selectedIso, allCountries, projectedScore]);
  
  const scoreDelta = projectedScore - baselineScore;
  
  if (!selectedIso) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">Select a country to see rankings</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Score Summary */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-adl-accent/20 to-cyan-500/10 rounded-xl border border-adl-accent/30 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider">Projected Score</p>
            <p className="text-3xl font-bold text-white">{projectedScore.toFixed(2)}</p>
            <p className="text-xs text-white/40">
              {getMaturityStage(projectedScore).label}
            </p>
          </div>
          <motion.div
            key={scoreDelta.toFixed(2)}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "flex flex-col items-center p-3 rounded-xl",
              scoreDelta > 0 ? "bg-emerald-500/20" : scoreDelta < 0 ? "bg-red-500/20" : "bg-white/5"
            )}
          >
            {scoreDelta > 0 ? (
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            ) : scoreDelta < 0 ? (
              <TrendingDown className="w-6 h-6 text-red-400" />
            ) : (
              <Target className="w-6 h-6 text-white/40" />
            )}
            <p className={cn(
              "text-lg font-bold",
              scoreDelta > 0 ? "text-emerald-400" : scoreDelta < 0 ? "text-red-400" : "text-white/40"
            )}>
              {scoreDelta > 0 ? "+" : ""}{scoreDelta.toFixed(2)}
            </p>
          </motion.div>
        </div>
      </div>
      
      {/* Rankings List */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin">
        <div className="space-y-1">
          {rankings && 'rankings' in rankings && rankings.rankings.map((country, idx) => {
            const isSelected = country.iso_code === selectedIso;
            return (
              <motion.div
                key={country.iso_code}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                  isSelected 
                    ? "bg-adl-accent/20 border border-adl-accent/40" 
                    : "bg-white/5 hover:bg-white/10"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                  idx === 0 ? "bg-amber-500/20 text-amber-400" :
                  idx === 1 ? "bg-slate-400/20 text-slate-300" :
                  idx === 2 ? "bg-orange-600/20 text-orange-400" :
                  "bg-white/10 text-white/60"
                )}>
                  {country.projectedRank}
                </div>
                <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isSelected ? "text-white" : "text-white/70"
                  )}>
                    {country.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-adl-accent">
                    {country.score.toFixed(2)}
                  </span>
                  {country.delta !== 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "flex items-center text-xs font-medium",
                        country.delta > 0 ? "text-emerald-400" : "text-red-400"
                      )}
                    >
                      {country.delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                      {Math.abs(country.delta)}
                    </motion.span>
                  )}
                </div>
              </motion.div>
            );
          })}
          
          {rankings && 'top' in rankings && (
            <>
              {rankings.top.map((country, idx) => {
                const isSelected = country.iso_code === selectedIso;
                return (
                  <motion.div
                    key={country.iso_code}
                    layout
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                      isSelected ? "bg-adl-accent/20 border border-adl-accent/40" : "bg-white/5"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold",
                      idx === 0 ? "bg-amber-500/20 text-amber-400" :
                      idx === 1 ? "bg-slate-400/20 text-slate-300" :
                      idx === 2 ? "bg-orange-600/20 text-orange-400" :
                      "bg-white/10 text-white/60"
                    )}>
                      {country.projectedRank}
                    </div>
                    <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-white/70">{country.name}</p>
                    </div>
                    <span className="text-sm font-mono text-adl-accent">{country.score.toFixed(2)}</span>
                  </motion.div>
                );
              })}
              
              <div className="text-center py-2 text-white/20">• • •</div>
              
              {rankings.nearby.map((country) => {
                const isSelected = country.iso_code === selectedIso;
                return (
                  <motion.div
                    key={country.iso_code}
                    layout
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg transition-all",
                      isSelected ? "bg-adl-accent/20 border border-adl-accent/40" : "bg-white/5"
                    )}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold bg-white/10 text-white/60">
                      {country.projectedRank}
                    </div>
                    <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isSelected ? "text-white" : "text-white/70"
                      )}>{country.name}</p>
                    </div>
                    <span className="text-sm font-mono text-adl-accent">{country.score.toFixed(2)}</span>
                    {country.delta !== 0 && (
                      <span className={cn(
                        "flex items-center text-xs font-medium",
                        country.delta > 0 ? "text-emerald-400" : "text-red-400"
                      )}>
                        {country.delta > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                        {Math.abs(country.delta)}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * AI Report Stream Panel
 */
function AIReportStream({
  selectedIso,
  selectedCountryName,
  metrics,
  baselineMetrics,
  projectedScore,
  baselineScore,
}: {
  selectedIso: string | null;
  selectedCountryName: string;
  metrics: SimulationMetrics;
  baselineMetrics: SimulationMetrics;
  projectedScore: number;
  baselineScore: number;
}) {
  const [report, setReport] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  
  // Generate AI report
  const generateReport = useCallback(async () => {
    if (!selectedIso || isGenerating) return;
    
    setIsGenerating(true);
    setReport("");
    setIsPaused(false);
    
    // Build the prompt
    const changes = [];
    if (metrics.governance !== baselineMetrics.governance) {
      changes.push(`Governance: ${baselineMetrics.governance} → ${metrics.governance} (${metrics.governance > baselineMetrics.governance ? '+' : ''}${metrics.governance - baselineMetrics.governance})`);
    }
    if (metrics.hazardControl !== baselineMetrics.hazardControl) {
      changes.push(`Hazard Control: ${baselineMetrics.hazardControl} → ${metrics.hazardControl} (${metrics.hazardControl > baselineMetrics.hazardControl ? '+' : ''}${metrics.hazardControl - baselineMetrics.hazardControl})`);
    }
    if (metrics.healthVigilance !== baselineMetrics.healthVigilance) {
      changes.push(`Health Vigilance: ${baselineMetrics.healthVigilance} → ${metrics.healthVigilance} (${metrics.healthVigilance > baselineMetrics.healthVigilance ? '+' : ''}${metrics.healthVigilance - baselineMetrics.healthVigilance})`);
    }
    if (metrics.restoration !== baselineMetrics.restoration) {
      changes.push(`Restoration: ${baselineMetrics.restoration} → ${metrics.restoration} (${metrics.restoration > baselineMetrics.restoration ? '+' : ''}${metrics.restoration - baselineMetrics.restoration})`);
    }
    
    const scoreDelta = projectedScore - baselineScore;
    
    // Simulate streaming (since we don't have a true streaming endpoint)
    const simulatedReport = generateSimulatedReport(
      selectedCountryName,
      changes,
      baselineScore,
      projectedScore,
      scoreDelta,
      metrics
    );
    
    // Stream the text character by character
    for (let i = 0; i < simulatedReport.length; i++) {
      if (isPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
        i--;
        continue;
      }
      
      setReport(simulatedReport.slice(0, i + 1));
      
      // Scroll to bottom
      if (reportRef.current) {
        reportRef.current.scrollTop = reportRef.current.scrollHeight;
      }
      
      // Variable delay for more natural feel
      const char = simulatedReport[i];
      const delay = char === '.' || char === '!' || char === '?' ? 80 :
                    char === ',' || char === ':' ? 40 :
                    char === '\n' ? 60 : 15;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    setIsGenerating(false);
  }, [selectedIso, selectedCountryName, metrics, baselineMetrics, projectedScore, baselineScore, isGenerating, isPaused]);
  
  if (!selectedIso) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">AI-powered policy recommendations</p>
          <p className="text-white/20 text-xs mt-1">Select a country to begin</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-adl-accent" />
          <span className="text-sm font-semibold text-white">AI Policy Analysis</span>
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              {isPaused ? (
                <Play className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Pause className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>
          )}
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
              isGenerating
                ? "bg-adl-accent/20 text-adl-accent"
                : "bg-adl-accent text-white hover:bg-adl-blue-light"
            )}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Report Content */}
      <div ref={reportRef} className="flex-1 overflow-auto scrollbar-thin p-4">
        {report ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="whitespace-pre-wrap text-white/80 leading-relaxed"
            >
              {report}
              {isGenerating && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-2 h-4 bg-adl-accent ml-0.5"
                />
              )}
            </motion.div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl bg-adl-accent/10 flex items-center justify-center mx-auto mb-4"
              >
                <Zap className="w-8 h-8 text-adl-accent" />
              </motion.div>
              <p className="text-white/60 text-sm mb-2">Ready to analyze your policy changes</p>
              <p className="text-white/30 text-xs">Adjust the framework pillars and click Generate</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generate simulated AI report (placeholder for real API)
 */
function generateSimulatedReport(
  countryName: string,
  changes: string[],
  baselineScore: number,
  projectedScore: number,
  scoreDelta: number,
  metrics: SimulationMetrics
): string {
  const improvement = scoreDelta > 0;
  const stage = getMaturityStage(projectedScore);
  
  let report = `📊 POLICY IMPACT ANALYSIS: ${countryName.toUpperCase()}\n`;
  report += `${"═".repeat(50)}\n\n`;
  
  report += `🎯 Executive Summary\n`;
  report += `${"─".repeat(30)}\n`;
  
  if (changes.length === 0) {
    report += `No policy changes have been modeled. Adjust the framework pillars to simulate different policy scenarios and see their projected impact on ${countryName}'s occupational health maturity.\n\n`;
  } else {
    report += `Based on the proposed policy interventions, ${countryName} is projected to ${improvement ? 'improve' : 'experience a change in'} its Sovereign OH Maturity Score from ${baselineScore.toFixed(2)} to ${projectedScore.toFixed(2)} (${scoreDelta > 0 ? '+' : ''}${scoreDelta.toFixed(2)}).\n\n`;
    
    report += `📈 Proposed Changes\n`;
    report += `${"─".repeat(30)}\n`;
    changes.forEach(change => {
      report += `• ${change}\n`;
    });
    report += `\n`;
    
    report += `💡 Strategic Recommendations\n`;
    report += `${"─".repeat(30)}\n`;
    
    if (metrics.governance > 70) {
      report += `✓ Governance Framework: ${countryName}'s strong governance score (${metrics.governance}) indicates robust policy infrastructure. Focus on enforcement and compliance monitoring.\n\n`;
    } else if (metrics.governance > 40) {
      report += `⚡ Governance Framework: Moderate governance capacity (${metrics.governance}) suggests opportunities for strengthening inspector density and ILO convention ratification.\n\n`;
    } else {
      report += `⚠ Governance Framework: Low governance score (${metrics.governance}) is a priority area. Recommend establishing a National OSH Policy and increasing inspector capacity.\n\n`;
    }
    
    if (metrics.hazardControl > 70) {
      report += `✓ Hazard Control: Excellent hazard prevention systems (${metrics.hazardControl}). Continue monitoring chemical exposure limits and ergonomic standards.\n\n`;
    } else {
      report += `⚡ Hazard Control: Score of ${metrics.hazardControl} indicates room for improvement in OEL compliance, chemical safety protocols, and heat stress management.\n\n`;
    }
    
    if (metrics.healthVigilance > 70) {
      report += `✓ Health Vigilance: Strong surveillance systems (${metrics.healthVigilance}) for early detection of occupational diseases.\n\n`;
    } else {
      report += `⚡ Health Vigilance: Enhance disease surveillance (${metrics.healthVigilance}) through improved reporting systems and regular health screenings.\n\n`;
    }
    
    if (metrics.restoration > 70) {
      report += `✓ Restoration & Compensation: Robust workers' compensation and return-to-work programs (${metrics.restoration}).\n\n`;
    } else {
      report += `⚡ Restoration: Current score of ${metrics.restoration} suggests expanding compensation coverage and rehabilitation access.\n\n`;
    }
    
    report += `🏆 Projected Outcome\n`;
    report += `${"─".repeat(30)}\n`;
    report += `With these interventions, ${countryName} is projected to achieve Stage ${stage.stage} (${stage.label}) maturity, positioning the country among ${improvement ? 'higher-performing' : 'comparable'} economies in occupational health protection.\n\n`;
    
    report += `📋 Implementation Priority\n`;
    report += `${"─".repeat(30)}\n`;
    report += `1. Quick Wins: Focus on policy ratification and enforcement mechanisms\n`;
    report += `2. Medium-Term: Expand surveillance and early detection systems\n`;
    report += `3. Long-Term: Build comprehensive rehabilitation infrastructure\n`;
  }
  
  return report;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Simulator() {
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    governance: 50,
    hazardControl: 50,
    healthVigilance: 50,
    restoration: 50,
  });
  const [baselineMetrics, setBaselineMetrics] = useState<SimulationMetrics>(metrics);
  const [activePillar, setActivePillar] = useState<keyof SimulationMetrics | null>(null);
  
  // Fetch countries
  const { data: countriesData, isLoading: isLoadingCountries } = useQuery({
    queryKey: ["countries-list"],
    queryFn: fetchAllCountries,
    staleTime: 10 * 60 * 1000,
  });
  
  // Fetch selected country
  const { data: selectedCountry, isLoading: isLoadingCountry } = useQuery({
    queryKey: ["country", selectedIso],
    queryFn: () => fetchCountryWithMockFallback(selectedIso!),
    enabled: !!selectedIso,
    staleTime: 5 * 60 * 1000,
  });
  
  // Update metrics when country loads
  useEffect(() => {
    if (selectedCountry) {
      const extracted = extractMetricsFromCountry(selectedCountry);
      setMetrics(extracted);
      setBaselineMetrics(extracted);
    }
  }, [selectedCountry]);
  
  // Calculate scores
  const baselineScore = useMemo(() => calculateMaturityScore(baselineMetrics), [baselineMetrics]);
  const projectedScore = useMemo(() => calculateMaturityScore(metrics), [metrics]);
  
  const handleMetricChange = useCallback((pillar: keyof SimulationMetrics, value: number) => {
    setMetrics(prev => ({ ...prev, [pillar]: value }));
  }, []);
  
  const resetToBaseline = useCallback(() => {
    setMetrics(baselineMetrics);
  }, [baselineMetrics]);
  
  const countries = countriesData?.countries ?? [];
  const selectedCountryName = selectedCountry?.name ?? "Selected Country";
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <motion.div 
            className="w-11 h-11 bg-adl-accent/20 rounded-xl flex items-center justify-center border border-adl-accent/30"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(6,182,212,0.2)",
                "0 0 30px rgba(6,182,212,0.4)",
                "0 0 20px rgba(6,182,212,0.2)",
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Target className="w-5 h-5 text-adl-accent" />
          </motion.div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              Policy Simulator
              <span className="px-2 py-0.5 text-[10px] font-mono bg-adl-accent/20 text-adl-accent rounded-full">
                AI-Powered
              </span>
            </h1>
            <p className="text-white/40 text-sm">
              Model policy changes • See real-time impact • Learn what works
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {selectedIso && (
            <button
              onClick={resetToBaseline}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
          <div className="w-64">
            <CountrySelector
              countries={countries}
              selectedIso={selectedIso}
              onSelect={setSelectedIso}
              isLoading={isLoadingCountries || isLoadingCountry}
            />
          </div>
        </div>
      </div>
      
      {/* Three-Panel Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
        {/* Left: Framework Temple */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-adl-accent" />
            <h2 className="text-sm font-semibold text-white">Framework Controls</h2>
          </div>
          <FrameworkTemple
            metrics={metrics}
            baselineMetrics={baselineMetrics}
            onMetricChange={handleMetricChange}
            activePillar={activePillar}
            setActivePillar={setActivePillar}
          />
        </div>
        
        {/* Center: Live Rankings */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <div className="h-full flex flex-col">
            <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-semibold text-white">Live Rankings</h2>
            </div>
            <div className="flex-1 min-h-0 p-4">
              <LiveRankings
                selectedIso={selectedIso}
                selectedCountryName={selectedCountryName}
                allCountries={countries}
                projectedScore={projectedScore}
                baselineScore={baselineScore}
              />
            </div>
          </div>
        </div>
        
        {/* Right: AI Report */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <AIReportStream
            selectedIso={selectedIso}
            selectedCountryName={selectedCountryName}
            metrics={metrics}
            baselineMetrics={baselineMetrics}
            projectedScore={projectedScore}
            baselineScore={baselineScore}
          />
        </div>
      </div>
    </div>
  );
}

export default Simulator;
