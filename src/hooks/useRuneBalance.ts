import { useMemo } from 'react';

import { type RuneBalance as OrdiscanRuneBalance } from '@/types/ordiscan';
import { normalizeRuneName } from '@/utils/runeUtils';

/**
 * Custom hook to find specific rune balance from a list of rune balances
 * Eliminates duplication of balance calculation logic across components
 */
export function useRuneBalance(
  runeName: string | undefined,
  runeBalances: OrdiscanRuneBalance[] | undefined,
): string | null {
  return useMemo(() => {
    if (!runeName || !runeBalances) return null;

    // Ordiscan returns names without spacers, so compare without them
    const formattedRuneName = normalizeRuneName(runeName);
    const found = runeBalances.find((rb) => rb.name === formattedRuneName);

    // Return '0' if not found, assuming 0 balance
    return found ? found.balance : '0';
  }, [runeName, runeBalances]);
}
