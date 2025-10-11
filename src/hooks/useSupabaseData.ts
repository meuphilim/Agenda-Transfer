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
  enabled = true
}: UseSupabaseDataOptions): UseSupabaseDataReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Serializar dependências de forma estável
  const filtersKey = useMemo(() => JSON.stringify(filters), [JSON.stringify(filters)]);
  const orderByKey = useMemo(() => JSON.stringify(orderBy), [JSON.stringify(orderBy)]);

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase.from(table).select(select);

      // Aplicar filtros
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.eq(key, value);
        }
      });

      // Aplicar ordenação
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      const { data: result, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setData((result as unknown as T[]) || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar dados';
      setError(errorMessage);
      console.error(`Erro ao buscar dados de ${table}:`, err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [table, select, filtersKey, orderByKey, enabled]);

  const create = useCallback(async (item: Partial<T>): Promise<T | null> => {
    try {
      const { data: result, error: createError } = await supabase
        .from(table)
        .insert([item])
        .select()
        .single();

      if (createError) throw createError;

      // Atualizar estado local imediatamente
      setData(prev => [result, ...prev]);
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao criar item';
      toast.error(errorMessage);
      return null;
    }
  }, [table]);

  const update = useCallback(async (id: string, updates: Partial<T>): Promise<T | null> => {
    try {
      const { data: result, error: updateError } = await supabase
        .from(table)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Atualizar estado local imediatamente
      setData(prev => prev.map(item => item.id === id ? result : item));
      
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao atualizar item';
      toast.error(errorMessage);
      return null;
    }
  }, [table]);

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Atualizar estado local imediatamente
      setData(prev => prev.filter(item => item.id !== id));
      
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao excluir item';
      toast.error(errorMessage);
      return false;
    }
  }, [table]);

  // Configurar realtime se habilitado
  useEffect(() => {
    if (!realtime || !enabled) return;

    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table }, 
        (payload) => {
          switch (payload.eventType) {
            case 'INSERT':
              setData(prev => {
                // Evitar duplicatas
                if (prev.find(item => item.id === payload.new.id)) {
                  return prev;
                }
                return [payload.new as T, ...prev];
              });
              break;
            case 'UPDATE':
              setData(prev => prev.map(item => 
                item.id === payload.new.id ? payload.new as T : item
              ));
              break;
            case 'DELETE':
              setData(prev => prev.filter(item => item.id !== payload.old.id));
              break;
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, realtime, enabled]);

  // Fetch inicial
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refresh: fetchData,
    create,
    update,
    delete: deleteItem
  };
}
