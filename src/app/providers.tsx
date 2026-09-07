import type { LaserEyesContextType } from '@omnisat/lasereyes';
import { QueryClientProvider } from '@tanstack/react-query';
import { ClientOnly } from '@tanstack/react-router';
import { createClientOnlyFn } from '@tanstack/react-start';
import type React from 'react';
import { lazy, Suspense } from 'react';

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

const WalletProvider = lazy(createClientOnlyFn(() => import('@/components/wallet/WalletProvider')));

export function Providers({ children }: { children: React.ReactNode }) {
  const fallback = (
    <LaserEyesContext.Provider value={laserEyesStub as LaserEyesContextType}>
      {children}
    </LaserEyesContext.Provider>
  );
  return (
    <QueryClientProvider client={queryClient}>
      <BackgroundProvider>
        <ClientOnly fallback={fallback}>
          <Suspense fallback={fallback}>
            <WalletProvider>{children}</WalletProvider>
          </Suspense>
        </ClientOnly>
      </BackgroundProvider>
    </QueryClientProvider>
  );
}
