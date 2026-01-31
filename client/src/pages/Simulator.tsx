/**
 * Sovereign Health: The Occupational Health Strategy Game
 * 
 * A professional-grade, turn-based strategy simulation where players
 * lead a nation's occupational health transformation through 5-year
 * policy cycles with realistic budgets, AI-generated events, and
 * the ADL OHI Score as the core progression metric.
 * 
 * Features:
 * - Country selection with difficulty levels based on starting OHI score
 * - 5-year policy cycles with budget allocation
 * - 48 policies across 4 pillars (Governance, Hazard Control, Health Vigilance, Restoration)
 * - AI-generated crisis and opportunity events
 * - Real-time global rankings
 * - Achievement system
 * - Professional ADL-branded UI
 */

import { GameProvider } from '../hooks/useGameSimulation';
import { GameContainer } from '../components/simulator';

export function Simulator() {
  return (
    <GameProvider>
      <GameContainer />
    </GameProvider>
  );
}

export default Simulator;
