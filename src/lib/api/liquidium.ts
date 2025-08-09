import type {
  BorrowRangeResponse,
  LiquidiumBorrowQuoteResponse,
  LiquidiumPrepareBorrowResponse,
  LiquidiumSubmitBorrowResponse,
  RepayLiquidiumLoanResponse,
  SubmitRepayResponse,
} from '@/types/liquidium';

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
  const response = await fetch('/api/liquidium/repay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loanId, address }),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Failed to parse repay response');
  }
  if (!response.ok) {
    const message = getErrorMessageFromData(
      data,
      `Failed to repay loan: ${response.statusText}`,
    );
    throw new Error(message);
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
};


export const submitRepayPsbt = async (
  loanId: string,
  signedPsbt: string,
  address: string,
): Promise<SubmitRepayResponse> => {
  const response = await fetch('/api/liquidium/repay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loanId, signedPsbt, address }),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Failed to parse repay submission response');
  }
  if (!response.ok) {
    const message = getErrorMessageFromData(
      data,
      `Failed to submit repayment: ${response.statusText}`,
    );
    throw new Error(message);
  }
  return data;
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
    const response = await fetch(url);
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Failed to parse borrow quotes for ${runeId}`);
    }

    if (!response.ok) {
      const errorMessage = getErrorMessageFromData(
        data,
        `Failed to fetch borrow quotes: ${response.statusText}`,
      );
      throw new Error(errorMessage);
    }

    // Handle both response formats:
    // 1. API might return { success: true, data: { runeDetails: {...} } }
    // 2. Or directly { success: true, runeDetails: {...} }
    if (data.data?.runeDetails && !data.runeDetails) {
      data.runeDetails = data.data.runeDetails;
    }

    return data as LiquidiumBorrowQuoteResponse;
  } catch (error) {
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
  const response = await fetch('/api/liquidium/borrow/prepare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('Failed to parse prepare borrow response');
  }
  if (!response.ok) {
    const message = getErrorMessageFromData(
      data,
      `Failed to prepare borrow: ${response.statusText}`,
    );
    throw new Error(message);
  }
  return data as LiquidiumPrepareBorrowResponse;
};

// Submit Liquidium Borrow Transaction
export const submitLiquidiumBorrow = async (params: {
  signed_psbt_base_64: string;
  prepare_offer_id: string;
  address: string; // User's address for JWT lookup
}): Promise<LiquidiumSubmitBorrowResponse> => {
  const response = await fetch('/api/liquidium/borrow/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    // If the response was OK but we couldn't parse JSON, create a synthetic success response
    if (response.ok) {
      return {
        success: true,
        data: {
          loan_transaction_id: params.prepare_offer_id,
        },
      };
    }

    throw new Error('Failed to parse submit borrow response');
  }

  if (!response.ok) {
    const errorMessage = getErrorMessageFromData(
      data,
      `Failed to submit borrow: ${response.statusText}`,
    );
    throw new Error(errorMessage);
  }

  return data as LiquidiumSubmitBorrowResponse;
};

// Fetch Borrow Ranges from API
export const fetchBorrowRangesFromApi = async (
  runeId: string,
  address: string,
): Promise<BorrowRangeResponse> => {
  try {
    const url = `/api/liquidium/borrow/ranges?runeId=${encodeURIComponent(runeId)}&address=${encodeURIComponent(address)}`;

    const response = await fetch(url);

    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error(`Failed to parse borrow ranges for ${runeId}`);
    }

    if (!response.ok) {
      const errorMessage = getErrorMessageFromData(
        data,
        `Failed to fetch borrow ranges: ${response.statusText}`,
      );
      throw new Error(errorMessage);
    }

    return data as BorrowRangeResponse;
  } catch (error) {
    throw error;
  }
};
