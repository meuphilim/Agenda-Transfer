import { useState, useEffect, useMemo } from 'react';
import { UserStatus } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/adminApi';
import { 
  Users, CheckCircle, XCircle, Clock, Pencil, MoreVertical, Search, UserCog, UserCheck, UserX
} from 'lucide-react';
import { MobileModal } from '../components/Common';
import { cn } from '../lib/utils';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  is_admin: boolean;
  status: UserStatus;
  email?: string | null;
}

const tabs: { key: UserStatus | 'all', name: string, icon: React.ElementType }[] = [
  { key: 'all', name: 'Todos', icon: Users },
  { key: 'pending', name: 'Pendentes', icon: Clock },
  { key: 'active', name: 'Ativos', icon: UserCheck },
  { key: 'inactive', name: 'Inativos', icon: UserX },
];

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [filter, setFilter] = useState<UserStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await adminApi.listUsers();
      if (error) throw new Error(error);
      setUsers(data ?? []);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await adminApi.updateUser(userId, updates);
      if (error) throw new Error(error);
      await fetchUsers(); // Re-fetch to get the latest state
      toast.success('Usuário atualizado com sucesso!');
      setShowEditModal(false);
    } catch (error: any) {
      toast.error('Erro ao atualizar usuário: ' + error.message);
    }
  };

  const handleEdit = (user: UserProfile) => {
    setEditingUser(user);
    setShowEditModal(true);
    setActiveMenu(null);
  }

  const filteredUsers = useMemo(() => {
    return users
      .filter(user => filter === 'all' || user.status === filter)
      .filter(user => {
        const search = searchTerm.toLowerCase();
        return (
          user.full_name.toLowerCase().includes(search) ||
          user.email?.toLowerCase().includes(search)
        );
      });
  }, [users, filter, searchTerm]);

  const getStatusInfo = (status: UserStatus) => ({
    active: { text: 'Ativo', color: 'bg-green-100 text-green-800' },
    pending: { text: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    inactive: { text: 'Inativo', color: 'bg-red-100 text-red-800' },
  }[status]);

  if (!isAdmin) return <div className="p-6 text-center text-red-600">Acesso Negado.</div>;
  if (loading) return <div className="p-6">Carregando usuários...</div>;

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        <p className="mt-1 text-sm text-gray-500">Gerencie usuários, status e permissões.</p>
      </div>

      <div className="mb-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={cn(
                "flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2",
                filter === tab.key ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100 border"
              )}
            >
              <tab.icon size={16} />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Tabela */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden border">
         <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
               <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
               </tr>
            </thead>
            <tbody className="bg-white divide-y">
               {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                     <td className="px-6 py-4">
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                     </td>
                     <td className="px-6 py-4">
                        <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', getStatusInfo(user.status).color)}>
                           {getStatusInfo(user.status).text}
                        </span>
                     </td>
                     <td className="px-6 py-4 text-sm">
                        {user.is_admin ? 'Admin' : 'Usuário'}
                     </td>
                     <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(user)} className="text-blue-600"><Pencil size={16}/></button>
                     </td>
                  </tr>
               ))}
            </tbody>
         </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
         {filteredUsers.map(user => (
            <div key={user.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
               <div className="p-4 border-b">
                  <div className="flex items-start justify-between">
                     <div className="flex-1">
                        <h3 className="font-semibold">{user.full_name}</h3>
                        <p className="text-sm text-gray-500">{user.email}</p>
                     </div>
                     <div className="relative">
                        <button onClick={() => setActiveMenu(user.id === activeMenu ? null : user.id)} className="p-2">
                           <MoreVertical size={20} />
                        </button>
                        {activeMenu === user.id && (
                           <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg z-10 border">
                              <button onClick={() => handleEdit(user)} className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100">
                                 <Pencil size={14}/> Editar
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                     <span className={cn('px-2 py-1 text-xs font-semibold rounded-full', getStatusInfo(user.status).color)}>
                        {getStatusInfo(user.status).text}
                     </span>
                     {user.is_admin && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                           <UserCog size={12}/> Admin
                        </span>
                     )}
                  </div>
               </div>
            </div>
         ))}
      </div>

      <UserEditModal isOpen={showEditModal} user={editingUser} onClose={() => setShowEditModal(false)} onSave={handleSaveUser}/>
    </div>
  );
};

// Modal de Edição
interface UserEditModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<UserProfile>) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, user, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    if (user) setFormData({ full_name: user.full_name, phone: user.phone, status: user.status, is_admin: user.is_admin });
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) onSave(user.id, formData);
  };

  if (!user) return null;

  return (
    <MobileModal isOpen={isOpen} onClose={onClose} title="Editar Usuário">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input type="text" value={formData.full_name ?? ''} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
         <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" disabled value={user.email ?? ''} className="w-full p-2 border rounded-lg bg-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <input type="tel" value={formData.phone ?? ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as UserStatus})} className="w-full p-2 border rounded-lg">
            <option value="pending">Pendente</option>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" id="is_admin" checked={formData.is_admin ?? false} onChange={e => setFormData({...formData, is_admin: e.target.checked})} className="h-4 w-4 rounded"/>
          <label htmlFor="is_admin">É Administrador?</label>
        </div>
        <div className="flex flex-col-reverse md:flex-row gap-3 pt-4 border-t mt-6">
          <button type="button" onClick={onClose} className="w-full md:w-auto px-6 py-3 md:py-2 border rounded-lg">Cancelar</button>
          <button type="submit" className="w-full md:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg">Salvar Alterações</button>
        </div>
      </form>
    </MobileModal>
  );
}