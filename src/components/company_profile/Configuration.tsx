import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CompanyProfile, updateCompanyProfile } from '@/services/companyProfileApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface ConfigurationProps {
  currentProfile: CompanyProfile | null;
  onProfileUpdate: (profile: CompanyProfile) => void;
}

const profileSchema = yup.object().shape({
  name: yup.string().required('O nome é obrigatório.'),
  cnpj: yup.string().optional().nullable(),
  address: yup.string().optional().nullable(),
  phone: yup.string().optional().nullable(),
  email: yup.string().email('Email inválido.').optional().nullable(),
  logo_url: yup.string().url('URL do logo inválida.').optional().nullable(),
});

const Configuration = ({ currentProfile, onProfileUpdate }: ConfigurationProps) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyProfile>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      ...currentProfile,
      name: currentProfile?.name || '',
      cnpj: currentProfile?.cnpj || '',
      address: currentProfile?.address || '',
      phone: currentProfile?.phone || '',
      email: currentProfile?.email || '',
      logo_url: currentProfile?.logo_url || '',
    },
  });

  const onSubmit = async (data: CompanyProfile) => {
    try {
      const updatedProfile = await updateCompanyProfile({ ...currentProfile, ...data });
      if (updatedProfile) {
        onProfileUpdate(updatedProfile);
        toast.success('Perfil da empresa atualizado com sucesso!');
      }
    } catch (error) {
      toast.error('Falha ao atualizar o perfil da empresa.');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuração do Perfil</CardTitle>
        <CardDescription>Atualize as informações cadastrais da sua empresa.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700">CNPJ</label>
            <Input id="cnpj" {...register('cnpj')} />
          </div>
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Endereço</label>
            <Input id="address" {...register('address')} />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Telefone</label>
            <Input id="phone" {...register('phone')} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">URL do Logo</label>
            <Input id="logo_url" {...register('logo_url')} />
             {errors.logo_url && <p className="text-red-500 text-xs mt-1">{errors.logo_url.message}</p>}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default Configuration;
