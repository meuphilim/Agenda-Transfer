import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Briefcase } from 'lucide-react';

// ... (interfaces e funções auxiliares permanecem as mesmas)
interface FormData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  fullName?: string;
  phone?: string;
}


export const Login: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '', fullName: '', phone: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter pelo menos 6 caracteres';
    }

    if (isSignUp) {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Nome completo é obrigatório';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Telefone é obrigatório';
      } else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) {
        newErrors.phone = 'Formato: (00) 00000-0000';
      }
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
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.fullName, formData.phone);
        toast.success('Conta criada! Aguarde a aprovação.');
      } else {
        await signIn(formData.email, formData.password);
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      toast.error(error.message ?? 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setErrors({});
    setFormData({ email: '', password: '', fullName: '', phone: '' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Briefcase className="mx-auto h-12 w-12 text-blue-600" />
          <h1 className="mt-4 text-3xl font-bold text-gray-900">TourManager</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isSignUp ? 'Crie sua conta para começar' : 'Acesse sua conta para continuar'}
          </p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-xl shadow-md">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {isSignUp && (
              <>
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                  <input id="fullName" name="fullName" type="text" required className="mt-1 block w-full px-4 py-3 border rounded-lg focus:ring-blue-500" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} />
                  {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                  <input id="phone" name="phone" type="tel" required className="mt-1 block w-full px-4 py-3 border rounded-lg" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                  {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                </div>
              </>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input id="email" name="email" type="email" required autoComplete="email" className="mt-1 block w-full px-4 py-3 border rounded-lg" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
              {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? 'text' : 'password'} required className="mt-1 block w-full px-4 py-3 pr-10 border rounded-lg" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
            </div>

            <div>
              <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 border border-transparent font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
                {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <button type="button" onClick={toggleMode} className="text-sm text-blue-600 hover:underline">
              {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
        
        {isSignUp && (
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-400">
            <p className="text-sm text-blue-800">
              <strong>Aviso:</strong> Sua conta precisará ser aprovada por um administrador antes que você possa fazer login.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};