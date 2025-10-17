import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { 
  CalendarDays,
  Truck,
  ClipboardList,
  CheckCircle,
  AlertTriangle,
  Package,
  Users,
} from 'lucide-react';
import { cn } from '../lib/utils';

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

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalPackages: 0,
    activePackages: 0,
    availableVehicles: 0,
    busyDrivers: 0,
    upcomingToday: 0,
  });
  const [recentPackages, setRecentPackages] = useState<RecentPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [packagesResult, vehiclesResult, driversResult, upcomingResult, recentResult] = await Promise.all([
        supabase.from('packages').select('id, status'),
        supabase.from('vehicles').select('status').eq('status', 'available'),
        supabase.from('drivers').select('status').eq('status', 'busy'),
        supabase
          .from('package_attractions')
          .select('id')
          .eq('scheduled_date', today),
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

      const packages = packagesResult.data ?? [];

      setStats({
        totalPackages: packages.length,
        activePackages: packages.filter(p => ['confirmed', 'in_progress'].includes(p.status)).length,
        availableVehicles: vehiclesResult.data?.length ?? 0,
        busyDrivers: driversResult.data?.length ?? 0,
        upcomingToday: upcomingResult.data?.length ?? 0,
      });

      setRecentPackages(recentResult.data as RecentPackage[] ?? []);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
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

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100';
  };

  const getStatusText = (status: string) => {
    const statusText = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      in_progress: 'Em Andamento',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    };
    return statusText[status as keyof typeof statusText] || status;
  };

  if (loading) {
    return <DashboardSkeleton />;
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
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h3 className="text-base md:text-lg font-semibold">
              Alertas e Notificações
            </h3>
          </div>
          <div className="p-4 md:p-6 space-y-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <CalendarDays className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">
                  {stats.upcomingToday} atividades
                </p>
                <p className="text-xs text-gray-500">
                  Programadas para hoje
                </p>
              </div>
            </div>
            {stats.busyDrivers > 0 && (
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-800">
                    {stats.busyDrivers} motoristas
                  </p>
                   <p className="text-xs text-gray-500">
                    Atualmente em atividade
                  </p>
                </div>
              </div>
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
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
      <div className="lg:col-span-2 h-64 bg-gray-200 rounded-lg"></div>
      <div className="h-64 bg-gray-200 rounded-lg"></div>
    </div>
  </div>
);