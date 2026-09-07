import { getLiquidiumJwt } from '@/lib/liquidiumAuth';
import { logger } from '@/lib/logger';
import { enforceRateLimit } from '@/lib/rateLimit';
import { supabase } from '@/lib/supabase';
import { safeArrayFirst } from '@/utils/typeGuards';

const LIQUIDIUM_TOKEN_NAME = 'LIQUIDIUMTOKEN';

/**
 * Applies shared Liquidium API route rate limiting.
 */
export function enforceLiquidiumRateLimit(request: Request, key: string) {
  return enforceRateLimit(request, {
    key: `liquidium:${key}`,
    limit: 30,
    windowMs: 60_000,
  });
}

/**
 * Resolves a rune identifier to canonical `block:id` format expected by Liquidium.
 */
export async function resolveLiquidiumRuneId(inputRuneId: string): Promise<string> {
  if (inputRuneId.includes(':')) return inputRuneId;

  const { data: runeDataByName, error: runeErrorByName } = await supabase
    .from('runes')
    .select('id')
    .ilike('name', inputRuneId)
    .limit(1);

  if (runeErrorByName) {
    logger.warn('Supabase lookup failed (rune by name)', {
      runeId: inputRuneId,
      error: runeErrorByName,
    });
  } else {
    const byName = safeArrayFirst(runeDataByName);
    if (byName?.id) return byName.id;
  }

  const { data: runeDataById, error: runeErrorById } = await supabase
    .from('runes')
    .select('id')
    .ilike('id', `${inputRuneId}:%`)
    .limit(1);

  if (runeErrorById) {
    logger.warn('Supabase lookup failed (rune by id prefix)', {
      runeId: inputRuneId,
      error: runeErrorById,
    });
  } else {
    const byId = safeArrayFirst(runeDataById);
    if (byId?.id) return byId.id;
  }

  if (inputRuneId.toLowerCase() === LIQUIDIUM_TOKEN_NAME.toLowerCase()) {
    const { data: liquidiumData, error: liquidiumError } = await supabase
      .from('runes')
      .select('id')
      .eq('name', LIQUIDIUM_TOKEN_NAME)
      .limit(1);

    if (liquidiumError) {
      logger.warn('Supabase lookup failed (LIQUIDIUMTOKEN)', { error: liquidiumError });
    } else {
      const liquidium = safeArrayFirst(liquidiumData);
      if (liquidium?.id) return liquidium.id;
    }
  }

  return inputRuneId;
}

/**
 * Loads a Liquidium JWT or returns an API error response.
 */
export async function requireLiquidiumJwt(
  address: string,
): Promise<{ jwt: string } | { errorResponse: Response }> {
  const jwt = await getLiquidiumJwt(address);
  if (typeof jwt !== 'string') {
    return { errorResponse: jwt };
  }
  return { jwt };
}
