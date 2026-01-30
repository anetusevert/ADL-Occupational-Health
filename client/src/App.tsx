/**
 * Arthur D. Little - Global Occupational Health Platform
 * Main Application Entry Point
 * Sovereign OH Integrity Framework v3.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { Login } from "./pages/Login";
import {
  Home,
  CountryProfile,
  Compare,
  FrameworkPage,
  DataEngine,
  Leaderboard,
  Simulator,
  CountryData,
} from "./pages";
import { UserManagement } from "./pages/admin/UserManagement";
import { AIOrchestration } from "./pages/admin/AIOrchestration";
import { AgentPrompts } from "./pages/admin/AgentPrompts";
import { StrategicDeepDive } from "./pages/admin/StrategicDeepDive";
import { MetricCalculator } from "./pages/admin/MetricCalculator";
import { GenerationProgress } from "./pages/admin/GenerationProgress";

// Create React Query client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Premium Loading Screen Component
function PremiumLoadingScreen() {
  return (
    <div className="h-screen bg-adl-gradient flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full bg-adl-accent/10 blur-[120px]"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Logo Container */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative flex flex-col items-center gap-6"
      >
        {/* Orbiting Rings */}
        {[1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-adl-accent/20"
            style={{ inset: `-${i * 20}px` }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
              rotate: i % 2 === 0 ? [0, 360] : [360, 0],
            }}
            transition={{
              scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: 20, repeat: Infinity, ease: "linear" },
            }}
          />
        ))}
        
        {/* Logo with Glow */}
        <motion.img 
          src="/adl-logo.png" 
          alt="Arthur D. Little" 
          className="h-20 object-contain relative z-10" 
          animate={{
            filter: [
              "drop-shadow(0 0 20px rgba(6,182,212,0.3))",
              "drop-shadow(0 0 40px rgba(6,182,212,0.5))",
              "drop-shadow(0 0 20px rgba(6,182,212,0.3))",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Loading Text */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-adl-accent text-sm font-medium tracking-wide"
        >
          Loading...
        </motion.div>
      </motion.div>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Login redirect if already authenticated
// Redirects to Framework page on first entry for introduction
function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen />;
  }

  if (isAuthenticated) {
    // Always redirect to Framework page - introduction will show on first visit
    return <Navigate to="/framework" replace />;
  }

  return <Login />;
}

// Main App content with routes
function AppContent() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Public Route - Login */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Protected Routes - Main App */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/framework"
            element={
              <ProtectedRoute>
                <FrameworkPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/country/:iso"
            element={
              <ProtectedRoute>
                <CountryProfile />
              </ProtectedRoute>
            }
          />

          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <Compare />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/simulator"
            element={
              <ProtectedRoute>
                <Simulator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/country-data"
            element={
              <ProtectedRoute>
                <CountryData />
              </ProtectedRoute>
            }
          />

          <Route
            path="/deep-dive"
            element={
              <ProtectedRoute>
                <StrategicDeepDive />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/data-engine"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <DataEngine />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <UserManagement />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/ai-config"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AIOrchestration />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/agent-prompts"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <AgentPrompts />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/strategic-deep-dive"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <StrategicDeepDive />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/metric-calculator"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <MetricCalculator />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/generation-progress"
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <GenerationProgress />
                </AdminRoute>
              </ProtectedRoute>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                    <span className="text-4xl font-bold text-white/20">404</span>
                  </div>
                  <h1 className="text-2xl font-semibold text-white mb-2">Page Not Found</h1>
                  <p className="text-white/40 mb-6 text-sm">The requested page doesn't exist</p>
                  <a
                    href="/"
                    className="px-5 py-2.5 bg-adl-accent text-white rounded-lg hover:bg-adl-blue-light transition-colors text-sm font-medium"
                  >
                    Return to Dashboard
                  </a>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
