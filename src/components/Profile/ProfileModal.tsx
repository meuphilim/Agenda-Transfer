import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { X, UserCircle2 } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ full_name?: string; phone?: string }>({});
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  // ✅ CORRIGIDO: useEffect para sincronizar com profile
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name ?? '',
        phone: profile.phone ?? '',
      });
    }
  }, [profile, isOpen]); // ✅ Atualiza quando modal abre

  // ✅ NOVO: Reset ao fechar modal
  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: { full_name?: string; phone?: string } = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Nome completo é obrigatório';
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = 'Nome deve ter pelo menos 2 caracteres';
    }

    if (formData.phone && !/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Formato: (00) 00000-0000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          phone: formData.phone ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      // ✅ Aguarda refresh completar antes de fechar
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
      handleClose();
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      toast.error('Erro ao atualizar perfil: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

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
    return value.slice(0, 15);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData({ ...formData, phone: formatted });
    
    if (errors.phone) {
      setErrors({ ...errors, phone: undefined });
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, full_name: e.target.value });
    
    if (errors.full_name) {
      setErrors({ ...errors, full_name: undefined });
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <UserCircle2 className="h-10 w-10 text-blue-600" />
                    </div>
                    <div>
                      <Dialog.Title
                        as="h3"
                        className="text-lg font-medium leading-6 text-gray-900"
                      >
                        Editar Perfil
                      </Dialog.Title>
                      <p className="text-sm text-gray-500 mt-1">
                        Atualize suas informações pessoais
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={loading}
                    className="text-gray-400 hover:text-gray-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      value={formData.full_name}
                      onChange={handleNameChange}
                      disabled={loading}
                      placeholder="Digite seu nome completo"
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.full_name 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                      required
                    />
                    {errors.full_name && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.full_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      disabled={loading}
                      className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed ${
                        errors.phone 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email ?? ''}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 shadow-sm sm:text-sm cursor-not-allowed text-gray-600"
                      disabled
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      🔒 O email não pode ser alterado
                    </p>
                  </div>

                  {/* ✅ NOVO: Informações de status */}
                  {profile && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-blue-700">
                            <span className="font-medium">Status da conta:</span>{' '}
                            {profile.status === 'active' && '✅ Ativa'}
                            {profile.status === 'pending' && '⏳ Pendente de aprovação'}
                            {profile.status === 'inactive' && '❌ Inativa'}
                          </p>
                          {profile.is_admin && (
                            <p className="text-xs text-blue-600 mt-1">
                              🔷 Você possui privilégios de administrador
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Salvando...
                        </>
                      ) : (
                        'Salvar Alterações'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
