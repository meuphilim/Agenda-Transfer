// ANÁLISE TÉCNICA E REFINAMENTO (Outubro 2025)
// - Corrigido tratamento de erros na busca de dados para exibir feedback à UI.
// - Otimizado o cálculo de estatísticas usando `count: 'exact'` do Supabase.
// - Removida asserção de tipo insegura (`as`) para `recentPackages`.
// - Adicionado alerta de segurança sobre a dependência de RLS para as queries.
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CalendarDays,
  Truck,
  ClipboardList,
  CheckCircle,
  Package,
  Users,
  AlertCircle,
} from 'lucide-react';
import { PackageStatus } from '../types/enums';
import { cn } from '../lib/utils';
import { getNowInMS, createDateInMS, addMinutes } from '../utils/timezone';

interface DashboardStats {
  totalPackages: number;
  activePackages: number;
  availableVehicles: number;
  busyDrivers: number;
  upcomingToday: number;
}

// Definindo um tipo mais específico para os pacotes recentes
interface RecentPackage {
  id: string;
  title: string;
  status: string;
  created_at: string;
  agencies: { name: string } | null;
  vehicles: { license_plate: string; model: string } | null;
  drivers: { name: string } | null;
}

// Interface para as atividades do dia
interface TodayActivity {
  scheduled_date: string;
  start_time: string | null;
  attractions: { name: string; estimated_duration: number } | null;
  packages: {
    status: string;
    drivers: { name: string } | null;
    vehicles: { license_plate: string; model: string } | null;
  } | null;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPackages: 0,
    activePackages: 0,
    availableVehicles: 0,
    busyDrivers: 0,
    upcomingToday: 0,
  });
  const [recentPackages, setRecentPackages] = useState<RecentPackage[]>([]);
  const [todayActivities, setTodayActivities] = useState<TodayActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchDashboardData();

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'packages' },
        () => {
          void fetchDashboardData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'package_attractions' },
        () => {
          void fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // As queries dependem de RLS permissiva.
      // Considere migrar para funções de borda (edge functions) para maior segurança.
      const [packagesResult, vehiclesResult, driversResult, upcomingResult, recentResult] = await Promise.all([
        supabase.from('packages').select('id, status', { count: 'exact' }),
        supabase.from('vehicles').select('status', { count: 'exact' }).eq('status', 'available'),
        supabase.from('drivers').select('status', { count: 'exact' }).eq('status', 'busy'),
        supabase
          .from('package_attractions')
          .select(`
            scheduled_date,
            start_time,
            attractions!inner(name, estimated_duration),
            packages(
              status,
              drivers(name),
              vehicles(license_plate, model)
            )
          `)
          .gte('scheduled_date', today.toISOString())
          .lt('scheduled_date', tomorrow.toISOString())
          .order('scheduled_date', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase
          .from('packages')
          .select(`
            id,
            title,
            status,
            created_at,
            agencies(name),
            vehicles(license_plate, model),
            drivers(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const results = [packagesResult, vehiclesResult, driversResult, upcomingResult, recentResult];
      for (const result of results) {
        if (result.error) {
          console.error('Erro na API do Supabase:', result.error);
          setError('Falha ao carregar os dados do dashboard. Verifique sua conexão e tente novamente.');
          return;
        }
      }

      const allPackages: { status: string }[] = packagesResult.data ?? [];
      const activePackages = allPackages.filter(p =>
        [PackageStatus.CONFIRMED, PackageStatus.IN_PROGRESS].includes(p.status as PackageStatus)
      ).length;

      setStats({
        totalPackages: packagesResult.count ?? 0,
        activePackages: activePackages,
        availableVehicles: vehiclesResult.count ?? 0,
        busyDrivers: driversResult.count ?? 0,
        upcomingToday: upcomingResult.data?.length ?? 0,
      });

      setTodayActivities(upcomingResult.data ?? []);
      setRecentPackages(recentResult.data ?? []);
    } catch (err) {
      console.error('Erro inesperado ao buscar dados do dashboard:', err);
      setError('Ocorreu um erro inesperado. Por favor, recarregue a página.');
    } finally {
      setLoading(false);
    }
  };

  const statsCards = [
    { label: 'Total de Pacotes', value: stats.totalPackages, icon: Package },
    { label: 'Pacotes Ativos', value: stats.activePackages, icon: CheckCircle },
    { label: 'Veículos Disponíveis', value: stats.availableVehicles, icon: Truck },
    { label: 'Motoristas Ocupados', value: stats.busyDrivers, icon: Users },
  ];

  const getStatusColor = (status: PackageStatus | string) => {
    const colors: Record<PackageStatus, string> = {
      [PackageStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
      [PackageStatus.CONFIRMED]: 'bg-green-100 text-green-800',
      [PackageStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [PackageStatus.COMPLETED]: 'bg-gray-100 text-gray-800',
      [PackageStatus.CANCELLED]: 'bg-red-100 text-red-800',
    };
    return colors[status as PackageStatus] || 'bg-gray-100';
  };

  const getStatusText = (status: PackageStatus | string) => {
    const statusText: Record<PackageStatus, string> = {
      [PackageStatus.PENDING]: 'Pendente',
      [PackageStatus.CONFIRMED]: 'Confirmado',
      [PackageStatus.IN_PROGRESS]: 'Em Andamento',
      [PackageStatus.COMPLETED]: 'Concluído',
      [PackageStatus.CANCELLED]: 'Cancelado',
    };
    return statusText[status as PackageStatus] || status;
  };

const getActivityStatus = (activity: TodayActivity): [string, string] => {
  // Obter horário atual em GMT-4
  const now = getNowInMS();

  // Se atividade já foi marcada como concluída no sistema
  if (activity.packages?.status === 'completed') {
    return ['Concluída', 'bg-gray-100 text-gray-800'];
  }

  // Validar dados necessários
  if (!activity.scheduled_date || !activity.start_time) {
    console.warn('Atividade sem data ou horário:', activity);
    return ['A iniciar', 'bg-green-100 text-green-800'];
  }

  try {
    // Criar data/hora de início no fuso GMT-4
    const startDateTime = createDateInMS(
      activity.scheduled_date,
      activity.start_time
    );

    // Calcular horário de término
    const durationMinutes = activity.attractions?.estimated_duration ?? 60;
    const endDateTime = addMinutes(startDateTime, durationMinutes);

    // Log para debug (remover em produção se necessário)
    if (import.meta.env.DEV) {
      console.log('Status Check:', {
        activity: activity.attractions?.name,
        now: now.toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' }),
        start: startDateTime.toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' }),
        end: endDateTime.toLocaleString('pt-BR', { timeZone: 'America/Campo_Grande' }),
      });
    }

    // Determinar status baseado em comparação temporal
    if (now >= endDateTime) {
      return ['Concluída', 'bg-gray-100 text-gray-800'];
    }

    if (now >= startDateTime && now < endDateTime) {
      return ['Em andamento', 'bg-blue-100 text-blue-800'];
    }

    return ['A iniciar', 'bg-green-100 text-green-800'];

  } catch (error) {
    console.error('Erro ao calcular status da atividade:', error, activity);
    return ['A iniciar', 'bg-green-100 text-green-800'];
  }
};

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-center p-4">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Falha ao carregar o Dashboard
        </h2>
        <p className="text-gray-600 mb-6 max-w-md">
          {error}
        </p>
        <button
          onClick={() => {
            void fetchDashboardData();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6 bg-gray-50 min-h-screen">

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-gray-500">
          Visão geral do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs md:text-sm text-gray-500 uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                  {stat.value}
                </p>
              </div>
              <div className="flex-shrink-0 ml-4">
                <stat.icon className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold">
              Pacotes Recentes
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {recentPackages.length > 0 ? recentPackages.map((pkg) => (
              <div key={pkg.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 pt-1">
                    <div className={cn("h-8 w-8 rounded-full flex items-center justify-center", getStatusColor(pkg.status))}>
                      <ClipboardList className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {pkg.title}
                      </p>
                      <span className={cn("px-2 py-1 rounded-full text-xs font-medium", getStatusColor(pkg.status))}>
                        {getStatusText(pkg.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {pkg.agencies?.name} • {pkg.drivers?.name ?? 'Sem motorista'}
                    </p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-center text-gray-500 p-8">Nenhum pacote recente.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-4 md:p-6 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-base md:text-lg font-semibold">
              Atividades de Hoje
            </h3>
            <span className="text-sm font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
              {todayActivities.length}
            </span>
          </div>
          <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
            {todayActivities.length > 0 ? todayActivities.map((activity, index) => {
              const [statusText, statusColor] = getActivityStatus(activity);
              return (
                <div key={index} className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <CalendarDays className="h-4 w-4 text-gray-500" />
                      <p className="font-mono text-sm text-gray-800">
                        {activity.start_time ? activity.start_time.slice(0, 5) : '—'}
                      </p>
                    </div>
                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", statusColor)}>
                      {statusText}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900">{activity.attractions?.name ?? 'Atividade não especificada'}</p>
                  <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>{activity.packages?.drivers?.name ?? 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Truck className="h-3 w-3" />
                      <span>{activity.packages?.vehicles?.license_plate ?? 'N/A'}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <p className="text-center text-gray-500 p-8">Nenhuma atividade agendada para hoje.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardSkeleton: React.FC = () => (
  <div className="p-4 md:p-6 space-y-4 md:space-y-6 animate-pulse">
    <div className="space-y-2">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg"></div>
      <div className="h-64 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);