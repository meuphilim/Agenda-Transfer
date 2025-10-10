// src/pages/Dashboard.tsx - VERSÃO ATUALIZADA COM HEARTBEAT E MONITORAMENTO
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { formatTimeRemaining } from '../hooks/useSessionHeartbeat';
import {
  CalendarDaysIcon,
  TruckIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalPackages: number;
  activePackages: number;
  availableVehicles: number;
  busyDrivers: number;
  upcomingToday: number;
}

interface DashboardProps {
  sessionMetrics?: {
    lastActivity: Date;
    heartbeatCount: number;
    lastHeartbeat: Date | null;
    isRunning: boolean;
  };
  resetSessionTimer: () => void;
}

export const Dashboard: React.FC = () => {
  const { user, profile, sessionMetrics, resetSessionTimer } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPackages: 0,
    activePackages: 0,
    availableVehicles: 0,
    busyDrivers: 0,
    upcomingToday: 0,
  });
  const [recentPackages, setRecentPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);

  // Monitorar atividade do usuário no dashboard
  useEffect(() => {
    const handleActivity = () => {
      resetSessionTimer();
    };

    // Adicionar listeners de atividade
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    const options = { capture: true, passive: true };

    events.forEach(event => {
      document.addEventListener(event, handleActivity, options);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, options);
      });
    };
  }, [resetSessionTimer]);

  // Atualizar tempo restante da sessão em tempo real
  useEffect(() => {
    if (!sessionMetrics) return;

    const timer = setInterval(() => {
      const timeout = Number(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000;
      const timePassed = Date.now() - sessionMetrics.lastActivity.getTime();
      const timeLeft = Math.max(0, timeout - timePassed);
      setSessionTimeLeft(timeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionMetrics]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      const [packagesResult, vehiclesResult, driversResult, upcomingResult, recentResult] = await Promise.all([
        supabase.from('packages').select('*'),
        supabase.from('vehicles').select('status').eq('active', true),
        supabase.from('drivers').select('status').eq('active', true),
        supabase
          .from('package_attractions')
          .select('*, packages(*), attractions(*)')
          .eq('scheduled_date', today),
        supabase
          .from('packages')
          .select(`
            *,
            agencies(name),
            vehicles(license_plate, model),
            drivers(name)
          `)
          .order('created_at', { ascending: false })
          .limit(5)
      ]);

      const packages = packagesResult.data || [];
      const vehicles = vehiclesResult.data || [];
      const drivers = driversResult.data || [];
      const upcoming = upcomingResult.data || [];
      const recent = recentResult.data || [];

      setStats({
        totalPackages: packages.length,
        activePackages: packages.filter(p => ['confirmed', 'in_progress'].includes(p.status)).length,
        availableVehicles: vehicles.filter(v => v.status === 'available').length,
        busyDrivers: drivers.filter(d => d.status === 'busy').length,
        upcomingToday: upcoming.length,
      });

      setRecentPackages(recent);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
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
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header com informações de boas-vindas e status da sessão */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Visão geral do sistema de gestão de turismo
            </p>
            {profile && (
              <p className="mt-2 text-sm text-gray-600">
                Bem-vindo, <span className="font-medium">{profile.full_name}</span>!
              </p>
            )}
          </div>
          
          {/* Status da Sessão com Heartbeat */}
          {sessionMetrics && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-3">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    sessionMetrics.isRunning ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-700">
                    Sessão
                  </span>
                </div>
                
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    sessionTimeLeft > 600000 ? 'text-green-600' :
                    sessionTimeLeft > 300000 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {formatTimeRemaining(sessionTimeLeft)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Tempo restante
                  </div>
                </div>

                {sessionMetrics.lastHeartbeat && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      Último heartbeat
                    </div>
                    <div className="text-xs text-gray-600">
                      {sessionMetrics.lastHeartbeat.toLocaleTimeString()}
                    </div>
                  </div>
                )}

                <div className="text-right">
                  <div className="text-xs text-gray-500">
                    Heartbeats
                  </div>
                  <div className="text-xs text-gray-600">
                    {sessionMetrics.heartbeatCount}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards de Estatísticas com Monitoramento de Atividade */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div 
          className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => resetSessionTimer()}
          title="Clique para resetar timer de inatividade"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Pacotes
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalPackages}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => resetSessionTimer()}
          title="Clique para resetar timer de inatividade"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pacotes Ativos
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.activePackages}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => resetSessionTimer()}
          title="Clique para resetar timer de inatividade"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TruckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Veículos Disponíveis
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.availableVehicles}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div 
          className="bg-white overflow-hidden shadow-lg rounded-lg cursor-pointer hover:shadow-xl transition-shadow"
          onClick={() => resetSessionTimer()}
          title="Clique para resetar timer de inatividade"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Motoristas Ocupados
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.busyDrivers}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Informações do Sistema */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pacotes Recentes */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Pacotes Recentes
              </h3>
              <button
                onClick={() => resetSessionTimer()}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                title="Atualizar timer de atividade"
              >
                <ClockIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentPackages.slice(0, 5).map((pkg, index) => (
                  <li key={pkg.id}>
                    <div className="relative pb-8">
                      {index !== recentPackages.length - 1 && (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      )}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                            <ClipboardDocumentListIcon className="w-5 h-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {pkg.title}
                            </p>
                            <p className="text-sm text-gray-500">
                              {pkg.agencies?.name} • {pkg.vehicles?.license_plate} • {pkg.drivers?.name}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                              {getStatusText(pkg.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Status do Sistema e Alertas */}
        <div className="bg-white shadow-lg rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Status do Sistema
            </h3>
            <div className="space-y-4">
              {/* Status do Heartbeat */}
              {sessionMetrics && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <HeartIcon className={`h-5 w-5 ${
                      sessionMetrics.isRunning ? 'text-green-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      Heartbeat {sessionMetrics.isRunning ? 'ativo' : 'inativo'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {sessionMetrics.heartbeatCount} heartbeats enviados
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CalendarDaysIcon className="h-5 w-5 text-blue-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    {stats.upcomingToday} atividades programadas para hoje
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <TruckIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-700">
                    {stats.availableVehicles} veículos disponíveis para reserva
                  </p>
                </div>
              </div>

              {stats.busyDrivers > 0 && (
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      {stats.busyDrivers} motoristas estão ocupados
                    </p>
                  </div>
                </div>
              )}

              {/* Informações de segurança */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">
                      Sistema monitorado com heartbeat ativo
                    </p>
                    <p className="text-xs text-gray-500">
                      Sua atividade está sendo monitorada para manter a sessão ativa
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
