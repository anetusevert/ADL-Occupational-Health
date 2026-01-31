/**
 * Statistics Dashboard Component
 * 
 * OHI gauge, radar chart, trend graphs, and key metrics
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Target,
  Award,
  Skull,
  Users,
  HeartPulse,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { 
  PillarScores, 
  CycleHistory, 
  GameStatistics,
  Achievement,
} from './types';
import { PILLAR_CONFIGS, MATURITY_STAGES } from './types';
import { OHIScoreDisplay } from './OHIScoreDisplay';
import { RankingSummary } from './RankingsLadder';

interface StatsDashboardProps {
  ohiScore: number;
  previousScore?: number;
  pillars: PillarScores;
  rank: number;
  previousRank?: number;
  history: CycleHistory[];
  statistics: GameStatistics;
  currentYear: number;
  compact?: boolean;
}

export function StatsDashboard({
  ohiScore,
  previousScore,
  pillars,
  rank,
  previousRank,
  history,
  statistics,
  currentYear,
  compact = false,
}: StatsDashboardProps) {
  if (compact) {
    return (
      <div className="space-y-4">
        {/* Score */}
        <div className="flex justify-center">
          <OHIScoreDisplay
            score={ohiScore}
            previousScore={previousScore}
            size="md"
            animated
          />
        </div>
        
        {/* Ranking */}
        <div className="flex justify-center">
          <RankingSummary rank={rank} previousRank={previousRank} />
        </div>
        
        {/* Mini Pillar Bars */}
        <div className="space-y-2">
          {PILLAR_CONFIGS.map(config => (
            <div key={config.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={cn('font-medium', config.color)}>{config.name}</span>
                <span className="text-white/60">{Math.round(pillars[config.id])}</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className={cn('h-full rounded-full',
                    config.id === 'governance' ? 'bg-purple-500' :
                    config.id === 'hazardControl' ? 'bg-blue-500' :
                    config.id === 'healthVigilance' ? 'bg-teal-500' :
                    'bg-amber-500'
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${pillars[config.id]}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* OHI Score Display */}
      <div className="flex-shrink-0 flex justify-center py-2">
        <OHIScoreDisplay
          score={ohiScore}
          previousScore={previousScore}
          size="lg"
          animated
        />
      </div>
      
      {/* Ranking */}
      <div className="flex-shrink-0 flex justify-center">
        <RankingSummary rank={rank} previousRank={previousRank} />
      </div>
      
      {/* Pillar Radar Chart */}
      <div className="flex-shrink-0">
        <PillarRadarChart pillars={pillars} />
      </div>
      
      {/* Score Timeline */}
      {history.length > 0 && (
        <div className="flex-shrink-0">
          <ScoreTimeline history={history} currentYear={currentYear} />
        </div>
      )}
      
      {/* Key Metrics */}
      <div className="flex-1 min-h-0 overflow-auto">
        <KeyMetrics statistics={statistics} />
      </div>
      
      {/* Recent Achievements */}
      {statistics.achievements.length > 0 && (
        <div className="flex-shrink-0">
          <RecentAchievements achievements={statistics.achievements.slice(-3)} />
        </div>
      )}
    </div>
  );
}

/**
 * Pillar Radar Chart
 */
function PillarRadarChart({ pillars }: { pillars: PillarScores }) {
  const size = 140;
  const center = size / 2;
  const maxRadius = size / 2 - 20;
  
  const points = useMemo(() => {
    const pillarKeys: (keyof PillarScores)[] = ['governance', 'hazardControl', 'healthVigilance', 'restoration'];
    return pillarKeys.map((key, i) => {
      const angle = (i * 90 - 90) * (Math.PI / 180);
      const value = pillars[key] / 100;
      const radius = value * maxRadius;
      return {
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
        key,
        value: pillars[key],
      };
    });
  }, [pillars, center, maxRadius]);
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  
  return (
    <div className="flex justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="absolute inset-0">
          {/* Background rings */}
          {[25, 50, 75, 100].map(pct => (
            <circle
              key={pct}
              cx={center}
              cy={center}
              r={(pct / 100) * maxRadius}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={1}
            />
          ))}
          
          {/* Axis lines */}
          {[0, 90, 180, 270].map(angle => {
            const rad = (angle - 90) * (Math.PI / 180);
            return (
              <line
                key={angle}
                x1={center}
                y1={center}
                x2={center + Math.cos(rad) * maxRadius}
                y2={center + Math.sin(rad) * maxRadius}
                stroke="rgba(255,255,255,0.1)"
                strokeWidth={1}
              />
            );
          })}
          
          {/* Value polygon */}
          <motion.path
            d={pathD}
            fill="rgba(6, 182, 212, 0.2)"
            stroke="rgb(6, 182, 212)"
            strokeWidth={2}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Value points */}
          {points.map((point, i) => (
            <motion.circle
              key={point.key}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={
                point.key === 'governance' ? '#a855f7' :
                point.key === 'hazardControl' ? '#3b82f6' :
                point.key === 'healthVigilance' ? '#14b8a6' :
                '#f59e0b'
              }
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          ))}
        </svg>
        
        {/* Labels */}
        {[
          { key: 'governance', label: 'Gov', x: center, y: 5 },
          { key: 'hazardControl', label: 'Haz', x: size - 10, y: center },
          { key: 'healthVigilance', label: 'Vig', x: center, y: size - 5 },
          { key: 'restoration', label: 'Res', x: 10, y: center },
        ].map(item => (
          <div
            key={item.key}
            className="absolute text-[10px] text-white/60 font-medium"
            style={{ 
              left: item.x, 
              top: item.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Score Timeline Chart
 */
function ScoreTimeline({ 
  history, 
  currentYear 
}: { 
  history: CycleHistory[];
  currentYear: number;
}) {
  if (history.length < 2) return null;
  
  const width = 200;
  const height = 60;
  const padding = 10;
  
  const scores = history.map(h => h.ohiScore);
  const minScore = Math.min(...scores) - 0.2;
  const maxScore = Math.max(...scores) + 0.2;
  
  const points = history.map((h, i) => {
    const x = padding + (i / (history.length - 1)) * (width - padding * 2);
    const y = height - padding - ((h.ohiScore - minScore) / (maxScore - minScore)) * (height - padding * 2);
    return { x, y, score: h.ohiScore, year: h.year };
  });
  
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/40">Score History</span>
        <Activity className="w-3 h-3 text-white/30" />
      </div>
      
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[1, 2, 3, 4].map(score => {
          const y = height - padding - ((score - minScore) / (maxScore - minScore)) * (height - padding * 2);
          return (
            <line
              key={score}
              x1={padding}
              y1={y}
              x2={width - padding}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          );
        })}
        
        {/* Line */}
        <motion.path
          d={pathD}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth={2}
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1 }}
        />
        
        {/* Gradient */}
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        
        {/* Current point */}
        {points.length > 0 && (
          <motion.circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={4}
            fill="#06b6d4"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1 }}
          />
        )}
      </svg>
    </div>
  );
}

/**
 * Key Metrics Display
 */
function KeyMetrics({ statistics }: { statistics: GameStatistics }) {
  const metrics = [
    {
      label: 'Progress',
      value: `+${(statistics.currentOHIScore - statistics.startingOHIScore).toFixed(2)}`,
      icon: TrendingUp,
      color: statistics.currentOHIScore > statistics.startingOHIScore ? 'text-emerald-400' : 'text-red-400',
    },
    {
      label: 'Peak Score',
      value: statistics.peakOHIScore.toFixed(2),
      icon: Target,
      color: 'text-adl-accent',
    },
    {
      label: 'Best Rank',
      value: `#${statistics.bestRank}`,
      icon: Award,
      color: 'text-amber-400',
    },
    {
      label: 'Budget Spent',
      value: `${statistics.totalBudgetSpent}`,
      icon: BarChart3,
      color: 'text-blue-400',
    },
  ];
  
  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map(metric => (
        <div key={metric.label} className="bg-white/5 rounded-lg p-2">
          <div className="flex items-center gap-1.5 mb-1">
            <metric.icon className={cn('w-3 h-3', metric.color)} />
            <span className="text-[10px] text-white/40">{metric.label}</span>
          </div>
          <p className={cn('text-sm font-bold', metric.color)}>{metric.value}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Recent Achievements
 */
function RecentAchievements({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="space-y-2">
      <span className="text-xs text-white/40">Recent Achievements</span>
      <div className="flex gap-2">
        {achievements.map(achievement => (
          <motion.div
            key={achievement.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex-1 bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 text-center"
          >
            <Award className="w-4 h-4 text-amber-400 mx-auto mb-1" />
            <p className="text-[10px] text-amber-400 font-medium truncate">
              {achievement.name}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default StatsDashboard;
