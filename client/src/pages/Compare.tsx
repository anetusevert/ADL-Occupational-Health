/**
 * Arthur D. Little - Global Health Platform
 * Compare Page - Framework Comparison
 * 
 * Enhanced with:
 * - All countries from database
 * - Real flag images from ETL
 * - Clickable metric tiles with detail modals
 * - Critical gaps analysis with drill-down
 */

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeftRight,
  ChevronDown,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertOctagon,
  Eye,
  HeartPulse,
  Users,
  Zap,
  Search,
} from "lucide-react";
import { fetchComparisonCountries } from "../services/api";
import { cn, getCountryFlag, getApiBaseUrl, formatNumber, getEffectiveOHIScore } from "../lib/utils";
import { MetricDetailModal } from "../components/compare/MetricDetailModal";
import { ADLScoreBadge } from "../components/compare/ADLScoreBadge";
import type { Country } from "../types/country";

// ============================================================================
// METRIC ROW TYPE DEFINITION
// ============================================================================

interface MetricRow {
  id: string;
  metric: string;
  leftValue: string | number | boolean | null | undefined;
  rightValue: string | number | boolean | null | undefined;
  lowerIsBetter?: boolean;
  suffix?: string;
  isHighlightMetric?: boolean;
}

// ============================================================================
// MODAL STATE TYPE
// ============================================================================

interface ModalState {
  isOpen: boolean;
  metricId: string | null;
  metricName: string;
  leftValue: string | number | boolean | null | undefined;
  rightValue: string | number | boolean | null | undefined;
  suffix: string;
  lowerIsBetter: boolean;
  pillarName: string;
  pillarColor: string;
}

// ============================================================================
// MAIN COMPARE COMPONENT
// ============================================================================

