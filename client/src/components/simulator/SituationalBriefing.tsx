/**
 * Situational Briefing Component
 * 
 * Full-screen briefing showing country analysis before gameplay
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronDown,
  Globe2,
  TrendingUp,
  Users,
  DollarSign,
  Building,
  Shield,
  Crown,
  Eye,
  Heart,
  ExternalLink,
  Target,
  AlertTriangle,
  Lightbulb,
  Play,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryBriefing, PillarId } from './types';
import { PILLAR_CONFIGS, MATURITY_STAGES } from './types';

interface SituationalBriefingProps {
  briefing: CountryBriefing;
  onAcceptMission: () => void;
}

const PILLAR_ICONS: Record<PillarId, typeof Crown> = {
  governance: Crown,
  hazardControl: Shield,
  healthVigilance: Eye,
  restoration: Heart,
};

export function SituationalBriefing({ briefing, onAcceptMission }: SituationalBriefingProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [selectedPillar, setSelectedPillar] = useState<PillarId | null>(null);

  const maturityStage = MATURITY_STAGES.find(
    s => briefing.ohi_score >= s.minScore && briefing.ohi_score <= s.maxScore
  );

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-slate-900/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img
                src={briefing.flag_url}
                alt={briefing.country_name}
                className="w-16 h-12 object-cover rounded shadow-lg"
              />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {briefing.country_name}
                </h1>
                <p className="text-white/40 text-sm">
                  Intelligence Briefing • {briefing.difficulty_rating} Difficulty
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* OHI Score Badge */}
              <div className="text-center">
                <div className="flex items-center gap-2">
                  <img src="/adl-logo.png" alt="ADL" className="w-6 h-6" />
                  <span className={cn(
                    'text-3xl font-bold',
                    maturityStage?.color === 'emerald' ? 'text-emerald-400' :
                    maturityStage?.color === 'yellow' ? 'text-yellow-400' :
                    maturityStage?.color === 'orange' ? 'text-orange-400' :
                    'text-red-400'
                  )}>
                    {briefing.ohi_score.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-white/40">OHI Score • Rank #{briefing.global_rank}</p>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onAcceptMission}
                className="flex items-center gap-2 px-6 py-3 bg-adl-accent text-white rounded-xl font-semibold hover:bg-adl-blue-light transition-colors"
              >
                <Play className="w-5 h-5" />
                Accept Mission
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-adl-accent/20 to-cyan-500/10 border border-adl-accent/30 rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-adl-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-adl-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Your Mission</h2>
              <p className="text-white/80 leading-relaxed">
                {briefing.mission_statement}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Analysis */}
          <div className="col-span-8 space-y-4">
            {/* Executive Summary */}
            <BriefingSection
              title="Executive Summary"
              icon={<Globe2 className="w-5 h-5 text-adl-accent" />}
              isExpanded={expandedSection === 'overview'}
              onToggle={() => toggleSection('overview')}
            >
              <p className="text-white/70 leading-relaxed">
                {briefing.executive_summary}
              </p>
            </BriefingSection>

            {/* Socioeconomic Context */}
            <BriefingSection
              title="Socioeconomic Context"
              icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
              isExpanded={expandedSection === 'socioeconomic'}
              onToggle={() => toggleSection('socioeconomic')}
            >
              <p className="text-white/70 leading-relaxed whitespace-pre-line">
                {briefing.socioeconomic_context}
              </p>
            </BriefingSection>

            {/* Cultural Factors */}
            <BriefingSection
              title="Cultural & Work Environment"
              icon={<Users className="w-5 h-5 text-blue-400" />}
              isExpanded={expandedSection === 'cultural'}
              onToggle={() => toggleSection('cultural')}
            >
              <p className="text-white/70 leading-relaxed">
                {briefing.cultural_factors}
              </p>
            </BriefingSection>

            {/* Framework Analysis */}
            <BriefingSection
              title="Framework Analysis"
              icon={<Shield className="w-5 h-5 text-teal-400" />}
              isExpanded={expandedSection === 'framework'}
              onToggle={() => toggleSection('framework')}
              defaultExpanded
            >
              <div className="grid grid-cols-2 gap-4">
                {PILLAR_CONFIGS.map(config => {
                  const insight = briefing.pillar_insights[config.id];
                  const score = briefing.pillar_scores[config.id] || 0;
                  const Icon = PILLAR_ICONS[config.id];

                  return (
                    <motion.div
                      key={config.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedPillar(selectedPillar === config.id ? null : config.id)}
                      className={cn(
                        'p-4 rounded-xl border cursor-pointer transition-all',
                        config.bgColor,
                        selectedPillar === config.id
                          ? `${config.borderColor} ring-1 ring-offset-0 ring-offset-transparent`
                          : 'border-white/10 hover:border-white/20'
                      )}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className={cn('w-5 h-5', config.color)} />
                          <span className="font-medium text-white">{config.name}</span>
                        </div>
                        <span className={cn('text-lg font-bold', config.color)}>
                          {score.toFixed(0)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                        <motion.div
                          className={cn('h-full rounded-full', config.color.replace('text-', 'bg-'))}
                          initial={{ width: 0 }}
                          animate={{ width: `${score}%` }}
                          transition={{ duration: 0.5, delay: 0.2 }}
                        />
                      </div>

                      {/* Insight Preview */}
                      <AnimatePresence>
                        {selectedPillar === config.id && insight && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="space-y-2 pt-2 border-t border-white/10"
                          >
                            <p className="text-sm text-white/60">{insight.analysis}</p>
                            {insight.key_issues?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {insight.key_issues.map((issue, i) => (
                                  <span key={i} className="text-xs px-2 py-0.5 bg-red-500/20 text-red-300 rounded">
                                    {issue}
                                  </span>
                                ))}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </BriefingSection>

            {/* Recent Articles */}
            {briefing.recent_articles?.length > 0 && (
              <BriefingSection
                title="Recent Developments"
                icon={<ExternalLink className="w-5 h-5 text-amber-400" />}
                isExpanded={expandedSection === 'articles'}
                onToggle={() => toggleSection('articles')}
              >
                <div className="space-y-3">
                  {briefing.recent_articles.map((article, index) => (
                    <div
                      key={index}
                      className="p-3 bg-white/5 rounded-lg border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-medium text-white">{article.title}</h4>
                          <p className="text-xs text-white/50 mt-1">{article.summary}</p>
                        </div>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded flex-shrink-0',
                          article.relevance === 'governance' ? 'bg-purple-500/20 text-purple-300' :
                          article.relevance === 'hazardControl' ? 'bg-blue-500/20 text-blue-300' :
                          article.relevance === 'healthVigilance' ? 'bg-teal-500/20 text-teal-300' :
                          'bg-amber-500/20 text-amber-300'
                        )}>
                          {article.relevance}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-white/30">
                        <span>{article.source}</span>
                        {article.date && (
                          <>
                            <span>•</span>
                            <span>{article.date}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </BriefingSection>
            )}
          </div>

          {/* Right Column - Stats & Stakeholders */}
          <div className="col-span-4 space-y-4">
            {/* Key Statistics */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Key Statistics</h3>
              <div className="space-y-3">
                <StatRow
                  icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                  label="GDP per Capita"
                  value={briefing.key_statistics.gdp_per_capita
                    ? `$${Number(briefing.key_statistics.gdp_per_capita).toLocaleString()}`
                    : 'N/A'}
                />
                <StatRow
                  icon={<Users className="w-4 h-4 text-blue-400" />}
                  label="Population"
                  value={briefing.key_statistics.population
                    ? `${Number(briefing.key_statistics.population).toLocaleString()}M`
                    : 'N/A'}
                />
                <StatRow
                  icon={<TrendingUp className="w-4 h-4 text-purple-400" />}
                  label="Health Expenditure"
                  value={briefing.key_statistics.health_expenditure_pct
                    ? `${briefing.key_statistics.health_expenditure_pct}% GDP`
                    : 'N/A'}
                />
                <StatRow
                  icon={<Building className="w-4 h-4 text-amber-400" />}
                  label="Labor Force"
                  value={briefing.key_statistics.labor_force
                    ? `${briefing.key_statistics.labor_force}%`
                    : 'N/A'}
                />
              </div>
            </div>

            {/* Key Challenges */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                Key Challenges
              </h3>
              <div className="space-y-2">
                {briefing.key_challenges.map((challenge, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2 bg-red-500/10 rounded-lg"
                  >
                    <span className="text-red-400 font-bold text-sm">{index + 1}</span>
                    <p className="text-sm text-white/70">{challenge}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Stakeholders */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-adl-accent" />
                Key Stakeholders
              </h3>
              <div className="space-y-3">
                {briefing.key_stakeholders.map((stakeholder, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white/5 rounded-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">{stakeholder.name}</p>
                        <p className="text-xs text-white/50">{stakeholder.role}</p>
                        <p className="text-xs text-white/30 mt-1">{stakeholder.institution}</p>
                      </div>
                      <span className={cn(
                        'text-[10px] px-2 py-0.5 rounded',
                        stakeholder.stance === 'supportive' ? 'bg-emerald-500/20 text-emerald-300' :
                        stakeholder.stance === 'critical' ? 'bg-red-500/20 text-red-300' :
                        'bg-white/10 text-white/50'
                      )}>
                        {stakeholder.stance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Country Context */}
            {briefing.country_context && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Quick Facts
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Capital</span>
                    <span className="text-white">{briefing.country_context.capital}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Ministry</span>
                    <span className="text-white text-right text-xs">{briefing.country_context.ministry_abbreviation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Landmark</span>
                    <span className="text-white">{briefing.country_context.iconic_landmark}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center py-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAcceptMission}
            className="inline-flex items-center gap-3 px-10 py-4 bg-adl-accent text-white rounded-xl font-semibold text-lg hover:bg-adl-blue-light transition-colors shadow-lg shadow-adl-accent/25"
          >
            <Play className="w-6 h-6" />
            Begin Simulation
            <ChevronRight className="w-5 h-5" />
          </motion.button>
          <p className="text-white/30 text-sm mt-4">
            Monthly rounds • Real policy decisions • AI-powered outcomes
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function BriefingSection({
  title,
  icon,
  isExpanded,
  onToggle,
  defaultExpanded,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const expanded = defaultExpanded || isExpanded;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-xl overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {icon}
          <span className="font-semibold text-white">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-white/40 transition-transform',
            expanded && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}

export default SituationalBriefing;
