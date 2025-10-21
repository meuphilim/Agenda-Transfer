import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../../../lib/supabase';
import { 
  Truck, 
  Plus, 
  Edit2, 
  Trash2,
  Download,
  Fuel,
  Wrench,
  Car,
  ShieldCheck,
  Landmark,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { Modal, FloatingActionButton } from '../../Common';
import { Database } from '../../../types/database.types';
import { exportToPdf, Column } from '../../../utils/pdfExporter';

type Vehicle = Database['public']['Tables']['vehicles']['Row'];
type Package = Database['public']['Tables']['packages']['Row'];
type Expense = Database['public']['Tables']['vehicle_expenses']['Row'] & {
  vehiclePlate: string;
  vehicleModel: string;
  packageTitle?: string;
};
type FormData = Omit<Database['public']['Tables']['vehicle_expenses']['Insert'], 'id' | 'created_at' | 'updated_at'>;
type ExpenseCategory = Database['public']['Tables']['vehicle_expenses']['Row']['category'];

const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; icon: React.FC<any>; color: string }> = {
  combustivel: { label: 'Combustível', icon: Fuel, color: 'text-orange-500' },
  manutencao: { label: 'Manutenção', icon: Wrench, color: 'text-blue-500' },
  lavagem: { label: 'Lavagem', icon: Car, color: 'text-cyan-500' },
  seguro: { label: 'Seguro', icon: ShieldCheck, color: 'text-green-500' },
  ipva: { label: 'IPVA', icon: Landmark, color: 'text-indigo-500' },
  multa: { label: 'Multa', icon: AlertTriangle, color: 'text-red-500' },
  outro: { label: 'Outro', icon: ClipboardList, color: 'text-gray-500' },
};


