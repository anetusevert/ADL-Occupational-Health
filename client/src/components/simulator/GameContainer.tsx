/**
 * Game Container Component - Sovereign Health
 * 
 * Main game wrapper with AI-powered flow:
 * Setup → Loading → Briefing → Decision Rounds → Outcomes
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Play, HelpCircle, Pause, SkipForward } from 'lucide-react';
import { cn } from '../../lib/utils';

// Import game components
import { CountrySelector, SAMPLE_COUNTRIES } from './CountrySelector';
import { LoadingBriefing } from './LoadingBriefing';
import { SituationalBriefing } from './SituationalBriefing';
import { DecisionRound } from './DecisionRound';
import { PolicyTemple } from './PolicyTemple';
import { BudgetAllocator } from './BudgetAllocator';
import { StatsDashboard } from './StatsDashboard';
import { RankingsLadder } from './RankingsLadder';
import { TimelineControl } from './TimelineControl';
import { EventCard } from './EventCard';
import { WorldMapView } from './WorldMapView';
import { GameOverSummary } from './GameOverSummary';
import { ParticleEffects } from './ParticleEffects';
import { NewsFeed } from './NewsFeed';
import { CountryLandmark, LandmarkCard } from './CountryLandmark';
import { OHIScoreDisplay } from './OHIScoreDisplay';
import { AdvisorPanel } from './AdvisorPanel';
import { OHIDeltaChart } from './OHIDeltaChart';
import { EconomicIndicators } from './EconomicIndicators';
import { CountrySlideshow } from './CountrySlideshow';

// Import game state
import { useGame, GameProvider } from '../../hooks/useGameSimulation';
import type { CountryData, GameEvent, CountryBriefing, DecisionCard, NewsItem } from './types';

// API functions - Using enhanced workflow endpoints
import { 
  runIntelligenceBriefingWorkflow,
  runStrategicAdvisorWorkflow,
  runNewsGeneratorWorkflow,
  type WorkflowResponse,
} from '../../services/api';

// Map 3-letter ISO codes to 2-letter codes for flags
const ISO3_TO_ISO2: Record<string, string> = {
  // GCC Countries
  SAU: 'SA', ARE: 'AE', KWT: 'KW', QAT: 'QA', BHR: 'BH', OMN: 'OM',
  // Europe
  DEU: 'DE', GBR: 'GB', FRA: 'FR', TUR: 'TR', POL: 'PL',
  // Americas
  USA: 'US', CAN: 'CA', BRA: 'BR', MEX: 'MX',
  // Asia
  JPN: 'JP', CHN: 'CN', IND: 'IN', SGP: 'SG', IDN: 'ID',
  // Oceania
  AUS: 'AU', NZL: 'NZ',
  // Africa
  ZAF: 'ZA', NGA: 'NG', EGY: 'EG',
};

// Get flag image URL from CDN
function getFlagUrl(isoCode: string): string {
  const iso2 = ISO3_TO_ISO2[isoCode.toUpperCase()] || isoCode.slice(0, 2);
  return `https://flagcdn.com/w80/${iso2.toLowerCase()}.png`;
}

// Country flag emoji helper (fallback)
function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length < 2) return '🏳️';
  const iso2 = ISO3_TO_ISO2[isoCode.toUpperCase()] || isoCode.slice(0, 2);
  const codePoints = iso2.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Inner Game Component (uses context)
 */
