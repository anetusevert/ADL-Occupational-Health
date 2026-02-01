/**
 * Timeline Control - Manual round-based progression
 * 
 * Simplified for turn-based gameplay where user advances each round
 */

import { motion } from 'framer-motion';
import { ChevronRight, Calendar, TrendingUp, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GamePhase } from './types';
import { DEFAULT_START_YEAR, DEFAULT_END_YEAR } from './types';

interface TimelineControlProps {
  currentYear: number;
  startYear?: number;
  endYear?: number;
  cycleNumber: number;
  phase: GamePhase;
  onAdvance: () => void;
  disabled?: boolean;
  isAdvancing?: boolean;
}

export function TimelineControl({
  currentYear,
  startYear = DEFAULT_START_YEAR,
  endYear = DEFAULT_END_YEAR,
  cycleNumber,
  phase,
  onAdvance,
  disabled = false,
  isAdvancing = false,
}: TimelineControlProps) {
  const totalYears = endYear - startYear;
  const progress = ((currentYear - startYear) / totalYears) * 100;
  const canAdvance = (phase === 'playing' || phase === 'paused') && !disabled && !isAdvancing;
  const yearsRemaining = endYear - currentYear;

  // Generate year markers (every 5 years)
  const yearMarkers = [];
  for (let year = startYear; year <= endYear; year += 5) {
    yearMarkers.push(year);
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-6">
        {/* Advance Round Button - Primary Action */}
        <motion.button
          whileHover={canAdvance ? { scale: 1.02 } : {}}
          whileTap={canAdvance ? { scale: 0.98 } : {}}
          onClick={onAdvance}
          disabled={!canAdvance}
          className={cn(
            'flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all',
            canAdvance
              ? 'bg-adl-accent text-white hover:bg-adl-blue-light shadow-lg shadow-adl-accent/20'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          )}
        >
          {isAdvancing ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Clock className="w-4 h-4" />
              </motion.div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <ChevronRight className="w-4 h-4" />
              <span>Advance Year</span>
            </>
          )}
        </motion.button>

        {/* Timeline Bar */}
        <div className="flex-1">
          <div className="relative">
            {/* Progress Track */}
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-adl-accent to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>

            {/* Year Markers */}
            <div className="absolute -top-1 left-0 right-0 flex justify-between pointer-events-none">
              {yearMarkers.map(year => {
                const isPast = year < currentYear;
                const isCurrent = year === currentYear;
                const position = ((year - startYear) / totalYears) * 100;

                return (
                  <div
                    key={year}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    <motion.div
                      className={cn(
                        'w-3 h-3 rounded-full border-2 transition-colors',
                        isCurrent
                          ? 'bg-adl-accent border-adl-accent scale-125'
                          : isPast
                          ? 'bg-adl-accent/50 border-adl-accent/50'
                          : 'bg-white/20 border-white/20'
                      )}
                      animate={isCurrent ? { scale: [1.25, 1.4, 1.25] } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span
                      className={cn(
                        'mt-2 text-[10px] font-mono',
                        isCurrent ? 'text-adl-accent font-bold' : 'text-white/40'
                      )}
                    >
                      {year}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Year Display */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
            <Calendar className="w-4 h-4 text-adl-accent" />
            <motion.span
              key={currentYear}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-bold text-white font-mono"
            >
              {currentYear}
            </motion.span>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-1 text-white/60 text-xs">
              <TrendingUp className="w-3 h-3" />
              <span>Year {cycleNumber + 1}</span>
            </div>
            <span className="text-white/40 text-xs">
              {yearsRemaining} years remaining
            </span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              'w-2 h-2 rounded-full',
              phase === 'playing'
                ? 'bg-emerald-400 animate-pulse'
                : phase === 'paused'
                ? 'bg-amber-400'
                : phase === 'event'
                ? 'bg-purple-400 animate-pulse'
                : phase === 'ended'
                ? 'bg-red-400'
                : 'bg-white/20'
            )}
          />
          <span className="text-xs text-white/60">
            {phase === 'playing'
              ? 'Your Turn - Make decisions and advance'
              : phase === 'event'
              ? 'Event in Progress'
              : phase === 'ended'
              ? 'Simulation Complete'
              : phase === 'paused'
              ? 'Paused'
              : 'Ready'}
          </span>
        </div>

        <span className="text-xs text-white/40">
          {Math.round(progress)}% complete
        </span>
      </div>
    </div>
  );
}

export default TimelineControl;
