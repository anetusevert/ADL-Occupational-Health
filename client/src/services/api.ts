/**
 * GOHIP Platform - API Service
 * Axios-based HTTP client for backend communication
 * 
 * Phase 20.1: Robust null-handling for partial data countries
 */

import axios, { AxiosError } from "axios";
import type { 
  Country, 
  CountryListResponse, 
  AssessmentResponse,
  ComparisonCountriesResponse,
} from "../types/country";

// ============================================================================
// AXIOS INSTANCE
// ============================================================================

// Known Railway backend URL
const RAILWAY_BACKEND_URL = "https://adl-occupational-health-production.up.railway.app";

// Detect API base URL with Railway auto-detection
function getApiBaseUrl(): string {
  // First priority: explicitly set environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl;
  }
  
  // Second priority: auto-detect for Railway deployments
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('.up.railway.app')) {
      // Use the known Railway backend URL
      console.log(`[API] Railway detected, using backend: ${RAILWAY_BACKEND_URL}`);
      return RAILWAY_BACKEND_URL;
    }
  }
  
  // Fallback for local development
  return "http://localhost:8000";
}

const API_BASE_URL = getApiBaseUrl();

// Standard API client for quick operations
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout for standard operations
});

// AI-specialized client with longer timeout for LLM operations
// GPT-5 with web search can take 3-5 minutes for complex strategic reports
export const aiApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 360000, // 6 minute timeout for AI generation (GPT-5 + web search is slow)
});

