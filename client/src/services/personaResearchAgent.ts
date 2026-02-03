/**
 * Arthur D. Little - Global Health Platform
 * Persona Research Agent Service
 * 
 * Frontend service for fetching AI-generated persona research
 * with source citations and comprehensive coverage information.
 */

import { aiApiClient } from "./api";
import { type Persona, type PersonaSource } from "../data/personas";

// ============================================================================
// TYPES
// ============================================================================

export interface PersonaResearchDemographics {
  population_estimate: string;
  participation_rate: string;
  unemployment_rate: string;
  key_sectors: string[];
  age_distribution: string;
  gender_breakdown?: string;
}

export interface PersonaGOSICoverage {
  annuities_covered: boolean;
  occupational_hazards_covered: boolean;
  contribution_rate: string;
  coverage_gaps: string[];
  recent_changes: string[];
}

export interface PersonaOccupationalRisk {
  risk: string;
  description: string;
  prevalence: string;
  source: string;
}

export interface PersonaInjuryJourney {
  reporting_process: string;
  treatment_access: string;
  wage_replacement: string;
  rehabilitation: string;
  return_to_work: string;
  barriers: string[];
}

export interface PersonaFinancialImpact {
  who_pays: string;
  benefit_levels: string;
  out_of_pocket: string;
  economic_vulnerability: string;
}

export interface PersonaDevelopment {
  development: string;
  date: string;
  impact: string;
  source: string;
}

export interface PersonaResearchResponse {
  persona_id: string;
  persona_name: string;
  research_summary: string;
  demographics: PersonaResearchDemographics;
  gosi_coverage: PersonaGOSICoverage;
  occupational_risks: PersonaOccupationalRisk[];
  injury_journey: PersonaInjuryJourney;
  financial_impact: PersonaFinancialImpact;
  recent_developments: PersonaDevelopment[];
  sources: PersonaSource[];
}

export interface PersonaResearchRequest {
  personaId: string;
  personaName: string;
  personaDescription: string;
  enableWebSearch?: boolean;
}

// ============================================================================
// API FUNCTIONS
// ============================================================================

/**
 * Fetch AI-generated research for a specific persona
 */
export async function fetchPersonaResearch(
  request: PersonaResearchRequest
): Promise<PersonaResearchResponse> {
  try {
    const response = await aiApiClient.post<PersonaResearchResponse>(
      "/api/v1/personas/research",
      {
        persona_id: request.personaId,
        persona_name: request.personaName,
        persona_description: request.personaDescription,
        enable_web_search: request.enableWebSearch ?? true,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching persona research:", error);
    throw error;
  }
}

/**
 * Fetch cached research for a persona (if available)
 */
export async function fetchCachedPersonaResearch(
  personaId: string
): Promise<PersonaResearchResponse | null> {
  try {
    const response = await aiApiClient.get<PersonaResearchResponse | null>(
      `/api/v1/personas/${personaId}/research`
    );
    return response.data;
  } catch (error) {
    // Return null if no cached research exists
    return null;
  }
}

/**
 * Refresh research for a persona (force new AI generation)
 */
export async function refreshPersonaResearch(
  persona: Persona
): Promise<PersonaResearchResponse> {
  return fetchPersonaResearch({
    personaId: persona.id,
    personaName: persona.name,
    personaDescription: persona.description,
    enableWebSearch: true,
  });
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format coverage status for display
 */
export function formatCoverageStatus(coverage: PersonaGOSICoverage): string {
  if (coverage.annuities_covered && coverage.occupational_hazards_covered) {
    return "Full GOSI Coverage";
  } else if (coverage.occupational_hazards_covered) {
    return "Partial Coverage (OH Only)";
  } else {
    return "No GOSI Coverage";
  }
}

/**
 * Get risk severity from prevalence description
 */
export function getRiskSeverity(prevalence: string): "high" | "medium" | "low" {
  const lowTerms = ["rare", "uncommon", "low", "minimal"];
  const highTerms = ["common", "frequent", "high", "prevalent", "widespread"];
  
  const lower = prevalence.toLowerCase();
  
  if (highTerms.some(term => lower.includes(term))) {
    return "high";
  } else if (lowTerms.some(term => lower.includes(term))) {
    return "low";
  }
  return "medium";
}

/**
 * Parse source citation from text
 */
export function parseSourceCitation(text: string): { content: string; source: string | null } {
  const match = text.match(/\[(.+?)\]/);
  if (match) {
    return {
      content: text.replace(/\[.+?\]/g, "").trim(),
      source: match[1],
    };
  }
  return { content: text, source: null };
}

export default {
  fetchPersonaResearch,
  fetchCachedPersonaResearch,
  refreshPersonaResearch,
  formatCoverageStatus,
  getRiskSeverity,
  parseSourceCitation,
};
