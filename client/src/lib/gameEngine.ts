/**
 * Sovereign Health: Game Simulation Engine
 * 
 * Deterministic scoring engine with policy impact calculations
 * Based on the ADL Occupational Health Framework
 */

import type {
  GameState,
  PillarScores,
  PillarDelta,
  PillarId,
  BudgetAllocation,
  PolicyState,
  PolicyDefinition,
  ActiveEffect,
  CountryRanking,
  SimulationResult,
  CycleHistory,
  PolicyEffect,
  EventEffect,
  Achievement,
  MaturityStage,
  CountryData,
  BudgetState,
  GameStatistics,
} from '../components/simulator/types';

import { PILLAR_WEIGHTS, MATURITY_STAGES, YEARS_PER_CYCLE } from '../components/simulator/types';

// ============================================================================
// SCORE CALCULATIONS
// ============================================================================

/**
 * Calculate the ADL OHI Score from pillar scores
 * Score range: 1.0 - 4.0
 */
export function calculateOHIScore(pillars: PillarScores): number {
  const weightedScore = 
    pillars.governance * PILLAR_WEIGHTS.governance +
    pillars.hazardControl * PILLAR_WEIGHTS.hazardControl +
    pillars.healthVigilance * PILLAR_WEIGHTS.healthVigilance +
    pillars.restoration * PILLAR_WEIGHTS.restoration;
  
  // Convert 0-100 scale to 1.0-4.0 scale
  const ohiScore = 1.0 + (weightedScore / 100) * 3.0;
  
  return Math.round(ohiScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Get maturity stage from OHI score
 */
export function getMaturityStage(score: number): MaturityStage {
  for (const stage of MATURITY_STAGES) {
    if (score >= stage.minScore && score <= stage.maxScore) {
      return stage;
    }
  }
  return MATURITY_STAGES[0]; // Default to Critical
}

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// ============================================================================
// POLICY IMPACT CALCULATIONS
// ============================================================================

/**
 * Calculate the total impact of all active policies for this cycle
 */
export function calculatePolicyImpact(
  policies: PolicyState[],
  policyDefinitions: Map<string, PolicyDefinition>
): { delta: PillarDelta; effects: PolicyEffect[] } {
  const delta: PillarDelta = {
    governance: 0,
    hazardControl: 0,
    healthVigilance: 0,
    restoration: 0,
  };
  
  const effects: PolicyEffect[] = [];
  
  for (const policy of policies) {
    if (policy.currentLevel === 0) continue;
    
    const definition = policyDefinitions.get(policy.policyId);
    if (!definition) continue;
    
    // Calculate impact based on current level with diminishing returns
    const diminishingFactor = 1 - (policy.currentLevel - 1) * 0.1;
    const effectiveMultiplier = policy.currentLevel * Math.max(0.5, diminishingFactor);
    
    const contribution: PillarDelta = {
      governance: definition.impactPerLevel.governance * effectiveMultiplier,
      hazardControl: definition.impactPerLevel.hazardControl * effectiveMultiplier,
      healthVigilance: definition.impactPerLevel.healthVigilance * effectiveMultiplier,
      restoration: definition.impactPerLevel.restoration * effectiveMultiplier,
    };
    
    delta.governance += contribution.governance;
    delta.hazardControl += contribution.hazardControl;
    delta.healthVigilance += contribution.healthVigilance;
    delta.restoration += contribution.restoration;
    
    effects.push({
      policyId: policy.policyId,
      policyName: definition.name,
      contribution,
    });
  }
  
  return { delta, effects };
}

/**
 * Calculate impact of active long-term effects
 */
export function calculateEventEffects(
  activeEffects: ActiveEffect[]
): { delta: PillarDelta; effects: EventEffect[] } {
  const delta: PillarDelta = {
    governance: 0,
    hazardControl: 0,
    healthVigilance: 0,
    restoration: 0,
  };
  
  const effects: EventEffect[] = [];
  
  for (const effect of activeEffects) {
    delta[effect.pillar] += effect.deltaPerCycle;
    
    effects.push({
      eventId: effect.eventId,
      description: effect.description,
      contribution: {
        governance: effect.pillar === 'governance' ? effect.deltaPerCycle : 0,
        hazardControl: effect.pillar === 'hazardControl' ? effect.deltaPerCycle : 0,
        healthVigilance: effect.pillar === 'healthVigilance' ? effect.deltaPerCycle : 0,
        restoration: effect.pillar === 'restoration' ? effect.deltaPerCycle : 0,
      },
    });
  }
  
  return { delta, effects };
}

// ============================================================================
// RANKING CALCULATIONS
// ============================================================================

/**
 * Generate mock country scores for rankings
 */
export function generateBaseRankings(playerCountry: CountryData): CountryRanking[] {
  const baseCountries = [
    { iso: 'DEU', name: 'Germany', score: 3.8 },
    { iso: 'SWE', name: 'Sweden', score: 3.9 },
    { iso: 'NLD', name: 'Netherlands', score: 3.7 },
    { iso: 'GBR', name: 'United Kingdom', score: 3.5 },
    { iso: 'JPN', name: 'Japan', score: 3.6 },
    { iso: 'SGP', name: 'Singapore', score: 3.4 },
    { iso: 'AUS', name: 'Australia', score: 3.5 },
    { iso: 'CAN', name: 'Canada', score: 3.4 },
    { iso: 'FRA', name: 'France', score: 3.3 },
    { iso: 'USA', name: 'United States', score: 3.2 },
    { iso: 'KOR', name: 'South Korea', score: 3.1 },
    { iso: 'NZL', name: 'New Zealand', score: 3.3 },
    { iso: 'CHE', name: 'Switzerland', score: 3.7 },
    { iso: 'NOR', name: 'Norway', score: 3.8 },
    { iso: 'DNK', name: 'Denmark', score: 3.6 },
    { iso: 'ESP', name: 'Spain', score: 2.9 },
    { iso: 'ITA', name: 'Italy', score: 2.8 },
    { iso: 'CHN', name: 'China', score: 2.4 },
    { iso: 'IND', name: 'India', score: 2.0 },
    { iso: 'BRA', name: 'Brazil', score: 2.2 },
    { iso: 'MEX', name: 'Mexico', score: 2.1 },
    { iso: 'ZAF', name: 'South Africa', score: 2.1 },
    { iso: 'NGA', name: 'Nigeria', score: 1.5 },
    { iso: 'BGD', name: 'Bangladesh', score: 1.5 },
    { iso: 'ETH', name: 'Ethiopia', score: 1.3 },
  ];
  
  const filteredCountries = baseCountries.filter(c => c.iso !== playerCountry.iso_code);
  
  const allCountries = [
    ...filteredCountries,
    { iso: playerCountry.iso_code, name: playerCountry.name, score: playerCountry.initialOHIScore },
  ];
  
  allCountries.sort((a, b) => b.score - a.score);
  
  return allCountries.map((country, index) => ({
    iso_code: country.iso,
    name: country.name,
    currentScore: country.score,
    previousScore: country.score,
    currentRank: index + 1,
    previousRank: index + 1,
    rankDelta: 0,
    isPlayer: country.iso === playerCountry.iso_code,
  }));
}

/**
 * Recalculate rankings after player score changes
 */
export function recalculateRankings(
  currentRankings: CountryRanking[],
  playerIso: string,
  newPlayerScore: number
): CountryRanking[] {
  const updatedRankings = currentRankings.map(r => ({
    ...r,
    previousScore: r.currentScore,
    previousRank: r.currentRank,
    currentScore: r.iso_code === playerIso ? newPlayerScore : r.currentScore,
  }));
  
  updatedRankings.sort((a, b) => b.currentScore - a.currentScore);
  
  return updatedRankings.map((r, index) => ({
    ...r,
    currentRank: index + 1,
    rankDelta: r.previousRank - (index + 1),
  }));
}

// ============================================================================
// BUDGET CALCULATIONS
// ============================================================================

/**
 * Calculate budget points from country GDP
 */
export function calculateBudgetPoints(country: CountryData): number {
  const gdpBillions = country.gdp;
  const healthPct = country.healthExpenditure / 100;
  const ohBudgetFactor = 0.003;
  
  const basePoints = Math.log10(gdpBillions * healthPct * ohBudgetFactor * 1000 + 1) * 150;
  const formalBonus = (country.formalSectorPct / 100) * 100;
  
  return Math.round(clamp(basePoints + formalBonus, 100, 1200));
}

/**
 * Create initial budget state for a country
 */
export function createInitialBudget(country: CountryData): BudgetState {
  const totalPoints = calculateBudgetPoints(country);
  
  return {
    totalBudgetPoints: totalPoints,
    allocated: {
      governance: Math.round(totalPoints * 0.25),
      hazardControl: Math.round(totalPoints * 0.25),
      healthVigilance: Math.round(totalPoints * 0.25),
      restoration: Math.round(totalPoints * 0.25),
    },
    spent: {
      governance: 0,
      hazardControl: 0,
      healthVigilance: 0,
      restoration: 0,
    },
    carryOver: 0,
  };
}

// ============================================================================
// SIMULATION ENGINE
// ============================================================================

/**
 * Main simulation function - advances the game by one cycle
 */
export function simulateCycle(
  state: GameState,
  policyDefinitions: Map<string, PolicyDefinition>
): SimulationResult {
  const { delta: policyDelta, effects: policyEffects } = calculatePolicyImpact(
    state.policies,
    policyDefinitions
  );
  
  const { delta: eventDelta, effects: eventEffects } = calculateEventEffects(
    state.activeEffects
  );
  
  const naturalDelta = calculateNaturalChange(state.pillars, state.budget);
  
  const totalDelta: PillarDelta = {
    governance: policyDelta.governance + eventDelta.governance + naturalDelta.governance,
    hazardControl: policyDelta.hazardControl + eventDelta.hazardControl + naturalDelta.hazardControl,
    healthVigilance: policyDelta.healthVigilance + eventDelta.healthVigilance + naturalDelta.healthVigilance,
    restoration: policyDelta.restoration + eventDelta.restoration + naturalDelta.restoration,
  };
  
  const newPillars: PillarScores = {
    governance: clamp(state.pillars.governance + totalDelta.governance, 0, 100),
    hazardControl: clamp(state.pillars.hazardControl + totalDelta.hazardControl, 0, 100),
    healthVigilance: clamp(state.pillars.healthVigilance + totalDelta.healthVigilance, 0, 100),
    restoration: clamp(state.pillars.restoration + totalDelta.restoration, 0, 100),
  };
  
  const newOHIScore = calculateOHIScore(newPillars);
  const scoreDelta = newOHIScore - state.ohiScore;
  
  const newRankings = recalculateRankings(
    state.rankings,
    state.selectedCountry?.iso_code || '',
    newOHIScore
  );
  
  const playerRanking = newRankings.find(r => r.isPlayer);
  const newRank = playerRanking?.currentRank || 50;
  const rankDelta = playerRanking?.rankDelta || 0;
  
  const newAchievements = checkAchievements(state, newPillars, newOHIScore, newRank);
  
  const cycleRecord: CycleHistory = {
    cycleNumber: state.cycleNumber + 1,
    year: state.currentYear + YEARS_PER_CYCLE,
    pillars: newPillars,
    ohiScore: newOHIScore,
    rank: newRank,
    budgetSpent: { ...state.budget.spent },
    policiesActive: state.policies.filter(p => p.currentLevel > 0).map(p => p.policyId),
    eventsOccurred: state.currentEvent ? [state.currentEvent.id] : [],
    choicesMade: state.currentEvent?.selectedChoice 
      ? { [state.currentEvent.id]: state.currentEvent.selectedChoice }
      : {},
  };
  
  return {
    newPillars,
    pillarDeltas: totalDelta,
    newOHIScore,
    scoreDelta,
    newRank,
    rankDelta,
    policyEffects,
    eventEffects,
    newAchievements,
    cycleRecord,
  };
}

function calculateNaturalChange(pillars: PillarScores, budget: BudgetState): PillarDelta {
  const totalBudget = budget.totalBudgetPoints;
  const idealPerPillar = totalBudget / 4;
  
  const delta: PillarDelta = {
    governance: 0,
    hazardControl: 0,
    healthVigilance: 0,
    restoration: 0,
  };
  
  const pillarsArray: PillarId[] = ['governance', 'hazardControl', 'healthVigilance', 'restoration'];
  
  for (const pillarId of pillarsArray) {
    const allocated = budget.allocated[pillarId];
    const ratio = allocated / idealPerPillar;
    
    if (ratio < 0.5) {
      delta[pillarId] = -2;
    } else if (ratio < 0.8) {
      delta[pillarId] = -1;
    } else if (ratio > 1.2) {
      delta[pillarId] = 0.5;
    }
  }
  
  return delta;
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

const ACHIEVEMENT_DEFINITIONS: Omit<Achievement, 'unlockedYear' | 'isUnlocked'>[] = [
  { id: 'first_steps', name: 'First Steps', description: 'Complete your first policy cycle', icon: 'Footprints' },
  { id: 'score_improvement', name: 'Rising Star', description: 'Improve your OHI score by 0.5 points', icon: 'TrendingUp' },
  { id: 'top_50', name: 'Breaking Through', description: 'Reach the top 50 countries', icon: 'ArrowUp' },
  { id: 'top_20', name: 'Elite Status', description: 'Reach the top 20 countries', icon: 'Award' },
  { id: 'top_10', name: 'World Leader', description: 'Reach the top 10 countries', icon: 'Trophy' },
  { id: 'governance_master', name: 'Governance Master', description: 'Reach 80+ Governance score', icon: 'Crown' },
  { id: 'hazard_master', name: 'Safety Champion', description: 'Reach 80+ Hazard Control score', icon: 'Shield' },
  { id: 'vigilance_master', name: 'Vigilance Expert', description: 'Reach 80+ Health Vigilance score', icon: 'Eye' },
  { id: 'restoration_master', name: 'Restoration Leader', description: 'Reach 80+ Restoration score', icon: 'Heart' },
  { id: 'balanced', name: 'Balanced Approach', description: 'All pillars above 60', icon: 'Scale' },
  { id: 'leading', name: 'Leading Nation', description: 'Achieve "Leading" maturity stage (3.5+)', icon: 'Star' },
  { id: 'decade', name: 'Decade of Progress', description: 'Play for 10 years (2 cycles)', icon: 'Calendar' },
  { id: 'quarter_century', name: 'Quarter Century', description: 'Play for 25 years (5 cycles)', icon: 'Clock' },
];

function checkAchievements(
  state: GameState,
  newPillars: PillarScores,
  newScore: number,
  newRank: number
): Achievement[] {
  const newAchievements: Achievement[] = [];
  const currentYear = state.currentYear + YEARS_PER_CYCLE;
  const existingIds = new Set(state.statistics.achievements.map(a => a.id));
  
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    if (existingIds.has(def.id)) continue;
    
    let unlocked = false;
    
    switch (def.id) {
      case 'first_steps':
        unlocked = state.cycleNumber === 0;
        break;
      case 'score_improvement':
        unlocked = newScore - state.statistics.startingOHIScore >= 0.5;
        break;
      case 'top_50':
        unlocked = newRank <= 50;
        break;
      case 'top_20':
        unlocked = newRank <= 20;
        break;
      case 'top_10':
        unlocked = newRank <= 10;
        break;
      case 'governance_master':
        unlocked = newPillars.governance >= 80;
        break;
      case 'hazard_master':
        unlocked = newPillars.hazardControl >= 80;
        break;
      case 'vigilance_master':
        unlocked = newPillars.healthVigilance >= 80;
        break;
      case 'restoration_master':
        unlocked = newPillars.restoration >= 80;
        break;
      case 'balanced':
        unlocked = Object.values(newPillars).every(v => v >= 60);
        break;
      case 'leading':
        unlocked = newScore >= 3.5;
        break;
      case 'decade':
        unlocked = currentYear - state.startYear >= 10;
        break;
      case 'quarter_century':
        unlocked = currentYear - state.startYear >= 25;
        break;
    }
    
    if (unlocked) {
      newAchievements.push({
        ...def,
        unlockedYear: currentYear,
        isUnlocked: true,
      });
    }
  }
  
  return newAchievements;
}

// ============================================================================
// INITIAL STATE HELPERS
// ============================================================================

/**
 * Create initial game statistics
 */
export function createInitialStatistics(country: CountryData, initialRank: number): GameStatistics {
  return {
    totalCyclesPlayed: 0,
    startingOHIScore: country.initialOHIScore,
    currentOHIScore: country.initialOHIScore,
    peakOHIScore: country.initialOHIScore,
    lowestOHIScore: country.initialOHIScore,
    startingRank: initialRank,
    currentRank: initialRank,
    bestRank: initialRank,
    totalBudgetSpent: 0,
    policiesMaxed: 0,
    eventsHandled: 0,
    criticalEventsManaged: 0,
    pillarProgress: {
      governance: 0,
      hazardControl: 0,
      healthVigilance: 0,
      restoration: 0,
    },
    achievements: [],
  };
}

/**
 * Update active effects (decrement remaining cycles, remove expired)
 */
export function updateActiveEffects(effects: ActiveEffect[]): ActiveEffect[] {
  return effects
    .map(e => ({ ...e, remainingCycles: e.remainingCycles - 1 }))
    .filter(e => e.remainingCycles > 0);
}

/**
 * Determine if an event should trigger this cycle
 */
export function shouldTriggerEvent(state: GameState): boolean {
  let probability = 0.4;
  
  if (state.history.length > 0) {
    const lastEventCycle = state.history.findLastIndex(h => h.eventsOccurred.length > 0);
    if (lastEventCycle === -1 || state.cycleNumber - lastEventCycle > 2) {
      probability += 0.2;
    }
  }
  
  if (state.ohiScore < 2.0 || state.ohiScore > 3.5) {
    probability += 0.1;
  }
  
  return Math.random() < probability;
}
