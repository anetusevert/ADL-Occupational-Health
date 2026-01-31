/**
 * useGameSimulation Placeholder
 * TODO: Implement full game simulation hook
 */

import { createContext, useContext, type ReactNode } from 'react';

interface GameState {
  isPlaying: boolean;
  year: number;
  budget: number;
}

interface GameContextType {
  state: GameState;
  startGame: () => void;
  pauseGame: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const value: GameContextType = {
    state: { isPlaying: false, year: 2024, budget: 100 },
    startGame: () => {},
    pauseGame: () => {},
  };
  
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
