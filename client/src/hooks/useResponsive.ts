/**
 * Arthur D. Little - Global Health Platform
 * Responsive Design Hook for Mobile/Tablet/Desktop Detection
 * Provides consistent breakpoint detection and sidebar state management
 */

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

// Tailwind breakpoints
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

interface ResponsiveState {
  // Screen size detection
  isMobile: boolean;      // < 768px
  isTablet: boolean;      // 768px - 1023px
  isDesktop: boolean;     // >= 1024px
  isLargeDesktop: boolean; // >= 1280px
  
  // Exact breakpoint checks
  isSmUp: boolean;   // >= 640px
  isMdUp: boolean;   // >= 768px
  isLgUp: boolean;   // >= 1024px
  isXlUp: boolean;   // >= 1280px
  is2xlUp: boolean;  // >= 1536px
  
  // Screen dimensions
  width: number;
  height: number;
  
  // Sidebar state for mobile
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

// Context for sharing responsive state
const ResponsiveContext = createContext<ResponsiveState | null>(null);

/**
 * Hook to detect screen size and manage responsive behavior
 */
export function useResponsive(): ResponsiveState {
  const context = useContext(ResponsiveContext);
  
  // If we're in the provider, use context
  if (context) {
    return context;
  }
  
  // Otherwise create local state (for standalone usage)
  return useResponsiveInternal();
}

/**
 * Internal implementation of responsive detection
 */
function useResponsiveInternal(): ResponsiveState {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Update dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    // Debounce resize handler for performance
    let timeoutId: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };
    
    window.addEventListener('resize', debouncedResize);
    
    // Initial call
    handleResize();
    
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);
  
  // Close sidebar when switching to desktop
  useEffect(() => {
    if (dimensions.width >= BREAKPOINTS.lg) {
      setSidebarOpen(false);
    }
  }, [dimensions.width]);
  
  // Sidebar controls
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);
  
  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);
  
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);
  
  const { width, height } = dimensions;
  
  return {
    // Screen size categories
    isMobile: width < BREAKPOINTS.md,
    isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
    isDesktop: width >= BREAKPOINTS.lg,
    isLargeDesktop: width >= BREAKPOINTS.xl,
    
    // Breakpoint checks (mobile-first)
    isSmUp: width >= BREAKPOINTS.sm,
    isMdUp: width >= BREAKPOINTS.md,
    isLgUp: width >= BREAKPOINTS.lg,
    isXlUp: width >= BREAKPOINTS.xl,
    is2xlUp: width >= BREAKPOINTS['2xl'],
    
    // Dimensions
    width,
    height,
    
    // Sidebar state
    sidebarOpen,
    toggleSidebar,
    openSidebar,
    closeSidebar,
  };
}

/**
 * Provider for responsive state (optional - for performance optimization)
 */
export function ResponsiveProvider({ children }: { children: ReactNode }) {
  const responsive = useResponsiveInternal();
  
  return (
    <ResponsiveContext.Provider value={responsive}>
      {children}
    </ResponsiveContext.Provider>
  );
}

/**
 * Custom hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    
    // Legacy browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);
  
  return matches;
}

export { BREAKPOINTS };
export default useResponsive;
