/**
 * Game Over Summary Component
 * 
 * End-game report card with AI-generated narrative and achievements
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Award,
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  Crown,
  Shield,
  Eye,
  Heart,
  Calendar,
  BarChart3,
  RefreshCw,
  Share2,
  Download,
  Sparkles,
  Brain,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { GameStatistics, CycleHistory, CountryData, Achievement } from './types';
import { MATURITY_STAGES, PILLAR_CONFIGS } from './types';
import { OHIScoreDisplay } from './OHIScoreDisplay';
import { runFinalReportWorkflow } from '../../services/api';

// Country flag emoji helper
function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length < 2) return '🏳️';
  const codePoints = isoCode
    .toUpperCase()
    .slice(0, 2)
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

interface GameOverSummaryProps {
  country: CountryData;
  statistics: GameStatistics;
  history: CycleHistory[];
  finalRank: number;
  onPlayAgain: () => void;
  onNewCountry: () => void;
}

export function GameOverSummary({
  country,
  statistics,
  history,
  finalRank,
  onPlayAgain,
  onNewCountry,
}: GameOverSummaryProps) {
  const [narrative, setNarrative] = useState<string>('');
  const [highlights, setHighlights] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [aiGrade, setAiGrade] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);
  
  // Generate narrative using Final Report workflow
  useEffect(() => {
    async function generateFinalReport() {
      try {
        const workflowResult = await runFinalReportWorkflow({
          country_name: country.name,
          history: history.map(h => ({
            cycleNumber: h.cycleNumber || 0,
            year: h.year,
            pillars: h.pillars,
            ohiScore: h.ohiScore,
            rank: h.rank,
            budgetSpent: h.budgetSpent || {},
            policiesActive: h.policiesActive || [],
            eventsOccurred: h.eventsOccurred || [],
            choicesMade: h.choicesMade || {},
          })),
          statistics: {
            totalCyclesPlayed: statistics.totalCyclesPlayed,
            startingOHIScore: statistics.startingOHIScore,
            currentOHIScore: statistics.currentOHIScore,
            peakOHIScore: statistics.peakOHIScore,
            lowestOHIScore: statistics.lowestOHIScore,
            startingRank: statistics.startingRank,
            currentRank: statistics.currentRank,
            bestRank: statistics.bestRank,
            totalBudgetSpent: statistics.totalBudgetSpent,
            policiesMaxed: statistics.policiesMaxed,
            eventsHandled: statistics.eventsHandled,
            criticalEventsManaged: statistics.criticalEventsManaged,
          },
          final_rank: finalRank,
        });
        
        if (workflowResult.success && workflowResult.data) {
          const data = workflowResult.data as Record<string, unknown>;
          setNarrative((data.narrative as string) || '');
          setHighlights((data.highlights as string[]) || []);
          setRecommendations((data.recommendations as string[]) || []);
          setAiGrade((data.grade as string) || '');
        } else {
          throw new Error(workflowResult.errors?.[0] || 'Workflow failed');
        }
      } catch (error) {
        console.error('Failed to generate final report:', error);
        
        // Fallback narrative
        const scoreChange = statistics.currentOHIScore - statistics.startingOHIScore;
        const improved = scoreChange > 0;
        const stage = MATURITY_STAGES.find(
          s => statistics.currentOHIScore >= s.minScore && statistics.currentOHIScore <= s.maxScore
        );
        
        const narratives = improved ? [
          `Under your leadership, ${country.name} has transformed its occupational health landscape. Through strategic investments in governance and worker protection, the nation has risen from a score of ${statistics.startingOHIScore.toFixed(2)} to ${statistics.currentOHIScore.toFixed(2)}, achieving "${stage?.label}" status on the global stage.`,
          `Your tenure as Health Minister will be remembered as a turning point for ${country.name}. The policies you championed have strengthened the pillars of occupational health, reduced workplace fatalities, and created a more resilient system for worker protection.`,
        ] : [
          `Despite the challenges faced, ${country.name}'s occupational health system has shown resilience. While the final score of ${statistics.currentOHIScore.toFixed(2)} reflects ongoing work needed, the foundation has been laid for future improvements.`,
        ];
        
        setNarrative(narratives.join('\n\n'));
      }
      
      setIsGenerating(false);
    }
    
    generateFinalReport();
  }, [country, statistics, history, finalRank]);
  
  // Calculate grade
  const scoreChange = statistics.currentOHIScore - statistics.startingOHIScore;
  const grade = 
    scoreChange >= 1.0 ? 'A+' :
    scoreChange >= 0.7 ? 'A' :
    scoreChange >= 0.5 ? 'B+' :
    scoreChange >= 0.3 ? 'B' :
    scoreChange >= 0.1 ? 'C+' :
    scoreChange >= 0 ? 'C' :
    scoreChange >= -0.3 ? 'D' : 'F';
  
  const gradeColors: Record<string, string> = {
    'A+': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    'A': 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
    'B+': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    'B': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
    'C+': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    'C': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
    'D': 'text-orange-400 bg-orange-500/20 border-orange-500/30',
    'F': 'text-red-400 bg-red-500/20 border-red-500/30',
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-4xl bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-8 pb-6 bg-gradient-to-r from-adl-accent/20 to-purple-500/10 border-b border-white/10">
          <div className="absolute top-4 right-4">
            <div className={cn(
              'px-4 py-2 rounded-xl border text-2xl font-bold',
              gradeColors[grade]
            )}>
              {grade}
            </div>
          </div>
          
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{getCountryFlag(country.iso_code)}</span>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Simulation Complete
              </h1>
              <p className="text-white/60">
                {country.name} • {history[0]?.year || 2025} - {history[history.length - 1]?.year || 2050}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-8">
            <OHIScoreDisplay
              score={statistics.currentOHIScore}
              previousScore={statistics.startingOHIScore}
              size="md"
              animated
            />
            
            <div className="flex-1 grid grid-cols-3 gap-4">
              <StatCard
                icon={TrendingUp}
                label="Score Change"
                value={`${scoreChange > 0 ? '+' : ''}${scoreChange.toFixed(2)}`}
                color={scoreChange > 0 ? 'text-emerald-400' : 'text-red-400'}
              />
              <StatCard
                icon={Trophy}
                label="Final Rank"
                value={`#${finalRank}`}
                subtext={`Started #${statistics.startingRank}`}
                color="text-amber-400"
              />
              <StatCard
                icon={Calendar}
                label="Cycles Played"
                value={`${statistics.totalCyclesPlayed}`}
                subtext={`${statistics.totalCyclesPlayed * 5} years`}
                color="text-blue-400"
              />
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-8 space-y-6">
          {/* AI Narrative */}
          <div className="bg-white/5 rounded-xl p-6 border border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-adl-accent" />
              <h2 className="text-lg font-semibold text-white">Your Legacy</h2>
            </div>
            
            {isGenerating ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/60">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Brain className="w-5 h-5 text-adl-accent" />
                  </motion.div>
                  <span>Preparing your comprehensive legacy report...</span>
                </div>
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 text-sm text-white/40"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Analyzing performance metrics...
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className="flex items-center gap-2 text-sm text-white/40"
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                    Synthesizing narrative assessment...
                  </motion.div>
                </div>
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-white/70 leading-relaxed whitespace-pre-line"
              >
                {narrative}
              </motion.p>
            )}
          </div>
          
          {/* Pillar Summary */}
          <div className="grid grid-cols-4 gap-4">
            {PILLAR_CONFIGS.map(config => {
              const finalScore = history[history.length - 1]?.pillars?.[config.id] || 50;
              const startScore = history[0]?.pillars?.[config.id] || 50;
              const change = finalScore - startScore;
              
              return (
                <div
                  key={config.id}
                  className={cn(
                    'p-4 rounded-xl border',
                    config.bgColor,
                    config.borderColor
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {config.id === 'governance' && <Crown className={cn('w-4 h-4', config.color)} />}
                    {config.id === 'hazardControl' && <Shield className={cn('w-4 h-4', config.color)} />}
                    {config.id === 'healthVigilance' && <Eye className={cn('w-4 h-4', config.color)} />}
                    {config.id === 'restoration' && <Heart className={cn('w-4 h-4', config.color)} />}
                    <span className={cn('text-sm font-medium', config.color)}>{config.name}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-2xl font-bold text-white">{Math.round(finalScore)}</span>
                    <span className={cn(
                      'text-sm font-medium',
                      change > 0 ? 'text-emerald-400' : change < 0 ? 'text-red-400' : 'text-white/40'
                    )}>
                      {change > 0 ? '+' : ''}{Math.round(change)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Achievements */}
          {statistics.achievements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Achievements Unlocked ({statistics.achievements.length})
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {statistics.achievements.map((achievement, i) => (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center"
                  >
                    <Star className="w-6 h-6 text-amber-400 mx-auto mb-2" />
                    <p className="text-xs font-medium text-amber-400">{achievement.name}</p>
                    <p className="text-[10px] text-white/40 mt-1">{achievement.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {/* Key Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <MiniStat label="Peak Score" value={statistics.peakOHIScore.toFixed(2)} />
            <MiniStat label="Best Rank" value={`#${statistics.bestRank}`} />
            <MiniStat label="Budget Spent" value={`${statistics.totalBudgetSpent} pts`} />
            <MiniStat label="Events Handled" value={`${statistics.eventsHandled}`} />
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onNewCountry}
              className="px-6 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            >
              New Country
            </button>
            <button
              onClick={onPlayAgain}
              className="px-6 py-2.5 rounded-xl bg-adl-accent text-white font-medium hover:bg-adl-blue-light transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Play Again
            </button>
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
  subtext,
  color,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-xs text-white/40">{label}</span>
      </div>
      <p className={cn('text-xl font-bold', color)}>{value}</p>
      {subtext && <p className="text-[10px] text-white/30">{subtext}</p>}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 rounded-lg p-3 text-center">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default GameOverSummary;
