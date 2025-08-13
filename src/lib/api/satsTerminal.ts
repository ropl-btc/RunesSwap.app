import {
  type ConfirmPSBTParams,
  type GetPSBTParams,
  type QuoteResponse,
} from 'satsterminal-sdk';
import type { Rune } from '@/types/satsTerminal';
import { get, post } from '../fetchWrapper';
import { logFetchError } from '../logger';
import { handleApiResponse } from './utils';

export const fetchRunesFromApi = async (query: string): Promise<Rune[]> => {
  const trimmed = query.trim();
  // Guard: avoid spamming search for very short queries
  if (trimmed.length < 2) return [];

  try {
    const { data } = await get<{ success: boolean; data: Rune[] }>(
      `/api/sats-terminal/search?query=${encodeURIComponent(trimmed)}`,
    );

    if (!data.success) {
      throw new Error('Search failed');
    }

    return handleApiResponse<Rune[]>(data, true);
  } catch (error) {
    logFetchError(
      `/api/sats-terminal/search?query=${encodeURIComponent(trimmed)}`,
      error,
    );
    throw new Error('Failed to search runes');
  }
};

export const fetchQuoteFromApi = async (
  params: Record<string, unknown>,
): Promise<QuoteResponse> => {
  try {
    const { data } = await post<{ success: boolean; data: QuoteResponse }>(
      `/api/sats-terminal/quote`,
      params,
    );

    if (!data.success) {
      throw new Error('Quote request failed');
    }

    return handleApiResponse<QuoteResponse>(data, false);
  } catch (error) {
    logFetchError(`/api/sats-terminal/quote`, error);
    throw new Error('Failed to fetch quote');
  }
};

export const getPsbtFromApi = async (
  params: GetPSBTParams,
): Promise<Record<string, unknown>> => {
  try {
    const { data } = await post<{
      success: boolean;
      data: Record<string, unknown>;
    }>(`/api/sats-terminal/psbt/create`, params);

    if (!data.success) {
      throw new Error('PSBT creation failed');
    }

    return data.data;
  } catch (error) {
    logFetchError(`/api/sats-terminal/psbt/create`, error);
    throw new Error('Failed to create PSBT');
  }
};

export const confirmPsbtViaApi = async (
  params: ConfirmPSBTParams,
): Promise<Record<string, unknown>> => {
  try {
    const { data } = await post<{
      success: boolean;
      data: Record<string, unknown>;
    }>(`/api/sats-terminal/psbt/confirm`, params);

    if (!data.success) {
      throw new Error('PSBT confirmation failed');
    }

    return data.data;
  } catch (error) {
    logFetchError(`/api/sats-terminal/psbt/confirm`, error);
    throw new Error('Failed to confirm PSBT');
  }
};
