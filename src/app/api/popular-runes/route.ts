import {
  createErrorResponse,
  createSuccessResponse,
  handleApiError,
} from '@/lib/apiUtils';
import { getPopularRunes } from '@/lib/popularRunes';

/**
 * Returns the popular runes list
 * This is now a simple hardcoded list that you can easily maintain
 */
export async function GET() {
  try {
    const popularRunes = getPopularRunes();

    return createSuccessResponse(popularRunes);
  } catch (error) {
    const errorInfo = handleApiError(error, 'Failed to fetch popular runes');
    return createErrorResponse(
      errorInfo.message,
      errorInfo.details,
      errorInfo.status,
    );
  }
}
