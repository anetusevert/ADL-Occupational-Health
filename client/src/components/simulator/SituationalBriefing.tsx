/**
 * Situational Briefing Component
 * 
 * Full-screen briefing showing country analysis before gameplay
 * Redesigned: No scrolling, uses modals for detailed information
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
  FileText,
  Briefcase,
  Newspaper,
  Info,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { CountryBriefing, PillarId } from './types';
import { PILLAR_CONFIGS, MATURITY_STAGES } from './types';
import { BriefingModal, InfoCard } from './BriefingModal';
import { CountrySlideshow, CountryProfile } from './CountrySlideshow';
import { EconomicIndicators } from './EconomicIndicators';

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

type ModalType = 'executive' | 'socioeconomic' | 'cultural' | 'stakeholders' | 'articles' | 'pillar' | null;

export function SituationalBriefing({ briefing, onAcceptMission }: SituationalBriefingProps) {
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedPillar, setSelectedPillar] = useState<PillarId | null>(null);

  const maturityStage = MATURITY_STAGES.find(
    s => briefing.ohi_score >= s.minScore && briefing.ohi_score <= s.maxScore
  );

  const openPillarModal = (pillar: PillarId) => {
    setSelectedPillar(pillar);
    setActiveModal('pillar');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden">
      {/* Fixed Header with Flag */}
      <div className="flex-shrink-0 bg-slate-900/90 backdrop-blur-sm border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.img
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                src={briefing.flag_url}
                alt={briefing.country_name}
                className="w-16 h-12 object-cover rounded shadow-lg border border-white/20"
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
                className="flex items-center gap-2 px-6 py-3 bg-adl-accent text-white rounded-xl font-semibold hover:bg-adl-blue-light transition-colors shadow-lg shadow-adl-accent/25"
              >
                <Play className="w-5 h-5" />
                Accept Mission
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - No Scroll, Fixed Layout */}
      <div className="flex-1 min-h-0 p-6">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-12 gap-4">
          {/* Left Column - Mission & Quick Actions */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* Mission Statement */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-gradient-to-br from-adl-accent/20 to-cyan-500/10 border border-adl-accent/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-adl-accent" />
                <h2 className="font-semibold text-white">Your Mission</h2>
              </div>
              <p className="text-sm text-white/80 leading-relaxed">
                {briefing.mission_statement}
              </p>
            </motion.div>

            {/* Info Cards - Click to open modals */}
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
              <InfoCard
                title="Executive Summary"
                preview={briefing.executive_summary?.substring(0, 60) + '...' || 'View summary'}
                icon={<Globe2 className="w-4 h-4" />}
                color="text-adl-accent"
                onClick={() => setActiveModal('executive')}
              />
              <InfoCard
                title="Socioeconomic Context"
                preview={briefing.socioeconomic_context?.substring(0, 60) + '...' || 'View context'}
                icon={<TrendingUp className="w-4 h-4" />}
                color="text-purple-400"
                onClick={() => setActiveModal('socioeconomic')}
              />
              <InfoCard
                title="Cultural Factors"
                preview={briefing.cultural_factors?.substring(0, 60) + '...' || 'View factors'}
                icon={<Users className="w-4 h-4" />}
                color="text-blue-400"
                onClick={() => setActiveModal('cultural')}
              />
              {briefing.key_stakeholders?.length > 0 && (
                <InfoCard
                  title="Key Stakeholders"
                  preview={`${briefing.key_stakeholders.length} stakeholders identified`}
                  icon={<Briefcase className="w-4 h-4" />}
                  color="text-amber-400"
                  onClick={() => setActiveModal('stakeholders')}
                />
              )}
              {briefing.recent_articles?.length > 0 && (
                <InfoCard
                  title="Recent Developments"
                  preview={`${briefing.recent_articles.length} articles found`}
                  icon={<Newspaper className="w-4 h-4" />}
                  color="text-teal-400"
                  onClick={() => setActiveModal('articles')}
                />
              )}
            </div>

            {/* Key Challenges */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-medium text-white">Key Challenges</span>
              </div>
              <div className="space-y-1">
                {briefing.key_challenges.slice(0, 3).map((challenge, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-red-400 font-bold">{i + 1}</span>
                    <span className="text-white/60 line-clamp-1">{challenge}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column - Framework Analysis */}
          <div className="col-span-5 flex flex-col gap-4">
            {/* Framework Pillars */}
            <div className="flex-1 grid grid-cols-2 gap-3">
              {PILLAR_CONFIGS.map((config, index) => {
                const insight = briefing.pillar_insights[config.id];
                const score = briefing.pillar_scores[config.id] || 0;
                const Icon = PILLAR_ICONS[config.id];

                return (
                  <motion.button
                    key={config.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openPillarModal(config.id)}
                    className={cn(
                      'p-4 rounded-xl border text-left transition-all',
                      config.bgColor,
                      'border-white/10 hover:border-white/30'
                    )}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Icon className={cn('w-5 h-5', config.color)} />
                        <span className="font-medium text-white text-sm">{config.name}</span>
                      </div>
                      <span className={cn('text-2xl font-bold', config.color)}>
                        {score.toFixed(0)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                      <motion.div
                        className={cn('h-full rounded-full', config.color.replace('text-', 'bg-'))}
                        initial={{ width: 0 }}
                        animate={{ width: `${score}%` }}
                        transition={{ duration: 0.8, delay: 0.3 + index * 0.1 }}
                      />
                    </div>

                    {/* Quick insight */}
                    {insight?.key_issues?.[0] && (
                      <p className="text-[10px] text-white/40 line-clamp-1">
                        Issue: {insight.key_issues[0]}
                      </p>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Country Slideshow */}
            <div className="h-48 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <CountrySlideshow briefing={briefing} />
            </div>
          </div>

          {/* Right Column - Stats & Economic Data */}
          <div className="col-span-4 flex flex-col gap-4">
            {/* Economic Indicators - Full Tile */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <EconomicIndicators briefing={briefing} variant="full" />
            </div>

            {/* Accept Mission CTA */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onAcceptMission}
              className="flex-shrink-0 w-full py-4 bg-adl-accent text-white rounded-xl font-semibold text-lg hover:bg-adl-blue-light transition-colors shadow-lg shadow-adl-accent/25 flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6" />
              Begin Simulation
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </div>

      {/* Modals for Detailed Information */}
      <BriefingModal
        isOpen={activeModal === 'executive'}
        onClose={() => setActiveModal(null)}
        title="Executive Summary"
        icon={<Globe2 className="w-5 h-5 text-adl-accent" />}
      >
        <p className="text-white/80 leading-relaxed whitespace-pre-line">
          {briefing.executive_summary}
        </p>
      </BriefingModal>

      <BriefingModal
        isOpen={activeModal === 'socioeconomic'}
        onClose={() => setActiveModal(null)}
        title="Socioeconomic Context"
        icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
        size="lg"
      >
        <p className="text-white/80 leading-relaxed whitespace-pre-line">
          {briefing.socioeconomic_context}
        </p>
        {briefing.future_outlook && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="font-semibold text-white mb-2">Future Outlook</h3>
            <p className="text-white/70">{briefing.future_outlook}</p>
          </div>
        )}
      </BriefingModal>

      <BriefingModal
        isOpen={activeModal === 'cultural'}
        onClose={() => setActiveModal(null)}
        title="Cultural & Work Environment"
        icon={<Users className="w-5 h-5 text-blue-400" />}
      >
        <p className="text-white/80 leading-relaxed whitespace-pre-line">
          {briefing.cultural_factors}
        </p>
      </BriefingModal>

      <BriefingModal
        isOpen={activeModal === 'stakeholders'}
        onClose={() => setActiveModal(null)}
        title="Key Stakeholders"
        icon={<Briefcase className="w-5 h-5 text-amber-400" />}
        size="lg"
      >
        <div className="grid gap-4">
          {briefing.key_stakeholders.map((stakeholder, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-white">{stakeholder.name}</h4>
                  <p className="text-sm text-white/60">{stakeholder.role}</p>
                  <p className="text-xs text-white/40 mt-1">{stakeholder.institution}</p>
                </div>
                <span className={cn(
                  'text-xs px-3 py-1 rounded-full',
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
      </BriefingModal>

      <BriefingModal
        isOpen={activeModal === 'articles'}
        onClose={() => setActiveModal(null)}
        title="Recent Developments"
        icon={<Newspaper className="w-5 h-5 text-teal-400" />}
        size="lg"
      >
        <div className="space-y-4">
          {briefing.recent_articles?.map((article, index) => (
            <div key={index} className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold text-white">{article.title}</h4>
                  <p className="text-sm text-white/60 mt-2">{article.summary}</p>
                  <div className="flex items-center gap-3 mt-3 text-xs text-white/40">
                    <span>{article.source}</span>
                    {article.date && <span>• {article.date}</span>}
                  </div>
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded flex-shrink-0',
                  article.relevance === 'governance' ? 'bg-purple-500/20 text-purple-300' :
                  article.relevance === 'hazardControl' ? 'bg-blue-500/20 text-blue-300' :
                  article.relevance === 'healthVigilance' ? 'bg-teal-500/20 text-teal-300' :
                  'bg-amber-500/20 text-amber-300'
                )}>
                  {article.relevance}
                </span>
              </div>
            </div>
          ))}
        </div>
      </BriefingModal>

      <BriefingModal
        isOpen={activeModal === 'pillar' && selectedPillar !== null}
        onClose={() => { setActiveModal(null); setSelectedPillar(null); }}
        title={selectedPillar ? PILLAR_CONFIGS.find(p => p.id === selectedPillar)?.fullName || '' : ''}
        icon={selectedPillar ? (() => {
          const Icon = PILLAR_ICONS[selectedPillar];
          const config = PILLAR_CONFIGS.find(p => p.id === selectedPillar);
          return <Icon className={cn('w-5 h-5', config?.color)} />;
        })() : null}
        size="lg"
      >
        {selectedPillar && (() => {
          const insight = briefing.pillar_insights[selectedPillar];
          const score = briefing.pillar_scores[selectedPillar] || 0;
          const config = PILLAR_CONFIGS.find(p => p.id === selectedPillar);

          return (
            <div className="space-y-6">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className={cn('text-5xl font-bold', config?.color)}>
                  {score.toFixed(0)}
                </div>
                <div>
                  <div className="text-white/60 text-sm">Current Score</div>
                  <div className="h-3 w-40 bg-white/10 rounded-full overflow-hidden mt-1">
                    <div
                      className={cn('h-full rounded-full', config?.color.replace('text-', 'bg-'))}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Analysis */}
              <div>
                <h4 className="font-semibold text-white mb-2">Analysis</h4>
                <p className="text-white/70">{insight?.analysis || 'No analysis available'}</p>
              </div>

              {/* Key Issues */}
              {insight?.key_issues && insight.key_issues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Key Issues</h4>
                  <div className="space-y-2">
                    {insight.key_issues.map((issue, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <span className="text-sm text-white/80">{issue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Opportunities */}
              {insight?.opportunities && insight.opportunities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Opportunities</h4>
                  <div className="space-y-2">
                    {insight.opportunities.map((opp, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-emerald-500/10 rounded-lg">
                        <Lightbulb className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-sm text-white/80">{opp}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </BriefingModal>
    </div>
  );
}

export default SituationalBriefing;
