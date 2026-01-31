/**
 * Sovereign Health: The Occupational Health Strategy Game
 * Type Definitions
 */

export type GamePhase = 'setup' | 'playing' | 'paused' | 'event' | 'results' | 'ended';
export type GameSpeed = 'slow' | 'medium' | 'fast';
export type PillarId = 'governance' | 'hazardControl' | 'healthVigilance' | 'restoration';

export interface CountryData {
  iso_code: string;
  name: string;
  region: string;
  gdp: number;
  population: number;
  healthExpenditure: number;
  laborForce: number;
  formalSectorPct: number;
  initialOHIScore: number;
  initialPillars: PillarScores;
}

export interface BudgetState {
  totalBudgetPoints: number;
  allocated: BudgetAllocation;
  spent: BudgetAllocation;
  carryOver: number;
}

export interface BudgetAllocation {
  governance: number;
  hazardControl: number;
  healthVigilance: number;
  restoration: number;
}

export interface PillarScores {
  governance: number;
  hazardControl: number;
  healthVigilance: number;
  restoration: number;
}

export interface PillarDelta {
  governance: number;
  hazardControl: number;
  healthVigilance: number;
  restoration: number;
}

export type PolicyStatus = 'locked' | 'available' | 'active' | 'maxed';
export type PolicyTier = 1 | 2 | 3;

export interface PolicyDefinition {
  id: string;
  name: string;
  description: string;
  pillar: PillarId;
  tier: PolicyTier;
  baseCost: number;
  maxLevel: number;
  impactPerLevel: PillarDelta;
  prerequisites: string[];
  unlockYear: number;
  icon: string;
  tags: string[];
}

export interface PolicyState {
  policyId: string;
  currentLevel: number;
  investedThisCycle: number;
  totalInvested: number;
  status: PolicyStatus;
  effectiveFrom: number;
}

export type EventType = 'crisis' | 'opportunity' | 'diplomatic' | 'economic' | 'discovery' | 'natural';
export type EventSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  cost: number;
  impacts: Partial<PillarDelta>;
  longTermEffects?: LongTermEffect[];
}

export interface LongTermEffect {
  pillar: PillarId;
  delta: number;
  duration: number;
  description: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  narrative: string;
  imageUrl?: string;
  choices: EventChoice[];
  deadline: number;
  triggeredYear: number;
  isResolved: boolean;
  selectedChoice?: string;
}

export interface ActiveEffect {
  id: string;
  eventId: string;
  description: string;
  pillar: PillarId;
  deltaPerCycle: number;
  remainingCycles: number;
  isPositive: boolean;
}

export interface CountryRanking {
  iso_code: string;
  name: string;
  currentScore: number;
  previousScore: number;
  currentRank: number;
  previousRank: number;
  rankDelta: number;
  isPlayer: boolean;
}

export interface CycleHistory {
  cycleNumber: number;
  year: number;
  pillars: PillarScores;
  ohiScore: number;
  rank: number;
  budgetSpent: BudgetAllocation;
  policiesActive: string[];
  eventsOccurred: string[];
  choicesMade: Record<string, string>;
}

export interface GameStatistics {
  totalCyclesPlayed: number;
  startingOHIScore: number;
  currentOHIScore: number;
  peakOHIScore: number;
  lowestOHIScore: number;
  startingRank: number;
  currentRank: number;
  bestRank: number;
  totalBudgetSpent: number;
  policiesMaxed: number;
  eventsHandled: number;
  criticalEventsManaged: number;
  pillarProgress: PillarDelta;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedYear?: number;
  isUnlocked: boolean;
}

export interface GameState {
  phase: GamePhase;
  speed: GameSpeed;
  isAutoAdvancing: boolean;
  currentYear: number;
  startYear: number;
  endYear: number;
  cycleNumber: number;
  selectedCountry: CountryData | null;
  pillars: PillarScores;
  ohiScore: number;
  budget: BudgetState;
  policies: PolicyState[];
  currentEvent: GameEvent | null;
  activeEffects: ActiveEffect[];
  rankings: CountryRanking[];
  history: CycleHistory[];
  statistics: GameStatistics;
  selectedPillar: PillarId | null;
  showWorldMap: boolean;
  showTutorial: boolean;
}

