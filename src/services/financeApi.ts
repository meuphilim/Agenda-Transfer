import { supabase } from '../lib/supabase';
import { FinanceFiltersState } from '../components/finance/FinanceFilters';
import { differenceInDays, parseISO } from 'date-fns';

// ... (as interfaces existentes, como PackageWithRelations, podem ser mantidas ou removidas se não forem mais usadas)
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

  export interface AgencySettlement {
    agencyId: string;
    agencyName: string;
    totalValueToPay: number;
    totalValuePaid: number;
    settlementStatus: 'Pago' | 'Pendente' | 'Parcial';
    activities: {
      id: string;
      scheduled_date: string;
      package_status_pagamento: 'pago' | 'pendente' | 'cancelado';
      revenue: number;
      attraction_name: string;
    }[];
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
          `);

        // Aplicar filtros
        if (status === 'pago') {
          query = query.eq('status', 'completed');
        } else if (status === 'pendente') {
          query = query.in('status', ['confirmed', 'in_progress']);
        } else if (status === 'cancelado') {
          query = query.eq('status', 'cancelled');
        }
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

          // Obter uma lista única de todas as datas com atividades no período
          const activeDates = [...new Set(activitiesInPeriod.map(act => act.scheduled_date))].sort();

          // Calcular valores por dia, apenas para dias com atividades
          const dailyBreakdown: DailyBreakdown[] = activeDates.map(dateStr => {
            // Atividades deste dia
            const dayActivities = activitiesInPeriod.filter(act => act.scheduled_date === dateStr);

            const netActivities = dayActivities
              .filter(act => act.considerar_valor_net && act.attractions)
              .map(act => ({
                attractionName: act.attractions.name,
                netValue: act.attractions.valor_net,
                startTime: act.start_time || '',
              }));

            const netValue = netActivities.reduce((sum, act) => sum + act.netValue, 0);

            // Lógica de receita mutuamente exclusiva: ou é NET ou é Diária
            const hasNetValue = netValue > 0;
            const dailyServiceRateAmount = !hasNetValue && dayActivities.length > 0 ? pkg.valor_diaria_servico : 0;
            const dailyRevenue = hasNetValue ? netValue : dailyServiceRateAmount;
            const hasDailyServiceRate = dailyServiceRateAmount > 0;

            // Custos do dia
            const hasDriverDailyCost = pkg.considerar_diaria_motorista && dayActivities.length > 0;
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

          // Converter status do BD para status de pagamento da UI
          let status_pagamento: 'pago' | 'pendente' | 'cancelado' | 'parcial' = 'pendente';
          if (pkg.status === 'completed') {
            status_pagamento = 'pago';
          } else if (pkg.status === 'cancelled') {
            status_pagamento = 'cancelado';
          }

          // Ajustar para "parcial" se necessário
          if (isPartial && status_pagamento === 'pago') {
            status_pagamento = 'parcial';
          }

          return {
            ...pkg,
            status_pagamento,
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

  getAgencySettlements: async (filters: {
    startDate: string;
    endDate: string;
    agencyId: string;
  }) => {
    try {
      const { startDate, endDate, agencyId } = filters;

      let query = supabase
        .from('packages')
        .select(`
          id,
          status,
          valor_diaria_servico,
          agency_id,
          agencies(id, name),
          package_attractions(
            id,
            scheduled_date,
            considerar_valor_net,
            attractions(name, valor_net)
          )
        `)
        .in('status', ['completed', 'confirmed', 'in_progress']);

      if (agencyId !== 'all') {
        query = query.eq('agency_id', agencyId);
      }

      const { data: packagesData, error } = await query;
      if (error) throw error;

      const filteredPackages = packagesData.filter(pkg =>
        pkg.package_attractions.some(act =>
          act.scheduled_date >= startDate && act.scheduled_date <= endDate
        )
      );

      const grouped = filteredPackages.reduce((acc, pkg) => {
        const agencyId = pkg.agencies?.id || 'sem_agencia';
        const agencyName = pkg.agencies?.name || 'Sem Agência';

        if (!acc[agencyId]) {
          acc[agencyId] = {
            agencyId,
            agencyName,
            totalValueToPay: 0,
            totalValuePaid: 0,
            settlementStatus: 'Pendente' as const,
            activities: [],
          };
        }

        const activitiesInPeriod = pkg.package_attractions.filter(act =>
          act.scheduled_date >= startDate && act.scheduled_date <= endDate
        );

        const activitiesByDate = activitiesInPeriod.reduce((dateAcc, act) => {
          (dateAcc[act.scheduled_date] = dateAcc[act.scheduled_date] || []).push(act);
          return dateAcc;
        }, {} as Record<string, typeof activitiesInPeriod>);

        const isPaid = pkg.status === 'completed';
        const status_pagamento = isPaid ? 'pago' : 'pendente';

        for (const date in activitiesByDate) {
          const dayActivities = activitiesByDate[date];
          const hasNetActivity = dayActivities.some(act => act.considerar_valor_net);

          let dailyRevenue = 0;
          let activityDetails = [];

          if (hasNetActivity) {
            const netActivities = dayActivities.filter(act => act.considerar_valor_net);
            dailyRevenue = netActivities.reduce((sum, act) => sum + (act.attractions?.valor_net || 0), 0);
            activityDetails = netActivities.map(act => ({
              id: act.id,
              name: act.attractions?.name || 'N/A'
            }));
          } else {
            dailyRevenue = pkg.valor_diaria_servico;
            activityDetails.push({ id: `diaria-${pkg.id}-${date}`, name: 'Diária de Serviço' });
          }

          if (isPaid) {
            acc[agencyId].totalValuePaid += dailyRevenue;
          } else {
            acc[agencyId].totalValueToPay += dailyRevenue;
          }

          activityDetails.forEach(detail => {
            acc[agencyId].activities.push({
              id: detail.id,
              scheduled_date: date,
              package_status_pagamento: status_pagamento,
              revenue: dailyRevenue / activityDetails.length, // Rateia se houver múltiplos NETs
              attraction_name: detail.name,
            });
          });
        }

        return acc;
      }, {} as Record<string, AgencySettlement>);

      const settlements = Object.values(grouped).map(settlement => {
        if (settlement.totalValueToPay === 0 && settlement.totalValuePaid > 0) {
          settlement.settlementStatus = 'Pago';
        } else if (settlement.totalValueToPay > 0 && settlement.totalValuePaid > 0) {
          settlement.settlementStatus = 'Parcial';
        } else if (settlement.totalValueToPay > 0 && settlement.totalValuePaid === 0){
          settlement.settlementStatus = 'Pendente';
        }
        return settlement;
      });

      return { data: settlements, error: null };
    } catch (error: any) {
      return { data: null, error };
    }
  },

  settleAgencyPeriod: async (
    agencyId: string,
    startDate: string,
    endDate: string
  ) => {
    try {
      const { data: packages, error: packagesError } = await supabase
        .from('packages')
        .select(`
          id,
          package_attractions!inner(
            id,
            scheduled_date
          )
        `)
        .eq('agency_id', agencyId)
        .in('status', ['confirmed', 'in_progress']);

      if (packagesError) throw packagesError;

      const packageIdsToUpdate = packages
        .filter(pkg =>
          pkg.package_attractions.some(act =>
            act.scheduled_date >= startDate &&
            act.scheduled_date <= endDate
          )
        )
        .map(pkg => pkg.id);

      if (packageIdsToUpdate.length === 0) {
        return { error: null };
      }

      const { error: updateError } = await supabase
        .from('packages')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .in('id', packageIdsToUpdate);

      if (updateError) throw updateError;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },
};
