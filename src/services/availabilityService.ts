import { supabase } from '../lib/supabase';
import { parseISO, addMinutes } from 'date-fns';

/**
 * Detalhes de uma atividade necessários para validação de disponibilidade.
 */
export interface ActivityForValidation {
  scheduled_date: string;
  start_time: string;
  considerar_valor_net: boolean;
  // Duração da atividade em minutos, obtida do cadastro de 'attractions'.
  duration: number;
}

/**
 * Status de disponibilidade calculado dinamicamente
 */
export type AvailabilityStatus = 'available' | 'busy' | 'maintenance' | 'unavailable';

/**
 * Informação de disponibilidade de um recurso
 */
export interface AvailabilityInfo {
  resourceId: string;
  resourceName: string;
  status: AvailabilityStatus;
  occupiedDates: string[]; // Array de datas ISO (YYYY-MM-DD)
  activePackages: {
    packageId: string;
    packageTitle: string;
    dates: string[];
  }[];
}

/**
 * Resultado da verificação de disponibilidade
 */
export interface AvailabilityCheck {
  isAvailable: boolean;
  reason?: string;
  conflictingPackages?: string[];
}


// --- Funções Legadas (mantidas para outras partes do sistema, mas não usadas pela nova validação) ---

/**
 * Busca todas as datas ocupadas por um veículo
 */
export const getVehicleOccupiedDates = async (
  vehicleId: string,
  startDate?: Date,
  endDate?: Date
): Promise<string[]> => {
    let query = supabase.from('package_attractions').select(`scheduled_date, packages!inner(id, vehicle_id, status)`)
      .eq('packages.vehicle_id', vehicleId).in('packages.status', ['confirmed', 'in_progress']);
    if (startDate) query = query.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    if (endDate) query = query.lte('scheduled_date', endDate.toISOString().split('T')[0]);
    const { data, error } = await query;
    if (error) { console.error('Erro:', error); return []; }
    return Array.from(new Set((data as { scheduled_date: string }[]).map(a => a.scheduled_date))).sort();
};

/**
 * Busca todas as datas ocupadas por um motorista
 */
export const getDriverOccupiedDates = async (
  driverId: string,
  startDate?: Date,
  endDate?: Date
): Promise<string[]> => {
    let query = supabase.from('package_attractions').select(`scheduled_date, packages!inner(id, driver_id, status)`)
      .eq('packages.driver_id', driverId).in('packages.status', ['confirmed', 'in_progress']);
    if (startDate) query = query.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    if (endDate) query = query.lte('scheduled_date', endDate.toISOString().split('T')[0]);
    const { data, error } = await query;
    if (error) { console.error('Erro:', error); return []; }
    return Array.from(new Set((data as { scheduled_date: string }[]).map(a => a.scheduled_date))).sort();
};

/**
 * Valida se um pacote pode ser criado/atualizado sem conflitos.
 * Esta é a função principal que implementa a nova lógica de validação.
 */
