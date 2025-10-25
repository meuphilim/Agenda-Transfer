import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { ReservationCalendar } from '../public/ReservationCalendar';
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
        setIsSignUp(false);
      } else {
        await signIn(formData.email, formData.password);
      }
    } catch (error: any) {
      toast.error(error.message ?? 'Ocorreu um erro.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-gradient-to-br from-eco-light-100 to-eco-light-200">

      {/* Coluna Esquerda: Formulário com Fundo Decorativo */}
      <div className="flex items-center justify-center bg-eco-white p-6 lg:p-8">
        <AuthForm
          mode={isSignUp ? 'signup' : 'login'}
          onSubmit={handleSubmit}
          onToggleMode={toggleMode}
          loading={loading}
        />
      </div>

      {/* Coluna Direita: Calendário */}
      <div className="flex items-center justify-center bg-gradient-to-br from-eco-light-100 to-eco-light-200 p-6 lg:p-12 border-l border-eco-light-300">
        <ReservationCalendar />
      </div>

    </div>
  );
};
