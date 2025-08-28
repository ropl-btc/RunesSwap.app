import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import type { SearchParams } from 'satsterminal-sdk';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
} from '@/lib/apiUtils';
import { getSatsTerminalClient } from '@/lib/serverUtils';
import { withApiHandler } from '@/lib/withApiHandler';
import type { Rune } from '@/types/satsTerminal';

const searchParamsSchema = z.object({
  query: z.string().trim().min(1, 'Query parameter is required'),
  sell: z.string().optional(),
});

interface SearchResponseItem {
  token_id?: string;
  id?: string;
  token?: string;
  name?: string;
  icon?: string;
  imageURI?: string;
}

/**
 * Generate a stable ID based on item properties and index.
 * This ensures consistent IDs across API calls for the same search results.
 * @param item - The search response item
 * @param index - The item's position in the results array
 * @returns A stable, deterministic ID
 */
function generateStableId(item: SearchResponseItem, index: number): string {
  // Use existing ID if available
  if (item.token_id) return item.token_id;
  if (item.id) return item.id;

  // Create stable ID from item properties
  const identifier = [
    item.token || item.name || '',
    item.icon || item.imageURI || '',
    index.toString(),
  ]
    .filter(Boolean)
    .join('|');

  // Generate a short hash for readability
  const hash = createHash('md5').update(identifier).digest('hex').slice(0, 8);
  return `search_${hash}`;
}

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const validation = await validateRequest(
      request,
      searchParamsSchema,
      'query',
    );
    if (!validation.success) return validation.errorResponse;

    const { query, sell } = validation.data;

    const terminal = getSatsTerminalClient();

    const searchParams: SearchParams = {
      query: query,
      sell: sell === 'true',
    };

    const searchResponse = await terminal.search(searchParams);

    const transformedResults: Rune[] = Array.isArray(searchResponse)
      ? searchResponse.map((item: SearchResponseItem, index: number) => ({
          id: generateStableId(item, index),
          name: item.token || item.name || 'Unknown',
          imageURI: item.icon || item.imageURI || '',
        }))
      : [];

    return createSuccessResponse(transformedResults);
  },
  {
    defaultErrorMessage: 'Failed to search',
    customErrorHandler: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      if (errorMessage.includes('Rate limit')) {
        return createErrorResponse(
          'Rate limit exceeded',
          'Please try again later',
          429,
        );
      }

      if (errorMessage.includes('Unexpected token')) {
        return createErrorResponse(
          'API service unavailable',
          'The SatsTerminal API is currently unavailable. Please try again later.',
          503,
        );
      }

      return null;
    },
  },
);
