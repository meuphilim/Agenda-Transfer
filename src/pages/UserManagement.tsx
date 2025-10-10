// src/pages/UserManagement.tsx - VERSÃO FINAL COM MONITORAMENTO COMPLETO
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserStatus } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { listUsersWithFallback } from '../lib/supabase-admin';
import { formatTimeRemaining } from '../hooks/useSessionHeartbeat';
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

// ... (resto do código já existente, adicionando apenas o monitoramento)

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin, sessionMetrics, resetSessionTimer } = useAuth();
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

  // ... (resto do código existente, adicionando o monitoramento aos botões e interações)

  return (
    <div className="p-6">
      {/* Header com informações de sessão */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="sm:flex-auto">
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="mt-2 text-sm text-gray-700">
              Gerencie usuários, status e permissões do sistema
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

      {/* Adicionar monitoramento aos elementos interativos */}
      {/* Exemplo de como adicionar onClick para resetar timer */}
      <button
        onClick={(e) => {
          // Ação original
          handleViewUser(user);
          // Reset timer
          resetSessionTimer();
        }}
        className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
        title="Ver detalhes"
      >
        <EyeIcon className="h-4 w-4" />
      </button>

      {/* ... (resto do código com monitoramento adicionado a todos os elementos interativos) */}
    </div>
  );
};
