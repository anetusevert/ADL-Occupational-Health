/**
 * AdvisorChoices Component
 * 
 * Decision response buttons for the advisor conversation
 * Displays decision options as interactive cards
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  Shield,
  Eye,
  Heart,
  Zap,
  AlertTriangle,
  Clock,
  Check,
  ChevronRight,
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

interface AdvisorChoice {
  id: string;
  label: string;
  description: string;
  pillar?: PillarId;
  cost?: number;
  riskLevel?: 'low' | 'medium' | 'high';
  timeToEffect?: string;
  impacts?: Partial<Record<PillarId, number>>;
}

interface AdvisorChoicesProps {
  choices: AdvisorChoice[];
  budgetRemaining?: number;
  onSelect: (choiceId: string) => void;
  onConfirm: () => void;
  multiSelect?: boolean;
  disabled?: boolean;
  confirmLabel?: string;
}

export function AdvisorChoices({
  choices,
  budgetRemaining = 100,
  onSelect,
  onConfirm,
  multiSelect = true,
  disabled = false,
  confirmLabel = 'Confirm Decision',
}: AdvisorChoicesProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const totalCost = choices
    .filter(c => selectedIds.has(c.id))
    .reduce((sum, c) => sum + (c.cost || 0), 0);

  const canAfford = (cost: number) => {
    const currentSpend = choices
      .filter(c => selectedIds.has(c.id))
      .reduce((sum, c) => sum + (c.cost || 0), 0);
    return currentSpend + cost <= budgetRemaining;
  };

  const handleSelect = (id: string, cost: number = 0) => {
    if (disabled) return;

    if (multiSelect) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else if (canAfford(cost)) {
        newSelected.add(id);
      }
      setSelectedIds(newSelected);
      onSelect(id);
    } else {
      setSelectedIds(new Set([id]));
      onSelect(id);
    }
  };

  const hasSelections = selectedIds.size > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="space-y-3"
    >
      {/* Budget Indicator */}
      {budgetRemaining > 0 && (
        <div className="flex items-center justify-between px-2 py-1.5 bg-white/5 rounded-lg border border-white/10">
          <span className="text-xs text-white/50">Budget Available</span>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-sm font-bold',
              budgetRemaining - totalCost > 50 ? 'text-emerald-400' :
              budgetRemaining - totalCost > 20 ? 'text-amber-400' :
              'text-red-400'
            )}>
              {budgetRemaining - totalCost}
            </span>
            <span className="text-xs text-white/30">/ {budgetRemaining}</span>
          </div>
        </div>
      )}

      {/* Choice Cards */}
      <div className="space-y-2">
        <AnimatePresence>
          {choices.map((choice, index) => {
            const isSelected = selectedIds.has(choice.id);
            const isHovered = hoveredId === choice.id;
            const canSelect = isSelected || canAfford(choice.cost || 0);
            const config = choice.pillar ? PILLAR_CONFIGS.find(p => p.id === choice.pillar) : null;
            const Icon = choice.pillar ? PILLAR_ICONS[choice.pillar] : Zap;

            return (
              <motion.button
                key={choice.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.08, duration: 0.3 }}
                whileHover={{ scale: canSelect && !disabled ? 1.02 : 1 }}
                whileTap={{ scale: canSelect && !disabled ? 0.98 : 1 }}
                onMouseEnter={() => setHoveredId(choice.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => handleSelect(choice.id, choice.cost)}
                disabled={disabled || (!isSelected && !canSelect)}
                className={cn(
                  'w-full text-left p-3 rounded-xl border transition-all relative overflow-hidden',
                  isSelected
                    ? `${config?.bgColor || 'bg-adl-accent/20'} ${config?.borderColor || 'border-adl-accent/30'} ring-1 ring-adl-accent/50`
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
                      className="absolute top-2 right-2 w-5 h-5 bg-adl-accent rounded-full flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Content */}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                    config?.bgColor || 'bg-white/10'
                  )}>
                    <Icon className={cn('w-4 h-4', config?.color || 'text-white')} />
                  </div>

                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="font-medium text-white text-sm truncate">{choice.label}</h4>
                    <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{choice.description}</p>

                    {/* Meta Row */}
                    {(choice.cost || choice.riskLevel || choice.timeToEffect) && (
                      <div className="flex items-center gap-2 mt-2">
                        {choice.cost && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-white/70">
                            <Zap className="w-2.5 h-2.5 text-amber-400" />
                            {choice.cost} pts
                          </span>
                        )}
                        {choice.riskLevel && (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]',
                            choice.riskLevel === 'high' ? 'bg-red-500/20 text-red-300' :
                            choice.riskLevel === 'medium' ? 'bg-amber-500/20 text-amber-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          )}>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {choice.riskLevel}
                          </span>
                        )}
                        {choice.timeToEffect && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-white/40">
                            <Clock className="w-2.5 h-2.5" />
                            {choice.timeToEffect}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Impacts Preview */}
                    <AnimatePresence>
                      {(isSelected || isHovered) && choice.impacts && Object.keys(choice.impacts).length > 0 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-2 pt-2 border-t border-white/10"
                        >
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(choice.impacts).map(([pillar, impact]) => {
                              const pillarConfig = PILLAR_CONFIGS.find(p => p.id === pillar);
                              const PillarIcon = PILLAR_ICONS[pillar as PillarId] || Zap;
                              return (
                                <span
                                  key={pillar}
                                  className={cn(
                                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded',
                                    pillarConfig?.bgColor || 'bg-white/10'
                                  )}
                                >
                                  <PillarIcon className={cn('w-2.5 h-2.5', pillarConfig?.color || 'text-white')} />
                                  <span className={cn('text-[10px]', pillarConfig?.color || 'text-white')}>
                                    +{impact}
                                  </span>
                                </span>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirm Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: choices.length * 0.08 + 0.2 }}
        whileHover={{ scale: hasSelections && !disabled ? 1.02 : 1 }}
        whileTap={{ scale: hasSelections && !disabled ? 0.98 : 1 }}
        onClick={onConfirm}
        disabled={!hasSelections || disabled}
        className={cn(
          'w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
          hasSelections && !disabled
            ? 'bg-adl-accent text-white hover:bg-adl-blue-light shadow-lg shadow-adl-accent/30'
            : 'bg-white/10 text-white/40 cursor-not-allowed'
        )}
      >
        {confirmLabel}
        <ChevronRight className="w-4 h-4" />
      </motion.button>

      {/* Selection Summary */}
      {multiSelect && selectedIds.size > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-white/40"
        >
          {selectedIds.size} action{selectedIds.size !== 1 ? 's' : ''} selected
          {totalCost > 0 && ` • ${totalCost} budget points`}
        </motion.p>
      )}
    </motion.div>
  );
}

/**
 * Simple choice buttons for yes/no or simple options
 */
interface SimpleChoiceProps {
  options: Array<{ id: string; label: string; variant?: 'primary' | 'secondary' | 'danger' }>;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function SimpleChoices({ options, onSelect, disabled }: SimpleChoiceProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-2"
    >
      {options.map((option, index) => (
        <motion.button
          key={option.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: disabled ? 1 : 1.05 }}
          whileTap={{ scale: disabled ? 1 : 0.95 }}
          onClick={() => onSelect(option.id)}
          disabled={disabled}
          className={cn(
            'flex-1 py-2.5 px-4 rounded-xl font-medium text-sm transition-all',
            option.variant === 'primary' && 'bg-adl-accent text-white hover:bg-adl-blue-light',
            option.variant === 'secondary' && 'bg-white/10 text-white/80 hover:bg-white/20',
            option.variant === 'danger' && 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
            !option.variant && 'bg-white/10 text-white/80 hover:bg-white/20',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {option.label}
        </motion.button>
      ))}
    </motion.div>
  );
}

export default AdvisorChoices;
