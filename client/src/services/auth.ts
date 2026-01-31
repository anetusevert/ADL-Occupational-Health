/**
 * GOHIP Platform - Authentication API Service
 * Phase 26: Auth-related API functions
 */

import { apiClient } from "./api";

// Types
export interface User {
  id: number;
  email: string;
  full_name: string | null;
  role: "admin" | "user" | "viewer";
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UserCreate {
  email: string;
  password: string;
  full_name?: string;
  role?: "admin" | "user" | "viewer";
}

export interface UserUpdate {
  email?: string;
  password?: string;
  full_name?: string;
  role?: "admin" | "user" | "viewer";
  is_active?: boolean;
}

export interface UsersListResponse {
  total: number;
  users: User[];
}

// Auth header helper
export function getAuthHeader() {
  const token = localStorage.getItem("gohip_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ============================================================================
// USER MANAGEMENT API (Admin only)
// ============================================================================

/**
 * Get all users (admin only)
 */
export async function getUsers(): Promise<UsersListResponse> {
  const response = await apiClient.get<UsersListResponse>("/api/v1/auth/users", {
    headers: getAuthHeader(),
  });
  return response.data;
}

/**
 * Create a new user (admin only)
 */
export async function createUser(userData: UserCreate): Promise<User> {
  const response = await apiClient.post<User>("/api/v1/auth/users", userData, {
    headers: getAuthHeader(),
  });
  return response.data;
}

/**
 * Update a user (admin only)
 */
export async function updateUser(userId: number, userData: UserUpdate): Promise<User> {
  const response = await apiClient.put<User>(`/api/v1/auth/users/${userId}`, userData, {
    headers: getAuthHeader(),
  });
  return response.data;
}

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: number): Promise<void> {
  await apiClient.delete(`/api/v1/auth/users/${userId}`, {
    headers: getAuthHeader(),
  });
}

// ============================================================================
// AI CONFIGURATION API (Admin only)
// ============================================================================

export interface AIConfig {
  id: number;
  provider: string;
  model_name: string;
  api_key_configured: boolean;
  api_key_preview: string | null;
  api_endpoint: string | null;
  temperature: number;
  max_tokens: number | null;
  extra_settings: Record<string, unknown> | null;
  is_active: boolean;
  is_configured: boolean;
  configured_by: number | null;
}

export interface AIConfigUpdate {
  provider: string;
  model_name: string;
  api_key?: string;
  api_endpoint?: string;
  temperature?: number;
  max_tokens?: number;
  extra_settings?: Record<string, unknown>;
}

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  requires_api_key: boolean;
  requires_endpoint: boolean;
  models: ModelInfo[];
}

export interface ProvidersListResponse {
  providers: ProviderInfo[];
}

export interface AITestRequest {
  provider?: string;
  model_name?: string;
  api_key?: string;
  prompt?: string;
}

export interface AITestResponse {
  success: boolean;
  message: string;
  response?: string;
  latency_ms?: number;
}

/**
 * Get current AI configuration
 */
export async function getAIConfig(): Promise<AIConfig> {
  const response = await apiClient.get<AIConfig>("/api/v1/ai-config/", {
    headers: getAuthHeader(),
  });
  return response.data;
}

/**
 * Update AI configuration
 */
export async function updateAIConfig(config: AIConfigUpdate): Promise<AIConfig> {
  const response = await apiClient.put<AIConfig>("/api/v1/ai-config/", config, {
    headers: getAuthHeader(),
  });
  return response.data;
}

/**
 * Get available AI providers and models
 */
export async function getAIProviders(): Promise<ProvidersListResponse> {
  const response = await apiClient.get<ProvidersListResponse>("/api/v1/ai-config/providers", {
    headers: getAuthHeader(),
  });
  return response.data;
}

/**
 * Test AI connection
 */
export async function testAIConnection(request: AITestRequest): Promise<AITestResponse> {
  const response = await apiClient.post<AITestResponse>("/api/v1/ai-config/test", request, {
    headers: getAuthHeader(),
  });
  return response.data;
}

// ============================================================================
// AI CALL TRACES API (Admin only)
// ============================================================================

export interface AICallTrace {
  id: string;
  timestamp: string;
  provider: string;
  model_name: string;
  endpoint: string | null;
  operation_type: string;
  country_iso_code: string | null;
  topic: string | null;
  latency_ms: number | null;
  success: boolean;
  error_message: string | null;
  user_id: number | null;
}

export interface AICallTracesListResponse {
  traces: AICallTrace[];
  total: number;
  page: number;
  page_size: number;
}

export interface AICallTracesFilters {
  page?: number;
  page_size?: number;
  provider?: string;
  model_name?: string;
  success?: boolean;
  operation_type?: string;
  country_iso_code?: string;
  start_date?: string;
  end_date?: string;
}

export interface AICallStats {
  period_days: number;
  total_calls: number;
  success_count: number;
  error_count: number;
  success_rate: number;
  avg_latency_ms: number;
  calls_by_provider: Record<string, number>;
  calls_by_operation: Record<string, number>;
  recent_errors: Array<{
    id: string;
    timestamp: string;
    provider: string;
    model_name: string;
    operation_type: string;
    error_message: string | null;
  }>;
}

/**
 * Get AI call traces with optional filters
 */
export async function getAICallTraces(filters: AICallTracesFilters = {}): Promise<AICallTracesListResponse> {
  const params = new URLSearchParams();
  
  if (filters.page) params.append("page", filters.page.toString());
  if (filters.page_size) params.append("page_size", filters.page_size.toString());
  if (filters.provider) params.append("provider", filters.provider);
  if (filters.model_name) params.append("model_name", filters.model_name);
  if (filters.success !== undefined) params.append("success", filters.success.toString());
  if (filters.operation_type) params.append("operation_type", filters.operation_type);
  if (filters.country_iso_code) params.append("country_iso_code", filters.country_iso_code);
  if (filters.start_date) params.append("start_date", filters.start_date);
  if (filters.end_date) params.append("end_date", filters.end_date);
  
  const queryString = params.toString();
  const url = `/api/v1/ai-config/traces${queryString ? `?${queryString}` : ""}`;
  
  const response = await apiClient.get<AICallTracesListResponse>(url, {
    headers: getAuthHeader(),
  });
  return response.data;
}

/**
 * Get AI call statistics
 */
export async function getAICallStats(days: number = 30): Promise<AICallStats> {
  const response = await apiClient.get<AICallStats>(`/api/v1/ai-config/traces/stats?days=${days}`, {
    headers: getAuthHeader(),
  });
  return response.data;
}
