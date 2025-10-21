import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../../lib/supabase';
import { financeApi } from '../../../services/financeApi';
import { 
  Download, 
  Eye,
  DollarSign,
  CheckCircle,
  AlertTriangle,
  CircleDotDashed,
  BadgeCheck,
} from 'lucide-react';
import { Modal, FloatingActionButton, Button } from '../../Common';
import { exportToPdf, Column } from '../../../utils/pdfExporter';

// Estrutura de dados alinhada com a nova API
interface AgencySettlement {
  agencyId: string;
  agencyName: string;
  totalValueToPay: number;
  totalValuePaid: number;
  settlementStatus: 'Pago' | 'Pendente' | 'Parcial';
  activities: {
    id: string;
    scheduled_date: string;
    net_payment_status: 'paid' | 'pending' | null;
    revenue: number;
    attractions?: {
      name: string;
    };
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  const fetchSettlements = useCallback(async () => {
    if (!startDate || !endDate) return;

    setLoading(true);
    try {
      const { data, error } = await financeApi.getAgencySettlements({
        startDate,
        endDate,
        agencyId: selectedAgency,
      });

      if (error) throw error;
      if (data) {
        setSettlements(data);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar fechamentos: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedAgency]);

  useEffect(() => {
    void fetchSettlements();
  }, [fetchSettlements]);

  const totalGeralAPagar = useMemo(() => {
    return settlements.reduce((sum, s) => sum + s.totalValueToPay, 0);
  }, [settlements]);

  const handleViewDetails = (settlement: AgencySettlement) => {
    setSelectedSettlement(settlement);
    setShowDetailModal(true);
  };

  const handleConfirmSettlement = (settlement: AgencySettlement) => {
    setSelectedSettlement(settlement);
    setShowConfirmModal(true);
  };

  const handleSettlePeriod = async () => {
    if (!selectedSettlement) return;

    try {
      toast.info('Processando fechamento...');
      const { error } = await financeApi.settleAgencyPeriod(
        selectedSettlement.agencyId,
        startDate,
        endDate
      );

      if (error) throw error;

      toast.success(`Fechamento da agência ${selectedSettlement.agencyName} realizado com sucesso!`);
      setShowConfirmModal(false);
      setSelectedSettlement(null);
      await fetchSettlements(); // Recarrega os dados
    } catch (error: any) {
      toast.error('Erro ao realizar fechamento: ' + error.message);
    }
  };

  const handleExport = () => {
    if (settlements.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const columns: Column<AgencySettlement>[] = [
      { header: 'Agência', accessor: 'agencyName' },
      { header: 'Valor a Pagar', accessor: (row) => formatCurrency(row.totalValueToPay) },
      { header: 'Valor Pago', accessor: (row) => formatCurrency(row.totalValuePaid) },
      { header: 'Status', accessor: 'settlementStatus' },
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

  const StatusBadge = ({ status }: { status: string }) => {
    const styles = {
      Pago: 'bg-green-100 text-green-800 border-green-200',
      Pendente: 'bg-red-100 text-red-800 border-red-200',
      Parcial: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    };
    const icons = {
      Pago: <CheckCircle size={14} className="mr-1" />,
      Pendente: <AlertTriangle size={14} className="mr-1" />,
      Parcial: <CircleDotDashed size={14} className="mr-1" />,
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

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
            <input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium mb-1">Data Fim</label>
            <input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label htmlFor="agency" className="block text-sm font-medium mb-1">Agência</label>
            <select id="agency" value={selectedAgency} onChange={(e) => setSelectedAgency(e.target.value)} className="w-full p-2 border rounded-lg">
              <option value="all">Todas</option>
              {agencies.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-700 font-medium">Total a Pagar (Pendentes)</p>
            <p className="text-3xl font-bold text-blue-900">{formatCurrency(totalGeralAPagar)}</p>
            <p className="text-sm text-blue-600 mt-1">{settlements.length} agência(s) com fechamento no período</p>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor a Pagar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Pago</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {settlements.map(s => (
              <tr key={s.agencyId} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{s.agencyName}</td>
                <td className="px-6 py-4 font-semibold text-red-600">{formatCurrency(s.totalValueToPay)}</td>
                <td className="px-6 py-4 font-semibold text-green-600">{formatCurrency(s.totalValuePaid)}</td>
                <td className="px-6 py-4 text-center"><StatusBadge status={s.settlementStatus} /></td>
                <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                  <button onClick={() => handleViewDetails(s)} className="text-gray-500 hover:text-blue-600 p-1 rounded-full hover:bg-gray-100" title="Ver Detalhes"><Eye size={18} /></button>
                  {(s.settlementStatus === 'Pendente' || s.settlementStatus === 'Parcial') && (
                    <button onClick={() => handleConfirmSettlement(s)} className="text-gray-500 hover:text-green-600 p-1 rounded-full hover:bg-gray-100" title="Realizar Fechamento"><BadgeCheck size={18} /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        {settlements.map(s => (
          <div key={s.agencyId} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold">{s.agencyName}</p>
              <StatusBadge status={s.settlementStatus} />
            </div>
            <div className="text-sm space-y-1">
              <p>A Pagar: <span className="font-semibold text-red-600">{formatCurrency(s.totalValueToPay)}</span></p>
              <p>Pago: <span className="font-semibold text-green-600">{formatCurrency(s.totalValuePaid)}</span></p>
            </div>
            <div className="mt-3 pt-3 border-t flex justify-end items-center gap-2">
              <button onClick={() => handleViewDetails(s)} className="text-sm text-gray-600 hover:text-blue-700">Detalhes</button>
              {(s.settlementStatus === 'Pendente' || s.settlementStatus === 'Parcial') && (
                <button onClick={() => handleConfirmSettlement(s)} className="text-sm text-green-600 hover:text-green-800 font-semibold">Realizar Fechamento</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={`Detalhes - ${selectedSettlement?.agencyName}`}>
        {selectedSettlement && (
          <div className="max-h-96 overflow-y-auto pr-2">
            <ul className="space-y-2">
              {selectedSettlement.activities.map((act, index) => (
                <li key={act.id + index} className="flex justify-between items-center p-2 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{act.attractions?.name || 'Diária'}</p>
                    <p className="text-xs text-gray-500">{new Date(act.scheduled_date + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(act.revenue)}</p>
                    <span className={`text-xs ${act.net_payment_status === 'paid' ? 'text-green-600' : 'text-gray-500'}`}>
                      {act.net_payment_status === 'paid' ? 'Pago' : 'Pendente'}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="text-right font-bold text-lg pt-4 mt-4 border-t">
              <p>Total a Pagar: {formatCurrency(selectedSettlement.totalValueToPay)}</p>
              <p>Total Pago: {formatCurrency(selectedSettlement.totalValuePaid)}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal de Confirmação */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Confirmar Fechamento">
        {selectedSettlement && (
          <div>
            <p>Você está prestes a marcar todas as atividades pendentes da agência <strong>{selectedSettlement.agencyName}</strong> como pagas para o período selecionado.</p>
            <p className="text-2xl font-bold text-center my-4">{formatCurrency(selectedSettlement.totalValueToPay)}</p>
            <p className="text-sm text-gray-600">Esta ação não pode ser desfeita. Deseja continuar?</p>
            <div className="flex justify-end gap-3 mt-6">
              <Button onClick={() => setShowConfirmModal(false)} variant="secondary">Cancelar</Button>
              <Button onClick={handleSettlePeriod} variant="primary">Confirmar Pagamento</Button>
            </div>
          </div>
        )}
      </Modal>

      <FloatingActionButton icon={Download} onClick={handleExport} color="green" />
    </div>
  );
};
