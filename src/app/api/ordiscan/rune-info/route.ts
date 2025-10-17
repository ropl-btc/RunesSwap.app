import { createRuneRoute } from '@/app/api/ordiscan/helpers';
import { getRuneData } from '@/lib/runesData';

export const GET = createRuneRoute(getRuneData, 'Failed to fetch rune info');
