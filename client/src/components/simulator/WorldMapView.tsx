/**
 * World Map View Component
 * 
 * Global comparison map showing OHI scores across countries
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, Locate, Globe } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryRanking } from './types';
import { MATURITY_STAGES } from './types';

// Country flag emoji helper
function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length < 2) return '';
  const codePoints = isoCode
    .toUpperCase()
    .slice(0, 2)
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface WorldMapViewProps {
  rankings: CountryRanking[];
  playerIso: string;
  onClose: () => void;
}

export function WorldMapView({
  rankings,
  playerIso,
  onClose,
}: WorldMapViewProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // Group rankings by region (simplified)
  const regionGroups = useMemo(() => {
    const regions: Record<string, CountryRanking[]> = {
      'Europe': [],
      'Asia': [],
      'Americas': [],
      'Africa': [],
      'Oceania': [],
    };
    
    // Simple region mapping based on ISO codes
    const regionMap: Record<string, string> = {
      'DEU': 'Europe', 'FRA': 'Europe', 'GBR': 'Europe', 'ITA': 'Europe', 'ESP': 'Europe',
      'NLD': 'Europe', 'SWE': 'Europe', 'NOR': 'Europe', 'DNK': 'Europe', 'FIN': 'Europe',
      'CHE': 'Europe', 'AUT': 'Europe', 'BEL': 'Europe', 'POL': 'Europe', 'PRT': 'Europe',
      'GRC': 'Europe', 'CZE': 'Europe', 'IRL': 'Europe', 'RUS': 'Europe',
      'USA': 'Americas', 'CAN': 'Americas', 'MEX': 'Americas', 'BRA': 'Americas',
      'ARG': 'Americas', 'COL': 'Americas', 'CHL': 'Americas', 'PER': 'Americas',
      'CHN': 'Asia', 'JPN': 'Asia', 'KOR': 'Asia', 'IND': 'Asia', 'SGP': 'Asia',
      'THA': 'Asia', 'MYS': 'Asia', 'IDN': 'Asia', 'VNM': 'Asia', 'PHL': 'Asia',
      'PAK': 'Asia', 'BGD': 'Asia', 'SAU': 'Asia', 'ARE': 'Asia', 'TUR': 'Asia',
      'AUS': 'Oceania', 'NZL': 'Oceania',
      'ZAF': 'Africa', 'NGA': 'Africa', 'EGY': 'Africa', 'KEN': 'Africa', 'ETH': 'Africa',
      'GHA': 'Africa', 'MAR': 'Africa',
    };
    
    for (const r of rankings) {
      const region = regionMap[r.iso_code] || 'Other';
      if (regions[region]) {
        regions[region].push(r);
      }
    }
    
    // Sort each region by score
    for (const region of Object.keys(regions)) {
      regions[region].sort((a, b) => b.currentScore - a.currentScore);
    }
    
    return regions;
  }, [rankings]);
  
  // Get color for score
  const getScoreColor = (score: number) => {
    if (score >= 3.5) return 'text-emerald-400 bg-emerald-500/20';
    if (score >= 2.5) return 'text-yellow-400 bg-yellow-500/20';
    if (score >= 2.0) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
  };
  
  const filteredRankings = selectedRegion 
    ? regionGroups[selectedRegion] || []
    : rankings.slice().sort((a, b) => b.currentScore - a.currentScore);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between border-b border-white/10 bg-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-adl-accent/20 rounded-xl flex items-center justify-center">
            <Globe className="w-5 h-5 text-adl-accent" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Global OHI Rankings</h2>
            <p className="text-sm text-white/50">
              {rankings.length} countries • Your rank: #{rankings.find(r => r.isPlayer)?.currentRank || '-'}
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </div>
      
      {/* Main Content */}
      <div className="pt-20 pb-4 h-full overflow-hidden flex">
        {/* Region Selector */}
        <div className="w-48 p-4 border-r border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Regions</p>
          
          <button
            onClick={() => setSelectedRegion(null)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors',
              !selectedRegion 
                ? 'bg-adl-accent/20 text-adl-accent' 
                : 'text-white/60 hover:bg-white/5'
            )}
          >
            All Countries
          </button>
          
          {Object.entries(regionGroups).map(([region, countries]) => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors flex items-center justify-between',
                selectedRegion === region 
                  ? 'bg-adl-accent/20 text-adl-accent' 
                  : 'text-white/60 hover:bg-white/5'
              )}
            >
              <span>{region}</span>
              <span className="text-xs text-white/30">{countries.length}</span>
            </button>
          ))}
        </div>
        
        {/* Rankings Grid */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredRankings.map((country, index) => {
              const isPlayer = country.iso_code === playerIso;
              
              return (
                <motion.div
                  key={country.iso_code}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className={cn(
                    'p-4 rounded-xl border transition-all',
                    isPlayer 
                      ? 'bg-adl-accent/10 border-adl-accent/30 ring-1 ring-adl-accent/20' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{getCountryFlag(country.iso_code)}</span>
                      <div>
                        <p className={cn(
                          'font-medium text-sm truncate max-w-[100px]',
                          isPlayer ? 'text-white' : 'text-white/80'
                        )}>
                          {country.name}
                        </p>
                        {isPlayer && (
                          <span className="text-[10px] text-adl-accent">Your Country</span>
                        )}
                      </div>
                    </div>
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold',
                      country.currentRank <= 3 
                        ? 'bg-amber-500/20 text-amber-400' 
                        : 'bg-white/10 text-white/60'
                    )}>
                      #{country.currentRank}
                    </div>
                  </div>
                  
                  <div className={cn(
                    'text-center py-2 rounded-lg',
                    getScoreColor(country.currentScore)
                  )}>
                    <span className="text-lg font-bold">
                      {country.currentScore.toFixed(2)}
                    </span>
                    <span className="text-xs ml-1 opacity-60">OHI</span>
                  </div>
                  
                  {country.rankDelta !== 0 && (
                    <div className={cn(
                      'mt-2 text-center text-xs font-medium',
                      country.rankDelta > 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {country.rankDelta > 0 ? 'Up' : 'Down'} {Math.abs(country.rankDelta)} positions
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Legend Sidebar */}
        <div className="w-56 p-4 border-l border-white/10">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Score Legend</p>
          
          {MATURITY_STAGES.slice().reverse().map(stage => (
            <div 
              key={stage.stage}
              className={cn(
                'p-3 rounded-lg mb-2',
                stage.color === 'emerald' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                stage.color === 'yellow' ? 'bg-yellow-500/10 border border-yellow-500/20' :
                stage.color === 'orange' ? 'bg-orange-500/10 border border-orange-500/20' :
                'bg-red-500/10 border border-red-500/20'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  'font-semibold text-sm',
                  stage.color === 'emerald' ? 'text-emerald-400' :
                  stage.color === 'yellow' ? 'text-yellow-400' :
                  stage.color === 'orange' ? 'text-orange-400' :
                  'text-red-400'
                )}>
                  {stage.label}
                </span>
                <span className="text-xs text-white/40">
                  {stage.minScore.toFixed(1)}-{stage.maxScore.toFixed(1)}
                </span>
              </div>
              <p className="text-[10px] text-white/40">{stage.description}</p>
            </div>
          ))}
          
          <div className="mt-4 p-3 bg-adl-accent/10 border border-adl-accent/20 rounded-lg">
            <p className="text-xs text-adl-accent font-medium mb-1">Your Progress</p>
            <p className="text-[10px] text-white/50">
              Improve your OHI score through strategic policy investments and crisis management.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default WorldMapView;
