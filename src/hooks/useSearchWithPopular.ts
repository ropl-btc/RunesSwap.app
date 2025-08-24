import { useEffect, useRef, useState } from 'react';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';

interface UseSearchWithPopularOptions<T, R> {
  searchFn: (query: string) => Promise<R[]>;
  mapper: (item: R) => T;
  popularFn?: () => Promise<R[]>;
  initialItems?: T[];
  initialLoading?: boolean;
  initialError?: string | null;
  debounceMs?: number;
  initialQuery?: string;
}

export function useSearchWithPopular<T, R>({
  searchFn,
  mapper,
  popularFn,
  initialItems = [],
  initialLoading = false,
  initialError = null,
  debounceMs = 300,
  initialQuery = '',
}: UseSearchWithPopularOptions<T, R>) {
  const search = useDebouncedSearch<T>(
    async (q) => {
      const res = await searchFn(q);
      return res.map(mapper);
    },
    debounceMs,
    initialQuery,
  );

  const [popularItems, setPopularItems] = useState<T[]>(initialItems);
  const [isPopularLoading, setIsPopularLoading] = useState(initialLoading);
  const [popularError, setPopularError] = useState<string | null>(initialError);

  // Stabilize function references to avoid effect re-runs causing render loops
  const popularFnRef = useRef(popularFn);
  const mapperRef = useRef(mapper);
  useEffect(() => {
    popularFnRef.current = popularFn;
  }, [popularFn]);
  useEffect(() => {
    mapperRef.current = mapper;
  }, [mapper]);

  useEffect(() => {
    setPopularItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setIsPopularLoading(initialLoading);
  }, [initialLoading]);

  useEffect(() => {
    setPopularError(initialError);
  }, [initialError]);

  useEffect(() => {
    if (!popularFnRef.current) return;
    if (initialItems.length > 0) return;

    let cancelled = false;
    const fetchPopular = async () => {
      setIsPopularLoading(true);
      setPopularError(null);
      try {
        const data = await popularFnRef.current!();
        if (!cancelled) setPopularItems(data.map(mapperRef.current));
      } catch (e: unknown) {
        if (!cancelled)
          setPopularError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setIsPopularLoading(false);
      }
    };
    fetchPopular();

    return () => {
      cancelled = true;
    };
  }, [initialItems.length]);

  const trimmed = search.query.trim();
  const results = trimmed ? search.results : popularItems;
  const isLoading = trimmed ? search.isSearching : isPopularLoading;
  const error = trimmed ? search.error : popularError;

  return {
    query: search.query,
    onQueryChange: search.onQueryChange,
    results,
    isLoading,
    error,
    reset: search.reset,
  };
}

export default useSearchWithPopular;
