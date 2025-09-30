
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileModal } from '../Profile/ProfileModal';
import { 
  HomeIcon, 
  CalendarDaysIcon, 
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

import { UserGroupIcon } from '@heroicons/react/24/outline';

const getNavigation = (isAdmin: boolean): NavigationItem[] => [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Agenda', href: '/agenda', icon: CalendarDaysIcon },
  { name: 'Reservas', href: '/reservas', icon: ClipboardDocumentListIcon },
  { name: 'Cadastros', href: '/cadastros', icon: Cog6ToothIcon },
  ...(isAdmin ? [{ name: 'Usuários', href: '/usuarios', icon: UserGroupIcon }] : []),
];

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const { user, profile, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const navigation = getNavigation(isAdmin);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg border-r border-gray-200 h-screen">
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-center h-16 px-4 bg-blue-600">
          <h1 className="text-xl font-bold text-white">TourManager</h1>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
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
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-gray-200">
          <button
            onClick={() => setShowProfileModal(true)}
            className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
          >
            <div className="flex-1 flex items-center">
              <UserIcon className="mr-3 h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium truncate">{profile?.full_name || user?.email}</span>
                {isAdmin && (
                  <span className="text-xs text-blue-600">Administrador</span>
                )}
              </div>
            </div>
          </button>
          
          <button
            onClick={handleSignOut}
            className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
            Sair
          </button>

          <ProfileModal 
            isOpen={showProfileModal} 
            onClose={() => setShowProfileModal(false)} 
          />
        </div>
      </div>
    </div>
  );
};