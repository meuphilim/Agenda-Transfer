import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../../lib/supabase';
import { 
  Calendar, 
  Building2, 
  Download, 
  Eye,
  DollarSign 
} from 'lucide-react';
import { Modal, FloatingActionButton } from '../../Common';
import { exportToPdf, Column } from '../../../utils/pdfExporter';

interface AgencySettlement {
  agencyId: string;
  agencyName: string;
  totalPackages: number;
  totalValue: number;
  totalNetValue: number;
  packages: {
    id: string;
    title: string;
    clientName: string;
    startDate: string;
    endDate: string;
    valorTotal: number;
    activities: {
      attractionName: string;
      date: string;
      valorNet: number;
      considerarValorNet: boolean;
    }[];
  }[];
}

export const AgencySettlements: React.FC = () => {
  const [settlements, setSettlements] = useState<AgencySettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [agencies, setAgencies] = useState<{id: string; name: string}[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState<AgencySettlement | null>(null);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    const fetchAgencies = async () => {
      const { data } = await supabase
        .from('agencies')
        .select('id, name')
        .eq('active', true)
        .order('name');
      
      if (data) setAgencies(data);
    };
    void fetchAgencies();
  }, []);

  useEffect(() => {
    if (!startDate || !endDate) return;

    const fetchSettlements = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from('packages')
          .select(`
            id,
            title,
            client_name,
            start_date,
            end_date,
            status,
            valor_total,
            agency_id,
            agencies(id, name),
            package_attractions(
              id,
              scheduled_date,
              considerar_valor_net,
              attractions(name, valor_net)
            )
          `)
          .gte('start_date', startDate)
          .lte('end_date', endDate)
          .in('status', ['confirmed', 'in_progress', 'completed']);

        if (selectedAgency !== 'all') {
          query = query.eq('agency_id', selectedAgency);
        }

        const { data, error } = await query;

        if (error) throw error;

        const grouped = data?.reduce((acc, pkg) => {
          const agencyId = pkg.agencies?.id ?? 'sem_agencia';
          const agencyName = pkg.agencies?.name ?? 'Sem Agência';

          if (!acc[agencyId]) {
            acc[agencyId] = {
              agencyId,
              agencyName,
              totalPackages: 0,
              totalValue: 0,
              totalNetValue: 0,
              packages: [],
            };
          }

          const netValue = pkg.package_attractions
            ?.filter(a => a.considerar_valor_net)
            .reduce((sum, a) => sum + (a.attractions?.valor_net ?? 0), 0) ?? 0;

          acc[agencyId].totalPackages += 1;
          acc[agencyId].totalValue += pkg.valor_total ?? 0;
          acc[agencyId].totalNetValue += netValue;
          acc[agencyId].packages.push({
            id: pkg.id,
            title: pkg.title,
            clientName: pkg.client_name,
            startDate: pkg.start_date,
            endDate: pkg.end_date,
            valorTotal: pkg.valor_total ?? 0,
            activities: pkg.package_attractions?.map(a => ({
              attractionName: a.attractions?.name ?? 'N/A',
              date: a.scheduled_date,
              valorNet: a.attractions?.valor_net ?? 0,
              considerarValorNet: a.considerar_valor_net,
            })) ?? [],
          });

          return acc;
        }, {} as Record<string, AgencySettlement>) ?? {};

        setSettlements(Object.values(grouped));
      } catch (error: any) {
        toast.error('Erro ao carregar fechamentos: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    void fetchSettlements();
  }, [startDate, endDate, selectedAgency]);

  const totalGeral = useMemo(() => {
    return settlements.reduce((sum, s) => sum + s.totalNetValue, 0);
  }, [settlements]);

  const handleViewDetails = (settlement: AgencySettlement) => {
    setSelectedSettlement(settlement);
    setShowDetailModal(true);
  };

  const handleExport = () => {
    if (settlements.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const columns: Column<AgencySettlement>[] = [
      { header: 'Agência', accessor: 'agencyName' },
      { header: 'Nº Pacotes', accessor: 'totalPackages' },
      { header: 'Valor NET Total', accessor: (row) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(row.totalNetValue)
      },
    ];

    exportToPdf(
      settlements, 
      columns, 
      `Fechamento_Agencias_${startDate}_${endDate}`
    );
    toast.success('Relatório gerado!');
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) {
    return <div className="p-8 text-center">Carregando...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium mb-1">Data Início</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">Data Fim</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="agency" className="block text-sm font-medium mb-1">Agência</label>
            <select
              id="agency"
              value={selectedAgency}
              onChange={(e) => setSelectedAgency(e.target.value)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="all">Todas</option>
              {agencies.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 font-medium">Total NET a Pagar</p>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalGeral)}</p>
            <p className="text-sm text-blue-600 mt-1">
              {settlements.length} agência(s) com fechamento no período
            </p>
          </div>
          <DollarSign className="h-12 w-12 text-blue-600" />
        </div>
      </div>

      {/* Tabela Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agência</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Nº de Pacotes</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor NET Total</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {settlements.map(settlement => (
              <tr key={settlement.agencyId} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{settlement.agencyName}</td>
                <td className="px-6 py-4 text-center">{settlement.totalPackages}</td>
                <td className="px-6 py-4 font-semibold text-blue-600">{formatCurrency(settlement.totalNetValue)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleViewDetails(settlement)} className="text-blue-600 hover:text-blue-800">
                    <Eye size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        {settlements.map(settlement => (
          <div key={settlement.agencyId} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold">{settlement.agencyName}</p>
              <button onClick={() => handleViewDetails(settlement)} className="text-blue-600"><Eye size={18} /></button>
            </div>
            <div className="text-sm">
              <p>Pacotes: <span className="font-medium">{settlement.totalPackages}</span></p>
              <p>Valor NET: <span className="font-semibold text-blue-600">{formatCurrency(settlement.totalNetValue)}</span></p>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Detalhes - ${selectedSettlement?.agencyName}`}>
        {selectedSettlement && (
          <div className="space-y-4">
            {selectedSettlement.packages.map(pkg => (
              <div key={pkg.id} className="p-3 border rounded-lg">
                <p className="font-semibold">{pkg.title} - {pkg.clientName}</p>
                <p className="text-sm text-gray-600">
                  {new Date(pkg.startDate).toLocaleDateString('pt-BR')} a {new Date(pkg.endDate).toLocaleDateString('pt-BR')}
                </p>
                <ul className="mt-2 text-sm list-disc list-inside">
                  {pkg.activities.filter(a => a.considerarValorNet).map(act => (
                    <li key={act.attractionName + act.date}>
                      {act.attractionName}: <span className="font-medium">{formatCurrency(act.valorNet)}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-right font-bold mt-2">
                  Subtotal NET: {formatCurrency(pkg.activities.filter(a => a.considerarValorNet).reduce((sum, a) => sum + a.valorNet, 0))}
                </p>
              </div>
            ))}
            <div className="text-right font-bold text-lg pt-4 border-t">
              Total NET: {formatCurrency(selectedSettlement.totalNetValue)}
            </div>
          </div>
        )}
      </Modal>

      {/* FAB Export */}
      <FloatingActionButton icon={Download} onClick={handleExport} color="green" />
    </div>
  );
};