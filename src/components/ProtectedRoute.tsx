// src/components/ProtectedRoute.tsx - VERSÃO FINAL CORRIGIDA
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Auth/Login';
import { CompleteProfile } from './Auth/CompleteProfile';
import { useEffect, useState, useRef } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, profile, signOut, needsProfileCompletion, refreshProfile } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CORREÇÃO: useEffect para polling de status movido para o topo do componente.
  // Garante que o hook seja chamado incondicionalmente, respeitando as regras do React.
  useEffect(() => {
    // A lógica de polling só é ativada se o perfil estiver no estado 'pending'.
    if (profile?.status === 'pending') {
      const intervalId = setInterval(() => {
        console.log('⏳ Verificando status da conta...');
        refreshProfile();
      }, 5000); // Verifica a cada 5 segundos

      // Limpa o intervalo quando o componente é desmontado ou o status muda.
      return () => clearInterval(intervalId);
    }
  }, [profile, refreshProfile]);

  // Gestão de timeout de carregamento inicial
  useEffect(() => {
    if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);

    if (loading) {
      loadingTimerRef.current = setTimeout(() => {
        console.error('⚠️ Timeout: A aplicação demorou muito para carregar.');
        setLoadingTimeout(true);
      }, 15000); // Aumentado para 15 segundos
    } else {
      setLoadingTimeout(false);
    }

    return () => {
      if (loadingTimerRef.current) clearTimeout(loadingTimerRef.current);
    };
  }, [loading]);

  // --- RENDERIZAÇÃO CONDICIONAL ---

  // 1. Estado de Carregamento Inicial
  if (loading && !loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Carregando aplicação...</p>
          <p className="text-gray-400 text-sm mt-2">Verificando suas credenciais...</p>
        </div>
      </div>
    );
  }

  // 2. Estado de Timeout de Carregamento
  if (loadingTimeout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Tempo Limite Excedido</h2>
          <p className="text-gray-600 mb-4">A aplicação não conseguiu carregar. Tente limpar o cache ou recarregar a página.</p>
          <button onClick={() => window.location.reload()} className="w-full py-3 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700">
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  // 3. Usuário não autenticado
  if (!user) {
    return <Login />;
  }

  // 4. Perfil incompleto
  if (needsProfileCompletion) {
    return <CompleteProfile />;
  }

  // 5. Perfil pendente ou inativo
  if (!profile || profile.status === 'pending' || profile.status === 'inactive') {
    const isPending = !profile || profile.status === 'pending';
    const statusText = isPending
      ? 'Sua conta está aguardando aprovação do administrador.'
      : 'Sua conta foi desativada. Entre em contato com o suporte.';

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white shadow-lg rounded-lg text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {isPending ? 'Conta Pendente' : 'Conta Desativada'}
          </h2>
          <p className="text-gray-600 mb-4">{statusText}</p>
          {isPending && (
            <div className="flex items-center justify-center space-x-2 my-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-900"></div>
              <p className="text-gray-500 text-sm">Verificando status...</p>
            </div>
          )}
          <button onClick={() => signOut()} className="w-full py-2 px-4 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700">
            Sair
          </button>
        </div>
      </div>
    );
  }

  // 6. Usuário autenticado e ativo
  return <>{children}</>;
};