/**
 * Budget Allocator - Compact budget display
 */

import { motion } from 'framer-motion';
import { Wallet, Crown, Shield, Eye, Heart } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BudgetState, BudgetAllocation, PillarId, CountryData } from './types';

const PILLAR_ICONS: Record<PillarId, typeof Crown> = {
  governance: Crown,
  hazardControl: Shield,
  healthVigilance: Eye,
  restoration: Heart,
};

const PILLAR_COLORS: Record<PillarId, string> = {
  governance: 'text-purple-400',
  hazardControl: 'text-blue-400',
  healthVigilance: 'text-teal-400',
  restoration: 'text-amber-400',
};

const PILLAR_BG_COLORS: Record<PillarId, string> = {
  governance: 'bg-purple-500',
  hazardControl: 'bg-blue-500',
  healthVigilance: 'bg-teal-500',
  restoration: 'bg-amber-500',
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
  const pillars: PillarId[] = ['governance', 'hazardControl', 'healthVigilance', 'restoration'];
  const totalSpent = Object.values(budget.spent).reduce((a, b) => a + b, 0);
  const totalAllocated = Object.values(budget.allocated).reduce((a, b) => a + b, 0);
  const remaining = budget.totalBudgetPoints - totalSpent;

  if (compact) {
    return (
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-adl-accent" />
            <span className="text-sm font-medium text-white">Budget</span>
          </div>
          <div className="text-right">
            <span className={cn(
              'text-sm font-mono font-bold',
              remaining > budget.totalBudgetPoints * 0.5 ? 'text-emerald-400' :
              remaining > budget.totalBudgetPoints * 0.2 ? 'text-amber-400' : 'text-red-400'
            )}>
              {remaining}
            </span>
            <span className="text-xs text-white/40"> / {budget.totalBudgetPoints}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {pillars.map(pillar => {
            const Icon = PILLAR_ICONS[pillar];
            const allocated = budget.allocated[pillar];
            const spent = budget.spent[pillar];
            const percent = allocated > 0 ? (spent / allocated) * 100 : 0;

            return (
              <div key={pillar} className="space-y-1">
                <div className="flex items-center justify-between">
                  <Icon className={cn('w-3 h-3', PILLAR_COLORS[pillar])} />
                  <span className="text-[9px] text-white/50">{spent}/{allocated}</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className={cn('h-full rounded-full', PILLAR_BG_COLORS[pillar])}
                    animate={{ width: `${percent}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Full version (not used in current layout)
  return (
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-adl-accent/20 rounded-xl flex items-center justify-center">
          <Wallet className="w-5 h-5 text-adl-accent" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Budget Allocation</h3>
          <p className="text-xs text-white/40">{country.name} • {budget.totalBudgetPoints} pts/year</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-white/40">Total</p>
          <p className="text-xl font-bold text-white">{budget.totalBudgetPoints}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3 text-center">
          <p className="text-xs text-white/40">Remaining</p>
          <p className={cn('text-xl font-bold', remaining > 0 ? 'text-emerald-400' : 'text-red-400')}>
            {remaining}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {pillars.map(pillar => {
          const Icon = PILLAR_ICONS[pillar];
          const allocated = budget.allocated[pillar];
          const spent = budget.spent[pillar];

          return (
            <div key={pillar} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={cn('w-4 h-4', PILLAR_COLORS[pillar])} />
                  <span className="text-xs text-white/60 capitalize">
                    {pillar === 'hazardControl' ? 'Hazard' :
                     pillar === 'healthVigilance' ? 'Vigilance' :
                     pillar === 'restoration' ? 'Restoration' : 'Governance'}
                  </span>
                </div>
                <span className="text-xs text-white/40">{spent} / {allocated}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full', PILLAR_BG_COLORS[pillar])}
                  animate={{ width: `${allocated > 0 ? (spent / allocated) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BudgetAllocator;
