import { useState, useEffect } from 'react';

/**
 * Hook to detect whether the user is on a mobile viewport (<= 768px).
 * Uses window.matchMedia for performant, listener-based responsiveness.
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= breakpoint;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(`(max-width: ${breakpoint}px)`);
    
    // Modern listener
    const updateMatches = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsMobile(e.matches);
    };

    // Set initial
    setIsMobile(mediaQuery.matches);

    // Event listener for media query
    try {
      mediaQuery.addEventListener('change', updateMatches);
      return () => mediaQuery.removeEventListener('change', updateMatches);
    } catch {
      // Fallback for older browsers
      const handleResize = () => setIsMobile(window.innerWidth <= breakpoint);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [breakpoint]);

  return isMobile;
};

export default useIsMobile;
