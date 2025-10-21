import { BadgeCheck, BadgeX, BadgeAlert, Package as PackageIcon, Pencil, MoreVertical } from 'lucide-react';
import { PackageWithRelations } from '../../services/financeApi';
import { cn } from '../../lib/utils';
import { useState } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

interface FinanceTableProps {
  packages: PackageWithRelations[];
  loading: boolean;
  onEdit: (pkg: PackageWithRelations) => void;
}

const getStatusStyle = (status: 'pago' | 'pendente' | 'cancelado' | 'parcial') => {
  switch (status) {
    case 'pago': return { text: 'Pago', color: 'bg-green-100 text-green-800', icon: <BadgeCheck size={14} /> };
    case 'pendente': return { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: <BadgeAlert size={14} /> };
    case 'cancelado': return { text: 'Cancelado', color: 'bg-red-100 text-red-800', icon: <BadgeX size={14} /> };
    case 'parcial': return { text: 'Parcial', color: 'bg-blue-100 text-blue-800', icon: <BadgeAlert size={14} /> }; // ✅ NOVO
    default: return { text: 'N/A', color: 'bg-gray-100 text-gray-800', icon: null };
  }
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const MarginBadge: React.FC<{ margin: number; percentage: number }> = ({ margin, percentage }) => {
  const isPositive = margin >= 0;
  const bgColor = isPositive ? 'bg-green-100' : 'bg-red-100';
  const textColor = isPositive ? 'text-green-800' : 'text-red-800';

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${bgColor} ${textColor}`}>
      {isPositive ? '📈' : '📉'}
      <span className="ml-1.5">{formatCurrency(margin)} ({percentage.toFixed(1)}%)</span>
    </div>
  );
};

const MobileTableRow: React.FC<{ pkg: PackageWithRelations; onEdit: (pkg: PackageWithRelations) => void }> = ({ pkg, onEdit }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useClickOutside<HTMLDivElement>(() => setIsMenuOpen(false));
  const status = getStatusStyle(pkg.status_pagamento);

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold">{pkg.title}</h3>
            <p className="text-sm text-gray-600">{pkg.client_name}</p>
          </div>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-gray-500">
              <MoreVertical size={20} />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border">
                <button data-testid={`edit-button-mobile-${pkg.id}`} onClick={() => { onEdit(pkg); setIsMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100">
                   <Pencil size={14}/> Editar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-green-700">Receita</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(pkg.valor_receita_total)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-red-700">Custo</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(pkg.valor_custo_total)}</p>
        </div>
        <div className="col-span-2">
           <p className="text-sm font-medium text-purple-700">Margem</p>
           <MarginBadge margin={pkg.valor_margem_bruta} percentage={pkg.percentual_margem} />
        </div>
      </div>
       <div className="p-3 bg-gray-50 border-t flex justify-between items-center">
         <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs', status.color)}>
          {status.icon} {status.text}
         </span>
         <p className="text-xs text-gray-500">{new Date(pkg.start_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</p>
       </div>
    </div>
  );
};


export const FinanceTable: React.FC<FinanceTableProps> = ({ packages, loading, onEdit }) => {
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

  const columns = [
    { header: 'Pacote / Cliente', key: 'pacote' },
    { header: 'Receita Total', key: 'receita', className: 'text-green-600 font-semibold' },
    { header: 'Custos Totais', key: 'custos', className: 'text-red-600 font-semibold' },
    { header: 'Margem Bruta', key: 'margem' },
    { header: 'Status', key: 'status' },
    { header: 'Ações', key: 'acoes', className: 'text-right' },
  ];

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              {columns.map(col => (
                <th key={col.key} className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase", col.className)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {packages.map((pkg) => {
              const status = getStatusStyle(pkg.status_pagamento);
              return (
                <tr key={pkg.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold">{pkg.title}</p>
                    <p className="text-sm text-gray-500">{pkg.client_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-green-600">{formatCurrency(pkg.valor_receita_total)}</p>
                    <p className="text-xs text-gray-500">Diárias: {formatCurrency(pkg.valor_diaria_servico_calculado)}</p>
                    <p className="text-xs text-gray-500">NET: {formatCurrency(pkg.valor_net_receita)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-red-600">{formatCurrency(pkg.valor_custo_total)}</p>
                    <p className="text-xs text-gray-500">Motorista: {formatCurrency(pkg.valor_diaria_motorista_calculado)}</p>
                    <p className="text-xs text-gray-500">Veículo: {formatCurrency(pkg.valor_despesas_veiculo)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <MarginBadge margin={pkg.valor_margem_bruta} percentage={pkg.percentual_margem} />
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs', status.color)}>
                      {status.icon} {status.text}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onEdit(pkg)}
                      data-testid={`edit-button-${pkg.id}`}
                      aria-label={`Editar pacote ${pkg.title}`}
                      className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-3">
        {packages.map((pkg) => (
          <MobileTableRow key={pkg.id} pkg={pkg} onEdit={onEdit} />
        ))}
      </div>
    </div>
  );
};