import { useEffect, useState } from 'react';

import { get, post } from '@/lib/fetchWrapper';
import { logFetchError } from '@/lib/logger';
import type { LiquidiumLoanOffer } from '@/types/liquidium';

interface Args {
  address: string | null;
  paymentAddress: string | null;
  signMessage:
    | ((message: string, address: string) => Promise<string>)
    | undefined;
}

export function useLiquidiumAuth({
  address,
  paymentAddress,
  signMessage,
}: Args) {
  const [liquidiumAuthenticated, setLiquidiumAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [loans, setLoans] = useState<LiquidiumLoanOffer[]>([]);
  const [isLoadingLiquidium, setIsLoadingLiquidium] = useState(false);
  const [liquidiumError, setLiquidiumError] = useState<string | null>(null);

  const fetchLiquidiumLoans = async () => {
    setIsLoadingLiquidium(true);
    setLiquidiumError(null);
    try {
      const { data } = await get<{
        success: boolean;
        data: { loans: LiquidiumLoanOffer[] };
      }>(
        `/api/liquidium/portfolio?address=${encodeURIComponent(address || '')}`,
      );

      if (!data.success) {
        setLiquidiumError('Failed to fetch loans');
        setLoans([]);
        return;
      }

      const apiLoans = (data.data?.loans as LiquidiumLoanOffer[]) ?? [];
      setLoans(apiLoans);
    } catch (err: unknown) {
      logFetchError(`/api/liquidium/portfolio?address=${address}`, err);
      if (err instanceof Error) {
        setLiquidiumError(err.message || 'Unknown error');
        setLoans([]);
      } else {
        setLiquidiumError('Unknown error');
        setLoans([]);
      }
    } finally {
      setIsLoadingLiquidium(false);
    }
  };

  const handleLiquidiumAuth = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      if (!address || !paymentAddress) {
        setAuthError('Wallet connection required for authentication');
        setIsAuthenticating(false);
        return;
      }
      if (!signMessage) {
        setAuthError('Your wallet does not support message signing');
        setIsAuthenticating(false);
        return;
      }
      const { data: challengeData } = await get<{
        success: boolean;
        data: {
          ordinals: { message: string; nonce: string };
          payment?: { message: string; nonce: string };
        };
      }>(
        `/api/liquidium/challenge?ordinalsAddress=${encodeURIComponent(
          address,
        )}&paymentAddress=${encodeURIComponent(paymentAddress)}`,
      );

      if (!challengeData.success) {
        setAuthError('Failed to get challenge');
        setIsAuthenticating(false);
        return;
      }

      const { ordinals, payment } = challengeData.data;
      const ordinalsSignature = await signMessage(ordinals.message, address);
      let paymentSignature: string | undefined;
      if (payment) {
        paymentSignature = await signMessage(payment.message, paymentAddress);
      }
      const { data: authData } = await post<{ success: boolean }>(
        '/api/liquidium/auth',
        {
          ordinalsAddress: address,
          paymentAddress,
          ordinalsSignature,
          paymentSignature,
          ordinalsNonce: ordinals.nonce,
          paymentNonce: payment?.nonce,
        },
      );

      if (!authData.success) {
        setAuthError('Authentication failed');
        setIsAuthenticating(false);
        return;
      }
      setLiquidiumAuthenticated(true);
      fetchLiquidiumLoans();
    } catch (err: unknown) {
      logFetchError('/api/liquidium/auth', err);
      setAuthError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    if (!address) return;
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      try {
        const { data, status } = await get<{
          success: boolean;
          data: { loans: LiquidiumLoanOffer[] };
        }>(`/api/liquidium/portfolio?address=${encodeURIComponent(address)}`);

        if (status === 200 && data.success) {
          setLiquidiumAuthenticated(true);
          const apiLoans = (data.data?.loans as LiquidiumLoanOffer[]) ?? [];
          setLoans(apiLoans);
        } else if (status === 401) {
          setLiquidiumAuthenticated(false);
          setLoans([]);
        } else {
          setLiquidiumAuthenticated(false);
          setLoans([]);
        }
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          'status' in err &&
          (err as { status: number }).status === 401
        ) {
          setLiquidiumAuthenticated(false);
          setLoans([]);
        } else {
          logFetchError(`/api/liquidium/portfolio?address=${address}`, err);
          setLiquidiumAuthenticated(false);
          setLoans([]);
        }
      } finally {
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [address]);

  return {
    loans,
    isCheckingAuth,
    liquidiumAuthenticated,
    isAuthenticating,
    authError,
    isLoadingLiquidium,
    liquidiumError,
    handleLiquidiumAuth,
    fetchLiquidiumLoans,
  };
}
