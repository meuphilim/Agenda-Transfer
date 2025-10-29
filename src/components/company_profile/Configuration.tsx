import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { CompanyProfile, updateCompanyProfile } from '@/services/companyProfileApi'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Building } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// Importar os novos sub-componentes
import ProfileCompanySection from './form/ProfileCompanySection'
import ProfileContactSection from './form/ProfileContactSection'
import ProfileOperationSection from './form/ProfileOperationSection'
import ProfileFinancialSection from './form/ProfileFinancialSection'

interface ConfigurationProps {
  currentProfile: CompanyProfile | null
  onProfileUpdate: (profile: CompanyProfile) => void
}

// Schema de validação expandido para incluir todos os novos campos
const profileSchema = yup.object().shape({
  name: yup.string().required('O nome fantasia é obrigatório.'),
  legal_name: yup.string().nullable(),
  cnpj: yup
    .string()
    .matches(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})?$/, 'CNPJ inválido')
    .nullable(),
  state_registration: yup.string().nullable(),
  company_description: yup.string().nullable(),
  logo_url: yup.string().url('URL inválida').nullable(),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  state: yup.string().max(2, 'UF inválida').nullable(),
  zip_code: yup.string().nullable(),
  google_maps_link: yup.string().url('URL do Google Maps inválida').nullable(),
  phone: yup.string().nullable(),
  whatsapp: yup.string().nullable(),
  email: yup.string().email('Email inválido').nullable(),
  website: yup.string().url('URL do site inválida').nullable(),
  instagram: yup.string().nullable(),
  facebook: yup.string().nullable(),
  fleet_size: yup.number().positive('Deve ser um número positivo').integer().nullable(),
  total_capacity: yup.number().positive('Deve ser um número positivo').integer().nullable(),
  vehicle_types: yup.string().nullable(),
  licenses: yup.string().nullable(),
  cancellation_policy: yup.string().nullable(),
  responsible_name: yup.string().nullable(),
  responsible_cpf: yup
    .string()
    .matches(/^(\d{3}\.\d{3}\.\d{3}-\d{2})?$/, 'CPF inválido')
    .nullable(),
  responsible_role: yup.string().nullable(),
  responsible_phone: yup.string().nullable(),
  billing_cnpj: yup
    .string()
    .matches(/^(\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2})?$/, 'CNPJ inválido')
    .nullable(),
  billing_email: yup.string().email('Email de faturamento inválido').nullable(),
  bank_details: yup.string().nullable(),
})

const Configuration = ({ currentProfile, onProfileUpdate }: ConfigurationProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control, // para componentes controlados
  } = useForm<CompanyProfile>({
    resolver: yupResolver(profileSchema),
    defaultValues: currentProfile || {},
  })

  const onSubmit = async (data: Partial<CompanyProfile>) => {
    try {
      const updatedProfile = await updateCompanyProfile(supabase, { ...currentProfile, ...data })
      if (updatedProfile) {
        onProfileUpdate(updatedProfile)
        toast.success('Perfil da empresa atualizado com sucesso!')
      }
    } catch (error) {
      toast.error('Falha ao atualizar o perfil da empresa.')
      console.error(error)
    }
  }

  // Props a serem passados para os sub-componentes
  const formProps = { register, errors, control, currentProfile }

  return (
    <Card className="hover:shadow-md transition-all duration-300 border border-border/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Building className="h-5 w-5 text-muted-foreground" />
          Configuração do Perfil
        </CardTitle>
        <CardDescription>
          Atualize as informações cadastrais da sua empresa abaixo.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="company" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="company">Empresa</TabsTrigger>
              <TabsTrigger value="contact">Contato</TabsTrigger>
              <TabsTrigger value="operation">Operação</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
            </TabsList>

            <TabsContent value="company" className="mt-4">
              <ProfileCompanySection {...formProps} />
            </TabsContent>
            <TabsContent value="contact" className="mt-4">
              <ProfileContactSection {...formProps} />
            </TabsContent>
            <TabsContent value="operation" className="mt-4">
              <ProfileOperationSection {...formProps} />
            </TabsContent>
            <TabsContent value="financial" className="mt-4">
              <ProfileFinancialSection {...formProps} />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default Configuration
