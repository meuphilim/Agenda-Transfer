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
  // FORÇANDO A RENDERIZAÇÃO APENAS DA ABA DE PAGAMENTOS DE MOTORISTAS PARA VERIFICAÇÃO VISUAL
  return (
    <FinanceErrorBoundary>
      <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
        <div className="mb-6">
          <div className="flex items-center space-x-3">
            <Landmark className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestão Financeira</h1>
              <p className="mt-1 text-sm text-gray-500">Controle de pagamentos aos motoristas</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-0">
            <DriverPayments />
          </div>
        </div>
      </div>
    </FinanceErrorBoundary>
  );
};
