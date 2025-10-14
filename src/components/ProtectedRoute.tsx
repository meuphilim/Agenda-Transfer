// src/components/ProtectedRoute.tsx - VERSÃO AJUSTADA PARA 10 MINUTOS DE INATIVIDADE
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Auth/Login';
import { CompleteProfile } from './Auth/CompleteProfile';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, profile, signOut, needsProfileCompletion } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CONSTANTES DE TIMEOUT
  const LOADING_TIMEOUT = 10000; // 10 segundos para carregamento inicial
  const SESSION_TIMEOUT = parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '1800000'); // 30 minutos padrão

  // ✅ GESTÃO DE TIMEOUT DE LOADING
  useEffect(() => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    if (loading) {
      loadingTimerRef.current = setTimeout(() => {
        console.error('⚠️ Loading timeout - aplicação demorou muito para carregar');
        setLoadingTimeout(true);
      }, LOADING_TIMEOUT);
    } else {
      setLoadingTimeout(false);
    }

    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [loading]);

  // ✅ GESTÃO DE SESSÃO DE INATIVIDADE (10 MIN)
  useEffect(() => {
    if (!user || loading) return;

    let lastActivity = Date.now();
    let inactivityCheckInterval: NodeJS.Timeout | null = null;

    const handleSessionExpired = async () => {
      try {
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        if (inactivityCheckInterval) clearInterval(inactivityCheckInterval);
        await signOut();
        alert('⏱️ Sua sessão expirou por inatividade. Faça login novamente.');
      } catch (error) {
        console.error('Erro ao encerrar sessão:', error);
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    const resetSessionTimer = () => {
      lastActivity = Date.now();

      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (inactivityCheckInterval) clearInterval(inactivityCheckInterval);

      inactivityCheckInterval = setInterval(() => {
        const inactiveTime = Date.now() - lastActivity;
        if (inactiveTime >= SESSION_TIMEOUT) {
          console.log('⏱️ Sessão expirada por inatividade');
          clearInterval(inactivityCheckInterval);
          handleSessionExpired();
        }
      }, 60000);

      sessionTimerRef.current = setTimeout(() => {
        const inactiveTime = Date.now() - lastActivity;
        if (inactiveTime >= SESSION_TIMEOUT) {
          console.log('⏱️ Sessão expirada por inatividade (fallback)');
          handleSessionExpired();
        }
      }, SESSION_TIMEOUT + 5000);
    };

    // Eventos que resetam o timer de inatividade
    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click', 'mousemove'];
    let canReset = true;
    const handleActivity = () => {
      if (canReset) {
        lastActivity = Date.now();
        canReset = false;
        setTimeout(() => {
          canReset = true;
        }, 1000);
      }
    };

    // Atualiza quando a aba volta ao foco
    const handleFocus = () => {
      lastActivity = Date.now();
    };

    window.addEventListener('focus', handleFocus);
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    resetSessionTimer();

    return () => {
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      if (inactivityCheckInterval) clearInterval(inactivityCheckInterval);
      activityEvents.forEach(event => window.removeEventListener(event, handleActivity));
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, loading, signOut]);

  // ✅ LOADING UI
  if (loading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-blue-600 text-2xl font-bold">
                {Math.floor((Date.now() % 3000) / 1000) + 1}
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-lg font-medium">Carregando aplicação...</p>
          <p className="text-gray-400 text-sm mt-2">Verificando suas credenciais</p>
        </div>
      </div>
    );
  }

  if (loadingTimeout) {
    const handleReload = () => window.location.reload();

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Tempo Limite Excedido</h2>
          <p className="text-gray-600 mb-4">A aplicação demorou mais de 10 segundos para carregar.</p>
          <button
            onClick={handleReload}
            className="w-full py-3 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Recarregar Página
          </button>
           <button
                onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Limpar Sessão e Tentar Novamente
            </button>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;
  if (needsProfileCompletion) return <CompleteProfile />;

  if (profile.status === 'pending' || profile.status === 'inactive') {
    const statusText =
      profile.status === 'pending'
        ? 'Sua conta está aguardando aprovação do administrador.'
        : 'Sua conta foi desativada. Entre em contato com o administrador.';

    const handleSignOut = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {profile.status === 'pending' ? 'Conta Pendente' : 'Conta Desativada'}
          </h2>
          <p className="text-gray-600 mb-4">{statusText}</p>
          <button
            onClick={handleSignOut}
            className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (location.pathname === '/login') return <Navigate to="/" replace />;

  return <>{children}</>;
};
