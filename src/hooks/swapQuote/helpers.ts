const DEFAULT_READONLY_ADDRESS = '34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo';

/**
 * Resolves address used for quote calls when wallet is not connected.
 */
export function getEffectiveQuoteAddress(address: string | null): string {
  const mockAddress = import.meta.env.VITE_QUOTE_MOCK_ADDRESS;
  return address || (mockAddress ? String(mockAddress) : undefined) || DEFAULT_READONLY_ADDRESS;
}

/**
 * Builds a deterministic key for quote request deduplication.
 */
export function buildQuoteRequestKey(
  debouncedInputAmount: number,
  assetInId: string,
  assetOutId: string,
  address: string | null,
): string {
  const mockAddress = import.meta.env.VITE_QUOTE_MOCK_ADDRESS;
  const addressKey = address || (mockAddress ? 'mock' : 'default');
  return `${debouncedInputAmount}-${assetInId}-${assetOutId}-${addressKey}`;
}

/**
 * Maps raw quote errors to user-facing messages.
 */
export function normalizeQuoteErrorMessage(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : 'Failed to fetch quote';
  const normalized = errorMessage.toLowerCase();

  if (normalized.includes('liquidity')) {
    return 'No liquidity available for this trade. Try a different amount or rune.';
  }

  if (
    normalized.includes('no orders available') ||
    normalized.includes('no valid orders') ||
    normalized.includes('no marketplace found') ||
    normalized.includes('404')
  ) {
    return 'No orders available for this trade. Try a different amount or rune.';
  }

  if (normalized.includes('500') || normalized.includes('internal server error')) {
    return 'Server error: The quote service is temporarily unavailable. Please try again later.';
  }

  if (normalized.includes('timeout') || normalized.includes('network')) {
    return 'Network error: Please check your connection and try again.';
  }

  return errorMessage;
}
