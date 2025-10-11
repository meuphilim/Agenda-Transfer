import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';

interface SyncOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  showToast?: boolean;
}

class SupabaseSync {
  private static instance: SupabaseSync;
  private syncQueue: Map<string, Promise<any>> = new Map();

  static getInstance(): SupabaseSync {
    if (!SupabaseSync.instance) {
      SupabaseSync.instance = new SupabaseSync();
    }
    return SupabaseSync.instance;
  }

  /**
   * Executa uma operação garantindo que não há duplicatas
   */
  async executeOperation<T>(
    key: string,
    operation: () => Promise<T>,
    options: SyncOptions = {}
  ): Promise<T> {
    // Se já existe uma operação em andamento, aguarda ela
    if (this.syncQueue.has(key)) {
      return this.syncQueue.get(key)!;
    }

    const promise = this.performOperation(operation, options);
    this.syncQueue.set(key, promise);

    try {
      const result = await promise;
      return result;
    } finally {
      this.syncQueue.delete(key);
    }
  }

  private async performOperation<T>(
    operation: () => Promise<T>,
    options: SyncOptions
  ): Promise<T> {
    try {
      const result = await operation();
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }
      
      return result;
    } catch (error: any) {
      if (options.onError) {
        options.onError(error);
      }
      
      if (options.showToast !== false) {
        toast.error(error.message || 'Erro na operação');
      }
      
      throw error;
    }
  }

  /**
   * Força sincronização de uma tabela específica
   */
  async forceSync(table: string): Promise<any[]> {
    const key = `sync_${table}`;
    
    return this.executeOperation(key, async () => {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    });
  }

  /**
   * Verifica se dados estão sincronizados
   */
  async checkSync(table: string, lastSync: Date): Promise<boolean> {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .gt('updated_at', lastSync.toISOString());

      if (error) throw error;
      return (count || 0) === 0;
    } catch (error) {
      console.error(`Erro ao verificar sincronização de ${table}:`, error);
      return false;
    }
  }

  /**
   * Limpa cache de operações
   */
  clearCache(): void {
    this.syncQueue.clear();
  }
}

export const supabaseSync = SupabaseSync.getInstance();

// Utilitários para operações comuns
export const syncOperations = {
  create: async <T>(table: string, data: Partial<T>, options?: SyncOptions) => {
    return supabaseSync.executeOperation(
      `create_${table}_${Date.now()}`,
      async () => {
        const { data: result, error } = await supabase
          .from(table)
          .insert([data])
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      options
    );
  },

  update: async <T>(table: string, id: string, data: Partial<T>, options?: SyncOptions) => {
    return supabaseSync.executeOperation(
      `update_${table}_${id}`,
      async () => {
        const { data: result, error } = await supabase
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;
        return result;
      },
      options
    );
  },

  delete: async (table: string, id: string, options?: SyncOptions) => {
    return supabaseSync.executeOperation(
      `delete_${table}_${id}`,
      async () => {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', id);

        if (error) throw error;
        return true;
      },
      options
    );
  },

  fetch: async (table: string, filters: Record<string, any> = {}, options?: SyncOptions) => {
    const filterKey = Object.keys(filters).sort().map(k => `${k}:${filters[k]}`).join('|');
    
    return supabaseSync.executeOperation(
      `fetch_${table}_${filterKey}`,
      async () => {
        let query = supabase.from(table).select('*');
        
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            query = query.eq(key, value);
          }
        });

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
      },
      options
    );
  }
};