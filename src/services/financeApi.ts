import { supabase } from '../lib/supabase';
import { FinanceFiltersState } from '../components/finance/FinanceFilters';
import { differenceInDays, eachDayOfInterval, parseISO, format } from 'date-fns';

export interface PackageActivity {
  id: string;
  scheduled_date: string;
  start_time: string | null;
  considerar_valor_net: boolean;
  attractions: {
    name: string;
    valor_net: number;
  };
}

export interface DailyBreakdown {
  date: string;
  hasDailyServiceRate: boolean;
  dailyServiceRateAmount: number;
  netActivities: {
    attractionName: string;
    netValue: number;
    startTime: string;
  }[];
  dailyRevenue: number;
  hasDriverDailyCost: boolean;
  driverDailyCostAmount: number;
  vehicleExpenses: {
    description: string;
    amount: number;
    category: string;
  }[];
  dailyCost: number;
  dailyMargin: number;
}

export interface PackageWithRelations {
  id: string;
  title: string;
  client_name: string;
  start_date: string;
  end_date: string;
  total_participants: number;
  status: string;
  status_pagamento: 'pago' | 'pendente' | 'cancelado' | 'parcial';
  valor_diaria_servico: number;
  considerar_diaria_motorista: boolean;

  // Calculados para o período filtrado
  dias_no_periodo: number;
  dias_fora_periodo: number;
  is_partial: boolean; // Se tem dias fora do período

  // Valores totais (período filtrado)
  valor_total: number;
  valor_receita_total: number;
  valor_diaria_servico_calculado: number;
  valor_net_receita: number;
  valor_custo_total: number;
  valor_diaria_motorista_calculado: number;
  valor_despesas_veiculo: number;
  valor_margem_bruta: number;
  percentual_margem: number;

  // Relações
  agencies: { id: string; name: string } | null;
  drivers: { id: string; name: string; valor_diaria_motorista: number } | null;
  vehicles: { id: string; license_plate: string; model: string } | null;

  // Breakdown diário
  dailyBreakdown: DailyBreakdown[];
  package_attractions: PackageActivity[];
}

