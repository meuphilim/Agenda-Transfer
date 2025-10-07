// src/hooks/useSupabaseData.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface UseSupabaseDataOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: { column: string; ascending?: boolean };
  realtime?: boolean;
  enabled?: boolean;
}

interface UseSupabaseDataReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  create: (item: Partial<T>) => Promise<T | null>;
  update: (id: string, updates: Partial<T>) => Promise<T | null>;
  delete: (id: string) => Promise<boolean>;
}

export function useSupabaseData<T extends { id: string }>({
  table,
  select = '*',
  filters = {},
  orderBy,
  realtime = false,
  enabled = true,
}: UseSupabaseDataOptions): UseSupabaseDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memorizar objetos para evitar re-renders infinitos
  const memoizedFilters = useMemo(() => filters, [JSON.stringify(filters)]);
  const memoizedOrderBy = useMemo(
    () => orderBy,
    [orderBy?.column, orderBy?.ascending]
  );

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from(table).select(select);

      Object.entries(memoizedFilters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      if (memoizedOrderBy) {
        query = query.order(memoizedOrderBy.column, {
          ascending: memoizedOrderBy.ascending ?? true,
        });
      }

      const { data: result, error: fetchError } = await query;

      if (!isCancelled) {
        if (fetchError) throw fetchError;
        setData(result || []);
      }
    } catch (err: any) {
      if (!isCancelled) {
        const msg = err.message || 'Erro ao carregar dados';
        setError(msg);
        console.error(`Erro ao buscar dados de ${table}:`, err);
        toast.error(msg);
      }
    } finally {
      if (!isCancelled) setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [table, select, memoizedFilters, memoizedOrderBy, enabled]);

  const create = useCallback(
    async (item: Partial<T>): Promise<T | null> => {
      try {
        const { data: result, error: createError } = await supabase
          .from(table)
          .insert([item])
          .select()
          .single();

        if (createError) throw createError;
        setData(prev => [result, ...prev]);
        return result;
      } catch (err: any) {
        toast.error(err.message || 'Erro ao criar item');
        return null;
      }
    },
    [table]
  );

  const update = useCallback(
    async (id: string, updates: Partial<T>): Promise<T | null> => {
      try {
        const { data: result, error: updateError } = await supabase
          .from(table)
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (updateError) throw updateError;
        setData(prev => prev.map(item => (item.id === id ? result : item)));
        return result;
      } catch (err: any) {
        toast.error(err.message || 'Erro ao atualizar item');
        return null;
      }
    },
    [table]
  );

  const deleteItem = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (deleteError) throw deleteError;
        setData(prev => prev.filter(item => item.id !== id));
        return true;
      } catch (err: any) {
        toast.error(err.message || 'Erro ao excluir item');
        return false;
      }
    },
    [table]
  );

  useEffect(() => {
    if (!realtime || !enabled) return;
    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, payload => {
        switch (payload.eventType) {
          case 'INSERT':
            setData(prev =>
              prev.find(item => item.id === payload.new.id)
                ? prev
                : [payload.new as T, ...prev]
            );
            break;
          case 'UPDATE':
            setData(prev =>
              prev.map(item =>
                item.id === payload.new.id ? (payload.new as T) : item
              )
            );
            break;
          case 'DELETE':
            setData(prev => prev.filter(item => item.id !== payload.old.id));
            break;
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, realtime, enabled]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refresh: fetchData, create, update, delete: deleteItem };
}