export const VehicleExpenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [formData, setFormData] = useState<FormData>({
    vehicle_id: '',
    package_id: null,
    category: 'combustivel',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    odometer: null,
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

  // Busca dados auxiliares
  useEffect(() => {
    const fetchData = async () => {
      const { data: vehicleData } = await supabase.from('vehicles').select('*').eq('active', true);
      if (vehicleData) setVehicles(vehicleData);

      const { data: packageData } = await supabase.from('packages').select('id, title');
      if (packageData) setPackages(packageData);
    };
    void fetchData();
  }, []);

  // Busca despesas
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!startDate || !endDate) return;
      setLoading(true);
      try {
        let query = supabase
          .from('vehicle_expenses')
          .select(`
            *,
            vehicles (license_plate, model),
            packages (title)
          `)
          .gte('date', startDate)
          .lte('date', endDate);

        if (selectedVehicle !== 'all') query = query.eq('vehicle_id', selectedVehicle);
        if (selectedCategory !== 'all') query = query.eq('category', selectedCategory);

        const { data, error } = await query;
        if (error) throw error;
        
        const formattedData = data.map(d => ({
            ...d,
            vehiclePlate: d.vehicles?.license_plate ?? 'N/A',
            vehicleModel: d.vehicles?.model ?? 'N/A',
            packageTitle: d.packages?.title,
        }));

        setExpenses(formattedData);

      } catch (error: any) {
        toast.error('Erro ao buscar despesas: ' + error.message);
      } finally {
        setLoading(false);
      }
    };
    void fetchExpenses();
  }, [startDate, endDate, selectedVehicle, selectedCategory]);

  const totalGeral = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleSaveExpense = async () => {
    if (!formData.vehicle_id || !formData.description || formData.amount <= 0) {
      toast.warn('Preencha os campos obrigatórios: Veículo, Descrição e Valor.');
      return;
    }
    
    const payload: Omit<FormData, 'package_id'> & { package_id?: string | null } = { ...formData };
    if (!payload.package_id) {
        payload.package_id = null;
    }

    const { data, error } = await supabase
      .from('vehicle_expenses')
      .upsert(payload)
      .select('*, vehicles (license_plate, model), packages (title)')
      .single();

    if (error) {
      toast.error('Erro ao salvar despesa: ' + error.message);
    } else if (data) {
       const newExpense = {
            ...data,
            vehiclePlate: data.vehicles?.license_plate ?? 'N/A',
            vehicleModel: data.vehicles?.model ?? 'N/A',
            packageTitle: data.packages?.title,
       };
      if (editingExpense) {
        setExpenses(prev => prev.map(e => e.id === newExpense.id ? newExpense : e));
      } else {
        setExpenses(prev => [...prev, newExpense]);
      }
      toast.success('Despesa salva com sucesso!');
      setShowAddModal(false);
      setEditingExpense(null);
    }
  };
  
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return;
    
    const { error } = await supabase.from('vehicle_expenses').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao excluir despesa: ' + error.message);
    } else {
      setExpenses(prev => prev.filter(e => e.id !== id));
      toast.success('Despesa excluída com sucesso!');
    }
  };

  const handleExport = () => {
    if (expenses.length === 0) {
      toast.warn('Não há dados para exportar.');
      return;
    }

    const columns: Column<Expense>[] = [
      { header: 'Veículo', accessor: (row) => `${row.vehiclePlate} (${row.vehicleModel})` },
      { header: 'Categoria', accessor: (row) => EXPENSE_CATEGORIES[row.category as ExpenseCategory].label },
      { header: 'Descrição', accessor: 'description' },
      { header: 'Data', accessor: (row) => new Date(row.date).toLocaleDateString('pt-BR') },
      { header: 'Valor', accessor: (row) => formatCurrency(row.amount) },
      { header: 'Pacote', accessor: (row) => row.packageTitle ?? 'N/A' },
    ];

    exportToPdf(expenses, columns, `Relatorio_Despesas_Veiculos_${startDate}_${endDate}`);
    toast.success('Relatório PDF gerado!');
  };

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <div className="p-4 md:p-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Data Início</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Data Fim</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Veículo</label>
            <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} className="w-full p-2 border rounded-lg">
              <option value="all">Todos</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} - {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full p-2 border rounded-lg">
              <option value="all">Todas</option>
              {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => <option key={key} value={key}>{cat.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-lg border border-red-200 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-red-700 font-medium">Total de Despesas</p>
            <p className="text-3xl font-bold text-red-900">{formatCurrency(totalGeral)}</p>
            <p className="text-sm text-red-600 mt-1">{expenses.length} despesa(s) no período</p>
          </div>
          <Truck className="h-12 w-12 text-red-600" />
        </div>
      </div>

      {/* Botão Adicionar */}
      <div className="mb-6">
        <button onClick={() => { setEditingExpense(null); setShowAddModal(true); }} className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
          <Plus size={16} /> Nova Despesa
        </button>
      </div>

      {/* Tabela */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Veículo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {expenses.map(expense => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">{expense.vehiclePlate}</td>
                <td className="px-6 py-4"><span className={`font-medium ${EXPENSE_CATEGORIES[expense.category as ExpenseCategory].color}`}>{EXPENSE_CATEGORIES[expense.category as ExpenseCategory].label}</span></td>
                <td className="px-6 py-4">{expense.description}</td>
                <td className="px-6 py-4">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                <td className="px-6 py-4 font-semibold text-red-600">{formatCurrency(expense.amount)}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => { setEditingExpense(expense); setFormData(expense); setShowAddModal(true); }} className="text-blue-600 hover:text-blue-800 mr-3"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards Mobile */}
      <div className="md:hidden space-y-3">
        {expenses.map(expense => (
          <div key={expense.id} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="font-semibold">{expense.vehiclePlate}</p>
              <div className="flex gap-2">
                <button onClick={() => { setEditingExpense(expense); setFormData(expense); setShowAddModal(true); }} className="text-blue-600"><Edit2 size={16} /></button>
                <button onClick={() => handleDeleteExpense(expense.id)} className="text-red-600"><Trash2 size={16} /></button>
              </div>
            </div>
            <div className="space-y-1 text-sm">
              <p><span className={`font-medium ${EXPENSE_CATEGORIES[expense.category as ExpenseCategory].color}`}>{EXPENSE_CATEGORIES[expense.category as ExpenseCategory].label}</span></p>
              <p className="text-gray-700">{expense.description}</p>
              <p className="text-gray-500">{new Date(expense.date).toLocaleDateString('pt-BR')}</p>
              <p className="font-semibold text-red-600">{formatCurrency(expense.amount)}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); setEditingExpense(null); }} title={editingExpense ? 'Editar Despesa' : 'Nova Despesa'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Veículo *</label>
            <select value={formData.vehicle_id} onChange={(e) => setFormData({...formData, vehicle_id: e.target.value})} className="w-full p-2 border rounded-lg">
              <option value="">Selecione</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.license_plate} - {v.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoria *</label>
            <select value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value as ExpenseCategory})} className="w-full p-2 border rounded-lg">
              {Object.entries(EXPENSE_CATEGORIES).map(([key, cat]) => <option key={key} value={key}>{cat.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descrição *</label>
            <input type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Valor (R$) *</label>
              <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Data *</label>
              <input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pacote (opcional)</label>
            <select value={formData.package_id ?? ''} onChange={(e) => setFormData({...formData, package_id: e.target.value || null})} className="w-full p-2 border rounded-lg">
              <option value="">Nenhum</option>
              {packages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Hodômetro (km)</label>
            <input type="number" value={formData.odometer ?? ''} onChange={(e) => setFormData({...formData, odometer: parseInt(e.target.value) || null})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Observações</label>
            <textarea value={formData.notes ?? ''} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded-lg" rows={3} />
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => { setShowAddModal(false); setEditingExpense(null); }} className="flex-1 px-4 py-2 border rounded-lg">Cancelar</button>
            <button onClick={handleSaveExpense} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg">{editingExpense ? 'Atualizar' : 'Salvar'}</button>
          </div>
        </div>
      </Modal>

      {/* FAB Export */}
      <FloatingActionButton icon={Download} onClick={handleExport} color="green" />
    </div>
  );
};