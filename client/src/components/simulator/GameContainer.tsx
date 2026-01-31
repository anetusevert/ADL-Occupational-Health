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

// API functions
import { researchCountry, generateDecisions, generateNews } from '../../services/api';

// Country flag helper
function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length < 2) return '🏳️';
  const code = isoCode.toUpperCase().slice(0, 2);
  const codePoints = code.split('').map(char => 127397 + char.charCodeAt(0));
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

  // Handle country selection and start research
  const handleSelectAndResearch = useCallback(async (country: CountryData) => {
    selectCountry(country);
    setGamePhase('loading');

    try {
      // Research the country
      const briefingData = await researchCountry(country.iso_code);
      setBriefing(briefingData as unknown as CountryBriefing);
      setGamePhase('briefing');
    } catch (error) {
      console.error('Failed to research country:', error);
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
      setGamePhase('briefing');
    }
  }, [selectCountry]);

  // Handle accepting mission and starting game
  const handleAcceptMission = useCallback(async () => {
    startGame();
    setGamePhase('playing');

    // Generate initial decisions
    if (state.selectedCountry && briefing) {
      setIsLoadingDecisions(true);
      try {
        const decisionCards = await generateDecisions({
          iso_code: state.selectedCountry.iso_code,
          country_name: state.selectedCountry.name,
          current_month: 1,
          current_year: state.currentYear,
          pillars: state.pillars,
          budget_remaining: state.budget.totalBudgetPoints,
          recent_decisions: [],
          recent_events: [],
        });
        setDecisions(decisionCards as unknown as DecisionCard[]);
      } catch (error) {
        console.error('Failed to generate decisions:', error);
        // Use fallback decisions
        setDecisions([]);
      }
      setIsLoadingDecisions(false);
    }
  }, [startGame, state.selectedCountry, state.currentYear, state.pillars, state.budget.totalBudgetPoints, briefing]);

  // Handle confirming decisions and advancing
  const handleConfirmDecisions = useCallback(async () => {
    // Process the selected decisions (simplified - in full version would calculate impacts)
    advanceCycle();

    // Generate news for this month
    if (state.selectedCountry) {
      try {
        const news = await generateNews({
          iso_code: state.selectedCountry.iso_code,
          current_month: ((state.cycleNumber + 1) % 12) + 1,
          current_year: state.currentYear,
          recent_decisions: decisions.filter(d => selectedDecisions.includes(d.id)),
          pillar_changes: {},
          count: 2,
        });
        setNewsItems(prev => [...news as unknown as NewsItem[], ...prev].slice(0, 20));
      } catch (error) {
        console.error('Failed to generate news:', error);
      }
    }

    // Generate new decisions for next turn
    if (state.selectedCountry) {
      setIsLoadingDecisions(true);
      try {
        const newDecisions = await generateDecisions({
          iso_code: state.selectedCountry.iso_code,
          country_name: state.selectedCountry.name,
          current_month: ((state.cycleNumber + 1) % 12) + 1,
          current_year: state.currentYear,
          pillars: state.pillars,
          budget_remaining: state.budget.totalBudgetPoints - Object.values(state.budget.spent).reduce((a, b) => a + b, 0),
          recent_decisions: selectedDecisions,
          recent_events: [],
        });
        setDecisions(newDecisions as unknown as DecisionCard[]);
        setSelectedDecisions([]);
      } catch (error) {
        console.error('Failed to generate new decisions:', error);
      }
      setIsLoadingDecisions(false);
    }
  }, [advanceCycle, state.selectedCountry, state.cycleNumber, state.currentYear, state.pillars, state.budget, decisions, selectedDecisions]);

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
        onComplete={() => {}}
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
              speed={state.speed}
              isAutoAdvancing={state.isAutoAdvancing}
              onPlay={resumeGame}
              onPause={pauseGame}
              onAdvance={advanceCycle}
              onSpeedChange={setSpeed}
              onToggleAuto={toggleAutoAdvance}
              disabled={state.phase === 'event'}
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
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{getCountryFlag(localSelected.iso_code)}</span>
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
