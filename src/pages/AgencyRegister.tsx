// src/pages/AgencyRegister.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { createAgencyProfile } from '../services/agencyApi';

export const AgencyRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // 1. Cria o usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: agencyName, // Passa o nome da agência como nome completo inicial
          },
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('A criação do usuário falhou.');

      // 2. Chama a função de serviço para criar o perfil da agência
      await createAgencyProfile(
        {
          name: agencyName,
          cnpj,
          address,
          phone,
          email,
        },
        authData.user.id
      );

      setSuccess(true);
      toast.success('Cadastro realizado! Verifique seu e-mail para confirmação.');
      setTimeout(() => navigate('/'), 3000);
    } catch (error: any) {
      // Rollback: se algo der errado, tenta remover o usuário Auth criado
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Esta chamada requer privilégios de administrador.
        // A lógica de deleção pode precisar ser movida para uma função de backend segura.
        // await supabase.auth.admin.deleteUser(user.id);
        console.warn(
          'O cadastro da agência falhou, mas o usuário de autenticação pode ter sido criado. Considere implementar uma rotina de limpeza no backend.'
        );
      }
      setError(error.message);
      toast.error(error.message || 'Falha ao cadastrar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg">
        <div className="text-center">
            <Briefcase className="mx-auto h-10 w-10 text-blue-600" />
            <h1 className="text-2xl font-bold text-center text-gray-800 mt-2">Cadastro de Agência</h1>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-green-600">
              Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta antes de fazer o login.
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <input type="text" placeholder="Nome da Agência *" value={agencyName} onChange={e => setAgencyName(e.target.value)} required disabled={loading} className="w-full px-3 py-2 border rounded-md" />
            <input type="email" placeholder="Email de Contato *" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} className="w-full px-3 py-2 border rounded-md" />
            <input type="password" placeholder="Senha (mínimo 6 caracteres) *" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} className="w-full px-3 py-2 border rounded-md" />
            <input type="tel" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} disabled={loading} className="w-full px-3 py-2 border rounded-md" />
            <input type="text" placeholder="CNPJ" value={cnpj} onChange={e => setCnpj(e.target.value)} disabled={loading} className="w-full px-3 py-2 border rounded-md" />
            <input type="text" placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} disabled={loading} className="w-full px-3 py-2 border rounded-md" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
              {loading ? 'Cadastrando...' : 'Criar Conta de Agência'}
            </button>
          </form>
        )}
         <p className="text-center text-sm mt-6">
          Já tem uma conta?{' '}
          <Link to="/" className="text-blue-600 hover:underline">
            Faça o login
          </Link>
        </p>
      </div>
    </div>
  );
};