export function Compare() {
  const [leftCountry, setLeftCountry] = useState<string>("SAU");
  const [rightCountry, setRightCountry] = useState<string>("DEU");
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    metricId: null,
    metricName: "",
    leftValue: null,
    rightValue: null,
    suffix: "",
    lowerIsBetter: false,
    pillarName: "",
    pillarColor: "cyan",
  });

  // Fetch all countries with full pillar data
  const { data: comparisonData, isLoading, error } = useQuery({
    queryKey: ["comparison-countries"],
    queryFn: fetchComparisonCountries,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Create a map of countries by ISO code for quick lookup
  const countriesMap = useMemo(() => {
    if (!comparisonData?.countries) return new Map<string, Country>();
    return new Map(comparisonData.countries.map((c) => [c.iso_code, c]));
  }, [comparisonData]);

  // Get available countries list
  const availableCountries = useMemo(() => {
    if (!comparisonData?.countries) return [];
    return comparisonData.countries.map((c) => c.iso_code);
  }, [comparisonData]);

  // Ensure selected countries exist in the database, otherwise default to first available
  useEffect(() => {
    if (availableCountries.length > 0) {
      // If leftCountry doesn't exist in database, select first available
      if (!countriesMap.has(leftCountry)) {
        const firstAvailable = availableCountries[0];
        setLeftCountry(firstAvailable);
      }
      // If rightCountry doesn't exist in database, select second available (or first if only one)
      if (!countriesMap.has(rightCountry)) {
        const secondAvailable = availableCountries.find(c => c !== leftCountry) || availableCountries[0];
        setRightCountry(secondAvailable);
      }
    }
  }, [availableCountries, countriesMap, leftCountry, rightCountry]);

  // Get selected country data - directly from the map
  const leftData = countriesMap.get(leftCountry) || null;
  const rightData = countriesMap.get(rightCountry) || null;

  // Open metric modal
  const openMetricModal = (
    metricId: string,
    metricName: string,
    leftValue: string | number | boolean | null | undefined,
    rightValue: string | number | boolean | null | undefined,
    suffix: string = "",
    lowerIsBetter: boolean = false,
    pillarName: string = "Metric",
    pillarColor: string = "cyan"
  ) => {
    setModalState({
      isOpen: true,
      metricId,
      metricName,
      leftValue,
      rightValue,
      suffix,
      lowerIsBetter,
      pillarName,
      pillarColor,
    });
  };

  const closeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3 text-cyan-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading countries from database...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white font-medium text-sm">
            Failed to load comparison data
          </p>
          <p className="text-xs text-white/40 mt-1">
            Please ensure the ETL pipeline has been run to populate the database.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Page Header - Fixed */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
            <ArrowLeftRight className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight">
              Framework Comparison
            </h1>
            <p className="text-white/40 text-sm">
              Side-by-side 25-metric analysis • {comparisonData?.total || 0} countries available
            </p>
          </div>
        </div>
        
        {/* Country Selectors - Inline */}
        <div className="flex items-center gap-3">
          <div className="w-56">
            <CountrySelector
              label=""
              value={leftCountry}
              onChange={setLeftCountry}
              countries={availableCountries}
              countriesMap={countriesMap}
              excludeValue={rightCountry}
            />
          </div>
          <span className="text-white/20 text-sm font-medium">vs</span>
          <div className="w-56">
            <CountrySelector
              label=""
              value={rightCountry}
              onChange={setRightCountry}
              countries={availableCountries}
              countriesMap={countriesMap}
              excludeValue={leftCountry}
            />
          </div>
        </div>
      </div>

      {/* Comparison View - Scrollable */}
      {leftData && rightData ? (
        <div 
          key={`${leftCountry}-${rightCountry}`} 
          className="flex-1 overflow-auto scrollbar-thin space-y-4"
        >
          {/* Big Header Cards with Flags */}
          <ComparisonHeader 
            key={`header-${leftCountry}-${rightCountry}`}
            left={leftData} 
            right={rightData} 
          />

          {/* 4-Layer Framework Grid */}
          <FrameworkComparisonGrid 
            key={`grid-${leftCountry}-${rightCountry}`}
            left={leftData} 
            right={rightData} 
            onMetricClick={openMetricModal}
          />

          {/* Critical Gaps Summary */}
          <CriticalGapsSummary 
            key={`gaps-${leftCountry}-${rightCountry}`}
            left={leftData} 
            right={rightData} 
            onGapClick={openMetricModal}
          />
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
            <p className="text-white font-medium text-sm">
              Select countries with available data
            </p>
            <p className="text-xs text-white/40 mt-1">
              {comparisonData?.total || 0} countries available for comparison
            </p>
          </div>
        </div>
      )}

      {/* Metric Detail Modal */}
      {leftData && rightData && (
        <MetricDetailModal
          isOpen={modalState.isOpen}
          onClose={closeModal}
          metricId={modalState.metricId}
          metricName={modalState.metricName}
          leftCountry={leftData}
          rightCountry={rightData}
          leftValue={modalState.leftValue}
          rightValue={modalState.rightValue}
          suffix={modalState.suffix}
          lowerIsBetter={modalState.lowerIsBetter}
          pillarName={modalState.pillarName}
          pillarColor={modalState.pillarColor}
        />
      )}
    </div>
  );
}

// ============================================================================
// COUNTRY SELECTOR WITH SEARCH
// ============================================================================

interface CountrySelectorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  countries: string[];
  countriesMap: Map<string, Country>;
  excludeValue?: string;
}

