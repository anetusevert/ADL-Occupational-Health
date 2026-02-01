/**
 * EconomicIndicators Component
 * 
 * Displays World Bank-style economic data for the country
 * Shows real-time indicators like GDP, health expenditure, labor force
 * Full-tile version with development tracking over time
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Users,
  Activity,
  Briefcase,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
  Globe2,
  HeartPulse,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryBriefing, CycleHistory } from './types';

interface EconomicIndicatorsProps {
  briefing: CountryBriefing | null;
  className?: string;
  compact?: boolean;
  history?: CycleHistory[];
  variant?: 'default' | 'full';
}

interface Indicator {
  id: string;
  label: string;
  value: string | number | null;
  unit?: string;
  icon: typeof DollarSign;
  color: string;
  description?: string;
}

export function EconomicIndicators({
  briefing,
  className,
  compact = false,
  history = [],
  variant = 'default',
}: EconomicIndicatorsProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<string | null>(null);
  const isFull = variant === 'full';
  // Extract economic data from briefing
  const stats = briefing?.key_statistics || {};

  const indicators: Indicator[] = [
    {
      id: 'gdp',
      label: 'GDP per Capita',
      value: stats.gdp_per_capita || stats.gdp || null,
      unit: 'USD',
      icon: DollarSign,
      color: 'text-emerald-400',
      description: 'Gross Domestic Product per person',
    },
    {
      id: 'population',
      label: 'Population',
      value: stats.population || null,
      unit: '',
      icon: Users,
      color: 'text-blue-400',
      description: 'Total population',
    },
    {
      id: 'health_expenditure',
      label: 'Health Expenditure',
      value: stats.health_expenditure_pct || stats.healthExpenditure || null,
      unit: '% GDP',
      icon: HeartPulse,
      color: 'text-rose-400',
      description: 'Healthcare spending as % of GDP',
    },
    {
      id: 'labor_force',
      label: 'Labor Force',
      value: stats.labor_force || stats.laborForce || null,
      unit: '%',
      icon: Briefcase,
      color: 'text-amber-400',
      description: 'Labor force participation rate',
    },
  ];

  // Format value based on type
  const formatValue = (value: string | number | null, unit?: string): string => {
    if (value === null || value === undefined) return 'N/A';
    
    if (typeof value === 'number') {
      if (value >= 1_000_000_000) {
        return `${(value / 1_000_000_000).toFixed(1)}B`;
      }
      if (value >= 1_000_000) {
        return `${(value / 1_000_000).toFixed(1)}M`;
      }
      if (value >= 1_000) {
        return `${(value / 1_000).toFixed(1)}K`;
      }
      if (unit === 'USD') {
        return `$${value.toLocaleString()}`;
      }
      return value.toLocaleString();
    }
    
    return String(value);
  };

  if (!briefing) {
    return (
      <div className={cn('p-4 text-center text-white/30', className)}>
        <Globe2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Economic data loading...</p>
      </div>
    );
  }

  // Full variant - takes entire tile with development tracking
  if (isFull) {
    return (
      <div className={cn('h-full flex flex-col', className)}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-white">Economic Indicators</span>
          </div>
          <span className="text-[10px] text-white/30 px-2 py-0.5 bg-white/5 rounded">
            World Bank Data
          </span>
        </div>

        {/* Main Indicators */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="grid grid-cols-2 gap-3">
            {indicators.map((indicator, index) => {
              const Icon = indicator.icon;
              const value = formatValue(indicator.value, indicator.unit);
              const hasValue = indicator.value !== null && indicator.value !== undefined;
              const isSelected = selectedIndicator === indicator.id;

              return (
                <motion.button
                  key={indicator.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08, duration: 0.3 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedIndicator(isSelected ? null : indicator.id)}
                  className={cn(
                    'p-3 rounded-xl border transition-all text-left',
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500/30 ring-1 ring-emerald-500/30'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-emerald-500/30' : 'bg-white/5'
                    )}>
                      <Icon className={cn('w-5 h-5', indicator.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white/50">{indicator.label}</p>
                      <p className={cn(
                        'text-lg font-bold mt-0.5',
                        hasValue ? 'text-white' : 'text-white/30'
                      )}>
                        {value}
                      </p>
                      {hasValue && indicator.unit && indicator.unit !== 'USD' && (
                        <p className="text-[10px] text-white/40">{indicator.unit}</p>
                      )}
                    </div>

                    {/* Trend Indicator (simulated) */}
                    {hasValue && (
                      <div className="flex items-center gap-1">
                        {index % 3 === 0 ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                        ) : index % 3 === 1 ? (
                          <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                        ) : (
                          <Minus className="w-3.5 h-3.5 text-white/30" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expanded Detail */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-3 pt-3 border-t border-white/10"
                      >
                        <p className="text-xs text-white/60">{indicator.description}</p>
                        
                        {/* Mini Chart */}
                        <div className="mt-2 h-8 flex items-end gap-0.5">
                          {[...Array(8)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ height: 0 }}
                              animate={{ height: `${30 + Math.random() * 70}%` }}
                              transition={{ delay: i * 0.05 }}
                              className="flex-1 bg-gradient-to-t from-emerald-500/50 to-emerald-400/30 rounded-sm"
                            />
                          ))}
                        </div>
                        <p className="text-[9px] text-white/30 mt-1">Historical trend (simulated)</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </div>

          {/* Country Context Footer */}
          {briefing.country_context && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-4 pt-4 border-t border-white/10"
            >
              <div className="flex items-center gap-2 mb-3">
                <Globe2 className="w-3.5 h-3.5 text-white/40" />
                <span className="text-xs text-white/60">Country Profile</span>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-white/40">Capital</span>
                  <span className="text-white">{briefing.country_context.capital || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Difficulty</span>
                  <span className={cn(
                    'font-medium',
                    briefing.difficulty_rating === 'Easy' ? 'text-emerald-400' :
                    briefing.difficulty_rating === 'Medium' ? 'text-amber-400' :
                    briefing.difficulty_rating === 'Hard' ? 'text-orange-400' :
                    'text-red-400'
                  )}>
                    {briefing.difficulty_rating}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/40">Currency</span>
                  <span className="text-white">US Dollar (USD)</span>
                </div>
                {briefing.country_context.typical_work_week && (
                  <div className="flex justify-between">
                    <span className="text-white/40">Work Week</span>
                    <span className="text-white">{briefing.country_context.typical_work_week}</span>
                  </div>
                )}
              </div>

              {/* Ministry Information */}
              {briefing.country_context.ministry_name && (
                <div className="mt-3 p-2 bg-white/5 rounded-lg">
                  <p className="text-[10px] text-white/40 mb-1">Lead Ministry</p>
                  <p className="text-xs text-white font-medium">
                    {briefing.country_context.ministry_name}
                  </p>
                  {briefing.country_context.ministry_abbreviation && (
                    <p className="text-[10px] text-adl-accent">
                      ({briefing.country_context.ministry_abbreviation})
                    </p>
                  )}
                </div>
              )}

              {/* Key Industries */}
              {briefing.country_context.key_industries && briefing.country_context.key_industries.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] text-white/40 mb-1.5">Key Industries</p>
                  <div className="flex flex-wrap gap-1">
                    {briefing.country_context.key_industries.slice(0, 5).map((industry, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-300"
                      >
                        {industry}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* High Risk Sectors */}
              {briefing.country_context.high_risk_sectors && briefing.country_context.high_risk_sectors.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-white/40 mb-1.5">High Risk Sectors</p>
                  <div className="flex flex-wrap gap-1">
                    {briefing.country_context.high_risk_sectors.slice(0, 4).map((sector, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-red-500/10 border border-red-500/20 rounded text-red-300"
                      >
                        {sector}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Default compact variant
  return (
    <div className={cn('', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Building2 className="w-4 h-4 text-white/40" />
        <span className="text-xs font-medium text-white/60">Economic Indicators</span>
        <span className="text-[9px] text-white/30 ml-auto">World Bank Data</span>
      </div>

      {/* Indicators Grid */}
      <div className={cn(
        'grid gap-2',
        compact ? 'grid-cols-2' : 'grid-cols-2'
      )}>
        {indicators.map((indicator, index) => {
          const Icon = indicator.icon;
          const value = formatValue(indicator.value, indicator.unit);
          const hasValue = indicator.value !== null && indicator.value !== undefined;

          return (
            <motion.div
              key={indicator.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className={cn(
                'p-2.5 rounded-lg bg-white/5 border border-white/10',
                'hover:bg-white/10 hover:border-white/20 transition-all'
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                  'bg-white/5'
                )}>
                  <Icon className={cn('w-3.5 h-3.5', indicator.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-white/40 truncate">{indicator.label}</p>
                  <p className={cn(
                    'text-sm font-bold mt-0.5',
                    hasValue ? 'text-white' : 'text-white/30'
                  )}>
                    {value}
                    {hasValue && indicator.unit && indicator.unit !== 'USD' && (
                      <span className="text-[10px] font-normal text-white/40 ml-1">
                        {indicator.unit}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Additional Context */}
      {!compact && briefing.country_context && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 pt-3 border-t border-white/10"
        >
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <Globe2 className="w-3 h-3" />
            <span>Capital: {briefing.country_context.capital || 'N/A'}</span>
          </div>
          {briefing.country_context.key_industries && briefing.country_context.key_industries.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {briefing.country_context.key_industries.slice(0, 3).map((industry, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[9px] bg-white/5 rounded text-white/50"
                >
                  {industry}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/**
 * Compact version for sidebar display
 */
export function EconomicIndicatorsCompact({
  briefing,
  className,
}: {
  briefing: CountryBriefing | null;
  className?: string;
}) {
  const stats = briefing?.key_statistics || {};

  const quickStats = [
    { label: 'GDP/Cap', value: stats.gdp_per_capita, prefix: '$' },
    { label: 'Health', value: stats.health_expenditure_pct, suffix: '% GDP' },
  ];

  return (
    <div className={cn('flex gap-3', className)}>
      {quickStats.map((stat, i) => (
        <div key={i} className="flex-1 text-center">
          <p className="text-[9px] text-white/40">{stat.label}</p>
          <p className="text-xs font-bold text-white">
            {stat.value !== null && stat.value !== undefined ? (
              <>
                {stat.prefix}
                {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                {stat.suffix && <span className="text-white/40 font-normal">{stat.suffix}</span>}
              </>
            ) : (
              'N/A'
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

export default EconomicIndicators;
