// src/pages/Login.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { signIn, user, profile, loading: authLoading } = useAuth();

  useEffect(() => {
    // Roda quando o perfil do usuário é carregado ou alterado
    if (!authLoading && user && profile) {
      if (profile.is_admin) {
        navigate('/dashboard');
      } else if (profile.agency_id) {
        navigate('/agency-portal');
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      // O useEffect cuidará do redirecionamento
    } catch (error: any) {
      setError(error.message || 'Falha ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Login</h1>
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 mt-1 border rounded-md"
              required
            />
          </div>
          {error && <p className="text-red-500">{error}</p>}
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md" disabled={loading || authLoading}>
            {loading || authLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
        <p className="text-center">
          Não tem uma conta de agência?{' '}
          <a href="/agency-register" className="text-blue-600">
            Cadastre-se
          </a>
        </p>
      </div>
    </div>
  );
};
