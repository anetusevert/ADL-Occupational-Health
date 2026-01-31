/**
 * Arthur D. Little - Global Occupational Health Platform
 * Main Application Entry Point
 * ADL Occupational Health Framework v2.0
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Error Boundary to catch runtime errors and display fallback UI
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
          <div className="bg-slate-800/50 border border-red-500/30 rounded-2xl p-8 max-w-lg text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">Application Error</h2>
            <p className="text-slate-400 mb-4">
              Something went wrong loading the application.
            </p>
            <pre className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-left text-xs text-red-300 overflow-auto max-h-32 mb-4">
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
import { AppLayout } from "./components/AppLayout";

// Use React.lazy for code-splitting and to avoid TDZ issues
const LandingPage = React.lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const Home = React.lazy(() => import("./pages/Home").then(m => ({ default: m.Home })));
const CountryProfile = React.lazy(() => import("./pages/CountryProfile").then(m => ({ default: m.CountryProfile })));
const Compare = React.lazy(() => import("./pages/Compare").then(m => ({ default: m.Compare })));
const FrameworkPage = React.lazy(() => import("./pages/FrameworkPage").then(m => ({ default: m.FrameworkPage })));
const DataEngine = React.lazy(() => import("./pages/DataEngine").then(m => ({ default: m.DataEngine })));
const Leaderboard = React.lazy(() => import("./pages/Leaderboard").then(m => ({ default: m.Leaderboard })));
const Simulator = React.lazy(() => import("./pages/Simulator").then(m => ({ default: m.Simulator })));
const CountryData = React.lazy(() => import("./pages/CountryData").then(m => ({ default: m.CountryData })));
const UserManagement = React.lazy(() => import("./pages/admin/UserManagement").then(m => ({ default: m.UserManagement })));
const AIOrchestration = React.lazy(() => import("./pages/admin/AIOrchestration").then(m => ({ default: m.AIOrchestration })));
const AgentPrompts = React.lazy(() => import("./pages/admin/AgentPrompts").then(m => ({ default: m.AgentPrompts })));
const StrategicDeepDive = React.lazy(() => import("./pages/admin/StrategicDeepDive").then(m => ({ default: m.StrategicDeepDive })));
const MetricCalculator = React.lazy(() => import("./pages/admin/MetricCalculator").then(m => ({ default: m.MetricCalculator })));
const GenerationProgress = React.lazy(() => import("./pages/admin/GenerationProgress").then(m => ({ default: m.GenerationProgress })));

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

// Landing page route for unauthenticated users
// Shows cinematic entrance + landing page with login modal
function LandingRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen />;
  }

  if (isAuthenticated) {
    // Redirect authenticated users to Framework page
    return <Navigate to="/framework" replace />;
  }

  // Show landing page (outside of AppLayout for full-screen experience)
  return <LandingPage />;
}

// Login redirect - now redirects to landing page
function LoginRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/framework" replace />;
  }

  // Redirect to landing page instead of showing old login
  return <Navigate to="/" replace />;
}

// Main App content with routes
function AppContent() {
  return (
    <BrowserRouter>
      <React.Suspense fallback={<PremiumLoadingScreen />}>
      <Routes>
        {/* Public Routes - Outside AppLayout */}
        <Route path="/" element={<LandingRoute />} />
        <Route path="/login" element={<LoginRoute />} />

        {/* Protected Routes - Inside AppLayout */}
        <Route
          path="/home"
          element={
            <AppLayout>
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            </AppLayout>
          }
        />

          <Route
            path="/framework"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <FrameworkPage />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/country/:iso"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <CountryProfile />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/compare"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Compare />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/leaderboard"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/simulator"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Simulator />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/country-data"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <CountryData />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/deep-dive"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <StrategicDeepDive />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Tool Suite Routes - Available to all users */}
          <Route
            path="/data-engine"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <DataEngine />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/metric-calculator"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <MetricCalculator />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/users"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <AdminRoute>
                    <UserManagement />
                  </AdminRoute>
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/admin/ai-config"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <AdminRoute>
                    <AIOrchestration />
                  </AdminRoute>
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/admin/agent-prompts"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <AdminRoute>
                    <AgentPrompts />
                  </AdminRoute>
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/admin/strategic-deep-dive"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <AdminRoute>
                    <StrategicDeepDive />
                  </AdminRoute>
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/admin/generation-progress"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <AdminRoute>
                    <GenerationProgress />
                  </AdminRoute>
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* 404 Fallback */}
          <Route
            path="*"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                      <span className="text-4xl font-bold text-white/20">404</span>
                    </div>
                    <h1 className="text-2xl font-semibold text-white mb-2">Page Not Found</h1>
                    <p className="text-white/40 mb-6 text-sm">The requested page doesn't exist</p>
                    <a
                      href="/framework"
                      className="px-5 py-2.5 bg-adl-accent text-white rounded-lg hover:bg-adl-blue-light transition-colors text-sm font-medium"
                    >
                      Return to Dashboard
                    </a>
                  </div>
                </ProtectedRoute>
              </AppLayout>
            }
          />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
