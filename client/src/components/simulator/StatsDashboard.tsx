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
  Trophy,
  Target,
  Activity,
  Users,
  AlertTriangle,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts';
import { cn } from '../../lib/utils';
import { OHIScoreDisplay } from './OHIScoreDisplay';
import { RankingSummary } from './RankingsLadder';
import type { 
  PillarScores, 
  GameStatistics, 
  CycleHistory,
  Achievement,
} from './types';

interface StatsDashboardProps {
  pillars: PillarScores;
  previousPillars?: PillarScores;
  ohiScore: number;
  previousScore?: number;
  rank: number;
  previousRank?: number;
  statistics: GameStatistics;
  history: CycleHistory[];
  currentYear: number;
  compact?: boolean;
}

export function StatsDashboard({
  pillars,
  previousPillars,
  ohiScore,
  previousScore,
  rank,
  previousRank,
  statistics,
  history,
  currentYear,
  compact = false,
}: StatsDashboardProps) {
  // Radar chart data
  const radarData = useMemo(() => [
    { subject: 'Governance', value: pillars.governance, fullMark: 100 },
    { subject: 'Hazard Control', value: pillars.hazardControl, fullMark: 100 },
    { subject: 'Health Vigilance', value: pillars.healthVigilance, fullMark: 100 },
    { subject: 'Restoration', value: pillars.restoration, fullMark: 100 },
  ], [pillars]);
  
  // History chart data
  const historyData = useMemo(() => {
    return history.map(h => ({
      year: h.year,
      score: h.ohiScore,
      rank: h.rank,
    }));
  }, [history]);
  
  if (compact) {
    return (
      <div className="space-y-4">
        {/* OHI Score */}
        <div className="flex justify-center">
          <OHIScoreDisplay
            score={ohiScore}
            previousScore={previousScore}
            size="sm"
          />
        </div>
        
        {/* Mini Radar */}
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 8 }}
              />
              <Radar
                dataKey="value"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.3}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Ranking */}
        <RankingSummary rank={rank} previousRank={previousRank} />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Main Score Display */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <OHIScoreDisplay
            score={ohiScore}
            previousScore={previousScore}
            size="lg"
          />
          
          <div className="flex-1 max-w-[200px] ml-6">
            {/* Mini Ranking */}
            <div className="mb-4">
              <RankingSummary rank={rank} previousRank={previousRank} />
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 gap-2">
              <StatMini
                label="Cycles"
                value={statistics.totalCyclesPlayed}
                icon={Activity}
              />
              <StatMini
                label="Policies"
                value={statistics.policiesMaxed}
                icon={Target}
              />
              <StatMini
                label="Best Rank"
                value={`#${statistics.bestRank}`}
                icon={Trophy}
              />
              <StatMini
                label="Events"
                value={statistics.eventsHandled}
                icon={AlertTriangle}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Pillar Radar Chart */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-adl-accent" />
          Pillar Balance
        </h3>
        
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10 }}
              />
              <Radar
                dataKey="value"
                stroke="#06b6d4"
                fill="#06b6d4"
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Pillar Values */}
        <div className="grid grid-cols-4 gap-2 mt-2">
          <PillarMini label="Gov" value={pillars.governance} color="purple" />
          <PillarMini label="Haz" value={pillars.hazardControl} color="blue" />
          <PillarMini label="Vig" value={pillars.healthVigilance} color="teal" />
          <PillarMini label="Res" value={pillars.restoration} color="amber" />
        </div>
      </div>
      
      {/* Score History Chart */}
      {history.length > 1 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-adl-accent" />
            Score Progression
          </h3>
          
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <YAxis 
                  domain={[1, 4]}
                  tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,0,0.8)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fill="url(#scoreGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Achievements */}
      {statistics.achievements.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Achievements
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {statistics.achievements.slice(-6).map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg"
              >
                <Award className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">
                  {achievement.name}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatMini({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-2 text-center">
      <Icon className="w-3.5 h-3.5 text-white/30 mx-auto mb-1" />
      <p className="text-sm font-bold text-white">{value}</p>
      <p className="text-[9px] text-white/40">{label}</p>
    </div>
  );
}

function PillarMini({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'purple' | 'blue' | 'teal' | 'amber';
}) {
  const colorClasses = {
    purple: 'text-purple-400 bg-purple-500/20',
    blue: 'text-blue-400 bg-blue-500/20',
    teal: 'text-teal-400 bg-teal-500/20',
    amber: 'text-amber-400 bg-amber-500/20',
  };
  
  return (
    <div className={cn('rounded-lg p-2 text-center', colorClasses[color].split(' ')[1])}>
      <p className={cn('text-lg font-bold', colorClasses[color].split(' ')[0])}>
        {Math.round(value)}
      </p>
      <p className="text-[9px] text-white/40">{label}</p>
    </div>
  );
}

export default StatsDashboard;
