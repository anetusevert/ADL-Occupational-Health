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
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const TOKEN_KEY = "gohip_token";
const USER_KEY = "gohip_user";

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });
  const [isLoading, setIsLoading] = useState(true);

  // Computed values
  const isAuthenticated = !!token && !!user;
  const isAdmin = user?.role === "admin";

  // Fetch current user info
  const fetchUser = useCallback(async (authToken: string): Promise<User | null> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user");
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }, []);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      
      if (storedToken) {
        const userData = await fetchUser(storedToken);
        if (userData) {
          setUser(userData);
          setToken(storedToken);
          localStorage.setItem(USER_KEY, JSON.stringify(userData));
        } else {
          // Token invalid, clear storage
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setToken(null);
          setUser(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, [fetchUser]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login/json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

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
      const userData = await fetchUser(authToken);
      if (userData) {
        setUser(userData);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchUser]);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