export const financeApi = {
  list: async (filters: FinanceFiltersState) => {
    try {
      const { startDate, endDate, status, agencyId, searchTerm } = filters;

      // Buscar pacotes que TÊM atividades no período
      let query = supabase
        .from('packages')
        .select(`
          id,
          title,
          client_name,
          start_date,
          end_date,
          total_participants,
          status,
          status_pagamento,
          valor_diaria_servico,
          considerar_diaria_motorista,
          agency_id,
          driver_id,
          vehicle_id,
          agencies(id, name),
          drivers(id, name, valor_diaria_motorista),
          vehicles(id, license_plate, model),
          package_attractions(
            id,
            scheduled_date,
            start_time,
            considerar_valor_net,
            attractions(name, valor_net)
          )
        `)
        .in('status', ['confirmed', 'in_progress', 'completed']);

      // Aplicar filtros
      if (status !== 'all') query = query.eq('status_pagamento', status);
      if (agencyId !== 'all') query = query.eq('agency_id', agencyId);
      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`);
      }

      const { data: packagesData, error } = await query;
      if (error) throw error;

      // Filtrar pacotes que têm atividades no período
      const packagesWithActivitiesInPeriod = packagesData.filter(pkg => {
        return pkg.package_attractions.some(act => {
          const actDate = act.scheduled_date;
          return actDate >= startDate && actDate <= endDate;
        });
      });

      // Buscar despesas de veículos no período
      const vehicleIds = packagesWithActivitiesInPeriod.map(p => p.vehicle_id).filter(Boolean);
      const { data: expensesData } = await supabase
        .from('vehicle_expenses')
        .select('*')
        .in('vehicle_id', vehicleIds)
        .gte('date', startDate)
        .lte('date', endDate);

      // Processar cada pacote
      const processedPackages: PackageWithRelations[] = packagesWithActivitiesInPeriod.map(pkg => {
        // Filtrar atividades do período
        const activitiesInPeriod = pkg.package_attractions.filter(act =>
          act.scheduled_date >= startDate && act.scheduled_date <= endDate
        );

        // Calcular dias do pacote
        const packageStartDate = parseISO(pkg.start_date);
        const packageEndDate = parseISO(pkg.end_date);
        const filterStartDate = parseISO(startDate);
        const filterEndDate = parseISO(endDate);

        const effectiveStart = packageStartDate > filterStartDate ? packageStartDate : filterStartDate;
        const effectiveEnd = packageEndDate < filterEndDate ? packageEndDate : filterEndDate;

        const daysInPeriod = differenceInDays(effectiveEnd, effectiveStart) + 1;
        const totalPackageDays = differenceInDays(packageEndDate, packageStartDate) + 1;
        const daysOutOfPeriod = totalPackageDays - daysInPeriod;
        const isPartial = daysOutOfPeriod > 0;

        // Gerar lista de dias no período
        const daysInterval = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });

        // Calcular valores por dia
        const dailyBreakdown: DailyBreakdown[] = daysInterval.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');

          // Atividades deste dia
          const dayActivities = activitiesInPeriod.filter(act => act.scheduled_date === dateStr);

          // Receita do dia
          const hasDailyServiceRate = dayActivities.length > 0;
          const dailyServiceRateAmount = hasDailyServiceRate ? pkg.valor_diaria_servico : 0;

          const netActivities = dayActivities
            .filter(act => act.considerar_valor_net && act.attractions)
            .map(act => ({
              attractionName: act.attractions.name,
              netValue: act.attractions.valor_net,
              startTime: act.start_time || '',
            }));

          const netValue = netActivities.reduce((sum, act) => sum + act.netValue, 0);
          const dailyRevenue = dailyServiceRateAmount + netValue;

          // Custos do dia
          const hasDriverDailyCost = pkg.considerar_diaria_motorista && hasDailyServiceRate;
          const driverDailyCostAmount = hasDriverDailyCost ? (pkg.drivers?.valor_diaria_motorista || 0) : 0;

          const vehicleExpenses = (expensesData || [])
            .filter(exp => exp.vehicle_id === pkg.vehicle_id && exp.date === dateStr)
            .map(exp => ({
              description: exp.description,
              amount: exp.amount,
              category: exp.category,
            }));

          const vehicleExpensesTotal = vehicleExpenses.reduce((sum, exp) => sum + exp.amount, 0);
          const dailyCost = driverDailyCostAmount + vehicleExpensesTotal;

          const dailyMargin = dailyRevenue - dailyCost;

          return {
            date: dateStr,
            hasDailyServiceRate,
            dailyServiceRateAmount,
            netActivities,
            dailyRevenue,
            hasDriverDailyCost,
            driverDailyCostAmount,
            vehicleExpenses,
            dailyCost,
            dailyMargin,
          };
        });

        // Calcular totais
        const valor_diaria_servico_calculado = dailyBreakdown.reduce((sum, day) => sum + day.dailyServiceRateAmount, 0);
        const valor_net_receita = dailyBreakdown.reduce((sum, day) => sum + day.netActivities.reduce((s, a) => s + a.netValue, 0), 0);
        const valor_receita_total = valor_diaria_servico_calculado + valor_net_receita;

        const valor_diaria_motorista_calculado = dailyBreakdown.reduce((sum, day) => sum + day.driverDailyCostAmount, 0);
        const valor_despesas_veiculo = dailyBreakdown.reduce((sum, day) => sum + day.vehicleExpenses.reduce((s, e) => s + e.amount, 0), 0);
        const valor_custo_total = valor_diaria_motorista_calculado + valor_despesas_veiculo;

        const valor_margem_bruta = valor_receita_total - valor_custo_total;
        const percentual_margem = valor_receita_total > 0 ? (valor_margem_bruta / valor_receita_total) * 100 : 0;

        // Ajustar status_pagamento para "parcial" se necessário
        let adjustedStatus = pkg.status_pagamento;
        if (isPartial && pkg.status_pagamento === 'pago') {
          adjustedStatus = 'parcial';
        }

        return {
          ...pkg,
          dias_no_periodo: daysInPeriod,
          dias_fora_periodo: daysOutOfPeriod,
          is_partial: isPartial,
          valor_total: valor_receita_total,
          valor_receita_total,
          valor_diaria_servico_calculado,
          valor_net_receita,
          valor_custo_total,
          valor_diaria_motorista_calculado,
          valor_despesas_veiculo,
          valor_margem_bruta,
          percentual_margem,
          dailyBreakdown,
        } as PackageWithRelations;
      });

      return { data: processedPackages, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },
};
