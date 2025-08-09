import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');

    if (!prefix) {
      return NextResponse.json(
        { error: 'Missing required parameter: prefix' },
        { status: 400 },
      );
    }

    // First, try to find the rune in our database by exact ID
    const { data: existingRune, error: dbError } = await supabase
      .from('runes')
      .select('*')
      .eq('id', prefix)
      .limit(1);

    // If not found by exact ID, try to find by prefix
    if (!existingRune || existingRune.length === 0) {
      const { data: prefixRune, error: prefixDbError } = await supabase
        .from('runes')
        .select('*')
        .ilike('id', `${prefix}:%`)
        .limit(1);

      if (prefixDbError) {
        // Error handled by returning not found
      }

      if (prefixRune && prefixRune.length > 0) {
        return NextResponse.json(prefixRune[0]);
      }
    }

    if (dbError) {
      // Error handled by continuing to next lookup method
    }

  if (existingRune && existingRune.length > 0) {
    return NextResponse.json(existingRune[0]);
  }

  // Not found after exact and prefix DB lookups
  return NextResponse.json(
    { error: 'Rune not found with the given prefix' },
    { status: 404 },
  );
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
