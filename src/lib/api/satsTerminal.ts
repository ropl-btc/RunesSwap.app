import {
  type ConfirmPSBTParams,
  type GetPSBTParams,
  type QuoteResponse,
} from 'satsterminal-sdk';

import { apiGet, apiPost } from '@/lib/api/createApiClient';
import type { Rune } from '@/types/satsTerminal';

export const fetchRunesFromApi = async (query: string): Promise<Rune[]> => {
  const trimmed = query.trim();
  // Guard: avoid spamming search for very short queries
  if (trimmed.length < 2) return [];

  const res = await apiGet<unknown>('/api/sats-terminal/search', {
    query: trimmed,
  });
  return Array.isArray(res) ? (res as Rune[]) : [];
};

export const fetchQuoteFromApi = async (
  params: Record<string, unknown>,
): Promise<QuoteResponse> =>
  apiPost<QuoteResponse>('/api/sats-terminal/quote', params);

export const getPsbtFromApi = async (
  params: GetPSBTParams,
): Promise<Record<string, unknown>> =>
  apiPost<Record<string, unknown>>('/api/sats-terminal/psbt/create', params);

export const confirmPsbtViaApi = async (
  params: ConfirmPSBTParams,
): Promise<Record<string, unknown>> =>
  apiPost<Record<string, unknown>>('/api/sats-terminal/psbt/confirm', params);
