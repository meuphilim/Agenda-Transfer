import { useSearchParams } from 'react-router-dom';
import { Landmark, FileText, Briefcase, User, Truck, Wallet } from 'lucide-react';
import { PackageReports } from '../components/finance/tabs/PackageReports';
import { AgencySettlements } from '../components/finance/tabs/AgencySettlements';
import { DriverPayments } from '../components/finance/tabs/DriverPayments';
import { VehicleExpenses } from '../components/finance/tabs/VehicleExpenses';
import { Statement } from '../components/finance/tabs/Statement';
import FinanceErrorBoundary from '../components/ErrorBoundary/FinanceErrorBoundary';

const tabs = [
  { id: 'reports', name: 'Relatórios de Pacotes', icon: FileText, component: PackageReports, description: 'Visão geral financeira dos pacotes' },
  { id: 'statement', name: 'Extrato', icon: Wallet, component: Statement, description: 'Extrato financeiro de entradas e saídas' },
  { id: 'settlements', name: 'Fechamento', icon: Briefcase, component: AgencySettlements, description: 'Gestão de fechamentos e recebimentos' },
  { id: 'drivers', name: 'Diárias de Motoristas', icon: User, component: DriverPayments, description: 'Controle de pagamentos aos motoristas' },
  { id: 'vehicles', name: 'Despesas de Veículos', icon: Truck, component: VehicleExpenses, description: 'Registro de despesas com veículos' },
];

export const FinanceManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || tabs[0].id;

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;
  const activeDescription = tabs.find(tab => tab.id === activeTab)?.description;

  return (
    <FinanceErrorBoundary>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Landmark className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestão Financeira</h1>
              <p className="mt-1 text-sm text-gray-500">{activeDescription}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ tab: tab.id })}
                className={`flex items-center space-x-2 whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors
                  ${activeTab === tab.id
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-blue-600' : 'text-gray-400'}`} />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-6 bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-4 md:p-6">
            {ActiveComponent && <ActiveComponent />}
          </div>
        </div>
      </div>
    </FinanceErrorBoundary>
  );
};
