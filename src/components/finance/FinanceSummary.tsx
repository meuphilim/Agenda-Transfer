import { Package, CheckCircle, AlertTriangle, XCircle, CreditCard } from 'lucide-react';
import { PackageWithRelations } from '../../services/financeApi';

interface FinanceSummaryProps {
  packages: PackageWithRelations[];
  expenses: number;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border flex items-center gap-4">
    <div className={`p-3 rounded-full ${color}`}>
      {icon}
    </div>
    <div>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
    </div>
  </div>
);

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const FinanceSummary: React.FC<FinanceSummaryProps> = ({ packages, expenses }) => {
  const totalRecebido = packages.filter(p => p.status_pagamento === 'pago').reduce((sum, p) => sum + p.valor_total, 0);
  const totalPendente = packages.filter(p => p.status_pagamento === 'pendente').reduce((sum, p) => sum + p.valor_total, 0);

  const summaryCards = [
    { title: "Receita Total", value: formatCurrency(totalRecebido), icon: <CheckCircle className="h-6 w-6 text-green-700" />, color: "bg-green-100" },
    { title: "A Receber", value: formatCurrency(totalPendente), icon: <AlertTriangle className="h-6 w-6 text-yellow-700" />, color: "bg-yellow-100" },
    { title: "Despesas", value: formatCurrency(expenses), icon: <CreditCard className="h-6 w-6 text-orange-700" />, color: "bg-orange-100" },
    { title: "Nº de Pacotes", value: packages.length, icon: <Package className="h-6 w-6 text-indigo-700" />, color: "bg-indigo-100" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {summaryCards.map(card => (
        <SummaryCard key={card.title} {...card} />
      ))}
    </div>
  );
};