'use client';

import type { LaserEyesContextType } from '@omnisat/lasereyes';
import { createContext, useContext } from 'react';

// Create the context with a default value (or null/undefined)
const LaserEyesContext = createContext<LaserEyesContextType | null>(null);

// Custom hook to use the LaserEyes context
/**
 * Hook to access the shared LaserEyes context.
 *
 * @throws Error if used outside of a LaserEyesProvider (via SharedLaserEyesProvider).
 * @returns The LaserEyes context value.
 */
export const useSharedLaserEyes = () => {
  const context = useContext(LaserEyesContext);
  if (!context) {
    throw new Error(
      'useSharedLaserEyes must be used within a LaserEyesProvider via SharedLaserEyesProvider',
    );
  }
  return context;
};

// Export the context itself if needed, and the Provider component wrapper
export { LaserEyesContext };
