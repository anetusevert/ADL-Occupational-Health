/**
 * Sovereign Health: The Occupational Health Strategy Game
 * 
 * A professional-grade, turn-based strategy simulation where players 
 * lead a nation's occupational health transformation through policy decisions.
 * 
 * Features:
 * - 5-year policy cycles with realistic budget constraints
 * - 48 policy interventions across 4 pillars
 * - AI-generated contextual events
 * - ADL OHI Score tracking (1.0-4.0 scale)
 * - Global rankings and comparisons
 * - Achievements and progression system
 * 
 * Built on the Arthur D. Little Occupational Health Framework
 */

import { GameContainer } from '../components/simulator';

export function Simulator() {
  return (
    <div className="h-full w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <GameContainer />
    </div>
  );
}

export default Simulator;
