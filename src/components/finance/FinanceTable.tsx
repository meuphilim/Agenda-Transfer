import { BadgeCheck, BadgeX, BadgeAlert, Package as PackageIcon, Pencil, MoreVertical } from 'lucide-react';
import { PackageWithRelations } from '../../services/financeApi';
import { cn } from '../../lib/utils';
import { useState } from 'react';

interface FinanceTableProps {
  packages: PackageWithRelations[];
  loading: boolean;
  onEdit: (pkg: PackageWithRelations) => void;
}

const getStatusStyle = (status: 'pago' | 'pendente' | 'cancelado') => {
  switch (status) {
    case 'pago': return { text: 'Pago', color: 'bg-green-100 text-green-800', icon: <BadgeCheck /> };
    case 'pendente': return { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: <BadgeAlert /> };
    case 'cancelado': return { text: 'Cancelado', color: 'bg-red-100 text-red-800', icon: <BadgeX /> };
    default: return { text: 'N/A', color: 'bg-gray-100 text-gray-800', icon: null };
  }
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export const FinanceTable: React.FC<FinanceTableProps> = ({ packages, loading, onEdit }) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  if (loading) {
    return <div className="text-center p-12">Carregando...</div>;
  }

  if (packages.length === 0) {
    return (
      <div className="text-center p-12 bg-gray-50 rounded-lg">
        <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 font-medium">Nenhum pacote encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">Ajuste os filtros ou cadastre novos pacotes.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agência</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacote</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {packages.map((pkg) => {
              const status = getStatusStyle(pkg.status_pagamento);
              return (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{pkg.agencies?.name ?? 'N/A'}</td>
                  <td className="px-6 py-4">{pkg.title}</td>
                  <td className="px-6 py-4 font-semibold">{formatCurrency(pkg.valor_total)}</td>
                  <td className="px-6 py-4">
                    <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs', status.color)}>
                      {status.icon} {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => onEdit(pkg)} className="text-blue-600"><Pencil size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {packages.map((pkg) => {
          const status = getStatusStyle(pkg.status_pagamento);
          return (
            <div key={pkg.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold">{pkg.agencies?.name ?? 'N/A'}</h3>
                    <p className="text-sm text-gray-600">{pkg.title}</p>
                  </div>
                  <div className="relative">
                    <button onClick={() => setActiveMenu(pkg.id === activeMenu ? null : pkg.id)} className="p-2">
                      <MoreVertical size={20} />
                    </button>
                    {activeMenu === pkg.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border">
                        <button onClick={() => onEdit(pkg)} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100">
                           <Pencil size={14}/> Editar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="p-4 flex justify-between items-center">
                <div>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(pkg.valor_total)}</p>
                  <p className="text-sm text-gray-500">Data: {formatDate(pkg.start_date)}</p>
                </div>
                <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs', status.color)}>
                  {status.icon} {status.text}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};