// Request interceptor for auth and logging (standard client)
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem("gohip_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling (standard client)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error("[API Error]", error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// Request interceptor for AI client (same auth handling)
aiApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gohip_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (import.meta.env.DEV) {
      console.log(`[AI API] ${config.method?.toUpperCase()} ${config.url} (extended timeout)`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for AI client
aiApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.error("[AI API Error]", error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// COUNTRY API FUNCTIONS
// ============================================================================

/**
 * Fetch a single country by ISO code with full nested data
 * Phase 20.1: Now uses the comprehensive /countries endpoint for full pillar data
 */
export async function fetchCountry(isoCode: string): Promise<Country> {
  const normalizedCode = isoCode.toUpperCase();
  
  // Primary: Try the full countries endpoint (Phase 15.1)
  // This returns complete pillar data even if fields are null
  try {
    const response = await apiClient.get<Country>(`/api/v1/countries/${normalizedCode}`);
    return response.data;
  } catch {
    // Fallback: Build from assessment endpoint
    console.warn(`[API] /countries/${normalizedCode} failed, falling back to assessment endpoint`);
  }
  
  // Fallback approach using assessment endpoint
  const [assessmentRes, countryListRes] = await Promise.all([
    apiClient.get<{
      iso_code: string;
      country_name: string;
      assessment: string | null;
      has_assessment: boolean;
    }>(`/api/v1/assessment/${normalizedCode}`),
    apiClient.get<CountryListResponse>("/api/v1/assessment/"),
  ]);

  // Find country in list to get maturity score
  const countryInfo = countryListRes.data.countries.find(
    (c) => c.iso_code === normalizedCode
  );

  // Build the country object with explicit null pillars
  // Frontend components handle these gracefully
  const country: Country = {
    iso_code: assessmentRes.data.iso_code,
    name: assessmentRes.data.country_name,
    maturity_score: countryInfo?.maturity_score ?? null,
    strategic_summary_text: assessmentRes.data.assessment,
    created_at: new Date().toISOString(),
    updated_at: null,
    // Pillars explicitly null - components display "N/A" or "No Data"
    governance: null,
    pillar_1_hazard: null,
    pillar_2_vigilance: null,
    pillar_3_restoration: null,
  };

  return country;
}

/**
 * Fetch detailed country data including pillar information
 * This fetches from the comprehensive country endpoint
 */
export async function fetchCountryDetails(isoCode: string): Promise<Country> {
  const normalizedCode = isoCode.toUpperCase();
  // Use the full countries endpoint which returns all pillar data
  const response = await apiClient.get<Country>(`/api/v1/countries/${normalizedCode}`);
  return response.data;
}

/**
 * Fetch all countries with summary data
 */
export async function fetchAllCountries(): Promise<CountryListResponse> {
  const response = await apiClient.get<CountryListResponse>("/api/v1/assessment/");
  return response.data;
}

/**
 * Fetch all countries with full pillar data for comparison
 * Used by the Framework Comparison page
 */
export async function fetchComparisonCountries(): Promise<ComparisonCountriesResponse> {
  const response = await apiClient.get<ComparisonCountriesResponse>("/api/v1/countries/comparison/all");
  return response.data;
}

/**
 * Generate AI assessment for a country (legacy)
 */
export async function generateAssessment(isoCode: string): Promise<AssessmentResponse> {
  const response = await apiClient.post<AssessmentResponse>(
    `/api/v1/assessment/${isoCode}/generate`
  );
  return response.data;
}

/**
 * Generate comprehensive AI country assessment using agent prompts
 * Uses the AI orchestration layer with configurable agent prompts
 */
export async function generateCountryAssessment(isoCode: string): Promise<AssessmentResponse> {
  const response = await apiClient.post<AssessmentResponse>(
    `/api/v1/ai/country-assessment/${isoCode}/generate`
  );
  return response.data;
}

// ============================================================================
// AGENT PROMPTS API (Admin only)
// ============================================================================

export interface AgentPrompt {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface AgentPromptsResponse {
  agents: AgentPrompt[];
}

export interface AgentPromptUpdate {
  prompt_template: string;
  is_active?: boolean;
}

/**
 * Get all configured agent prompts
 */
export async function getAgentPrompts(): Promise<AgentPromptsResponse> {
  const response = await apiClient.get<AgentPromptsResponse>("/api/v1/ai/agents");
  return response.data;
}

/**
 * Update an agent prompt configuration
 */
export async function updateAgentPrompt(agentId: string, update: AgentPromptUpdate): Promise<AgentPrompt> {
  const response = await apiClient.put<AgentPrompt>(`/api/v1/ai/agents/${agentId}`, update);
  return response.data;
}

/**
 * Test an agent prompt with sample data
 */
export async function testAgentPrompt(agentId: string, testData?: { country_iso?: string }): Promise<{
  success: boolean;
  response: string;
  latency_ms: number;
}> {
  const response = await apiClient.post(`/api/v1/ai/agents/${agentId}/test`, testData || {});
  return response.data;
}

/**
 * Get existing assessment for a country
 */
export async function getAssessment(isoCode: string): Promise<{
  iso_code: string;
  country_name: string;
  assessment: string | null;
  has_assessment: boolean;
}> {
  const response = await apiClient.get(`/api/v1/assessment/${isoCode}`);
  return response.data;
}

// ============================================================================
// DEEP DIVE AI API FUNCTIONS (Phase 25)
// ============================================================================

/**
 * Deep Dive Analysis Result Type
 */
export interface DeepDiveResult {
  success: boolean;
  strategy_name: string;
  country_name: string;
  iso_code: string;
  topic: string;
  key_findings: string[];
  swot_analysis: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendation: string;
  executive_summary: string;
  agent_log: Array<{
    timestamp: string;
    agent: string;
    status: string;
    message: string;
    emoji: string;
  }>;
  generated_at: string;
  source: string;
  error?: string;
}

/**
 * Deep Dive Topics Response Type
 */
export interface DeepDiveTopicsResponse {
  topics: Array<{
    id: string;
    name: string;
    description: string;
    keywords: string[];
  }>;
}

/**
 * Run a Deep Dive strategic analysis for a country
 */
export async function runDeepDive(
  isoCode: string,
  topic: string = "occupational health strategy"
): Promise<DeepDiveResult> {
  const response = await apiClient.post<DeepDiveResult>("/api/v1/ai/deep-dive", {
    iso_code: isoCode.toUpperCase(),
    topic,
  });
  return response.data;
}

/**
 * Get suggested Deep Dive analysis topics
 */
export async function getDeepDiveTopics(): Promise<DeepDiveTopicsResponse> {
  const response = await apiClient.get<DeepDiveTopicsResponse>("/api/v1/ai/deep-dive/topics");
  return response.data;
}

/**
 * Check AI service health status
 */
export async function checkAIHealth(): Promise<{
  status: string;
  service: string;
  version: string;
  openai_configured: boolean;
  agents: Array<{ name: string; status: string }>;
}> {
  const response = await apiClient.get("/api/v1/ai/health");
  return response.data;
}

// ============================================================================
// PILLAR EXPLANATIONS API (Phase 26)
// ============================================================================

/**
 * Single metric explanation
 */
export interface MetricExplanation {
  metric_name: string;
  metric_value?: string;  // New field
  value?: string;  // Backward compatible
  explanation: string;
  performance_analysis?: string;
  performance_rating?: string;
  perspective?: "excellent" | "good" | "moderate" | "concerning" | "critical" | "unknown";
  percentile_rank?: number;
  global_average?: number;
  benchmark_comparison?: string;
  comparison_data?: {
    country_value?: number;
    global_average?: number;
    regional_average?: number;
    best_in_class?: number;
    percentile?: number;
  };
}

/**
 * Pillar explanation response
 */
export interface PillarExplanationResponse {
  success: boolean;
  iso_code: string;
  country_name: string;
  pillar_id: string;
  pillar_name: string;
  explanations: MetricExplanation[];
  overall_perspective?: string;
  generated_at?: string;
  source?: string;
  error?: string;
}

/**
 * Get stored metric explanations for a pillar (available to all users)
 */
export async function getMetricExplanations(
  isoCode: string,
  pillarId: string
): Promise<PillarExplanationResponse> {
  const response = await apiClient.get<PillarExplanationResponse>(
    `/api/v1/ai/metric-explanations/${isoCode}/${pillarId}`
  );
  return response.data;
}

/**
 * Generate and store AI-powered explanations for pillar metrics (Admin only)
 */
export async function generatePillarExplanations(
  isoCode: string,
  pillarId: string
): Promise<PillarExplanationResponse> {
  const response = await apiClient.post<PillarExplanationResponse>(
    `/api/v1/ai/metric-explanations/${isoCode}/${pillarId}/generate`
  );
  return response.data;
}

// ============================================================================
// STRATEGIC DEEP DIVE API (Phase 27 - Admin Only)
// ============================================================================

/**
 * Topic option for deep dive analysis
 */
export interface TopicOption {
  id: string;
  name: string;
  description: string;
}

/**
 * Country item with deep dive status
 */
export interface CountryDeepDiveItem {
  iso_code: string;
  name: string;
  flag_url: string | null;
  has_deep_dive: boolean;
  deep_dive_status: string | null;
  strategy_name: string | null;
  generated_at: string | null;
  completed_reports: number;  // Number of completed topic reports (out of 13)
}

/**
 * All countries response with deep dive status
 */
export interface AllCountriesDeepDiveResponse {
  countries: CountryDeepDiveItem[];
  total_count: number;
  with_deep_dive: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

/**
 * Key finding in a deep dive report
 */
export interface KeyFinding {
  title: string;
  description: string;
  impact_level: "high" | "medium" | "low";
}

/**
 * SWOT item
 */
export interface SWOTItem {
  title: string;
  description: string;
}

/**
 * Strategic recommendation
 */
export interface StrategicRecommendation {
  title: string;
  description: string;
  priority: "critical" | "high" | "medium" | "low";
  timeline: "immediate" | "short-term" | "medium-term" | "long-term";
}

/**
 * Action item
 */
export interface ActionItem {
  action: string;
  responsible_party: string;
  timeline: string;
}

/**
 * Benchmark country
 */
export interface BenchmarkCountry {
  iso_code: string;
  name: string;
  reason: string;
}

/**
 * Full Strategic Deep Dive Report
 */
export interface StrategicDeepDiveReport {
  iso_code: string;
  topic: string;
  country_name?: string;
  status: string;
  strategy_name?: string;
  executive_summary?: string;
  strategic_narrative?: string;
  health_profile?: string;
  workforce_insights?: string;
  key_findings: KeyFinding[];
  strengths: SWOTItem[];
  weaknesses: SWOTItem[];
  opportunities: SWOTItem[];
  threats: SWOTItem[];
  strategic_recommendations: StrategicRecommendation[];
  action_items: ActionItem[];
  priority_interventions: string[];
  peer_comparison?: string;
  global_ranking_context?: string;
  benchmark_countries: BenchmarkCountry[];
  data_sources_used: string[];
  external_research_summary?: string;
  data_quality_notes?: string;
  ai_provider?: string;
  generated_at?: string;
  updated_at?: string;
}

/**
 * Get all available analysis topics for deep dive
 */
export async function getStrategicDeepDiveTopics(): Promise<{ topics: TopicOption[] }> {
  const response = await apiClient.get<{ topics: TopicOption[] }>(
    "/api/v1/strategic-deep-dive/topics"
  );
  return response.data;
}

/**
 * Get all countries with their deep dive status
 */
export async function getStrategicDeepDiveCountries(): Promise<AllCountriesDeepDiveResponse> {
  const response = await apiClient.get<AllCountriesDeepDiveResponse>(
    "/api/v1/strategic-deep-dive/countries"
  );
  return response.data;
}

/**
 * Get a specific deep dive report
 * Uses AI client with extended timeout since reports can be large
 */
export async function getStrategicDeepDiveReport(
  isoCode: string,
  topic?: string
): Promise<StrategicDeepDiveReport | null> {
  try {
    const params = topic ? { topic } : {};
    const response = await aiApiClient.get<StrategicDeepDiveReport>(
      `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}`,
      { params }
    );
    
    // Debug: Log response structure to help diagnose data issues
    console.log('[API] getStrategicDeepDiveReport response:', {
      isoCode,
      hasData: !!response.data,
      status: response.data?.status,
      hasExpectedFields: !!(response.data?.iso_code || response.data?.country_name),
      keys: response.data ? Object.keys(response.data).slice(0, 10) : [],
    });
    
    return response.data;
  } catch (error: any) {
    // Treat 404 as "no report exists" rather than an error
    if (error.response?.status === 404) {
      return null;
    }
    console.error('[API] getStrategicDeepDiveReport error:', error.response?.status, error.message);
    throw error;
  }
}

/**
 * Get all topic statuses for a country
 */
export interface TopicStatus {
  topic: string;
  status: string;
  strategy_name: string | null;
  generated_at: string | null;
  has_report: boolean;
}

export interface CountryTopicStatusesResponse {
  iso_code: string;
  topics: TopicStatus[];
}

export async function getCountryTopicStatuses(
  isoCode: string
): Promise<CountryTopicStatusesResponse> {
  const response = await apiClient.get<CountryTopicStatusesResponse>(
    `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}/topics`
  );
  return response.data;
}

/**
 * Generate a strategic deep dive for a country (synchronous - returns full report)
 */
export async function generateStrategicDeepDive(
  isoCode: string,
  topic: string = "Comprehensive Occupational Health Assessment"
): Promise<{
  success: boolean;
  iso_code: string;
  country_name: string;
  report: StrategicDeepDiveReport | null;
  agent_log: Array<{
    timestamp: string;
    agent: string;
    status: string;
    message: string;
    emoji: string;
  }>;
  error: string | null;
}> {
  // Use AI-specialized client with extended timeout (6 minutes)
  // Agent runs synchronously and returns full report immediately
  console.log('[API] generateStrategicDeepDive starting:', { isoCode, topic });
  
  const response = await aiApiClient.post(
    `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}/generate`,
    { topic }
  );
  
  // Debug: Log response structure
  console.log('[API] generateStrategicDeepDive response:', {
    success: response.data?.success,
    hasReport: !!response.data?.report,
    error: response.data?.error,
    reportKeys: response.data?.report ? Object.keys(response.data.report).slice(0, 10) : [],
  });
  
  return response.data;
}

/**
 * Queue a strategic deep dive for background generation
 * Returns immediately - use getCountryTopicStatuses to poll for completion
 */
export interface QueueDeepDiveResponse {
  success: boolean;
  queued: boolean;
  iso_code: string;
  country_name: string;
  topic: string;
  status: "pending" | "processing" | "completed" | "failed";
  message: string;
}

export async function queueStrategicDeepDive(
  isoCode: string,
  topic: string = "Comprehensive Occupational Health Assessment"
): Promise<QueueDeepDiveResponse> {
  // Use standard client - this returns immediately
  const response = await apiClient.post<QueueDeepDiveResponse>(
    `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}/queue`,
    { iso_code: isoCode.toUpperCase(), topic }
  );
  return response.data;
}

/**
 * Generate all 13 topic reports for a single country (async)
 * Returns immediately after queuing - poll topic statuses to track progress
 */
export interface GenerateAllTopicsResponse {
  success: boolean;
  message: string;
  iso_code: string;
  country_name: string;
  topics_queued: number;
}

export async function generateAllTopicsForCountry(
  isoCode: string
): Promise<GenerateAllTopicsResponse> {
  // This returns immediately after queuing background tasks
  const response = await apiClient.post(
    `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}/generate-all`,
    {}
  );
  return response.data;
}

/**
 * Delete a strategic deep dive report
 */
export async function deleteStrategicDeepDive(
  isoCode: string,
  topic?: string
): Promise<{ success: boolean; message: string; deleted_count: number }> {
  const params = topic ? { topic } : {};
  const response = await apiClient.delete(
    `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}`,
    { params }
  );
  return response.data;
}

/**
 * Batch generate all reports for multiple countries
 */
export interface BatchGenerateResponse {
  success: boolean;
  message: string;
  countries_queued: number;
  total_reports: number;
  valid_countries: string[];
  invalid_countries: string[];
}

export async function generateBatchCountries(
  isoCodes: string[]
): Promise<BatchGenerateResponse> {
  const response = await apiClient.post<BatchGenerateResponse>(
    "/api/v1/strategic-deep-dive/batch-countries/generate-all",
    { iso_codes: isoCodes }
  );
  return response.data;
}

// ============================================================================
// REPORT WORKSHOP - CONTROLLED GENERATION API
// ============================================================================

/**
 * Queue item for generation tracking
 */
export interface QueueItem {
  id: string;
  iso_code: string;
  country_name: string;
  topic: string;
  status: string;
  queue_position?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Response for queue status endpoint
 */
export interface QueueStatusResponse {
  processing_count: number;
  pending_count: number;
  queue_items: QueueItem[];
}

/**
 * Response for reset/cancel endpoints
 */
export interface ResetProcessingResponse {
  success: boolean;
  reset_count: number;
  message: string;
}

/**
 * Response for controlled generation
 */
export interface ControlledGenerateResponse {
  success: boolean;
  iso_code: string;
  country_name: string;
  topic: string;
  report: StrategicDeepDiveReport | null;
  error: string | null;
  generation_time_seconds: number;
}

/**
 * Reset all processing reports to pending status
 */
export async function resetProcessingReports(): Promise<ResetProcessingResponse> {
  const response = await apiClient.post<ResetProcessingResponse>(
    "/api/v1/strategic-deep-dive/reset-processing"
  );
  return response.data;
}

/**
 * Cancel all generation (reset processing and optionally delete pending)
 */
export async function cancelAllGeneration(
  deletePending: boolean = false
): Promise<ResetProcessingResponse> {
  const response = await apiClient.post<ResetProcessingResponse>(
    `/api/v1/strategic-deep-dive/cancel-all?delete_pending=${deletePending}`
  );
  return response.data;
}

/**
 * Get current generation queue status
 */
export async function getQueueStatus(): Promise<QueueStatusResponse> {
  const response = await apiClient.get<QueueStatusResponse>(
    "/api/v1/strategic-deep-dive/queue/status"
  );
  return response.data;
}

/**
 * Remove a pending report from the queue
 */
export async function removeFromQueue(
  reportId: string
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(
    `/api/v1/strategic-deep-dive/queue/${reportId}`
  );
  return response.data;
}

/**
 * Reorder items in the generation queue
 */
export async function reorderQueue(
  order: string[]
): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post(
    "/api/v1/strategic-deep-dive/queue/reorder",
    { order }
  );
  return response.data;
}

/**
 * Add a country to the generation queue
 */
export async function addCountryToQueue(
  isoCode: string,
  topics?: string[]
): Promise<{
  success: boolean;
  iso_code: string;
  country_name: string;
  added_to_queue: number;
  skipped_existing: number;
  message: string;
}> {
  const response = await apiClient.post(
    `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}/add-to-queue`,
    topics ? { topics } : {}
  );
  return response.data;
}

/**
 * Generate a single report synchronously with full response
 * 
 * This is the controlled generation for the Report Workshop.
 * Uses extended timeout as generation can take 1-2 minutes.
 */
export async function generateControlled(
  isoCode: string,
  topic: string
): Promise<ControlledGenerateResponse> {
  // Use AI client with extended timeout (3 minutes for generation)
  const response = await aiApiClient.post<ControlledGenerateResponse>(
    `/api/v1/strategic-deep-dive/${isoCode.toUpperCase()}/generate-controlled`,
    { topic }
  );
  return response.data;
}

// ============================================================================
// MOCK DATA FOR DEVELOPMENT
// When backend pillars endpoint is not available, use this data
// ============================================================================

export const MOCK_COUNTRY_DATA: Record<string, Partial<Country>> = {
  DEU: {
    iso_code: "DEU",
    name: "Germany",
    maturity_score: 87.5,
    data_coverage_score: 96,  // 24/25 fields populated
    governance: {
      ilo_c187_status: true,
      ilo_c155_status: true,
      inspector_density: 1.2,
      mental_health_policy: true,
      strategic_capacity_score: 92,
      source_urls: null,
    },
    pillar_1_hazard: {
      fatal_accident_rate: 0.8,
      carcinogen_exposure_pct: 8.2,
      heat_stress_reg_type: "Strict",
      // === NEW DENSIFIED METRICS ===
      oel_compliance_pct: 95.0,
      noise_induced_hearing_loss_rate: 12.5,
      safety_training_hours_avg: 24.0,
      control_maturity_score: 89,
      source_urls: null,
    },
    pillar_2_vigilance: {
      surveillance_logic: "Risk-Based",
      disease_detection_rate: 156.3,
      vulnerability_index: 18.5,
      // === NEW DENSIFIED METRICS ===
      migrant_worker_pct: 12.8,
      lead_exposure_screening_rate: 92.0,
      occupational_disease_reporting_rate: 94.5,
      source_urls: null,
    },
    pillar_3_restoration: {
      payer_mechanism: "No-Fault",
      reintegration_law: true,
      sickness_absence_days: 18.3,
      rehab_access_score: 91,
      // === NEW DENSIFIED METRICS ===
      return_to_work_success_pct: 88.0,
      avg_claim_settlement_days: 45,
      rehab_participation_rate: 82.0,
      source_urls: null,
    },
  },
  SAU: {
    iso_code: "SAU",
    name: "Saudi Arabia",
    maturity_score: 52,
    data_coverage_score: 68,  // 17/25 fields populated (sparse data)
    governance: {
      ilo_c187_status: false,
      ilo_c155_status: false,
      inspector_density: 0.4,
      mental_health_policy: false,
      strategic_capacity_score: 45,
      source_urls: null,
    },
    pillar_1_hazard: {
      fatal_accident_rate: 3.21,
      carcinogen_exposure_pct: 12.5,
      heat_stress_reg_type: "Advisory",
      // === NEW DENSIFIED METRICS (with data gaps) ===
      oel_compliance_pct: null,  // No OEL data
      noise_induced_hearing_loss_rate: null,  // Not tracked
      safety_training_hours_avg: 8.0,
      control_maturity_score: 42,
      source_urls: null,
    },
    pillar_2_vigilance: {
      surveillance_logic: "Mandatory",
      disease_detection_rate: 45.2,
      vulnerability_index: 58.5,
      // === NEW DENSIFIED METRICS (HIGH MIGRANT CONTEXT) ===
      migrant_worker_pct: 76.0,  // Very high migrant workforce
      lead_exposure_screening_rate: 35.0,
      occupational_disease_reporting_rate: 28.0,
      source_urls: null,
    },
    pillar_3_restoration: {
      payer_mechanism: "Litigation",
      reintegration_law: false,
      sickness_absence_days: 8.5,
      rehab_access_score: 35,
      // === NEW DENSIFIED METRICS (LIMITED DATA) ===
      return_to_work_success_pct: 40.0,
      avg_claim_settlement_days: 180,
      rehab_participation_rate: 22.0,
      source_urls: null,
    },
  },
};

/**
 * Get country with mock pillar data as fallback
 * 
 * Phase 20.1: Robust data fetching strategy
 * 1. Try /api/v1/countries/{iso} for full pillar data (primary)
 * 2. Fall back to assessment endpoint if countries endpoint fails
 * 3. Merge with mock data for DEU/SAU demo countries
 * 4. Return partial data with null pillars for new countries (displays "N/A")
 */
export async function fetchCountryWithMockFallback(isoCode: string): Promise<Country> {
  const normalizedCode = isoCode.toUpperCase();
  
  try {
    // Primary: Fetch from the comprehensive countries endpoint
    // This returns full pillar data even if individual fields are null
    const baseCountry = await fetchCountry(normalizedCode);
    
    // For demo countries (DEU, SAU), merge with mock data for rich display
    const mockData = MOCK_COUNTRY_DATA[normalizedCode];
    if (mockData) {
      return {
        ...baseCountry,
        // Only use mock data if real data is missing
        governance: baseCountry.governance ?? mockData.governance ?? null,
        pillar_1_hazard: baseCountry.pillar_1_hazard ?? mockData.pillar_1_hazard ?? null,
        pillar_2_vigilance: baseCountry.pillar_2_vigilance ?? mockData.pillar_2_vigilance ?? null,
        pillar_3_restoration: baseCountry.pillar_3_restoration ?? mockData.pillar_3_restoration ?? null,
        maturity_score: baseCountry.maturity_score ?? mockData.maturity_score ?? null,
      };
    }
    
    // For non-demo countries, return real data (even if pillars are null)
    // Frontend components gracefully handle null values with "N/A" display
    return baseCountry;
  } catch (error) {
    // If API fails entirely, try pure mock data for demo countries
    const mockData = MOCK_COUNTRY_DATA[normalizedCode];
    if (mockData) {
      return {
        iso_code: mockData.iso_code!,
        name: mockData.name!,
        maturity_score: mockData.maturity_score ?? null,
        strategic_summary_text: null,
        created_at: new Date().toISOString(),
        updated_at: null,
        governance: mockData.governance ?? null,
        pillar_1_hazard: mockData.pillar_1_hazard ?? null,
        pillar_2_vigilance: mockData.pillar_2_vigilance ?? null,
        pillar_3_restoration: mockData.pillar_3_restoration ?? null,
      };
    }
    
    // Re-throw with clear message for non-existent countries
    throw new Error(`Country ${normalizedCode} not found in database`);
  }
}

// ============================================================================
// INTELLIGENCE API FUNCTIONS (Deep Country Intelligence from Database)
// ============================================================================

/**
 * Intelligence scores for a country
 */
export interface IntelligenceScores {
  governance_intelligence_score: number | null;
  hazard_intelligence_score: number | null;
  vigilance_intelligence_score: number | null;
  restoration_intelligence_score: number | null;
  overall_intelligence_score: number | null;
}

/**
 * Governance intelligence data
 */
export interface GovernanceIntelligence {
  corruption_perception_index: number | null;
  corruption_rank: number | null;
  rule_of_law_index: number | null;
  regulatory_enforcement_score: number | null;
  civil_justice_score: number | null;
  government_effectiveness: number | null;
  regulatory_quality: number | null;
  political_stability: number | null;
}

/**
 * Hazard burden intelligence data
 */
export interface HazardIntelligence {
  daly_occupational_total: number | null;
  daly_occupational_injuries: number | null;
  daly_occupational_carcinogens: number | null;
  daly_occupational_noise: number | null;
  deaths_occupational_total: number | null;
  epi_score: number | null;
  epi_air_quality: number | null;
}

/**
 * Vigilance intelligence data
 */
export interface VigilanceIntelligence {
  uhc_service_coverage_index: number | null;
  health_expenditure_gdp_pct: number | null;
  health_expenditure_per_capita: number | null;
  life_expectancy_at_birth: number | null;
}

/**
 * Restoration intelligence data
 */
export interface RestorationIntelligence {
  hdi_score: number | null;
  hdi_rank: number | null;
  education_index: number | null;
  oecd_work_life_balance: number | null;
  oecd_hours_worked_annual: number | null;
  labor_force_participation: number | null;
  unemployment_rate: number | null;
}

/**
 * Economic context data
 */
export interface EconomicContext {
  gdp_per_capita_ppp: number | null;
  gdp_growth_rate: number | null;
  industry_pct_gdp: number | null;
  population_total: number | null;
  urban_population_pct: number | null;
}

/**
 * Full country intelligence response
 */
export interface CountryIntelligenceResponse {
  iso_code: string;
  country_name: string;
  scores: IntelligenceScores;
  governance: GovernanceIntelligence;
  hazard: HazardIntelligence;
  vigilance: VigilanceIntelligence;
  restoration: RestorationIntelligence;
  economic: EconomicContext;
  ai_deep_summary: string | null;
  ai_risk_assessment: string | null;
}

/**
 * Intelligence summary for list view
 */
export interface IntelligenceSummary {
  iso_code: string;
  country_name: string;
  overall_intelligence_score: number | null;
  governance_intelligence_score: number | null;
  hazard_intelligence_score: number | null;
  vigilance_intelligence_score: number | null;
  restoration_intelligence_score: number | null;
  corruption_perception_index: number | null;
  hdi_score: number | null;
  daly_occupational_total: number | null;
}

/**
 * List of intelligence summaries
 */
export interface IntelligenceListResponse {
  total: number;
  countries: IntelligenceSummary[];
}

/**
 * Fetch intelligence data for a specific country
 */
export async function fetchCountryIntelligence(isoCode: string): Promise<CountryIntelligenceResponse> {
  const response = await apiClient.get<CountryIntelligenceResponse>(
    `/api/v1/intelligence/${isoCode.toUpperCase()}`
  );
  return response.data;
}

/**
 * Fetch intelligence summaries for all countries
 */
export async function fetchAllIntelligence(): Promise<IntelligenceListResponse> {
  const response = await apiClient.get<IntelligenceListResponse>("/api/v1/intelligence/");
  return response.data;
}

/**
 * Fetch AI context for a country (for AI consumption)
 */
export async function fetchAIContext(isoCode: string): Promise<{
  iso_code: string;
  country_name: string;
  ai_context: string;
  data_sources: string[];
}> {
  const response = await apiClient.get(`/api/v1/intelligence/${isoCode.toUpperCase()}/ai-context`);
  return response.data;
}

// ============================================================================
// GLOBAL RANKINGS API (Database-backed)
// ============================================================================

/**
 * Country ranking entry
 */
export interface CountryRankEntry {
  iso_code: string;
  name: string;
  value: number;
  rank: number;
  is_current: boolean;
}

/**
 * Current country ranking details
 */
export interface CurrentCountryRank {
  iso_code: string;
  name: string;
  value: number;
  rank: number;
  percentile: number;
}

/**
 * Global rankings response from database
 */
export interface GlobalRankingsResponse {
  metric: string;
  metric_label: string;
  unit: string;
  total_countries: number;
  data_source: string;
  higher_is_better: boolean;
  current_country: CurrentCountryRank | null;
  top_10: CountryRankEntry[];
  bottom_10: CountryRankEntry[];
}

/**
 * Metric type mapping for database rankings
 * Maps frontend indicator types to backend metric names
 */
export const INDICATOR_TO_METRIC: Record<string, string> = {
  GDP_PER_CAPITA: "gdp_per_capita",
  POPULATION: "population",
  LABOR_FORCE: "labor_force",
  LIFE_EXPECTANCY: "life_expectancy",
  URBAN_POPULATION: "urban_population",
  HDI_SCORE: "hdi_score",
};

/**
 * Fetch global rankings for a specific metric from the database
 * This replaces live World Bank API calls with pre-fetched data
 */
export async function fetchDatabaseRankings(
  metric: string,
  currentIsoCode: string
): Promise<GlobalRankingsResponse> {
  const response = await apiClient.get<GlobalRankingsResponse>(
    `/api/v1/intelligence/rankings/${metric}`,
    {
      params: { current_iso: currentIsoCode.toUpperCase() }
    }
  );
  return response.data;
}

// ============================================================================
// COUNTRY DATA REGISTRY API FUNCTIONS (Pivot Table)
// ============================================================================

/**
 * Country summary for selection
 */
export interface CountryDataSummary {
  iso_code: string;
  name: string;
  flag_url: string | null;
  maturity_score: number | null;
}

/**
 * Available countries response
 */
export interface CountryDataCountriesResponse {
  total: number;
  countries: CountryDataSummary[];
}

/**
 * Category information
 */
export interface CategoryInfo {
  id: string;
  name: string;
  description: string;
  metric_count: number;
}

/**
 * Available categories response
 */
export interface CountryDataCategoriesResponse {
  categories: CategoryInfo[];
}

/**
 * Metric definition
 */
export interface MetricDefinition {
  id: string;
  name: string;
  unit: string | null;
  description: string | null;
  lower_is_better: boolean;
}

/**
 * Country metric value
 */
export interface CountryMetricValue {
  iso_code: string;
  country_name: string;
  flag_url: string | null;
  value: string | number | boolean | null;
  formatted_value: string;
}

/**
 * Pivot table row
 */
export interface PivotRow {
  metric: MetricDefinition;
  values: CountryMetricValue[];
}

/**
 * Country metadata in pivot response
 */
export interface PivotCountryMeta {
  iso_code: string;
  name: string;
  flag_url: string | null;
  maturity_score: number | null;
}

/**
 * Complete pivot table response
 */
export interface PivotTableResponse {
  categories: string[];
  countries: PivotCountryMeta[];
  rows: PivotRow[];
  total_metrics: number;
  generated_at: string;
}

/**
 * Fetch available countries for pivot table selection
 */
export async function fetchCountryDataCountries(): Promise<CountryDataCountriesResponse> {
  const response = await apiClient.get<CountryDataCountriesResponse>("/api/v1/country-data/countries");
  return response.data;
}

/**
 * Fetch available categories for pivot table
 */
export async function fetchCountryDataCategories(): Promise<CountryDataCategoriesResponse> {
  const response = await apiClient.get<CountryDataCategoriesResponse>("/api/v1/country-data/categories");
  return response.data;
}

/**
 * Generate pivot table data
 */
export async function fetchPivotTable(
  countries: string[],
  categories: string[]
): Promise<PivotTableResponse> {
  const params = new URLSearchParams();
  countries.forEach(c => params.append("countries", c));
  categories.forEach(c => params.append("categories", c));
  
  const response = await apiClient.get<PivotTableResponse>(`/api/v1/country-data/pivot?${params.toString()}`);
  return response.data;
}

// ============================================================================
// POLICY SIMULATOR API FUNCTIONS
// ============================================================================

export interface GenerateEventRequest {
  country_iso: string;
  country_name: string;
  current_year: number;
  ohi_score: number;
  pillars: {
    governance: number;
    hazardControl: number;
    healthVigilance: number;
    restoration: number;
  };
  recent_events: string[];
  active_policies: string[];
}

export interface GameEventResponse {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  narrative: string;
  choices: Array<{
    id: string;
    label: string;
    description: string;
    cost: number;
    impacts: Record<string, number>;
    long_term_effects?: Array<{
      pillar: string;
      delta: number;
      duration: number;
      description: string;
    }>;
  }>;
  deadline: number;
  triggeredYear: number;
  isResolved: boolean;
}

export interface GenerateSummaryRequest {
  country_name: string;
  history: Array<{
    cycleNumber: number;
    year: number;
    pillars: {
      governance: number;
      hazardControl: number;
      healthVigilance: number;
      restoration: number;
    };
    ohiScore: number;
    rank: number;
    budgetSpent: Record<string, number>;
    policiesActive: string[];
    eventsOccurred: string[];
    choicesMade: Record<string, string>;
  }>;
  statistics: {
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
  };
  final_rank: number;
}

export interface GameSummaryResponse {
  narrative: string;
  highlights: string[];
  recommendations: string[];
  grade: string;
}

/**
 * Generate a contextual game event for the policy simulator
 */
export async function generateSimulatorEvent(
  request: GenerateEventRequest
): Promise<GameEventResponse> {
  const response = await aiApiClient.post<GameEventResponse>(
    "/api/v1/simulator/generate-event",
    request
  );
  return response.data;
}

/**
 * Generate end-game summary with AI narrative
 */
export async function generateGameSummary(
  request: GenerateSummaryRequest
): Promise<GameSummaryResponse> {
  const response = await aiApiClient.post<GameSummaryResponse>(
    "/api/v1/simulator/generate-summary",
    request
  );
  return response.data;
}

// ============================================================================
// SOVEREIGN HEALTH GAME - NEW AI-POWERED API FUNCTIONS
// ============================================================================

export interface CountryBriefingResponse {
  country_name: string;
  iso_code: string;
  flag_url: string;
  executive_summary: string;
  socioeconomic_context: string;
  cultural_factors: string;
  future_outlook: string;
  key_statistics: Record<string, any>;
  ohi_score: number;
  pillar_scores: Record<string, number>;
  global_rank: number;
  pillar_insights: Record<string, {
    score: number;
    analysis: string;
    key_issues: string[];
    opportunities: string[];
  }>;
  key_challenges: string[];
  key_stakeholders: Array<{
    name: string;
    role: string;
    institution: string;
    stance: string;
  }>;
  recent_articles: Array<{
    title: string;
    summary: string;
    source: string;
    url: string;
    relevance: string;
    date?: string;
  }>;
  mission_statement: string;
  difficulty_rating: string;
  country_context: Record<string, any>;
}

export interface DecisionCardResponse {
  id: string;
  title: string;
  description: string;
  detailed_context: string;
  pillar: string;
  cost: number;
  expected_impacts: Record<string, number>;
  risk_level: string;
  time_to_effect: string;
  stakeholder_reactions: Record<string, string>;
  location?: string;
  institution?: string;
}

export interface GenerateDecisionsRequest {
  iso_code: string;
  country_name: string;
  current_month: number;
  current_year: number;
  pillars: {
    governance: number;
    hazardControl: number;
    healthVigilance: number;
    restoration: number;
  };
  budget_remaining: number;
  recent_decisions: string[];
  recent_events: string[];
}

export interface NewsItemResponse {
  id: string;
  headline: string;
  summary: string;
  source: string;
  source_type: string;
  category: string;
  sentiment: string;
  location?: string;
  timestamp: string;
  related_decision?: string;
}

export interface GenerateNewsRequest {
  iso_code: string;
  current_month: number;
  current_year: number;
  recent_decisions: Array<Record<string, any>>;
  pillar_changes: Record<string, number>;
  count?: number;
}

export interface CountryContextResponse {
  iso_code: string;
  name: string;
  capital: string;
  major_cities: string[];
  industrial_regions: string[];
  key_industries: string[];
  high_risk_sectors: string[];
  ministry_name: string;
  ministry_abbreviation: string;
  labor_inspection_body: string;
  major_unions: string[];
  industry_associations: string[];
  employer_federation: string;
  iconic_landmark: string;
  landmark_city: string;
}

/**
 * Research a country and generate comprehensive AI briefing
 */
export async function researchCountry(
  iso_code: string
): Promise<CountryBriefingResponse> {
  const response = await aiApiClient.post<CountryBriefingResponse>(
    "/api/v1/simulator/research-country",
    { iso_code }
  );
  return response.data;
}

/**
 * Generate decision cards for the current turn
 */
export async function generateDecisions(
  request: GenerateDecisionsRequest
): Promise<DecisionCardResponse[]> {
  const response = await aiApiClient.post<DecisionCardResponse[]>(
    "/api/v1/simulator/generate-decisions",
    request
  );
  return response.data;
}

/**
 * Generate news items for the newsfeed
 */
export async function generateNews(
  request: GenerateNewsRequest
): Promise<NewsItemResponse[]> {
  const response = await aiApiClient.post<NewsItemResponse[]>(
    "/api/v1/simulator/generate-news",
    request
  );
  return response.data;
}

/**
 * Get country context data for realistic gameplay
 */
export async function getCountryContext(
  iso_code: string
): Promise<CountryContextResponse> {
  const response = await apiClient.get<CountryContextResponse>(
    `/api/v1/simulator/country-context/${iso_code}`
  );
  return response.data;
}

/**
 * List all available countries with full context
 */
export async function listAvailableCountries(): Promise<{
  countries: Array<{
    iso_code: string;
    name: string;
    capital: string;
    landmark: string;
  }>;
  total: number;
}> {
  const response = await apiClient.get("/api/v1/simulator/available-countries");
  return response.data;
}


// =============================================================================
// WORKFLOW-BASED API FUNCTIONS (Enhanced AI Integration)
// =============================================================================

/**
 * Workflow response from orchestrated AI operations
 */
export interface WorkflowResponse {
  workflow_type: string;
  success: boolean;
  data: Record<string, unknown>;
  agent_log: Array<{
    timestamp: string;
    agent: string;
    status: string;
    message: string;
    emoji: string;
  }>;
  errors: string[];
  execution_time_ms: number;
}

/**
 * Request for strategic advisor workflow
 */
export interface AdvisorWorkflowRequest {
  iso_code: string;
  country_name: string;
  current_month: number;
  current_year: number;
  ohi_score: number;
  pillars: {
    governance: number;
    hazardControl: number;
    healthVigilance: number;
    restoration: number;
  };
  budget_remaining: number;
  recent_decisions: string[];
}

/**
 * Request for news generator workflow
 */
export interface NewsWorkflowRequest {
  iso_code: string;
  country_name: string;
  current_month: number;
  current_year: number;
  recent_decisions: Array<Record<string, unknown>>;
  pillar_changes: Record<string, number>;
  count: number;
}

/**
 * Run the enhanced Intelligence Briefing workflow
 * Uses web search and AI synthesis for comprehensive briefing
 */
export async function runIntelligenceBriefingWorkflow(
  iso_code: string
): Promise<WorkflowResponse> {
  const response = await aiApiClient.post<WorkflowResponse>(
    "/api/v1/simulator/workflow/intelligence-briefing",
    { iso_code }
  );
  return response.data;
}

/**
 * Run the Strategic Advisor workflow
 * Generates conversational advice and decision options
 */
export async function runStrategicAdvisorWorkflow(
  request: AdvisorWorkflowRequest
): Promise<WorkflowResponse> {
  const response = await aiApiClient.post<WorkflowResponse>(
    "/api/v1/simulator/workflow/strategic-advisor",
    request
  );
  return response.data;
}

/**
 * Run the News Generator workflow
 * Creates dynamic, contextual news content
 */
export async function runNewsGeneratorWorkflow(
  request: NewsWorkflowRequest
): Promise<WorkflowResponse> {
  const response = await aiApiClient.post<WorkflowResponse>(
    "/api/v1/simulator/workflow/news-generator",
    request
  );
  return response.data;
}

/**
 * Request for final report workflow
 */
export interface FinalReportWorkflowRequest {
  country_name: string;
  history: Array<{
    cycleNumber: number;
    year: number;
    pillars: {
      governance: number;
      hazardControl: number;
      healthVigilance: number;
      restoration: number;
    };
    ohiScore: number;
    rank: number;
    budgetSpent: Record<string, number>;
    policiesActive: string[];
    eventsOccurred: string[];
    choicesMade: Record<string, string>;
  }>;
  statistics: {
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
  };
  final_rank: number;
}

/**
 * Run the Final Report workflow
 * Generates end-game summary and assessment
 */
export async function runFinalReportWorkflow(
  request: FinalReportWorkflowRequest
): Promise<WorkflowResponse> {
  const response = await aiApiClient.post<WorkflowResponse>(
    "/api/v1/simulator/workflow/final-report",
    request
  );
  return response.data;
}
