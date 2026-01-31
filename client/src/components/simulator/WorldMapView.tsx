/**
 * World Map View Component
 * 
 * Global comparison map showing OHI scores
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  X,
  TrendingUp,
  TrendingDown,
  MapPin,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryRanking } from './types';
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
  // Group rankings by region and score tier
  const { byStage, playerData } = useMemo(() => {
    const byStage: Record<string, CountryRanking[]> = {
      leading: [],
      advancing: [],
      developing: [],
      critical: [],
    };
    
    let playerData: CountryRanking | null = null;
    
    rankings.forEach(r => {
      if (r.iso_code === playerIso) {
        playerData = r;
      }
      
      const stage = MATURITY_STAGES.find(
        s => r.currentScore >= s.minScore && r.currentScore <= s.maxScore
      );
      
      if (stage?.label === 'Leading') byStage.leading.push(r);
      else if (stage?.label === 'Advancing') byStage.advancing.push(r);
      else if (stage?.label === 'Developing') byStage.developing.push(r);
      else byStage.critical.push(r);
    });
    
    return { byStage, playerData };
  }, [rankings, playerIso]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-5xl bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-adl-accent/20 rounded-xl flex items-center justify-center">
              <Globe className="w-5 h-5 text-adl-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Global OHI Comparison</h2>
              <p className="text-sm text-white/40">{rankings.length} countries ranked</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>
        
        {/* Player Position */}
        {playerData && (
          <div className="mx-6 my-4 p-4 bg-adl-accent/10 border border-adl-accent/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getCountryFlag(playerData.iso_code)}</span>
                <div>
                  <p className="text-white font-medium">{playerData.name}</p>
                  <p className="text-sm text-adl-accent">Your Country</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-adl-accent">{playerData.currentScore.toFixed(2)}</p>
                  <p className="text-xs text-white/40">OHI Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">#{playerData.currentRank}</p>
                  <p className="text-xs text-white/40">Global Rank</p>
                </div>
                {playerData.rankDelta !== 0 && (
                  <div className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-lg',
                    playerData.rankDelta > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  )}>
                    {playerData.rankDelta > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span className="font-medium">{Math.abs(playerData.rankDelta)} places</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Stage Breakdown */}
        <div className="p-6 grid grid-cols-4 gap-4 max-h-[60vh] overflow-auto">
          <StageColumn
            title="Leading"
            description="3.5 - 4.0"
            color="emerald"
            countries={byStage.leading}
            playerIso={playerIso}
          />
          <StageColumn
            title="Advancing"
            description="2.5 - 3.4"
            color="yellow"
            countries={byStage.advancing}
            playerIso={playerIso}
          />
          <StageColumn
            title="Developing"
            description="2.0 - 2.4"
            color="orange"
            countries={byStage.developing}
            playerIso={playerIso}
          />
          <StageColumn
            title="Critical"
            description="1.0 - 1.9"
            color="red"
            countries={byStage.critical}
            playerIso={playerIso}
          />
        </div>
        
        {/* Legend */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-center gap-6 text-xs text-white/40">
            <span>Powered by Arthur D. Little Global OHI Framework</span>
            <span>•</span>
            <span>Data from ILO, WHO, World Bank</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

interface StageColumnProps {
  title: string;
  description: string;
  color: 'emerald' | 'yellow' | 'orange' | 'red';
  countries: CountryRanking[];
  playerIso: string;
}

function StageColumn({
  title,
  description,
  color,
  countries,
  playerIso,
}: StageColumnProps) {
  const colorClasses = {
    emerald: {
      header: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
      dot: 'bg-emerald-500',
    },
    yellow: {
      header: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
      dot: 'bg-yellow-500',
    },
    orange: {
      header: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
      dot: 'bg-orange-500',
    },
    red: {
      header: 'bg-red-500/20 border-red-500/30 text-red-400',
      dot: 'bg-red-500',
    },
  };
  
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className={cn(
        'p-3 rounded-lg border text-center',
        colorClasses[color].header
      )}>
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className={cn('w-2 h-2 rounded-full', colorClasses[color].dot)} />
          <span className="font-semibold">{title}</span>
        </div>
        <p className="text-[10px] text-white/40">{description}</p>
        <p className="text-xs mt-1">{countries.length} countries</p>
      </div>
      
      {/* Countries */}
      <div className="space-y-1 max-h-[300px] overflow-auto">
        {countries.slice(0, 15).map((country, i) => (
          <motion.div
            key={country.iso_code}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.02 }}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg transition-colors',
              country.iso_code === playerIso
                ? 'bg-adl-accent/20 border border-adl-accent/30'
                : 'bg-white/5 hover:bg-white/10'
            )}
          >
            <span className="text-lg">{getCountryFlag(country.iso_code)}</span>
            <div className="flex-1 min-w-0">
              <p className={cn(
                'text-xs truncate',
                country.iso_code === playerIso ? 'text-white font-medium' : 'text-white/70'
              )}>
                {country.name}
              </p>
            </div>
            <span className="text-xs font-mono text-white/50">
              {country.currentScore.toFixed(1)}
            </span>
          </motion.div>
        ))}
        
        {countries.length > 15 && (
          <p className="text-center text-xs text-white/30 py-2">
            +{countries.length - 15} more
          </p>
        )}
      </div>
    </div>
  );
}

export default WorldMapView;
