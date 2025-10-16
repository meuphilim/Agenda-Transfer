import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

export type PackageWithRelations = Database['public']['Tables']['packages']['Row'] & {
  agencies: Pick<Database['public']['Tables']['agencies']['Row'], 'id' | 'name'> | null;
  drivers: Pick<Database['public']['Tables']['drivers']['Row'], 'id' | 'name'> | null;
  // Campos financeiros mockados para manter a UI funcional
  valor_total: number;
  valor_diaria: number;
  valor_net: number;
  translado_aeroporto: boolean;
  status_pagamento: 'pago' | 'pendente' | 'cancelado';
};

export const financeApi = {
  list: async (filters?: Record<string, any>): Promise<{ data: PackageWithRelations[]; error: Error | null }> => {
    try {
      let query = supabase
        .from('packages')
        .select(`
          *,
          agencies (id, name),
          drivers (id, name)
        `);

      if (filters?.startDate) {
        query = query.gte('start_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('end_date', filters.endDate);
      }
      if (filters?.status && filters.status !== 'all') {
        // Mapeia status de pagamento para status de pacote
        const packageStatus = filters.status === 'pago' ? 'completed' : filters.status === 'pendente' ? 'confirmed' : 'cancelled';
        query = query.eq('status', packageStatus);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Adiciona dados financeiros mockados
      const enhancedData = data.map((pkg, index) => ({
        ...pkg,
        valor_total: 500 + (index * 150),
        valor_diaria: 100 + (index * 20),
        valor_net: 400 + (index * 130),
        translado_aeroporto: index % 2 === 0,
        // Converte status do pacote para status de pagamento
        status_pagamento: pkg.status === 'completed' ? 'pago' : pkg.status === 'confirmed' ? 'pendente' : 'cancelado',
      }));

      return { data: enhancedData, error: null };

    } catch (err: any) {
      console.error('Erro ao buscar pacotes:', err);
      return { data: [], error: err };
    }
  },

  updatePackage: async (packageId: string, updates: Partial<Database['public']['Tables']['packages']['Update']>) => {
    const { data, error } = await supabase
      .from('packages')
      .update(updates)
      .eq('id', packageId)
      .select()
      .single();

    return { data, error };
  },

  deletePackage: async (packageId: string) => {
    const { error } = await supabase
      .from('packages')
      .delete()
      .eq('id', packageId);

    return { error };
  }
};