import { LaserEyesProvider, MAINNET, useLaserEyes } from '@omnisat/lasereyes';
import type { ReactNode } from 'react';
import { LaserEyesContext } from '@/context/LaserEyesContext';

function SharedWallet({ children }: { children: ReactNode }) {
  return <LaserEyesContext.Provider value={useLaserEyes()}>{children}</LaserEyesContext.Provider>;
}

export default function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <LaserEyesProvider config={{ network: MAINNET }}>
      <SharedWallet>{children}</SharedWallet>
    </LaserEyesProvider>
  );
}
