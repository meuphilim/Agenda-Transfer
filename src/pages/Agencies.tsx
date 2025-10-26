import { useState, useMemo } from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { toast } from 'react-toastify';
import { Plus, Pencil, Trash2, MoreVertical, Search } from 'lucide-react';
import { Modal, LoadingSpinner } from '../components/Common';
import { cn } from '../lib/utils';

interface Agency {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  cnpj: string | null;
  address: string | null;
  active: boolean;
  created_at: string;
} 

interface AgencyFormData {
  name: string;
  contact_person: string;
  phone: string;
  email: string;
  cnpj: string;
  address: string;
  active: boolean;
}

export const Agencies: React.FC = () => {
  const { data: agencies, loading, create, update, delete: deleteAgency } = useSupabaseData<Agency>({
    table: 'agencies',
    orderBy: { column: 'name' },
  });
  
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);
  const [formData, setFormData] = useState<AgencyFormData>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    cnpj: '',
    address: '',
    active: true,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredAgencies = useMemo(() => {
    if (!searchTerm) return agencies;
    return agencies.filter(agency =>
      agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agency.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [agencies, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingAgency) {
        await update(editingAgency.id, formData);
        toast.success('Agência atualizada com sucesso!');
      } else {
        await create(formData);
        toast.success('Agência cadastrada com sucesso!');
      }
      handleModalClose();
    } catch (error: any) {
      toast.error('Erro ao salvar agência: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (agency: Agency) => {
    setEditingAgency(agency);
    setFormData({
      name: agency.name,
      contact_person: agency.contact_person ?? '',
      phone: agency.phone ?? '',
      email: agency.email ?? '',
      cnpj: agency.cnpj ?? '',
      address: agency.address ?? '',
      active: agency.active,
    });
    setShowModal(true);
    setActiveMenu(null);
  };

  const handleDelete = async (id: string, name: string) => {
    setActiveMenu(null);
    if (!confirm(`Tem certeza que deseja excluir a agência "${name}"?`)) return;
    await deleteAgency(id);
    toast.success('Agência excluída com sucesso!');
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      cnpj: '',
      address: '',
      active: true,
    });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingAgency(null);
    resetForm();
  };

  const getFieldLabel = (key: string) => ({
    name: 'Nome',
    contact_person: 'Contato',
    phone: 'Telefone',
    email: 'Email',
    cnpj: 'CNPJ',
    address: 'Endereço',
    active: 'Status'
  }[key] || key);

  const formatFieldValue = (key: string, value: any) => {
    if (key === 'active') {
      return value ? 'Ativa' : 'Inativa';
    }
    return value ?? 'N/A';
  };

  if (loading && !agencies.length) {
    return <div className="p-4 md:p-6 flex justify-center items-center"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-4 space-y-3 md:space-y-0 md:flex md:items-center md:justify-between">
        <div className="flex-1 md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, contato, CNPJ..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Nova Agência
        </button>
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAgencies.map((agency) => (
              <tr key={agency.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{agency.name}</div>
                  <div className="text-sm text-gray-500">{agency.contact_person}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{agency.phone}</div>
                  <div className="text-sm text-gray-500">{agency.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{agency.cnpj}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn('inline-flex px-2 py-1 text-xs font-semibold rounded-full', agency.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                    {agency.active ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleEdit(agency)} className="text-blue-600 hover:text-blue-900 mr-3"><Pencil size={16} /></button>
                  <button onClick={() => handleDelete(agency.id, agency.name)} className="text-red-600 hover:text-red-900"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {filteredAgencies.map((agency) => (
          <div key={agency.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 bg-gray-50/50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 truncate flex-1">{agency.name}</h3>
                <div className="relative">
                  <button onClick={() => setActiveMenu(activeMenu === agency.id ? null : agency.id)} className="ml-3 p-2 hover:bg-gray-200 rounded-full">
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                  {activeMenu === agency.id && (
                     <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                       <button onClick={() => handleEdit(agency)} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"><Pencil size={14} /> Editar</button>
                       <button onClick={() => handleDelete(agency.id, agency.name)} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"><Trash2 size={14} /> Excluir</button>
                     </div>
                  )}
                </div>
              </div>
               <span className={cn('mt-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full', agency.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')}>
                  {agency.active ? 'Ativa' : 'Inativa'}
               </span>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(agency).filter(([key]) => ['contact_person', 'phone', 'email', 'cnpj'].includes(key)).map(([key, value]) => (
                <div key={key} className="flex items-start text-sm">
                  <span className="font-medium text-gray-500 w-20 flex-shrink-0">{getFieldLabel(key)}:</span>
                  <span className="text-gray-800 flex-1">{formatFieldValue(key, value)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={showModal} onClose={handleModalClose} title={editingAgency ? 'Editar Agência' : 'Nova Agência'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
              <input id="name" type="text" required className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label htmlFor="contact_person" className="block text-sm font-medium text-gray-700 mb-1">Contato</label>
              <input id="contact_person" type="text" className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" value={formData.contact_person} onChange={(e) => setFormData({...formData, contact_person: e.target.value})} />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
              <input id="phone" type="text" className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
             <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input id="email" type="email" className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
             <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
              <input id="cnpj" type="text" className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" value={formData.cnpj} onChange={(e) => setFormData({...formData, cnpj: e.target.value})} />
            </div>
             <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
              <textarea id="address" rows={3} className="w-full px-4 py-3 md:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
            </div>
             <div className="md:col-span-2 flex items-center gap-3">
                <input type="checkbox" id="active" className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked={formData.active} onChange={(e) => setFormData({...formData, active: e.target.checked})} />
                <label htmlFor="active" className="text-sm font-medium text-gray-700">Agência ativa</label>
             </div>
          </div>
          <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t border-gray-200 mt-6">
            <button type="button" onClick={handleModalClose} className="w-full md:w-auto px-6 py-3 md:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium" disabled={isSubmitting}>Cancelar</button>
            <button type="submit" className="w-full md:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : 'Salvar'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};