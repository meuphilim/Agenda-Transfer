// src/components/ProtectedRoute.tsx
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Auth/Login';
import { CompleteProfile } from './Auth/CompleteProfile';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, profile, signOut, needsProfileCompletion } = useAuth();
  const location = useLocation();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // ✅ TIMEOUT PARA LOADING INFINITO - força refresh após 15 segundos
  useEffect(() => {
    let timer: NodeJS.Timeout;

  if (loading) {
        timer = setTimeout(() => {
        console.error('⚠️ Loading timeout - forçando refresh');
        setLoadingTimeout(true);
      }, 15000); // 15 segundos
    } else {
      setLoadingTimeout(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading]);

  // ✅ LOADING COM TIMEOUT E OPÇÃO DE REFRESH
  if (loading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
                <div className=\"text-center\">
          <div className=\"animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4\"></div>
          <p className=\"text-gray-600\">Carregando aplicação...</p>
        </div>
      </div>
    );
  }

  // ✅ TELA DE ERRO PARA LOADING INFINITO
  if (loadingTimeout) {
    return (
      <div className=\"flex items-center justify-center min-h-screen bg-gray-50\">
        <div className=\"max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg text-center\">
          <div>
            <h2 className=\"text-2xl font-bold text-red-600 mb-4\">Tempo Limite Excedido</h2>
            <p className=\"text-gray-600 mb-4\">
              O aplicativo está demorando muito para carregar. Isso pode indicar um problema de conexão.
            </p>
            <div className=\"space-y-2\">
              <button
                onClick={() => window.location.reload()}
                className=\"w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"
              >
                Recarregar Página
              </button>
              <button
                onClick={() => {
                  signOut();
                  window.location.reload();
                }}
                className=\"w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500\"
              >
                Fazer Logout e Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // Verifica se precisa completar perfil
  if (needsProfileCompletion) {
    return <CompleteProfile />;
  }

  // Resto do código permanece igual...
  if (profile?.status === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Conta Pendente</h2>
            <p className="mt-2 text-gray-600">
              Sua conta está aguardando aprovação do administrador.
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (profile?.status === 'inactive') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Conta Desativada</h2>
            <p className="mt-2 text-gray-600">
              Sua conta foi desativada. Entre em contato com o administrador.
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
