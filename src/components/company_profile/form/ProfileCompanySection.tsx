// src/components/company_profile/form/ProfileCompanySection.tsx
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { CompanyProfile } from '@/services/companyProfileApi'
import FormField from './FormField'
import ProfileLogoUpload from './ProfileLogoUpload'

interface SectionProps {
  register: UseFormRegister<CompanyProfile>
  errors: FieldErrors<CompanyProfile>
  currentProfile: CompanyProfile | null
  control: any // Para o upload de logo
}

const ProfileCompanySection = ({ register, errors, currentProfile, control }: SectionProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <FormField
            id="name"
            label="Nome Fantasia"
            register={register('name')}
            error={errors.name?.message}
            placeholder="Ex: Bonito Ecoexpedições"
            required
          />
          <FormField
            id="legal_name"
            label="Razão Social"
            register={register('legal_name')}
            error={errors.legal_name?.message}
            placeholder="Ex: Agência de Turismo Exemplo LTDA"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              id="cnpj"
              label="CNPJ"
              register={register('cnpj')}
              error={errors.cnpj?.message}
              placeholder="00.000.000/0001-00"
            />
            <FormField
              id="state_registration"
              label="Inscrição Estadual"
              register={register('state_registration')}
              error={errors.state_registration?.message}
            />
          </div>
        </div>
        <div className="md:col-span-1">
          <ProfileLogoUpload control={control} companyId={currentProfile?.id} />
        </div>
      </div>
      <FormField
        id="company_description"
        label="Descrição Curta da Empresa"
        as="textarea"
        register={register('company_description')}
        error={errors.company_description?.message}
        placeholder="Uma breve descrição sobre os serviços e foco da sua empresa."
      />
    </div>
  )
}

export default ProfileCompanySection
