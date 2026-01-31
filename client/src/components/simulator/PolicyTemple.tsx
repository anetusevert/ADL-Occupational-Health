/**
 * Interactive Policy Temple Component
 * 
 * Visual temple structure with policy slots and investment controls
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Shield,
  Eye,
  Heart,
  Lock,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { 
  PillarId, 
  PillarScores, 
  PolicyState, 
  PolicyDefinition,
  BudgetAllocation,
} from './types';
import { PILLAR_CONFIGS } from './types';
import { getPoliciesByPillar } from '../../data/policyDefinitions';

// Icon mapping
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
    <div className="h-full flex flex-col gap-3">
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
      
      {/* Connecting Elements */}
      <div className="flex justify-center gap-8 py-1">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/20"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          />
        ))}
      </div>
      
      {/* Three Pillars */}
      <div className="flex-1 grid grid-cols-3 gap-3 min-h-0">
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

interface PillarBlockProps {
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
}: PillarBlockProps) {
  const Icon = PILLAR_ICONS[config.id];
  const pillarPolicies = useMemo(() => getPoliciesByPillar(config.id), [config.id]);
  
  // Get policy states for this pillar
  const policyStates = useMemo(() => {
    return pillarPolicies.map(def => {
      const state = policies.find(p => p.policyId === def.id);
      return { definition: def, state };
    });
  }, [pillarPolicies, policies]);
  
  const activePolicies = policyStates.filter(p => (p.state?.currentLevel || 0) > 0);
  const availableBudget = budget - spent;
  
  // Calculate pillar health indicator
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
      onClick={disabled ? undefined : onSelect}
      className={cn(
        'flex flex-col rounded-xl border-2 cursor-pointer transition-all duration-300 overflow-hidden',
        config.bgColor,
        isSelected 
          ? `${config.borderColor} shadow-lg ${config.glowColor}` 
          : 'border-white/10 hover:border-white/20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', config.bgColor)}>
            <Icon className={cn('w-4 h-4', config.color)} />
          </div>
          <div>
            <p className={cn('font-semibold text-sm', config.color)}>{config.name}</p>
            <p className="text-[10px] text-white/40">{isRoof ? 'Ecosystem' : 'Pillar'}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-1.5">
            <div className={cn('w-2 h-2 rounded-full', healthColors[healthLevel])} />
            <span className={cn('text-xl font-bold', config.color)}>{Math.round(score)}</span>
          </div>
          <p className="text-[10px] text-white/40">{activePolicies.length} active</p>
        </div>
      </div>
      
      {/* Budget Bar */}
      <div className="px-3 py-2 bg-black/20">
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-white/40">Budget</span>
          <span className={cn(
            'font-medium',
            availableBudget > 0 ? 'text-emerald-400' : 'text-white/40'
          )}>
            {availableBudget} / {budget} pts
          </span>
        </div>
        <div className="h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={cn('h-full rounded-full', 
              config.id === 'governance' ? 'bg-purple-500' :
              config.id === 'hazardControl' ? 'bg-blue-500' :
              config.id === 'healthVigilance' ? 'bg-teal-500' :
              'bg-amber-500'
            )}
            initial={{ width: 0 }}
            animate={{ width: `${(spent / budget) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Expandable Policy List */}
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-2 space-y-1 max-h-[200px] overflow-y-auto scrollbar-thin">
              {policyStates.map(({ definition, state }) => (
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
      
      {/* Expand indicator */}
      <div className="flex justify-center py-1 border-t border-white/5">
        {isSelected ? (
          <ChevronUp className="w-4 h-4 text-white/30" />
        ) : (
          <ChevronDown className="w-4 h-4 text-white/30" />
        )}
      </div>
    </motion.div>
  );
}

interface PolicyRowProps {
  definition: PolicyDefinition;
  state?: PolicyState;
  currentYear: number;
  availableBudget: number;
  onInvest: (cost: number) => void;
  disabled?: boolean;
  pillarColor: string;
}

function PolicyRow({
  definition,
  state,
  currentYear,
  availableBudget,
  onInvest,
  disabled,
  pillarColor,
}: PolicyRowProps) {
  const currentLevel = state?.currentLevel || 0;
  const status = state?.status || 'locked';
  const isLocked = status === 'locked' || definition.unlockYear > currentYear;
  const isMaxed = currentLevel >= definition.maxLevel;
  const canInvest = !isLocked && !isMaxed && !disabled && availableBudget >= definition.baseCost;
  
  const levelCost = Math.round(definition.baseCost * (1 + currentLevel * 0.1));
  
  return (
    <motion.div
      whileHover={canInvest ? { scale: 1.02 } : {}}
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg transition-all',
        isLocked ? 'bg-white/5 opacity-50' :
        isMaxed ? 'bg-emerald-500/10 border border-emerald-500/20' :
        'bg-white/5 hover:bg-white/10'
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (canInvest) onInvest(levelCost);
      }}
    >
      {/* Status Icon */}
      <div className={cn(
        'w-6 h-6 rounded flex items-center justify-center flex-shrink-0',
        isLocked ? 'bg-white/10' :
        isMaxed ? 'bg-emerald-500/20' :
        currentLevel > 0 ? 'bg-adl-accent/20' :
        'bg-white/10'
      )}>
        {isLocked ? (
          <Lock className="w-3 h-3 text-white/40" />
        ) : isMaxed ? (
          <Check className="w-3 h-3 text-emerald-400" />
        ) : currentLevel > 0 ? (
          <Zap className="w-3 h-3 text-adl-accent" />
        ) : (
          <Plus className="w-3 h-3 text-white/40" />
        )}
      </div>
      
      {/* Policy Info */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-xs font-medium truncate',
          isLocked ? 'text-white/40' : 'text-white/80'
        )}>
          {definition.name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {/* Level Dots */}
          <div className="flex gap-0.5">
            {Array.from({ length: definition.maxLevel }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  i < currentLevel ? pillarColor.replace('text-', 'bg-') : 'bg-white/20'
                )}
              />
            ))}
          </div>
          {!isMaxed && !isLocked && (
            <span className="text-[10px] text-white/40">
              {levelCost} pts
            </span>
          )}
        </div>
      </div>
      
      {/* Invest Button */}
      {canInvest && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={cn(
            'w-6 h-6 rounded flex items-center justify-center',
            'bg-adl-accent/20 text-adl-accent hover:bg-adl-accent/30'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onInvest(levelCost);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
        </motion.button>
      )}
    </motion.div>
  );
}

export default PolicyTemple;
