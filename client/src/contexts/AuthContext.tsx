/**
 * GOHIP Platform - Authentication Context
 * Phase 26: Centralized auth state management
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

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

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  loadingMessage: string;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const TOKEN_KEY = "gohip_token";
const USER_KEY = "gohip_user";

// Known Railway backend URL
const RAILWAY_BACKEND_URL = "https://adl-occupational-health-production.up.railway.app";

// Detect API base URL
function getApiBaseUrl(): string {
  // First priority: explicitly set environment variable
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    console.log(`[Auth] Using VITE_API_URL: ${envUrl}`);
    return envUrl;
  }
  
  // Second priority: auto-detect for Railway deployments
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    if (hostname.includes('.up.railway.app')) {
      // Use the known Railway backend URL
      console.log(`[Auth] Railway detected, using backend: ${RAILWAY_BACKEND_URL}`);
      return RAILWAY_BACKEND_URL;
    }
  }
  
  // Fallback for local development
  console.log(`[Auth] Using localhost fallback`);
  return "http://localhost:8000";
}

const API_BASE_URL = getApiBaseUrl();

// Request timeout in milliseconds (45 seconds for Railway cold starts)
const AUTH_TIMEOUT_MS = 45000;

// Helper to create fetch with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = AUTH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log(`[Auth] Request timed out after ${timeoutMs}ms`);
    controller.abort();
  }, timeoutMs);

  try {
    console.log(`[Auth] Starting fetch to: ${url}`);
    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    console.log(`[Auth] Fetch completed in ${Date.now() - startTime}ms, status: ${response.status}`);
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState<string>("Loading...");
  const [authError, setAuthError] = useState<string | null>(null);

  // Computed values
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "admin";

  // Fetch current user info with timeout
  const fetchUser = useCallback(async (authToken: string): Promise<User | null> => {
    const url = `${API_BASE_URL}/api/v1/auth/me`;
    console.log(`[Auth] Fetching user from: ${url}`);
    
    try {
      const response = await fetchWithTimeout(
        url,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`[Auth] User fetch failed with status: ${response.status}`);
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const userData = await response.json();
      console.log(`[Auth] User fetched successfully:`, userData.email);
      return userData;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("[Auth] Request timed out - backend may be unreachable");
        console.error(`[Auth] Tried URL: ${url}`);
      } else {
        console.error("[Auth] Error fetching user:", error);
        console.error(`[Auth] Tried URL: ${url}`);
      }
      return null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      console.log("[Auth] Initializing auth state...");
      const storedToken = localStorage.getItem(TOKEN_KEY);
      console.log("[Auth] Stored token exists:", !!storedToken);
      
      if (storedToken) {
        try {
          console.log("[Auth] Validating stored token...");
          const userData = await fetchUser(storedToken);
          if (userData) {
            console.log("[Auth] Token valid, user loaded");
            setUser(userData);
            setToken(storedToken);
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            setAuthError(null);
          } else {
            // Token invalid, clear storage
            console.log("[Auth] Token invalid, clearing storage");
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error("[Auth] Initialization failed:", error);
          // Clear invalid state
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
          setAuthError("Unable to connect to authentication service");
        }
      } else {
        console.log("[Auth] No stored token, showing login");
      }
      
      // Always set loading to false, even if there was an error
      console.log("[Auth] Setting isLoading to false");
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setLoadingMessage("Signing in...");
    setAuthError(null);
    
    // Show "server starting" message after 5 seconds (Railway cold start)
    const slowServerTimer = setTimeout(() => {
      setLoadingMessage("Server is starting up, please wait...");
    }, 5000);
    
    try {
      const response = await fetchWithTimeout(
        `${API_BASE_URL}/api/v1/auth/login/json`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Login failed");
      }

      const data = await response.json();
      const authToken = data.access_token;

      // Store token
      localStorage.setItem(TOKEN_KEY, authToken);
      setToken(authToken);

      // Fetch user info
      setLoadingMessage("Loading your profile...");
      const userData = await fetchUser(authToken);
      if (userData) {
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      } else {
        // Login succeeded but couldn't fetch user details
        // Create a minimal user object to allow navigation
        // This happens when /auth/me fails but login succeeded
        console.warn("Login succeeded but user fetch failed - using minimal user");
        const minimalUser: User = {
          id: 0,
          email: email,
          full_name: null,
          role: "user",
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          last_login: new Date().toISOString(),
        };
        setUser(minimalUser);
        localStorage.setItem(USER_KEY, JSON.stringify(minimalUser));
      }
    } catch (error) {
      // Handle errors without re-throwing to prevent loading state from getting stuck
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          console.error("[Auth] Login timed out after 45 seconds");
          setAuthError("Server took too long to respond. Please try again.");
        } else {
          console.error("[Auth] Login error:", error.message);
          setAuthError(error.message || "Login failed. Please try again.");
        }
      } else {
        setAuthError("An unexpected error occurred. Please try again.");
      }
    } finally {
      clearTimeout(slowServerTimer);
      setIsLoading(false);
      setLoadingMessage("Loading...");
    }
  }, [fetchUser]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Clear the framework intro flag so it shows again on next login
    localStorage.removeItem("adl_framework_intro_shown");
    setToken(null);
    setUser(null);
  }, []);

  // Refresh user function
  const refreshUser = useCallback(async () => {
    if (token) {
      const userData = await fetchUser(token);
      if (userData) {
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      }
    }
  }, [token, fetchUser]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isLoading,
    loadingMessage,
    authError,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Protected route wrapper
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Will be handled by App.tsx to show Login
    return null;
  }

  return <>{children}</>;
}

// Admin route wrapper
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-red-400">Admin access required</div>
      </div>
    );
  }

  return <>{children}</>;
}
