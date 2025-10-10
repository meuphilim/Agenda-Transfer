// src/components/SessionMonitor.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { checkSupabaseHealth } from '../lib/supabase';
import { 
  ClockIcon, 
  SignalIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

interface SessionMonitorProps {
  showInDev?: boolean;
}

export const SessionMonitor: React.FC<SessionMonitorProps> = ({ 
  showInDev = true 
}) => {
  const { user, session } = useAuth();
  const [supabaseHealth, setSupabaseHealth] = useState<{
    status: 'healthy' | 'unhealthy';
    latency?: number;
    error?: string;
  } | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [sessionAge, setSessionAge] = useState<string>('');

  // Oculta em produção se não for explicitamente habilitado
  if (!showInDev && !import.meta.env.DEV) {
    return null;
  }

  // Verifica saúde do Supabase
  const checkHealth = async () => {
    const health = await checkSupabaseHealth();
    setSupabaseHealth(health);
    setLastCheck(new Date());
  };

  // Calcula idade da sessão
  useEffect(() => {
    if (!session?.expires_at) return;

    const updateAge = () => {
      const expiresAt = new Date(session.expires_at! * 1000);
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();
      
      if (diff <= 0) {
        setSessionAge('Expirada');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        setSessionAge(`${hours}h ${minutes % 60}m`);
      } else {
        setSessionAge(`${minutes}m`);
      }
    };

    updateAge();
    const interval = setInterval(updateAge, 60000); // Atualiza a cada 1 minuto

    return () => clearInterval(interval);
  }, [session]);

  // Verifica saúde periodicamente
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // A cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <SignalIcon className="h-4 w-4 mr-2 text-blue-600" />
            Monitor de Sessão
          </h3>
          <button
            onClick={checkHealth}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Atualizar"
          >
            <ArrowPathIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Status do Supabase */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600">Status Supabase:</span>
            <div className="flex items-center">
              {supabaseHealth?.status === 'healthy' ? (
                <>
                  <CheckCircleIcon className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">Online</span>
                </>
              ) : (
                <>
                  <XCircleIcon className="h-4 w-4 text-red-500 mr-1" />
                  <span className="text-red-600 font-medium">Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Latência */}
          {supabaseHealth?.latency && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Latência:</span>
              <span className={`font-medium ${
                supabaseHealth.latency < 200 ? 'text-green-600' :
                supabaseHealth.latency < 500 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {supabaseHealth.latency}ms
              </span>
            </div>
          )}

          {/* Idade da Sessão */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-600 flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              Expira em:
            </span>
            <span className={`font-medium ${
              sessionAge === 'Expirada' ? 'text-red-600' :
              sessionAge.includes('h') ? 'text-green-600' :
              'text-yellow-600'
            }`}>
              {sessionAge}
            </span>
          </div>

          {/* Email do Usuário */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
            <span className="text-gray-600">Usuário:</span>
            <span className="text-gray-900 font-medium truncate max-w-[180px]" title={user.email || ''}>
              {user.email}
            </span>
          </div>

          {/* Token Info (apenas em dev) */}
          {import.meta.env.DEV && session && (
            <div className="pt-2 border-t border-gray-100">
              <details className="text-xs">
                <summary className="cursor-pointer text-gray-600 hover:text-gray-900">
                  Detalhes Técnicos
                </summary>
                <div className="mt-2 space-y-1 text-xs text-gray-500 font-mono">
                  <div>Token: {session.access_token.slice(0, 20)}...</div>
                  <div>Provider: {session.user?.app_metadata?.provider || 'email'}</div>
                  <div>Última verificação: {lastCheck.toLocaleTimeString()}</div>
                </div>
              </details>
            </div>
          )}
        </div>

        {/* Indicador de Desenvolvimento */}
        {import.meta.env.DEV && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
              🔧 Modo Desenvolvimento
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
