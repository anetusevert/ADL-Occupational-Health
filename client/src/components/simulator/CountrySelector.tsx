/**
 * Country Selector Component
 * 
 * Compact country picker with region tabs and flags
 */

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryData } from './types';
import { MATURITY_STAGES } from './types';

// Country flag helper - handles 3-letter ISO codes
function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length < 2) return '🏳️';
  const code = isoCode.toUpperCase().slice(0, 2);
  const codePoints = code.split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Sample country data
export const SAMPLE_COUNTRIES: CountryData[] = [
  { iso_code: 'DEU', name: 'Germany', region: 'Europe', gdp: 4259, population: 83.2, healthExpenditure: 12.8, laborForce: 45.3, formalSectorPct: 92, initialOHIScore: 3.8, initialPillars: { governance: 85, hazardControl: 82, healthVigilance: 78, restoration: 88 } },
  { iso_code: 'GBR', name: 'United Kingdom', region: 'Europe', gdp: 3187, population: 67.5, healthExpenditure: 12.0, laborForce: 33.7, formalSectorPct: 88, initialOHIScore: 3.5, initialPillars: { governance: 78, hazardControl: 75, healthVigilance: 72, restoration: 80 } },
  { iso_code: 'FRA', name: 'France', region: 'Europe', gdp: 2937, population: 67.8, healthExpenditure: 12.2, laborForce: 30.2, formalSectorPct: 85, initialOHIScore: 3.3, initialPillars: { governance: 72, hazardControl: 70, healthVigilance: 68, restoration: 75 } },
  { iso_code: 'TUR', name: 'Turkey', region: 'Europe', gdp: 906, population: 85.3, healthExpenditure: 5.0, laborForce: 33.5, formalSectorPct: 55, initialOHIScore: 2.4, initialPillars: { governance: 50, hazardControl: 45, healthVigilance: 48, restoration: 52 } },
  { iso_code: 'POL', name: 'Poland', region: 'Europe', gdp: 688, population: 37.8, healthExpenditure: 6.5, laborForce: 18.4, formalSectorPct: 78, initialOHIScore: 2.8, initialPillars: { governance: 60, hazardControl: 58, healthVigilance: 55, restoration: 62 } },
  { iso_code: 'USA', name: 'United States', region: 'Americas', gdp: 25464, population: 333.3, healthExpenditure: 18.3, laborForce: 164.0, formalSectorPct: 85, initialOHIScore: 3.2, initialPillars: { governance: 70, hazardControl: 72, healthVigilance: 68, restoration: 75 } },
  { iso_code: 'CAN', name: 'Canada', region: 'Americas', gdp: 2117, population: 40.1, healthExpenditure: 12.2, laborForce: 20.8, formalSectorPct: 88, initialOHIScore: 3.4, initialPillars: { governance: 75, hazardControl: 72, healthVigilance: 70, restoration: 78 } },
  { iso_code: 'BRA', name: 'Brazil', region: 'Americas', gdp: 1920, population: 215.3, healthExpenditure: 10.3, laborForce: 107.4, formalSectorPct: 55, initialOHIScore: 2.2, initialPillars: { governance: 45, hazardControl: 40, healthVigilance: 42, restoration: 48 } },
  { iso_code: 'MEX', name: 'Mexico', region: 'Americas', gdp: 1414, population: 128.9, healthExpenditure: 5.4, laborForce: 59.3, formalSectorPct: 45, initialOHIScore: 2.1, initialPillars: { governance: 40, hazardControl: 42, healthVigilance: 38, restoration: 45 } },
  { iso_code: 'JPN', name: 'Japan', region: 'Asia', gdp: 4231, population: 125.1, healthExpenditure: 11.1, laborForce: 68.6, formalSectorPct: 90, initialOHIScore: 3.6, initialPillars: { governance: 82, hazardControl: 80, healthVigilance: 75, restoration: 78 } },
  { iso_code: 'CHN', name: 'China', region: 'Asia', gdp: 17963, population: 1425.9, healthExpenditure: 7.1, laborForce: 779.0, formalSectorPct: 45, initialOHIScore: 2.4, initialPillars: { governance: 50, hazardControl: 48, healthVigilance: 52, restoration: 45 } },
  { iso_code: 'IND', name: 'India', region: 'Asia', gdp: 3385, population: 1428.6, healthExpenditure: 3.3, laborForce: 501.0, formalSectorPct: 20, initialOHIScore: 2.0, initialPillars: { governance: 38, hazardControl: 35, healthVigilance: 40, restoration: 35 } },
  { iso_code: 'SGP', name: 'Singapore', region: 'Asia', gdp: 397, population: 5.5, healthExpenditure: 6.1, laborForce: 3.6, formalSectorPct: 95, initialOHIScore: 3.4, initialPillars: { governance: 88, hazardControl: 70, healthVigilance: 72, restoration: 68 } },
  { iso_code: 'SAU', name: 'Saudi Arabia', region: 'Asia', gdp: 1108, population: 36.4, healthExpenditure: 7.5, laborForce: 15.8, formalSectorPct: 75, initialOHIScore: 2.3, initialPillars: { governance: 55, hazardControl: 42, healthVigilance: 45, restoration: 40 } },
  { iso_code: 'IDN', name: 'Indonesia', region: 'Asia', gdp: 1319, population: 277.5, healthExpenditure: 3.0, laborForce: 139.0, formalSectorPct: 40, initialOHIScore: 1.9, initialPillars: { governance: 35, hazardControl: 32, healthVigilance: 38, restoration: 30 } },
  { iso_code: 'AUS', name: 'Australia', region: 'Oceania', gdp: 1693, population: 26.0, healthExpenditure: 10.7, laborForce: 14.0, formalSectorPct: 88, initialOHIScore: 3.5, initialPillars: { governance: 80, hazardControl: 76, healthVigilance: 74, restoration: 78 } },
  { iso_code: 'NZL', name: 'New Zealand', region: 'Oceania', gdp: 252, population: 5.1, healthExpenditure: 9.7, laborForce: 2.9, formalSectorPct: 85, initialOHIScore: 3.3, initialPillars: { governance: 75, hazardControl: 72, healthVigilance: 70, restoration: 74 } },
  { iso_code: 'ZAF', name: 'South Africa', region: 'Africa', gdp: 405, population: 60.4, healthExpenditure: 9.1, laborForce: 24.1, formalSectorPct: 55, initialOHIScore: 2.1, initialPillars: { governance: 42, hazardControl: 38, healthVigilance: 45, restoration: 40 } },
  { iso_code: 'NGA', name: 'Nigeria', region: 'Africa', gdp: 477, population: 223.8, healthExpenditure: 3.0, laborForce: 65.1, formalSectorPct: 15, initialOHIScore: 1.5, initialPillars: { governance: 25, hazardControl: 22, healthVigilance: 28, restoration: 20 } },
  { iso_code: 'EGY', name: 'Egypt', region: 'Africa', gdp: 476, population: 110.9, healthExpenditure: 4.7, laborForce: 32.2, formalSectorPct: 45, initialOHIScore: 2.0, initialPillars: { governance: 38, hazardControl: 35, healthVigilance: 40, restoration: 35 } },
];

