/**
 * ADL OHI Score Display - Branded score gauge with animated ring
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { MATURITY_STAGES } from './types';
import type { MaturityStage } from './types';

interface OHIScoreDisplayProps {
  score: number;
  previousScore?: number;
  size?: 'sm' | 'md' | 'lg';
  showDelta?: boolean;
  showStage?: boolean;
  animated?: boolean;
  className?: string;
}

export function OHIScoreDisplay({ score, previousScore, size = 'md', showDelta = true, showStage = true, animated = true, className }: OHIScoreDisplayProps) {
  const delta = previousScore !== undefined ? score - previousScore : 0;
  const stage = useMemo((): MaturityStage => {
    for (const s of MATURITY_STAGES) {
      if (score >= s.minScore && score <= s.maxScore) return s;
    }
    return MATURITY_STAGES[0];
  }, [score]);
  
  const progressPercent = ((score - 1.0) / 3.0) * 100;
  const sizeConfig = { sm: { ring: 80, stroke: 6, fontSize: 'text-xl', labelSize: 'text-[10px]' }, md: { ring: 120, stroke: 8, fontSize: 'text-3xl', labelSize: 'text-xs' }, lg: { ring: 180, stroke: 10, fontSize: 'text-5xl', labelSize: 'text-sm' } };
  const config = sizeConfig[size];
  const radius = (config.ring - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressPercent / 100);
  
  const stageColors: Record<string, string> = { red: 'stroke-red-500', orange: 'stroke-orange-500', yellow: 'stroke-yellow-500', emerald: 'stroke-emerald-500' };
  const stageBgColors: Record<string, string> = { red: 'bg-red-500/20 text-red-400 border-red-500/30', orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30', yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: config.ring, height: config.ring }}>
        <svg className="absolute inset-0 -rotate-90" width={config.ring} height={config.ring}>
          <circle cx={config.ring / 2} cy={config.ring / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={config.stroke} className="text-white/10" />
        </svg>
        <svg className="absolute inset-0 -rotate-90" width={config.ring} height={config.ring}>
          <motion.circle cx={config.ring / 2} cy={config.ring / 2} r={radius} fill="none" strokeWidth={config.stroke} strokeLinecap="round" className={stageColors[stage.color]} strokeDasharray={circumference} initial={animated ? { strokeDashoffset: circumference } : { strokeDashoffset }} animate={{ strokeDashoffset }} transition={{ duration: 1.5, ease: 'easeOut' }} style={{ filter: 'drop-shadow(0 0 8px currentColor)' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className={cn('absolute -top-1 w-full flex justify-center', size === 'sm' ? 'text-[6px]' : size === 'md' ? 'text-[8px]' : 'text-[10px]')}>
            <span className="text-adl-accent font-semibold tracking-widest opacity-60">ADL</span>
          </div>
          <motion.span className={cn('font-bold text-white', config.fontSize)} initial={animated ? { opacity: 0, scale: 0.5 } : {}} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>{score.toFixed(2)}</motion.span>
          <span className={cn('text-white/40 uppercase tracking-wider', config.labelSize)}>OHI Score</span>
          {showDelta && delta !== 0 && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={cn('flex items-center gap-0.5 mt-1', config.labelSize, delta > 0 ? 'text-emerald-400' : 'text-red-400')}>
              {delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              <span className="font-medium">{delta > 0 ? '+' : ''}{delta.toFixed(2)}</span>
            </motion.div>
          )}
        </div>
      </div>
      {showStage && (
        <motion.div initial={animated ? { opacity: 0, y: 10 } : {}} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }} className={cn('mt-3 px-3 py-1 rounded-full border text-xs font-medium', stageBgColors[stage.color])}>{stage.label}</motion.div>
      )}
    </div>
  );
}

export function OHIScoreInline({ score, previousScore, className }: { score: number; previousScore?: number; className?: string }) {
  const delta = previousScore !== undefined ? score - previousScore : 0;
  const stage = useMemo((): MaturityStage => { for (const s of MATURITY_STAGES) { if (score >= s.minScore && score <= s.maxScore) return s; } return MATURITY_STAGES[0]; }, [score]);
  const stageColors: Record<string, string> = { red: 'text-red-400', orange: 'text-orange-400', yellow: 'text-yellow-400', emerald: 'text-emerald-400' };
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn('text-lg font-bold', stageColors[stage.color])}>{score.toFixed(2)}</span>
      {delta !== 0 && <span className={cn('flex items-center text-xs font-medium', delta > 0 ? 'text-emerald-400' : 'text-red-400')}>{delta > 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}{Math.abs(delta).toFixed(2)}</span>}
    </div>
  );
}

export default OHIScoreDisplay;
