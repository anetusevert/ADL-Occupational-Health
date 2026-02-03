/**
 * Arthur D. Little - Global Health Platform
 * Country Dashboard
 * 
 * New layout structure:
 * - Header: Country name, Flag, Relative Positioning bars (hoverable), OHI Score, View Report
 * - Top Row: Economic Data (left) + Framework Pillars (right)
 * - Bottom Row: Country Insights (full width - 6 tiles)
 * 
 * Central modal opens when clicking ANY tile on the page.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "../services/api";
import { CountryFlag } from "../components/CountryFlag";
import { cn, getEffectiveOHIScore } from "../lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { EconomicQuadrant } from "../components/dashboard/EconomicQuadrant";
import { PillarQuadrant } from "../components/dashboard/PillarQuadrant";
import { SlideshowQuadrant } from "../components/dashboard/SlideshowQuadrant";
import { HeaderPositioningBar } from "../components/dashboard/HeaderPositioningBar";
import { PillarDetailOverlay } from "../components/dashboard/PillarDetailOverlay";
import { CentralInsightModal, type InsightCategory } from "../components/dashboard/CentralInsightModal";
import type { GeoJSONMetadataResponse } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

export interface CountryIntelligence {
  iso_code: string;
  // Economic data
  gdp_per_capita_ppp: number | null;
  gdp_growth_rate: number | null;
  population_total: number | null;
  population_working_age: number | null;
  labor_force_participation: number | null;
  unemployment_rate: number | null;
  youth_unemployment_rate: number | null;
  informal_employment_pct: number | null;
  urban_population_pct: number | null;
  median_age: number | null;
  // Industry breakdown
  industry_pct_gdp: number | null;
  manufacturing_pct_gdp: number | null;
  agriculture_pct_gdp: number | null;
  services_pct_gdp: number | null;
  // Health & safety
  life_expectancy_at_birth: number | null;
  healthy_life_expectancy: number | null;
  health_expenditure_gdp_pct: number | null;
  // HDI
  hdi_score: number | null;
  hdi_rank: number | null;
}

export type PillarType = "governance" | "hazard-control" | "vigilance" | "restoration";

// Re-export InsightCategory for backwards compatibility
export type { InsightCategory } from "../components/dashboard/CentralInsightModal";

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CountryDashboard() {
  const { iso } = useParams<{ iso: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [selectedPillar, setSelectedPillar] = useState<PillarType | null>(null);
  const [selectedInsightCategory, setSelectedInsightCategory] = useState<InsightCategory | null>(null);

  // Fetch countries data for current country and global stats
  const { data: geoData, isLoading: geoLoading, error: geoError } = useQuery({
    queryKey: ["geojson-metadata"],
    queryFn: async (): Promise<GeoJSONMetadataResponse> => {
      const response = await apiClient.get<GeoJSONMetadataResponse>("/api/v1/countries/geojson-metadata");
      return response.data;
    },
    staleTime: 60 * 1000,
  });

  // Fetch country intelligence data
  const { data: intelligence, isLoading: intelLoading } = useQuery({
    queryKey: ["country-intelligence", iso],
    queryFn: async (): Promise<CountryIntelligence | null> => {
      try {
        const response = await apiClient.get(`/api/v1/countries/${iso}/intelligence`);
        return response.data;
      } catch {
        return null;
      }
    },
    enabled: !!iso,
    staleTime: 5 * 60 * 1000,
  });

  // Find current country
  const currentCountry = useMemo(() => {
    if (!geoData?.countries || !iso) return null;
    return geoData.countries.find(c => c.iso_code === iso);
  }, [geoData, iso]);

  // Calculate global averages for positioning
  const globalAverages = useMemo(() => {
    if (!geoData?.countries) return null;
    const countries = geoData.countries.filter(c => 
      c.governance_score != null || c.pillar1_score != null || 
      c.pillar2_score != null || c.pillar3_score != null
    );
    
    const avgField = (field: keyof typeof countries[0]) => {
      const valid = countries.filter(c => c[field] != null);
      if (valid.length === 0) return null;
      return valid.reduce((sum, c) => sum + (c[field] as number || 0), 0) / valid.length;
    };

    // Calculate percentiles for each score
    const getPercentile = (score: number | null, field: keyof typeof countries[0]) => {
      if (score === null) return null;
      const allScores = countries
        .map(c => c[field] as number | null)
        .filter((s): s is number => s !== null)
        .sort((a, b) => a - b);
      const index = allScores.findIndex(s => s >= score);
      return Math.round(((allScores.length - index) / allScores.length) * 100);
    };
    
    return {
      governance: avgField("governance_score"),
      hazardControl: avgField("pillar1_score"),
      vigilance: avgField("pillar2_score"),
      restoration: avgField("pillar3_score"),
      getPercentile,
      totalCountries: countries.length,
    };
  }, [geoData]);

  // Calculate OHI score
  const ohiScore = useMemo(() => {
    if (!currentCountry) return null;
    return getEffectiveOHIScore(
      currentCountry.maturity_score,
      currentCountry.governance_score,
      currentCountry.pillar1_score,
      currentCountry.pillar2_score,
      currentCountry.pillar3_score
    );
  }, [currentCountry]);

  // Loading state
  if (geoLoading || intelLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white/60">Loading country data...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (geoError || !currentCountry) {
    return (
      <div className="h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Country Not Found</h2>
          <p className="text-white/60 mb-4">Could not find data for this country.</p>
          <button
            onClick={() => navigate("/home")}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
          >
            Return to Map
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Positioning Bars */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/10 bg-slate-900/50 backdrop-blur-sm relative z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/home")}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors group"
            title="Back to Global Map"
          >
            <ArrowLeft className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
          </button>
          
          <div className="flex items-center gap-2.5">
            <CountryFlag
              isoCode={currentCountry.iso_code}
              flagUrl={currentCountry.flag_url}
              size="md"
              className="shadow-lg rounded"
            />
            
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">{currentCountry.name}</h1>
              <p className="text-xs text-white/50">Country Intelligence Dashboard</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Relative Positioning Bars (hoverable) */}
          <HeaderPositioningBar
            country={currentCountry}
            globalAverages={globalAverages}
            ohiScore={ohiScore}
          />
          
          {/* View Full Report Button */}
          <button
            onClick={() => navigate(`/country/${iso}/summary`)}
            className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-lg text-cyan-400 text-xs font-medium transition-colors whitespace-nowrap"
          >
            View Full Report
          </button>
        </div>
      </header>

      {/* New Layout: Top Row (2 quadrants) + Bottom Row (full width) */}
      <main className="flex-1 p-3 overflow-hidden flex flex-col gap-3">
        {/* Top Row: Economic Data + Framework Pillars */}
        <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
          {/* Top Left: Economic Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm overflow-hidden"
          >
            <EconomicQuadrant
              country={currentCountry}
              intelligence={intelligence}
              onTileClick={(category) => setSelectedInsightCategory(category as InsightCategory)}
            />
          </motion.div>

          {/* Top Right: Framework Pillars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm overflow-hidden"
          >
            <PillarQuadrant
              country={currentCountry}
              onPillarClick={(pillar) => setSelectedPillar(pillar)}
            />
          </motion.div>
        </div>

        {/* Bottom Row: Country Insights (Full Width) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex-1 rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm overflow-hidden min-h-0"
        >
          <SlideshowQuadrant
            country={currentCountry}
            intelligence={intelligence}
            onTileClick={(category) => setSelectedInsightCategory(category as InsightCategory)}
          />
        </motion.div>
      </main>

      {/* Pillar Detail Overlay */}
      <PillarDetailOverlay
        isOpen={selectedPillar !== null}
        pillar={selectedPillar}
        country={currentCountry}
        onClose={() => setSelectedPillar(null)}
        onNavigateToFullPage={(pillar) => {
          setSelectedPillar(null);
          navigate(`/country/${iso}/${pillar}`);
        }}
      />

      {/* Central Insight Modal - Opens for any tile click */}
      <CentralInsightModal
        isOpen={selectedInsightCategory !== null}
        onClose={() => setSelectedInsightCategory(null)}
        category={selectedInsightCategory}
        countryIso={currentCountry.iso_code}
        countryName={currentCountry.name}
        isAdmin={isAdmin}
        onRegenerate={() => {
          // TODO: Invalidate cache and refetch
          console.log("Regenerating insight for", selectedInsightCategory);
        }}
        economicData={intelligence ? {
          laborForce: intelligence.labor_force_participation,
          gdpPerCapita: intelligence.gdp_per_capita_ppp,
          population: intelligence.population_total,
          unemploymentRate: intelligence.unemployment_rate,
          youthUnemployment: intelligence.youth_unemployment_rate,
          informalEmployment: intelligence.informal_employment_pct,
          gdpGrowth: intelligence.gdp_growth_rate,
          urbanPopulation: intelligence.urban_population_pct,
          medianAge: intelligence.median_age,
          lifeExpectancy: intelligence.life_expectancy_at_birth,
        } : undefined}
      />
    </div>
  );
}

export default CountryDashboard;
