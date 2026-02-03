/**
 * Arthur D. Little - Global Occupational Health Platform
 * Main Application Entry Point
 * Sovereign OH Integrity Framework v3.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { GenerationProvider } from "./contexts/GenerationContext";
import { AppLayout } from "./components/AppLayout";
import { LandingPage } from "./pages/LandingPage";
import {
  Home,
  FrameworkPage,
  DataEngine,
  Leaderboard,
  Simulator,
  CountryData,
} from "./pages";
import { CompareV2 } from "./pages/CompareV2";
import { CompareExperience } from "./pages/CompareExperience";
import { UserManagement } from "./pages/admin/UserManagement";
import { AIOrchestration } from "./pages/admin/AIOrchestration";
import { AIOrchestrationLayer } from "./pages/admin/AIOrchestrationLayer";
import { StrategicDeepDive } from "./pages/admin/StrategicDeepDive";
import { MetricCalculator } from "./pages/admin/MetricCalculator";
import CountryDeepDive from "./pages/CountryDeepDive";
import { DeepDiveReports } from "./pages/DeepDiveReports";
import BestPractices from "./pages/BestPractices";
import { ReportWorkshop } from "./pages/admin/ReportWorkshop";
import { DatabaseExplorer } from "./pages/admin/DatabaseExplorer";
import { PillarPage } from "./pages/PillarPage";
import { OverallSummary } from "./pages/OverallSummary";
import { CountryDashboard } from "./pages/CountryDashboard";
import { FocusKSA } from "./pages/FocusKSA";

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
function PremiumLoadingScreen({ message = "Loading..." }: { message?: string }) {
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
          className="text-adl-accent text-sm font-medium tracking-wide text-center max-w-xs"
        >
          {message}
        </motion.div>
      </motion.div>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, loadingMessage } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen message={loadingMessage} />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading, loadingMessage } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen message={loadingMessage} />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// Landing page route for unauthenticated users
// Shows cinematic entrance + landing page with login modal
function LandingRoute() {
  const { isAuthenticated, isLoading, loadingMessage } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen message={loadingMessage} />;
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
  const { isAuthenticated, isLoading, loadingMessage } = useAuth();

  if (isLoading) {
    return <PremiumLoadingScreen message={loadingMessage} />;
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
      <Routes>
        {/* Public Routes - Outside AppLayout for full-screen experience */}
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

          {/* Country Dashboard - New 4-quadrant experience */}
          <Route
            path="/country/:iso"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <CountryDashboard />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Summary route (separate component) */}
          <Route
            path="/country/:iso/summary"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <OverallSummary />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Dynamic pillar route - handles governance, hazard-control, vigilance, restoration */}
          <Route
            path="/country/:iso/:pillar"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <PillarPage />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/compare"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <CompareExperience />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Legacy Compare V2 Route */}
          <Route
            path="/compare-v2"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <CompareV2 />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Focus: KSA - Saudi Arabia Strategic Framework Analysis */}
          <Route
            path="/focus-ksa"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <FocusKSA />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          {/* Personas - Saudi Arabia Labor Force Personas */}
          <Route
            path="/personas"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Personas />
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
                  <BestPractices />
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/deep-dive-reports"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <DeepDiveReports />
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
            path="/admin/orchestration"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <AdminRoute>
                    <AIOrchestrationLayer />
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
                    <ReportWorkshop />
                  </AdminRoute>
                </ProtectedRoute>
              </AppLayout>
            }
          />

          <Route
            path="/admin/database"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <AdminRoute>
                    <DatabaseExplorer />
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
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GenerationProvider>
          <AppContent />
        </GenerationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
