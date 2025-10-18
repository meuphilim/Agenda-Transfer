import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { User } from 'lucide-react';

interface FormData {
  fullName: string;
  phone: string;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
}

export const CompleteProfile: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ fullName: '', phone: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const { completeProfile, signOut, user } = useAuth();

  if (!user) return null; // Safeguard

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    }

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
    const finalValue = field === 'phone' ? formatPhone(value) : value;
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await completeProfile(formData.fullName, formData.phone);
      toast.success('Perfil completado! Aguarde a aprovação.');
    } catch (error: any) {
      toast.error(error.message ?? 'Erro ao completar perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <User className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">Complete seu Perfil</h1>
          <p className="mt-2 text-sm text-gray-600">
            Falta pouco! Precisamos de mais algumas informações.
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nome Completo *</label>
              <input id="fullName" name="fullName" type="text" required className="mt-1 block w-full px-4 py-3 border rounded-lg" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} />
              {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
            </div>
            
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone *</label>
              <input id="phone" name="phone" type="tel" required className="mt-1 block w-full px-4 py-3 border rounded-lg" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
              {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
                {loading ? 'Salvando...' : 'Completar Perfil'}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <button type="button" onClick={signOut} className="text-sm text-gray-600 hover:underline">
              Sair
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};