const REGIONS = ['All', 'Europe', 'Americas', 'Asia', 'Africa', 'Oceania'];

interface CountrySelectorProps {
  countries?: CountryData[];
  selectedCountry: CountryData | null;
  onSelect: (country: CountryData) => void;
  disabled?: boolean;
  showStats?: boolean;
}

export function CountrySelector({
  countries = SAMPLE_COUNTRIES,
  selectedCountry,
  onSelect,
  disabled = false,
  showStats = false,
}: CountrySelectorProps) {
  const [activeRegion, setActiveRegion] = useState('All');
  const [scrollOffset, setScrollOffset] = useState(0);

  const filteredCountries = useMemo(() => {
    if (activeRegion === 'All') return countries;
    return countries.filter(c => c.region === activeRegion);
  }, [countries, activeRegion]);

  // Calculate visible countries based on scroll
  const visibleCountries = filteredCountries.slice(scrollOffset, scrollOffset + 6);
  const canScrollLeft = scrollOffset > 0;
  const canScrollRight = scrollOffset + 6 < filteredCountries.length;

  const scrollLeft = () => setScrollOffset(Math.max(0, scrollOffset - 3));
  const scrollRight = () => setScrollOffset(Math.min(filteredCountries.length - 6, scrollOffset + 3));

  // Reset scroll when region changes
  const handleRegionChange = (region: string) => {
    setActiveRegion(region);
    setScrollOffset(0);
  };

  return (
    <div className="space-y-3">
      {/* Region Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {REGIONS.map(region => (
          <button
            key={region}
            onClick={() => handleRegionChange(region)}
            disabled={disabled}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all',
              activeRegion === region
                ? 'bg-adl-accent text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            )}
          >
            {region}
          </button>
        ))}
      </div>

      {/* Country Grid with Navigation */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 z-10 w-6 h-6 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Country Cards */}
        <div className="grid grid-cols-3 gap-2">
          {visibleCountries.map(country => {
            const stage = MATURITY_STAGES.find(
              s => country.initialOHIScore >= s.minScore && country.initialOHIScore <= s.maxScore
            );
            const isSelected = selectedCountry?.iso_code === country.iso_code;

            return (
              <motion.button
                key={country.iso_code}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !disabled && onSelect(country)}
                disabled={disabled}
                className={cn(
                  'relative p-2 rounded-lg border text-left transition-all',
                  isSelected
                    ? 'bg-adl-accent/20 border-adl-accent/50 ring-1 ring-adl-accent/30'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                )}
              >
                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute top-1 right-1">
                    <Check className="w-3 h-3 text-adl-accent" />
                  </div>
                )}

                {/* Flag */}
                <div className="text-2xl mb-1">{getCountryFlag(country.iso_code)}</div>

                {/* Country Info */}
                <p className="text-xs font-medium text-white truncate">{country.name}</p>

                {/* Score */}
                <div className="flex items-center gap-1 mt-1">
                  <span className={cn(
                    'text-xs font-bold',
                    stage?.color === 'emerald' ? 'text-emerald-400' :
                    stage?.color === 'yellow' ? 'text-yellow-400' :
                    stage?.color === 'orange' ? 'text-orange-400' :
                    'text-red-400'
                  )}>
                    {country.initialOHIScore.toFixed(1)}
                  </span>
                  <span className="text-[9px] text-white/30">{stage?.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 z-10 w-6 h-6 bg-slate-800 border border-white/20 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Count Indicator */}
      <div className="flex items-center justify-center gap-1">
        {Array.from({ length: Math.ceil(filteredCountries.length / 6) }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-colors',
              Math.floor(scrollOffset / 6) === i ? 'bg-adl-accent' : 'bg-white/20'
            )}
          />
        ))}
      </div>
    </div>
  );
}

export default CountrySelector;
