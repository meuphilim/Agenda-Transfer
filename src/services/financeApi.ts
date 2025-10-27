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
    dailyNetRevenue: number; // Adicionado para clareza
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

  export interface DailySummary {
    date: string;
    clientName: string;
    description: string;
    revenue: number;
    isPaid: boolean;
  }

  export interface AgencySettlement {
    agencyId: string;
    agencyName: string;
    totalValueToPay: number;
    totalValuePaid: number;
    settlementStatus: 'Pago' | 'Pendente' | 'Parcial';
    settlementIds: string[];
    dailyBreakdown: DailySummary[];
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

        // Buscar fechamentos (settlements) no período para determinar o status de pagamento
        const { data: settlementsData, error: stlError } = await supabase
            .from('settlements')
            .select('id, agency_id, start_date, end_date')
            .lte('start_date', endDate)
            .gte('end_date', startDate);
        if (stlError) throw stlError;

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

            // Atividades para cálculo de valor NET (apenas as que contribuem para receita)
            const activitiesForNetValue = dayActivities.filter(act => act.considerar_valor_net && act.attractions);
            const netValue = activitiesForNetValue.reduce((sum, act) => sum + (act.attractions?.valor_net ?? 0), 0);

            // Lista COMPLETA de atividades para exibição no frontend
            const allDayActivitiesForDisplay = dayActivities.map(act => ({
              attractionName: act.attractions?.name ?? 'Atividade sem nome',
              netValue: act.attractions?.valor_net ?? 0,
              startTime: act.start_time || '',
            }));

            // Lógica de receita mutuamente exclusiva: ou é NET ou é Diária
            const hasNetValue = netValue > 0;
            const dailyServiceRateAmount = !hasNetValue && dayActivities.length > 0 ? pkg.valor_diaria_servico : 0;
            const dailyNetRevenue = hasNetValue ? netValue : 0;
            const dailyRevenue = dailyServiceRateAmount + dailyNetRevenue;
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
              dailyNetRevenue,
              netActivities: allDayActivitiesForDisplay, // Envia todas as atividades para o front
              dailyRevenue,
              hasDriverDailyCost,
              driverDailyCostAmount,
              vehicleExpenses,
              dailyCost,
              dailyMargin,
            };
          });

          // Calcular totais somando diretamente os valores diários já validados
          const valor_receita_total = dailyBreakdown.reduce((sum, day) => sum + day.dailyRevenue, 0);
          const valor_diaria_servico_calculado = dailyBreakdown.reduce((sum, day) => sum + day.dailyServiceRateAmount, 0);
          const valor_net_receita = dailyBreakdown.reduce((sum, day) => sum + day.dailyNetRevenue, 0);

          const valor_diaria_motorista_calculado = dailyBreakdown.reduce((sum, day) => sum + day.driverDailyCostAmount, 0);
          const valor_despesas_veiculo = dailyBreakdown.reduce((sum, day) => sum + day.vehicleExpenses.reduce((s, e) => s + e.amount, 0), 0);
          const valor_custo_total = valor_diaria_motorista_calculado + valor_despesas_veiculo;

          const valor_margem_bruta = valor_receita_total - valor_custo_total;
          const percentual_margem = valor_receita_total > 0 ? (valor_margem_bruta / valor_receita_total) * 100 : 0;

          // Lógica de status financeiro baseada nos fechamentos (settlements)
          const paidDatesCount = activeDates.filter(date => {
            return (settlementsData || []).some(s =>
                s.agency_id === pkg.agency_id &&
                date >= s.start_date &&
                date <= s.end_date
            );
          }).length;

          let status_pagamento: 'pago' | 'pendente' | 'cancelado' | 'parcial' = 'pendente';
          if (pkg.status === 'cancelled') {
            status_pagamento = 'cancelado';
          } else if (activeDates.length === 0) {
            status_pagamento = 'pendente';
          } else if (paidDatesCount === activeDates.length) {
            status_pagamento = 'pago';
          } else if (paidDatesCount > 0) {
            status_pagamento = 'parcial';
          } else {
            status_pagamento = 'pendente';
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

      let pkgQuery = supabase
        .from('packages')
        .select(`
          id,
          client_name,
          valor_diaria_servico,
          agency_id,
          agencies(id, name),
          package_attractions(id, scheduled_date, considerar_valor_net, attractions(name, valor_net))
        `)
        .in('status', ['completed', 'confirmed', 'in_progress']);

      if (agencyId !== 'all') {
        pkgQuery = pkgQuery.eq('agency_id', agencyId);
      }

      const { data: packagesData, error: pkgError } = await pkgQuery;
      if (pkgError) throw pkgError;

      const filteredPackages = packagesData.filter(pkg =>
        pkg.package_attractions.some(act =>
          act.scheduled_date >= startDate && act.scheduled_date <= endDate
        )
      );

      const { data: settlementsData, error: stlError } = await supabase
        .from('settlements')
        .select('id, agency_id, start_date, end_date')
        .lte('start_date', endDate)
        .gte('end_date', startDate);
      if (stlError) throw stlError;

      const grouped = filteredPackages.reduce((acc, pkg) => {
        const agencyId = pkg.agencies?.id || 'sem_agencia';
        const agencyName = pkg.agencies?.name || 'Sem Agência';

        if (!acc[agencyId]) {
          acc[agencyId] = {
            agencyId, agencyName, totalValueToPay: 0, totalValuePaid: 0,
            settlementIds: [], dailyBreakdown: [], settlementStatus: 'Pendente' as const,
          };
        }

        const activitiesInPeriod = pkg.package_attractions.filter(act =>
          act.scheduled_date >= startDate && act.scheduled_date <= endDate
        );

        const activitiesByDate = activitiesInPeriod.reduce((dateAcc, act) => {
          (dateAcc[act.scheduled_date] = dateAcc[act.scheduled_date] || []).push(act);
          return dateAcc;
        }, {} as Record<string, typeof activitiesInPeriod>);

        for (const date in activitiesByDate) {
          const dayActivities = activitiesByDate[date];
          const hasNetActivity = dayActivities.some(act => act.considerar_valor_net);

          let dailyRevenue = 0;
          let description = '';

          if (hasNetActivity) {
            const netActivities = dayActivities.filter(act => act.considerar_valor_net);
            dailyRevenue = netActivities.reduce((sum, act) => sum + (act.attractions?.valor_net || 0), 0);
            const attractionNames = netActivities.map(act => act.attractions?.name || 'N/A');
            description = `Valor NET: ${attractionNames.join(' + ')}`;
          } else {
            dailyRevenue = pkg.valor_diaria_servico;
            const attractionNames = dayActivities.map(act => act.attractions?.name || 'N/A');
            description = `Diária de Serviço: ${attractionNames.join(' + ')}`;
          }

          const coveringSettlement = settlementsData.find(s =>
            s.agency_id === agencyId && date >= s.start_date && date <= s.end_date
          );

          if (coveringSettlement) {
            acc[agencyId].totalValuePaid += dailyRevenue;
            if (!acc[agencyId].settlementIds.includes(coveringSettlement.id)) {
              acc[agencyId].settlementIds.push(coveringSettlement.id);
            }
          } else {
            acc[agencyId].totalValueToPay += dailyRevenue;
          }

          acc[agencyId].dailyBreakdown.push({
            date,
            clientName: pkg.client_name,
            description,
            revenue: dailyRevenue,
            isPaid: !!coveringSettlement,
          });
        }
        return acc;
      }, {} as Record<string, AgencySettlement>);

      const settlements = Object.values(grouped).map(settlement => {
        settlement.dailyBreakdown.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  settleAgencyPeriod: async (agencyId: string, startDate: string, endDate: string, details: any) => {
    try {
      const { error } = await supabase
        .from('settlements')
        .insert({
          agency_id: agencyId,
          start_date: startDate,
          end_date: endDate,
          details,
        });
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },

  cancelAgencySettlement: async (settlementIds: string[]) => {
    try {
      const { error } = await supabase
        .from('settlements')
        .delete()
        .in('id', settlementIds);
      if (error) throw error;
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  },
};
