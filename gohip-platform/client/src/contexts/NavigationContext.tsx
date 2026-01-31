/**
 * Arthur D. Little - Global Health Platform
 * Navigation Context - Track route changes and manage transitions
 */

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface NavigationContextType {
  isNavigating: boolean;
  targetPath: string;
  navigateTo: (path: string) => void;
  completeNavigation: () => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
  transitionDuration?: number;
}

export function NavigationProvider({ children, transitionDuration = 600 }: NavigationProviderProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [targetPath, setTargetPath] = useState(location.pathname);
  const [previousPath, setPreviousPath] = useState(location.pathname);

  // Handle navigation with transition
  const navigateTo = useCallback((path: string) => {
    if (path === location.pathname) return;
    
    setTargetPath(path);
    setIsNavigating(true);
    
    // Delay navigation to show loader
    setTimeout(() => {
      navigate(path);
    }, 300);
  }, [location.pathname, navigate]);

  // Complete navigation (called when page is ready)
  const completeNavigation = useCallback(() => {
    setIsNavigating(false);
  }, []);

  // Detect route changes and manage loading state
  useEffect(() => {
    if (location.pathname !== previousPath) {
      setPreviousPath(location.pathname);
      setTargetPath(location.pathname);
      
      // Auto-complete navigation after transition duration
      const timer = setTimeout(() => {
        setIsNavigating(false);
      }, transitionDuration);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, previousPath, transitionDuration]);

  return (
    <NavigationContext.Provider value={{ isNavigating, targetPath, navigateTo, completeNavigation }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

export default NavigationContext;
