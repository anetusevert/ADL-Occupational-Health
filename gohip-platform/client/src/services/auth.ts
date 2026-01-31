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
