// src/components/ProtectedRoute.tsx - VERSÃO OTIMIZADA COM GESTÃO DE SESSÃO
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
  const LOADING_TIMEOUT = 30000; // 30 segundos para carregamento inicial
  const SESSION_TIMEOUT = Number(import.meta.env.VITE_SESSION_TIMEOUT) || 1800000; // 30 minutos (padrão)

  // ✅ GESTÃO DE TIMEOUT DE LOADING (apenas para carregamento inicial)
  useEffect(() => {
    // Limpa timer anterior
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }

    if (loading) {
      // Timer mais longo (30s) para dar tempo de carregar
      loadingTimerRef.current = setTimeout(() => {
        console.error('⚠️ Loading timeout - aplicação demorou muito para carregar');
        setLoadingTimeout(true);
      }, LOADING_TIMEOUT);
    } else {
      setLoadingTimeout(false);
    }

    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [loading, LOADING_TIMEOUT]);

  // ✅ GESTÃO DE SESSÃO DE INATIVIDADE
  useEffect(() => {
    if (!user) return; // Só gerencia sessão se usuário está logado

    let lastActivity = Date.now();

    const resetSessionTimer = () => {
      lastActivity = Date.now();
      
      // Limpa timer anterior
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }

      // Cria novo timer de sessão
      sessionTimerRef.current = setTimeout(() => {
        const inactiveTime = Date.now() - lastActivity;
        
        // Se realmente ficou inativo pelo tempo configurado
        if (inactiveTime >= SESSION_TIMEOUT) {
          console.log('⏱️ Sessão expirada por inatividade');
          handleSessionExpired();
        }
      }, SESSION_TIMEOUT);
    };

    const handleSessionExpired = async () => {
      try {
        await signOut();
        // Mostra notificação de sessão expirada
        alert('Sua sessão expirou por inatividade. Faça login novamente.');
      } catch (error) {
        console.error('Erro ao encerrar sessão:', error);
      }
    };

    // Eventos que resetam o timer de inatividade
    const activityEvents = [
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
      'click',
      'mousemove'
    ];

    // Throttle para evitar muitos resets (máximo 1 reset por segundo)
    let canReset = true;
    const handleActivity = () => {
      if (canReset) {
        resetSessionTimer();
        canReset = false;
        setTimeout(() => { canReset = true; }, 1000);
      }
    };

    // Registra listeners de atividade
    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Inicia timer de sessão
    resetSessionTimer();

    // Cleanup
    return () => {
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [user, SESSION_TIMEOUT, signOut]);

  // ✅ LOADING COM INDICADOR DE PROGRESSO
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

  // ✅ TELA DE ERRO PARA LOADING INFINITO
  if (loadingTimeout) {
    const handleReload = () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
      window.location.reload();
    };

    const handleLogoutAndReload = async () => {
      try {
        if (loadingTimerRef.current) {
          clearTimeout(loadingTimerRef.current);
        }
        await signOut();
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg text-center">
          <div>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-4">Tempo Limite Excedido</h2>
            <p className="text-gray-600 mb-2">
              A aplicação demorou mais de 30 segundos para carregar.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Possíveis causas: conexão lenta, servidor indisponível ou cache corrompido.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleReload}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recarregar Página
              </button>
              <button
                onClick={handleLogoutAndReload}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Limpar Sessão e Tentar Novamente
              </button>
            </div>
            <div className="mt-6 text-xs text-gray-500">
              <p>Se o problema persistir:</p>
              <ul className="mt-2 space-y-1 text-left list-disc list-inside">
                <li>Verifique sua conexão com a internet</li>
                <li>Tente usar outro navegador</li>
                <li>Entre em contato com o suporte</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Se não há usuário, mostra tela de login
  if (!user) {
    return <Login />;
  }

  // ✅ Verifica se precisa completar perfil
  if (needsProfileCompletion) {
    return <CompleteProfile />;
  }

  // ✅ Verifica status da conta - PENDING
  if (profile?.status === 'pending') {
    const handleSignOut = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
              <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Conta Pendente</h2>
            <p className="mt-2 text-gray-600">
              Sua conta está aguardando aprovação do administrador.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Você receberá um email quando sua conta for aprovada.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // ✅ Verifica status da conta - INACTIVE
  if (profile?.status === 'inactive') {
    const handleSignOut = async () => {
      try {
        await signOut();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    };

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Conta Desativada</h2>
            <p className="mt-2 text-gray-600">
              Sua conta foi desativada. Entre em contato com o administrador.
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  // ✅ Previne acesso direto à rota /login quando já autenticado
  if (location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
