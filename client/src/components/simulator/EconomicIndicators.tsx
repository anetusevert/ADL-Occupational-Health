/**
 * EconomicIndicators Component
 * 
 * Displays World Bank-style economic data for the country
 * Shows real-time indicators like GDP, health expenditure, labor force
 */

import { motion } from 'framer-motion';
import {
  DollarSign,
  Users,
  Activity,
  Briefcase,
  Building2,
  TrendingUp,
  Globe2,
  HeartPulse,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryBriefing } from './types';

interface EconomicIndicatorsProps {
  briefing: CountryBriefing | null;
  className?: string;
  compact?: boolean;
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
}: EconomicIndicatorsProps) {
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
