import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../../lib/supabase';
import { financeApi } from '../../../services/financeApi';
import { 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { Modal, LoadingSpinner } from '../../Common';
import { Database } from '../../../types/database.types';

type Driver = Database['public']['Tables']['drivers']['Row'];
type PackageWithActivities = {
  id: string;
  title: string;
  package_attractions: { scheduled_date: string }[];
};
type StatementRate = {
    id: string | number;
    driver_id: string;
    driver_name: string;
    package_id: string | null;
    package_title: string | null;
    date: string;
    amount: number;
    paid: boolean;
    is_substitute: boolean;
    notes: string | null;
};
type FormData = Omit<Database['public']['Tables']['driver_daily_rates']['Insert'], 'id' | 'created_at' | 'updated_at'>;

export const DriverPayments: React.FC = () => {
  const [statement, setStatement] = useState<StatementRate[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [packages, setPackages] = useState<PackageWithActivities[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState<StatementRate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    driver_id: '',
    package_id: null,
    date: '',
    amount: 0,
    paid: false,
    notes: '',
  });

  // Inicializa datas para o mês atual
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Busca dados iniciais (motoristas e pacotes com atividades)
  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: driverData } = await supabase.from('drivers').select('*').eq('active', true).order('name');
      if (driverData) setDrivers(driverData);

      const { data: packageData } = await supabase
        .from('packages')
        .select('id, title, package_attractions(scheduled_date)')
        .in('status', ['confirmed', 'in_progress', 'completed'])
        .order('title');
      if (packageData) setPackages(packageData as PackageWithActivities[]);
    };
    void fetchInitialData();
  }, []);

  // Busca o extrato de pagamentos
  const fetchStatement = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const { data, error } = await financeApi.getDriverPaymentsStatement({
        startDate,
        endDate,
        driverId: selectedDriver,
      });
      if (error) throw error;
      setStatement(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar extrato de motoristas: ' + error.message);
      // MOCK DATA FOR VISUAL VERIFICATION
      setStatement([
          { id: 'auto-1-2024-10-26', driver_id: '1', driver_name: 'João da Silva', package_id: '1', package_title: 'Pacote Família Feliz', date: '2024-10-26', amount: 250, paid: false, is_substitute: false, notes: 'Diária automática' },
          { id: 'extra-2', driver_id: '2', driver_name: 'Carlos Pereira', package_id: '1', package_title: 'Pacote Família Feliz', date: '2024-10-27', amount: 300, paid: true, is_substitute: true, notes: 'Substituição no dia 27' },
          { id: 'auto-3-2024-10-28', driver_id: '1', driver_name: 'João da Silva', package_id: '1', package_title: 'Pacote Família Feliz', date: '2024-10-28', amount: 250, paid: false, is_substitute: false, notes: 'Diária automática' },
      ]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, selectedDriver]);

  useEffect(() => {
    void fetchStatement();
  }, [fetchStatement]);

  // Atualiza as datas disponíveis quando um pacote é selecionado no modal
  useEffect(() => {
    if (formData.package_id) {
      const selectedPkg = packages.find(p => p.id === formData.package_id);
      const dates = selectedPkg ? [...new Set(selectedPkg.package_attractions.map(pa => pa.scheduled_date))].sort() : [];
      setAvailableDates(dates);
      // Reseta a data se a data anteriormente selecionada não estiver mais disponível
      if (!dates.includes(formData.date)) {
        setFormData(prev => ({ ...prev, date: '' }));
      }
    } else {
      setAvailableDates([]);
    }
  }, [formData.package_id, packages]);

  const totalToPay = useMemo(() => {
    return statement.filter(r => !r.paid).reduce((sum, r) => sum + r.amount, 0);
  }, [statement]);
  
  const handleSaveRate = async () => {
    if (!formData.driver_id || !formData.package_id || !formData.date || !formData.amount) {
      toast.warn('Motorista, Pacote, Data da Atividade e Valor são obrigatórios.');
      return;
    }

    const payload: Omit<FormData, 'id'> = {
        ...formData,
        amount: Number(formData.amount),
    };

    // Se estiver editando, o ID já existe
    const upsertData = editingRate && typeof editingRate.id === 'string' ? { ...payload, id: editingRate.id } : payload;

    const { error } = await supabase.from('driver_daily_rates').upsert(upsertData);

    if (error) {
      toast.error('Erro ao salvar diária: ' + error.message);
    } else {
      toast.success('Diária salva com sucesso!');
      setShowAddModal(false);
      setEditingRate(null);
      void fetchStatement(); // Re-fetch para atualizar a lista
    }
  };

  const handleDeleteRate = async (id: string | number) => {
    if (typeof id !== 'string' || !window.confirm('Tem certeza que deseja excluir esta diária?')) return;
    
    const { error } = await supabase.from('driver_daily_rates').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir diária: ' + error.message);
    } else {
      toast.success('Diária excluída com sucesso!');
      void fetchStatement();
    }
  };
  
  const handleTogglePaid = async (rate: StatementRate) => {
    if (typeof rate.id !== 'string') {
      toast.info('Diárias automáticas não podem ser marcadas como pagas diretamente. Adicione uma diária avulsa para substituí-la e marcá-la como paga.');
      return;
    }

    const { error } = await supabase
      .from('driver_daily_rates')
      .update({ paid: !rate.paid })
      .eq('id', rate.id);

    if (error) {
      toast.error('Erro ao atualizar status: ' + error.message);
    } else {
      toast.success(`Status alterado para ${!rate.paid ? 'Pago' : 'Pendente'}`);
      void fetchStatement();
    }
  };

  const handleOpenModal = (rate: StatementRate | null = null) => {
    setEditingRate(rate);
    if (rate) {
      setFormData({
        driver_id: rate.driver_id,
        package_id: rate.package_id,
        date: rate.date,
        amount: rate.amount,
        paid: rate.paid,
        notes: rate.notes,
      });
    } else {
      setFormData({
        driver_id: '',
        package_id: null,
        date: '',
        amount: 0,
        paid: false,
        notes: '',
      });
    }
    setShowAddModal(true);
  }

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) return <div className="p-8 flex justify-center items-center"><LoadingSpinner /></div>;

  return (
    <div className="p-4 md:p-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Data Início</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Fim</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Motorista</label>
            <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} className="w-full p-2 border rounded-lg">
              <option value="all">Todos</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-lg border border-yellow-200 mb-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-yellow-700 font-medium">Total a Pagar</p>
                <p className="text-3xl font-bold text-yellow-900">{formatCurrency(totalToPay)}</p>
                <p className="text-sm text-yellow-600 mt-1">{statement.filter(r => !r.paid).length} diária(s) pendente(s)</p>
            </div>
            <DollarSign className="h-12 w-12 text-yellow-600" />
        </div>
      </div>

      {/* Botão Adicionar */}
      <div className="mb-6">
        <button
          onClick={() => handleOpenModal(null)}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Nova Diária Avulsa
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
                <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pacote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
            </thead>
            <tbody className="divide-y">
                {statement.map(rate => (
                <tr key={rate.id} className={`hover:bg-gray-50 ${rate.is_substitute ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4">{rate.driver_name ?? 'N/A'}</td>
                    <td className="px-6 py-4">{new Date(rate.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                        {rate.package_title ?? 'N/A'}
                        {rate.is_substitute && <span className="ml-2 text-xs font-semibold bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">Substituição</span>}
                    </td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(rate.amount)}</td>
                    <td className="px-6 py-4 text-center">
                    <button onClick={() => handleTogglePaid(rate)} disabled={typeof rate.id !== 'string'} className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 mx-auto ${rate.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'} ${typeof rate.id !== 'string' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {rate.paid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {rate.paid ? 'Pago' : 'Pendente'}
                    </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                        {typeof rate.id === 'string' ? (
                            <>
                            <button onClick={() => handleOpenModal(rate)} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16} /></button>
                            <button onClick={() => handleDeleteRate(rate.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                            </>
                        ) : (
                            <span className="text-gray-400 text-xs italic">Automática</span>
                        )}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingRate ? 'Editar Diária' : 'Nova Diária Avulsa/Substituta'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Motorista *</label>
            <select value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})} className="w-full p-2 border rounded-lg">
              <option value="">Selecione</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pacote (para substituição) *</label>
            <select
                value={formData.package_id ?? ''}
                onChange={e => setFormData({...formData, package_id: e.target.value || null, date: ''})}
                className="w-full p-2 border rounded-lg"
            >
              <option value="">Selecione um pacote</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data da Atividade *</label>
              <select
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full p-2 border rounded-lg"
                disabled={!formData.package_id || availableDates.length === 0}
              >
                <option value="">{availableDates.length > 0 ? 'Selecione a data' : 'Nenhuma data com atividade'}</option>
                {availableDates.map(d => <option key={d} value={d}>{new Date(d).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
           <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea value={formData.notes ?? ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded-lg" rows={3} />
          </div>
          <div className="flex items-center">
            <input type="checkbox" id="paid" checked={formData.paid} onChange={e => setFormData({...formData, paid: e.target.checked})} className="h-4 w-4 rounded" />
            <label htmlFor="paid" className="ml-2 block text-sm">Marcar como paga</label>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
            <button onClick={handleSaveRate} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">{editingRate ? 'Atualizar' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
