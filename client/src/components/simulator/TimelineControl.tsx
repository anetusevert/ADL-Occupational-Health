/**
 * Timeline Control Component
 * 
 * Play/pause/speed controls and year timeline display
 */

import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  FastForward,
  Rewind,
  ChevronFirst,
  ChevronLast,
  Gauge,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GameSpeed, GamePhase } from './types';
import { DEFAULT_START_YEAR, DEFAULT_END_YEAR, YEARS_PER_CYCLE } from './types';

interface TimelineControlProps {
  currentYear: number;
  startYear?: number;
  endYear?: number;
  cycleNumber: number;
  phase: GamePhase;
  speed: GameSpeed;
  isAutoAdvancing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onAdvance: () => void;
  onSpeedChange: (speed: GameSpeed) => void;
  onToggleAuto: () => void;
  disabled?: boolean;
}

export function TimelineControl({
  currentYear,
  startYear = DEFAULT_START_YEAR,
  endYear = DEFAULT_END_YEAR,
  cycleNumber,
  phase,
  speed,
  isAutoAdvancing,
  onPlay,
  onPause,
  onAdvance,
  onSpeedChange,
  onToggleAuto,
  disabled = false,
}: TimelineControlProps) {
  const totalCycles = (endYear - startYear) / YEARS_PER_CYCLE;
  const progress = ((currentYear - startYear) / (endYear - startYear)) * 100;
  
  const isPaused = phase === 'paused' || phase === 'setup';
  const isPlaying = phase === 'playing' && isAutoAdvancing;
  const canAdvance = phase === 'playing' || phase === 'paused' || phase === 'results';
  
  // Generate year markers
  const yearMarkers = [];
  for (let year = startYear; year <= endYear; year += YEARS_PER_CYCLE) {
    yearMarkers.push(year);
  }
  
  const speedOptions: { value: GameSpeed; label: string; icon: typeof Gauge }[] = [
    { value: 'slow', label: '1x', icon: Rewind },
    { value: 'medium', label: '2x', icon: Play },
    { value: 'fast', label: '4x', icon: FastForward },
  ];
  
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-6">
        {/* Play Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={isPlaying ? onPause : onPlay}
            disabled={disabled || phase === 'ended' || phase === 'event'}
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center transition-all',
              isPlaying
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-adl-accent/20 text-adl-accent border border-adl-accent/30',
              'hover:bg-adl-accent/30',
              (disabled || phase === 'ended' || phase === 'event') && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </motion.button>
          
          {/* Advance Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAdvance}
            disabled={disabled || !canAdvance || isAutoAdvancing}
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center transition-all',
              'bg-white/5 text-white/60 border border-white/10',
              'hover:bg-white/10 hover:text-white',
              (disabled || !canAdvance || isAutoAdvancing) && 'opacity-50 cursor-not-allowed'
            )}
            title="Advance 5 years"
          >
            <SkipForward className="w-4 h-4" />
          </motion.button>
        </div>
        
        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {speedOptions.map(option => (
            <button
              key={option.value}
              onClick={() => onSpeedChange(option.value)}
              disabled={disabled}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                speed === option.value
                  ? 'bg-adl-accent text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        
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
            <div className="absolute -top-1 left-0 right-0 flex justify-between">
              {yearMarkers.map((year, i) => {
                const isPast = year < currentYear;
                const isCurrent = year === currentYear;
                const position = ((year - startYear) / (endYear - startYear)) * 100;
                
                return (
                  <div
                    key={year}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    {/* Marker dot */}
                    <motion.div
                      className={cn(
                        'w-3 h-3 rounded-full border-2 transition-colors',
                        isCurrent
                          ? 'bg-adl-accent border-adl-accent scale-125'
                          : isPast
                            ? 'bg-adl-accent/50 border-adl-accent/50'
                            : 'bg-white/20 border-white/20'
                      )}
                      animate={isCurrent ? { 
                        scale: [1.25, 1.4, 1.25],
                        boxShadow: ['0 0 0 0 rgba(6, 182, 212, 0.4)', '0 0 0 8px rgba(6, 182, 212, 0)', '0 0 0 0 rgba(6, 182, 212, 0.4)']
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    
                    {/* Year label - show every other or key years */}
                    {(i === 0 || i === yearMarkers.length - 1 || isCurrent || i % 2 === 0) && (
                      <span className={cn(
                        'mt-2 text-[10px] font-mono',
                        isCurrent ? 'text-adl-accent font-bold' : 'text-white/40'
                      )}>
                        {year}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Current Year Display */}
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-white/40 text-xs">YEAR</span>
            <motion.span
              key={currentYear}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-white font-mono"
            >
              {currentYear}
            </motion.span>
          </div>
          <span className="text-white/40 text-xs">
            Cycle {cycleNumber + 1} of {totalCycles}
          </span>
        </div>
      </div>
      
      {/* Phase indicator */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-2 h-2 rounded-full',
            phase === 'playing' && isAutoAdvancing ? 'bg-emerald-400 animate-pulse' :
            phase === 'playing' ? 'bg-amber-400' :
            phase === 'paused' ? 'bg-white/40' :
            phase === 'event' ? 'bg-purple-400 animate-pulse' :
            phase === 'results' ? 'bg-blue-400' :
            phase === 'ended' ? 'bg-red-400' :
            'bg-white/20'
          )} />
          <span className="text-xs text-white/60 capitalize">
            {phase === 'event' ? 'Event in Progress' : 
             phase === 'results' ? 'Reviewing Results' :
             isAutoAdvancing ? 'Auto-Advancing' : phase}
          </span>
        </div>
        
        {/* Auto-advance toggle */}
        <button
          onClick={onToggleAuto}
          disabled={disabled || phase === 'ended'}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all',
            isAutoAdvancing
              ? 'bg-adl-accent/20 text-adl-accent'
              : 'text-white/40 hover:text-white/60'
          )}
        >
          <Gauge className="w-3 h-3" />
          <span>Auto</span>
        </button>
      </div>
    </div>
  );
}

export default TimelineControl;
