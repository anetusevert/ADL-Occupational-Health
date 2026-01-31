/**
 * Sovereign Health: The Occupational Health Strategy Game
 * Type Definitions
 * 
 * A professional-grade, turn-based strategy simulation for occupational health policy
 */

// ============================================================================
// CORE GAME TYPES
// ============================================================================

export type GamePhase = 'setup' | 'playing' | 'paused' | 'event' | 'results' | 'ended';
export type GameSpeed = 'slow' | 'medium' | 'fast';
export type PillarId = 'governance' | 'hazardControl' | 'healthVigilance' | 'restoration';

// ============================================================================
// COUNTRY & BUDGET
// ============================================================================

export interface CountryData {
  iso_code: string;
  name: string;
  region: string;
  gdp: number;                    // Billions USD
  population: number;             // Millions
  healthExpenditure: number;      // % of GDP
  laborForce: number;             // Millions
  formalSectorPct: number;        // % in formal employment
  initialOHIScore: number;        // Starting ADL OHI Score (1.0-4.0)
  initialPillars: PillarScores;   // Starting pillar scores
}

export interface BudgetState {
  totalBudgetPoints: number;      // Available points (derived from GDP)
  allocated: BudgetAllocation;    // Current allocation
  spent: BudgetAllocation;        // Locked in for current cycle
  carryOver: number;              // Unspent from previous cycle
}

export interface BudgetAllocation {
  governance: number;
  hazardControl: number;
  healthVigilance: number;
  restoration: number;
}

// ============================================================================
// PILLAR SCORES
// ============================================================================

export interface PillarScores {
  governance: number;             // 0-100
  hazardControl: number;          // 0-100
  healthVigilance: number;        // 0-100
  restoration: number;            // 0-100
}

export interface PillarDelta {
  governance: number;
  hazardControl: number;
  healthVigilance: number;
  restoration: number;
}

// ============================================================================
// POLICIES
// ============================================================================

export type PolicyStatus = 'locked' | 'available' | 'active' | 'maxed';
export type PolicyTier = 1 | 2 | 3;  // Basic, Advanced, Elite

export interface PolicyDefinition {
  id: string;
  name: string;
  description: string;
  pillar: PillarId;
  tier: PolicyTier;
  baseCost: number;               // Budget points per cycle
  maxLevel: number;               // 1-5 typically
  impactPerLevel: PillarDelta;    // Score change per level
  prerequisites: string[];        // Policy IDs required
  unlockYear: number;             // Year when policy becomes available
  icon: string;                   // Lucide icon name
  tags: string[];                 // For filtering
}

export interface PolicyState {
  policyId: string;
  currentLevel: number;           // 0 = not invested
  investedThisCycle: number;      // Points spent this cycle
  totalInvested: number;          // Cumulative investment
  status: PolicyStatus;
  effectiveFrom: number;          // Year policy started
}

// ============================================================================
// EVENTS
// ============================================================================

export type EventType = 'crisis' | 'opportunity' | 'diplomatic' | 'economic' | 'discovery' | 'natural';
export type EventSeverity = 'minor' | 'moderate' | 'major' | 'critical';

export interface EventChoice {
  id: string;
  label: string;
  description: string;
  cost: number;                   // Budget points
  impacts: Partial<PillarDelta>;  // Immediate impacts
  longTermEffects?: LongTermEffect[];
}

export interface LongTermEffect {
  pillar: PillarId;
  delta: number;
  duration: number;               // Cycles
  description: string;
}

export interface GameEvent {
  id: string;
  type: EventType;
  severity: EventSeverity;
  title: string;
  description: string;
  narrative: string;              // AI-generated story text
  imageUrl?: string;
  choices: EventChoice[];
  deadline: number;               // Seconds to respond (0 = no deadline)
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

// ============================================================================
// RANKINGS
// ============================================================================

export interface CountryRanking {
  iso_code: string;
  name: string;
  currentScore: number;
  previousScore: number;
  currentRank: number;
  previousRank: number;
  rankDelta: number;              // Positive = moved up
  isPlayer: boolean;
}

// ============================================================================
// HISTORY & STATISTICS
// ============================================================================

export interface CycleHistory {
  cycleNumber: number;
  year: number;
  pillars: PillarScores;
  ohiScore: number;
  rank: number;
  budgetSpent: BudgetAllocation;
  policiesActive: string[];
  eventsOccurred: string[];
  choicesMade: Record<string, string>;  // eventId -> choiceId
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
  pillarProgress: PillarDelta;    // Total change from start
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

// ============================================================================
// GAME STATE
// ============================================================================

export interface GameState {
  // Core state
  phase: GamePhase;
  speed: GameSpeed;
  isAutoAdvancing: boolean;
  
