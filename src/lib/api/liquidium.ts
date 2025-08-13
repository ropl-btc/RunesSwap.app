import type {
  BorrowRangeResponse,
  LiquidiumBorrowQuoteResponse,
  LiquidiumPrepareBorrowResponse,
  LiquidiumSubmitBorrowResponse,
  RepayLiquidiumLoanResponse,
  SubmitRepayResponse,
} from '@/types/liquidium';
import { get, post } from '../fetchWrapper';
import { logFetchError } from '../logger';

export type {
  BorrowRangeResponse,
  LiquidiumBorrowQuoteOffer,
  LiquidiumBorrowQuoteResponse,
  LiquidiumPrepareBorrowResponse,
  LiquidiumSubmitBorrowResponse,
  RepayLiquidiumLoanResponse,
  SubmitRepayResponse,
} from '@/types/liquidium';

import { getErrorMessageFromData } from './utils';

export const repayLiquidiumLoan = async (
  loanId: string,
  address: string,
): Promise<RepayLiquidiumLoanResponse> => {
  try {
    const { data } = await post<RepayLiquidiumLoanResponse>(
      '/api/liquidium/repay',
      { loanId, address },
    );

    if (!data.success) {
      throw new Error('Failed to repay loan');
    }

    // Map Liquidium API fields to expected frontend fields without mutating raw response
    if (data?.data) {
      // Create a new transformed data object instead of mutating the original
      const transformedData = {
        success: data.success,
        data: {
          psbt: data.data.base64_psbt || data.data.psbt,
          repaymentAmountSats: data.data.repayment_amount_sats,
          loanId: data.data.offer_id || loanId,
          ...data.data, // Include any other fields from the original data
        },
        error: data.error,
      };
      return transformedData;
    }
    return data;
  } catch (error) {
    logFetchError('/api/liquidium/repay', error);
    const message = getErrorMessageFromData(error, 'Failed to repay loan');
    throw new Error(message);
  }
};

export const submitRepayPsbt = async (
  loanId: string,
  signedPsbt: string,
  address: string,
): Promise<SubmitRepayResponse> => {
  try {
    const { data } = await post<SubmitRepayResponse>('/api/liquidium/repay', {
      loanId,
      signedPsbt,
      address,
    });

    if (!data.success) {
      throw new Error('Failed to submit repayment');
    }

    return data;
  } catch (error) {
    logFetchError('/api/liquidium/repay', error);
    const message = getErrorMessageFromData(
      error,
      'Failed to submit repayment',
    );
    throw new Error(message);
  }
};

// --- New Liquidium Borrow Types ---
// Response from GET /api/liquidium/borrow/quotes
// --- End New Liquidium Borrow Types ---

// --- New API Client Functions for Borrow ---

// Fetch Borrow Quotes from API
export const fetchBorrowQuotesFromApi = async (
  runeId: string,
  runeAmount: string, // Raw amount as string
  address: string,
): Promise<LiquidiumBorrowQuoteResponse> => {
  // Ensure we're using the correct rune ID format
  // If we have a rune name like "LIQUIDIUMTOKEN", we'll let the backend handle the lookup

  const url = `/api/liquidium/borrow/quotes?runeId=${encodeURIComponent(runeId)}&runeAmount=${runeAmount}&address=${encodeURIComponent(address)}`;

  try {
    const { data } = await get<LiquidiumBorrowQuoteResponse>(url);

    if (!data.success) {
      throw new Error('Failed to fetch borrow quotes');
    }

    // Handle both response formats:
    // 1. API might return { success: true, data: { runeDetails: {...} } }
    // 2. Or directly { success: true, runeDetails: {...} }
    if (data.data?.runeDetails && !data.runeDetails) {
      data.runeDetails = data.data.runeDetails;
    }

    return data as LiquidiumBorrowQuoteResponse;
  } catch (error) {
    logFetchError(url, error);
    throw error; // Re-throw to let the component handle it
  }
};

// Prepare Liquidium Borrow Transaction
export const prepareLiquidiumBorrow = async (params: {
  instant_offer_id: string;
  fee_rate: number;
  token_amount: string; // Raw amount as string
  borrower_payment_address: string;
  borrower_payment_pubkey: string;
  borrower_ordinal_address: string;
  borrower_ordinal_pubkey: string;
  address: string; // User's address for JWT lookup
}): Promise<LiquidiumPrepareBorrowResponse> => {
  try {
    const { data } = await post<LiquidiumPrepareBorrowResponse>(
      '/api/liquidium/borrow/prepare',
      params,
    );

    if (!data.success) {
      throw new Error('Failed to prepare borrow');
    }

    return data as LiquidiumPrepareBorrowResponse;
  } catch (error) {
    logFetchError('/api/liquidium/borrow/prepare', error);
    const message = getErrorMessageFromData(error, 'Failed to prepare borrow');
    throw new Error(message);
  }
};

// Submit Liquidium Borrow Transaction
export const submitLiquidiumBorrow = async (params: {
  signed_psbt_base_64: string;
  prepare_offer_id: string;
  address: string; // User's address for JWT lookup
}): Promise<LiquidiumSubmitBorrowResponse> => {
  try {
    const { data } = await post<LiquidiumSubmitBorrowResponse>(
      '/api/liquidium/borrow/submit',
      params,
    );

    if (!data.success) {
      throw new Error('Failed to submit borrow');
    }

    return data as LiquidiumSubmitBorrowResponse;
  } catch (error: unknown) {
    // Special handling for JSON parse errors with successful HTTP status
    if (
      error instanceof Error &&
      error.message.includes('JSON') &&
      !('status' in error)
    ) {
      return {
        success: true,
        data: {
          loan_transaction_id: params.prepare_offer_id,
        },
      };
    }

    logFetchError('/api/liquidium/borrow/submit', error);
    const errorMessage = getErrorMessageFromData(
      error,
      'Failed to submit borrow',
    );
    throw new Error(errorMessage);
  }
};

// Fetch Borrow Ranges from API
export const fetchBorrowRangesFromApi = async (
  runeId: string,
  address: string,
): Promise<BorrowRangeResponse> => {
  try {
    const url = `/api/liquidium/borrow/ranges?runeId=${encodeURIComponent(runeId)}&address=${encodeURIComponent(address)}`;
    const { data } = await get<BorrowRangeResponse>(url);

    if (!data.success) {
      throw new Error('Failed to fetch borrow ranges');
    }

    return data as BorrowRangeResponse;
  } catch (error) {
    logFetchError(`/api/liquidium/borrow/ranges?runeId=${runeId}`, error);
    throw error;
  }
};
