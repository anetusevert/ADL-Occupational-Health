/**
 * Decision Round Component
 * 
 * Interactive decision card selection for each turn
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Shield,
  Eye,
  Heart,
  Check,
  AlertTriangle,
  Clock,
  Zap,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { DecisionCard, PillarId } from './types';
import { PILLAR_CONFIGS } from './types';

const PILLAR_ICONS: Record<PillarId, typeof Crown> = {
  governance: Crown,
  hazardControl: Shield,
  healthVigilance: Eye,
  restoration: Heart,
};

interface DecisionRoundProps {
  decisions: DecisionCard[];
  currentMonth: number;
  currentYear: number;
  budgetRemaining: number;
  onSelectDecisions: (selectedIds: string[]) => void;
  onConfirmDecisions: () => void;
  disabled?: boolean;
}

export function DecisionRound({
  decisions,
  currentMonth,
  currentYear,
  budgetRemaining,
  onSelectDecisions,
  onConfirmDecisions,
  disabled = false,
}: DecisionRoundProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthName = monthNames[currentMonth - 1] || 'January';

  const totalCost = useMemo(() => {
    return decisions
      .filter(d => selectedIds.has(d.id))
      .reduce((sum, d) => sum + d.cost, 0);
  }, [decisions, selectedIds]);

  const canAfford = (cost: number) => {
    const currentSpend = decisions
      .filter(d => selectedIds.has(d.id))
      .reduce((sum, d) => sum + d.cost, 0);
    return currentSpend + cost <= budgetRemaining;
  };

  const toggleSelection = (id: string, cost: number) => {
    if (disabled) return;

    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else if (canAfford(cost)) {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onSelectDecisions(Array.from(newSelected));
  };

  const hasSelections = selectedIds.size > 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">
              {monthName} {currentYear}
            </h2>
            <p className="text-xs text-white/40">Select your actions for this month</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              <span className={cn(
                'text-lg font-bold',
                budgetRemaining - totalCost > 50 ? 'text-emerald-400' :
                budgetRemaining - totalCost > 20 ? 'text-amber-400' :
                'text-red-400'
              )}>
                {budgetRemaining - totalCost}
              </span>
              <span className="text-white/40 text-sm">/ {budgetRemaining}</span>
            </div>
            <p className="text-[10px] text-white/30">Budget remaining</p>
          </div>
        </div>
      </div>

      {/* Decision Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence>
          {decisions.map((decision, index) => {
            const isSelected = selectedIds.has(decision.id);
            const isHovered = hoveredId === decision.id;
            const canSelect = isSelected || canAfford(decision.cost);
            const config = PILLAR_CONFIGS.find(p => p.id === decision.pillar);
            const Icon = PILLAR_ICONS[decision.pillar as PillarId] || Crown;

            return (
              <motion.div
                key={decision.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onMouseEnter={() => setHoveredId(decision.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => toggleSelection(decision.id, decision.cost)}
                className={cn(
                  'relative p-4 rounded-xl border cursor-pointer transition-all',
                  isSelected
                    ? `${config?.bgColor} ${config?.borderColor} ring-1 ${config?.glowColor}`
                    : canSelect
                    ? 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    : 'bg-white/5 border-white/5 opacity-50 cursor-not-allowed'
                )}
              >
                {/* Selection Indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-3 right-3 w-6 h-6 bg-adl-accent rounded-full flex items-center justify-center"
                    >
                      <Check className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Header */}
                <div className="flex items-start gap-3 mb-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    config?.bgColor || 'bg-white/10'
                  )}>
                    <Icon className={cn('w-5 h-5', config?.color || 'text-white')} />
                  </div>
                  <div className="flex-1 min-w-0 pr-8">
                    <h3 className="font-medium text-white truncate">{decision.title}</h3>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                      {decision.description}
                    </p>
                  </div>
                </div>

                {/* Meta Row */}
                <div className="flex items-center gap-3 text-xs">
                  {/* Cost */}
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded',
                    isSelected ? 'bg-white/10' : 'bg-white/5'
                  )}>
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span className="text-white/70">{decision.cost} pts</span>
                  </div>

                  {/* Risk Level */}
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded',
                    decision.risk_level === 'high' ? 'bg-red-500/20 text-red-300' :
                    decision.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  )}>
                    <AlertTriangle className="w-3 h-3" />
                    <span className="capitalize">{decision.risk_level}</span>
                  </div>

                  {/* Time to Effect */}
                  <div className="flex items-center gap-1 text-white/40">
                    <Clock className="w-3 h-3" />
                    <span>{decision.time_to_effect}</span>
                  </div>
                </div>

                {/* Expected Impacts */}
                <AnimatePresence>
                  {(isSelected || isHovered) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-white/10"
                    >
                      <p className="text-xs text-white/40 mb-2">Expected Impacts</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(decision.expected_impacts).map(([pillar, impact]) => {
                          const pillarConfig = PILLAR_CONFIGS.find(p => p.id === pillar);
                          const PillarIcon = PILLAR_ICONS[pillar as PillarId] || Crown;
                          return (
                            <div
                              key={pillar}
                              className={cn(
                                'flex items-center gap-1 px-2 py-1 rounded',
                                pillarConfig?.bgColor || 'bg-white/10'
                              )}
                            >
                              <PillarIcon className={cn('w-3 h-3', pillarConfig?.color || 'text-white')} />
                              <span className={cn('text-xs', pillarConfig?.color || 'text-white')}>
                                +{impact}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Location & Institution */}
                      {(decision.location || decision.institution) && (
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-white/30">
                          {decision.location && <span>{decision.location}</span>}
                          {decision.location && decision.institution && <span>•</span>}
                          {decision.institution && <span>{decision.institution}</span>}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Footer - Confirm Button */}
      <div className="flex-shrink-0 p-4 border-t border-white/5 bg-slate-900/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-white/30" />
            <span className="text-xs text-white/40">
              {selectedIds.size} action{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <span className="text-sm">
            <span className="text-white/40">Cost: </span>
            <span className={cn(
              'font-bold',
              totalCost > budgetRemaining ? 'text-red-400' : 'text-amber-400'
            )}>
              {totalCost}
            </span>
          </span>
        </div>

        <motion.button
          whileHover={{ scale: hasSelections ? 1.02 : 1 }}
          whileTap={{ scale: hasSelections ? 0.98 : 1 }}
          onClick={onConfirmDecisions}
          disabled={!hasSelections || disabled}
          className={cn(
            'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all',
            hasSelections
              ? 'bg-adl-accent text-white hover:bg-adl-blue-light'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          )}
        >
          Confirm & Advance
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}

export default DecisionRound;
