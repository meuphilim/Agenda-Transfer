import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { UserIcon } from '@heroicons/react/24/outline';

interface FormData {
  fullName: string;
  phone: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
}

export const CompleteProfile: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { completeProfile, signOut, user } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Nome deve ter pelo menos 2 caracteres';
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = 'Telefone é obrigatório';
    } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = 'Formato: (00) 00000-0000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    return value;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    if (field === 'phone') {
      value = formatPhone(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await completeProfile(formData.fullName, formData.phone);
      toast.success('Perfil completado com sucesso! Aguarde a aprovação do administrador.');
    } catch (error: any) {
      if (error.message?.includes('duplicate key')) {
        toast.error('Perfil já existe. Recarregando página...');
        setTimeout(() => window.location.reload(), 2000);
      } else if (error.message?.includes('permission denied')) {
        toast.error('Erro de permissão. Tente novamente ou contate o suporte.');
      } else {
        toast.error(error.message || 'Erro ao completar perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <UserIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete seu Perfil
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Para continuar, precisamos de algumas informações adicionais
          </p>
          {user?.email && (
            <p className="mt-1 text-center text-xs text-gray-500">
              Logado como: {user.email}
            </p>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo *
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${
                  errors.fullName ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="Seu nome completo"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
              />
              {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                maxLength={15}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm ${
                  errors.phone ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="(00) 00000-0000"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Completando Perfil...
                </div>
              ) : (
                'Completar Perfil'
              )}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleSignOut}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors duration-200"
            >
              Sair da Conta
            </button>
          </div>
        </form>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> Após completar seu perfil, sua conta ficará pendente de aprovação por um administrador. 
            Você receberá acesso assim que sua conta for aprovada.
          </p>
        </div>
      </div>
    </div>
  );
};