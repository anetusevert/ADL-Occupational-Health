/**
 * OHIDeltaChart Component
 * 
 * Visualizes OHI score progression from starting point
 * Shows delta trend over time with animated line chart
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CycleHistory } from './types';

interface OHIDeltaChartProps {
  history: CycleHistory[];
  currentScore: number;
  startingScore: number;
  className?: string;
  compact?: boolean;
}

export function OHIDeltaChart({
  history,
  currentScore,
  startingScore,
  className,
  compact = false,
}: OHIDeltaChartProps) {
  const delta = currentScore - startingScore;
  const isPositive = delta > 0;
  const isNeutral = Math.abs(delta) < 0.01;

  // Prepare chart data points
  const chartData = useMemo(() => {
    const points = [{ x: 0, y: startingScore, label: 'Start' }];
    
    history.forEach((cycle, index) => {
      points.push({
        x: index + 1,
        y: cycle.ohiScore,
        label: `Y${cycle.year}`,
      });
    });

    // Add current if different from last history point
    if (history.length === 0 || history[history.length - 1].ohiScore !== currentScore) {
      points.push({
        x: points.length,
        y: currentScore,
        label: 'Now',
      });
    }

    return points;
  }, [history, currentScore, startingScore]);

  // Calculate chart dimensions
  const minScore = Math.min(...chartData.map(p => p.y), 1.0);
  const maxScore = Math.max(...chartData.map(p => p.y), 4.0);
  const scoreRange = maxScore - minScore || 1;
  
  const chartWidth = 100;
  const chartHeight = compact ? 40 : 60;
  const padding = 2;

  // Generate SVG path
  const pathData = useMemo(() => {
    if (chartData.length < 2) return '';

    const xStep = (chartWidth - padding * 2) / Math.max(chartData.length - 1, 1);
    
    return chartData.map((point, index) => {
      const x = padding + index * xStep;
      const y = chartHeight - padding - ((point.y - minScore) / scoreRange) * (chartHeight - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }, [chartData, chartWidth, chartHeight, minScore, scoreRange, padding]);

  // Area fill path
  const areaPath = useMemo(() => {
    if (chartData.length < 2) return '';
    
    const xStep = (chartWidth - padding * 2) / Math.max(chartData.length - 1, 1);
    const baseline = chartHeight - padding;
    
    let path = chartData.map((point, index) => {
      const x = padding + index * xStep;
      const y = chartHeight - padding - ((point.y - minScore) / scoreRange) * (chartHeight - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');

    // Close the path
    const lastX = padding + (chartData.length - 1) * xStep;
    path += ` L ${lastX} ${baseline} L ${padding} ${baseline} Z`;
    
    return path;
  }, [chartData, chartWidth, chartHeight, minScore, scoreRange, padding]);

  return (
    <div className={cn('', className)}>
      {/* Header with Delta */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs font-medium text-white/60">Score Progress</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold',
            isNeutral ? 'bg-slate-500/20 text-slate-400' :
            isPositive ? 'bg-emerald-500/20 text-emerald-400' :
            'bg-red-500/20 text-red-400'
          )}
        >
          {isNeutral ? (
            <Minus className="w-3 h-3" />
          ) : isPositive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{isPositive ? '+' : ''}{delta.toFixed(2)}</span>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="relative bg-white/5 rounded-lg p-2 border border-white/10">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          style={{ height: compact ? '40px' : '60px' }}
          preserveAspectRatio="none"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.4" />
              <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} />
            </linearGradient>
          </defs>

          {/* Reference line at starting score */}
          <line
            x1={padding}
            y1={chartHeight - padding - ((startingScore - minScore) / scoreRange) * (chartHeight - padding * 2)}
            x2={chartWidth - padding}
            y2={chartHeight - padding - ((startingScore - minScore) / scoreRange) * (chartHeight - padding * 2)}
            stroke="rgba(255,255,255,0.1)"
            strokeDasharray="4 2"
            strokeWidth="1"
          />

          {/* Area Fill */}
          <motion.path
            d={areaPath}
            fill="url(#scoreGradient)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Line */}
          <motion.path
            d={pathData}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Data Points */}
          {chartData.map((point, index) => {
            const xStep = (chartWidth - padding * 2) / Math.max(chartData.length - 1, 1);
            const x = padding + index * xStep;
            const y = chartHeight - padding - ((point.y - minScore) / scoreRange) * (chartHeight - padding * 2);
            
            return (
              <motion.circle
                key={index}
                cx={x}
                cy={y}
                r={index === chartData.length - 1 ? 3 : 2}
                fill={index === chartData.length - 1 ? '#06b6d4' : 'rgba(255,255,255,0.4)'}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              />
            );
          })}
        </svg>

        {/* Labels */}
        {!compact && chartData.length > 1 && (
          <div className="flex justify-between mt-1 px-1">
            <span className="text-[9px] text-white/30">{startingScore.toFixed(2)}</span>
            <span className="text-[9px] text-white/30">→</span>
            <span className={cn(
              'text-[9px] font-medium',
              isPositive ? 'text-emerald-400' : isNeutral ? 'text-white/50' : 'text-red-400'
            )}>
              {currentScore.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Score Labels */}
      <div className="flex justify-between mt-2 text-[10px]">
        <div className="text-white/40">
          <span className="block">Starting</span>
          <span className="text-white/70 font-medium">{startingScore.toFixed(2)}</span>
        </div>
        <div className="text-right">
          <span className="block text-white/40">Current</span>
          <span className={cn(
            'font-bold',
            isPositive ? 'text-emerald-400' : isNeutral ? 'text-white' : 'text-red-400'
          )}>
            {currentScore.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default OHIDeltaChart;
