/**
 * Arthur D. Little - Global Health Platform
 * Professional App Layout with Viewport-Fit Design
 * Includes animated page transitions
 */

import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const previousPath = useRef(location.pathname);
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect route changes and trigger navigation animation
  useEffect(() => {
    if (location.pathname !== previousPath.current) {
      // Start navigation animation
      setTargetPath(location.pathname);
      setIsNavigating(true);
      
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
      
      {/* Sidebar Navigation */}
      <Sidebar />
      
      {/* Main Content Area - Viewport Fit */}
      <main className="ml-[280px] h-screen flex flex-col overflow-hidden transition-all duration-200 relative">
        {/* Content Container with Page Transitions */}
        <div className="flex-1 overflow-auto scrollbar-thin p-6">
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
        
        {/* Professional Footer Bar */}
        <footer className="flex-shrink-0 px-6 py-2 border-t border-white/5 bg-adl-navy-dark/50 backdrop-blur-sm">
          <div className="flex items-center justify-between text-xs text-white/30">
            <span>Arthur D. Little - Global Health Intelligence Platform</span>
            <span>ADL Occupational Health Framework</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default AppLayout;
