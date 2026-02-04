/**
 * Arthur D. Little - Global Health Platform
 * Professional Collapsible Sidebar Navigation
 * Fully Responsive: Hidden on mobile, collapsible on desktop
 */

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Map,
  Layers,
  Brain,
  Trophy,
  GitCompare,
  Database,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Users,
  Users2,
  Cpu,
  Shield,
  Activity,
  BarChart3,
  Table2,
  Calculator,
  Wrench,
  X,
  Workflow,
  HardDrive,
  Play,
  Sparkles,
  Target,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { cn } from "../lib/utils";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  beta?: boolean;
  restrictedForNonAdmin?: boolean;
}

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  onOpenExecutiveBriefing?: () => void;
}

// Framework - Standalone at top
const frameworkItem: NavItem = { path: "/framework", label: "Framework", icon: Layers };

// Analytics Suite - Data exploration and analysis
const analyticsSuiteItems: NavItem[] = [
  { path: "/home", label: "Global", icon: Map },
  { path: "/focus-ksa", label: "Focus: KSA", icon: Target },
  { path: "/personas", label: "KSA Personas", icon: Users2 },
  { path: "/deep-dive", label: "Best Practices", icon: Brain },
  { path: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { path: "/country-data", label: "Data", icon: Database },
];

// Tool Suite - Interactive tools for users
const toolSuiteItems: NavItem[] = [
  { path: "/data-engine", label: "Data Engine", icon: Database },
  { path: "/metric-calculator", label: "Scoring", icon: Calculator },
];

// Administration - Admin only features
const adminNavItems: NavItem[] = [
  { path: "/admin/database", label: "Data Explorer", icon: Database, adminOnly: true },
  { path: "/admin/orchestration", label: "AI Orchestration", icon: Workflow, adminOnly: true },
  { path: "/admin/users", label: "User Management", icon: Users, adminOnly: true },
  { path: "/admin/ai-config", label: "AI Configuration", icon: Cpu, adminOnly: true },
];

export function Sidebar({ mobileOpen = false, onMobileClose, onOpenExecutiveBriefing }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { user, isAdmin, logout } = useAuth();

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Handle click on nav link - close mobile menu
  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  // Sidebar content (shared between mobile and desktop)
  const renderSidebarContent = (isMobile: boolean) => (
    <>
      {/* Header with GOSI Logo */}
      <div className="h-[72px] border-b border-white/5 flex items-center justify-between px-4">
        <Link 
          to="/framework" 
          className="flex-1 flex flex-col items-center overflow-hidden group"
          onClick={handleNavClick}
        >
          <div className="flex flex-col items-center text-center pt-1">
            <div className={cn(
              "flex items-center justify-center",
              isMobile || !isCollapsed ? "h-10 w-20" : "h-8 w-14"
            )}>
              <img 
                src="/gosi-logo.png" 
                alt="GOSI"
                className="brightness-0 invert object-contain w-full h-full"
              />
            </div>
            {(isMobile || !isCollapsed) && (
              <span className="text-[9px] text-adl-accent font-medium mt-0.5 whitespace-nowrap tracking-wide text-center">
                Occupational Health Intelligence
              </span>
            )}
          </div>
        </Link>
        
        {/* Mobile: Close button, Desktop: Collapse button */}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={toggleCollapse}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide py-4 px-3">
        {/* Executive Briefing - Premium ADL + GOSI Co-Branded Button */}
        <motion.button
          onClick={() => {
            onOpenExecutiveBriefing?.();
            if (onMobileClose) onMobileClose();
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={cn(
            "w-full mb-5 relative group overflow-hidden rounded-xl",
            "bg-gradient-to-r from-purple-900/40 via-adl-navy to-cyan-900/40",
            "border border-purple-500/30 hover:border-cyan-400/50",
            "transition-all duration-500",
            !isMobile && isCollapsed ? "p-2" : "p-3"
          )}
        >
          {/* Animated gradient border */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500/20 via-transparent to-cyan-500/20 animate-pulse" />
          </div>
          
          {/* Glow effect on hover */}
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-[0_0_30px_rgba(139,92,246,0.3),0_0_60px_rgba(6,182,212,0.2)]" />
          
          {/* Content */}
          <div className="relative z-10">
            {/* Logo Row - ADL only, no text */}
            <div className={cn(
              "flex items-center gap-2 mb-2",
              !isMobile && isCollapsed ? "justify-center" : "justify-center"
            )}>
              {/* ADL Logo only (no text) */}
              <div className="h-7 w-12 flex-shrink-0 overflow-hidden">
                <img 
                  src="/adl-logo.png" 
                  alt="ADL"
                  className="h-full w-full object-contain brightness-0 invert opacity-90"
                />
              </div>
            </div>
            
            {/* Text and CTA */}
            {(isMobile || !isCollapsed) && (
              <div className="text-center">
                <p className="text-[10px] font-semibold text-white/80 uppercase tracking-wider mb-1">
                  Executive Briefing
                </p>
                <div className="flex items-center justify-center gap-1.5 text-cyan-400 group-hover:text-cyan-300 transition-colors">
                  <Play className="w-3 h-3 fill-current" />
                  <span className="text-[10px] font-medium">Start</span>
                  <Sparkles className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            )}
            
            {/* Collapsed state icon */}
            {!isMobile && isCollapsed && (
              <div className="flex justify-center">
                <Play className="w-4 h-4 text-cyan-400 fill-current" />
              </div>
            )}
          </div>
          
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        </motion.button>

        {/* Platform Status */}
        <div
          className={cn(
            "mb-5 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-adl-accent/10 border border-adl-accent/20",
            !isMobile && isCollapsed && "justify-center"
          )}
        >
          <Activity className="w-4 h-4 text-adl-accent animate-pulse flex-shrink-0" />
          {(isMobile || !isCollapsed) && (
            <span className="text-xs text-adl-accent font-medium whitespace-nowrap">
              Platform Active
            </span>
          )}
        </div>

        {/* Framework - Standalone Top Item */}
        <div className="mb-4">
          <NavLink
            item={frameworkItem}
            isActive={location.pathname === frameworkItem.path}
            isCollapsed={!isMobile && isCollapsed}
            isHighlight
            onClick={handleNavClick}
          />
        </div>

        {/* Section: Analytics Suite */}
        {(isMobile || !isCollapsed) && (
          <div className="px-3 mb-2 flex items-center gap-2">
            <BarChart3 className="w-3 h-3 text-white/30" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
              Analytics Suite
            </span>
          </div>
        )}

        <div className="space-y-1 mb-4">
          {analyticsSuiteItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              isCollapsed={!isMobile && isCollapsed}
              onClick={handleNavClick}
            />
          ))}
        </div>

        {/* Section: Tool Suite */}
        {(isMobile || !isCollapsed) && (
          <div className="px-3 mb-2 flex items-center gap-2">
            <Wrench className="w-3 h-3 text-white/30" />
            <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
              Tool Suite
            </span>
          </div>
        )}

        <div className="space-y-1">
          {toolSuiteItems.map((item) => (
            <NavLink
              key={item.path}
              item={item}
              isActive={location.pathname === item.path}
              isCollapsed={!isMobile && isCollapsed}
              isUserAdmin={isAdmin}
              onClick={handleNavClick}
            />
          ))}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="my-5 border-t border-white/5" />
            {(isMobile || !isCollapsed) && (
              <div className="px-3 mb-2 flex items-center gap-2">
                <Shield className="w-3 h-3 text-amber-400/70" />
                <span className="text-[10px] font-semibold text-amber-400/70 uppercase tracking-wider">
                  Administration
                </span>
              </div>
            )}

            <div className="space-y-1">
              {adminNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  isActive={location.pathname === item.path}
                  isCollapsed={!isMobile && isCollapsed}
                  isAdmin
                  onClick={handleNavClick}
                />
              ))}
            </div>
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/5 p-3">
        <div
          className={cn(
            "flex items-center gap-3 p-2.5 rounded-lg bg-white/5",
            !isMobile && isCollapsed && "justify-center"
          )}
        >
          <div className="flex-shrink-0 w-9 h-9 bg-adl-accent/20 rounded-lg flex items-center justify-center border border-adl-accent/30">
            <User className="w-5 h-5 text-adl-accent" />
          </div>
          {(isMobile || !isCollapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-white/40 capitalize font-medium">{user?.role}</p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            logout();
            if (onMobileClose) onMobileClose();
          }}
          className={cn(
            "mt-2 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
            "text-white/40 hover:text-red-400 hover:bg-red-500/10",
            "transition-all duration-200",
            !isMobile && isCollapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(isMobile || !isCollapsed) && (
            <span className="text-sm font-medium whitespace-nowrap">
              Sign Out
            </span>
          )}
        </button>
      </div>

      {/* ADL Footer */}
      <div className="px-4 py-3 border-t border-white/5">
        {(isMobile || !isCollapsed) && (
          <div className="text-center">
            <p className="text-[9px] text-white/20 font-medium">
              &copy; {new Date().getFullYear()} Arthur D. Little
            </p>
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* ========== MOBILE SIDEBAR ========== */}
      {/* Backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar - Slide in overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed left-0 top-0 bottom-0 w-[280px] z-50 bg-adl-navy-dark/98 backdrop-blur-xl border-r border-white/5 flex flex-col lg:hidden"
          >
            {renderSidebarContent(true)}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ========== DESKTOP SIDEBAR ========== */}
      {/* Wrapper div ensures proper hiding on mobile - Framer Motion won't override this */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-50">
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 80 : 280 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="h-full bg-adl-navy-dark/95 backdrop-blur-xl border-r border-white/5 flex flex-col"
        >
          {renderSidebarContent(false)}
        </motion.aside>
      </div>
    </>
  );
}

// NavLink component
function NavLink({
  item,
  isActive,
  isCollapsed,
  isAdmin = false,
  isHighlight = false,
  isUserAdmin = false,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  isAdmin?: boolean;
  isHighlight?: boolean;
  isUserAdmin?: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  const handleClick = (e: React.MouseEvent) => {
    // Check if this item is restricted for non-admin users
    if (item.restrictedForNonAdmin && !isUserAdmin) {
      e.preventDefault();
      alert("This feature is currently in development and only accessible for administrators.");
      return;
    }
    onClick?.();
  };

  return (
    <Link
      to={item.path}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
        isActive
          ? isAdmin
            ? "bg-amber-500/15 text-amber-400 shadow-lg shadow-amber-500/5"
            : isHighlight
              ? "bg-adl-accent/20 text-adl-accent shadow-lg shadow-adl-accent/10 border border-adl-accent/30"
              : "bg-adl-accent/15 text-adl-accent shadow-lg shadow-adl-accent/5"
          : isHighlight
            ? "text-white/70 hover:text-adl-accent hover:bg-adl-accent/10 border border-transparent hover:border-adl-accent/20"
            : "text-white/50 hover:text-white hover:bg-white/5",
        isCollapsed && "justify-center"
      )}
    >
      <Icon className={cn(
        "w-5 h-5 flex-shrink-0", 
        isActive && (isAdmin ? "text-amber-400" : "text-adl-accent"),
        isHighlight && !isActive && "text-adl-accent/60"
      )} />
      {!isCollapsed && (
        <div className="flex items-center gap-2 flex-1">
          <span className={cn(
            "text-sm font-medium whitespace-nowrap",
            isHighlight && "font-semibold"
          )}>
            {item.label}
          </span>
          {item.beta && (
            <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 rounded border border-amber-500/30">
              Beta
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default Sidebar;
