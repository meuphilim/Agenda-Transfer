
import { useAuth } from '../contexts/AuthContext';
import { Login } from './Auth/Login';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    // Salvar a URL atual para redirecionar depois do login
    return <Login />;
  }

  // Se o usuário está tentando acessar a página de login e já está autenticado,
  // redireciona para o dashboard
  if (location.pathname === '/login') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};