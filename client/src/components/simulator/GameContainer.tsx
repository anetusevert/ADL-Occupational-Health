/**
 * Game Container Component
 * 
 * Main game wrapper with 3-panel layout
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Globe,
  Play,
  Settings,
  HelpCircle,
  Volume2,
  VolumeX,
  Maximize2,
} from 'lucide-react';
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

// Sample events for demo
const SAMPLE_EVENTS: GameEvent[] = [
  {
    id: 'evt_1',
    type: 'crisis',
    severity: 'major',
    title: 'Industrial Disaster at Chemical Plant',
    description: 'An explosion at a major chemical facility has injured 50 workers and caused a toxic leak affecting nearby communities.',
    narrative: 'The incident highlights gaps in your hazard control systems and has drawn international media attention.',
    choices: [
      {
        id: 'c1',
        label: 'Emergency Response & Investigation',
        description: 'Deploy emergency teams and launch a full investigation. Compensate victims immediately.',
        cost: 50,
        impacts: { governance: 2, hazardControl: -3, healthVigilance: 1, restoration: -2 },
      },
      {
        id: 'c2',
        label: 'Regulatory Crackdown',
        description: 'Suspend similar operations nationwide for safety audits. May impact economic output.',
        cost: 30,
        impacts: { governance: 4, hazardControl: 2, healthVigilance: 0, restoration: -1 },
      },
      {
        id: 'c3',
        label: 'Minimal Response',
        description: 'Let local authorities handle it. Focus resources elsewhere.',
        cost: 0,
        impacts: { governance: -5, hazardControl: -2, healthVigilance: -1, restoration: -3 },
      },
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
    description: 'The World Health Organization offers technical assistance to strengthen your surveillance systems.',
    narrative: 'This partnership could accelerate your health vigilance capabilities significantly.',
    choices: [
      {
        id: 'c1',
        label: 'Accept Full Partnership',
        description: 'Commit resources to implement WHO recommendations across all regions.',
        cost: 40,
        impacts: { governance: 2, hazardControl: 1, healthVigilance: 5, restoration: 1 },
        longTermEffects: [
          { pillar: 'healthVigilance', delta: 2, duration: 2, description: 'WHO capacity building' },
        ],
      },
      {
        id: 'c2',
        label: 'Pilot Program',
        description: 'Start with a smaller pilot in select regions to test effectiveness.',
        cost: 15,
        impacts: { governance: 1, hazardControl: 0, healthVigilance: 2, restoration: 0 },
      },
      {
        id: 'c3',
        label: 'Decline Politely',
        description: 'Focus on domestic solutions instead.',
        cost: 0,
        impacts: { governance: -1, hazardControl: 0, healthVigilance: 0, restoration: 0 },
      },
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
    toggleWorldMap,
    resetGame,
  } = useGame();
  
  const [showWorldMap, setShowWorldMap] = useState(false);
  
  // Handle event triggering (demo - would be from API in production)
  useEffect(() => {
    if (state.phase === 'playing' && state.cycleNumber > 0 && Math.random() < 0.3) {
      const eventIndex = state.cycleNumber % SAMPLE_EVENTS.length;
      const event = { ...SAMPLE_EVENTS[eventIndex], id: `evt_${Date.now()}` };
      // Don't trigger immediately, let user advance manually for demo
    }
  }, [state.cycleNumber, state.phase]);
  
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
        onStartGame={startGame}
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
          startGame();
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
        <div className="col-span-4 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 min-h-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 overflow-hidden">
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
      {/* Background particles */}
      <ParticleEffects intensity="low" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-8 relative z-10"
      >
        {/* Title */}
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
            className="inline-flex items-center justify-center w-20 h-20 bg-adl-accent/20 rounded-2xl border border-adl-accent/30 mb-6"
          >
            <Target className="w-10 h-10 text-adl-accent" />
          </motion.div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            Sovereign Health
          </h1>
          <p className="text-white/60">
            Lead a nation's occupational health transformation
          </p>
          <p className="text-xs text-white/40 mt-2">
            Powered by Arthur D. Little • ADL OHI Framework
          </p>
        </div>
        
        {/* Country Selector */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Choose Your Nation</h2>
          <CountrySelector
            countries={SAMPLE_COUNTRIES}
            selectedCountry={selectedCountry}
            onSelect={onSelectCountry}
          />
        </div>
        
        {/* Start Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onStartGame}
          disabled={!selectedCountry}
          className={cn(
            'w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all',
            selectedCountry
              ? 'bg-adl-accent text-white hover:bg-adl-blue-light'
              : 'bg-white/10 text-white/40 cursor-not-allowed'
          )}
        >
          <Play className="w-5 h-5" />
          Begin Simulation
        </motion.button>
        
        {/* Info */}
        <div className="text-center text-xs text-white/30 space-y-1">
          <p>5-year policy cycles • AI-powered events • Real country data</p>
          <p>Goal: Improve your nation's ADL OHI Score through strategic policy decisions</p>
        </div>
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
  // Country flag emoji helper
  const getCountryFlag = (isoCode: string): string => {
    if (!isoCode || isoCode.length < 2) return '🏳️';
    const codePoints = isoCode
      .toUpperCase()
      .slice(0, 2)
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };
  
  return (
    <div className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-white/5">
      <div className="flex items-center gap-4">
        {/* Logo */}
        <motion.div 
          className="w-11 h-11 bg-adl-accent/20 rounded-xl flex items-center justify-center border border-adl-accent/30"
          animate={{ 
            boxShadow: [
              '0 0 20px rgba(6,182,212,0.2)',
              '0 0 30px rgba(6,182,212,0.4)',
              '0 0 20px rgba(6,182,212,0.2)',
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Target className="w-5 h-5 text-adl-accent" />
        </motion.div>
        
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
            Sovereign Health
            <span className="px-2 py-0.5 text-[10px] font-mono bg-adl-accent/20 text-adl-accent rounded-full">
              Simulator
            </span>
          </h1>
          <p className="text-white/40 text-sm">
            ADL Occupational Health Intelligence Platform
          </p>
        </div>
      </div>
      
      {/* Country Info */}
      {country && (
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{getCountryFlag(country.iso_code)}</span>
            <div>
              <p className="text-white font-medium">{country.name}</p>
              <p className="text-xs text-white/40">{country.region}</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-white/10" />
          
          <div className="text-center">
            <p className="text-2xl font-bold text-adl-accent">{ohiScore.toFixed(2)}</p>
            <p className="text-[10px] text-white/40">OHI Score</p>
          </div>
          
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{year}</p>
            <p className="text-[10px] text-white/40">Year</p>
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onTriggerEvent}
          className="px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="Trigger Demo Event"
        >
          Demo Event
        </button>
        <button
          onClick={onShowMap}
          className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          title="View World Map"
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
