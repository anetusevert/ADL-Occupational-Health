/**
 * Sovereign Health: Game State Management
 * 
 * React Context + useReducer for complex game state management
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type {
  GameState,
  GameAction,
  GamePhase,
  GameSpeed,
  PillarId,
  CountryData,
  BudgetAllocation,
  PolicyState,
  GameEvent,
  CountryRanking,
  SimulationResult,
  ActiveEffect,
} from '../components/simulator/types';

import {
  DEFAULT_START_YEAR,
  DEFAULT_END_YEAR,
  YEARS_PER_CYCLE,
  SPEED_DURATIONS,
} from '../components/simulator/types';

import {
  calculateOHIScore,
  createInitialBudget,
  generateBaseRankings,
  createInitialStatistics,
  simulateCycle,
  updateActiveEffects,
  shouldTriggerEvent,
} from '../lib/gameEngine';

import { createPolicyMap, ALL_POLICIES } from '../data/policyDefinitions';

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialState: GameState = {
  phase: 'setup',
  speed: 'medium',
  isAutoAdvancing: false,
  currentYear: DEFAULT_START_YEAR,
  startYear: DEFAULT_START_YEAR,
  endYear: DEFAULT_END_YEAR,
  cycleNumber: 0,
  selectedCountry: null,
  pillars: {
    governance: 50,
    hazardControl: 50,
    healthVigilance: 50,
    restoration: 50,
  },
  ohiScore: 2.5,
  budget: {
    totalBudgetPoints: 500,
    allocated: { governance: 125, hazardControl: 125, healthVigilance: 125, restoration: 125 },
    spent: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 0 },
    carryOver: 0,
  },
  policies: [],
  currentEvent: null,
  activeEffects: [],
  rankings: [],
  history: [],
  statistics: {
    totalCyclesPlayed: 0,
    startingOHIScore: 2.5,
    currentOHIScore: 2.5,
    peakOHIScore: 2.5,
    lowestOHIScore: 2.5,
    startingRank: 50,
    currentRank: 50,
    bestRank: 50,
    totalBudgetSpent: 0,
    policiesMaxed: 0,
    eventsHandled: 0,
    criticalEventsManaged: 0,
    pillarProgress: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 0 },
    achievements: [],
  },
  selectedPillar: null,
  showWorldMap: false,
  showTutorial: true,
};

// ============================================================================
// REDUCER
// ============================================================================

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_COUNTRY': {
      const country = action.country;
      const budget = createInitialBudget(country);
      const rankings = generateBaseRankings(country);
      const playerRank = rankings.find(r => r.isPlayer)?.currentRank || 50;
      const statistics = createInitialStatistics(country, playerRank);
      
      // Initialize policies as not invested (level 0)
      const policies: PolicyState[] = ALL_POLICIES.map(p => ({
        policyId: p.id,
        currentLevel: 0,
        investedThisCycle: 0,
        totalInvested: 0,
        status: p.unlockYear <= DEFAULT_START_YEAR && p.prerequisites.length === 0 
          ? 'available' 
          : 'locked',
        effectiveFrom: 0,
      }));
      
      return {
        ...state,
        selectedCountry: country,
        pillars: country.initialPillars,
        ohiScore: country.initialOHIScore,
        budget,
        policies,
        rankings,
        statistics,
        phase: 'setup',
      };
    }
    
    case 'START_GAME': {
      if (!state.selectedCountry) return state;
      return {
        ...state,
        phase: 'playing',
        showTutorial: false,
      };
    }
    
    case 'SET_SPEED': {
      return {
        ...state,
        speed: action.speed,
      };
    }
    
    case 'TOGGLE_AUTO_ADVANCE': {
      return {
        ...state,
        isAutoAdvancing: !state.isAutoAdvancing,
      };
    }
    
    case 'PAUSE_GAME': {
      return {
        ...state,
        phase: 'paused',
        isAutoAdvancing: false,
      };
    }
    
    case 'RESUME_GAME': {
      return {
        ...state,
        phase: 'playing',
      };
    }
    
    case 'ALLOCATE_BUDGET': {
      return {
        ...state,
        budget: {
          ...state.budget,
          allocated: action.allocation,
        },
      };
    }
    
    case 'INVEST_POLICY': {
      const { policyId, points } = action;
      const policyMap = createPolicyMap();
      const definition = policyMap.get(policyId);
      
      if (!definition) return state;
      
      const updatedPolicies = state.policies.map(p => {
        if (p.policyId !== policyId) return p;
        
        const newLevel = Math.min(p.currentLevel + 1, definition.maxLevel);
        const isMaxed = newLevel >= definition.maxLevel;
        
        return {
          ...p,
          currentLevel: newLevel,
          investedThisCycle: p.investedThisCycle + points,
          totalInvested: p.totalInvested + points,
          status: isMaxed ? 'maxed' as const : 'active' as const,
          effectiveFrom: p.effectiveFrom || state.currentYear,
        };
      });
      
      // Update policy availability based on prerequisites
      const activePolicyIds = new Set(
        updatedPolicies.filter(p => p.currentLevel > 0).map(p => p.policyId)
      );
      
      const finalPolicies = updatedPolicies.map(p => {
        if (p.status !== 'locked') return p;
        
        const def = policyMap.get(p.policyId);
        if (!def) return p;
        
        const prereqsMet = def.prerequisites.every(prereq => activePolicyIds.has(prereq));
        const yearUnlocked = def.unlockYear <= state.currentYear;
        
        if (prereqsMet && yearUnlocked) {
          return { ...p, status: 'available' as const };
        }
        return p;
      });
      
      // Update budget spent
      const pillarKey = definition.pillar;
      const newSpent = {
        ...state.budget.spent,
        [pillarKey]: state.budget.spent[pillarKey] + points,
      };
      
      return {
        ...state,
        policies: finalPolicies,
        budget: {
          ...state.budget,
          spent: newSpent,
        },
      };
    }
    
    case 'ADVANCE_CYCLE': {
      const policyMap = createPolicyMap();
      const results = simulateCycle(state, policyMap);
      
      // Update active effects (decrement duration)
      const updatedEffects = updateActiveEffects(state.activeEffects);
      
      // Check if game should end
      const newYear = state.currentYear + YEARS_PER_CYCLE;
      const isGameOver = newYear >= state.endYear;
      
      // Update statistics
      const newStats = {
        ...state.statistics,
        totalCyclesPlayed: state.statistics.totalCyclesPlayed + 1,
        currentOHIScore: results.newOHIScore,
        peakOHIScore: Math.max(state.statistics.peakOHIScore, results.newOHIScore),
        lowestOHIScore: Math.min(state.statistics.lowestOHIScore, results.newOHIScore),
        currentRank: results.newRank,
        bestRank: Math.min(state.statistics.bestRank, results.newRank),
        totalBudgetSpent: state.statistics.totalBudgetSpent + 
          Object.values(state.budget.spent).reduce((a, b) => a + b, 0),
        policiesMaxed: state.policies.filter(p => p.status === 'maxed').length,
        achievements: [...state.statistics.achievements, ...results.newAchievements],
        pillarProgress: {
          governance: results.newPillars.governance - state.statistics.startingOHIScore,
          hazardControl: results.newPillars.hazardControl - state.statistics.startingOHIScore,
          healthVigilance: results.newPillars.healthVigilance - state.statistics.startingOHIScore,
          restoration: results.newPillars.restoration - state.statistics.startingOHIScore,
        },
      };
      
      // Reset per-cycle budget spent, keep allocated
      const resetBudget = {
        ...state.budget,
        spent: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 0 },
        carryOver: Object.values(state.budget.allocated).reduce((a, b) => a + b, 0) - 
                   Object.values(state.budget.spent).reduce((a, b) => a + b, 0),
      };
      
      // Update policy availability for new year
      const activePolicyIds = new Set(
        state.policies.filter(p => p.currentLevel > 0).map(p => p.policyId)
      );
      
      const updatedPolicies = state.policies.map(p => {
        if (p.status !== 'locked') return { ...p, investedThisCycle: 0 };
        
        const def = policyMap.get(p.policyId);
        if (!def) return { ...p, investedThisCycle: 0 };
        
        const prereqsMet = def.prerequisites.every(prereq => activePolicyIds.has(prereq));
        const yearUnlocked = def.unlockYear <= newYear;
        
        if (prereqsMet && yearUnlocked) {
          return { ...p, status: 'available' as const, investedThisCycle: 0 };
        }
        return { ...p, investedThisCycle: 0 };
      });
      
      return {
        ...state,
        phase: isGameOver ? 'ended' : 'results',
        currentYear: newYear,
        cycleNumber: state.cycleNumber + 1,
        pillars: results.newPillars,
        ohiScore: results.newOHIScore,
        budget: resetBudget,
        policies: updatedPolicies,
        activeEffects: updatedEffects,
        rankings: results.cycleRecord.rank ? 
          state.rankings.map(r => r.isPlayer ? { ...r, currentRank: results.cycleRecord.rank } : r) :
          state.rankings,
        history: [...state.history, results.cycleRecord],
        statistics: newStats,
        currentEvent: null,
      };
    }
    
    case 'TRIGGER_EVENT': {
      return {
        ...state,
        phase: 'event',
        currentEvent: action.event,
        isAutoAdvancing: false,
      };
    }
    
    case 'RESOLVE_EVENT': {
      if (!state.currentEvent) return state;
      
      const choice = state.currentEvent.choices.find(c => c.id === action.choiceId);
      if (!choice) return state;
      
      // Apply immediate impacts
      const newPillars = { ...state.pillars };
      if (choice.impacts.governance) newPillars.governance += choice.impacts.governance;
      if (choice.impacts.hazardControl) newPillars.hazardControl += choice.impacts.hazardControl;
      if (choice.impacts.healthVigilance) newPillars.healthVigilance += choice.impacts.healthVigilance;
      if (choice.impacts.restoration) newPillars.restoration += choice.impacts.restoration;
      
      // Clamp pillars to 0-100
      Object.keys(newPillars).forEach(key => {
        const k = key as keyof typeof newPillars;
        newPillars[k] = Math.max(0, Math.min(100, newPillars[k]));
      });
      
      // Add long-term effects
      const newEffects: ActiveEffect[] = (choice.longTermEffects || []).map((effect, i) => ({
        id: `${state.currentEvent!.id}_${i}`,
        eventId: state.currentEvent!.id,
        description: effect.description,
        pillar: effect.pillar,
        deltaPerCycle: effect.delta,
        remainingCycles: effect.duration,
        isPositive: effect.delta > 0,
      }));
      
      // Deduct cost from budget
      const newAllocated = { ...state.budget.allocated };
      if (choice.cost > 0) {
        // Distribute cost across all pillars proportionally
        const total = Object.values(newAllocated).reduce((a, b) => a + b, 0);
        Object.keys(newAllocated).forEach(key => {
          const k = key as keyof typeof newAllocated;
          const proportion = newAllocated[k] / total;
          newAllocated[k] = Math.max(0, newAllocated[k] - choice.cost * proportion);
        });
      }
      
      // Update statistics
      const newStats = {
        ...state.statistics,
        eventsHandled: state.statistics.eventsHandled + 1,
        criticalEventsManaged: state.currentEvent.severity === 'critical' 
          ? state.statistics.criticalEventsManaged + 1 
          : state.statistics.criticalEventsManaged,
      };
      
      return {
        ...state,
        phase: 'playing',
        pillars: newPillars,
        ohiScore: calculateOHIScore(newPillars),
        budget: { ...state.budget, allocated: newAllocated },
        currentEvent: { ...state.currentEvent, isResolved: true, selectedChoice: action.choiceId },
        activeEffects: [...state.activeEffects, ...newEffects],
        statistics: newStats,
      };
    }
    
    case 'DISMISS_EVENT': {
      return {
        ...state,
        phase: 'playing',
        currentEvent: null,
      };
    }
    
    case 'UPDATE_RANKINGS': {
      return {
        ...state,
        rankings: action.rankings,
      };
    }
    
    case 'SELECT_PILLAR': {
      return {
        ...state,
        selectedPillar: action.pillar,
      };
    }
    
    case 'TOGGLE_WORLD_MAP': {
      return {
        ...state,
        showWorldMap: !state.showWorldMap,
      };
    }
    
    case 'END_GAME': {
      return {
        ...state,
        phase: 'ended',
        isAutoAdvancing: false,
      };
    }
    
    case 'RESET_GAME': {
      return initialState;
    }
    
    case 'LOAD_GAME': {
      return action.state;
    }
    
    case 'APPLY_SIMULATION_RESULTS': {
      const { results } = action;
      return {
        ...state,
        pillars: results.newPillars,
        ohiScore: results.newOHIScore,
        history: [...state.history, results.cycleRecord],
        statistics: {
          ...state.statistics,
          currentOHIScore: results.newOHIScore,
          currentRank: results.newRank,
          achievements: [...state.statistics.achievements, ...results.newAchievements],
        },
      };
    }
    
    default:
      return state;
  }
}

// ============================================================================
// CONTEXT
// ============================================================================

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  
  // Convenience actions
  selectCountry: (country: CountryData) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setSpeed: (speed: GameSpeed) => void;
  toggleAutoAdvance: () => void;
  allocateBudget: (allocation: BudgetAllocation) => void;
  investInPolicy: (policyId: string, points: number) => void;
  advanceCycle: () => void;
  triggerEvent: (event: GameEvent) => void;
  resolveEvent: (choiceId: string) => void;
  dismissEvent: () => void;
  selectPillar: (pillar: PillarId | null) => void;
  toggleWorldMap: () => void;
  endGame: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-advance timer
  useEffect(() => {
    if (state.isAutoAdvancing && state.phase === 'playing') {
      const duration = SPEED_DURATIONS[state.speed];
      
      autoAdvanceRef.current = setTimeout(() => {
        // Check if should trigger event before advancing
        if (shouldTriggerEvent(state)) {
          // Event will be triggered by parent component via API
          dispatch({ type: 'PAUSE_GAME' });
        } else {
          dispatch({ type: 'ADVANCE_CYCLE' });
        }
      }, duration);
      
      return () => {
        if (autoAdvanceRef.current) {
          clearTimeout(autoAdvanceRef.current);
        }
      };
    }
  }, [state.isAutoAdvancing, state.phase, state.speed, state.cycleNumber]);
  
  // Convenience action creators
  const selectCountry = useCallback((country: CountryData) => {
    dispatch({ type: 'SELECT_COUNTRY', country });
  }, []);
  
  const startGame = useCallback(() => {
    dispatch({ type: 'START_GAME' });
  }, []);
  
  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' });
  }, []);
  
  const resumeGame = useCallback(() => {
    dispatch({ type: 'RESUME_GAME' });
  }, []);
  
  const setSpeed = useCallback((speed: GameSpeed) => {
    dispatch({ type: 'SET_SPEED', speed });
  }, []);
  
  const toggleAutoAdvance = useCallback(() => {
    dispatch({ type: 'TOGGLE_AUTO_ADVANCE' });
  }, []);
  
  const allocateBudget = useCallback((allocation: BudgetAllocation) => {
    dispatch({ type: 'ALLOCATE_BUDGET', allocation });
  }, []);
  
  const investInPolicy = useCallback((policyId: string, points: number) => {
    dispatch({ type: 'INVEST_POLICY', policyId, points });
  }, []);
  
  const advanceCycle = useCallback(() => {
    dispatch({ type: 'ADVANCE_CYCLE' });
  }, []);
  
  const triggerEvent = useCallback((event: GameEvent) => {
    dispatch({ type: 'TRIGGER_EVENT', event });
  }, []);
  
  const resolveEvent = useCallback((choiceId: string) => {
    if (state.currentEvent) {
      dispatch({ type: 'RESOLVE_EVENT', eventId: state.currentEvent.id, choiceId });
    }
  }, [state.currentEvent]);
  
  const dismissEvent = useCallback(() => {
    dispatch({ type: 'DISMISS_EVENT' });
  }, []);
  
  const selectPillar = useCallback((pillar: PillarId | null) => {
    dispatch({ type: 'SELECT_PILLAR', pillar });
  }, []);
  
  const toggleWorldMap = useCallback(() => {
    dispatch({ type: 'TOGGLE_WORLD_MAP' });
  }, []);
  
  const endGame = useCallback(() => {
    dispatch({ type: 'END_GAME' });
  }, []);
  
  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);
  
  const value: GameContextType = {
    state,
    dispatch,
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
    endGame,
    resetGame,
  };
  
  return React.createElement(GameContext.Provider, { value }, children);
}

// ============================================================================
// HOOK
// ============================================================================

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// ============================================================================
// SELECTORS (for performance optimization)
// ============================================================================

export function useGamePhase(): GamePhase {
  const { state } = useGame();
  return state.phase;
}

export function useGameSpeed(): GameSpeed {
  const { state } = useGame();
  return state.speed;
}

export function useSelectedCountry(): CountryData | null {
  const { state } = useGame();
  return state.selectedCountry;
}

export function usePillarScores() {
  const { state } = useGame();
  return state.pillars;
}

export function useOHIScore(): number {
  const { state } = useGame();
  return state.ohiScore;
}

export function useBudget() {
  const { state } = useGame();
  return state.budget;
}

export function usePolicies() {
  const { state } = useGame();
  return state.policies;
}

export function useRankings() {
  const { state } = useGame();
  return state.rankings;
}

export function useStatistics() {
  const { state } = useGame();
  return state.statistics;
}

export function useCurrentEvent() {
  const { state } = useGame();
  return state.currentEvent;
}

export default GameProvider;