function GameInner() {
  const {
    state,
    selectCountry,
    startGame,
    pauseGame,
    resumeGame,
    setSpeed,
    toggleAutoAdvance,
    allocateBudget,
    investInPolicy,
    advanceCycle,
    triggerEvent,
    resolveEvent,
    dismissEvent,
    selectPillar,
    resetGame,
  } = useGame();

  // AI-powered game state
  const [gamePhase, setGamePhase] = useState<'setup' | 'loading' | 'briefing' | 'playing'>('setup');
  const [briefing, setBriefing] = useState<CountryBriefing | null>(null);
  const [decisions, setDecisions] = useState<DecisionCard[]>([]);
  const [selectedDecisions, setSelectedDecisions] = useState<string[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [showWorldMap, setShowWorldMap] = useState(false);
  const [isLoadingDecisions, setIsLoadingDecisions] = useState(false);
  const [agentLog, setAgentLog] = useState<Array<{timestamp: string; agent: string; status: string; message: string; emoji: string}>>([]);
  const [isWorkflowComplete, setIsWorkflowComplete] = useState(false);

  // Handle country selection and start research using enhanced workflow
  const handleSelectAndResearch = useCallback(async (country: CountryData) => {
    selectCountry(country);
    setGamePhase('loading');
    setAgentLog([]);
    setIsWorkflowComplete(false);

    try {
      // Use enhanced Intelligence Briefing workflow (with web search)
      const workflowResult = await runIntelligenceBriefingWorkflow(country.iso_code);
      
      // Set agent log for display - filter to only valid entries with required fields
      if (workflowResult.agent_log) {
        const validLogs = workflowResult.agent_log.filter(
          (entry): entry is typeof entry => 
            entry != null && 
            typeof entry.agent === 'string' && 
            typeof entry.status === 'string'
        );
        setAgentLog(validLogs);
      }
      setIsWorkflowComplete(true);
      
      if (workflowResult.success && workflowResult.data) {
        // Map workflow response to briefing format
        const data = workflowResult.data as Record<string, unknown>;
        const briefingData: CountryBriefing = {
          country_name: (data.country_name as string) || country.name,
          iso_code: (data.iso_code as string) || country.iso_code,
          flag_url: (data.flag_url as string) || `https://flagcdn.com/w160/${country.iso_code.slice(0, 2).toLowerCase()}.png`,
          executive_summary: (data.executive_summary as string) || `Welcome to ${country.name}.`,
          socioeconomic_context: (data.socioeconomic_context as string) || '',
          cultural_factors: (data.cultural_factors as string) || '',
          future_outlook: (data.future_outlook as string) || '',
          key_statistics: (data.key_statistics as Record<string, unknown>) || {},
          ohi_score: (data.ohi_score as number) || country.initialOHIScore,
          pillar_scores: (data.pillar_scores as Record<string, number>) || country.initialPillars,
          global_rank: (data.global_rank as number) || 50,
          pillar_insights: (data.pillar_insights as CountryBriefing['pillar_insights']) || {},
          key_challenges: (data.key_challenges as string[]) || [],
          key_stakeholders: (data.key_stakeholders as CountryBriefing['key_stakeholders']) || [],
          recent_articles: (data.recent_articles as CountryBriefing['recent_articles']) || [],
          mission_statement: (data.mission_statement as string) || `Transform ${country.name}'s occupational health system.`,
          difficulty_rating: (data.difficulty_rating as string) || 'Medium',
          country_context: (data.country_context as CountryBriefing['country_context']) || {},
        };
        setBriefing(briefingData);
      } else {
        throw new Error(workflowResult.errors?.[0] || 'Workflow failed');
      }
      // Don't immediately transition - let LoadingBriefing show the agent log first
      // setGamePhase('briefing') is called by LoadingBriefing.onComplete
    } catch (error) {
      console.error('Failed to research country:', error);
      // Add error log entries so user sees what happened
      setAgentLog(prev => [
        ...prev,
        {
          timestamp: new Date().toISOString(),
          agent: 'Orchestrator',
          status: 'error',
          message: 'AI service unavailable - using cached database',
          emoji: '⚠️',
        },
        {
          timestamp: new Date().toISOString(),
          agent: 'DataAgent',
          status: 'complete',
          message: `Loading ${country.name} from local database...`,
          emoji: '📊',
        },
        {
          timestamp: new Date().toISOString(),
          agent: 'Orchestrator',
          status: 'complete',
          message: 'Fallback briefing prepared successfully',
          emoji: '✅',
        },
      ]);
      setIsWorkflowComplete(true);
      // Create fallback briefing
      setBriefing({
        country_name: country.name,
        iso_code: country.iso_code,
        flag_url: `https://flagcdn.com/w160/${country.iso_code.slice(0, 2).toLowerCase()}.png`,
        executive_summary: `Welcome to ${country.name}. As the new Health Minister, you face significant challenges in transforming the nation's occupational health system.`,
        socioeconomic_context: `${country.name} has a diverse economy with significant opportunities for occupational health improvements.`,
        cultural_factors: 'Work culture varies across industries and regions.',
        future_outlook: 'Economic projections suggest evolving workplace challenges ahead.',
        key_statistics: {
          gdp_per_capita: country.gdp * 1000,
          population: country.population,
          health_expenditure_pct: country.healthExpenditure,
          labor_force: country.laborForce,
        },
        ohi_score: country.initialOHIScore,
        pillar_scores: country.initialPillars,
        global_rank: 50,
        pillar_insights: {
          governance: { score: country.initialPillars.governance, analysis: 'Governance analysis', key_issues: [], opportunities: [] },
          hazardControl: { score: country.initialPillars.hazardControl, analysis: 'Hazard control analysis', key_issues: [], opportunities: [] },
          healthVigilance: { score: country.initialPillars.healthVigilance, analysis: 'Health vigilance analysis', key_issues: [], opportunities: [] },
          restoration: { score: country.initialPillars.restoration, analysis: 'Restoration analysis', key_issues: [], opportunities: [] },
        },
        key_challenges: ['Improve enforcement capacity', 'Expand worker coverage', 'Modernize systems'],
        key_stakeholders: [],
        recent_articles: [],
        mission_statement: `Transform ${country.name}'s occupational health system into a world-class framework.`,
        difficulty_rating: country.initialOHIScore >= 3.0 ? 'Easy' : country.initialOHIScore >= 2.0 ? 'Medium' : 'Hard',
        country_context: {
          iconic_landmark: 'National Monument',
          capital: 'Capital City',
          major_cities: [],
        },
      });
      // LoadingBriefing.onComplete will handle the transition
    }
  }, [selectCountry]);

  // Handle accepting mission and starting game
  const handleAcceptMission = useCallback(async () => {
    startGame();
    setGamePhase('playing');

    // Generate initial decisions using Strategic Advisor workflow
    if (state.selectedCountry && briefing) {
      setIsLoadingDecisions(true);
      try {
        const workflowResult = await runStrategicAdvisorWorkflow({
          iso_code: state.selectedCountry.iso_code,
          country_name: state.selectedCountry.name,
          current_month: 1,
          current_year: state.currentYear,
          ohi_score: state.ohiScore,
          pillars: state.pillars,
          budget_remaining: state.budget.totalBudgetPoints,
          recent_decisions: [],
        });
        
        if (workflowResult.success && workflowResult.data) {
          const data = workflowResult.data as Record<string, unknown>;
          const decisionsData = (data.decisions as DecisionCard[]) || [];
          setDecisions(decisionsData);
        } else {
          console.warn('Advisor workflow returned no decisions, using empty list');
          setDecisions([]);
        }
      } catch (error) {
        console.error('Failed to generate decisions:', error);
        setDecisions([]);
      }
      setIsLoadingDecisions(false);
    }
  }, [startGame, state.selectedCountry, state.currentYear, state.pillars, state.ohiScore, state.budget.totalBudgetPoints, briefing]);

  // Handle confirming decisions and advancing
  const handleConfirmDecisions = useCallback(async () => {
    // Get selected decisions for news generation
    const selectedDecisionCards = decisions.filter(d => selectedDecisions.includes(d.id));
    
    // Calculate expected pillar changes based on decisions
    const pillarChanges: Record<string, number> = {};
    selectedDecisionCards.forEach(d => {
      Object.entries(d.expected_impacts || {}).forEach(([pillar, impact]) => {
        pillarChanges[pillar] = (pillarChanges[pillar] || 0) + (impact as number);
      });
    });

    // Process the selected decisions and advance the cycle
    advanceCycle();

    // Generate news using News Generator workflow
    if (state.selectedCountry) {
      try {
        // Build game state context for news generation
        const gameStateContext = `OHI Score: ${state.ohiScore.toFixed(2)}, Year: ${state.currentYear}, Governance: ${state.pillars.governance}, Hazard: ${state.pillars.hazardControl}, Vigilance: ${state.pillars.healthVigilance}, Restoration: ${state.pillars.restoration}`;
        
        const newsWorkflowResult = await runNewsGeneratorWorkflow({
          iso_code: state.selectedCountry.iso_code,
          country_name: state.selectedCountry.name,
          current_month: ((state.cycleNumber + 1) % 12) + 1,
          current_year: state.currentYear,
          recent_decisions: selectedDecisionCards.map(d => ({
            id: d.id,
            title: d.title,
            description: d.description,
            pillar: d.pillar,
            cost: d.cost,
          })),
          pillar_changes: pillarChanges,
          game_state: gameStateContext,
          count: 4, // Generate 4 news items per round
        });
        
        if (newsWorkflowResult.success && newsWorkflowResult.data) {
          const newsData = newsWorkflowResult.data as Record<string, unknown>;
          const newNewsItems = (newsData.news_items as NewsItem[]) || [];
          // Add new items at the top, keep max 20
          setNewsItems(prev => [...newNewsItems, ...prev].slice(0, 20));
        }
      } catch (error) {
        console.error('Failed to generate news:', error);
        // Add fallback news on error
        const fallbackNews: NewsItem[] = selectedDecisionCards.slice(0, 2).map((d, i) => ({
          id: `news-${Date.now()}-${i}`,
          headline: `Government Announces: ${d.title}`,
          summary: d.description.substring(0, 150) + '...',
          source: 'Ministry Press Office',
          source_type: 'official',
          category: d.pillar,
          sentiment: 'positive',
          location: state.selectedCountry?.name || '',
          timestamp: `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][state.cycleNumber % 12]} ${state.currentYear}`,
        }));
        setNewsItems(prev => [...fallbackNews, ...prev].slice(0, 20));
      }
    }

    // Generate new decisions using Strategic Advisor workflow
    if (state.selectedCountry) {
      setIsLoadingDecisions(true);
      try {
        const advisorWorkflowResult = await runStrategicAdvisorWorkflow({
          iso_code: state.selectedCountry.iso_code,
          country_name: state.selectedCountry.name,
          current_month: ((state.cycleNumber + 1) % 12) + 1,
          current_year: state.currentYear,
          ohi_score: state.ohiScore,
          pillars: state.pillars,
          budget_remaining: state.budget.totalBudgetPoints - Object.values(state.budget.spent).reduce((a, b) => a + b, 0),
          recent_decisions: selectedDecisions,
        });
        
        if (advisorWorkflowResult.success && advisorWorkflowResult.data) {
          const data = advisorWorkflowResult.data as Record<string, unknown>;
          const decisionsData = (data.decisions as DecisionCard[]) || [];
          setDecisions(decisionsData);
        } else {
          setDecisions([]);
        }
        setSelectedDecisions([]);
      } catch (error) {
        console.error('Failed to generate new decisions:', error);
      }
      setIsLoadingDecisions(false);
    }
  }, [advanceCycle, state.selectedCountry, state.cycleNumber, state.currentYear, state.pillars, state.ohiScore, state.budget, decisions, selectedDecisions]);

  // Setup Phase
  if (gamePhase === 'setup') {
    return (
      <SetupScreen
        selectedCountry={state.selectedCountry}
        onSelectCountry={handleSelectAndResearch}
      />
    );
  }

  // Loading Phase
  if (gamePhase === 'loading' && state.selectedCountry) {
    return (
      <LoadingBriefing
        countryName={state.selectedCountry.name}
        countryFlag={getCountryFlag(state.selectedCountry.iso_code)}
        countryIsoCode={state.selectedCountry.iso_code}
        agentLog={agentLog}
        isComplete={isWorkflowComplete}
        onComplete={() => setGamePhase('briefing')}
      />
    );
  }

  // Briefing Phase
  if (gamePhase === 'briefing' && briefing) {
    return (
      <SituationalBriefing
        briefing={briefing}
        onAcceptMission={handleAcceptMission}
      />
    );
  }

  // Game Over Phase
  if (state.phase === 'ended' && state.selectedCountry) {
    return (
      <GameOverSummary
        country={state.selectedCountry}
        statistics={state.statistics}
        history={state.history}
        finalRank={state.statistics.currentRank}
        onPlayAgain={() => {
          resetGame();
          setGamePhase('setup');
          setBriefing(null);
          setDecisions([]);
          setNewsItems([]);
        }}
        onNewCountry={() => {
          resetGame();
          setGamePhase('setup');
          setBriefing(null);
          setDecisions([]);
          setNewsItems([]);
        }}
      />
    );
  }

  // Main Game - Redesigned Layout with Advisor Panel
  return (
    <div className="h-full flex flex-col">
      {/* Event Modal */}
      <AnimatePresence>
        {state.currentEvent && (
          <EventCard
            event={state.currentEvent}
            onResolve={resolveEvent}
            onDismiss={dismissEvent}
          />
        )}
      </AnimatePresence>

      {/* World Map Modal */}
      <AnimatePresence>
        {showWorldMap && (
          <WorldMapView
            rankings={state.rankings}
            playerIso={state.selectedCountry?.iso_code || ''}
            onClose={() => setShowWorldMap(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <GameHeader
        country={state.selectedCountry}
        year={state.currentYear}
        month={((state.cycleNumber) % 12) + 1}
        ohiScore={state.ohiScore}
        onShowMap={() => setShowWorldMap(true)}
      />

      {/* Main 3-Panel Layout - Redesigned */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 p-3">
        {/* Left Panel - AI Advisor */}
        <div className="col-span-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
          <AdvisorPanel
            countryName={state.selectedCountry?.name || ''}
            currentMonth={((state.cycleNumber) % 12) + 1}
            currentYear={state.currentYear}
            decisions={decisions}
            budgetRemaining={state.budget.totalBudgetPoints - Object.values(state.budget.spent).reduce((a, b) => a + b, 0)}
            briefing={briefing}
            isLoading={isLoadingDecisions}
            onSelectDecisions={setSelectedDecisions}
            onConfirmDecisions={handleConfirmDecisions}
            disabled={state.phase !== 'playing'}
          />
        </div>

        {/* Center Panel - News Feed (Central Focus) */}
        <div className="col-span-5 flex flex-col gap-3">
          {/* Main News Feed - Large Central Display */}
          <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <NewsFeed 
              newsItems={newsItems} 
              variant="central"
              maxItems={15}
            />
          </div>

          {/* Bottom - Timeline */}
          <div className="flex-shrink-0">
            <TimelineControl
              currentYear={state.currentYear}
              cycleNumber={state.cycleNumber}
              phase={state.phase}
              onAdvance={handleConfirmDecisions}
              disabled={state.phase === 'event' || isLoadingDecisions}
              isAdvancing={isLoadingDecisions}
            />
          </div>
        </div>

        {/* Right Panel - OHI Score, Stats, Landmark, Economic Data */}
        <div className="col-span-4 flex flex-col gap-3">
          {/* Top Right - OHI Score with Delta Chart */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 overflow-hidden">
            <div className="flex items-start gap-4">
              {/* Compact OHI Score */}
              <div className="flex-shrink-0">
                <OHIScoreDisplay
                  score={state.ohiScore}
                  previousScore={state.history.length > 0 ? state.history[state.history.length - 1].ohiScore : undefined}
                  size="md"
                  showStage={false}
                />
              </div>
              
              {/* Delta Chart */}
              <div className="flex-1 min-w-0">
                <OHIDeltaChart
                  history={state.history}
                  currentScore={state.ohiScore}
                  startingScore={state.statistics.startingOHIScore || state.ohiScore}
                  compact
                />
              </div>
            </div>

            {/* Pillar Bars - Compact */}
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-4 gap-2">
              {[
                { id: 'governance', label: 'Gov', value: state.pillars.governance, color: 'bg-purple-500' },
                { id: 'hazardControl', label: 'Haz', value: state.pillars.hazardControl, color: 'bg-blue-500' },
                { id: 'healthVigilance', label: 'Vig', value: state.pillars.healthVigilance, color: 'bg-teal-500' },
                { id: 'restoration', label: 'Res', value: state.pillars.restoration, color: 'bg-amber-500' },
              ].map(pillar => (
                <div key={pillar.id} className="text-center">
                  <div className="text-[10px] text-white/40 mb-1">{pillar.label}</div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={cn('h-full rounded-full', pillar.color)}
                      initial={{ width: 0 }}
                      animate={{ width: `${pillar.value}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5">{pillar.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Right - Country Slideshow */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden h-44">
            <CountrySlideshow
              briefing={briefing}
              autoPlay={true}
              interval={6000}
            />
          </div>

          {/* Bottom Right - Economic Indicators (World Bank Data) - Full Tile */}
          <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden">
            <EconomicIndicators
              briefing={briefing}
              variant="full"
              history={state.history}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Setup Screen Component
 */
function SetupScreen({
  selectedCountry,
  onSelectCountry,
}: {
  selectedCountry: CountryData | null;
  onSelectCountry: (country: CountryData) => void;
}) {
  const [localSelected, setLocalSelected] = useState<CountryData | null>(null);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative">
      <ParticleEffects intensity="low" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 relative z-10"
      >
        {/* Title with ADL Logo */}
        <div className="text-center">
          <motion.div
            animate={{
              boxShadow: [
                '0 0 20px rgba(6,182,212,0.2)',
                '0 0 40px rgba(6,182,212,0.4)',
                '0 0 20px rgba(6,182,212,0.2)',
              ]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex items-center justify-center w-16 h-16 bg-adl-accent/20 rounded-2xl border border-adl-accent/30 mb-4"
          >
            <img src="/adl-logo.png" alt="ADL" className="h-10 w-10 object-contain" />
          </motion.div>

          <h1 className="text-2xl font-bold text-white mb-1">
            Sovereign Health
          </h1>
          <p className="text-white/50 text-sm">
            Lead a nation's occupational health transformation
          </p>
          <p className="text-[10px] text-white/30 mt-1">
            Powered by Arthur D. Little • ADL OHI Framework
          </p>
        </div>

        {/* Country Selector */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h2 className="text-sm font-semibold text-white mb-3">Choose Your Nation</h2>
          <CountrySelector
            countries={SAMPLE_COUNTRIES}
            selectedCountry={localSelected}
            onSelect={setLocalSelected}
            showStats={false}
          />
        </div>

        {/* Selected Country Preview */}
        {localSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              {/* Flag Image */}
              <img
                src={getFlagUrl(localSelected.iso_code)}
                alt={`${localSelected.name} flag`}
                className="w-12 h-8 object-cover rounded shadow-sm border border-white/20"
                onError={(e) => {
                  // Fallback to emoji if image fails
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <span className="hidden text-3xl">{getCountryFlag(localSelected.iso_code)}</span>
              <div>
                <h3 className="text-lg font-semibold text-white">{localSelected.name}</h3>
                <p className="text-xs text-white/40">{localSelected.region}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-adl-accent">{localSelected.initialOHIScore.toFixed(1)}</p>
                <p className="text-[10px] text-white/40">OHI Score</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => localSelected && onSelectCountry(localSelected)}
          disabled={!localSelected}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all',
            localSelected
              ? 'bg-adl-accent text-white hover:bg-adl-blue-light'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          )}
        >
          <Play className="w-5 h-5" />
          Begin Research
        </motion.button>

        <p className="text-center text-[10px] text-white/20">
          AI-powered briefing • Monthly decisions • Real consequences
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Game Header Component
 */
function GameHeader({
  country,
  year,
  month,
  ohiScore,
  onShowMap,
}: {
  country: CountryData | null;
  year: number;
  month: number;
  ohiScore: number;
  onShowMap: () => void;
}) {
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-white/5">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-9 h-9 bg-adl-accent/20 rounded-xl flex items-center justify-center border border-adl-accent/30"
          animate={{
            boxShadow: [
              '0 0 15px rgba(6,182,212,0.2)',
              '0 0 25px rgba(6,182,212,0.4)',
              '0 0 15px rgba(6,182,212,0.2)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <img src="/adl-logo.png" alt="ADL" className="h-5 w-5 object-contain" />
        </motion.div>

        <div>
          <h1 className="text-base font-semibold text-white tracking-tight">
            Sovereign Health
          </h1>
          <p className="text-white/40 text-[10px]">
            ADL Occupational Health Simulator
          </p>
        </div>
      </div>

      {/* Country Info */}
      {country && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCountryFlag(country.iso_code)}</span>
            <div>
              <p className="text-white font-medium text-sm">{country.name}</p>
              <p className="text-[10px] text-white/40">{country.region}</p>
            </div>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="text-center">
            <p className="text-lg font-bold text-adl-accent">{ohiScore.toFixed(2)}</p>
            <p className="text-[9px] text-white/40">OHI Score</p>
          </div>

          <div className="text-center">
            <p className="text-lg font-bold text-white">
              {monthNames[month - 1]} {year}
            </p>
            <p className="text-[9px] text-white/40">Current Date</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onShowMap}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <Globe className="w-5 h-5" />
        </button>
        <button className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

/**
 * Main Game Container with Provider
 */
export function GameContainer() {
  return (
    <GameProvider>
      <GameInner />
    </GameProvider>
  );
}

export default GameContainer;
