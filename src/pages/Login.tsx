// src/pages/Login.tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/public/LoginForm';
import { ReservationCalendar } from '../components/public/ReservationCalendar';
import { useAuth } from '../hooks/useAuth';

export const Login = () => {
  const { isStaff, isAgency, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona o usuário se ele já estiver logado
    if (!loading) {
      if (isStaff) {
        navigate('/'); // Rota do dashboard
      } else if (isAgency) {
        navigate('/agency-portal');
      }
    }
  }, [isStaff, isAgency, loading, navigate]);

  // Se ainda estiver carregando a sessão, pode-se mostrar um loader
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Lado Esquerdo - Formulário de Login */}
      <div className="flex items-center justify-center p-8 bg-white">
        <LoginForm />
      </div>

      {/* Lado Direito - Calendário Público de Disponibilidade */}
      <div className="bg-gray-50 p-8 flex items-center justify-center border-l border-gray-200">
        <ReservationCalendar publicView={true} />
      </div>
    </div>
  );
};
