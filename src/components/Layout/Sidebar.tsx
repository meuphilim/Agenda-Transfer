import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  HomeIcon, 
  CalendarDaysIcon, 
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TruckIcon,
  MapPinIcon,
  UserIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Agenda', href: '/agenda', icon: CalendarDaysIcon },
  { name: 'Reservas', href: '/reservas', icon: ClipboardDocumentListIcon },
  { name: 'Agências', href: '/agencias', icon: UserGroupIcon },
  { name: 'Veículos', href: '/veiculos', icon: TruckIcon },
  { name: 'Atrativos', href: '/atrativos', icon: MapPinIcon },
  { name: 'Motoristas', href: '/motoristas', icon: UserIcon },
];

export const Sidebar: React.FC = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

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
          <div className="flex items-center px-2 py-2 text-sm text-gray-600">
            <UserIcon className="mr-3 h-5 w-5" />
            <span className="truncate">{user?.email}</span>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200"
          >
            <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
};