import { SatsTerminal } from '@satsterminal-sdk/swaps';
import { Ordiscan } from 'ordiscan';

import { logger } from '@/lib/logger';

export function getOrdiscanClient(): Ordiscan {
  const apiKey = process.env.ORDISCAN_API_KEY;

  if (!apiKey) {
    logger.error(
      'Server configuration error: Missing Ordiscan API Key',
      { service: 'ordiscan' },
      'CONFIG',
    );
    throw new Error('Server configuration error: Missing Ordiscan API Key');
  }

  // Note: The Ordiscan constructor expects the API key directly.
  return new Ordiscan(apiKey);
}

let cachedTerminalClient: SatsTerminal | null = null;

export function getSatsTerminalClient(): SatsTerminal {
  const apiKey = process.env.SATS_TERMINAL_API_KEY;

  if (!apiKey) {
    logger.error(
      'Server configuration error: Missing SatsTerminal API Key',
      { service: 'satsterminal' },
      'CONFIG',
    );
    throw new Error('Server configuration error: Missing SatsTerminal API Key');
  }

  if (!cachedTerminalClient) {
    cachedTerminalClient = new SatsTerminal({ apiKey });
  }
  return cachedTerminalClient;
}
