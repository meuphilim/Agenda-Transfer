import { Package, CheckCircle, AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import { PackageWithRelations } from '../../services/financeApi';

interface FinanceSummaryProps {
  packages: PackageWithRelations[];
  expenses: number; // Mocked expenses
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  </div>
);

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({ packages, expenses }) => {
  const totalRecebido = packages
    .filter(r => r.status_pagamento === 'pago')
    .reduce((sum, r) => sum + r.valor_total, 0);

  const totalPendente = packages
    .filter(r => r.status_pagamento === 'pendente')
    .reduce((sum, r) => sum + r.valor_total, 0);

  const totalCancelado = packages
    .filter(r => r.status_pagamento === 'cancelado')
    .reduce((sum, r) => sum + r.valor_total, 0);

  const totalPacotes = packages.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-6">

      <SummaryCard
        title="Total Recebido"
        value={formatCurrency(totalRecebido)}
        icon={<CheckCircle className="h-6 w-6 text-green-700" />}
        color="bg-green-100"
        description="Soma dos pacotes pagos"
      />

      <SummaryCard
        title="Total Pendente"
        value={formatCurrency(totalPendente)}
        icon={<AlertTriangle className="h-6 w-6 text-yellow-700" />}
        color="bg-yellow-100"
        description="Valores a receber"
      />

      <SummaryCard
        title="Despesas"
        value={formatCurrency(expenses)}
        icon={<CreditCard className="h-6 w-6 text-orange-700" />}
        color="bg-orange-100"
        description="Total de despesas no período"
      />

      <SummaryCard
        title="Total Cancelado"
        value={formatCurrency(totalCancelado)}
        icon={<XCircle className="h-6 w-6 text-red-700" />}
        color="bg-red-100"
        description="Valores de pacotes cancelados"
      />

      <SummaryCard
        title="Nº de Pacotes"
        value={totalPacotes}
        icon={<Package className="h-6 w-6 text-indigo-700" />}
        color="bg-indigo-100"
        description="Total de pacotes no período"
      />

    </div>
  );
};