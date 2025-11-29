'use client';

import type { ProviderType } from '@omnisat/lasereyes'; // Import ProviderType
import { createContext, useContext } from 'react';
// REMOVED: import type { LaserEyesData } from '@omnisat/lasereyes'; // Assuming LaserEyes exports a type for its hook return value

// Define the shape of the context data based on current usage
/**
 * Interface defining the shape of the LaserEyes context data.
 * Wraps the LaserEyes library functionality for use within the application.
 */
interface ILaserEyesContext {
  /** Whether a wallet is connected. */
  connected: boolean;
  /** Whether a connection attempt is in progress. */
  isConnecting: boolean;
  /** The connected wallet address. */
  address: string | null;
  /** The connected payment address. */
  paymentAddress: string | null;
  /** The public key of the connected wallet. */
  publicKey: string | null;
  /** The payment public key. */
  paymentPublicKey: string | null;
  /** The name of the connected provider. */
  provider?: string; // Keep this as string for display?
  /** Function to connect to a specific provider. */
  connect: (providerName: ProviderType) => Promise<void>; // Use ProviderType
  /** Function to disconnect the wallet. */
  disconnect: () => void;
  /** Function to sign a PSBT. */
  signPsbt: (
    tx: string,
    finalize?: boolean,
    broadcast?: boolean,
  ) => Promise<
    | {
        signedPsbtHex: string | undefined;
        signedPsbtBase64: string | undefined;
        txId?: string;
      }
    | undefined
  >;
  /** Function to sign a message (used for Liquidium auth). */
  signMessage?: (message: string, address?: string) => Promise<string>;
  /** Whether Unisat wallet is detected. */
  hasUnisat?: boolean;
  // Add other properties/methods from LaserEyesData if needed later
}

// Create the context with a default value (or null/undefined)
const LaserEyesContext = createContext<ILaserEyesContext | null>(null);

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
