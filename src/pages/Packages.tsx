// src/pages/Packages.tsx - VERSÃO CORRIGIDA COM HEARTBEAT
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { formatTimeRemaining } from '../hooks/useSessionHeartbeat';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CalendarDaysIcon,
  TruckIcon,
  UserIcon,
  HeartIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export const Packages = () => {
  const { user, profile, sessionMetrics, resetSessionTimer } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
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

  const { data: packages, loading, error, refresh } = useSupabaseData({
    table: 'packages',
    select: '*, agencies(name), vehicles(license_plate, model, capacity), drivers(name, phone)',
    orderBy: { column: 'created_at', ascending: false },
    realtime: true,
    enabled: true
  });

  const handleNewPackage = () => {
    setSelectedPackage(null);
    setShowModal(true);
    resetSessionTimer();
  };

  const handleEditPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowModal(true);
    resetSessionTimer();
  };

  const handleViewPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowModal(true);
    resetSessionTimer();
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este pacote?')) return;
    resetSessionTimer();
    
    try {
      const { error } = await supabase.from('packages').delete().eq('id', id);
      if (error) throw error;
      refresh();
    } catch (error) {
      console.error('Erro ao excluir pacote:', error);
    }
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
      {/* Header com informações de sessão */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pacotes</h1>
            <p className="mt-1 text-sm text-gray-500">
              Gerenciamento de pacotes turísticos
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

      {/* Botão Novo Pacote */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleNewPackage}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Pacote
          </button>
          
          <button
            onClick={() => {
              refresh();
              resetSessionTimer();
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ClockIcon className="h-5 w-5 mr-2" />
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista de Pacotes */}
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">Erro ao carregar pacotes: {error}</p>
            </div>
          )}

          {packages && packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewPackage(pkg)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900 truncate">
                      {pkg.title}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPackage(pkg);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar pacote"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePackage(pkg.id);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir pacote"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarDaysIcon className="h-4 w-4 mr-2" />
                      <span>{new Date(pkg.start_date).toLocaleDateString('pt-BR')} - {new Date(pkg.end_date).toLocaleDateString('pt-BR')}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <TruckIcon className="h-4 w-4 mr-2" />
                      <span>{pkg.vehicles?.license_plate} - {pkg.vehicles?.model}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2" />
                      <span>{pkg.drivers?.name}</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <span className="text-xs">Agência: {pkg.agencies?.name}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pkg.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        pkg.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        pkg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        pkg.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pkg.status === 'confirmed' ? 'Confirmado' :
                         pkg.status === 'in_progress' ? 'Em Andamento' :
                         pkg.status === 'pending' ? 'Pendente' :
                         pkg.status === 'cancelled' ? 'Cancelado' : 'Concluído'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {pkg.total_participants} pessoas
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pacote encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando um novo pacote turístico.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleNewPackage}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Novo Pacote
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
