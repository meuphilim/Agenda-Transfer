import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../../lib/supabase';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Modal } from '../../Common';
import { Database } from '../../../types/database.types';

type Driver = Database['public']['Tables']['drivers']['Row'];
type Package = Database['public']['Tables']['packages']['Row'];
type DailyRate = Database['public']['Tables']['driver_daily_rates']['Row'] & {
  drivers: Pick<Driver, 'name'> | null;
  packages: Pick<Package, 'title'> | null;
};
type FormData = Omit<Database['public']['Tables']['driver_daily_rates']['Insert'], 'id' | 'created_at' | 'updated_at'>;

export const DriverPayments: React.FC = () => {
  const [dailyRates, setDailyRates] = useState<DailyRate[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriver, setSelectedDriver] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRate, setEditingRate] = useState<DailyRate | null>(null);
  const [formData, setFormData] = useState<FormData>({
    driver_id: '',
    package_id: null,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    is_extra: true,
    paid: false,
    notes: '',
  });

  // Inicializa datas
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Busca motoristas e pacotes
  useEffect(() => {
    const fetchData = async () => {
      const { data: driverData } = await supabase.from('drivers').select('*').eq('active', true);
      if (driverData) setDrivers(driverData);

      const { data: packageData } = await supabase.from('packages').select('id, title').in('status', ['confirmed', 'in_progress', 'completed']);
      if (packageData) setPackages(packageData);
    };
    void fetchData();
  }, []);

  // Lógica principal para buscar e gerar diárias
  const fetchAndGenerateRates = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);

    try {
      // 1. Buscar pacotes no período que devem gerar diárias
      let packageQuery = supabase
        .from('packages')
        .select('id, driver_id, start_date, end_date, drivers(valor_diaria_motorista)')
        .gte('start_date', startDate)
        .lte('end_date', endDate)
        .eq('considerar_diaria_motorista', true)
        .in('status', ['confirmed', 'in_progress', 'completed']);
      
      if (selectedDriver !== 'all') {
        packageQuery = packageQuery.eq('driver_id', selectedDriver);
      }

      const { data: pkgs, error: pkgError } = await packageQuery;
      if (pkgError) throw pkgError;

      // 2. Gerar diárias automáticas (em memória)
      const generatedRates: Omit<DailyRate, 'id' | 'created_at' | 'updated_at' | 'drivers' | 'packages'>[] = [];
      for (const pkg of pkgs) {
        if (!pkg.driver_id || !pkg.drivers) continue;
        let currentDate = new Date(pkg.start_date);
        const lastDate = new Date(pkg.end_date);
        
        while (currentDate <= lastDate) {
          generatedRates.push({
            driver_id: pkg.driver_id,
            package_id: pkg.id,
            date: currentDate.toISOString().split('T')[0],
            amount: pkg.drivers.valor_diaria_motorista,
            is_extra: false,
            paid: false, // O status de pago virá da tabela de diárias
            notes: `Diária automática do pacote ${pkg.id}`,
          });
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }

      // 3. Buscar diárias extras já salvas no banco
      let extraRatesQuery = supabase
        .from('driver_daily_rates')
        .select('*, drivers(name), packages(title)')
        .gte('date', startDate)
        .lte('date', endDate);

      if (selectedDriver !== 'all') {
        extraRatesQuery = extraRatesQuery.eq('driver_id', selectedDriver);
      }
      
      const { data: extraRates, error: extraRatesError } = await extraRatesQuery;
      if (extraRatesError) throw extraRatesError;

      // TODO: Combinar diárias geradas com as salvas, dando preferência às salvas
      // Por enquanto, vamos mostrar apenas as salvas para simplificar
      setDailyRates(extraRates || []);

    } catch (error: any) {
      toast.error('Erro ao calcular diárias: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAndGenerateRates();
  }, [startDate, endDate, selectedDriver]);

  const totalToPay = useMemo(() => {
    return dailyRates.filter(r => !r.paid).reduce((sum, r) => sum + r.amount, 0);
  }, [dailyRates]);
  
  const handleSaveRate = async () => {
    if (!formData.driver_id || !formData.date || formData.amount <= 0) {
      toast.warn('Preencha os campos obrigatórios: Motorista, Data e Valor.');
      return;
    }

    const payload = { ...formData, package_id: formData.package_id || null };

    const { data, error } = await supabase
      .from('driver_daily_rates')
      .upsert(payload)
      .select('*, drivers(name), packages(title)')
      .single();

    if (error) {
      toast.error('Erro ao salvar diária: ' + error.message);
    } else if (data) {
      if (editingRate) {
        setDailyRates(prev => prev.map(r => r.id === data.id ? data : r));
      } else {
        setDailyRates(prev => [...prev, data]);
      }
      toast.success('Diária salva com sucesso!');
      setShowAddModal(false);
      setEditingRate(null);
    }
  };

  const handleDeleteRate = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta diária?')) return;
    
    const { error } = await supabase.from('driver_daily_rates').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir diária: ' + error.message);
    } else {
      setDailyRates(prev => prev.filter(r => r.id !== id));
      toast.success('Diária excluída com sucesso!');
    }
  };
  
  const handleTogglePaid = async (rate: DailyRate) => {
    const { data, error } = await supabase
      .from('driver_daily_rates')
      .update({ paid: !rate.paid })
      .eq('id', rate.id)
      .select('*, drivers(name), packages(title)')
      .single();

    if (error) {
      toast.error('Erro ao atualizar status: ' + error.message);
    } else if (data) {
      setDailyRates(prev => prev.map(r => r.id === data.id ? data : r));
      toast.success(`Status alterado para ${data.paid ? 'Pago' : 'Pendente'}`);
    }
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

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
            <p className="text-sm text-yellow-600 mt-1">{dailyRates.filter(r => !r.paid).length} diária(s) pendente(s)</p>
          </div>
          <DollarSign className="h-12 w-12 text-yellow-600" />
        </div>
      </div>

      {/* Botão Adicionar */}
      <div className="mb-6">
        <button
          onClick={() => {
            setEditingRate(null);
            setFormData({
              driver_id: '',
              package_id: null,
              date: new Date().toISOString().split('T')[0],
              amount: 0,
              is_extra: true,
              paid: false,
              notes: '',
            });
            setShowAddModal(true);
          }}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Nova Diária Avulsa
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dailyRates.map(rate => (
              <tr key={rate.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{rate.drivers?.name ?? 'N/A'}</td>
                <td className="px-6 py-4">{new Date(rate.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 font-semibold">{formatCurrency(rate.amount)}</td>
                <td className="px-6 py-4 text-center">
                  <button onClick={() => handleTogglePaid(rate)} className={`px-3 py-1 rounded-full text-xs flex items-center gap-1.5 mx-auto ${rate.paid ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {rate.paid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {rate.paid ? 'Pago' : 'Pendente'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setEditingRate(rate); setFormData(rate); setShowAddModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteRate(rate.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={editingRate ? 'Editar Diária' : 'Nova Diária Avulsa'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Motorista *</label>
            <select value={formData.driver_id} onChange={e => setFormData({...formData, driver_id: e.target.value})} className="w-full p-2 border rounded-lg">
              <option value="">Selecione</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Data *</label>
              <input type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pacote (opcional)</label>
            <select value={formData.package_id ?? ''} onChange={e => setFormData({...formData, package_id: e.target.value || null})} className="w-full p-2 border rounded-lg">
              <option value="">Nenhum</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
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