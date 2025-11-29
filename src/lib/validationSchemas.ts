/**
 * Reusable Zod validation schemas
 * Centralizes common validation patterns across API routes
 */

import Big from 'big.js';
import { validate as validateBitcoinAddress } from 'bitcoin-address-validation';
import { z } from 'zod';

import { sanitizeForBig } from '@/utils/formatters';

// Common field validators
export const validators = {
  // Bitcoin address validation with proper format and checksum verification
  btcAddress: z
    .string()
    .trim()
    .min(1, 'Bitcoin address is required')
    .max(100, 'Bitcoin address too long')
    .refine((address) => {
      try {
        // Validate address format; library infers network from the address
        return validateBitcoinAddress(address);
      } catch {
        return false;
      }
    }, 'Invalid Bitcoin address format'),

  // Rune name validation (allows bullet characters as they're normalized in API)
  runeName: z
    .string()
    .trim()
    .min(1, 'Rune name is required')
    .max(32, 'Rune name too long')
    .regex(
      /^[A-Z•.]+$/,
      'Rune name must be uppercase letters and spacers only',
    ),

  // Amount validation (can be string or number, converted to string)
  // Note: we sanitize localized strings (e.g., "1.234,56") at the API boundary
  // using sanitizeForBig so server routes accept internationalized input.
  // Keep all financial math using Big; do not re-parse amounts in callers.
  amount: z
    .union([z.string().min(1), z.number().positive()])
    .transform((val) => String(val).trim())
    // Sanitize localized strings like "1.234,56" -> "1234.56"
    .transform((val) => sanitizeForBig(val))
    .refine((val) => {
      try {
        return new Big(val).gt(0);
      } catch {
        return false;
      }
    }, 'Invalid amount (must be a positive number)'),

  // BTC amount validation
  // Note: same sanitization as above to accept localized BTC amounts.
  btcAmount: z
    .union([z.string().min(1), z.number().positive()])
    .transform((val) => String(val).trim())
    .transform((val) => sanitizeForBig(val))
    .refine((val) => {
      try {
        return new Big(val).gt(0);
      } catch {
        return false;
      }
    }, 'Invalid BTC amount (must be a positive number)'),

  // Positive integer
  positiveInt: z.number().int().positive(),

  // Optional positive integer
  optionalPositiveInt: z.number().int().positive().optional(),

  // Boolean with default
  booleanWithDefault: (defaultValue: boolean) =>
    z.boolean().default(defaultValue),

  // Non-empty string
  nonEmptyString: z.string().trim().min(1, 'Field cannot be empty'),

  // Optional non-empty string
  optionalNonEmptyString: z.string().trim().min(1).optional(),

  // Decimal validation
  decimals: z.number().int().min(0).max(18),
};

// Common request schemas
export const requestSchemas = {
  // Address-based requests
  addressRequest: z.object({
    address: validators.btcAddress,
  }),

  // Quote request
  quoteRequest: z.object({
    btcAmount: validators.btcAmount,
    runeName: validators.runeName,
    address: validators.btcAddress,
    sell: validators.booleanWithDefault(false),
  }),

  // PSBT creation request
  psbtCreateRequest: z.object({
    btcAmount: validators.btcAmount,
    runeName: validators.runeName,
    address: validators.btcAddress,
    sell: validators.booleanWithDefault(false),
    feeRate: validators.optionalPositiveInt,
  }),

  // PSBT confirmation request
  psbtConfirmRequest: z.object({
    psbt: validators.nonEmptyString,
    address: validators.btcAddress,
  }),

  // Rune info request
  runeInfoRequest: z.object({
    runeName: validators.runeName,
  }),

  // Rune info by ID request
  runeInfoByIdRequest: z.object({
    runeId: z
      .string()
      .regex(
        /^\d+(?::\d+){1,2}$/,
        'Invalid runeId format (expected block:tx or block:tx:index)',
      ),
  }),

  // Search request
  searchRequest: z.object({
    query: validators.nonEmptyString,
    limit: z.number().int().min(1).max(100).default(20),
  }),

  // Portfolio request
  portfolioRequest: z.object({
    address: validators.btcAddress,
    includeMarketData: validators.booleanWithDefault(true),
  }),

  // Liquidium auth request
  liquidiumAuthRequest: z.object({
    address: validators.btcAddress,
    message: validators.nonEmptyString,
    signature: validators.nonEmptyString,
  }),

  // Liquidium quote request
  liquidiumQuoteRequest: z.object({
    collateralRuneName: validators.runeName,
    collateralAmount: validators.amount,
    loanDurationDays: validators.positiveInt,
    ltv: z.number().min(0.1).max(0.9),
  }),
};

