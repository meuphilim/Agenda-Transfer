import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../Profile/ProfileModal';
import { toast } from 'react-toastify';
import { 
  Home,
  CalendarDays,
  ClipboardList,
  Settings,
  User,
  LogOut,
  Users
} from 'lucide-react';

const getNavigation = (isAdmin: boolean): NavigationItem[] => [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Reservas', href: '/reservas', icon: ClipboardList },
  { name: 'Cadastros', href: '/cadastros', icon: Settings },
  ...(isAdmin ? [{ name: 'Gerenciar Usuários', href: '/usuarios', icon: Users }] : []),
];

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const { user, profile, signOut, isAdmin, refreshProfile } = useAuth();
  const navigation = getNavigation(isAdmin);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // ✅ NOVO: Atualiza perfil quando usuário existe mas perfil está incompleto
  useEffect(() => {
    if (user && profile && !profile.full_name) {
      // Se perfil existe mas está incompleto, tenta atualizar
      refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  // ✅ CORRIGIDO - Remove navigate e adiciona feedback
  const handleSignOut = async () => {
    if (signingOut) return; // Previne múltiplos cliques

    try {
      setSigningOut(true);
      await signOut();
      
      // ✅ Limpa storage local para garantir logout completo
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Erro ao limpar storage:', storageError);
      }

      // ✅ AuthContext já limpa estados e ProtectedRoute redirecionará
      toast.info('Logout realizado com sucesso');
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      
      // ✅ Feedback visual de erro
      toast.error('Erro ao fazer logout. Tente novamente.');
      setSigningOut(false); // Permite tentar novamente
    }
    // Nota: Não resetamos signingOut em caso de sucesso pois o componente será desmontado
  };

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-200 h-screen">
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-blue-600 to-blue-700">
          <h1 className="text-xl font-bold text-white">TourManager</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Section */}
        <div className="px-2 py-4 border-t border-gray-200 space-y-1">
          {/* Profile Button */}
          <button
            onClick={() => setShowProfileModal(true)}
            disabled={signingOut}
            className="w-full group flex items-start px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <User className="mr-3 h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col items-start min-w-0 flex-1 text-left">
              <span className="truncate w-full">
                {profile.full_name || user.email.split('@')[0] || 'Usuário'}
              </span>
              {isAdmin ? (
                <span className="text-xs text-blue-600 font-semibold">
                  Administrador
                </span>
              ) : profile.full_name ? (
                <span className="text-xs text-gray-500 truncate w-full">
                  {user.email}
                </span>
              ) : (
                <span className="text-xs text-orange-600 font-medium">
                  Completar perfil
                </span>
              )}
            </div>
          </button>
          
          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {signingOut ? (
              <>
                <svg 
                  className="animate-spin mr-3 h-5 w-5 flex-shrink-0" 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24"
                >
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saindo...
              </>
            ) : (
              <>
                <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
                Sair
              </>
            )}
          </button>

          {/* Profile Modal */}
          <ProfileModal 
            isOpen={showProfileModal} 
            onClose={() => setShowProfileModal(false)} 
          />
        </div>
      </div>
    </div>
  );
};
