import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  Users,
  Landmark
} from 'lucide-react';
import { SidebarRoot, SidebarBody, useSidebar } from './SidebarComponents';
import { cn } from '../../lib/utils';

// ==================== TIPOS ====================

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ==================== NAVEGAÇÃO ====================

const getNavigation = (isAdmin: boolean): NavigationItem[] => [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Agenda', href: '/agenda', icon: CalendarDays },
  { name: 'Cadastros', href: '/cadastros', icon: Settings },
  ...(isAdmin ? [
    { name: 'Gerenciar Usuários', href: '/usuarios', icon: Users },
    { name: 'Financeiro', href: '/financeiro', icon: Landmark }
  ] : []),
];

// ==================== COMPONENTE INTERNO ====================

const SidebarContent = () => {
  const { user, profile, signOut, isAdmin, refreshProfile } = useAuth();
  const { open } = useSidebar();
  const navigation = getNavigation(isAdmin);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Atualiza perfil quando usuário existe mas perfil está incompleto
  useEffect(() => {
    if (user && profile && !profile.full_name) {
      void refreshProfile();
    }
  }, [user, profile, refreshProfile]);

  const handleSignOut = async () => {
    if (signingOut) return;

    try {
      setSigningOut(true);
      await signOut();
      
      // Limpa storage local
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('Erro ao limpar storage:', storageError);
      }

      toast.info('Logout realizado com sucesso');
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout. Tente novamente.');
      setSigningOut(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
        {/* Header com Logo (Desktop) */}
        <div className="hidden md:flex items-center justify-center h-16 px-2 bg-gradient-to-r from-blue-600 to-blue-700 -mx-4 -mt-4">
            <AnimatePresence>
            {open && (
                <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xl font-bold text-white whitespace-nowrap"
                >
                TourManager
                </motion.h1>
            )}
            </AnimatePresence>

            {!open && (
            <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-blue-600 font-bold text-lg">T</span>
            </div>
            )}
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-1 py-4">
            {navigation.map((item) => (
            <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                cn(
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                    isActive
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
                }
            >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <motion.span
                animate={{
                    opacity: open ? 1 : 0,
                    display: open ? 'inline-block' : 'none',
                }}
                className="ml-3 whitespace-nowrap"
                >
                {item.name}
                </motion.span>
            </NavLink>
            ))}
        </nav>

        {/* Seção do Usuário */}
        <div className="py-4 border-t border-gray-200 space-y-1">

            {/* Botão de Perfil */}
            <button
            onClick={() => setShowProfileModal(true)}
            disabled={signingOut || !profile}
            className={cn(
                'w-full group flex items-start px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            >
            <User className="h-5 w-5 flex-shrink-0 mt-0.5" />

            <motion.div
                animate={{
                opacity: open ? 1 : 0,
                display: open ? 'flex' : 'none',
                }}
                className="ml-3 flex flex-col items-start min-w-0 flex-1 text-left"
            >
                <span className="truncate w-full">
                {profile?.full_name ?? user?.email?.split('@')[0] ?? 'Usuário'}
                </span>
                {isAdmin ? (
                <span className="text-xs text-blue-600 font-semibold">
                    Administrador
                </span>
                ) : profile?.full_name ? (
                <span className="text-xs text-gray-500 truncate w-full">
                    {user?.email ?? '...'}
                </span>
                ) : (
                <span className="text-xs text-orange-600 font-medium">
                    Completar perfil
                </span>
                )}
            </motion.div>
            </button>

            {/* Botão de Logout */}
            <button
            onClick={handleSignOut}
            disabled={signingOut}
            className={cn(
                'w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                'text-gray-600 hover:bg-red-50 hover:text-red-600',
                'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            >
            {signingOut ? (
                <>
                <svg
                    className="animate-spin h-5 w-5 flex-shrink-0"
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
                <motion.span
                    animate={{
                    opacity: open ? 1 : 0,
                    display: open ? 'inline-block' : 'none',
                    }}
                    className="ml-3"
                >
                    Saindo...
                </motion.span>
                </>
            ) : (
                <>
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <motion.span
                    animate={{
                    opacity: open ? 1 : 0,
                    display: open ? 'inline-block' : 'none',
                    }}
                    className="ml-3"
                >
                    Sair
                </motion.span>
                </>
            )}
            </button>
        </div>

        {/* Modal de Perfil */}
        <ProfileModal
            isOpen={showProfileModal}
            onClose={() => setShowProfileModal(false)}
        />
    </div>
  );
};

// ==================== COMPONENTE PRINCIPAL ====================

export const Sidebar = () => {
  return (
    <SidebarRoot animate>
      <SidebarBody>
        <SidebarContent />
      </SidebarBody>
    </SidebarRoot>
  );
};