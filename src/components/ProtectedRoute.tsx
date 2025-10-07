// src/components/ProtectedRoute.tsx - VERSÃO CORRIGIDA
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ TIMEOUT CORRIGIDO - limpa timer em todas as situações
  useEffect(() => {
    // Limpa timer anterior se existir
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (loading) {
      // Inicia novo timer
      timerRef.current = setTimeout(() => {
        console.error('⚠️ Loading timeout - forçando refresh');
        setLoadingTimeout(true);
      }, 15000); // 15 segundos
    } else {
      // Loading completou normalmente
      setLoadingTimeout(false);
    }

    // Cleanup: sempre limpa o timer ao desmontar ou quando loading muda
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [loading]);

  // ✅ Limpa timeout quando componente desmonta
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // ✅ LOADING COM INDICADOR DE PROGRESSO
  if (loading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Carregando aplicação...</p>
          <p className="text-gray-400 text-sm mt-2">Aguarde enquanto verificamos suas credenciais</p>
        </div>
      </div>
    );
  }

  // ✅ TELA DE ERRO PARA LOADING INFINITO - Async/await corrigido
  if (loadingTimeout) {
    const handleReload = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      window.location.reload();
    };

    const handleLogoutAndReload = async () => {
      try {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        await signOut(); // ✅ Aguarda logout completar
        window.location.reload();
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
        window.location.reload(); // Força reload mesmo com erro
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
              O aplicativo está demorando muito para carregar.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Possíveis causas: conexão lenta, servidor indisponível ou problemas de autenticação.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleReload}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🔄 Recarregar Página
              </button>
              <button
                onClick={handleLogoutAndReload}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🚪 Fazer Logout e Tentar Novamente
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.reload();
                }}
                className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              >
                🗑️ Limpar Cache e Recarregar
              </button>
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
