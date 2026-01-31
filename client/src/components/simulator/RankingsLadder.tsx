/**
 * Rankings Ladder Component
 * 
 * Animated country rankings with position changes
 */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ArrowUp, ArrowDown, Minus, Crown, Medal, Award } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryRanking } from './types';

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

interface RankingsLadderProps {
  rankings: CountryRanking[];
  playerIso: string;
  maxDisplay?: number;
  showNearby?: boolean;
  className?: string;
}

export function RankingsLadder({
  rankings,
  playerIso,
  maxDisplay = 10,
  showNearby = true,
  className,
}: RankingsLadderProps) {
  const displayRankings = useMemo(() => {
    if (rankings.length === 0) return { top: [], nearby: [], playerRank: 0 };
    
    const sortedRankings = [...rankings].sort((a, b) => a.currentRank - b.currentRank);
    const playerIndex = sortedRankings.findIndex(r => r.iso_code === playerIso);
    const playerRanking = sortedRankings[playerIndex];
    const playerRank = playerRanking?.currentRank || 0;
    
    // If player is in top display, show top N
    if (playerIndex < maxDisplay) {
      return {
        top: sortedRankings.slice(0, maxDisplay),
        nearby: [],
        playerRank,
      };
    }
    
    // Otherwise, show top 7 + separator + nearby countries
    const top = sortedRankings.slice(0, 7);
    const nearbyStart = Math.max(0, playerIndex - 1);
    const nearbyEnd = Math.min(sortedRankings.length, playerIndex + 2);
    const nearby = showNearby ? sortedRankings.slice(nearbyStart, nearbyEnd) : [];
    
    return { top, nearby, playerRank };
  }, [rankings, playerIso, maxDisplay, showNearby]);
  
  if (rankings.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-48', className)}>
        <div className="text-center">
          <Trophy className="w-10 h-10 text-white/20 mx-auto mb-2" />
          <p className="text-white/40 text-sm">Select a country to see rankings</p>
        </div>
      </div>
    );
  }
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-4 h-4 text-amber-400" />;
      case 2: return <Medal className="w-4 h-4 text-slate-300" />;
      case 3: return <Award className="w-4 h-4 text-orange-400" />;
      default: return null;
    }
  };
  
  const getRankBgClass = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-amber-500/20 border-amber-500/30';
      case 2: return 'bg-slate-400/20 border-slate-400/30';
      case 3: return 'bg-orange-500/20 border-orange-500/30';
      default: return 'bg-white/5 border-white/10';
    }
  };
  
  return (
    <div className={cn('space-y-1', className)}>
      {/* Top Rankings */}
      <AnimatePresence mode="popLayout">
        {displayRankings.top.map((country, index) => (
          <RankingRow
            key={country.iso_code}
            country={country}
            isPlayer={country.iso_code === playerIso}
            rankIcon={getRankIcon(country.currentRank)}
            rankBgClass={getRankBgClass(country.currentRank)}
            index={index}
          />
        ))}
      </AnimatePresence>
      
      {/* Separator if showing nearby */}
      {displayRankings.nearby.length > 0 && (
        <div className="flex items-center justify-center py-2 gap-2">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-white/30 text-xs">• • •</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>
      )}
      
      {/* Nearby Rankings */}
      <AnimatePresence mode="popLayout">
        {displayRankings.nearby.map((country, index) => (
          <RankingRow
            key={country.iso_code}
            country={country}
            isPlayer={country.iso_code === playerIso}
            rankIcon={null}
            rankBgClass="bg-white/5 border-white/10"
            index={displayRankings.top.length + index}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface RankingRowProps {
  country: CountryRanking;
  isPlayer: boolean;
  rankIcon: React.ReactNode;
  rankBgClass: string;
  index: number;
}

function RankingRow({ country, isPlayer, rankIcon, rankBgClass, index }: RankingRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className={cn(
        'flex items-center gap-3 p-2.5 rounded-lg border transition-all',
        isPlayer 
          ? 'bg-adl-accent/20 border-adl-accent/40 ring-1 ring-adl-accent/30' 
          : rankBgClass
      )}
    >
      {/* Rank Badge */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm',
        country.currentRank <= 3 
          ? 'bg-transparent' 
          : 'bg-white/10 text-white/60'
      )}>
        {rankIcon || country.currentRank}
      </div>
      
      {/* Flag */}
      <span className="text-xl">{getCountryFlag(country.iso_code)}</span>
      
      {/* Country Name */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate',
          isPlayer ? 'text-white' : 'text-white/80'
        )}>
          {country.name}
          {isPlayer && (
            <span className="ml-2 text-[10px] text-adl-accent font-normal">(You)</span>
          )}
        </p>
      </div>
      
      {/* Score */}
      <div className="text-right">
        <motion.span
          key={country.currentScore}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-mono text-adl-accent font-medium"
        >
          {country.currentScore.toFixed(2)}
        </motion.span>
      </div>
      
      {/* Rank Change */}
      {country.rankDelta !== 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={cn(
            'flex items-center gap-0.5 min-w-[40px] justify-end',
            country.rankDelta > 0 ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {country.rankDelta > 0 ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" />
          )}
          <span className="text-xs font-bold">
            {Math.abs(country.rankDelta)}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

/**
 * Compact ranking summary for headers
 */
export function RankingSummary({
  rank,
  previousRank,
  totalCountries = 195,
  className,
}: {
  rank: number;
  previousRank?: number;
  totalCountries?: number;
  className?: string;
}) {
  const delta = previousRank ? previousRank - rank : 0;
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <Trophy className="w-4 h-4 text-amber-400" />
        <span className="text-lg font-bold text-white">#{rank}</span>
        <span className="text-white/40 text-sm">/ {totalCountries}</span>
      </div>
      
      {delta !== 0 && (
        <motion.div
          initial={{ opacity: 0, x: -5 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            'flex items-center text-sm font-medium',
            delta > 0 ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          {delta > 0 ? (
            <ArrowUp className="w-3.5 h-3.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5" />
          )}
          {Math.abs(delta)}
        </motion.div>
      )}
    </div>
  );
}

export default RankingsLadder;
