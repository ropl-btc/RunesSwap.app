import type React from 'react';

export const UNISAT = 'unisat';
export const XVERSE = 'xverse';
export const LEATHER = 'leather';
export const OYL = 'oyl';
export const MAGIC_EDEN = 'magiceden';
export const OKX = 'okx';
export const PHANTOM = 'phantom';
export const WIZZ = 'wizz';
export const ORANGE = 'orange';
export const MAINNET = 'mainnet';

export type ProviderType =
  | typeof UNISAT
  | typeof XVERSE
  | typeof LEATHER
  | typeof OYL
  | typeof MAGIC_EDEN
  | typeof OKX
  | typeof PHANTOM
  | typeof WIZZ
  | typeof ORANGE;

export const LaserEyesProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => children as React.ReactElement;

export const useLaserEyes = () => ({
  connected: false,
  isConnecting: false,
  address: '',
  paymentAddress: '',
  publicKey: '',
  paymentPublicKey: '',
  provider: undefined,
  connect: async () => {},
  disconnect: () => {},
  signPsbt: async () => undefined,
  signMessage: async () => '',
  hasUnisat: false,
});
