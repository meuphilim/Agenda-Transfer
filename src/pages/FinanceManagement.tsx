import { useState } from 'react';
import { Landmark, FileText, Briefcase, User, Truck } from 'lucide-react';
import { PackageReports } from '../components/finance/tabs/PackageReports';
import { AgencySettlements } from '../components/finance/tabs/AgencySettlements';
import { DriverPayments } from '../components/finance/tabs/DriverPayments';
import { VehicleExpenses } from '../components/finance/tabs/VehicleExpenses';
import FinanceErrorBoundary from '../components/ErrorBoundary/FinanceErrorBoundary';

const tabs = [
  { name: 'Relatórios de Pacotes', icon: FileText, component: PackageReports, description: 'Visão geral financeira dos pacotes' },
  { name: 'Fechamentos com Agências', icon: Briefcase, component: AgencySettlements, description: 'Gestão de fechamentos e recebimentos' },
  { name: 'Diárias de Motoristas', icon: User, component: DriverPayments, description: 'Controle de pagamentos aos motoristas' },
  { name: 'Despesas de Veículos', icon: Truck, component: VehicleExpenses, description: 'Registro de despesas com veículos' },
];

export const FinanceManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const ActiveComponent = tabs[activeTab].component;

  return (
    <FinanceErrorBoundary>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Landmark className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestão Financeira</h1>
              <p className="mt-1 text-sm text-gray-500">{tabs[activeTab].description}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="hidden md:block border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab, index) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(index)}
                  className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10 transition-colors ${
                    activeTab === index
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 border-b-2 border-transparent hover:text-gray-700'
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

          <div className="md:hidden border-b border-gray-200 p-4">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {tabs.map((tab, index) => (
                <option key={index} value={index}>{tab.name}</option>
              ))}
            </select>
          </div>

          <div className="p-0">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </FinanceErrorBoundary>
  );
};
