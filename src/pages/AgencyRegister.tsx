// src/pages/AgencyRegister.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export const AgencyRegister = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      // 1. Criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Criação de usuário falhou.");

      // 2. Criar a agência na tabela 'agencies'
      const { error: agencyError } = await supabase.from('agencies').insert({
        user_id: authData.user.id,
        name: agencyName,
        contact_email: email,
        contact_phone: phone,
      });
      if (agencyError) throw agencyError;

      setSuccess(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Cadastro de Agência</h1>
        {success ? (
          <p className="text-green-600 text-center">
            Cadastro realizado com sucesso! Verifique seu email para confirmar a conta.
          </p>
        ) : (
          <form onSubmit={handleRegister} className="space-y-6">
            <input type="text" placeholder="Nome da Agência" value={agencyName} onChange={e => setAgencyName(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            <input type="password" placeholder="Senha" value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-3 py-2 mt-1 border rounded-md" />
            <input type="tel" placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 mt-1 border rounded-md" />
            {error && <p className="text-red-500">{error}</p>}
            <button type="submit" className="w-full py-2 px-4 bg-blue-600 text-white rounded-md">
              Cadastrar
            </button>
          </form>
        )}
         <p className="text-center">
          Já tem uma conta?{' '}
          <a href="/login" className="text-blue-600">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};