function CountrySelector({
  label,
  value,
  onChange,
  countries,
  countriesMap,
  excludeValue,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectedCountry = countriesMap.get(value);

  // Filter countries based on search
  const filteredCountries = useMemo(() => {
    return countries
      .filter((iso) => iso !== excludeValue)
      .filter((iso) => {
        if (!searchQuery) return true;
        const country = countriesMap.get(iso);
        const name = country?.name?.toLowerCase() || "";
        return name.includes(searchQuery.toLowerCase()) || iso.toLowerCase().includes(searchQuery.toLowerCase());
      });
  }, [countries, excludeValue, searchQuery, countriesMap]);

  return (
    <div className="relative">
      {label && <label className="block text-sm font-medium text-slate-400 mb-2">{label}</label>}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-cyan-500/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <CountryFlagImage country={selectedCountry} size="md" />
          <div className="text-left">
            <p className="text-white font-medium text-sm">{selectedCountry?.name || value}</p>
            <p className="text-xs text-slate-500">{value}</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900/50 border border-slate-700/50 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
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
              filteredCountries.map((iso) => {
                const country = countriesMap.get(iso);
                return (
                  <button
                    key={iso}
                    onClick={() => {
                      onChange(iso);
                      setIsOpen(false);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors",
                      iso === value && "bg-cyan-500/20"
                    )}
                  >
                    <CountryFlagImage country={country} size="sm" />
                    <div className="flex-1 text-left">
                      <span className="text-white text-sm">{country?.name || iso}</span>
                    </div>
                    <span className="text-xs text-slate-500">{iso}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COUNTRY FLAG IMAGE COMPONENT
// ============================================================================

interface CountryFlagImageProps {
  country: Country | null | undefined;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

function CountryFlagImage({ country, size = "md", className }: CountryFlagImageProps) {
  const flagUrl = country?.flag_url ? `${getApiBaseUrl()}${country.flag_url}` : null;
  
  const sizeClasses = {
    sm: "w-6 h-4",
    md: "w-8 h-6",
    lg: "w-12 h-8",
    xl: "w-20 h-14",
  };

  // If we have a flag URL, show the actual image
  if (flagUrl) {
    return (
      <img
        src={flagUrl}
        alt={`${country?.name || "Country"} flag`}
        className={cn(
          sizeClasses[size],
          "object-cover rounded shadow-sm",
          className
        )}
        onError={(e) => {
          // Fallback to emoji if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = "none";
          target.parentElement?.querySelector(".flag-emoji")?.classList.remove("hidden");
        }}
      />
    );
  }

  // Fallback to emoji flag
  const emoji = getCountryFlag(country?.iso_code || "");
  const emojiSizes = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-4xl",
    xl: "text-6xl",
  };

  return (
    <span className={cn(emojiSizes[size], className)}>
      {emoji}
    </span>
  );
}

// ============================================================================
// COMPARISON HEADER - BIG FLAGS
// ============================================================================

interface ComparisonHeaderProps {
  left: Country;
  right: Country;
}

function ComparisonHeader({ left, right }: ComparisonHeaderProps) {
  // Extract pillar scores from nested objects for OHI calculation
  const leftGovScore = left.governance?.strategic_capacity_score ?? null;
  const leftPillar1Score = left.pillar_1_hazard?.control_maturity_score ?? null;
  const leftPillar2Score = left.pillar_2_vigilance?.disease_detection_rate ?? null;
  const leftPillar3Score = left.pillar_3_restoration?.rehab_access_score ?? null;

  const rightGovScore = right.governance?.strategic_capacity_score ?? null;
  const rightPillar1Score = right.pillar_1_hazard?.control_maturity_score ?? null;
  const rightPillar2Score = right.pillar_2_vigilance?.disease_detection_rate ?? null;
  const rightPillar3Score = right.pillar_3_restoration?.rehab_access_score ?? null;

  return (
    <div className="bg-gradient-to-r from-slate-800/80 via-slate-900/50 to-slate-800/80 rounded-xl border border-slate-700/50 p-4 sm:p-6">
      <div className="flex flex-col sm:grid sm:grid-cols-3 gap-4 sm:gap-0 items-center">
        {/* Left Country */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <CountryFlagImage country={left} size="xl" className="rounded-lg shadow-lg" />
          </div>
          <h2 className="text-2xl font-bold text-white mt-3">{left.name}</h2>
          <div className="flex items-center justify-center gap-4 mt-2">
            <ADLScoreBadge
              score={getEffectiveOHIScore(
                left.maturity_score,
                leftGovScore,
                leftPillar1Score,
                leftPillar2Score,
                leftPillar3Score
              )}
              size="md"
              showStage={true}
            />
            {left.data_coverage_score !== null && left.data_coverage_score !== undefined && (
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-300">
                {left.data_coverage_score}% Coverage
              </div>
            )}
          </div>
        </div>

        {/* VS Indicator */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 border-2 border-purple-500/50">
            <span className="text-2xl font-bold text-purple-400">VS</span>
          </div>
        </div>

        {/* Right Country */}
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <CountryFlagImage country={right} size="xl" className="rounded-lg shadow-lg" />
          </div>
          <h2 className="text-2xl font-bold text-white mt-3">{right.name}</h2>
          <div className="flex items-center justify-center gap-4 mt-2">
            <ADLScoreBadge
              score={getEffectiveOHIScore(
                right.maturity_score,
                rightGovScore,
                rightPillar1Score,
                rightPillar2Score,
                rightPillar3Score
              )}
              size="md"
              showStage={true}
            />
            {right.data_coverage_score !== null && right.data_coverage_score !== undefined && (
              <div className="px-3 py-1 rounded-full text-sm font-medium bg-slate-700/50 text-slate-300">
                {right.data_coverage_score}% Coverage
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4-LAYER FRAMEWORK COMPARISON GRID
// ============================================================================

interface FrameworkComparisonGridProps {
  left: Country;
  right: Country;
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

function FrameworkComparisonGrid({ left, right, onMetricClick }: FrameworkComparisonGridProps) {
  // Create unique keys based on country codes to force re-render when countries change
  const keyPrefix = `${left.iso_code}-${right.iso_code}`;
  
  // Build metrics arrays with current country data
  const governanceMetrics: MetricRow[] = [
    { id: 'ilo_c187', metric: 'ILO C187 Ratified', leftValue: left.governance?.ilo_c187_status, rightValue: right.governance?.ilo_c187_status },
    { id: 'ilo_c155', metric: 'ILO C155 Ratified', leftValue: left.governance?.ilo_c155_status, rightValue: right.governance?.ilo_c155_status },
    { id: 'inspector_density', metric: 'Inspector Density', leftValue: left.governance?.inspector_density, rightValue: right.governance?.inspector_density, suffix: '/10k' },
    { id: 'mental_health', metric: 'Mental Health Policy', leftValue: left.governance?.mental_health_policy, rightValue: right.governance?.mental_health_policy },
    { id: 'strategic_capacity', metric: 'Strategic Capacity', leftValue: left.governance?.strategic_capacity_score, rightValue: right.governance?.strategic_capacity_score, suffix: '%' },
  ];

  const hazardMetrics: MetricRow[] = [
    { id: 'fatal_rate', metric: 'Fatal Accident Rate', leftValue: left.pillar_1_hazard?.fatal_accident_rate, rightValue: right.pillar_1_hazard?.fatal_accident_rate, lowerIsBetter: true, suffix: '/100k', isHighlightMetric: true },
    { id: 'carcinogen', metric: 'Carcinogen Exposure', leftValue: left.pillar_1_hazard?.carcinogen_exposure_pct, rightValue: right.pillar_1_hazard?.carcinogen_exposure_pct, lowerIsBetter: true, suffix: '%' },
    { id: 'heat_stress', metric: 'Heat Stress Regulation', leftValue: left.pillar_1_hazard?.heat_stress_reg_type, rightValue: right.pillar_1_hazard?.heat_stress_reg_type },
    { id: 'oel_compliance', metric: 'OEL Compliance', leftValue: left.pillar_1_hazard?.oel_compliance_pct, rightValue: right.pillar_1_hazard?.oel_compliance_pct, suffix: '%', isHighlightMetric: true },
    { id: 'nihl_rate', metric: 'NIHL Rate', leftValue: left.pillar_1_hazard?.noise_induced_hearing_loss_rate, rightValue: right.pillar_1_hazard?.noise_induced_hearing_loss_rate, lowerIsBetter: true, suffix: '/100k' },
    { id: 'safety_training', metric: 'Safety Training', leftValue: left.pillar_1_hazard?.safety_training_hours_avg, rightValue: right.pillar_1_hazard?.safety_training_hours_avg, suffix: 'hrs/yr' },
    { id: 'control_maturity', metric: 'Control Maturity', leftValue: left.pillar_1_hazard?.control_maturity_score, rightValue: right.pillar_1_hazard?.control_maturity_score, suffix: '%' },
  ];

  const vigilanceMetrics: MetricRow[] = [
    { id: 'surveillance', metric: 'Surveillance Logic', leftValue: left.pillar_2_vigilance?.surveillance_logic, rightValue: right.pillar_2_vigilance?.surveillance_logic },
    { id: 'disease_detection', metric: 'Disease Detection', leftValue: left.pillar_2_vigilance?.disease_detection_rate, rightValue: right.pillar_2_vigilance?.disease_detection_rate, suffix: '%' },
    { id: 'vulnerability', metric: 'Vulnerability Index', leftValue: left.pillar_2_vigilance?.vulnerability_index, rightValue: right.pillar_2_vigilance?.vulnerability_index, lowerIsBetter: true, suffix: '/100' },
    { id: 'migrant_worker', metric: 'Migrant Workforce', leftValue: left.pillar_2_vigilance?.migrant_worker_pct, rightValue: right.pillar_2_vigilance?.migrant_worker_pct, suffix: '%', isHighlightMetric: true },
    { id: 'lead_screening', metric: 'Lead Screening Rate', leftValue: left.pillar_2_vigilance?.lead_exposure_screening_rate, rightValue: right.pillar_2_vigilance?.lead_exposure_screening_rate, suffix: '%' },
    { id: 'disease_reporting', metric: 'Disease Reporting', leftValue: left.pillar_2_vigilance?.occupational_disease_reporting_rate, rightValue: right.pillar_2_vigilance?.occupational_disease_reporting_rate, suffix: '%' },
  ];

  const restorationMetrics: MetricRow[] = [
    { id: 'payer', metric: 'Payer Mechanism', leftValue: left.pillar_3_restoration?.payer_mechanism, rightValue: right.pillar_3_restoration?.payer_mechanism },
    { id: 'reintegration', metric: 'Reintegration Law', leftValue: left.pillar_3_restoration?.reintegration_law, rightValue: right.pillar_3_restoration?.reintegration_law },
    { id: 'sickness_absence', metric: 'Sickness Absence', leftValue: left.pillar_3_restoration?.sickness_absence_days, rightValue: right.pillar_3_restoration?.sickness_absence_days, suffix: 'days/yr' },
    { id: 'rehab_access', metric: 'Rehab Access Score', leftValue: left.pillar_3_restoration?.rehab_access_score, rightValue: right.pillar_3_restoration?.rehab_access_score, suffix: '/100' },
    { id: 'rtw_success', metric: 'RTW Success Rate', leftValue: left.pillar_3_restoration?.return_to_work_success_pct, rightValue: right.pillar_3_restoration?.return_to_work_success_pct, suffix: '%', isHighlightMetric: true },
    { id: 'claim_settlement', metric: 'Claim Settlement', leftValue: left.pillar_3_restoration?.avg_claim_settlement_days, rightValue: right.pillar_3_restoration?.avg_claim_settlement_days, lowerIsBetter: true, suffix: 'days' },
    { id: 'rehab_participation', metric: 'Rehab Participation', leftValue: left.pillar_3_restoration?.rehab_participation_rate, rightValue: right.pillar_3_restoration?.rehab_participation_rate, suffix: '%' },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Layer 0: Governance */}
      <PillarComparisonCard
        key={`governance-${keyPrefix}`}
        title="Governance Layer"
        subtitle="Strategic Capacity & Policy"
        icon={<Shield className="w-5 h-5 text-white" />}
        iconBg="from-purple-500 to-purple-700"
        borderHover="hover:border-purple-500/50"
        pillarColor="purple"
        left={left}
        right={right}
        onMetricClick={onMetricClick}
        metrics={governanceMetrics}
      />

      {/* Pillar 1: Hazard Control */}
      <PillarComparisonCard
        key={`hazard-${keyPrefix}`}
        title="Pillar 1: Hazard Control"
        subtitle="Occupational Risk Management"
        icon={<AlertOctagon className="w-5 h-5 text-white" />}
        iconBg="from-red-500 to-red-700"
        borderHover="hover:border-red-500/50"
        pillarColor="red"
        left={left}
        right={right}
        onMetricClick={onMetricClick}
        metrics={hazardMetrics}
      />

      {/* Pillar 2: Health Vigilance */}
      <PillarComparisonCard
        key={`vigilance-${keyPrefix}`}
        title="Pillar 2: Health Vigilance"
        subtitle="Surveillance & Detection"
        icon={<Eye className="w-5 h-5 text-white" />}
        iconBg="from-cyan-500 to-cyan-700"
        borderHover="hover:border-cyan-500/50"
        pillarColor="cyan"
        left={left}
        right={right}
        onMetricClick={onMetricClick}
        metrics={vigilanceMetrics}
      />

      {/* Pillar 3: Restoration */}
      <PillarComparisonCard
        key={`restoration-${keyPrefix}`}
        title="Pillar 3: Restoration"
        subtitle="Compensation & Rehabilitation"
        icon={<HeartPulse className="w-5 h-5 text-white" />}
        iconBg="from-emerald-500 to-emerald-700"
        borderHover="hover:border-emerald-500/50"
        pillarColor="emerald"
        left={left}
        right={right}
        onMetricClick={onMetricClick}
        metrics={restorationMetrics}
      />
    </div>
  );
}

// ============================================================================
// PILLAR COMPARISON CARD
// ============================================================================

interface PillarComparisonCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  iconBg: string;
  borderHover: string;
  pillarColor: string;
  left: Country;
  right: Country;
  metrics: MetricRow[];
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

function PillarComparisonCard({
  title,
  subtitle,
  icon,
  iconBg,
  borderHover,
  pillarColor,
  left,
  right,
  metrics,
  onMetricClick,
}: PillarComparisonCardProps) {
  return (
    <div className={cn(
      "rounded-xl border backdrop-blur-sm p-5 transition-all duration-300",
      "bg-slate-800/50 border-slate-700/50",
      borderHover
    )}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={cn("w-10 h-10 bg-gradient-to-br rounded-lg flex items-center justify-center", iconBg)}>
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-3 gap-2 pb-2 border-b border-slate-700/50 mb-2">
        <div className="text-xs font-medium text-slate-500">Metric</div>
        <div className="text-xs font-medium text-slate-500 text-center">{left.iso_code}</div>
        <div className="text-xs font-medium text-slate-500 text-center">{right.iso_code}</div>
      </div>

      {/* Metric Rows */}
      <div className="space-y-1">
        {metrics.map((row) => (
          <ComparisonMetricRow 
            key={row.id} 
            row={row} 
            leftName={left.name}
            rightName={right.name}
            pillarName={title}
            pillarColor={pillarColor}
            onMetricClick={onMetricClick}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// COMPARISON METRIC ROW WITH GAP LOGIC & CLICK
// ============================================================================

interface ComparisonMetricRowProps {
  row: MetricRow;
  leftName: string;
  rightName: string;
  pillarName: string;
  pillarColor: string;
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

function ComparisonMetricRow({ row, pillarName, pillarColor, onMetricClick }: ComparisonMetricRowProps) {
  const formatValue = (val: string | number | boolean | null | undefined, suffix?: string): React.ReactNode => {
    if (val === null || val === undefined) return <span className="text-slate-500 text-xs">N/A</span>;
    if (typeof val === "boolean") {
      return val ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 mx-auto" />
      );
    }
    if (typeof val === "number") {
      return (
        <span>
          {formatNumber(val)}
          {suffix && <span className="text-slate-500 text-xs ml-0.5">{suffix}</span>}
        </span>
      );
    }
    return <span className="text-xs">{val}</span>;
  };

  // Determine winner for numeric comparisons
  let leftWins = false;
  let rightWins = false;
  let isCriticalGap = false;

  if (
    typeof row.leftValue === "number" &&
    typeof row.rightValue === "number"
  ) {
    if (row.lowerIsBetter) {
      leftWins = row.leftValue < row.rightValue;
      rightWins = row.rightValue < row.leftValue;
    } else {
      leftWins = row.leftValue > row.rightValue;
      rightWins = row.rightValue > row.leftValue;
    }
    
    // Calculate gap percentage for CRITICAL GAP detection
    const max = Math.max(row.leftValue, row.rightValue);
    const min = Math.min(row.leftValue, row.rightValue);
    if (min > 0) {
      const gapRatio = max / min;
      isCriticalGap = gapRatio > 2.0; // > 100% gap is CRITICAL
    } else if (max > 0 && min === 0) {
      isCriticalGap = true; // One has data, other doesn't
    }
  } else if (
    typeof row.leftValue === "boolean" &&
    typeof row.rightValue === "boolean"
  ) {
    leftWins = row.leftValue && !row.rightValue;
    rightWins = row.rightValue && !row.leftValue;
  }

  // Special handling for "migrant_worker_pct" - higher isn't necessarily better
  const isMigrantMetric = row.id === 'migrant_worker';

  const handleClick = () => {
    onMetricClick(
      row.id,
      row.metric,
      row.leftValue,
      row.rightValue,
      row.suffix || "",
      row.lowerIsBetter || false,
      pillarName,
      pillarColor
    );
  };

  return (
    <div 
      onClick={handleClick}
      className={cn(
        "grid grid-cols-3 gap-2 py-1.5 border-b border-slate-700/30 last:border-0 cursor-pointer rounded transition-colors",
        "hover:bg-slate-700/30",
        isCriticalGap && row.isHighlightMetric && "bg-red-500/10 -mx-2 px-2"
      )}
    >
      {/* Metric Name */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-400 truncate">{row.metric}</span>
        {isCriticalGap && row.isHighlightMetric && (
          <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/30 rounded text-[10px] font-semibold text-red-400 whitespace-nowrap">
            <Zap className="w-2.5 h-2.5" />
            GAP
          </span>
        )}
      </div>

      {/* Left Value */}
      <div className={cn(
        "text-center text-sm font-medium flex items-center justify-center gap-1",
        leftWins && !isMigrantMetric && "text-emerald-400",
        rightWins && !isMigrantMetric && "text-red-400",
        !leftWins && !rightWins && "text-white"
      )}>
        {formatValue(row.leftValue, row.suffix)}
        {leftWins && !isMigrantMetric && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        {rightWins && !isMigrantMetric && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>

      {/* Right Value */}
      <div className={cn(
        "text-center text-sm font-medium flex items-center justify-center gap-1",
        rightWins && !isMigrantMetric && "text-emerald-400",
        leftWins && !isMigrantMetric && "text-red-400",
        !leftWins && !rightWins && "text-white"
      )}>
        {formatValue(row.rightValue, row.suffix)}
        {rightWins && !isMigrantMetric && <TrendingUp className="w-3 h-3 text-emerald-400" />}
        {leftWins && !isMigrantMetric && <TrendingDown className="w-3 h-3 text-red-400" />}
      </div>
    </div>
  );
}

// ============================================================================
// CRITICAL GAPS SUMMARY
// ============================================================================

interface CriticalGapsSummaryProps {
  left: Country;
  right: Country;
  onGapClick: (
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

function CriticalGapsSummary({ left, right, onGapClick }: CriticalGapsSummaryProps) {
  // Calculate critical gaps
  const gaps: Array<{
    id: string;
    metric: string;
    leftValue: number;
    rightValue: number;
    leftBetter: boolean;
    gapPercent: number;
    icon: React.ReactNode;
    lowerIsBetter: boolean;
    pillarName: string;
    pillarColor: string;
  }> = [];

  // Migrant Workforce Gap (highlight metric)
  const leftMigrant = left.pillar_2_vigilance?.migrant_worker_pct;
  const rightMigrant = right.pillar_2_vigilance?.migrant_worker_pct;
  if (leftMigrant !== null && leftMigrant !== undefined && rightMigrant !== null && rightMigrant !== undefined) {
    const max = Math.max(leftMigrant, rightMigrant);
    const min = Math.min(leftMigrant, rightMigrant);
    if (min > 0) {
      const gapPercent = ((max - min) / min) * 100;
      if (gapPercent > 50) {
        gaps.push({
          id: 'migrant_worker',
          metric: 'Migrant Workforce %',
          leftValue: leftMigrant,
          rightValue: rightMigrant,
          leftBetter: false, // Not a better/worse metric
          gapPercent,
          icon: <Users className="w-5 h-5" />,
          lowerIsBetter: false,
          pillarName: 'Pillar 2: Health Vigilance',
          pillarColor: 'cyan',
        });
      }
    }
  }

  // Fatal Accident Rate Gap
  const leftFatal = left.pillar_1_hazard?.fatal_accident_rate;
  const rightFatal = right.pillar_1_hazard?.fatal_accident_rate;
  if (leftFatal !== null && leftFatal !== undefined && rightFatal !== null && rightFatal !== undefined) {
    const max = Math.max(leftFatal, rightFatal);
    const min = Math.min(leftFatal, rightFatal);
    if (min > 0) {
      const gapPercent = ((max - min) / min) * 100;
      if (gapPercent > 50) {
        gaps.push({
          id: 'fatal_rate',
          metric: 'Fatal Accident Rate',
          leftValue: leftFatal,
          rightValue: rightFatal,
          leftBetter: leftFatal < rightFatal,
          gapPercent,
          icon: <AlertTriangle className="w-5 h-5" />,
          lowerIsBetter: true,
          pillarName: 'Pillar 1: Hazard Control',
          pillarColor: 'red',
        });
      }
    }
  }

  // RTW Success Rate Gap
  const leftRTW = left.pillar_3_restoration?.return_to_work_success_pct;
  const rightRTW = right.pillar_3_restoration?.return_to_work_success_pct;
  if (leftRTW !== null && leftRTW !== undefined && rightRTW !== null && rightRTW !== undefined) {
    const max = Math.max(leftRTW, rightRTW);
    const min = Math.min(leftRTW, rightRTW);
    if (min > 0) {
      const gapPercent = ((max - min) / min) * 100;
      if (gapPercent > 50) {
        gaps.push({
          id: 'rtw_success',
          metric: 'RTW Success Rate',
          leftValue: leftRTW,
          rightValue: rightRTW,
          leftBetter: leftRTW > rightRTW,
          gapPercent,
          icon: <HeartPulse className="w-5 h-5" />,
          lowerIsBetter: false,
          pillarName: 'Pillar 3: Restoration',
          pillarColor: 'emerald',
        });
      }
    }
  }

  // OEL Compliance Gap (handle null)
  const leftOEL = left.pillar_1_hazard?.oel_compliance_pct;
  const rightOEL = right.pillar_1_hazard?.oel_compliance_pct;
  if ((leftOEL === null || leftOEL === undefined) !== (rightOEL === null || rightOEL === undefined)) {
    gaps.push({
      id: 'oel_compliance',
      metric: 'OEL Compliance Data',
      leftValue: leftOEL ?? 0,
      rightValue: rightOEL ?? 0,
      leftBetter: leftOEL !== null && leftOEL !== undefined,
      gapPercent: 100,
      icon: <AlertOctagon className="w-5 h-5" />,
      lowerIsBetter: false,
      pillarName: 'Pillar 1: Hazard Control',
      pillarColor: 'red',
    });
  }

  if (gaps.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-500/10 via-slate-900/50 to-emerald-500/10 rounded-xl border border-slate-700/50 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-yellow-400" />
        Critical Gaps Detected ({gaps.length})
      </h3>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gaps.map((gap) => (
          <div 
            key={gap.id} 
            onClick={() => onGapClick(
              gap.id, 
              gap.metric, 
              gap.leftValue, 
              gap.rightValue, 
              gap.id === 'fatal_rate' ? '/100k' : '%',
              gap.lowerIsBetter,
              gap.pillarName,
              gap.pillarColor
            )}
            className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 cursor-pointer hover:border-yellow-500/50 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="text-yellow-400">{gap.icon}</div>
              <span className="text-sm font-medium text-white">{gap.metric}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-xs text-slate-500">{left.iso_code}</p>
                <p className={cn(
                  "text-lg font-bold",
                  gap.leftValue === 0 || gap.leftValue === null ? "text-slate-500" : 
                  gap.leftBetter ? "text-emerald-400" : "text-red-400"
                )}>
                  {gap.leftValue === 0 ? 'N/A' : gap.leftValue.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{right.iso_code}</p>
                <p className={cn(
                  "text-lg font-bold",
                  gap.rightValue === 0 || gap.rightValue === null ? "text-slate-500" :
                  !gap.leftBetter ? "text-emerald-400" : "text-red-400"
                )}>
                  {gap.rightValue === 0 ? 'N/A' : gap.rightValue.toFixed(1)}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-slate-700/50 text-center">
              <span className="text-xs text-yellow-400 font-medium">
                {gap.gapPercent.toFixed(0)}% Gap
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Migrant Workforce Highlight */}
      {leftMigrant !== null && leftMigrant !== undefined && rightMigrant !== null && rightMigrant !== undefined && (
        <div 
          onClick={() => onGapClick(
            'migrant_worker',
            'Migrant Workforce %',
            leftMigrant,
            rightMigrant,
            '%',
            false,
            'Pillar 2: Health Vigilance',
            'cyan'
          )}
          className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-yellow-500/30 cursor-pointer hover:border-yellow-500/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-yellow-400" />
            <div>
              <p className="text-white font-medium">Migrant Workforce Context</p>
              <p className="text-sm text-slate-400">
                {left.name}: <span className="text-white font-medium">{leftMigrant}%</span> vs {right.name}: <span className="text-white font-medium">{rightMigrant}%</span>
                {Math.abs(leftMigrant - rightMigrant) > 50 && (
                  <span className="ml-2 text-yellow-400">— Significant demographic difference affecting health surveillance needs</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Compare;
