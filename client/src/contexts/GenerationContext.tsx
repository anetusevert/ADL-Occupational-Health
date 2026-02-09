/**
 * Arthur D. Little - Global Health Platform
 * Generation Context
 * 
 * Tracks batch report and insight generation status across the app.
 * Supports:
 * - Multiple parallel generations for different countries
 * - Persistent status across navigation (localStorage)
 * - Real-time polling updates from backend
 * - Background generation that continues when user navigates away
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { apiClient } from "../services/api";

// Generation status for a single country
export interface GenerationStatus {
  isoCode: string;
  countryName: string;
  startedAt: string; // ISO date string for localStorage compatibility
  completed: number;
  total: number;
  inProgress: string; // Current category being generated
  results: Record<string, string>; // category -> status
  message: string;
  type: "insights" | "reports"; // Type of generation
  failed: number;
  errors: Array<{ category: string; error: string }>;
}

interface GenerationContextType {
  // Active generations map (isoCode -> status)
  activeGenerations: Record<string, GenerationStatus>;
  
  // Start insight generation for a country (calls backend and starts polling)
  startInsightGeneration: (isoCode: string, countryName: string) => Promise<void>;
  
  // Start tracking a generation (legacy - for reports)
  startGeneration: (isoCode: string, countryName: string) => void;
  
  // Update generation progress
  updateGeneration: (isoCode: string, status: Partial<GenerationStatus>) => void;
  
  // Complete/remove a generation
  completeGeneration: (isoCode: string) => void;
  
  // Check if a country has active generation
  isGenerating: (isoCode: string) => boolean;
  
  // Get generation status for a country
  getGenerationStatus: (isoCode: string) => GenerationStatus | null;
  
  // Resume polling for a country (when returning to page)
  resumePolling: (isoCode: string) => void;
  
  // Check if any generation is active
  hasActiveGenerations: boolean;
}

const STORAGE_KEY = "gohip_active_generations";

const GenerationContext = createContext<GenerationContextType | undefined>(undefined);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [activeGenerations, setActiveGenerations] = useState<Record<string, GenerationStatus>>({});
  const pollingRefs = useRef<Record<string, NodeJS.Timeout | null>>({});
  const pollFailureCounts = useRef<Record<string, number>>({});

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
        
        // Resume polling for any that were in progress
        Object.keys(filtered).forEach(isoCode => {
          if (filtered[isoCode].type === "insights") {
            // Will start polling when component mounts
          }
        });
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

  // Poll backend for generation status
  const pollInsightStatus = useCallback(async (isoCode: string) => {
    // Clear existing polling interval if any
    if (pollingRefs.current[isoCode]) {
      clearInterval(pollingRefs.current[isoCode]!);
    }

    const poll = async () => {
      try {
        const response = await apiClient.get<{
          is_generating: boolean;
          status: string;
          total: number;
          completed: number;
          failed: number;
          current_category: string | null;
          errors: Array<{ category: string; error: string }>;
        }>(`/api/v1/insights/${isoCode}/generation-status`);

        const data = response.data;
        pollFailureCounts.current[isoCode] = 0;

        setActiveGenerations(prev => {
          if (!prev[isoCode]) return prev;
          return {
            ...prev,
            [isoCode]: {
              ...prev[isoCode],
              completed: data.completed,
              total: data.total,
              failed: data.failed,
              inProgress: data.current_category || "",
              errors: data.errors || [],
              message: data.is_generating 
                ? `Generating ${data.current_category || "..."}` 
                : data.status === "completed" 
                  ? "Generation complete" 
                  : `Completed with ${data.failed} errors`,
            },
          };
        });

        // Stop polling if generation is complete
        if (!data.is_generating) {
          if (pollingRefs.current[isoCode]) {
            clearInterval(pollingRefs.current[isoCode]!);
            pollingRefs.current[isoCode] = null;
          }
          
          // Auto-remove completed generations after 8 seconds
          if (data.status === "completed") {
            setTimeout(() => {
              setActiveGenerations(prev => {
                const updated = { ...prev };
                if (updated[isoCode]?.message === "Generation complete") {
                  delete updated[isoCode];
                }
                return updated;
              });
            }, 8000);
          }
        }
      } catch (error) {
        console.error(`[GenerationContext] Poll error for ${isoCode}:`, error);
        pollFailureCounts.current[isoCode] = (pollFailureCounts.current[isoCode] || 0) + 1;
        const failures = pollFailureCounts.current[isoCode];

        setActiveGenerations(prev => {
          if (!prev[isoCode]) return prev;
          return {
            ...prev,
            [isoCode]: {
              ...prev[isoCode],
              message: failures >= 5
                ? "Generation status unavailable (connection issue)"
                : "Retrying status check...",
              failed: failures >= 5 ? Math.max(prev[isoCode].failed, 1) : prev[isoCode].failed,
              errors: failures >= 5
                ? [...prev[isoCode].errors, { category: "poll", error: "Failed to reach generation-status endpoint repeatedly" }]
                : prev[isoCode].errors,
            },
          };
        });

        if (failures >= 5 && pollingRefs.current[isoCode]) {
          clearInterval(pollingRefs.current[isoCode]!);
          pollingRefs.current[isoCode] = null;
        }
      }
    };

    // Initial poll
    await poll();
    
    // Continue polling every 3 seconds if still in activeGenerations
    pollingRefs.current[isoCode] = setInterval(poll, 3000);
  }, []);

  // Start insight generation for a country
  const startInsightGeneration = useCallback(async (isoCode: string, countryName: string) => {
    // Check if already generating
    if (activeGenerations[isoCode]) {
      console.log(`[GenerationContext] Already tracking ${isoCode}`);
      // Resume polling if needed
      if (!pollingRefs.current[isoCode] && activeGenerations[isoCode].type === "insights") {
        pollInsightStatus(isoCode);
      }
      return;
    }

    // Initialize status
    setActiveGenerations(prev => ({
      ...prev,
      [isoCode]: {
        isoCode,
        countryName,
        startedAt: new Date().toISOString(),
        completed: 0,
        total: 6,
        inProgress: "initializing",
        results: {},
        message: "Starting AI generation...",
        type: "insights",
        failed: 0,
        errors: [],
      },
    }));

    try {
      // Call initialize endpoint
      const response = await apiClient.post<{
        status: string;
        existing: number;
        missing: number;
        total_categories: number;
        categories_to_generate: string[];
      }>(`/api/v1/insights/${isoCode}/initialize`);

      console.log(`[GenerationContext] Started generation for ${isoCode}:`, response.data);

      if (response.data.status === "already_complete") {
        setActiveGenerations(prev => ({
          ...prev,
          [isoCode]: {
            ...prev[isoCode],
            completed: response.data.existing,
            total: response.data.total_categories,
            message: "All insights ready",
          },
        }));
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          setActiveGenerations(prev => {
            const updated = { ...prev };
            delete updated[isoCode];
            return updated;
          });
        }, 3000);
      } else if (response.data.status === "started" || response.data.status === "generating") {
        // Start polling
        setActiveGenerations(prev => ({
          ...prev,
          [isoCode]: {
            ...prev[isoCode],
            total: response.data.missing,
            message: `Generating ${response.data.missing} insights...`,
          },
        }));
        pollInsightStatus(isoCode);
      } else if (response.data.status === "missing_content") {
        // Non-admin - remove status
        setActiveGenerations(prev => {
          const updated = { ...prev };
          delete updated[isoCode];
          return updated;
        });
      }
    } catch (error) {
      console.error(`[GenerationContext] Failed to start generation for ${isoCode}:`, error);
      setActiveGenerations(prev => ({
        ...prev,
        [isoCode]: {
          ...prev[isoCode],
          message: "Generation failed to start",
          failed: 1,
          errors: [{ category: "init", error: String(error) }],
        },
      }));
    }
  }, [activeGenerations, pollInsightStatus]);

  // Resume polling for a country (when returning to page)
  const resumePolling = useCallback((isoCode: string) => {
    const status = activeGenerations[isoCode];
    if (status && status.type === "insights" && !pollingRefs.current[isoCode]) {
      pollInsightStatus(isoCode);
    }
  }, [activeGenerations, pollInsightStatus]);

  // Legacy start generation (for reports)
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
        type: "reports",
        failed: 0,
        errors: [],
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
    // Clear polling
    if (pollingRefs.current[isoCode]) {
      clearInterval(pollingRefs.current[isoCode]!);
      pollingRefs.current[isoCode] = null;
    }
    delete pollFailureCounts.current[isoCode];
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

  const hasActiveGenerations = Object.keys(activeGenerations).length > 0;

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      Object.values(pollingRefs.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  return (
    <GenerationContext.Provider
      value={{
        activeGenerations,
        startInsightGeneration,
        startGeneration,
        updateGeneration,
        completeGeneration,
        isGenerating,
        getGenerationStatus,
        resumePolling,
        hasActiveGenerations,
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
