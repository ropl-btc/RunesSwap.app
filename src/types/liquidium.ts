// Liquidium API Types

// --- Request Bodies ---
/**
 * Request body for preparing Liquidium authentication.
 */
export interface LiquidiumAuthPrepareRequestBody {
  /** Payment address (e.g., "bc1q..."). */
  payment_address: string;
  /** Ordinals address (e.g., "bc1p..."). */
  ordinals_address: string;
}

/**
 * Request body for submitting Liquidium authentication.
 */
export interface LiquidiumAuthSubmitRequestBody {
  /** Ordinals wallet details. */
  ordinals: {
    /** Ordinals address. */
    address: string;
    /** Base64 encoded signature from wallet. */
    signature: string;
    /** Nonce received from /auth/prepare. */
    nonce: string;
  };
  /** Payment wallet details (optional). */
  payment?: {
    /** Payment address. */
    address: string;
    /** Base64 encoded signature from wallet. */
    signature: string;
    /** Nonce received from /auth/prepare. */
    nonce: string;
  };
}

// --- Success Response Payloads ---
/**
 * Response from Liquidium auth prepare endpoint.
 */
export interface LiquidiumAuthPrepareSuccessResponse {
  payment?: { address: string; message: string; nonce: string };
  ordinals: { address: string; message: string; nonce: string };
}

/**
 * Response from Liquidium auth submit endpoint.
 */
export interface LiquidiumAuthSubmitSuccessResponse {
  /** The JWT token for subsequent requests. */
  user_jwt: string;
  /** Whether this is the first login for the user. */
  is_first_login: boolean;
  /** Vault address if available. */
  vault_address?: string;
}

export interface LiquidiumPortfolioSuccessResponse {
  offers: LiquidiumLoanOffer[];
}

// --- Core Data Structures ---
/**
 * Represents a loan offer from Liquidium.
 */
export interface LiquidiumLoanOffer {
  /** Unique UUID for the offer. */
  id: string;
  /** Details of the loan terms. */
  loan_details: LiquidiumLoanDetails;
  /** Details of the collateral required. */
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

/**
 * Detailed terms of a Liquidium loan.
 */
export interface LiquidiumLoanDetails {
  /** Current state of the loan. */
  state: LoanStateEnum;
  /** Principal amount in Satoshis. */
  principal_amount_sats: number;
  /** Duration of the loan in days. */
  loan_term_days: number;
  /** ISO 8601 timestamp for loan end date. */
  loan_term_end_date: string;
  /** ISO 8601 timestamp for loan start date. */
  start_date: string;
  /** Escrow address for the loan. */
  escrow_address: string;
  /** Discount details. */
  discount: {
    /** Discount rate (e.g., 0.15 for 15%). */
    discount_rate: number;
    /** Discount amount in Satoshis. */
    discount_sats: number;
  };
  /** Total repayment amount in Satoshis. */
  total_repayment_sats?: number;
}

export type CollateralTypeEnum = 'Rune' | 'Brc20' | 'Inscription'; // Example: "Rune"

/**
 * Details of the collateral for a Liquidium loan.
 */
export interface LiquidiumCollateralDetails {
  /** Rune ID (e.g., "840010:907"). */
  rune_id: string;
  /** Type of collateral (Rune, Brc20, Inscription). */
  collateral_type: CollateralTypeEnum;
  /** Divisibility of the Rune. */
  rune_divisibility: number;
  /** Amount of the Rune (display amount). */
  rune_amount: number;
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
