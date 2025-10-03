// src/components/ProtectedRoute.tsx
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Auth/Login';
import { AccountSetup } from './Auth/AccountSetup';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, profile, signOut, accountSetup } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // NOVO: Verifica se a conta está em configuração
  if (!accountSetup) {
    return <AccountSetup />;
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
