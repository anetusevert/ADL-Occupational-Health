/**
 * Arthur D. Little - Global Health Platform
 * Architecture Rankings Utilities
 * 
 * Functions to calculate component-level scores and find
 * top-performing countries for each architecture component.
 */

import type { ArchitectureComponent } from "./architectureDefinitions";
import type { Country } from "../types/country";

// ============================================================================
// TYPES
// ============================================================================

export interface ComponentScore {
  componentId: string;
  score: number;  // 0-100
  status: "complete" | "partial" | "missing";
  rawValue: number | string | boolean | null;
}

export interface CountryComponentScore {
  iso_code: string;
  name: string;
  flag_url?: string;
  score: number;
  rawValue: number | string | boolean | null;
}

export interface ComponentLeaders {
  componentId: string;
  leaders: CountryComponentScore[];  // Top 3
}

// ============================================================================
// SCORE CALCULATION
// ============================================================================

/**
 * Extract a value from country data by field name
 */
export function extractFieldValue(
  country: Record<string, unknown>,
  fieldName: string | null
): number | string | boolean | null {
  if (!fieldName) return null;
  
  // Handle nested fields (e.g., "governance.score")
  const parts = fieldName.split(".");
  let value: unknown = country;
  
  for (const part of parts) {
    if (value == null || typeof value !== "object") return null;
    value = (value as Record<string, unknown>)[part];
  }
  
  if (value === undefined) return null;
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value;
  
  return null;
}

/**
 * Calculate score for a single component
 */
export function calculateComponentScore(
  component: ArchitectureComponent,
  country: Record<string, unknown>
): ComponentScore {
  const rawValue = extractFieldValue(country, component.dataField);
  
  if (rawValue === null) {
    return {
      componentId: component.id,
      score: 0,
      status: "missing",
      rawValue: null,
    };
  }
  
  let normalizedScore = 0;
  
  switch (component.scoreType) {
    case "boolean": {
      normalizedScore = rawValue === true || rawValue === 1 || rawValue === "true" ? 100 : 0;
      break;
    }
    
    case "percentage": {
      const numValue = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue));
      if (!isNaN(numValue)) {
        // Handle inverted metrics (lower is better)
        const isInverted = component.thresholds.complete < component.thresholds.partial;
        if (isInverted) {
          // Lower is better: 100% if at or below complete threshold
          if (numValue <= component.thresholds.complete) {
            normalizedScore = 100;
          } else if (numValue >= component.thresholds.partial) {
            normalizedScore = 0;
          } else {
            // Linear interpolation
            normalizedScore = 100 * (1 - (numValue - component.thresholds.complete) / 
              (component.thresholds.partial - component.thresholds.complete));
          }
        } else {
          // Higher is better
          normalizedScore = Math.min(100, Math.max(0, numValue));
        }
      }
      break;
    }
    
    case "number": {
      const numValue = typeof rawValue === "number" ? rawValue : parseFloat(String(rawValue));
      if (!isNaN(numValue)) {
        const isInverted = component.thresholds.complete < component.thresholds.partial;
        if (isInverted) {
          // Lower is better
          if (numValue <= component.thresholds.complete) {
            normalizedScore = 100;
          } else if (numValue >= component.thresholds.partial) {
            normalizedScore = 0;
          } else {
            normalizedScore = 100 * (1 - (numValue - component.thresholds.complete) / 
              (component.thresholds.partial - component.thresholds.complete));
          }
        } else {
          // Higher is better
          if (numValue >= component.thresholds.complete) {
            normalizedScore = 100;
          } else if (numValue <= component.thresholds.partial) {
            normalizedScore = 0;
          } else {
            normalizedScore = 100 * (numValue - component.thresholds.partial) / 
              (component.thresholds.complete - component.thresholds.partial);
          }
        }
      }
      break;
    }
    
    case "enum": {
      const enumValues = component.enumValues ?? [];
      const valueStr = String(rawValue);
      const index = enumValues.indexOf(valueStr);
      if (index >= 0) {
        // First value is best (100%), last is worst (0%)
        normalizedScore = 100 * (1 - index / Math.max(1, enumValues.length - 1));
      }
      break;
    }
    
    case "derived": {
      // Derived scores need special handling
      normalizedScore = 50;  // Default
      break;
    }
  }
  
  // Determine status
  let status: "complete" | "partial" | "missing" = "missing";
  if (normalizedScore >= 70) {
    status = "complete";
  } else if (normalizedScore >= 30) {
    status = "partial";
  } else {
    status = "missing";
  }
  
  return {
    componentId: component.id,
    score: Math.round(normalizedScore),
    status,
    rawValue,
  };
}

/**
 * Find top 3 leaders for a component across all countries
 */
export function findComponentLeaders(
  component: ArchitectureComponent,
  countries: Record<string, unknown>[]
): ComponentLeaders {
  const scores: CountryComponentScore[] = [];
  
  for (const country of countries) {
    const score = calculateComponentScore(component, country);
    if (score.rawValue !== null) {
      scores.push({
        iso_code: String(country.iso_code ?? country.code ?? ""),
        name: String(country.name ?? ""),
        flag_url: country.flag_url as string | undefined,
        score: score.score,
        rawValue: score.rawValue,
      });
    }
  }
  
  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);
  
  return {
    componentId: component.id,
    leaders: scores.slice(0, 3),
  };
}

/**
 * Get color class based on status
 */
export function getStatusColor(status: "complete" | "partial" | "missing"): string {
  switch (status) {
    case "complete":
      return "text-emerald-400";
    case "partial":
      return "text-amber-400";
    case "missing":
      return "text-red-400";
  }
}

export function getStatusBgColor(status: "complete" | "partial" | "missing"): string {
  switch (status) {
    case "complete":
      return "bg-emerald-500/20";
    case "partial":
      return "bg-amber-500/20";
    case "missing":
      return "bg-red-500/20";
  }
}

export function getStatusBorderColor(status: "complete" | "partial" | "missing"): string {
  switch (status) {
    case "complete":
      return "border-emerald-500/40";
    case "partial":
      return "border-amber-500/40";
    case "missing":
      return "border-red-500/40";
  }
}
