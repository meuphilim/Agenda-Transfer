import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { CompanyProfile, updateCompanyProfile } from '@/services/companyProfileApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Building } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'; // Importação da instância correta

interface ConfigurationProps {
  currentProfile: CompanyProfile | null
  onProfileUpdate: (profile: CompanyProfile) => void
}

const profileSchema = yup.object().shape({
  name: yup.string().required('O nome é obrigatório.'),
  cnpj: yup.string().optional().nullable(),
  address: yup.string().optional().nullable(),
  phone: yup.string().optional().nullable(),
  email: yup.string().email('Email inválido.').optional().nullable(),
  logo_url: yup.string().url('URL do logo inválida.').optional().nullable(),
})

const Configuration = ({ currentProfile, onProfileUpdate }: ConfigurationProps) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CompanyProfile>({
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
  })

  const logoUrl = watch('logo_url')
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentProfile?.logo_url || null)

  useEffect(() => {
    setPreviewUrl(logoUrl || null)
  }, [logoUrl])

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
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500"
        >
          {/* Coluna Esquerda */}
          <div className="space-y-4">
            <FormField
              id="name"
              label="Nome da Empresa"
              register={register('name')}
              error={errors.name?.message}
              required
            />
            <FormField id="cnpj" label="CNPJ" register={register('cnpj')} />
            <FormField id="address" label="Endereço" register={register('address')} />
            <FormField id="phone" label="Telefone" register={register('phone')} />
          </div>

          {/* Coluna Direita */}
          <div className="space-y-4">
            <FormField
              id="email"
              label="Email"
              type="email"
              register={register('email')}
              error={errors.email?.message}
            />
            <FormField
              id="logo_url"
              label="URL do Logo"
              register={register('logo_url')}
              error={errors.logo_url?.message}
            />

            {/* Prévia do Logo */}
            <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border/50 bg-muted/30">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Logo Preview"
                  className="h-20 w-20 object-cover rounded-full shadow-sm hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-muted text-muted-foreground">
                  <Building className="h-8 w-8" />
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">Prévia do logo</p>
            </div>
          </div>

          {/* Botão */}
          <div className="md:col-span-2 flex justify-end pt-2">
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

/* ------------------- COMPONENTE AUXILIAR ------------------- */

interface FormFieldProps {
  id: string
  label: string
  type?: string
  register: any; // Simplified for brevity
  error?: string
  required?: boolean
}

const FormField = ({ id, label, type = 'text', register, error, required }: FormFieldProps) => (
  <div className="flex flex-col">
    <label
      htmlFor={id}
      className="text-sm font-medium text-muted-foreground mb-1 flex items-center"
    >
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <Input
      id={id}
      type={type}
      {...register}
      className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200"
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
)

export default Configuration
