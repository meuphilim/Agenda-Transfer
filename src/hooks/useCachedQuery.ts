import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '../lib/supabase';

interface CachedQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  enabled?: boolean;
  cacheTime?: number;
  staleTime?: number;
}

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
  isStale: boolean;
}

const queryCache = new Map<string, CacheEntry<any>>();
const activeRequests = new Map<string, Promise<any>>();

const DEFAULT_CACHE_TIME = 5 * 60 * 1000; // 5 minutos
const DEFAULT_STALE_TIME = 1 * 60 * 1000; // 1 minuto

function generateCacheKey(options: CachedQueryOptions): string {
  return JSON.stringify({
    table: options.table,
    select: options.select,
    filters: options.filters,
    orderBy: options.orderBy,
  });
}

export function useCachedQuery<T extends { id: string }>(options: CachedQueryOptions) {
  const {
    table,
    select = '*',
    filters = {},
    orderBy,
    enabled = true,
    cacheTime = DEFAULT_CACHE_TIME,
    staleTime = DEFAULT_STALE_TIME,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout>();

  const cacheKey = useMemo(() => generateCacheKey(options), [
    table,
    select,
    JSON.stringify(filters),
    JSON.stringify(orderBy),
  ]);

  const fetchData = useCallback(async (forceRefresh = false): Promise<T[]> => {
    if (!enabled) {
      setLoading(false);
      return [];
    }

    const cachedEntry = queryCache.get(cacheKey);
    const now = Date.now();

    if (!forceRefresh && cachedEntry && (now - cachedEntry.timestamp) < cacheTime) {
      setData(cachedEntry.data);
      setLoading(false);

      if (!cachedEntry.isStale && (now - cachedEntry.timestamp) >= staleTime) {
        cachedEntry.isStale = true;
      }

      return cachedEntry.data;
    }

    const activeRequest = activeRequests.get(cacheKey);
    if (activeRequest) {
      const result = await activeRequest;
      setData(result);
      return result;
    }

    const fetchPromise = (async () => {
      try {
        setError(null);

        let query = supabase.from(table).select(select);

        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });

        if (orderBy) {
          query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
        }

        const { data: result, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        const typedResult = (result as unknown as T[]) || [];

        queryCache.set(cacheKey, {
          data: typedResult,
          timestamp: Date.now(),
          isStale: false,
        });

        setData(typedResult);
        return typedResult;
      } catch (err: any) {
        const errorMessage = err.message || 'Erro ao carregar dados';
        setError(errorMessage);
        console.error(`Erro ao buscar dados de ${table}:`, err);
        throw err;
      } finally {
        setLoading(false);
        activeRequests.delete(cacheKey);
      }
    })();

    activeRequests.set(cacheKey, fetchPromise);
    return fetchPromise;
  }, [enabled, cacheKey, table, select, filters, orderBy, cacheTime, staleTime]);

  const refresh = useCallback(() => {
    setLoading(true);
    return fetchData(true);
  }, [fetchData]);

  const invalidate = useCallback(() => {
    queryCache.delete(cacheKey);
  }, [cacheKey]);

  useEffect(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    fetchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 50);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, [fetchData]);

  useEffect(() => {
    const checkStale = setInterval(() => {
      const entry = queryCache.get(cacheKey);
      if (entry && entry.isStale) {
        fetchData(true);
      }
    }, staleTime);

    return () => clearInterval(checkStale);
  }, [cacheKey, staleTime, fetchData]);

  return {
    data,
    loading,
    error,
    refresh,
    invalidate,
  };
}

export function invalidateAllQueries() {
  queryCache.clear();
  activeRequests.clear();
}

export function invalidateQueriesByTable(table: string) {
  for (const [key, _] of queryCache) {
    if (key.includes(`"table":"${table}"`)) {
      queryCache.delete(key);
    }
  }
}
