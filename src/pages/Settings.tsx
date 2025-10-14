import { useState } from 'react';
import { 
  Users,
  Truck,
  User,
  MapPin,
} from 'lucide-react';
import { Agencies } from './Agencies';
import { Vehicles } from './Vehicles';
import { Drivers } from './Drivers';
import { Attractions } from './Attractions';

const tabs = [
  { name: 'Agências', icon: Users, component: Agencies },
  { name: 'Veículos', icon: Truck, component: Vehicles },
  { name: 'Motoristas', icon: User, component: Drivers },
  { name: 'Atrativos', icon: MapPin, component: Attractions },
];

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Cadastros</h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie os cadastros do sistema
        </p>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Abas */}
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab, index) => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(index)}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10 ${
                  activeTab === index
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-center">
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Conteúdo */}
        <div className="p-0">
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
};