// Response schemas for type safety
export const responseSchemas = {
  // Standard API response
  apiResponse: <T>(dataSchema: z.ZodSchema<T>) =>
    z.object({
      success: z.boolean(),
      data: dataSchema.optional(),
      error: z
        .object({
          message: z.string(),
          details: z.string().optional(),
        })
        .optional(),
    }),

  // Paginated response
  paginatedResponse: <T>(itemSchema: z.ZodSchema<T>) =>
    z.object({
      success: z.boolean(),
      data: z
        .object({
          items: z.array(itemSchema),
          total: z.number(),
          page: z.number(),
          limit: z.number(),
          hasMore: z.boolean(),
        })
        .optional(),
      error: z
        .object({
          message: z.string(),
          details: z.string().optional(),
        })
        .optional(),
    }),

  // Quote response
  quoteResponse: z.object({
    success: z.boolean(),
    data: z
      .object({
        price: z.string(),
        totalPrice: z.string(),
        formattedAmount: z.string(),
        feeRate: z.number(),
        estimatedTxSize: z.number(),
        slippage: z.number().optional(),
      })
      .optional(),
  }),
};

// Helper function to create paginated query schema
export function createPaginatedQuerySchema(
  additionalFields: z.ZodRawShape = {},
) {
  const baseSchema = {
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc'),
  };

  return z.object({
    ...baseSchema,
    ...additionalFields,
  });
}

// Helper to validate environment variables
export const envSchema = z.object({
  SATS_TERMINAL_API_KEY: z.string().min(1),
  ORDISCAN_API_KEY: z.string().min(1),
  RUNES_FLOOR_API_KEY: z.string().min(1),
  LIQUIDIUM_API_KEY: z.string().min(1),
  SATS_TERMINAL_FORCED_FEE_RATE: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!Number.isNaN(Number(val)) && Number(val) > 0),
      'SATS_TERMINAL_FORCED_FEE_RATE must be a positive number when provided',
    ),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  // Optional mock address to enable quotes before wallet connection
  NEXT_PUBLIC_QUOTE_MOCK_ADDRESS: z
    .string()
    .optional()
    .refine(
      (val) => !val || validateBitcoinAddress(val),
      'NEXT_PUBLIC_QUOTE_MOCK_ADDRESS must be a valid Bitcoin address when provided',
    ),
});

// Export commonly used composed schemas
export const commonSchemas = {
  // Basic rune data
  runeData: z.object({
    name: validators.runeName,
    spacedName: validators.optionalNonEmptyString,
    symbol: validators.optionalNonEmptyString,
    decimals: validators.decimals,
    totalSupply: validators.optionalNonEmptyString,
    mintedSupply: validators.optionalNonEmptyString,
  }),

  // Market data
  marketData: z.object({
    floorPriceSats: validators.optionalPositiveInt,
    listedCount: validators.optionalPositiveInt,
    holders: validators.optionalPositiveInt,
    marketCapSats: validators.optionalNonEmptyString,
  }),

  // Wallet connection
  walletConnection: z.object({
    address: validators.btcAddress,
    publicKey: validators.nonEmptyString,
    provider: z.enum(['unisat', 'xverse', 'leather', 'phantom', 'okx']),
  }),
};
