import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { X, UserCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { profile, user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });

  useEffect(() => {
    if (profile) {
      setFormData({ full_name: profile.full_name ?? '', phone: profile.phone ?? '' });
    }
  }, [profile, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: formData.full_name.trim(), phone: formData.phone ?? null })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success('Perfil atualizado!');
      onClose();
    } catch (error: any) {
      toast.error('Erro ao atualizar perfil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-0 md:p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full h-screen md:h-auto max-w-md transform overflow-hidden rounded-none md:rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <Dialog.Title as="h3" className="text-lg font-medium text-gray-900">Editar Perfil</Dialog.Title>
                      <p className="text-sm text-gray-500 mt-1">Atualize suas informações.</p>
                    </div>
                    <button onClick={onClose} disabled={loading} className="p-2 rounded-full hover:bg-gray-100">
                      <X size={20} />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="full_name" className="block text-sm font-medium mb-1">Nome Completo</label>
                      <input type="text" id="full_name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} disabled={loading} className="w-full px-4 py-3 border rounded-lg" required />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-1">Telefone</label>
                      <input type="tel" id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={loading} className="w-full px-4 py-3 border rounded-lg" />
                    </div>
                     <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input type="email" value={user?.email ?? ''} className="w-full px-4 py-3 border rounded-lg bg-gray-100 cursor-not-allowed" disabled />
                    </div>
                  </form>
                </div>

                <div className="p-4 bg-gray-50 border-t flex flex-col-reverse md:flex-row gap-3">
                  <button type="button" onClick={onClose} disabled={loading} className="w-full md:w-auto px-6 py-3 md:py-2 border rounded-lg">Cancelar</button>
                  <button type="submit" form="profile-form" disabled={loading} className="w-full md:w-auto px-6 py-3 md:py-2 bg-blue-600 text-white rounded-lg">
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};