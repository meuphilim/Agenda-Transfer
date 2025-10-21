import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';
import { FinanceFiltersState } from '../components/finance/FinanceFilters';
import { calculateMultiplePackagesFinancials } from './packageCalculations';

export type PackageWithRelations = Database['public']['Tables']['packages']['Row'] & {
  agencies: Pick<Database['public']['Tables']['agencies']['Row'], 'id' | 'name'> | null;
  drivers: Pick<Database['public']['Tables']['drivers']['Row'], 'id' | 'name' | 'valor_diaria_motorista'> | null;
  vehicles: Pick<Database['public']['Tables']['vehicles']['Row'], 'id' | 'license_plate' | 'model'> | null;

  valor_receita_total: number;
  valor_diaria_servico_calculado: number;
  valor_net_receita: number;
  valor_custo_total: number;
  valor_diaria_motorista_calculado: number;
  valor_despesas_veiculo: number;
  valor_margem_bruta: number;
  percentual_margem: number;
  status_pagamento: 'pago' | 'pendente' | 'cancelado';
};

export const financeApi = {
  list: async (filters?: Partial<FinanceFiltersState>): Promise<{
    data: PackageWithRelations[];
    error: Error | null
  }> => {
    try {
      let query = supabase
        .from('packages')
        .select(`
          *,
          agencies (id, name),
          drivers (id, name, valor_diaria_motorista),
          vehicles (id, license_plate, model)
        `)
        .in('status', ['confirmed', 'in_progress', 'completed']);

      if (filters?.startDate) query = query.gte('start_date', filters.startDate);
      if (filters?.endDate) query = query.lte('end_date', filters.endDate);
      if (filters?.agencyId && filters.agencyId !== 'all') query = query.eq('agency_id', filters.agencyId);
      if (filters?.status && filters.status !== 'all') {
        const packageStatus = filters.status === 'pago' ? 'completed' : 'confirmed';
        query = query.eq('status', packageStatus);
      }

      const { data, error } = await query;
      if (error) throw error;

      const packageIds = (data ?? []).map(pkg => pkg.id);
      const allFinancials = await calculateMultiplePackagesFinancials(
        packageIds,
        filters?.startDate,
        filters?.endDate
      );

      const financialsMap = new Map(allFinancials.map(f => [f.packageId, f]));

      const enhancedData: PackageWithRelations[] = (data ?? []).map((pkg): PackageWithRelations => {
        const financials = financialsMap.get(pkg.id);
        return {
          ...pkg,
          valor_receita_total: financials?.totalRevenue ?? 0,
          valor_diaria_servico_calculado: financials?.totalDailyServiceRates ?? 0,
          valor_net_receita: financials?.totalNetValues ?? 0,
          valor_custo_total: financials?.totalCosts ?? 0,
          valor_diaria_motorista_calculado: financials?.totalDriverDailyCosts ?? 0,
          valor_despesas_veiculo: financials?.totalVehicleExpenses ?? 0,
          valor_margem_bruta: financials?.grossMargin ?? 0,
          percentual_margem: financials?.marginPercentage ?? 0,
          status_pagamento: pkg.status === 'completed' ? 'pago' : 'pendente',
        };
      });

      return { data: enhancedData, error: null };

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Erro desconhecido');
      console.error('Erro ao buscar pacotes:', error.message);
      return { data: [], error };
    }
  },

  updatePackage: async (
    packageId: string,
    updates: Partial<Database['public']['Tables']['packages']['Update']>
  ) => {
    const { data, error } = await supabase.from('packages').update(updates).eq('id', packageId).select().single();
    return { data, error };
  },

  deletePackage: async (packageId: string) => {
    const { error } = await supabase.from('packages').delete().eq('id', packageId);
    return { error };
  }
};