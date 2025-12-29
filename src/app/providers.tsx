'use client';

import type { LaserEyesContextType } from '@omnisat/lasereyes';
import { LaserEyesProvider, MAINNET, useLaserEyes } from '@omnisat/lasereyes';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';

import { BackgroundProvider } from '@/context/BackgroundContext';
import { LaserEyesContext } from '@/context/LaserEyesContext';
import { queryClient } from '@/lib/queryClient';

const laserEyesStub: Partial<LaserEyesContextType> = {
  isInitializing: false,
  connected: false,
  isConnecting: false,
  publicKey: '',
  address: '',
  paymentAddress: '',
  paymentPublicKey: '',
  provider: undefined,
  hasUnisat: false,
  connect: async () => {
    /* noop */
  },
  disconnect: () => {
    /* noop */
  },
  signPsbt: async () => undefined,
  signMessage: async () => '',
};

/**
 * Supplies LaserEyesContext to its descendants using the value returned by `useLaserEyes`.
 *
 * @param children - Child elements that will receive the provided LaserEyesContext
 */
function SharedLaserEyesProvider({ children }: { children: React.ReactNode }) {
  // useLaserEyes is safe here because this component is only mounted when we
  // are wrapped by a real LaserEyesProvider (after client hydration).
  const laserEyesData = useLaserEyes();

  return (
    <LaserEyesContext.Provider value={laserEyesData}>
      {children}
    </LaserEyesContext.Provider>
  );
}

/**
 * Wraps application UI with shared providers for wallet, query client, and background services.
 *
 * Uses an inert wallet context during server-side rendering or before client hydration, then
 * switches to the real `LaserEyesProvider` (configured for MAINNET) after hydration while reusing
 * a centralized `QueryClient`.
 *
 * @param children - React nodes to render inside the provider tree
 * @returns The provider-wrapped React element containing `children`
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // During SSR/first render we provide a lightweight, inert context so that
  // any downstream components relying on useSharedLaserEyes() do not throw.
  if (!isClient) {
    return (
      <LaserEyesContext.Provider value={laserEyesStub as LaserEyesContextType}>
        <QueryClientProvider client={queryClient}>
          <BackgroundProvider>
            {/* children are rendered but **without** wallet functionality */}
            {children}
          </BackgroundProvider>
        </QueryClientProvider>
      </LaserEyesContext.Provider>
    );
  }

  return (
    <LaserEyesProvider config={{ network: MAINNET }}>
      <SharedLaserEyesProvider>
        <QueryClientProvider client={queryClient}>
          <BackgroundProvider>{children}</BackgroundProvider>
        </QueryClientProvider>
      </SharedLaserEyesProvider>
    </LaserEyesProvider>
  );
}
