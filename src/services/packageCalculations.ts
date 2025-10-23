import { supabase } from '../lib/supabase';
import { Database } from '../types/database.types';

type PackageAttraction = Database['public']['Tables']['package_attractions']['Row'] & {
  attractions: Pick<Database['public']['Tables']['attractions']['Row'], 'name' | 'valor_net'> | null;
};

type PackageData = Database['public']['Tables']['packages']['Row'] & {
  drivers: Pick<Database['public']['Tables']['drivers']['Row'], 'valor_diaria_motorista'> | null;
  package_attractions: PackageAttraction[] | null;
};

type VehicleExpense = Database['public']['Tables']['vehicle_expenses']['Row'];

interface DailyBreakdown {
  date: string;
  hasDailyServiceRate: boolean;
  dailyServiceRateAmount: number;
  netActivities: { attractionName: string; netValue: number }[];
  totalNet: number;
  hasDriverDailyCost: boolean;
  driverDailyCostAmount: number;
  vehicleExpenses: { description: string; amount: number; category: string }[];
  totalVehicleExpenses: number;
  dailyRevenue: number;
  dailyCost: number;
  dailyMargin: number;
}

export interface PackageFinancialSummary {
  packageId: string;
  totalDailyServiceRates: number;
  totalNetValues: number;
  totalRevenue: number;
  totalDriverDailyCosts: number;
  totalVehicleExpenses: number;
  totalCosts: number;
  grossMargin: number;
  marginPercentage: number;
  daysWithServiceRate: number;
  daysWithDriverCost: number;
  dailyBreakdown: DailyBreakdown[];
}

export const calculatePackageFinancials = async (
  packageId: string,
  startDate?: string,
  endDate?: string
): Promise<PackageFinancialSummary> => {
  const { data: pkg, error: pkgError } = await supabase
    .from('packages')
    .select(`
      id, valor_diaria_servico, considerar_diaria_motorista, driver_id, vehicle_id, start_date, end_date,
      drivers ( valor_diaria_motorista ),
      package_attractions ( id, scheduled_date, considerar_valor_net, attractions ( name, valor_net ) )
    `)
    .eq('id', packageId)
    .single<PackageData>();

  if (pkgError) {
    console.error(`Erro ao buscar pacote ${packageId}:`, pkgError.message);
    throw new Error(`Falha ao buscar dados do pacote (ID: ${packageId}).`);
  }
  if (!pkg) {
    throw new Error(`Pacote com ID ${packageId} não encontrado.`);
  }

  const { data: vehicleExpenses, error: expensesError } = await supabase
    .from('vehicle_expenses')
    .select('*')
    .eq('vehicle_id', pkg.vehicle_id ?? '')
    .gte('date', startDate ?? pkg.start_date)
    .lte('date', endDate ?? pkg.end_date);

  if (expensesError) {
    console.error(`Erro ao buscar despesas para o veículo do pacote ${packageId}:`, expensesError.message);
  }

  const dailyServiceRate = pkg.valor_diaria_servico ?? 0;
  const considerDriverCost = pkg.considerar_diaria_motorista ?? true;
  const driverDailyCost = pkg.drivers?.valor_diaria_motorista ?? 0;

  let activities: PackageAttraction[] = pkg.package_attractions?.filter((a): a is PackageAttraction => a !== null) ?? [];
  if (startDate) activities = activities.filter(a => a.scheduled_date >= startDate);
  if (endDate) activities = activities.filter(a => a.scheduled_date <= endDate);

  const activitiesByDay = activities.reduce((acc, activity) => {
    const date = activity.scheduled_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, PackageAttraction[]>);

  const expensesByDay = (vehicleExpenses ?? []).reduce((acc, expense) => {
    const date = expense.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(expense);
    return acc;
  }, {} as Record<string, VehicleExpense[]>);

  const dailyBreakdown: DailyBreakdown[] = [];
  let totalDailyServiceRates = 0, totalDriverDailyCosts = 0, totalNetValues = 0, totalVehicleExpensesSum = 0, daysWithServiceRate = 0, daysWithDriverCost = 0;

  const allDates = new Set([...Object.keys(activitiesByDay), ...Object.keys(expensesByDay)]);

  allDates.forEach((date) => {
    const dayActivities = activitiesByDay[date] ?? [];
    const dayExpenses = expensesByDay[date] ?? [];

    const netActivities = dayActivities
      .filter(a => a.considerar_valor_net && a.attractions?.valor_net)
      .map(a => ({ attractionName: a.attractions!.name, netValue: a.attractions!.valor_net! }));
    const totalNet = netActivities.reduce((sum, a) => sum + a.netValue, 0);
    totalNetValues += totalNet;

    const hasDailyServiceRate = dayActivities.some(a => !a.considerar_valor_net) && dailyServiceRate > 0;
    if (hasDailyServiceRate) {
      totalDailyServiceRates += dailyServiceRate;
      daysWithServiceRate++;
    }

    const hasDriverDailyCost = considerDriverCost && dayActivities.length > 0;
    if (hasDriverDailyCost) {
      totalDriverDailyCosts += driverDailyCost;
      daysWithDriverCost++;
    }

    const vehicleExpensesList = dayExpenses.map(exp => ({
      description: exp.description, amount: exp.amount, category: exp.category,
    }));
    const totalVehicleExpenses = vehicleExpensesList.reduce((sum, exp) => sum + exp.amount, 0);
    totalVehicleExpensesSum += totalVehicleExpenses;

    const dailyRevenue = (hasDailyServiceRate ? dailyServiceRate : 0) + totalNet;
    const dailyCost = (hasDriverDailyCost ? driverDailyCost : 0) + totalVehicleExpenses;

    dailyBreakdown.push({
      date, hasDailyServiceRate, dailyServiceRateAmount: hasDailyServiceRate ? dailyServiceRate : 0,
      netActivities, totalNet, hasDriverDailyCost, driverDailyCostAmount: hasDriverDailyCost ? driverDailyCost : 0,
      vehicleExpenses: vehicleExpensesList, totalVehicleExpenses, dailyRevenue, dailyCost,
      dailyMargin: dailyRevenue - dailyCost,
    });
  });

  dailyBreakdown.sort((a, b) => a.date.localeCompare(b.date));

  const totalRevenue = totalDailyServiceRates + totalNetValues;
  const totalCosts = totalDriverDailyCosts + totalVehicleExpensesSum;
  const grossMargin = totalRevenue - totalCosts;
  const marginPercentage = totalRevenue > 0 ? (grossMargin / totalRevenue) * 100 : 0;

  return {
    packageId, totalDailyServiceRates, totalNetValues, totalRevenue,
    totalDriverDailyCosts, totalVehicleExpenses: totalVehicleExpensesSum, totalCosts,
    grossMargin, marginPercentage, daysWithServiceRate, daysWithDriverCost, dailyBreakdown,
  };
};

export const calculateMultiplePackagesFinancials = async (
  packageIds: string[],
  startDate?: string,
  endDate?: string
): Promise<PackageFinancialSummary[]> => {
  const results = await Promise.all(
    packageIds.map(id => calculatePackageFinancials(id, startDate, endDate))
  );
  return results;
};