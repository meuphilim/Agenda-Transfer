import { useState, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, MoreVertical, Search } from 'lucide-react';
import { MobileModal } from '../components/Common';
import { cn } from '../lib/utils';
import { Database } from '../types/database.types';

type Attraction = Database['public']['Tables']['attractions']['Row'];

interface AttractionFormData {
  name: string;
  description: string;
  estimated_duration: number;
  location: string;
  valor_net: string;
  active: boolean;
}

export const Attractions: React.FC = () => {
  const { data: attractions, loading, create, update, delete: deleteAttraction } = useSupabaseData<Attraction>({
    table: 'attractions',
    orderBy: { column: 'name' },
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState<Attraction | null>(null);
  const [formData, setFormData] = useState<AttractionFormData>({
    name: '', description: '', estimated_duration: 60, location: '', valor_net: '', active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const filteredAttractions = useMemo(() => {
    if (!searchTerm) return attractions;
    return attractions.filter(a =>
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [attractions, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      valor_net: formData.valor_net ? parseFloat(formData.valor_net) : null,
    };
    try {
      if (editingAttraction) {
        await update(editingAttraction.id, dataToSave);
        toast.success('Atrativo atualizado!');
      } else {
        await create(dataToSave);
        toast.success('Atrativo cadastrado!');
      }
      handleModalClose();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const handleEdit = (attraction: Attraction) => {
    setEditingAttraction(attraction);
    setFormData({
      name: attraction.name,
      description: attraction.description ?? '',
      estimated_duration: attraction.estimated_duration,
      location: attraction.location ?? '',
      valor_net: attraction.valor_net?.toString() ?? '',
      active: attraction.active,
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string, name: string) => {
    setActiveMenu(null);
    if (!confirm(`Excluir o atrativo "${name}"?`)) return;
    await deleteAttraction(id);
    toast.success('Atrativo excluído!');
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', estimated_duration: 60, location: '', valor_net: '', active: true });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAttraction(null);
    resetForm();
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  if (loading && !attractions.length) {
    return <div className="p-4 md:p-6">Carregando atrativos...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex-1 md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou local..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2">
          <Plus className="h-5 w-5" />
          Novo Atrativo
        </button>
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duração</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Net</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y">
            {filteredAttractions.map((attraction) => (
              <tr key={attraction.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900">{attraction.name}</div>
                  <div className="text-sm text-gray-500">{attraction.location}</div>
                </td>
                <td className="px-6 py-4 text-sm">{formatDuration(attraction.estimated_duration)}</td>
                <td className="px-6 py-4 text-sm font-medium">R$ {attraction.valor_net?.toFixed(2).replace('.', ',') ?? '0,00'}</td>
                <td className="px-6 py-4">
                  <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', attraction.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                    {attraction.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleEdit(attraction)} className="text-blue-600 mr-3"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(attraction.id, attraction.name)} className="text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredAttractions.map((attraction) => (
          <div key={attraction.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{attraction.name}</h3>
                <div className="relative">
                  <button onClick={() => setActiveMenu(activeMenu === attraction.id ? null : attraction.id)} className="ml-3 p-2 hover:bg-gray-200 rounded-full">
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                  {activeMenu === attraction.id && (
                     <div className="absolute right-0 mt-2 w-40 bg-white rounded-md shadow-lg z-10 border">
                       <button onClick={() => handleEdit(attraction)} className="w-full text-left px-4 py-2 text-sm flex items-center gap-3"><Pencil size={14} /> Editar</button>
                       <button onClick={() => handleDelete(attraction.id, attraction.name)} className="w-full text-left px-4 py-2 text-sm text-red-600 flex items-center gap-3"><Trash2 size={14} /> Excluir</button>
                     </div>
                  )}
                </div>
              </div>
               <span className={cn('mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full', attraction.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                  {attraction.active ? 'Ativo' : 'Inativo'}
               </span>
            </div>
            <div className="p-4 space-y-2">
              <div className="text-sm"><span className="font-medium text-gray-500">Local:</span> {attraction.location ?? 'N/A'}</div>
              <div className="text-sm"><span className="font-medium text-gray-500">Duração:</span> {formatDuration(attraction.estimated_duration)}</div>
              <div className="text-sm"><span className="font-medium text-gray-500">Valor Net:</span> R$ {attraction.valor_net?.toFixed(2).replace('.', ',') ?? '0,00'}</div>
            </div>
          </div>
        ))}
      </div>

      <MobileModal isOpen={showModal} onClose={handleModalClose} title={editingAttraction ? 'Editar Atrativo' : 'Novo Atrativo'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium mb-1">Nome *</label>
              <input id="name" type="text" required className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="location" className="block text-sm font-medium mb-1">Localização</label>
              <input id="location" type="text" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>
            <div>
              <label htmlFor="estimated_duration" className="block text-sm font-medium mb-1">Duração (min) *</label>
              <input id="estimated_duration" type="number" required min="1" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.estimated_duration} onChange={e => setFormData({...formData, estimated_duration: parseInt(e.target.value)})} />
            </div>
            <div>
              <label htmlFor="valor_net" className="block text-sm font-medium mb-1">Valor Net (R$)</label>
              <input id="valor_net" type="number" step="0.01" className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.valor_net} onChange={e => setFormData({...formData, valor_net: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium mb-1">Descrição</label>
              <textarea id="description" rows={3} className="w-full px-4 py-3 md:py-2 border rounded-lg" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
            <div className="flex items-center gap-3">
              <input id="active" type="checkbox" className="h-4 w-4 rounded" checked={formData.active} onChange={e => setFormData({...formData, active: e.target.checked})} />
              <label htmlFor="active" className="text-sm font-medium">Atrativo ativo</label>
            </div>
          </div>
          <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t mt-6">
            <button type="button" onClick={handleModalClose} className="w-full md:w-auto px-6 py-3 md:py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="w-full md:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg">Salvar</button>
          </div>
        </form>
      </MobileModal>
    </div>
  );
};