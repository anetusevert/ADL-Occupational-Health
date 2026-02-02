/**
 * Arthur D. Little - Global Health Platform
 * Generation Context
 * 
 * Tracks batch report generation status across the app.
 * Persists to localStorage so status survives page refresh.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

// Generation status for a single country
export interface GenerationStatus {
  isoCode: string;
  countryName: string;
  startedAt: string; // ISO date string for localStorage compatibility
  completed: number;
  total: number;
  inProgress: string; // Current pillar being generated
  results: Record<string, string>; // pillar_id -> status
  message: string;
}

interface GenerationContextType {
  // Active generations map (isoCode -> status)
  activeGenerations: Record<string, GenerationStatus>;
  
  // Start tracking a generation
  startGeneration: (isoCode: string, countryName: string) => void;
  
  // Update generation progress
  updateGeneration: (isoCode: string, status: Partial<GenerationStatus>) => void;
  
  // Complete/remove a generation
  completeGeneration: (isoCode: string) => void;
  
  // Check if a country has active generation
  isGenerating: (isoCode: string) => boolean;
  
  // Get generation status for a country
  getGenerationStatus: (isoCode: string) => GenerationStatus | null;
}

const STORAGE_KEY = "gohip_active_generations";

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [activeGenerations, setActiveGenerations] = useState<Record<string, GenerationStatus>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Filter out generations older than 30 minutes (stale)
        const now = Date.now();
        const filtered: Record<string, GenerationStatus> = {};
        Object.entries(parsed).forEach(([key, value]) => {
          const status = value as GenerationStatus;
          const startedAt = new Date(status.startedAt).getTime();
          if (now - startedAt < 30 * 60 * 1000) { // 30 minutes
            filtered[key] = status;
          }
        });
        setActiveGenerations(filtered);
      }
    } catch (e) {
      console.error("Failed to load generation status from localStorage:", e);
    }
  }, []);

  // Save to localStorage whenever activeGenerations changes
  useEffect(() => {
    try {
      if (Object.keys(activeGenerations).length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeGenerations));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.error("Failed to save generation status to localStorage:", e);
    }
  }, [activeGenerations]);

  const startGeneration = useCallback((isoCode: string, countryName: string) => {
    setActiveGenerations(prev => ({
      ...prev,
      [isoCode]: {
        isoCode,
        countryName,
        startedAt: new Date().toISOString(),
        completed: 0,
        total: 5,
        inProgress: "",
        results: {},
        message: "Starting generation...",
      },
    }));
  }, []);

  const updateGeneration = useCallback((isoCode: string, status: Partial<GenerationStatus>) => {
    setActiveGenerations(prev => {
      if (!prev[isoCode]) return prev;
      return {
        ...prev,
        [isoCode]: {
          ...prev[isoCode],
          ...status,
        },
      };
    });
  }, []);

  const completeGeneration = useCallback((isoCode: string) => {
    setActiveGenerations(prev => {
      const { [isoCode]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const isGenerating = useCallback((isoCode: string) => {
    return isoCode in activeGenerations;
  }, [activeGenerations]);

  const getGenerationStatus = useCallback((isoCode: string) => {
    return activeGenerations[isoCode] || null;
  }, [activeGenerations]);

  return (
    <GenerationContext.Provider
      value={{
        activeGenerations,
        startGeneration,
        updateGeneration,
        completeGeneration,
        isGenerating,
        getGenerationStatus,
      }}
    >
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const context = useContext(GenerationContext);
  if (context === undefined) {
    throw new Error("useGeneration must be used within a GenerationProvider");
  }
  return context;
}

export default GenerationContext;
