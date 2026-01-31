/**
 * GOHIP Platform - Layout Component
 * Main application layout with header and navigation
 */

import { Link, useLocation } from "react-router-dom";
import { Globe2, Map, BarChart3, GitCompare, Activity, Layers, Database, Trophy, Target } from "lucide-react";
import { cn } from "../lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Map", icon: Map },
    { path: "/framework", label: "Framework", icon: Layers },
    { path: "/simulator", label: "Simulator", icon: Target },
    { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { path: "/compare", label: "Compare", icon: GitCompare },
    { path: "/data-engine", label: "Data Engine", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-950 to-black">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-700/50 backdrop-blur-md bg-slate-900/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight">GOHIP</span>
                <p className="text-[10px] text-slate-400 -mt-1">Executive Command Center</p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === path
                      ? "bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Status */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
              <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <BarChart3 className="w-4 h-4" />
              <span>GOHIP — Global Occupational Health Intelligence Platform</span>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <span>ADL Occupational Health Framework v2.0</span>
              <span>•</span>
              <span>Phase 25: Deep Dive AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