export type GameAction =
  | { type: 'SELECT_COUNTRY'; country: CountryData }
  | { type: 'START_GAME' }
  | { type: 'SET_SPEED'; speed: GameSpeed }
  | { type: 'TOGGLE_AUTO_ADVANCE' }
  | { type: 'PAUSE_GAME' }
  | { type: 'RESUME_GAME' }
  | { type: 'ALLOCATE_BUDGET'; allocation: BudgetAllocation }
  | { type: 'INVEST_POLICY'; policyId: string; points: number }
  | { type: 'ADVANCE_CYCLE' }
  | { type: 'TRIGGER_EVENT'; event: GameEvent }
  | { type: 'RESOLVE_EVENT'; eventId: string; choiceId: string }
  | { type: 'DISMISS_EVENT' }
  | { type: 'UPDATE_RANKINGS'; rankings: CountryRanking[] }
  | { type: 'SELECT_PILLAR'; pillar: PillarId | null }
  | { type: 'TOGGLE_WORLD_MAP' }
  | { type: 'END_GAME' }
  | { type: 'RESET_GAME' }
  | { type: 'LOAD_GAME'; state: GameState }
  | { type: 'APPLY_SIMULATION_RESULTS'; results: SimulationResult };

export interface SimulationResult {
  newPillars: PillarScores;
  pillarDeltas: PillarDelta;
  newOHIScore: number;
  scoreDelta: number;
  newRank: number;
  rankDelta: number;
  policyEffects: PolicyEffect[];
  eventEffects: EventEffect[];
  newAchievements: Achievement[];
  cycleRecord: CycleHistory;
}

export interface PolicyEffect {
  policyId: string;
  policyName: string;
  contribution: PillarDelta;
}

export interface EventEffect {
  eventId: string;
  description: string;
  contribution: PillarDelta;
}

export interface PillarConfig {
  id: PillarId;
  name: string;
  fullName: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
}

export interface MaturityStage {
  stage: number;
  label: string;
  description: string;
  minScore: number;
  maxScore: number;
  color: string;
}

export const PILLAR_WEIGHTS: Record<PillarId, number> = {
  governance: 0.30,
  hazardControl: 0.25,
  healthVigilance: 0.25,
  restoration: 0.20,
};

export const SPEED_DURATIONS: Record<GameSpeed, number> = {
  slow: 3000,   // 3 seconds per year
  medium: 1500, // 1.5 seconds per year
  fast: 750,    // 0.75 seconds per year
};

export const MATURITY_STAGES: MaturityStage[] = [
  { stage: 1, label: 'Critical', description: 'Reactive systems with major gaps', minScore: 1.0, maxScore: 1.9, color: 'red' },
  { stage: 2, label: 'Developing', description: 'Basic frameworks emerging', minScore: 2.0, maxScore: 2.4, color: 'orange' },
  { stage: 3, label: 'Advancing', description: 'Functional systems with room to grow', minScore: 2.5, maxScore: 3.4, color: 'yellow' },
  { stage: 4, label: 'Leading', description: 'World-class occupational health', minScore: 3.5, maxScore: 4.0, color: 'emerald' },
];

export const PILLAR_CONFIGS: PillarConfig[] = [
  { id: 'governance', name: 'Governance', fullName: 'Governance Ecosystem', icon: 'Crown', color: 'text-purple-400', bgColor: 'bg-purple-500/20', borderColor: 'border-purple-500/30', glowColor: 'shadow-purple-500/50', gradientFrom: 'from-purple-500/30', gradientTo: 'to-purple-600/10' },
  { id: 'hazardControl', name: 'Hazard Control', fullName: 'Hazard Prevention & Control', icon: 'Shield', color: 'text-blue-400', bgColor: 'bg-blue-500/20', borderColor: 'border-blue-500/30', glowColor: 'shadow-blue-500/50', gradientFrom: 'from-blue-500/30', gradientTo: 'to-blue-600/10' },
  { id: 'healthVigilance', name: 'Health Vigilance', fullName: 'Surveillance & Detection', icon: 'Eye', color: 'text-teal-400', bgColor: 'bg-teal-500/20', borderColor: 'border-teal-500/30', glowColor: 'shadow-teal-500/50', gradientFrom: 'from-teal-500/30', gradientTo: 'to-teal-600/10' },
  { id: 'restoration', name: 'Restoration', fullName: 'Restoration & Compensation', icon: 'Heart', color: 'text-amber-400', bgColor: 'bg-amber-500/20', borderColor: 'border-amber-500/30', glowColor: 'shadow-amber-500/50', gradientFrom: 'from-amber-500/30', gradientTo: 'to-amber-600/10' },
];

export const DEFAULT_START_YEAR = 2025;
export const DEFAULT_END_YEAR = 2050;
export const YEARS_PER_CYCLE = 1; // Yearly rounds
export const MAX_CYCLES = DEFAULT_END_YEAR - DEFAULT_START_YEAR;
