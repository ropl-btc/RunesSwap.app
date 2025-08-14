import {
  type ConfirmPSBTParams,
  type GetPSBTParams,
  type QuoteResponse,
} from 'satsterminal-sdk';
import type { Rune } from '@/types/satsTerminal';
import { apiGet, apiPost } from './createApiClient';

export const fetchRunesFromApi = async (query: string): Promise<Rune[]> => {
  const trimmed = query.trim();
  // Guard: avoid spamming search for very short queries
  if (trimmed.length < 2) return [];

  return apiGet<Rune[]>('/api/sats-terminal/search', { query: trimmed });
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
