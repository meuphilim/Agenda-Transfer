import { BadgeCheck, BadgeX, BadgeAlert, Package, User, Wallet, Calendar } from 'lucide-react';

type PaymentStatus = 'pago' | 'pendente' | 'cancelado';

interface PackageReport {
  id: string;
  cliente: string;
  pacote: string;
  valor_total: number;
  status_pagamento: PaymentStatus;
  data_venda: string;
}

interface FinanceTableProps {
  reports: PackageReport[];
  loading: boolean;
}

const getStatusStyle = (status: PaymentStatus) => {
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

export const FinanceTable: React.FC<FinanceTableProps> = ({ reports, loading }) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-500">Carregando relatórios...</p>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
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
                <User className="w-4 h-4 mr-2" /> Cliente
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
               <div className="flex items-center">
                <Package className="w-4 h-4 mr-2" /> Pacote
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Wallet className="w-4 h-4 mr-2" /> Valor
              </div>
            </th>
            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" /> Data Venda
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {reports.map((report) => {
            const statusStyle = getStatusStyle(report.status_pagamento);
            return (
              <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{report.cliente}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{report.pacote}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 font-semibold">{formatCurrency(report.valor_total)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${statusStyle.bgColor} ${statusStyle.textColor}`}>
                    {statusStyle.icon}
                    {statusStyle.text}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{formatDate(report.data_venda)}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FinanceTable;