  // Time
  currentYear: number;
  startYear: number;
  endYear: number;
  cycleNumber: number;
  
  // Country
  selectedCountry: CountryData | null;
  
  // Scores
  pillars: PillarScores;
  ohiScore: number;
  
  // Budget
  budget: BudgetState;
  
  // Policies
  policies: PolicyState[];
  
  // Events
  currentEvent: GameEvent | null;
  activeEffects: ActiveEffect[];
  
  // Rankings
  rankings: CountryRanking[];
  
  // History
  history: CycleHistory[];
  statistics: GameStatistics;
  
  // UI State
  selectedPillar: PillarId | null;
  showWorldMap: boolean;
  showTutorial: boolean;
}

// ============================================================================
// ACTIONS
// ============================================================================

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

// ============================================================================
// SIMULATION
// ============================================================================

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

// ============================================================================
// UI HELPERS
// ============================================================================

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

// ============================================================================
// API TYPES
// ============================================================================

export interface GenerateEventRequest {
  countryIso: string;
  countryName: string;
  currentYear: number;
  ohiScore: number;
  pillars: PillarScores;
  recentEvents: string[];         // Last 3 event IDs to avoid repetition
  activePolicies: string[];
}

export interface GenerateEventResponse {
  event: GameEvent;
}

export interface GenerateSummaryRequest {
  countryName: string;
  history: CycleHistory[];
  statistics: GameStatistics;
  finalRank: number;
}

export interface GenerateSummaryResponse {
  narrative: string;
  highlights: string[];
  recommendations: string[];
  grade: string;                  // A+, A, B+, B, C+, C, D, F
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PILLAR_WEIGHTS: Record<PillarId, number> = {
  governance: 0.30,
  hazardControl: 0.25,
  healthVigilance: 0.25,
  restoration: 0.20,
};

export const SPEED_DURATIONS: Record<GameSpeed, number> = {
  slow: 30000,    // 30 seconds per cycle
  medium: 15000,  // 15 seconds per cycle
  fast: 5000,     // 5 seconds per cycle
};

export const MATURITY_STAGES: MaturityStage[] = [
  { stage: 1, label: 'Critical', description: 'Reactive systems with major gaps', minScore: 1.0, maxScore: 1.9, color: 'red' },
  { stage: 2, label: 'Developing', description: 'Basic frameworks emerging', minScore: 2.0, maxScore: 2.4, color: 'orange' },
  { stage: 3, label: 'Advancing', description: 'Functional systems with room to grow', minScore: 2.5, maxScore: 3.4, color: 'yellow' },
  { stage: 4, label: 'Leading', description: 'World-class occupational health', minScore: 3.5, maxScore: 4.0, color: 'emerald' },
];

export const PILLAR_CONFIGS: PillarConfig[] = [
  {
    id: 'governance',
    name: 'Governance',
    fullName: 'Governance Ecosystem',
    icon: 'Crown',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    glowColor: 'shadow-purple-500/50',
    gradientFrom: 'from-purple-500/30',
    gradientTo: 'to-purple-600/10',
  },
  {
    id: 'hazardControl',
    name: 'Hazard Control',
    fullName: 'Hazard Prevention & Control',
    icon: 'Shield',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    glowColor: 'shadow-blue-500/50',
    gradientFrom: 'from-blue-500/30',
    gradientTo: 'to-blue-600/10',
  },
  {
    id: 'healthVigilance',
    name: 'Health Vigilance',
    fullName: 'Surveillance & Detection',
    icon: 'Eye',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
    glowColor: 'shadow-teal-500/50',
    gradientFrom: 'from-teal-500/30',
    gradientTo: 'to-teal-600/10',
  },
  {
    id: 'restoration',
    name: 'Restoration',
    fullName: 'Restoration & Compensation',
    icon: 'Heart',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    glowColor: 'shadow-amber-500/50',
    gradientFrom: 'from-amber-500/30',
    gradientTo: 'to-amber-600/10',
  },
];

export const DEFAULT_START_YEAR = 2025;
export const DEFAULT_END_YEAR = 2050;
export const YEARS_PER_CYCLE = 5;
export const MAX_CYCLES = (DEFAULT_END_YEAR - DEFAULT_START_YEAR) / YEARS_PER_CYCLE;
