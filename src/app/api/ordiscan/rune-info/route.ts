import { getRuneData } from '@/lib/runesData';
import { createRuneRoute } from '@/app/api/ordiscan/helpers';

export const GET = createRuneRoute(getRuneData, 'Failed to fetch rune info');
