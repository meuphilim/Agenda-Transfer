import { supabase } from '../lib/supabase';

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

/**
 * Busca todas as datas ocupadas por um veículo
 */
export const getVehicleOccupiedDates = async (
  vehicleId: string,
  startDate?: Date,
  endDate?: Date
): Promise<string[]> => {
  try {
    // Query para buscar atividades de pacotes ativos
    let query = supabase
      .from('package_attractions')
      .select(`
        scheduled_date,
        packages!inner (
          id,
          vehicle_id,
          status
        )
      `)
      .eq('packages.vehicle_id', vehicleId)
      .in('packages.status', ['confirmed', 'in_progress']);

    // Aplicar filtro de data se fornecido
    if (startDate) {
      query = query.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar datas ocupadas do veículo:', error);
      return [];
    }

    // Extrair datas únicas
    const uniqueDates = new Set(
      (data as { scheduled_date: string }[]).map(activity => activity.scheduled_date)
    );

    return Array.from(uniqueDates).sort();
  } catch (error) {
    console.error('Erro ao calcular datas ocupadas:', error);
    return [];
  }
};

/**
 * Busca todas as datas ocupadas por um motorista
 */
export const getDriverOccupiedDates = async (
  driverId: string,
  startDate?: Date,
  endDate?: Date
): Promise<string[]> => {
  try {
    let query = supabase
      .from('package_attractions')
      .select(`
        scheduled_date,
        packages!inner (
          id,
          driver_id,
          status
        )
      `)
      .eq('packages.driver_id', driverId)
      .in('packages.status', ['confirmed', 'in_progress']);

    if (startDate) {
      query = query.gte('scheduled_date', startDate.toISOString().split('T')[0]);
    }
    if (endDate) {
      query = query.lte('scheduled_date', endDate.toISOString().split('T')[0]);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar datas ocupadas do motorista:', error);
      return [];
    }

    const uniqueDates = new Set(
      (data as { scheduled_date: string }[]).map(activity => activity.scheduled_date)
    );

    return Array.from(uniqueDates).sort();
  } catch (error) {
    console.error('Erro ao calcular datas ocupadas:', error);
    return [];
  }
};

/**
 * Verifica se um veículo está disponível em uma data específica
 */
export const isVehicleAvailable = async (
  vehicleId: string,
  date: Date,
  excludePackageId?: string
): Promise<AvailabilityCheck> => {
  try {
    const dateStr = date.toISOString().split('T')[0];

    // Buscar atividades na data
    const { data, error } = await supabase
      .from('package_attractions')
      .select(`
        scheduled_date,
        packages!inner (
          id,
          title,
          vehicle_id,
          status
        )
      `)
      .eq('packages.vehicle_id', vehicleId)
      .eq('scheduled_date', dateStr)
      .in('packages.status', ['confirmed', 'in_progress']);

    if (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return {
        isAvailable: false,
        reason: 'Erro ao verificar disponibilidade',
      };
    }

    // Filtrar pacotes excluídos (para edição)
    const conflictingActivities = excludePackageId
      ? data.filter((a) => (a.packages as { id: string }).id !== excludePackageId)
      : data;

    if (conflictingActivities.length > 0) {
      return {
        isAvailable: false,
        reason: `Veículo ocupado por ${conflictingActivities.length} pacote(s)`,
        conflictingPackages: conflictingActivities.map((a) => (a.packages as { title: string }).title),
      };
    }

    return { isAvailable: true };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do veículo:', error);
    return {
      isAvailable: false,
      reason: 'Erro inesperado',
    };
  }
};

/**
 * Verifica se um motorista está disponível em uma data específica
 */
export const isDriverAvailable = async (
  driverId: string,
  date: Date,
  excludePackageId?: string
): Promise<AvailabilityCheck> => {
  try {
    const dateStr = date.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('package_attractions')
      .select(`
        scheduled_date,
        packages!inner (
          id,
          title,
          driver_id,
          status
        )
      `)
      .eq('packages.driver_id', driverId)
      .eq('scheduled_date', dateStr)
      .in('packages.status', ['confirmed', 'in_progress']);

    if (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return {
        isAvailable: false,
        reason: 'Erro ao verificar disponibilidade',
      };
    }

    const conflictingActivities = excludePackageId
      ? data.filter((a) => (a.packages as { id: string }).id !== excludePackageId)
      : data;

    if (conflictingActivities.length > 0) {
      return {
        isAvailable: false,
        reason: `Motorista ocupado por ${conflictingActivities.length} pacote(s)`,
        conflictingPackages: conflictingActivities.map((a) => (a.packages as { title: string }).title),
      };
    }

    return { isAvailable: true };
  } catch (error) {
    console.error('Erro ao verificar disponibilidade do motorista:', error);
    return {
      isAvailable: false,
      reason: 'Erro inesperado',
    };
  }
};

/**
 * Verifica disponibilidade de veículo para múltiplas datas
 */
export const checkVehicleAvailabilityForDates = async (
  vehicleId: string,
  dates: Date[],
  excludePackageId?: string
): Promise<Record<string, AvailabilityCheck>> => {
  const results: Record<string, AvailabilityCheck> = {};

  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    results[dateStr] = await isVehicleAvailable(vehicleId, date, excludePackageId);
  }

  return results;
};

