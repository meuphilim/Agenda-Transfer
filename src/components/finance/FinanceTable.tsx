import { BadgeCheck, BadgeX, BadgeAlert, Package as PackageIcon, Wallet, Calendar, Pencil, Building, UserCheck as DriverIcon } from 'lucide-react';
import { PackageWithRelations } from '../../services/financeApi';

interface FinanceTableProps {
  packages: PackageWithRelations[];
  loading: boolean;
  onEdit: (pkg: PackageWithRelations) => void;
}

const getStatusStyle = (status: 'pago' | 'pendente' | 'cancelado') => {
  switch (status) {
    case 'pago':
      return {
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: <BadgeCheck className="w-4 h-4" />,
        text: 'Pago',
      };
    case 'pendente':
      return {
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: <BadgeAlert className="w-4 h-4" />,
        text: 'Pendente',
      };
    case 'cancelado':
      return {
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: <BadgeX className="w-4 h-4" />,
        text: 'Cancelado',
      };
    default:
      return {
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: null,
        text: 'N/A',
      };
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

export const FinanceTable: React.FC<FinanceTableProps> = ({ packages, loading, onEdit }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando pacotes...</p>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <PackageIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum pacote encontrado</h3>
        <p className="mt-1 text-sm text-gray-500">
          Ajuste os filtros ou verifique se há pacotes cadastrados no período.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-md rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Building className="w-4 h-4 mr-2" /> Agência
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               <div className="flex items-center">
                <PackageIcon className="w-4 h-4 mr-2" /> Pacote
              </div>
            </th>
             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               <div className="flex items-center">
                <DriverIcon className="w-4 h-4 mr-2" /> Motorista
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Wallet className="w-4 h-4 mr-2" /> Valor
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status Pag.
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> Data Início
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {packages.map((pkg) => {
            const statusStyle = getStatusStyle(pkg.status_pagamento);
            return (
              <tr key={pkg.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{pkg.agencies?.name ?? 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{pkg.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{pkg.drivers?.name ?? 'N/A'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-semibold">{formatCurrency(pkg.valor_total)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bgColor} ${statusStyle.textColor}`}>
                    {statusStyle.icon}
                    {statusStyle.text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{formatDate(pkg.start_date)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button onClick={() => onEdit(pkg)} className="text-blue-600 hover:text-blue-900 transition-colors duration-200" title="Editar Pacote">
                        <Pencil className="h-5 w-5" />
                    </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};