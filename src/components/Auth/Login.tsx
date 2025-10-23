// src/components/Auth/Login.tsx - MODIFICADO PARA SPLIT SCREEN
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Briefcase } from 'lucide-react';
import { ReservationCalendar } from '../public/ReservationCalendar';
import { Link } from 'react-router-dom';

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

    if (!formData.email) newErrors.email = 'Email é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido';

    if (!formData.password) newErrors.password = 'Senha é obrigatória';
    else if (formData.password.length < 6) newErrors.password = 'Senha deve ter pelo menos 6 caracteres';

    if (isSignUp) {
      if (!formData.fullName.trim()) newErrors.fullName = 'Nome completo é obrigatório';
      if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
      else if (!/^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(formData.phone)) newErrors.phone = 'Formato: (00) 00000-0000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, '').replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    const finalValue = field === 'phone' ? formatPhone(value) : value;
    setFormData(prev => ({ ...prev, [field]: finalValue }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(formData.email, formData.password, formData.fullName, formData.phone);
        toast.success('Conta criada! Aguarde a aprovação do administrador.');
        setIsSignUp(false); // Retorna para a tela de login
      } else {
        await signIn(formData.email, formData.password);
        // O redirecionamento será tratado pelo hook useAuth no App.tsx
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Coluna da Esquerda: Formulário de Login/Cadastro de Staff */}
      <div className="flex flex-col items-center justify-center bg-white p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Briefcase className="mx-auto h-12 w-12 text-blue-600" />
            <h1 className="mt-4 text-3xl font-bold text-gray-900">TourManager</h1>
            <p className="mt-2 text-sm text-gray-600">
              {isSignUp ? 'Crie sua conta de colaborador' : 'Acesse sua conta de colaborador'}
            </p>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-xl">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {isSignUp && (
                 <>
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input id="fullName" type="text" required className="mt-1 block w-full px-4 py-3 border rounded-lg" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} />
                    {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
                    <input id="phone" type="tel" required className="mt-1 block w-full px-4 py-3 border rounded-lg" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} />
                    {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
                  </div>
                </>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                <input id="email" type="email" required className="mt-1 block w-full px-4 py-3 border rounded-lg" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} />
                {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha</label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} required className="mt-1 block w-full px-4 py-3 pr-10 border rounded-lg" value={formData.password} onChange={(e) => handleInputChange('password', e.target.value)} />
                  <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
              </div>

              <div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-3 px-4 font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700">
                  {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
                </button>
              </div>
            </form>

            <div className="text-center mt-6 space-y-4">
               <button type="button" onClick={toggleMode} className="text-sm text-blue-600 hover:underline">
                {isSignUp ? 'Já tem uma conta de colaborador? Faça login' : 'Não tem conta de colaborador? Cadastre-se'}
              </button>
              <p className="text-sm text-gray-600 border-t pt-4">
                É uma agência?{' '}
                <Link to="/agency-register" className="font-medium text-blue-600 hover:underline">
                  Cadastre sua agência aqui
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna da Direita: Calendário Público */}
      <div className="bg-gray-50 p-8 flex items-center justify-center border-l border-gray-200">
        <ReservationCalendar />
      </div>
    </div>
  );
};
