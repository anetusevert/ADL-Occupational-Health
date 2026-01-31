/**
 * Game Container Component
 * 
 * Main game wrapper with 3-panel layout
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Play, HelpCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

// Import game components
import { CountrySelector, SAMPLE_COUNTRIES } from './CountrySelector';
import { PolicyTemple } from './PolicyTemple';
import { BudgetAllocator } from './BudgetAllocator';
import { StatsDashboard } from './StatsDashboard';
import { RankingsLadder } from './RankingsLadder';
import { TimelineControl } from './TimelineControl';
import { EventCard } from './EventCard';
import { WorldMapView } from './WorldMapView';
import { GameOverSummary } from './GameOverSummary';
import { ParticleEffects } from './ParticleEffects';

// Import game state
import { useGame, GameProvider } from '../../hooks/useGameSimulation';
import type { CountryData, GameEvent } from './types';

// Country flag helper - handles 3-letter ISO codes
function getCountryFlag(isoCode: string): string {
  if (!isoCode || isoCode.length < 2) return '🏳️';
  // Use first 2 characters for flag emoji
  const code = isoCode.toUpperCase().slice(0, 2);
  const codePoints = code.split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Sample events for demo
const SAMPLE_EVENTS: GameEvent[] = [
  {
    id: 'evt_1',
    type: 'crisis',
    severity: 'major',
    title: 'Industrial Disaster at Chemical Plant',
    description: 'An explosion at a major chemical facility has injured 50 workers.',
    narrative: 'This incident highlights gaps in your hazard control systems.',
    choices: [
      { id: 'c1', label: 'Emergency Response', description: 'Deploy emergency teams and investigate.', cost: 50, impacts: { governance: 2, hazardControl: -3, healthVigilance: 1, restoration: -2 } },
      { id: 'c2', label: 'Regulatory Crackdown', description: 'Suspend similar operations for audits.', cost: 30, impacts: { governance: 4, hazardControl: 2, healthVigilance: 0, restoration: -1 } },
      { id: 'c3', label: 'Minimal Response', description: 'Let local authorities handle it.', cost: 0, impacts: { governance: -5, hazardControl: -2, healthVigilance: -1, restoration: -3 } },
    ],
    deadline: 60,
    triggeredYear: 2025,
    isResolved: false,
  },
  {
    id: 'evt_2',
    type: 'opportunity',
    severity: 'moderate',
    title: 'WHO Partnership Opportunity',
    description: 'The WHO offers technical assistance for surveillance systems.',
    narrative: 'This partnership could accelerate your health vigilance capabilities.',
    choices: [
      { id: 'c1', label: 'Accept Partnership', description: 'Commit resources to implement WHO recommendations.', cost: 40, impacts: { governance: 2, hazardControl: 1, healthVigilance: 5, restoration: 1 } },
      { id: 'c2', label: 'Pilot Program', description: 'Start with a smaller pilot.', cost: 15, impacts: { governance: 1, hazardControl: 0, healthVigilance: 2, restoration: 0 } },
      { id: 'c3', label: 'Decline', description: 'Focus on domestic solutions.', cost: 0, impacts: { governance: -1, hazardControl: 0, healthVigilance: 0, restoration: 0 } },
    ],
    deadline: 0,
    triggeredYear: 2030,
    isResolved: false,
  },
];

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

  const [showWorldMap, setShowWorldMap] = useState(false);

  // Start game with auto-advance enabled
  const handleStartGame = useCallback(() => {
    startGame();
    // Auto-start simulation after a short delay
    setTimeout(() => {
      toggleAutoAdvance();
    }, 500);
  }, [startGame, toggleAutoAdvance]);

  const handleTriggerDemoEvent = useCallback(() => {
    const eventIndex = Math.floor(Math.random() * SAMPLE_EVENTS.length);
    const event = { ...SAMPLE_EVENTS[eventIndex], id: `evt_${Date.now()}` };
    triggerEvent(event);
  }, [triggerEvent]);

  // Setup Phase
  if (state.phase === 'setup') {
    return (
      <SetupScreen
        selectedCountry={state.selectedCountry}
        onSelectCountry={selectCountry}
        onStartGame={handleStartGame}
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
          selectCountry(state.selectedCountry!);
          handleStartGame();
        }}
        onNewCountry={resetGame}
      />
    );
  }

  // Main Game
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
        ohiScore={state.ohiScore}
        onShowMap={() => setShowWorldMap(true)}
        onTriggerEvent={handleTriggerDemoEvent}
      />

      {/* Main 3-Panel Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 p-4">
        {/* Left Panel - Policy Controls */}
        <div className="col-span-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 overflow-hidden">
            <PolicyTemple
              pillars={state.pillars}
              policies={state.policies}
              budget={state.budget.allocated}
              budgetSpent={state.budget.spent}
              currentYear={state.currentYear}
              selectedPillar={state.selectedPillar}
              onSelectPillar={selectPillar}
              onInvestPolicy={investInPolicy}
              disabled={state.phase !== 'playing' && state.phase !== 'paused'}
            />
          </div>

          {state.selectedCountry && (
            <BudgetAllocator
              budget={state.budget}
              country={state.selectedCountry}
              onAllocate={allocateBudget}
              disabled={state.phase !== 'playing' && state.phase !== 'paused'}
              compact
            />
          )}
        </div>

        {/* Center Panel - Rankings */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">Global Rankings</h2>
            <button
              onClick={() => setShowWorldMap(true)}
              className="text-xs text-adl-accent hover:text-adl-accent/80 flex items-center gap-1"
            >
              <Globe className="w-3 h-3" />
              View Map
            </button>
          </div>
          <div className="flex-1 min-h-0 p-4 overflow-auto">
            <RankingsLadder
              rankings={state.rankings}
              playerIso={state.selectedCountry?.iso_code || ''}
            />
          </div>
        </div>

        {/* Right Panel - Statistics */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 overflow-hidden">
          <StatsDashboard
            ohiScore={state.ohiScore}
            previousScore={state.history.length > 0 ? state.history[state.history.length - 1].ohiScore : undefined}
            pillars={state.pillars}
            rank={state.statistics.currentRank}
            previousRank={state.history.length > 0 ? state.history[state.history.length - 1].rank : undefined}
            history={state.history}
            statistics={state.statistics}
            currentYear={state.currentYear}
          />
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="flex-shrink-0 p-4 pt-0">
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
  );
}