export const validatePackageAvailability = async (
  vehicleId: string,
  driverId: string,
  activities: ActivityForValidation[],
  excludePackageId?: string
): Promise<{
  isValid: boolean;
  vehicleConflicts: string[];
  driverConflicts: string[];
}> => {
  const vehicleConflicts: string[] = [];
  const driverConflicts: string[] = [];

  if (activities.length === 0) {
    return { isValid: true, vehicleConflicts, driverConflicts };
  }

  // 1. Agrupar novas atividades por data
  const activitiesByDate = activities.reduce((acc, act) => {
    (acc[act.scheduled_date] = acc[act.scheduled_date] || []).push(act);
    return acc;
  }, {} as Record<string, ActivityForValidation[]>);

  const allDates = Object.keys(activitiesByDate);

  // 2. Buscar todas as atividades existentes para os recursos e datas relevantes de uma só vez
  const fetchExistingActivities = async (resourceType: 'vehicle' | 'driver', resourceId: string) => {
    let query = supabase
      .from('package_attractions')
      .select(`
        scheduled_date, start_time, considerar_valor_net,
        attractions ( estimated_duration ),
        packages!inner ( id, title, status )
      `)
      .in('scheduled_date', allDates)
      .in('packages.status', ['confirmed', 'in_progress']);

    if (resourceType === 'vehicle') {
      query = query.eq('packages.vehicle_id', resourceId);
    } else {
      query = query.eq('packages.driver_id', resourceId);
    }

    if (excludePackageId) {
      query = query.not('packages.id', 'eq', excludePackageId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Erro ao buscar agendamentos existentes: ${error.message}`);
    }
    return data;
  };

  const [existingVehicleActivities, existingDriverActivities] = await Promise.all([
    fetchExistingActivities('vehicle', vehicleId),
    fetchExistingActivities('driver', driverId),
  ]);

  // Helper para converter data e hora em objeto Date
  const toDateTime = (date: string, time: string) => parseISO(`${date}T${time}`);

  // 3. Iterar por cada dia e validar conflitos
  for (const date of allDates) {
    const newActivitiesOnDate = activitiesByDate[date];
    const existingVehicleActsOnDate = existingVehicleActivities.filter(a => a.scheduled_date === date);
    const existingDriverActsOnDate = existingDriverActivities.filter(a => a.scheduled_date === date);

    // Validação para o Veículo
    const vehicleResult = checkConflicts(newActivitiesOnDate, existingVehicleActsOnDate, date);
    if (!vehicleResult.isAvailable) {
      vehicleConflicts.push(vehicleResult.reason!);
    }

    // Validação para o Motorista
    const driverResult = checkConflicts(newActivitiesOnDate, existingDriverActsOnDate, date);
    if (!driverResult.isAvailable) {
      driverConflicts.push(driverResult.reason!);
    }
  }

  const checkConflicts = (
    newActivities: ActivityForValidation[],
    existingActivities: typeof existingVehicleActivities,
    date: string
  ): AvailabilityCheck => {
    // a. Verificar se há alguma atividade de dia inteiro (não-NET) existente
    const fullDayExisting = existingActivities.find(act => !act.considerar_valor_net);
    if (fullDayExisting) {
      return {
        isAvailable: false,
        reason: `${date}: Já existe uma reserva de dia inteiro (Pacote: ${(fullDayExisting.packages as any).title}).`,
      };
    }

    // b. Verificar se alguma das novas atividades é de dia inteiro
    const fullDayNew = newActivities.find(act => !act.considerar_valor_net);
    if (fullDayNew && existingActivities.length > 0) {
      return {
        isAvailable: false,
        reason: `${date}: Não é possível adicionar uma reserva de dia inteiro, pois já existem outras atividades agendadas.`,
      };
    }

    // c. Se tudo for por hora (Valor NET), verificar sobreposição de horários
    const allActivities = [
      ...existingActivities.map(act => ({
        start_time: act.start_time!,
        duration: (act.attractions as any)?.estimated_duration ?? 0,
        title: (act.packages as any)?.title,
      })),
      ...newActivities.map(act => ({
        start_time: act.start_time,
        duration: act.duration,
        title: 'Nova Atividade',
      })),
    ];

    // Ordenar por horário de início para facilitar a verificação
    allActivities.sort((a, b) => a.start_time.localeCompare(b.start_time));

    for (let i = 0; i < allActivities.length - 1; i++) {
        const current = allActivities[i];
        const next = allActivities[i + 1];

        // Adicionar buffer de 30min antes e 30min depois
        const currentStart = addMinutes(toDateTime(date, current.start_time), -30);
        const currentEnd = addMinutes(toDateTime(date, current.start_time), current.duration + 30);

        const nextStart = addMinutes(toDateTime(date, next.start_time), -30);

        if (currentEnd > nextStart) {
            return {
                isAvailable: false,
                reason: `${date}: Conflito de horário entre atividades (com buffer de 1h). Verifique os horários.`,
            };
        }
    }

    return { isAvailable: true };
  };

  return {
    isValid: vehicleConflicts.length === 0 && driverConflicts.length === 0,
    vehicleConflicts,
    driverConflicts,
  };
};

/**
 * Retorna um mapa de disponibilidade para o calendário público.
 */
export const getPublicAvailability = async (
  startDate: Date,
  endDate: Date
): Promise<Record<string, boolean>> => {
  try {
    const { data, error } = await supabase.rpc('get_public_availability', {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
    });

    if (error) {
      console.error('Erro ao chamar RPC get_public_availability:', error);
      throw new Error('Não foi possível carregar os dados de disponibilidade.');
    }

    if (Array.isArray(data)) {
      const availabilityMap: Record<string, boolean> = {};
      for (const item of data) {
        availabilityMap[item.available_date.split('T')[0]] = item.is_available;
      }
      return availabilityMap;
    }

    return data ?? {};

  } catch (err) {
    console.error('Erro inesperado em getPublicAvailability:', err);
    return {};
  }
};
