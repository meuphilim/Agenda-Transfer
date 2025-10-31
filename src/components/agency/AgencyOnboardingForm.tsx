// src/components/agency/AgencyOnboardingForm.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Loader } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { createAgencyProfile } from '../../services/agencyApi';
import { toast } from 'sonner';

// Schema de validação completo
const schema = yup.object().shape({
  // Dados da Agência
  agencyName: yup.string().required('O nome da agência é obrigatório.'),
  contactPerson: yup.string(),
  agencyPhone: yup.string(),
  agencyEmail: yup.string().email('Formato de e-mail inválido.'),
  cnpj: yup.string(),
  address: yup.string(),

  // Dados do Usuário
  userFullName: yup.string().required('Seu nome completo é obrigatório.'),
  userEmail: yup.string().email('Seu e-mail é inválido.').required('Seu e-mail é obrigatório.'),
  userPhone: yup.string(),
  password: yup.string().min(6, 'A senha deve ter no mínimo 6 caracteres.').required('A senha é obrigatória.'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'As senhas não conferem.').required('A confirmação da senha é obrigatória.'),
});

type FormData = yup.InferType<typeof schema>;

export const AgencyOnboardingForm: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const { signUp, signIn } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setServerError(null);

    try {
      // Etapa 1: Criar o usuário no Supabase Auth
      const { user } = await signUp(data.userEmail, data.password, data.userFullName, data.userPhone || '');
      if (!user) {
        throw new Error('Não foi possível criar a conta de usuário.');
      }

      // Etapa 2: Chamar a RPC para criar o perfil da agência e vinculá-lo
      const agencyData = {
        name: data.agencyName,
        contact_person: data.contactPerson,
        phone: data.agencyPhone,
        email: data.agencyEmail,
        cnpj: data.cnpj,
        address: data.address,
      };

      await createAgencyProfile(agencyData, user.id);

      // Etapa 3: Fazer login com o novo usuário para iniciar a sessão
      await signIn(data.userEmail, data.password);

      toast.success('Agência cadastrada com sucesso! Você será redirecionado.');
      // O redirecionamento para /agency-portal será tratado automaticamente pelo AuthProvider

    } catch (error: any) {
      const errorMessage = error.message || 'Ocorreu um erro inesperado. Tente novamente.';
      setServerError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Seção de Dados da Agência */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Informações da Agência</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="agencyName" className="block text-sm font-medium text-gray-700">Nome da Agência *</label>
            <input id="agencyName" type="text" {...register('agencyName')} className="input-class" />
            {errors.agencyName && <p className="error-class">{errors.agencyName.message}</p>}
          </div>
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
            <input id="cnpj" type="text" {...register('cnpj')} className="input-class" />
            {errors.cnpj && <p className="error-class">{errors.cnpj.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
          <input id="address" type="text" {...register('address')} className="input-class" />
          {errors.address && <p className="error-class">{errors.address.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700">Pessoa de Contato</label>
            <input id="contactPerson" type="text" {...register('contactPerson')} className="input-class" />
            {errors.contactPerson && <p className="error-class">{errors.contactPerson.message}</p>}
          </div>
          <div>
            <label htmlFor="agencyPhone" className="block text-sm font-medium text-gray-700">Telefone da Agência</label>
            <input id="agencyPhone" type="tel" {...register('agencyPhone')} className="input-class" />
            {errors.agencyPhone && <p className="error-class">{errors.agencyPhone.message}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="agencyEmail" className="block text-sm font-medium text-gray-700">E-mail da Agência</label>
          <input id="agencyEmail" type="email" {...register('agencyEmail')} className="input-class" />
          {errors.agencyEmail && <p className="error-class">{errors.agencyEmail.message}</p>}
        </div>
      </div>

      {/* Seção de Dados do Usuário */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-2">Seus Dados de Acesso</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="userFullName" className="block text-sm font-medium text-gray-700">Seu Nome Completo *</label>
                <input id="userFullName" type="text" {...register('userFullName')} className="input-class" />
                {errors.userFullName && <p className="error-class">{errors.userFullName.message}</p>}
            </div>
            <div>
                <label htmlFor="userPhone" className="block text-sm font-medium text-gray-700">Seu Telefone</label>
                <input id="userPhone" type="tel" {...register('userPhone')} className="input-class" />
                {errors.userPhone && <p className="error-class">{errors.userPhone.message}</p>}
            </div>
        </div>

        <div>
          <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700">Seu E-mail (para login) *</label>
          <input id="userEmail" type="email" {...register('userEmail')} className="input-class" />
          {errors.userEmail && <p className="error-class">{errors.userEmail.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Senha *</label>
            <input id="password" type="password" {...register('password')} className="input-class" />
            {errors.password && <p className="error-class">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">Confirmar Senha *</label>
            <input id="confirmPassword" type="password" {...register('confirmPassword')} className="input-class" />
            {errors.confirmPassword && <p className="error-class">{errors.confirmPassword.message}</p>}
          </div>
        </div>
      </div>

      {serverError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erro: </strong>
          <span className="block sm:inline">{serverError}</span>
        </div>
      )}

      <div className="pt-4">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-gray-800 bg-lime-400 hover:bg-lime-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-lime-500 disabled:bg-lime-200 disabled:cursor-wait"
        >
          {loading ? <Loader className="animate-spin h-5 w-5 mr-3" /> : null}
          {loading ? 'Criando sua conta...' : 'Finalizar Cadastro'}
        </button>
      </div>

      <style jsx>{`
        .input-class {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          border-radius: 0.375rem;
          border-width: 1px;
          border-color: #D1D5DB;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          padding: 0.5rem 0.75rem;
        }
        .input-class:focus {
          border-color: #84CC16;
          --tw-ring-color: #84CC16;
        }
        .error-class {
          font-size: 0.75rem;
          color: #DC2626;
          margin-top: 0.25rem;
        }
      `}</style>
    </form>
  );
};
