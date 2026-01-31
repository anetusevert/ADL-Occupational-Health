/**
 * Policy Temple - Interactive policy investment interface
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield, Eye, Heart, Lock, Check, Plus, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { PillarId, PillarScores, PolicyState, BudgetAllocation } from './types';
import { PILLAR_CONFIGS } from './types';
import { ALL_POLICIES } from '../../data/policyDefinitions';

const PILLAR_ICONS: Record<PillarId, typeof Crown> = {
  governance: Crown,
  hazardControl: Shield,
  healthVigilance: Eye,
  restoration: Heart,
};

interface PolicyTempleProps {
  pillars: PillarScores;
  policies: PolicyState[];
  budget: BudgetAllocation;
  budgetSpent: BudgetAllocation;
  currentYear: number;
  selectedPillar: PillarId | null;
  onSelectPillar: (pillar: PillarId | null) => void;
  onInvestPolicy: (policyId: string, cost: number) => void;
  disabled?: boolean;
}

export function PolicyTemple({
  pillars,
  policies,
  budget,
  budgetSpent,
  currentYear,
  selectedPillar,
  onSelectPillar,
  onInvestPolicy,
  disabled = false,
}: PolicyTempleProps) {
  const governanceConfig = PILLAR_CONFIGS.find(p => p.id === 'governance')!;
  const pillarConfigs = PILLAR_CONFIGS.filter(p => p.id !== 'governance');

  return (
    <div className="h-full flex flex-col gap-2 overflow-auto">
      {/* Governance - Roof */}
      <PillarBlock
        config={governanceConfig}
        score={pillars.governance}
        policies={policies}
        budget={budget.governance}
        spent={budgetSpent.governance}
        currentYear={currentYear}
        isSelected={selectedPillar === 'governance'}
        onSelect={() => onSelectPillar(selectedPillar === 'governance' ? null : 'governance')}
        onInvestPolicy={onInvestPolicy}
        disabled={disabled}
        isRoof
      />

      {/* Three Pillars */}
      <div className="flex-1 grid grid-cols-3 gap-2 min-h-0">
        {pillarConfigs.map(config => (
          <PillarBlock
            key={config.id}
            config={config}
            score={pillars[config.id]}
            policies={policies}
            budget={budget[config.id]}
            spent={budgetSpent[config.id]}
            currentYear={currentYear}
            isSelected={selectedPillar === config.id}
            onSelect={() => onSelectPillar(selectedPillar === config.id ? null : config.id)}
            onInvestPolicy={onInvestPolicy}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function PillarBlock({
  config,
  score,
  policies,
  budget,
  spent,
  currentYear,
  isSelected,
  onSelect,
  onInvestPolicy,
  disabled,
  isRoof,
}: {
  config: typeof PILLAR_CONFIGS[0];
  score: number;
  policies: PolicyState[];
  budget: number;
  spent: number;
  currentYear: number;
  isSelected: boolean;
  onSelect: () => void;
  onInvestPolicy: (policyId: string, cost: number) => void;
  disabled?: boolean;
  isRoof?: boolean;
}) {
  const Icon = PILLAR_ICONS[config.id];
  const pillarPolicies = useMemo(() => ALL_POLICIES.filter(p => p.pillar === config.id), [config.id]);
  const policyStates = useMemo(() => 
    pillarPolicies.map(def => ({ 
      definition: def, 
      state: policies.find(p => p.policyId === def.id) 
    })), 
    [pillarPolicies, policies]
  );
  const activePolicies = policyStates.filter(p => (p.state?.currentLevel || 0) > 0);
  const availableBudget = budget - spent;

  const healthLevel = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
  const healthColors = {
    excellent: 'bg-emerald-500',
    good: 'bg-yellow-500',
    fair: 'bg-orange-500',
    poor: 'bg-red-500',
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.01 }}
      className={cn(
        'flex flex-col rounded-lg border cursor-pointer transition-all duration-200 overflow-hidden',
        config.bgColor,
        isSelected ? `${config.borderColor} ring-1 ${config.glowColor}` : 'border-white/10 hover:border-white/20'
      )}
    >
      {/* Header */}
      <div
        onClick={disabled ? undefined : onSelect}
        className="flex items-center justify-between p-2 border-b border-white/5"
      >
        <div className="flex items-center gap-2">
          <div className={cn('w-7 h-7 rounded flex items-center justify-center', config.bgColor)}>
            <Icon className={cn('w-3.5 h-3.5', config.color)} />
          </div>
          <div>
            <p className={cn('font-medium text-xs', config.color)}>{config.name}</p>
            <p className="text-[9px] text-white/30">{activePolicies.length} active</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1">
            <div className={cn('w-1.5 h-1.5 rounded-full', healthColors[healthLevel])} />
            <span className={cn('text-lg font-bold', config.color)}>{Math.round(score)}</span>
          </div>
        </div>
      </div>

      {/* Budget Bar */}
      <div className="px-2 py-1.5 bg-black/20">
        <div className="flex items-center justify-between text-[9px] mb-0.5">
          <span className="text-white/30">Budget</span>
          <span className={cn('font-medium', availableBudget > 0 ? 'text-emerald-400' : 'text-white/30')}>
            {availableBudget}/{budget}
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              config.id === 'governance' ? 'bg-purple-500' :
              config.id === 'hazardControl' ? 'bg-blue-500' :
              config.id === 'healthVigilance' ? 'bg-teal-500' : 'bg-amber-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${budget > 0 ? (spent / budget) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Policy List */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-1.5 space-y-1 max-h-[150px] overflow-y-auto">
              {policyStates.slice(0, 6).map(({ definition, state }) => (
                <PolicyRow
                  key={definition.id}
                  definition={definition}
                  state={state}
                  currentYear={currentYear}
                  availableBudget={availableBudget}
                  onInvest={(cost) => onInvestPolicy(definition.id, cost)}
                  disabled={disabled}
                  pillarColor={config.color}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand/Collapse Indicator */}
      <div 
        onClick={disabled ? undefined : onSelect}
        className="flex justify-center py-0.5 border-t border-white/5 cursor-pointer"
      >
        {isSelected ? (
          <ChevronUp className="w-3 h-3 text-white/20" />
        ) : (
          <ChevronDown className="w-3 h-3 text-white/20" />
        )}
      </div>
    </motion.div>
  );
}

function PolicyRow({
  definition,
  state,
  currentYear,
  availableBudget,
  onInvest,
  disabled,
  pillarColor,
}: {
  definition: any;
  state?: PolicyState;
  currentYear: number;
  availableBudget: number;
  onInvest: (cost: number) => void;
  disabled?: boolean;
  pillarColor: string;
}) {
  const currentLevel = state?.currentLevel || 0;
  const isLocked = definition.unlockYear > currentYear;
  const isMaxed = currentLevel >= definition.maxLevel;
  const levelCost = Math.round(definition.baseCost * (1 + currentLevel * 0.1));
  const canInvest = !isLocked && !isMaxed && !disabled && availableBudget >= levelCost;

  return (
    <motion.div
      whileHover={canInvest ? { scale: 1.02 } : {}}
      className={cn(
        'flex items-center gap-1.5 p-1.5 rounded transition-all cursor-pointer',
        isLocked ? 'bg-white/5 opacity-40' :
        isMaxed ? 'bg-emerald-500/10 border border-emerald-500/20' :
        canInvest ? 'bg-white/5 hover:bg-white/10' : 'bg-white/5'
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (canInvest) onInvest(levelCost);
      }}
    >
      <div className={cn(
        'w-5 h-5 rounded flex items-center justify-center flex-shrink-0',
        isLocked ? 'bg-white/10' :
        isMaxed ? 'bg-emerald-500/20' :
        currentLevel > 0 ? 'bg-adl-accent/20' : 'bg-white/10'
      )}>
        {isLocked ? <Lock className="w-2.5 h-2.5 text-white/40" /> :
         isMaxed ? <Check className="w-2.5 h-2.5 text-emerald-400" /> :
         currentLevel > 0 ? <Zap className="w-2.5 h-2.5 text-adl-accent" /> :
         <Plus className="w-2.5 h-2.5 text-white/40" />}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-[10px] font-medium truncate', isLocked ? 'text-white/40' : 'text-white/80')}>
          {definition.name}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <div className="flex gap-0.5">
            {Array.from({ length: definition.maxLevel }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 h-1 rounded-full',
                  i < currentLevel ? pillarColor.replace('text-', 'bg-') : 'bg-white/20'
                )}
              />
            ))}
          </div>
          {!isMaxed && !isLocked && (
            <span className="text-[8px] text-white/30">{levelCost}pts</span>
          )}
        </div>
      </div>

      {canInvest && (
        <Plus className="w-3 h-3 text-adl-accent flex-shrink-0" />
      )}
    </motion.div>
  );
}

export default PolicyTemple;
