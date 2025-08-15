import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  createErrorResponse,
  createSuccessResponse,
  validateRequest,
} from '@/lib/apiUtils';
import { withApiHandler } from '@/lib/withApiHandler';
import { normalizeRuneName } from '@/utils/runeUtils';

// Define the schema for the query parameters
const QuerySchema = z.object({
  slug: z.string().min(1).max(100),
});

// Define the response type for price history
export interface PriceHistoryDataPoint {
  timestamp: number; // Unix timestamp in milliseconds
  price: number; // Price in USD
}

export interface PriceHistoryResponse {
  slug: string;
  prices: PriceHistoryDataPoint[];
  available: boolean;
}

// Define interfaces for the API response
interface PriceDataPoint {
  date: string;
  floor_value: number;
}

export const GET = withApiHandler(
  async (request: NextRequest) => {
    const validation = await validateRequest(request, QuerySchema, 'query');
    if (!validation.success) {
      return validation.errorResponse;
    }
    const { slug: originalSlug } = validation.data;

    // Format the rune name for the API call
    // Try with different formats to ensure we get data
    const formattedSlug = normalizeRuneName(originalSlug).toUpperCase();

    // Define a mapping for known runes that might have formatting issues
    const knownRunes: Record<string, string> = {
      'LIQUIDIUM•TOKEN': 'LIQUIDIUMTOKEN',
      LIQUIDIUMTOKEN: 'LIQUIDIUMTOKEN',
      LIQUIDIUM: 'LIQUIDIUMTOKEN',
    };

    // Check if we have a direct mapping first
    let apiSlug = knownRunes[originalSlug] || formattedSlug;

    // If not a direct match, try partial matching for known runes
    if (!knownRunes[originalSlug]) {
      // Check if it includes any known rune names
      if (originalSlug.toUpperCase().includes('LIQUIDIUM')) {
        apiSlug = 'LIQUIDIUMTOKEN';
      }
    }

    // External API endpoint
    const apiUrl = `https://runes-floor-api.shudu.workers.dev/api/query?slug=${encodeURIComponent(apiSlug)}`;

    // Check if API key is set
    const apiKey = process.env.RUNES_FLOOR_API_KEY;
    if (!apiKey) {
      return createErrorResponse(
        'API key not configured',
        'Missing RUNES_FLOOR_API_KEY environment variable',
        500,
      );
    }

    // Fetch data from the external API
    const response = await fetch(apiUrl, {
      headers: {
        'X-API-Key': apiKey,
      },
      next: {
        revalidate: 300, // Cache for 5 minutes
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Return a successful response with available: false
        return createSuccessResponse({
          slug: formattedSlug,
          prices: [],
          available: false,
        });
      }

      return createErrorResponse(
        `Failed to fetch price history (${response.status})`,
        `Status: ${response.status}`,
        500,
      );
    }

    // Parse the response body
    const data = await response.json();

    // Check if we have any price data
    if (!data || !Array.isArray(data)) {
      return createSuccessResponse({
        slug: formattedSlug,
        prices: [],
        available: false,
      });
    }

    // Transform the data into our desired format
    // The API returns an array of price points directly
    const prices: PriceHistoryDataPoint[] = data.map(
      (item: PriceDataPoint) => ({
        timestamp: new Date(item.date).getTime(), // Convert date string to timestamp
        price: item.floor_value || 0, // Get price from floor_value
      }),
    );

    // Make sure the available flag is set correctly
    const available = prices.length > 0;

    return createSuccessResponse({
      slug: formattedSlug,
      prices,
      available,
    });
  },
  { defaultErrorMessage: 'Failed to fetch price history' },
);
