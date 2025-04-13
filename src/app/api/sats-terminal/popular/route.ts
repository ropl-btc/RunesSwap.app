import { getSatsTerminalClient } from '@/lib/serverUtils';
import { createSuccessResponse, createErrorResponse, handleApiError } from '@/lib/apiUtils';
import { getCachedPopularRunes, cachePopularRunes } from '@/lib/popularRunesCache';

export async function GET() {
  try {
    // Check cache first
    const cachedData = await getCachedPopularRunes();
    if (cachedData) {
      console.log('[popular API] Using cached popular runes data');
      return createSuccessResponse(cachedData);
    }

    // If not in cache, fetch from SatsTerminal
    console.log('[popular API] Cache miss, fetching from SatsTerminal');
    const terminal = getSatsTerminalClient();
    const popularResponse = await terminal.popularCollections({});
    
    // Validate response structure
    if (!popularResponse || typeof popularResponse !== 'object') {
      return createErrorResponse('Invalid response from SatsTerminal', 'Popular collections data is malformed', 500);
    }
    
    // Cache the fresh data for future use
    if (Array.isArray(popularResponse)) {
      await cachePopularRunes(popularResponse);
    }
    
    return createSuccessResponse(popularResponse);
  } catch (error) {
    const errorInfo = handleApiError(error, 'Failed to fetch popular collections');
    return createErrorResponse(errorInfo.message, errorInfo.details, errorInfo.status);
  }
} 