/**
 * Setup Screen Component
 */
function SetupScreen({
  selectedCountry,
  onSelectCountry,
  onStartGame,
}: {
  selectedCountry: CountryData | null;
  onSelectCountry: (country: CountryData) => void;
  onStartGame: () => void;
}) {
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
            selectedCountry={selectedCountry}
            onSelect={onSelectCountry}
            showStats={false}
          />
        </div>

        {/* Selected Country Preview */}
        {selectedCountry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{getCountryFlag(selectedCountry.iso_code)}</span>
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedCountry.name}</h3>
                <p className="text-xs text-white/40">{selectedCountry.region}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xl font-bold text-adl-accent">{selectedCountry.initialOHIScore.toFixed(1)}</p>
                <p className="text-[10px] text-white/40">OHI Score</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              {(['governance', 'hazardControl', 'healthVigilance', 'restoration'] as const).map(key => (
                <div key={key} className="bg-white/5 rounded p-2">
                  <p className="text-sm font-bold text-white">{selectedCountry.initialPillars[key]}</p>
                  <p className="text-[9px] text-white/40">
                    {key === 'hazardControl' ? 'Hazard' :
                     key === 'healthVigilance' ? 'Vigil' :
                     key === 'restoration' ? 'Resto' : 'Gov'}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartGame}
          disabled={!selectedCountry}
          className={cn(
            'w-full py-3 rounded-xl font-semibold text-base flex items-center justify-center gap-2 transition-all',
            selectedCountry
              ? 'bg-adl-accent text-white hover:bg-adl-blue-light'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          )}
        >
          <Play className="w-5 h-5" />
          Start Simulation
        </motion.button>

        <p className="text-center text-[10px] text-white/20">
          Yearly rounds • 2025-2050 • Real country data
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
  ohiScore,
  onShowMap,
  onTriggerEvent,
}: {
  country: CountryData | null;
  year: number;
  ohiScore: number;
  onShowMap: () => void;
  onTriggerEvent: () => void;
}) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-white/5">
      {/* Logo and Title */}
      <div className="flex items-center gap-3">
        <motion.div
          className="w-10 h-10 bg-adl-accent/20 rounded-xl flex items-center justify-center border border-adl-accent/30"
          animate={{
            boxShadow: [
              '0 0 15px rgba(6,182,212,0.2)',
              '0 0 25px rgba(6,182,212,0.4)',
              '0 0 15px rgba(6,182,212,0.2)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <img src="/adl-logo.png" alt="ADL" className="h-6 w-6 object-contain" />
        </motion.div>

        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">
            ADL Occupational Health Simulator
          </h1>
          <p className="text-white/40 text-xs">
            Policy Strategy Game
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
            <p className="text-lg font-bold text-white">{year}</p>
            <p className="text-[9px] text-white/40">Year</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTriggerEvent}
          className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          Demo Event
        </button>
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
