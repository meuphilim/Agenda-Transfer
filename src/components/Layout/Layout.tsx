// src/components/Layout/Layout.tsx - VERSÃO COM MONITORAMENTO DE ATIVIDADE
import { Sidebar } from './Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect } from 'react';
import { formatTimeRemaining } from '../../hooks/useSessionHeartbeat';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { resetSessionTimer, sessionMetrics } = useAuth();

  // Monitorar atividade em toda a área do layout
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

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header com informações de sessão */}
        {sessionMetrics && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`w-2 h-2 rounded-full ${
                  sessionMetrics.isRunning ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  Sessão: {formatTimeRemaining(
                    Number(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000
                  )}
                </span>
                {sessionMetrics.lastHeartbeat && (
                  <span className="text-xs text-gray-500">
                    Último heartbeat: {sessionMetrics.lastHeartbeat.toLocaleTimeString()}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                Heartbeats: {sessionMetrics.heartbeatCount}
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};
