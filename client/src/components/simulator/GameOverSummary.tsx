/**
 * Game Over Summary Component
 * 
 * End-game report card with AI-generated narrative and achievements
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Award,
  Target,
  Calendar,
  Wallet,
  Star,
  ArrowRight,
  RefreshCw,
  Download,
  Share2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { OHIScoreDisplay } from './OHIScoreDisplay';
import type { GameStatistics, CycleHistory, CountryData, Achievement } from './types';

interface GameOverSummaryProps {
  country: CountryData;
  statistics: GameStatistics;
  history: CycleHistory[];
  onPlayAgain: () => void;
  onNewCountry: () => void;
}

export function GameOverSummary({
  country,
  statistics,
  history,
  onPlayAgain,
  onNewCountry,
}: GameOverSummaryProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const scoreChange = statistics.currentOHIScore - statistics.startingOHIScore;
  const rankChange = statistics.startingRank - statistics.currentRank;
  
  // Calculate grade based on improvement
  const getGrade = () => {
    if (scoreChange >= 1.5) return { grade: 'A+', color: 'text-emerald-400', description: 'Exceptional Leadership' };
    if (scoreChange >= 1.0) return { grade: 'A', color: 'text-emerald-400', description: 'Outstanding Progress' };
    if (scoreChange >= 0.7) return { grade: 'B+', color: 'text-lime-400', description: 'Significant Improvement' };
    if (scoreChange >= 0.4) return { grade: 'B', color: 'text-lime-400', description: 'Good Progress' };
    if (scoreChange >= 0.2) return { grade: 'C+', color: 'text-yellow-400', description: 'Moderate Improvement' };
    if (scoreChange >= 0) return { grade: 'C', color: 'text-yellow-400', description: 'Maintained Status' };
    if (scoreChange >= -0.3) return { grade: 'D', color: 'text-orange-400', description: 'Slight Decline' };
    return { grade: 'F', color: 'text-red-400', description: 'Needs Improvement' };
  };
  
  const gradeInfo = getGrade();
  
  // Generate summary narrative
  const generateNarrative = () => {
    const years = history.length * 5;
    const direction = scoreChange > 0 ? 'improved' : scoreChange < 0 ? 'declined' : 'maintained';
    
    let narrative = `Over ${years} years of leadership, ${country.name} has ${direction} its occupational health standing. `;
    
    if (scoreChange > 0.5) {
      narrative += `Your strategic investments in worker protection have paid off handsomely, moving the country from rank #${statistics.startingRank} to #${statistics.currentRank}. `;
    } else if (scoreChange > 0) {
      narrative += `While progress was made, there remains room for more ambitious reforms. `;
    } else if (scoreChange < 0) {
      narrative += `The country faced significant challenges that impacted worker safety outcomes. `;
    }
    
    if (statistics.policiesMaxed > 5) {
      narrative += `You successfully maximized ${statistics.policiesMaxed} policies, demonstrating commitment to comprehensive reform. `;
    }
    
    if (statistics.criticalEventsManaged > 0) {
      narrative += `Your administration navigated ${statistics.criticalEventsManaged} critical events, testing your crisis management abilities. `;
    }
    
    return narrative;
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full max-w-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="relative p-8 pb-6 bg-gradient-to-r from-adl-accent/20 to-cyan-500/10 border-b border-white/10">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-adl-accent rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-cyan-500 rounded-full blur-3xl" />
          </div>
          
          <div className="relative flex items-center justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 mb-2"
              >
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-sm text-white/60">Simulation Complete</span>
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-bold text-white mb-1"
              >
                {country.name} Report Card
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/50"
              >
                {statistics.totalCyclesPlayed * 5} Years of Occupational Health Leadership
              </motion.p>
            </div>
            
            {/* Grade */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: 'spring' }}
              className="text-center"
            >
              <div className={cn(
                'w-24 h-24 rounded-2xl flex items-center justify-center text-5xl font-black',
                'bg-white/10 border-2 border-white/20'
              )}>
                <span className={gradeInfo.color}>{gradeInfo.grade}</span>
              </div>
              <p className="text-xs text-white/50 mt-2">{gradeInfo.description}</p>
            </motion.div>
          </div>
        </div>
        
        {/* Score Comparison */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-3 gap-6">
            {/* Starting */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Starting</p>
              <p className="text-3xl font-bold text-white/60">{statistics.startingOHIScore.toFixed(2)}</p>
              <p className="text-sm text-white/40">Rank #{statistics.startingRank}</p>
            </motion.div>
            
            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-center"
            >
              <div className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full',
                scoreChange > 0 ? 'bg-emerald-500/20 text-emerald-400' :
                scoreChange < 0 ? 'bg-red-500/20 text-red-400' :
                'bg-white/10 text-white/40'
              )}>
                {scoreChange > 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : scoreChange < 0 ? (
                  <TrendingDown className="w-5 h-5" />
                ) : (
                  <ArrowRight className="w-5 h-5" />
                )}
                <span className="font-bold">
                  {scoreChange > 0 ? '+' : ''}{scoreChange.toFixed(2)}
                </span>
              </div>
            </motion.div>
            
            {/* Final */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="text-center"
            >
              <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Final</p>
              <p className="text-3xl font-bold text-adl-accent">{statistics.currentOHIScore.toFixed(2)}</p>
              <p className="text-sm text-white/40">Rank #{statistics.currentRank}</p>
            </motion.div>
          </div>
        </div>
        
        {/* Statistics Grid */}
        <div className="p-6 border-b border-white/10">
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={Calendar}
              label="Cycles Played"
              value={statistics.totalCyclesPlayed.toString()}
              delay={0.7}
            />
            <StatCard
              icon={Target}
              label="Policies Maxed"
              value={statistics.policiesMaxed.toString()}
              delay={0.75}
            />
            <StatCard
              icon={Wallet}
              label="Budget Spent"
              value={`${Math.round(statistics.totalBudgetSpent / 1000)}K`}
              delay={0.8}
            />
            <StatCard
              icon={Award}
              label="Best Rank"
              value={`#${statistics.bestRank}`}
              delay={0.85}
            />
          </div>
        </div>
        
        {/* Narrative */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="p-6 border-b border-white/10"
        >
          <p className="text-white/70 leading-relaxed italic">
            "{generateNarrative()}"
          </p>
        </motion.div>
        
        {/* Achievements */}
        {statistics.achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="p-6 border-b border-white/10"
          >
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              Achievements Unlocked ({statistics.achievements.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {statistics.achievements.map((achievement, i) => (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.05 }}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full"
                >
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-amber-400 font-medium">
                    {achievement.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Actions */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white/60 transition-colors">
              <Share2 className="w-4 h-4" />
              <span className="text-sm">Share</span>
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-white/40 hover:text-white/60 transition-colors">
              <Download className="w-4 h-4" />
              <span className="text-sm">Export</span>
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewCountry}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              New Country
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onPlayAgain}
              className="flex items-center gap-2 px-6 py-2 bg-adl-accent text-white rounded-lg font-semibold hover:bg-adl-blue-light transition-all"
            >
              Play Again
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  delay,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-white/5 rounded-xl p-4 text-center"
    >
      <Icon className="w-5 h-5 text-white/30 mx-auto mb-2" />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/40">{label}</p>
    </motion.div>
  );
}

export default GameOverSummary;
