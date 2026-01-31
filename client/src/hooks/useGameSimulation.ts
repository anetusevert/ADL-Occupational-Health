/**
 * Sovereign Health: Game State Management
 * 
 * React Context + useReducer for complex game state
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, useRef } from 'react';
import type {
  GameState,
  GameAction,
  CountryData,
  GameSpeed,
  BudgetAllocation,
  GameEvent,
  PillarId,
  PolicyState,
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
} from '../lib/gameEngine';
import { createPolicyMap, ALL_POLICIES } from '../data/policyDefinitions';

// ============================================================================
// INITIAL STATE
// ============================================================================

const createEmptyPillars = () => ({
  governance: 50,
  hazardControl: 50,
  healthVigilance: 50,
  restoration: 50,
});

const createEmptyBudget = () => ({
  totalBudgetPoints: 0,
  allocated: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 0 },
  spent: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 0 },
  carryOver: 0,
});

const createEmptyStatistics = () => ({
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
});

const initialState: GameState = {
  phase: 'setup',
  speed: 'medium',
  isAutoAdvancing: false,
  currentYear: DEFAULT_START_YEAR,
  startYear: DEFAULT_START_YEAR,
  endYear: DEFAULT_END_YEAR,
  cycleNumber: 0,
  selectedCountry: null,
  pillars: createEmptyPillars(),
  ohiScore: 2.5,
  budget: createEmptyBudget(),
  policies: [],
  currentEvent: null,
  activeEffects: [],
  rankings: [],
  history: [],
  statistics: createEmptyStatistics(),
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
      const playerRanking = rankings.find(r => r.isPlayer);
      const initialRank = playerRanking?.currentRank || 50;
      
      // Initialize policies as empty states
      const policies: PolicyState[] = ALL_POLICIES.map(def => ({
        policyId: def.id,
        currentLevel: 0,
        investedThisCycle: 0,
        totalInvested: 0,
        status: def.unlockYear <= DEFAULT_START_YEAR && def.prerequisites.length === 0 ? 'available' : 'locked',
        effectiveFrom: 0,
      }));
      
      return {
        ...state,
        selectedCountry: country,
        pillars: { ...country.initialPillars },
        ohiScore: country.initialOHIScore,
        budget,
        rankings,
        policies,
        statistics: createInitialStatistics(country, initialRank),
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
      return { ...state, speed: action.speed };
    }
    
    case 'TOGGLE_AUTO_ADVANCE': {
      return { ...state, isAutoAdvancing: !state.isAutoAdvancing };
    }
    
    case 'PAUSE_GAME': {
      return { ...state, phase: 'paused', isAutoAdvancing: false };
    }
    
    case 'RESUME_GAME': {
      return { ...state, phase: 'playing' };
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
      const policyDef = ALL_POLICIES.find(p => p.id === policyId);
      if (!policyDef) return state;
      
      const pillarId = policyDef.pillar;
      const available = state.budget.allocated[pillarId] - state.budget.spent[pillarId];
      if (points > available) return state;
      
      const updatedPolicies = state.policies.map(p => {
        if (p.policyId !== policyId) return p;
        const newLevel = Math.min(p.currentLevel + 1, policyDef.maxLevel);
        return {
          ...p,
          currentLevel: newLevel,
          investedThisCycle: p.investedThisCycle + points,
          totalInvested: p.totalInvested + points,
          status: newLevel >= policyDef.maxLevel ? 'maxed' : 'active',
          effectiveFrom: p.effectiveFrom || state.currentYear,
        } as PolicyState;
      });
      
      const newSpent = {
        ...state.budget.spent,
        [pillarId]: state.budget.spent[pillarId] + points,
      };
      
      return {
        ...state,
        policies: updatedPolicies,
        budget: { ...state.budget, spent: newSpent },
      };
    }
    
    case 'ADVANCE_CYCLE': {
      if (state.currentYear >= state.endYear) {
        return { ...state, phase: 'ended' };
      }
      
      const policyMap = createPolicyMap();
      const result = simulateCycle(state, policyMap);
      
      const newStats = {
        ...state.statistics,
        totalCyclesPlayed: state.statistics.totalCyclesPlayed + 1,
        currentOHIScore: result.newOHIScore,
        peakOHIScore: Math.max(state.statistics.peakOHIScore, result.newOHIScore),
        lowestOHIScore: Math.min(state.statistics.lowestOHIScore, result.newOHIScore),
        currentRank: result.newRank,
        bestRank: Math.min(state.statistics.bestRank, result.newRank),
        totalBudgetSpent: state.statistics.totalBudgetSpent + 
          Object.values(state.budget.spent).reduce((a, b) => a + b, 0),
        policiesMaxed: state.policies.filter(p => p.status === 'maxed').length,
        achievements: [...state.statistics.achievements, ...result.newAchievements],
      };
      
      const newRankings = state.rankings.map(r => {
        if (r.iso_code === state.selectedCountry?.iso_code) {
          return {
            ...r,
            previousScore: r.currentScore,
            previousRank: r.currentRank,
            currentScore: result.newOHIScore,
            currentRank: result.newRank,
            rankDelta: r.currentRank - result.newRank,
          };
        }
        return r;
      }).sort((a, b) => b.currentScore - a.currentScore);
      
      // Re-assign ranks after sorting
      newRankings.forEach((r, i) => {
        r.currentRank = i + 1;
        if (r.iso_code !== state.selectedCountry?.iso_code) {
          r.rankDelta = r.previousRank - r.currentRank;
        }
      });
      
      return {
        ...state,
        currentYear: state.currentYear + YEARS_PER_CYCLE,
        cycleNumber: state.cycleNumber + 1,
        pillars: result.newPillars,
        ohiScore: result.newOHIScore,
        rankings: newRankings,
        history: [...state.history, result.cycleRecord],
        statistics: newStats,
        activeEffects: updateActiveEffects(state.activeEffects),
        budget: {
          ...state.budget,
          spent: { governance: 0, hazardControl: 0, healthVigilance: 0, restoration: 0 },
        },
        policies: state.policies.map(p => ({ ...p, investedThisCycle: 0 })),
      };
    }
    
    case 'TRIGGER_EVENT': {
      return {
        ...state,
        phase: 'event',
        currentEvent: action.event,
      };
    }
    
    case 'RESOLVE_EVENT': {
      if (!state.currentEvent) return state;
      
      const choice = state.currentEvent.choices.find(c => c.id === action.choiceId);
      if (!choice) return state;
      
      // Apply immediate impacts
      const newPillars = { ...state.pillars };
      if (choice.impacts) {
        Object.entries(choice.impacts).forEach(([key, value]) => {
          if (key in newPillars && typeof value === 'number') {
            newPillars[key as keyof typeof newPillars] = Math.max(0, Math.min(100, 
              newPillars[key as keyof typeof newPillars] + value
            ));
          }
        });
      }
      
      // Add long-term effects
      const newEffects = [...state.activeEffects];
      if (choice.longTermEffects) {
        choice.longTermEffects.forEach((effect) => {
          newEffects.push({
            id: `${state.currentEvent!.id}_${effect.pillar}`,
            eventId: state.currentEvent!.id,
            description: effect.description,
            pillar: effect.pillar,
            deltaPerCycle: effect.delta,
            remainingCycles: effect.duration,
            isPositive: effect.delta > 0,
          });
        });
      }
      
      // Deduct cost from appropriate pillar budget
      const costPillar = state.currentEvent.type === 'crisis' ? 'governance' : 'governance';
      const newSpent = {
        ...state.budget.spent,
        [costPillar]: state.budget.spent[costPillar] + choice.cost,
      };
      
      return {
        ...state,
        phase: 'playing',
        pillars: newPillars,
        ohiScore: calculateOHIScore(newPillars),
        currentEvent: { ...state.currentEvent, isResolved: true, selectedChoice: action.choiceId },
        activeEffects: newEffects,
        budget: { ...state.budget, spent: newSpent },
        statistics: {
          ...state.statistics,
          eventsHandled: state.statistics.eventsHandled + 1,
          criticalEventsManaged: state.currentEvent.severity === 'critical' 
            ? state.statistics.criticalEventsManaged + 1 
            : state.statistics.criticalEventsManaged,
        },
      };
    }
    
    case 'DISMISS_EVENT': {
      return {
        ...state,
        phase: 'playing',
        currentEvent: null,
      };
    }
    
    case 'SELECT_PILLAR': {
      return { ...state, selectedPillar: action.pillar };
    }
    
    case 'TOGGLE_WORLD_MAP': {
      return { ...state, showWorldMap: !state.showWorldMap };
    }
    
    case 'END_GAME': {
      return { ...state, phase: 'ended', isAutoAdvancing: false };
    }
    
    case 'RESET_GAME': {
      return { ...initialState };
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
  // Action helpers
  selectCountry: (country: CountryData) => void;
  startGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setSpeed: (speed: GameSpeed) => void;
  toggleAutoAdvance: () => void;
  allocateBudget: (allocation: BudgetAllocation) => void;
  investInPolicy: (policyId: string, cost: number) => void;
  advanceCycle: () => void;
  triggerEvent: (event: GameEvent) => void;
  resolveEvent: (choiceId: string) => void;
  dismissEvent: () => void;
  selectPillar: (pillar: PillarId | null) => void;
  toggleWorldMap: () => void;
  resetGame: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  
  // Auto-advance effect
  useEffect(() => {
    if (state.phase === 'playing' && state.isAutoAdvancing) {
      const duration = SPEED_DURATIONS[state.speed];
      
      autoAdvanceRef.current = setTimeout(() => {
        dispatch({ type: 'ADVANCE_CYCLE' });
      }, duration);
      
      return () => {
        if (autoAdvanceRef.current) {
          clearTimeout(autoAdvanceRef.current);
        }
      };
    }
  }, [state.phase, state.isAutoAdvancing, state.speed, state.cycleNumber]);
  
  // Action helpers
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
  
  const investInPolicy = useCallback((policyId: string, cost: number) => {
    dispatch({ type: 'INVEST_POLICY', policyId, points: cost });
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
    resetGame,
  };
  
  return React.createElement(GameContext.Provider, { value }, children);
}

export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

// Selectors
export function useGamePhase() {
  const { state } = useGame();
  return state.phase;
}

export function useOHIScore() {
  const { state } = useGame();
  return state.ohiScore;
}

export function usePillars() {
  const { state } = useGame();
  return state.pillars;
}

export function useRankings() {
  const { state } = useGame();
  return state.rankings;
}
