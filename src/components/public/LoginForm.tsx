// src/components/public/LoginForm.tsx
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  // Este hook será usado para o redirecionamento na página principal, não aqui diretamente.

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // Após o login, o listener do `useAuth` no App.tsx (ou similar)
      // detectará a mudança e o redirecionamento será tratado lá.
      // Por enquanto, podemos forçar um reload para garantir que o estado seja pego.
       window.location.href = '/';
    } catch (error: any) {
      setError(error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Acesso ao Sistema</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 mt-1 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={loading}
          />
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
       <p className="text-center text-sm mt-6 text-gray-600">
          É uma agência e não tem cadastro?{' '}
          <a href="/agency-register" className="text-blue-600 hover:underline">
            Cadastre-se aqui
          </a>
        </p>
    </div>
  );
};
