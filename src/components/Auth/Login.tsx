import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { ReservationCalendar } from '../public/ReservationCalendar';
import { AuthHeader } from './AuthHeader';
import { AuthForm } from './AuthForm';
import { FormData } from '../../types/auth.types';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (formData: FormData) => {
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.phone
        );
        toast.success('Conta criada! Aguarde a aprovação do administrador.');
        setIsSignUp(false); // Retorna para tela de login
      } else {
        await signIn(formData.email, formData.password);
        // Redirecionamento tratado pelo AuthContext
      }
    } catch (error: any) {
      toast.error(error.message ?? 'Ocorreu um erro.');
      throw error; // Importante para o AuthForm não resetar em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Centralizado no Topo */}
      <AuthHeader isSignUp={isSignUp} />

      {/* Layout Split-Screen */}
      <div className="flex-1 grid lg:grid-cols-2">
        {/* Coluna Esquerda: Formulário */}
        <div className="flex items-center justify-center bg-white p-4">
          <AuthForm
            mode={isSignUp ? 'signup' : 'login'}
            onSubmit={handleSubmit}
            onToggleMode={toggleMode}
            loading={loading}
          />
        </div>

        {/* Coluna Direita: Calendário Público */}
        <div className="bg-gray-50 p-8 flex items-center justify-center border-l border-gray-200">
          <ReservationCalendar />
        </div>
      </div>
    </div>
  );
};
