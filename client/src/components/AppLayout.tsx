/**
 * Arthur D. Little - Global Health Platform
 * Professional App Layout with Viewport-Fit Design
 * Fully Responsive: Mobile-first with adaptive sidebar
 */

import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Activity } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { NavigationLoader } from "./NavigationLoader";
import { useAuth } from "../contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

// Page transition variants
const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: "easeIn" as const,
    },
  },
};

export function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState(location.pathname);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const previousPath = useRef(location.pathname);
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect route changes and trigger navigation animation
  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      // Start navigation animation
      setTargetPath(location.pathname);
      setIsNavigating(true);
      
      // Close mobile menu on navigation
      setMobileMenuOpen(false);
      
      // Clear any existing timeout
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      
      // End navigation after animation completes
      navigationTimeout.current = setTimeout(() => {
        setIsNavigating(false);
        previousPath.current = location.pathname;
      }, 500);
    }
    
    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
    };
  }, [location.pathname]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden bg-adl-gradient">
      {/* Navigation Loader Overlay */}
      <NavigationLoader isLoading={isNavigating} targetPath={targetPath} />
      
      {/* Subtle professional background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>
      
      {/* Sidebar Navigation - Desktop fixed, Mobile overlay */}
      <Sidebar 
        mobileOpen={mobileMenuOpen} 
        onMobileClose={() => setMobileMenuOpen(false)} 
      />
      
      {/* Mobile Header - Only visible on mobile */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-adl-navy-dark/95 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 safe-top">
        {/* Hamburger Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="w-10 h-10 flex items-center justify-center rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        {/* Mobile Logo/Title */}
        <Link to="/framework" className="flex items-center gap-2">
          <img 
            src="/adl-logo.png" 
            alt="ADL"
            className="h-8 object-contain"
          />
          <span className="text-white/80 font-medium text-sm hidden sm:inline">
            Global Health
          </span>
        </Link>
        
        {/* Platform Status Indicator */}
        <div className="w-10 h-10 flex items-center justify-center">
          <Activity className="w-4 h-4 text-adl-accent animate-pulse" />
        </div>
      </header>
      
      {/* Main Content Area - Responsive margins and padding */}
      <main className="ml-0 lg:ml-[280px] h-screen flex flex-col overflow-hidden transition-all duration-200 relative pt-14 lg:pt-0">
        {/* Content Container with Page Transitions */}
        <div className="flex-1 overflow-auto scrollbar-thin p-4 md:p-6">
          <div className="max-w-[1600px] mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        {/* Professional Footer Bar - Responsive */}
        <footer className="flex-shrink-0 px-4 md:px-6 py-2 border-t border-white/5 bg-adl-navy-dark/50 backdrop-blur-sm safe-bottom">
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-white/30">
            <span className="truncate">Arthur D. Little - Global Health Intelligence</span>
            <span className="hidden sm:inline">ADL Occupational Health Framework</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default AppLayout;
