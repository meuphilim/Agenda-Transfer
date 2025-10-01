
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Auth/Login';
import { supabase } from '../lib/supabase';
import { toast } from 'react-toastify';
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, profile, signOut, refreshProfile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (profile?.status === 'pending') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <ClockIcon className="h-8 w-8 text-yellow-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Pendente</h2>
              <p className="text-gray-600 mb-6">
                Sua conta foi criada com sucesso e está aguardando aprovação do administrador. 
                Você receberá acesso assim que sua conta for aprovada.
              </p>
              <div className="space-y-3">
                <button
                  onClick={refreshProfile}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Verificar Status
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile?.status === 'inactive') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conta Desativada</h2>
              <div>
                <p className="text-gray-600 mb-6">
                  Sua conta foi desativada pelo administrador. Entre em contato com o suporte 
                  para mais informações sobre a reativação.
                </p>
                <button
                  onClick={() => signOut()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se o usuário não tem perfil, pode ser um usuário novo que ainda não foi processado
  if (user && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-lg w-full mx-4">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Configurando sua conta...</h2>
              <p className="text-gray-600 mb-6">
                Estamos finalizando a configuração do seu perfil. Isso pode levar alguns instantes.
              </p>
              <div className="space-y-3">
                <button
                  onClick={refreshProfile}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Tentar Novamente
                </button>
                <button
                  onClick={async () => {
                    // Força a criação do perfil
                    try {
                      const { data, error } = await supabase
                        .from('profiles')
                        .insert([
                          {
                            id: user.id,
                            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuário',
                            phone: user.user_metadata?.phone || null,
                            is_admin: false,
                            status: 'pending'
                          }
                        ])
                        .select()
                        .single();
                      
                      if (!error && data) {
                        await refreshProfile();
                        toast.success('Perfil criado com sucesso!');
                      } else {
                        toast.error('Erro ao criar perfil: ' + (error?.message || 'Erro desconhecido'));
                      }
                    } catch (error: any) {
                      toast.error('Erro ao criar perfil: ' + error.message);
                    }
                  }}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Criar Perfil Manualmente
                </button>
                <button
                  onClick={() => signOut()}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
                >
                  Sair
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Usuário autenticado e com perfil ativo
  if (user && profile && profile.status === 'active') {
    return <>{children}</>;
  }

  // Fallback - redireciona para login
  return <Login />;
};