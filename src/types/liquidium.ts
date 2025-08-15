// Liquidium API Types

// --- Request Bodies ---
export interface LiquidiumAuthPrepareRequestBody {
  payment_address: string; // Example: "bc1q..."
  ordinals_address: string; // Example: "bc1p..."
}

export interface LiquidiumAuthSubmitRequestBody {
  ordinals: {
    address: string; // Example: "bc1p..."
    signature: string; // Base64 encoded signature from wallet
    nonce: string; // Nonce received from /auth/prepare
  };
  payment?: {
    address: string; // Example: "bc1q..."
    signature: string; // Base64 encoded signature from wallet
    nonce: string; // Nonce received from /auth/prepare
  };
}

// --- Success Response Payloads ---
export interface LiquidiumAuthPrepareSuccessResponse {
  payment?: { address: string; message: string; nonce: string };
  ordinals: { address: string; message: string; nonce: string };
}

export interface LiquidiumAuthSubmitSuccessResponse {
  user_jwt: string; // The JWT token for subsequent requests
  is_first_login: boolean;
  vault_address?: string;
}

export interface LiquidiumPortfolioSuccessResponse {
  offers: LiquidiumLoanOffer[];
}

// --- Core Data Structures ---
export interface LiquidiumLoanOffer {
  id: string; // UUID Example: "123e4567-e89b-12d3-a456-426614174000"
  loan_details: LiquidiumLoanDetails;
  collateral_details: LiquidiumCollateralDetails;
}

// Explicit Enum for Loan State
export type LoanStateEnum =
  | 'OFFERED'
  | 'ACCEPTED'
  | 'ACTIVATING'
  | 'ACTIVE'
  | 'REPAYING'
  | 'REPAID'
  | 'DEFAULTED'
  | 'CLAIMING'
  | 'CLAIMED'
  | 'LIQUIDATING'
  | 'LIQUIDATED'
  | 'CANCELLED'
  | 'FAILED';

export interface LiquidiumLoanDetails {
  state: LoanStateEnum; // Example: "ACTIVE"
  principal_amount_sats: number; // Example: 50000000
  loan_term_days: number; // Example: 30
  loan_term_end_date: string; // ISO 8601 Example: "2025-03-27T14:30:00Z"
  start_date: string; // ISO 8601 Example: "2025-02-25T14:30:00Z"
  escrow_address: string; // Example: "bc1qc7slxfxkknqcq2jevvvkdgvrt8080852dfjewde450x..."
  discount: {
    discount_rate: number; // Example: 0.15
    discount_sats: number; // Example: 2000
  };
  total_repayment_sats?: number; // Example: 51000000 (Calculated or from API)
}

export type CollateralTypeEnum = 'Rune' | 'Brc20' | 'Inscription'; // Example: "Rune"

export interface LiquidiumCollateralDetails {
  rune_id: string; // Example: "840010:907"
  collateral_type: CollateralTypeEnum;
  rune_divisibility: number; // Example: 8
  rune_amount: number; // Example: 100005 (Display amount)
}

// --- Client/Route Response Types (moved from api/liquidium.ts) ---

export interface RepayLiquidiumLoanResponse {
  success: boolean;
  data?: {
    psbt: string;
    repaymentAmountSats: number;
    loanId: string;
  };
  error?: string;
}

export interface SubmitRepayResponse {
  success: boolean;
  data?: {
    repayment_transaction_id: string;
  };
  error?: string;
}

export interface LiquidiumBorrowQuoteOffer {
  offer_id: string;
  fungible_amount: number;
  loan_term_days: number | null;
  ltv_rate: number;
  loan_breakdown: {
    total_repayment_sats: number;
    principal_sats: number;
    interest_sats: number;
    loan_due_by_date: string;
    activation_fee_sats: number;
    discount: {
      discount_rate: number;
      discount_sats: number;
    };
  };
}

export interface LiquidiumBorrowQuoteResponse {
  success: boolean;
  runeDetails?: {
    rune_id: string;
    slug: string;
    floor_price_sats: number;
    floor_price_last_updated_at: string;
    common_offer_data: {
      interest_rate: number;
      rune_divisibility: number;
    };
    valid_ranges: {
      rune_amount: { ranges: { min: string; max: string }[] };
      loan_term_days: number[];
    };
    offers: LiquidiumBorrowQuoteOffer[];
  };
  data?: {
    runeDetails: {
      rune_id: string;
      slug: string;
      floor_price_sats: number;
      floor_price_last_updated_at: string;
      common_offer_data: {
        interest_rate: number;
        rune_divisibility: number;
      };
      valid_ranges: {
        rune_amount: { ranges: { min: string; max: string }[] };
        loan_term_days: number[];
      };
      offers: LiquidiumBorrowQuoteOffer[];
    };
  };
  error?: { message: string; details?: string };
}

export interface LiquidiumPrepareBorrowResponse {
  success: boolean;
  data?: {
    prepare_offer_id: string;
    base64_psbt: string;
    sides: {
      index: number;
      address: string | null;
      sighash: number | null;
      disable_tweak_signer: boolean;
    }[];
  };
  error?: string;
}

export interface LiquidiumSubmitBorrowResponse {
  success: boolean;
  data?: {
    loan_transaction_id: string;
  };
  error?: string;
}

export interface BorrowRangeResponse {
  success: boolean;
  data?: {
    runeId: string;
    minAmount: string;
    maxAmount: string;
    loanTermDays?: number[];
    cached: boolean;
    updatedAt: string;
    noOffersAvailable?: boolean;
  };
  error?: string;
}