/**
 * Verifica disponibilidade de motorista para múltiplas datas
 */
export const checkDriverAvailabilityForDates = async (
  driverId: string,
  dates: Date[],
  excludePackageId?: string
): Promise<Record<string, AvailabilityCheck>> => {
  const results: Record<string, AvailabilityCheck> = {};

  for (const date of dates) {
    const dateStr = date.toISOString().split('T')[0];
    results[dateStr] = await isDriverAvailable(driverId, date, excludePackageId);
  }

  return results;
};

/**
 * Obtém informação completa de disponibilidade de um veículo
 */
export const getVehicleAvailability = async (
  vehicleId: string,
  vehicleName: string,
  startDate?: Date,
  endDate?: Date
): Promise<AvailabilityInfo> => {
  const occupiedDates = await getVehicleOccupiedDates(vehicleId, startDate, endDate);

  // Buscar pacotes ativos
  const { data: packages } = await supabase
    .from('packages')
    .select('id, title, vehicle_id, status')
    .eq('vehicle_id', vehicleId)
    .in('status', ['confirmed', 'in_progress']);

  const activePackages = await Promise.all(
    (packages ?? []).map(async (pkg: { id: string; title: string }) => {
      const dates = await getVehicleOccupiedDates(pkg.id, startDate, endDate);
      return {
        packageId: pkg.id,
        packageTitle: pkg.title,
        dates,
      };
    })
  );

  // Determinar status baseado em ocupação
  const today = new Date().toISOString().split('T')[0];
  const isBusyToday = occupiedDates.includes(today);

  return {
    resourceId: vehicleId,
    resourceName: vehicleName,
    status: isBusyToday ? 'busy' : 'available',
    occupiedDates,
    activePackages,
  };
};

/**
 * Obtém informação completa de disponibilidade de um motorista
 */
export const getDriverAvailability = async (
  driverId: string,
  driverName: string,
  startDate?: Date,
  endDate?: Date
): Promise<AvailabilityInfo> => {
  const occupiedDates = await getDriverOccupiedDates(driverId, startDate, endDate);

  const { data: packages } = await supabase
    .from('packages')
    .select('id, title, driver_id, status')
    .eq('driver_id', driverId)
    .in('status', ['confirmed', 'in_progress']);

  const activePackages = await Promise.all(
    (packages ?? []).map(async (pkg: { id: string; title: string }) => {
      const dates = await getDriverOccupiedDates(pkg.id, startDate, endDate);
      return {
        packageId: pkg.id,
        packageTitle: pkg.title,
        dates,
      };
    })
  );

  const today = new Date().toISOString().split('T')[0];
  const isBusyToday = occupiedDates.includes(today);

  return {
    resourceId: driverId,
    resourceName: driverName,
    status: isBusyToday ? 'busy' : 'available',
    occupiedDates,
    activePackages,
  };
};

/**
 * Valida se um pacote pode ser criado/atualizado sem conflitos
 */
export const validatePackageAvailability = async (
  vehicleId: string,
  driverId: string,
  activityDates: Date[],
  excludePackageId?: string
): Promise<{
  isValid: boolean;
  vehicleConflicts: string[];
  driverConflicts: string[];
}> => {
  const vehicleResults = await checkVehicleAvailabilityForDates(
    vehicleId,
    activityDates,
    excludePackageId
  );

  const driverResults = await checkDriverAvailabilityForDates(
    driverId,
    activityDates,
    excludePackageId
  );

  const vehicleConflicts: string[] = [];
  const driverConflicts: string[] = [];

  for (const [date, check] of Object.entries(vehicleResults)) {
    if (!check.isAvailable) {
      vehicleConflicts.push(`${date}: ${check.reason}`);
    }
  }

  for (const [date, check] of Object.entries(driverResults)) {
    if (!check.isAvailable) {
      driverConflicts.push(`${date}: ${check.reason}`);
    }
  }

  return {
    isValid: vehicleConflicts.length === 0 && driverConflicts.length === 0,
    vehicleConflicts,
    driverConflicts,
  };
};

/**
 * Retorna um mapa de disponibilidade para o calendário público (dados mockados).
 * @param startDate - Data de início do período.
 * @param endDate - Data de fim do período.
 * @returns Um registro onde a chave é a data (YYYY-MM-DD) e o valor é um booleano de disponibilidade.
 */
// TODO: Substituir esta função mockada pela chamada à função RPC do Supabase 'get_public_availability'
export const getPublicAvailability = async (
  startDate: Date,
  endDate: Date
): Promise<Record<string, boolean>> => {

  console.log("Usando dados de disponibilidade FALSOS (MOCK) para o calendário público.");

  // Simula um pequeno atraso de rede para imitar uma chamada de API real
  await new Promise(resolve => setTimeout(resolve, 400));

  const availability: Record<string, boolean> = {};
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const dateString = currentDate.toISOString().split('T')[0];
    // Lógica de mock: Dias com data par são disponíveis, ímpares são indisponíveis.
    availability[dateString] = currentDate.getDate() % 2 === 0;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return availability;
};