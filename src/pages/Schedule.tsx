// src/pages/Schedule.tsx - VERSÃO CORRIGIDA COM HEARTBEAT
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatTimeRemaining } from '../hooks/useSessionHeartbeat';
import { CalendarDaysIcon, ClockIcon, TruckIcon, UserIcon } from '@heroicons/react/24/outline';

export const Schedule = () => {
  const { user, profile, sessionMetrics, resetSessionTimer } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTimeLeft, setSessionTimeLeft] = useState<number>(0);

  // Monitorar atividade na página
  useEffect(() => {
    const handleActivity = () => {
      resetSessionTimer();
    };

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

  // Atualizar tempo restante da sessão
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

  const { data: schedules, loading, error } = useSupabaseData({
    table: 'package_attractions',
    select: '*, packages(*, agencies(name), vehicles(license_plate, model), drivers(name)), attractions(name, location)',
    filters: { scheduled_date: selectedDate },
    orderBy: { column: 'start_time', ascending: true },
    realtime: true,
    enabled: true
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header com informações de sessão */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agenda</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerenciamento de agendamentos e horários
            </p>
          </div>
          
          {/* Status da Sessão */}
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
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Seletor de Data */}
      <div className="mb-6">
        <div className="flex items-center space-x-4">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Data:
          </label>
          <input
            type="date"
            id="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              resetSessionTimer(); // Reset timer ao mudar data
            }}
            className="block w-auto px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <button
            onClick={() => {
              setSelectedDate(new Date().toISOString().split('T')[0]);
              resetSessionTimer();
            }}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Hoje
          </button>
        </div>
      </div>

      {/* Grade de Horários */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Horários do Dia
          </h3>
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Erro ao carregar agendamentos: {error}</p>
            </div>
          )}

          {schedules && schedules.length > 0 ? (
            <div className="space-y-4">
              {schedules.map((schedule: any) => (
                <div 
                  key={schedule.id} 
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => resetSessionTimer()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {schedule.packages?.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          {schedule.attractions?.name} • {schedule.attractions?.location}
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {schedule.start_time} - {schedule.end_time || 'Sem horário definido'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {schedule.packages?.agencies?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {schedule.packages?.vehicles?.license_plate} • {schedule.packages?.drivers?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agendamento encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Não há agendamentos para a data selecionada.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
