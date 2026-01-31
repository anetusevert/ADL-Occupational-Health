/**
 * Budget Allocator Component
 * 
 * Realistic GDP-based budget allocation interface
 */

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  Crown,
  Shield,
  Eye,
  Heart,
  TrendingUp,
  AlertTriangle,
  Info,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BudgetState, BudgetAllocation, PillarId, CountryData } from './types';
import { PILLAR_CONFIGS } from './types';

// Icon mapping
const PILLAR_ICONS: Record<PillarId, typeof Crown> = {
  governance: Crown,
  hazardControl: Shield,
  healthVigilance: Eye,
  restoration: Heart,
};

interface BudgetAllocatorProps {
  budget: BudgetState;
  country: CountryData;
  onAllocate: (allocation: BudgetAllocation) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function BudgetAllocator({
  budget,
  country,
  onAllocate,
  disabled = false,
  compact = false,
}: BudgetAllocatorProps) {
  const [localAllocation, setLocalAllocation] = useState<BudgetAllocation>(budget.allocated);
  
  const totalAllocated = useMemo(() => 
    Object.values(localAllocation).reduce((a, b) => a + b, 0),
    [localAllocation]
  );
  
  const remaining = budget.totalBudgetPoints - totalAllocated;
  const isOverBudget = remaining < 0;
  
  const handleSliderChange = useCallback((pillar: PillarId, value: number) => {
    const newAllocation = { ...localAllocation, [pillar]: value };
    setLocalAllocation(newAllocation);
    onAllocate(newAllocation);
  }, [localAllocation, onAllocate]);
  
  const handleReset = useCallback(() => {
    const equalShare = Math.floor(budget.totalBudgetPoints / 4);
    const newAllocation: BudgetAllocation = {
      governance: equalShare,
      hazardControl: equalShare,
      healthVigilance: equalShare,
      restoration: equalShare,
    };
    setLocalAllocation(newAllocation);
    onAllocate(newAllocation);
  }, [budget.totalBudgetPoints, onAllocate]);
  
  const pillars: PillarId[] = ['governance', 'hazardControl', 'healthVigilance', 'restoration'];
  
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-adl-accent" />
            <span className="text-sm font-medium text-white">Budget</span>
          </div>
          <span className={cn(
            'text-sm font-mono',
            isOverBudget ? 'text-red-400' : 'text-emerald-400'
          )}>
            {remaining} pts remaining
          </span>
        </div>
        
        {/* Compact Bars */}
        <div className="grid grid-cols-4 gap-2">
          {pillars.map(pillar => {
            const config = PILLAR_CONFIGS.find(p => p.id === pillar)!;
            const Icon = PILLAR_ICONS[pillar];
            const value = localAllocation[pillar];
            const percent = (value / budget.totalBudgetPoints) * 100;
            
            return (
              <div key={pillar} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Icon className={cn('w-3 h-3', config.color)} />
                  <span className="text-[10px] text-white/60">{value}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full',
                      pillar === 'governance' ? 'bg-purple-500' :
                      pillar === 'hazardControl' ? 'bg-blue-500' :
                      pillar === 'healthVigilance' ? 'bg-teal-500' :
                      'bg-amber-500'
                    )}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-adl-accent/20 rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-adl-accent" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Budget Allocation</h3>
            <p className="text-xs text-white/40">
              {country.name} • Based on GDP & Health Expenditure
            </p>
          </div>
        </div>
        
        <button
          onClick={handleReset}
          disabled={disabled}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-white/40 hover:text-white/60 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reset
        </button>
      </div>
      
      {/* Budget Summary */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-white/40">Total Budget</p>
          <p className="text-xl font-bold text-white">{budget.totalBudgetPoints}</p>
          <p className="text-[10px] text-white/30">points/cycle</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-white/40">Allocated</p>
          <p className={cn(
            'text-xl font-bold',
            isOverBudget ? 'text-red-400' : 'text-adl-accent'
          )}>
            {totalAllocated}
          </p>
          <p className="text-[10px] text-white/30">points</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-white/40">Remaining</p>
          <p className={cn(
            'text-xl font-bold',
            isOverBudget ? 'text-red-400' : remaining > 50 ? 'text-emerald-400' : 'text-amber-400'
          )}>
            {remaining}
          </p>
          <p className="text-[10px] text-white/30">
            {isOverBudget ? 'over budget!' : 'available'}
          </p>
        </div>
      </div>
      
      {/* Warning if over budget */}
      {isOverBudget && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-2 mb-4 bg-red-500/10 border border-red-500/30 rounded-lg"
        >
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span className="text-xs text-red-400">
            Budget exceeded! Reduce allocations by {Math.abs(remaining)} points.
          </span>
        </motion.div>
      )}
      
      {/* Pillar Sliders */}
      <div className="space-y-4">
        {pillars.map(pillar => {
          const config = PILLAR_CONFIGS.find(p => p.id === pillar)!;
          const Icon = PILLAR_ICONS[pillar];
          const value = localAllocation[pillar];
          const spent = budget.spent[pillar];
          const percent = (value / budget.totalBudgetPoints) * 100;
          
          return (
            <div key={pillar} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', config.bgColor)}>
                    <Icon className={cn('w-3.5 h-3.5', config.color)} />
                  </div>
                  <span className="text-sm font-medium text-white/80">{config.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">
                    {spent > 0 && <span className="text-amber-400">{spent} spent • </span>}
                  </span>
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleSliderChange(pillar, Math.max(0, parseInt(e.target.value) || 0))}
                    disabled={disabled}
                    className="w-16 px-2 py-1 bg-white/5 border border-white/10 rounded text-right text-sm text-white focus:outline-none focus:border-adl-accent/50"
                  />
                </div>
              </div>
              
              {/* Slider */}
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={budget.totalBudgetPoints}
                  value={value}
                  onChange={(e) => handleSliderChange(pillar, parseInt(e.target.value))}
                  disabled={disabled}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10"
                  style={{
                    background: `linear-gradient(to right, ${
                      pillar === 'governance' ? '#a855f7' :
                      pillar === 'hazardControl' ? '#3b82f6' :
                      pillar === 'healthVigilance' ? '#14b8a6' :
                      '#f59e0b'
                    } 0%, ${
                      pillar === 'governance' ? '#a855f7' :
                      pillar === 'hazardControl' ? '#3b82f6' :
                      pillar === 'healthVigilance' ? '#14b8a6' :
                      '#f59e0b'
                    } ${percent}%, rgba(255,255,255,0.1) ${percent}%)`
                  }}
                />
                
                {/* Spent indicator */}
                {spent > 0 && (
                  <div 
                    className="absolute top-0 h-2 bg-white/30 rounded-l-full pointer-events-none"
                    style={{ width: `${(spent / budget.totalBudgetPoints) * 100}%` }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Info footer */}
      <div className="mt-4 flex items-start gap-2 p-2 bg-white/5 rounded-lg">
        <Info className="w-4 h-4 text-white/30 flex-shrink-0 mt-0.5" />
        <p className="text-[10px] text-white/40 leading-relaxed">
          Budget is derived from {country.name}'s GDP (${country.gdp}B) and health expenditure ({country.healthExpenditure}% of GDP). 
          Allocate across pillars to fund policy investments. Unspent budget carries over to the next cycle.
        </p>
      </div>
    </div>
  );
}

export default BudgetAllocator;
