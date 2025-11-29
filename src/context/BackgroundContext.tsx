'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'runesswap-background';

/**
 * Context type for managing the application background image.
 */
interface BackgroundContextType {
  /** The current background image URL or null if none. */
  backgroundImage: string | null;
  /** Function to set the background image. */
  setBackgroundImage: (image: string | null) => void;
  /** Function to clear the background image. */
  clearBackgroundImage: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | null>(null);

/**
 * Provider component for the BackgroundContext.
 * Persists the background image selection to localStorage.
 *
 * @param props - Component props.
 * @param props.children - Child components.
 */
export function BackgroundProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);

  // Load background from localStorage on mount and save when it changes
  useEffect(() => {
    try {
      const savedBackground = localStorage.getItem(STORAGE_KEY);
      if (savedBackground) setBackgroundImage(savedBackground);
    } catch {
      // Ignore errors (e.g., localStorage not available)
    }
  }, []);

  useEffect(() => {
    try {
      if (backgroundImage) {
        localStorage.setItem(STORAGE_KEY, backgroundImage);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore errors
    }
  }, [backgroundImage]);

  return (
    <BackgroundContext.Provider
      value={{
        backgroundImage,
        setBackgroundImage,
        clearBackgroundImage: () => setBackgroundImage(null),
      }}
    >
      {children}
    </BackgroundContext.Provider>
  );
}

/**
 * Hook to use the background context.
 *
 * @throws Error if used outside of a BackgroundProvider.
 * @returns The background context value.
 */
export const useBackground = () => {
  const context = useContext(BackgroundContext);
  if (!context)
    throw new Error('useBackground must be used within a BackgroundProvider');
  return context;
};
