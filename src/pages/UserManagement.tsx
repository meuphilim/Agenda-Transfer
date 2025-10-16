import { useState, useEffect } from 'react';
import { UserStatus } from '../contexts/AuthContext';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import { adminApi } from '../services/adminApi';
import { 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Pencil,
  Trash2,
  Eye,
  X,
  UserCheck,
  UserX,
  UserCog
} from 'lucide-react';

interface UserProfile {
  id: string;
  full_name: string;
  phone: string | null;
  is_admin: boolean;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  email?: string | null;
}

interface UserEditModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<UserProfile>) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onSave 
}) => {
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    is_admin: false,
    status: 'pending' as UserStatus,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone ?? '',
        is_admin: user.is_admin,
        status: user.status,
      });
    }
  }, [user]);

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(
        /^(\d{0,2})(\d{0,5})(\d{0,4})/,
        (_, ddd, first, second) => {
          let formatted = '';
          if (ddd) formatted += `(${ddd}`;
          if (ddd.length === 2) formatted += ') ';
          if (first) formatted += first;
          if (second) formatted += `-${second}`;
          return formatted;
        }
      );
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      onSave(user.id, formData);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Editar Usuário
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
                value={user.email ?? ''}
              />
              <p className="mt-1 text-xs text-gray-500">O email não pode ser alterado</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone
              </label>
              <input
                type="tel"
                maxLength={15}
                placeholder="(00) 00000-0000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.phone}
                onChange={handlePhoneChange}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as UserStatus})}
              >
                <option value="pending">Pendente</option>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_admin"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.is_admin}
                onChange={(e) => setFormData({...formData, is_admin: e.target.checked})}
              />
              <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-700">
                Administrador
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </div>
                ) : (
                  'Salvar'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

interface UserDetailsModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (userId: string, status: UserStatus) => void;
  onAdminToggle: (userId: string, isAdmin: boolean) => void;
  onDeleteUser: (userId: string) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ 
  user, 
  isOpen, 
  onClose, 
  onStatusUpdate,
  onAdminToggle,
  onDeleteUser
}) => {
  if (!isOpen || !user) return null;

  const getStatusIcon = (status: UserStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'inactive': return 'Inativo';
      case 'pending': return 'Pendente';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Detalhes do Usuário
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
              <p className="mt-1 text-sm text-gray-900">{user.full_name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Telefone</label>
              <p className="mt-1 text-sm text-gray-900">{user.phone ?? 'Não informado'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status Atual</label>
              <div className="mt-1 flex items-center">
                {getStatusIcon(user.status)}
                <span className="ml-2 text-sm text-gray-900">{getStatusText(user.status)}</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Tipo de Usuário</label>
              <p className="mt-1 text-sm text-gray-900">
                {user.is_admin ? 'Administrador' : 'Usuário'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Data de Cadastro</label>
              <p className="mt-1 text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-4">Ações Rápidas</h4>
            
            <div className="space-y-3">
              {/* Ações de Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Alterar Status</label>
                <div className="flex space-x-2">
                  {user.status !== 'active' && (
                    <button
                      onClick={() => onStatusUpdate(user.id, 'active')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Ativar
                    </button>
                  )}
                  {user.status !== 'inactive' && (
                    <button
                      onClick={() => onStatusUpdate(user.id, 'inactive')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Desativar
                    </button>
                  )}
                  {user.status !== 'pending' && (
                    <button
                      onClick={() => onStatusUpdate(user.id, 'pending')}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Pendente
                    </button>
                  )}
                </div>
              </div>

              {/* Toggle Admin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Privilégios</label>
                <button
                  onClick={() => onAdminToggle(user.id, !user.is_admin)}
                  className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white ${
                    user.is_admin 
                      ? 'bg-orange-600 hover:bg-orange-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Users className="h-4 w-4 mr-1" />
                  {user.is_admin ? 'Remover Admin' : 'Tornar Admin'}
                </button>
              </div>

              {/* Excluir Usuário */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zona de Perigo</label>
                <button
                  onClick={() => {
                    if (confirm(`Tem certeza que deseja excluir o usuário "${user.full_name}"? Esta ação não pode ser desfeita.`)) {
                      onDeleteUser(user.id);
                    }
                  }}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir Usuário
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const tabs = [
  { key: 'all', name: 'Todos', icon: Users },
  { key: 'pending', name: 'Pendentes', icon: Clock },
  { key: 'active', name: 'Ativos', icon: UserCheck },
  { key: 'inactive', name: 'Inativos', icon: UserX },
];

export const UserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await adminApi.listUsers();
      if (error) throw new Error(error);
      setUsers(data ?? []);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (userId: string, status: UserStatus) => {
    try {
      const { error } = await adminApi.updateUser(userId, { status });
      if (error) throw new Error(error);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, status } : user
      ));
      toast.success('Status do usuário atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  const updateUserAdmin = async (userId: string, isAdmin: boolean) => {
    try {
      const { error } = await adminApi.updateUser(userId, { is_admin: isAdmin });
      if (error) throw new Error(error);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, is_admin: isAdmin } : user
      ));
      toast.success(`Usuário ${isAdmin ? 'promovido a' : 'removido de'} administrador!`);
      setShowDetailsModal(false);
    } catch (error: any) {
      toast.error('Erro ao atualizar privilégios: ' + error.message);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await adminApi.deleteUser(userId);
      if (error) throw new Error(error);
      setUsers(users.filter(user => user.id !== userId));
      toast.success('Usuário excluído com sucesso!');
      setShowDetailsModal(false);
    } catch (error: any) {
      toast.error('Erro ao excluir usuário: ' + error.message);
    }
  };

  const handleEditUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleSaveUser = async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { error } = await adminApi.updateUser(userId, updates);
      if (error) throw new Error(error);
      setUsers(users.map(user =>
        user.id === userId ? { ...user, ...updates } : user
      ));
      toast.success('Usuário atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar usuário: ' + error.message);
      throw error;
    }
  };

  const handleViewUser = (user: UserProfile) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'pending': return 'Pendente';
      case 'inactive': return 'Inativo';
      default: return status;
    }
  };

  const getStatusDotColor = (status: UserStatus) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'inactive': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesFilter = filter === 'all' || user.status === filter;
    const matchesSearch = searchTerm === '' || 
      user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.phone ?? '').includes(searchTerm);
    return matchesFilter && matchesSearch;
  });

  const getFilterCount = (status: 'all' | UserStatus) => {
    if (status === 'all') return users.length;
    return users.filter(user => user.status === status).length;
  };

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600">
            Acesso Negado
          </h1>
          <p className="mt-2 text-gray-600">
            Você não tem permissão para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Gerenciamento de Usuários
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Gerencie usuários, status e permissões do sistema
        </p>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`group relative min-w-0 flex-1 overflow-hidden py-4 px-6 text-sm font-medium text-center hover:bg-gray-50 focus:z-10 ${
                  filter === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 border-b-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-center">
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name} ({getFilterCount(tab.key as any)})
                </div>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <input
              type="text"
              placeholder="Buscar por nome, email ou telefone..."
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastro</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filteredUsers.map((user, index) => (
                  <tr key={user.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phone ?? '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        <span className={`w-2 h-2 rounded-full mr-2 ${getStatusDotColor(user.status)}`}></span>
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {user.is_admin ? <UserCog className="w-3 h-3 mr-1" /> : <Users className="w-3 h-3 mr-1" />}
                        {user.is_admin ? 'Admin' : 'Usuário'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-3">
                        <button onClick={() => handleViewUser(user)} className="text-blue-600 hover:text-blue-900 transition-colors duration-200" title="Ver detalhes"><Eye className="h-5 w-5" /></button>
                        <button onClick={() => handleEditUser(user)} className="text-green-600 hover:text-green-900 transition-colors duration-200" title="Editar usuário"><Pencil className="h-5 w-5" /></button>
                        {user.status === 'pending' && <button onClick={() => updateUserStatus(user.id, 'active')} className="text-green-600 hover:text-green-900 transition-colors duration-200" title="Aprovar usuário"><CheckCircle className="h-5 w-5" /></button>}
                        {user.status === 'active' && <button onClick={() => updateUserStatus(user.id, 'inactive')} className="text-red-600 hover:text-red-900 transition-colors duration-200" title="Desativar usuário"><XCircle className="h-5 w-5" /></button>}
                        {user.status === 'inactive' && <button onClick={() => updateUserStatus(user.id, 'active')} className="text-green-600 hover:text-green-900 transition-colors duration-200" title="Reativar usuário"><CheckCircle className="h-5 w-5" /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12 bg-gray-50">
                <Users className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm
                    ? `Nenhum usuário encontrado para "${searchTerm}".`
                    : filter === 'all'
                      ? 'Não há usuários cadastrados no sistema.'
                      : `Não há usuários com status "${getStatusText(filter as UserStatus)}".`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <UserDetailsModal
        user={selectedUser}
        isOpen={showDetailsModal}
        onClose={() => { setShowDetailsModal(false); setSelectedUser(null); }}
        onStatusUpdate={updateUserStatus}
        onAdminToggle={updateUserAdmin}
        onDeleteUser={deleteUser}
      />

      <UserEditModal
        user={selectedUser}
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
        onSave={handleSaveUser}
      />
    </div>
  );
};