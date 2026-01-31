/**
 * Enhanced Country Selector for Game Setup
 * 
 * Country picker with flags, stats preview, and difficulty indicator
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Globe,
  TrendingUp,
  Users,
  Building2,
  Wallet,
  Star,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryData } from './types';

// Country flag emoji helper
function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length < 2) return '🏳️';
  const codePoints = isoCode
    .toUpperCase()
    .slice(0, 2)
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Sample countries with game-relevant data
const SAMPLE_COUNTRIES: CountryData[] = [
  // Leading
  { iso_code: 'DEU', name: 'Germany', region: 'Europe', gdp: 4072, population: 83, healthExpenditure: 12.8, laborForce: 45, formalSectorPct: 92, initialOHIScore: 3.8, initialPillars: { governance: 85, hazardControl: 82, healthVigilance: 78, restoration: 88 } },
  { iso_code: 'SWE', name: 'Sweden', region: 'Europe', gdp: 627, population: 10, healthExpenditure: 11.4, laborForce: 5.3, formalSectorPct: 95, initialOHIScore: 3.9, initialPillars: { governance: 90, hazardControl: 85, healthVigilance: 82, restoration: 85 } },
  { iso_code: 'JPN', name: 'Japan', region: 'Asia', gdp: 4231, population: 125, healthExpenditure: 11.1, laborForce: 69, formalSectorPct: 90, initialOHIScore: 3.6, initialPillars: { governance: 80, hazardControl: 85, healthVigilance: 75, restoration: 78 } },
  
  // Advancing
  { iso_code: 'USA', name: 'United States', region: 'Americas', gdp: 25462, population: 331, healthExpenditure: 18.8, laborForce: 164, formalSectorPct: 85, initialOHIScore: 3.2, initialPillars: { governance: 70, hazardControl: 75, healthVigilance: 68, restoration: 72 } },
  { iso_code: 'GBR', name: 'United Kingdom', region: 'Europe', gdp: 3070, population: 67, healthExpenditure: 12.0, laborForce: 34, formalSectorPct: 88, initialOHIScore: 3.5, initialPillars: { governance: 78, hazardControl: 80, healthVigilance: 75, restoration: 76 } },
  { iso_code: 'KOR', name: 'South Korea', region: 'Asia', gdp: 1665, population: 52, healthExpenditure: 9.3, laborForce: 28, formalSectorPct: 82, initialOHIScore: 3.1, initialPillars: { governance: 72, hazardControl: 70, healthVigilance: 68, restoration: 65 } },
  { iso_code: 'AUS', name: 'Australia', region: 'Oceania', gdp: 1675, population: 26, healthExpenditure: 10.6, laborForce: 14, formalSectorPct: 88, initialOHIScore: 3.5, initialPillars: { governance: 80, hazardControl: 78, healthVigilance: 72, restoration: 75 } },
  
  // Developing
  { iso_code: 'CHN', name: 'China', region: 'Asia', gdp: 17734, population: 1412, healthExpenditure: 7.1, laborForce: 779, formalSectorPct: 55, initialOHIScore: 2.4, initialPillars: { governance: 55, hazardControl: 50, healthVigilance: 45, restoration: 48 } },
  { iso_code: 'BRA', name: 'Brazil', region: 'Americas', gdp: 1920, population: 214, healthExpenditure: 10.3, laborForce: 107, formalSectorPct: 52, initialOHIScore: 2.2, initialPillars: { governance: 45, hazardControl: 42, healthVigilance: 40, restoration: 50 } },
  { iso_code: 'MEX', name: 'Mexico', region: 'Americas', gdp: 1414, population: 129, healthExpenditure: 6.2, laborForce: 59, formalSectorPct: 44, initialOHIScore: 2.1, initialPillars: { governance: 40, hazardControl: 42, healthVigilance: 38, restoration: 45 } },
  { iso_code: 'IND', name: 'India', region: 'Asia', gdp: 3385, population: 1417, healthExpenditure: 3.5, laborForce: 501, formalSectorPct: 20, initialOHIScore: 2.0, initialPillars: { governance: 38, hazardControl: 35, healthVigilance: 40, restoration: 42 } },
  { iso_code: 'ZAF', name: 'South Africa', region: 'Africa', gdp: 405, population: 60, healthExpenditure: 9.1, laborForce: 23, formalSectorPct: 55, initialOHIScore: 2.1, initialPillars: { governance: 45, hazardControl: 40, healthVigilance: 38, restoration: 40 } },
  
  // Critical
  { iso_code: 'NGA', name: 'Nigeria', region: 'Africa', gdp: 477, population: 218, healthExpenditure: 3.0, laborForce: 70, formalSectorPct: 15, initialOHIScore: 1.5, initialPillars: { governance: 25, hazardControl: 22, healthVigilance: 20, restoration: 25 } },
  { iso_code: 'BGD', name: 'Bangladesh', region: 'Asia', gdp: 460, population: 171, healthExpenditure: 2.6, laborForce: 73, formalSectorPct: 15, initialOHIScore: 1.5, initialPillars: { governance: 28, hazardControl: 25, healthVigilance: 22, restoration: 28 } },
  { iso_code: 'PAK', name: 'Pakistan', region: 'Asia', gdp: 376, population: 231, healthExpenditure: 3.4, laborForce: 74, formalSectorPct: 25, initialOHIScore: 1.6, initialPillars: { governance: 30, hazardControl: 28, healthVigilance: 25, restoration: 30 } },
  { iso_code: 'ETH', name: 'Ethiopia', region: 'Africa', gdp: 126, population: 120, healthExpenditure: 3.5, laborForce: 55, formalSectorPct: 10, initialOHIScore: 1.3, initialPillars: { governance: 20, hazardControl: 18, healthVigilance: 15, restoration: 20 } },
  
  // More countries for variety
  { iso_code: 'SAU', name: 'Saudi Arabia', region: 'Asia', gdp: 1108, population: 35, healthExpenditure: 7.6, laborForce: 15, formalSectorPct: 75, initialOHIScore: 2.3, initialPillars: { governance: 50, hazardControl: 48, healthVigilance: 42, restoration: 45 } },
  { iso_code: 'ARE', name: 'UAE', region: 'Asia', gdp: 507, population: 10, healthExpenditure: 5.5, laborForce: 6, formalSectorPct: 80, initialOHIScore: 2.8, initialPillars: { governance: 62, hazardControl: 58, healthVigilance: 55, restoration: 60 } },
  { iso_code: 'SGP', name: 'Singapore', region: 'Asia', gdp: 424, population: 6, healthExpenditure: 6.1, laborForce: 3.6, formalSectorPct: 95, initialOHIScore: 3.4, initialPillars: { governance: 78, hazardControl: 75, healthVigilance: 70, restoration: 72 } },
  { iso_code: 'THA', name: 'Thailand', region: 'Asia', gdp: 536, population: 70, healthExpenditure: 5.2, laborForce: 39, formalSectorPct: 42, initialOHIScore: 2.3, initialPillars: { governance: 48, hazardControl: 45, healthVigilance: 42, restoration: 48 } },
];

interface CountrySelectorProps {
  onSelect: (country: CountryData) => void;
  selectedCountry?: CountryData | null;
  className?: string;
}

export function CountrySelector({
  onSelect,
  selectedCountry,
  className,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return SAMPLE_COUNTRIES;
    const query = searchQuery.toLowerCase();
    return SAMPLE_COUNTRIES.filter(
      c => c.name.toLowerCase().includes(query) || 
           c.iso_code.toLowerCase().includes(query) ||
           c.region.toLowerCase().includes(query)
    );
  }, [searchQuery]);
  
  // Group by region
  const groupedCountries = useMemo(() => {
    const groups: Record<string, CountryData[]> = {};
    for (const country of filteredCountries) {
      if (!groups[country.region]) groups[country.region] = [];
      groups[country.region].push(country);
    }
    return groups;
  }, [filteredCountries]);
  
  const getDifficultyLabel = (score: number) => {
    if (score >= 3.5) return { label: 'Easy', color: 'text-emerald-400' };
    if (score >= 2.5) return { label: 'Medium', color: 'text-amber-400' };
    if (score >= 2.0) return { label: 'Hard', color: 'text-orange-400' };
    return { label: 'Expert', color: 'text-red-400' };
  };
  
  const previewCountry = hoveredCountry || selectedCountry;
  
  return (
    <div className={cn('relative', className)}>
      {/* Selector Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between gap-3 px-4 py-3',
          'bg-white/5 border border-white/10 rounded-xl',
          'text-left transition-all duration-200',
          'hover:border-adl-accent/50 focus:outline-none focus:ring-2 focus:ring-adl-accent/30',
          isOpen && 'border-adl-accent/50 ring-2 ring-adl-accent/30'
        )}
      >
        <div className="flex items-center gap-3">
          {selectedCountry ? (
            <>
              <span className="text-3xl">{getCountryFlag(selectedCountry.iso_code)}</span>
              <div>
                <p className="text-white font-semibold">{selectedCountry.name}</p>
                <p className="text-xs text-white/40">{selectedCountry.region}</p>
              </div>
            </>
          ) : (
            <>
              <Globe className="w-6 h-6 text-adl-accent" />
              <span className="text-white/60">Select a country to lead...</span>
            </>
          )}
        </div>
        <ChevronDown className={cn(
          'w-5 h-5 text-white/40 transition-transform',
          isOpen && 'rotate-180'
        )} />
      </motion.button>
      
      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Search */}
            <div className="p-3 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  placeholder="Search countries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-adl-accent/50"
                  autoFocus
                />
              </div>
            </div>
            
            <div className="flex">
              {/* Country List */}
              <div className="flex-1 max-h-80 overflow-y-auto">
                {Object.entries(groupedCountries).map(([region, countries]) => (
                  <div key={region}>
                    <div className="px-3 py-2 bg-white/5 text-xs text-white/40 font-medium uppercase tracking-wider">
                      {region}
                    </div>
                    {countries.map((country) => {
                      const difficulty = getDifficultyLabel(country.initialOHIScore);
                      const isSelected = selectedCountry?.iso_code === country.iso_code;
                      
                      return (
                        <button
                          key={country.iso_code}
                          onClick={() => {
                            onSelect(country);
                            setIsOpen(false);
                          }}
                          onMouseEnter={() => setHoveredCountry(country)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                            'hover:bg-white/5',
                            isSelected && 'bg-adl-accent/10'
                          )}
                        >
                          <span className="text-2xl">{getCountryFlag(country.iso_code)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{country.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-adl-accent font-mono">
                                {country.initialOHIScore.toFixed(1)}
                              </span>
                              <span className={cn('text-xs', difficulty.color)}>
                                {difficulty.label}
                              </span>
                            </div>
                          </div>
                          <Star className={cn(
                            'w-4 h-4',
                            country.initialOHIScore >= 3.5 ? 'text-emerald-400' :
                            country.initialOHIScore >= 2.5 ? 'text-amber-400' :
                            country.initialOHIScore >= 2.0 ? 'text-orange-400' :
                            'text-red-400'
                          )} />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              
              {/* Preview Panel */}
              {previewCountry && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="w-64 p-4 bg-white/5 border-l border-white/10"
                >
                  <div className="text-center mb-4">
                    <span className="text-5xl">{getCountryFlag(previewCountry.iso_code)}</span>
                    <h3 className="text-lg font-bold text-white mt-2">{previewCountry.name}</h3>
                    <p className="text-xs text-white/40">{previewCountry.region}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <StatRow
                      icon={TrendingUp}
                      label="Starting Score"
                      value={previewCountry.initialOHIScore.toFixed(1)}
                      color="adl-accent"
                    />
                    <StatRow
                      icon={Users}
                      label="Labor Force"
                      value={`${previewCountry.laborForce}M`}
                      color="white/60"
                    />
                    <StatRow
                      icon={Building2}
                      label="Formal Sector"
                      value={`${previewCountry.formalSectorPct}%`}
                      color="white/60"
                    />
                    <StatRow
                      icon={Wallet}
                      label="GDP"
                      value={`$${previewCountry.gdp}B`}
                      color="white/60"
                    />
                  </div>
                  
                  {/* Pillar Preview */}
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-2">Starting Pillars</p>
                    <div className="grid grid-cols-2 gap-2">
                      <PillarPreview label="Gov" value={previewCountry.initialPillars.governance} color="purple" />
                      <PillarPreview label="Haz" value={previewCountry.initialPillars.hazardControl} color="blue" />
                      <PillarPreview label="Vig" value={previewCountry.initialPillars.healthVigilance} color="teal" />
                      <PillarPreview label="Res" value={previewCountry.initialPillars.restoration} color="amber" />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof TrendingUp;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-white/30" />
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <span className={cn('text-sm font-medium', `text-${color}`)}>{value}</span>
    </div>
  );
}

function PillarPreview({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'purple' | 'blue' | 'teal' | 'amber';
}) {
  const colorClasses = {
    purple: 'bg-purple-500/20 text-purple-400',
    blue: 'bg-blue-500/20 text-blue-400',
    teal: 'bg-teal-500/20 text-teal-400',
    amber: 'bg-amber-500/20 text-amber-400',
  };
  
  return (
    <div className={cn('rounded p-1.5 text-center', colorClasses[color].split(' ')[0])}>
      <p className={cn('text-sm font-bold', colorClasses[color].split(' ')[1])}>
        {Math.round(value)}
      </p>
      <p className="text-[9px] text-white/40">{label}</p>
    </div>
  );
}

export { SAMPLE_COUNTRIES };
export default CountrySelector;
