import { createContext, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface DataContextType {
  invalidateCache: (table: string) => void;
  syncData: (table: string) => Promise<any[]>;
  getFromCache: (table: string, id: string) => any;
  setInCache: (table: string, id: string, data: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

// Cache simples em memória para evitar requests desnecessários
const cache = new Map<string, Map<string, any>>();
const cacheTimestamps = new Map<string, number>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const invalidateCache = useCallback((table: string) => {
    cache.delete(table);
    cacheTimestamps.delete(table);
  }, []);

  const syncData = useCallback(async (table: string) => {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Atualizar cache
      const tableCache = new Map();
      data?.forEach(item => {
        tableCache.set(item.id, item);
      });
      
      cache.set(table, tableCache);
      cacheTimestamps.set(table, Date.now());

      return data;
    } catch (error: any) {
      toast.error(`Erro ao sincronizar ${table}: ${error.message}`);
      throw error;
    }
  }, []);

  const getFromCache = useCallback((table: string, id: string) => {
    const tableCache = cache.get(table);
    const timestamp = cacheTimestamps.get(table);
    
    // Verificar se cache expirou
    if (!timestamp || Date.now() - timestamp > CACHE_TTL) {
      return null;
    }
    
    return tableCache?.get(id) || null;
  }, []);

  const setInCache = useCallback((table: string, id: string, data: any) => {
    let tableCache = cache.get(table);
    if (!tableCache) {
      tableCache = new Map();
      cache.set(table, tableCache);
    }
    
    tableCache.set(id, data);
    cacheTimestamps.set(table, Date.now());
  }, []);

  const value = {
    invalidateCache,
    syncData,
    getFromCache,
    setInCache
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};