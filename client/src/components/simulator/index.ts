/**
 * Simulator Components Index
 * 
 * Sovereign Health: The Occupational Health Strategy Game
 */

// Core types
export * from './types';

// Main game container
export { GameContainer } from './GameContainer';
export { GameProvider, useGame } from '../../hooks/useGameSimulation';

// UI Components
export { CountrySelector, SAMPLE_COUNTRIES } from './CountrySelector';
export { PolicyTemple } from './PolicyTemple';
export { BudgetAllocator } from './BudgetAllocator';
export { StatsDashboard } from './StatsDashboard';
export { RankingsLadder, RankingSummary } from './RankingsLadder';
export { TimelineControl } from './TimelineControl';
export { EventCard } from './EventCard';
export { WorldMapView } from './WorldMapView';
export { OHIScoreDisplay, OHIScoreInline } from './OHIScoreDisplay';
export { GameOverSummary } from './GameOverSummary';
export { ParticleEffects, ScoreCelebration, PulsingGlow, AchievementUnlock, ShimmerEffect } from './ParticleEffects';

// New AI-Powered Game Components
export { LoadingBriefing } from './LoadingBriefing';
export { SituationalBriefing } from './SituationalBriefing';
export { DecisionRound } from './DecisionRound';
export { NewsFeed } from './NewsFeed';
export { CountryLandmark, LandmarkCard } from './CountryLandmark';

// Advisor Panel Components (Conversational Gameplay)
export { AdvisorPanel } from './AdvisorPanel';
export { AdvisorMessage, AdvisorTypingIndicator } from './AdvisorMessage';
export { AdvisorChoices, SimpleChoices } from './AdvisorChoices';

// Data Visualization Components
export { OHIDeltaChart } from './OHIDeltaChart';
export { EconomicIndicators, EconomicIndicatorsCompact } from './EconomicIndicators';

// Country Display Components
export { CountrySlideshow, CountryProfile } from './CountrySlideshow';
export { BriefingModal, InfoCard } from './BriefingModal';
