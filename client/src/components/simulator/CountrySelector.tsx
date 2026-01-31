/**
 * Country Selector Component
 * 
 * Enhanced country picker with flags and initial stats
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  Globe2,
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Check,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryData } from './types';
import { MATURITY_STAGES } from './types';

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

// Sample country data for the game
// In production, this would come from the API
export const SAMPLE_COUNTRIES: CountryData[] = [
  { iso_code: 'DEU', name: 'Germany', region: 'Europe', gdp: 4259, population: 83.2, healthExpenditure: 12.8, laborForce: 45.3, formalSectorPct: 92, initialOHIScore: 3.8, initialPillars: { governance: 85, hazardControl: 82, healthVigilance: 78, restoration: 88 } },
  { iso_code: 'GBR', name: 'United Kingdom', region: 'Europe', gdp: 3187, population: 67.5, healthExpenditure: 12.0, laborForce: 33.7, formalSectorPct: 88, initialOHIScore: 3.5, initialPillars: { governance: 78, hazardControl: 75, healthVigilance: 72, restoration: 80 } },
  { iso_code: 'USA', name: 'United States', region: 'Americas', gdp: 25464, population: 333.3, healthExpenditure: 18.3, laborForce: 164.0, formalSectorPct: 85, initialOHIScore: 3.2, initialPillars: { governance: 70, hazardControl: 72, healthVigilance: 68, restoration: 75 } },
  { iso_code: 'JPN', name: 'Japan', region: 'Asia', gdp: 4231, population: 125.1, healthExpenditure: 11.1, laborForce: 68.6, formalSectorPct: 90, initialOHIScore: 3.6, initialPillars: { governance: 82, hazardControl: 80, healthVigilance: 75, restoration: 78 } },
  { iso_code: 'SGP', name: 'Singapore', region: 'Asia', gdp: 397, population: 5.5, healthExpenditure: 6.1, laborForce: 3.6, formalSectorPct: 95, initialOHIScore: 3.4, initialPillars: { governance: 88, hazardControl: 70, healthVigilance: 72, restoration: 68 } },
  { iso_code: 'AUS', name: 'Australia', region: 'Oceania', gdp: 1693, population: 26.0, healthExpenditure: 10.7, laborForce: 14.0, formalSectorPct: 88, initialOHIScore: 3.5, initialPillars: { governance: 80, hazardControl: 76, healthVigilance: 74, restoration: 78 } },
  { iso_code: 'BRA', name: 'Brazil', region: 'Americas', gdp: 1920, population: 215.3, healthExpenditure: 10.3, laborForce: 107.4, formalSectorPct: 55, initialOHIScore: 2.2, initialPillars: { governance: 45, hazardControl: 40, healthVigilance: 42, restoration: 48 } },
  { iso_code: 'IND', name: 'India', region: 'Asia', gdp: 3385, population: 1428.6, healthExpenditure: 3.3, laborForce: 501.0, formalSectorPct: 20, initialOHIScore: 2.0, initialPillars: { governance: 38, hazardControl: 35, healthVigilance: 40, restoration: 35 } },
  { iso_code: 'CHN', name: 'China', region: 'Asia', gdp: 17963, population: 1425.9, healthExpenditure: 7.1, laborForce: 779.0, formalSectorPct: 45, initialOHIScore: 2.4, initialPillars: { governance: 50, hazardControl: 48, healthVigilance: 52, restoration: 45 } },
  { iso_code: 'SAU', name: 'Saudi Arabia', region: 'Asia', gdp: 1108, population: 36.4, healthExpenditure: 7.5, laborForce: 15.8, formalSectorPct: 75, initialOHIScore: 2.3, initialPillars: { governance: 55, hazardControl: 42, healthVigilance: 45, restoration: 40 } },
  { iso_code: 'ZAF', name: 'South Africa', region: 'Africa', gdp: 405, population: 60.4, healthExpenditure: 9.1, laborForce: 24.1, formalSectorPct: 55, initialOHIScore: 2.1, initialPillars: { governance: 42, hazardControl: 38, healthVigilance: 45, restoration: 40 } },
  { iso_code: 'NGA', name: 'Nigeria', region: 'Africa', gdp: 477, population: 223.8, healthExpenditure: 3.0, laborForce: 65.1, formalSectorPct: 15, initialOHIScore: 1.5, initialPillars: { governance: 25, hazardControl: 22, healthVigilance: 28, restoration: 20 } },
  { iso_code: 'MEX', name: 'Mexico', region: 'Americas', gdp: 1414, population: 128.9, healthExpenditure: 5.4, laborForce: 59.3, formalSectorPct: 45, initialOHIScore: 2.1, initialPillars: { governance: 40, hazardControl: 42, healthVigilance: 38, restoration: 45 } },
  { iso_code: 'IDN', name: 'Indonesia', region: 'Asia', gdp: 1319, population: 277.5, healthExpenditure: 3.0, laborForce: 139.0, formalSectorPct: 40, initialOHIScore: 1.9, initialPillars: { governance: 35, hazardControl: 32, healthVigilance: 38, restoration: 30 } },
  { iso_code: 'TUR', name: 'Turkey', region: 'Europe', gdp: 906, population: 85.3, healthExpenditure: 5.0, laborForce: 33.5, formalSectorPct: 55, initialOHIScore: 2.4, initialPillars: { governance: 50, hazardControl: 45, healthVigilance: 48, restoration: 52 } },
  { iso_code: 'POL', name: 'Poland', region: 'Europe', gdp: 688, population: 37.8, healthExpenditure: 6.5, laborForce: 18.4, formalSectorPct: 78, initialOHIScore: 2.5, initialPillars: { governance: 55, hazardControl: 52, healthVigilance: 50, restoration: 58 } },
];

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
  showStats = true,
}: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  
  const filteredCountries = useMemo(() => {
    if (!searchQuery) return countries;
    const query = searchQuery.toLowerCase();
    return countries.filter(
      c => c.name.toLowerCase().includes(query) || 
           c.iso_code.toLowerCase().includes(query) ||
           c.region.toLowerCase().includes(query)
    );
  }, [countries, searchQuery]);
  
  const groupedCountries = useMemo(() => {
    const groups: Record<string, CountryData[]> = {};
    filteredCountries.forEach(country => {
      if (!groups[country.region]) {
        groups[country.region] = [];
      }
      groups[country.region].push(country);
    });
    return groups;
  }, [filteredCountries]);
  
  const previewCountry = hoveredCountry || selectedCountry;
  
  return (
    <div className="space-y-4">
      {/* Dropdown Trigger */}
      <div className="relative">
        <button
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-between gap-3 px-4 py-3',
            'bg-slate-800/80 border border-slate-600/50 rounded-xl',
            'text-left transition-all duration-200',
            'hover:border-adl-accent/50 focus:outline-none focus:ring-2 focus:ring-adl-accent/30',
            isOpen && 'border-adl-accent/50 ring-2 ring-adl-accent/30',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center gap-3">
            {selectedCountry ? (
              <>
                <span className="text-3xl">{getCountryFlag(selectedCountry.iso_code)}</span>
                <div>
                  <p className="text-white font-medium">{selectedCountry.name}</p>
                  <p className="text-xs text-slate-400">{selectedCountry.region}</p>
                </div>
              </>
            ) : (
              <>
                <Globe2 className="w-6 h-6 text-slate-400" />
                <span className="text-slate-400">Select your country...</span>
              </>
            )}
          </div>
          <ChevronDown className={cn('w-5 h-5 text-slate-400 transition-transform', isOpen && 'rotate-180')} />
        </button>
        
        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600/50 rounded-xl shadow-2xl overflow-hidden"
            >
              {/* Search */}
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
              
              {/* Country List */}
              <div className="max-h-64 overflow-y-auto">
                {Object.entries(groupedCountries).map(([region, countries]) => (
                  <div key={region}>
                    <div className="px-4 py-2 bg-slate-900/50 text-xs text-slate-400 font-semibold uppercase tracking-wider">
                      {region}
                    </div>
                    {countries.map(country => {
                      const stage = MATURITY_STAGES.find(
                        s => country.initialOHIScore >= s.minScore && country.initialOHIScore <= s.maxScore
                      );
                      
                      return (
                        <button
                          key={country.iso_code}
                          onClick={() => {
                            onSelect(country);
                            setIsOpen(false);
                            setSearchQuery('');
                          }}
                          onMouseEnter={() => setHoveredCountry(country)}
                          onMouseLeave={() => setHoveredCountry(null)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                            'hover:bg-slate-700/50',
                            selectedCountry?.iso_code === country.iso_code && 'bg-adl-accent/20'
                          )}
                        >
                          <span className="text-2xl">{getCountryFlag(country.iso_code)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{country.name}</p>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                              <span>GDP: ${country.gdp}B</span>
                              <span>•</span>
                              <span>{country.population}M pop</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'text-sm font-mono font-medium',
                              stage?.color === 'emerald' ? 'text-emerald-400' :
                              stage?.color === 'yellow' ? 'text-yellow-400' :
                              stage?.color === 'orange' ? 'text-orange-400' :
                              'text-red-400'
                            )}>
                              {country.initialOHIScore.toFixed(1)}
                            </p>
                            <p className="text-[10px] text-slate-500">{stage?.label}</p>
                          </div>
                          {selectedCountry?.iso_code === country.iso_code && (
                            <Check className="w-4 h-4 text-adl-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Country Preview Stats */}
      {showStats && previewCountry && (
        <motion.div
          key={previewCountry.iso_code}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-xl p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">{getCountryFlag(previewCountry.iso_code)}</span>
            <div>
              <h3 className="text-lg font-semibold text-white">{previewCountry.name}</h3>
              <p className="text-sm text-white/40">{previewCountry.region}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <StatBox
              icon={DollarSign}
              label="GDP"
              value={`$${previewCountry.gdp}B`}
              color="text-emerald-400"
            />
            <StatBox
              icon={Users}
              label="Population"
              value={`${previewCountry.population}M`}
              color="text-blue-400"
            />
            <StatBox
              icon={TrendingUp}
              label="Health Spend"
              value={`${previewCountry.healthExpenditure}% GDP`}
              color="text-purple-400"
            />
            <StatBox
              icon={MapPin}
              label="Formal Sector"
              value={`${previewCountry.formalSectorPct}%`}
              color="text-amber-400"
            />
          </div>
          
          {/* Initial Pillar Scores */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-white/40 mb-2">Starting Pillar Scores</p>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(previewCountry.initialPillars).map(([key, value]) => (
                <div key={key} className="text-center">
                  <div className="text-sm font-bold text-white">{value}</div>
                  <div className="text-[10px] text-white/40 capitalize">
                    {key === 'hazardControl' ? 'Hazard' : 
                     key === 'healthVigilance' ? 'Vigil' : 
                     key === 'restoration' ? 'Resto' : 'Gov'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof DollarSign;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn('w-3 h-3', color)} />
        <span className="text-[10px] text-white/40">{label}</span>
      </div>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default CountrySelector;
