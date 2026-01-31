/**
 * Sovereign Health: Main Game Container
 * 
 * 3-panel layout with timeline controls and game orchestration
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Map,
  BarChart3,
  Sparkles,
  Play,
  HelpCircle,
  Settings,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useGame } from '../../hooks/useGameSimulation';
import { PolicyTemple } from './PolicyTemple';
import { BudgetAllocator } from './BudgetAllocator';
import { StatsDashboard } from './StatsDashboard';
import { RankingsLadder } from './RankingsLadder';
import { TimelineControl } from './TimelineControl';
import { EventCard } from './EventCard';
import { CountrySelector } from './CountrySelector';
import { GameOverSummary } from './GameOverSummary';
import { OHIScoreDisplay } from './OHIScoreDisplay';
import { WorldMapView } from './WorldMapView';
import type { GameEvent, CountryData } from './types';

// Sample event for demo (in production, this comes from AI backend)
const SAMPLE_EVENTS: GameEvent[] = [
  {
    id: 'event_industrial_disaster',
    type: 'crisis',
    severity: 'major',
    title: 'Industrial Disaster Strikes',
    description: 'A major explosion at a chemical plant has resulted in multiple casualties and widespread environmental contamination.',
    narrative: 'The morning shift at the Chemex Industrial Complex began like any other, until a catastrophic failure in the reactor cooling system triggered a chain reaction...',
    choices: [
      {
        id: 'emergency_response',
        label: 'Launch Emergency Response',
        description: 'Deploy all available resources for immediate crisis management and victim support.',
        cost: 50,
        impacts: { governance: 2, hazardControl: -5, healthVigilance: 3, restoration: 5 },
        longTermEffects: [
          { pillar: 'hazardControl', delta: 3, duration: 2, description: 'Enhanced safety protocols implemented' }
        ]
      },
      {
        id: 'investigation',
        label: 'Prioritize Investigation',
        description: 'Focus resources on determining the cause to prevent future incidents.',
        cost: 30,
        impacts: { governance: 4, hazardControl: 2, healthVigilance: 1, restoration: 0 },
      },
      {
        id: 'minimal',
        label: 'Standard Response Only',
        description: 'Follow existing protocols without additional resource allocation.',
        cost: 0,
        impacts: { governance: -3, hazardControl: -2, healthVigilance: 0, restoration: -2 },
      },
    ],
    deadline: 60,
    triggeredYear: 2030,
    isResolved: false,
  },
  {
    id: 'event_who_partnership',
    type: 'opportunity',
    severity: 'moderate',
    title: 'WHO Partnership Opportunity',
    description: 'The World Health Organization is seeking pilot countries for a new global occupational health initiative.',
    narrative: 'Your nation\'s progress has caught the attention of international health bodies...',
    choices: [
      {
        id: 'full_participation',
        label: 'Full Participation',
        description: 'Commit significant resources to lead the initiative in your region.',
        cost: 40,
        impacts: { governance: 5, hazardControl: 2, healthVigilance: 4, restoration: 2 },
        longTermEffects: [
          { pillar: 'governance', delta: 2, duration: 3, description: 'International cooperation benefits' }
        ]
      },
      {
        id: 'limited',
        label: 'Limited Engagement',
        description: 'Participate with minimal resource commitment.',
        cost: 15,
        impacts: { governance: 2, hazardControl: 1, healthVigilance: 1, restoration: 1 },
      },
      {
        id: 'decline',
        label: 'Politely Decline',
        description: 'Focus on domestic priorities.',
        cost: 0,
        impacts: { governance: -1, hazardControl: 0, healthVigilance: 0, restoration: 0 },
      },
    ],
    deadline: 45,
    triggeredYear: 2035,
    isResolved: false,
  },
];

export function GameContainer() {
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
  
  const [activeTab, setActiveTab] = useState<'policies' | 'budget'>('policies');
  
  // Demo: Trigger sample event occasionally
  useEffect(() => {
    if (state.phase === 'playing' && state.cycleNumber > 0 && !state.currentEvent) {
      const shouldTrigger = Math.random() < 0.3; // 30% chance per cycle
      if (shouldTrigger) {
        const randomEvent = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];
        triggerEvent({
          ...randomEvent,
          id: `${randomEvent.id}_${Date.now()}`,
          triggeredYear: state.currentYear,
        });
      }
    }
  }, [state.cycleNumber]);
  
  // Get previous values for animations
  const previousCycle = state.history.length > 0 ? state.history[state.history.length - 1] : null;
  
  // Handle country selection
  const handleCountrySelect = useCallback((country: CountryData) => {
    selectCountry(country);
  }, [selectCountry]);
  
  // Setup Screen
  if (state.phase === 'setup') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="w-20 h-20 bg-adl-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-adl-accent/30"
            >
              <Globe className="w-10 h-10 text-adl-accent" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              Sovereign Health
            </h1>
            <p className="text-white/50">
              Lead a nation's occupational health transformation
            </p>
          </div>
          
          {/* Country Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/60 mb-2">
              Choose your country
            </label>
            <CountrySelector
              onSelect={handleCountrySelect}
              selectedCountry={state.selectedCountry}
            />
          </div>
          
          {/* Selected Country Preview */}
          {state.selectedCountry && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 bg-white/5 border border-white/10 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Starting Position
                  </h3>
                  <p className="text-sm text-white/40">
                    Lead {state.selectedCountry.name} from {state.startYear} to {state.endYear}
                  </p>
                </div>
                <OHIScoreDisplay
                  score={state.selectedCountry.initialOHIScore}
                  size="sm"
                  showDelta={false}
                />
              </div>
            </motion.div>
          )}
          
          {/* Start Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={startGame}
            disabled={!state.selectedCountry}
            className={cn(
              'w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all',
              state.selectedCountry
                ? 'bg-adl-accent text-white hover:bg-adl-blue-light'
                : 'bg-white/10 text-white/40 cursor-not-allowed'
            )}
          >
            <Play className="w-5 h-5" />
            Begin Simulation
          </motion.button>
          
          {/* Info */}
          <p className="text-center text-xs text-white/30 mt-4">
            Powered by Arthur D. Little Occupational Health Framework
          </p>
        </motion.div>
      </div>
    );
  }
  
  // Game Over Screen
  if (state.phase === 'ended' && state.selectedCountry) {
    return (
      <GameOverSummary
        country={state.selectedCountry}
        statistics={state.statistics}
        history={state.history}
        onPlayAgain={() => {
          selectCountry(state.selectedCountry!);
          startGame();
        }}
        onNewCountry={resetGame}
      />
    );
  }
  
  // Main Game UI
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Event Modal */}
      <AnimatePresence>
        {state.currentEvent && state.phase === 'event' && (
          <EventCard
            event={state.currentEvent}
            onResolve={resolveEvent}
            onDismiss={dismissEvent}
          />
        )}
      </AnimatePresence>
      
      {/* World Map Modal */}
      <AnimatePresence>
        {state.showWorldMap && (
          <WorldMapView
            rankings={state.rankings}
            playerIso={state.selectedCountry?.iso_code || ''}
            onClose={toggleWorldMap}
          />
        )}
      </AnimatePresence>
      
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-4">
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
            <Sparkles className="w-5 h-5 text-adl-accent" />
          </motion.div>
          <div>
            <h1 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              Sovereign Health
              <span className="px-2 py-0.5 text-[10px] font-mono bg-adl-accent/20 text-adl-accent rounded-full">
                SIMULATION
              </span>
            </h1>
            <p className="text-white/40 text-sm">
              {state.selectedCountry?.name} • Year {state.currentYear}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('policies')}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5',
                activeTab === 'policies'
                  ? 'bg-adl-accent text-white'
                  : 'text-white/60 hover:text-white'
              )}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Policies
            </button>
            <button
              onClick={() => setActiveTab('budget')}
              className={cn(
                'px-3 py-1.5 rounded text-xs font-medium transition-all flex items-center gap-1.5',
                activeTab === 'budget'
                  ? 'bg-adl-accent text-white'
                  : 'text-white/60 hover:text-white'
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              Budget
            </button>
          </div>
          
          {/* World Map Toggle */}
          <button
            onClick={toggleWorldMap}
            className={cn(
              'p-2 rounded-lg transition-colors',
              state.showWorldMap
                ? 'bg-adl-accent/20 text-adl-accent'
                : 'bg-white/5 text-white/40 hover:text-white'
            )}
          >
            <Map className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Three-Panel Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-4">
        {/* Left Panel: Policies/Budget */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-adl-accent" />
            <h2 className="text-sm font-semibold text-white">
              {activeTab === 'policies' ? 'Policy Framework' : 'Budget Allocation'}
            </h2>
          </div>
          
          <div className="flex-1 min-h-0 overflow-auto">
            {activeTab === 'policies' ? (
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
            ) : state.selectedCountry ? (
              <BudgetAllocator
                budget={state.budget}
                country={state.selectedCountry}
                onAllocate={allocateBudget}
                disabled={state.phase !== 'playing' && state.phase !== 'paused'}
              />
            ) : null}
          </div>
        </div>
        
        {/* Center Panel: Rankings */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-adl-accent" />
              <h2 className="text-sm font-semibold text-white">Global Rankings</h2>
            </div>
            <span className="text-xs text-white/40">
              {state.rankings.length} countries
            </span>
          </div>
          
          <div className="flex-1 min-h-0 p-4 overflow-auto">
            <RankingsLadder
              rankings={state.rankings}
              playerIso={state.selectedCountry?.iso_code || ''}
            />
          </div>
        </div>
        
        {/* Right Panel: Stats */}
        <div className="col-span-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 py-3 border-b border-white/5">
            <BarChart3 className="w-4 h-4 text-adl-accent" />
            <h2 className="text-sm font-semibold text-white">Statistics</h2>
          </div>
          
          <div className="flex-1 min-h-0 p-4 overflow-auto">
            <StatsDashboard
              pillars={state.pillars}
              previousPillars={previousCycle?.pillars}
              ohiScore={state.ohiScore}
              previousScore={previousCycle?.ohiScore}
              rank={state.statistics.currentRank}
              previousRank={previousCycle?.rank}
              statistics={state.statistics}
              history={state.history}
              currentYear={state.currentYear}
            />
          </div>
        </div>
      </div>
      
      {/* Timeline Controls */}
      <div className="flex-shrink-0 mt-4">
        <TimelineControl
          currentYear={state.currentYear}
          startYear={state.startYear}
          endYear={state.endYear}
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

export default GameContainer;
