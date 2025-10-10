// src/pages/Settings.tsx - VERSÃO CORRIGIDA COM HEARTBEAT
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeRemaining } from '../hooks/useSessionHeartbeat';
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  TruckIcon, 
  MapPinIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { AgenciesManager } from '../components/Settings/AgenciesManager';
import { DriversManager } from '../components/Settings/DriversManager';
import { VehiclesManager } from '../components/Settings/VehiclesManager';
import { AttractionsManager } from '../components/Settings/AttractionsManager';

export const Settings = () => {
  const { user, profile, sessionMetrics, resetSessionTimer } = useAuth();
  const [activeTab, setActiveTab] = useState<'agencies' | 'drivers' | 'vehicles' | 'attractions'>('agencies');
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

  const tabs = [
    { id: 'agencies', name: 'Agências', icon: BuildingOfficeIcon },
    { id: 'drivers', name: 'Motoristas', icon: UserIcon },
    { id: 'vehicles', name: 'Veículos', icon: TruckIcon },
    { id: 'attractions', name: 'Atrações', icon: MapPinIcon },
  ];

  return (
    <div className="p-6">
      {/* Header com informações de sessão */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerenciamento de cadastros do sistema
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

      {/* Navegação por Abas */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    resetSessionTimer();
                  }}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo das Abas */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="p-6">
          {activeTab === 'agencies' && (
            <div onClick={() => resetSessionTimer()}>
              <AgenciesManager />
            </div>
          )}
          {activeTab === 'drivers' && (
            <div onClick={() => resetSessionTimer()}>
              <DriversManager />
            </div>
          )}
          {activeTab === 'vehicles' && (
            <div onClick={() => resetSessionTimer()}>
              <VehiclesManager />
            </div>
          )}
          {activeTab === 'attractions' && (
            <div onClick={() => resetSessionTimer()}>
              <AttractionsManager />
            </div>
          )}
        </div>
      </div>

      {/* Informações de Segurança */}
      {sessionMetrics && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <HeartIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Monitoramento de Sessão Ativo
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Sua sessão está sendo monitorada com heartbeat ativo. 
                  {sessionMetrics.isRunning 
                    ? ' O sistema está funcionando corretamente.' 
                    : ' Houve um problema com o monitoramento.'
                  }
                </p>
                <p className="mt-1">
                  Sua atividade é rastreada para manter a sessão segura. 
                  Interaja com qualquer elemento para resetar o timer de inatividade.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
