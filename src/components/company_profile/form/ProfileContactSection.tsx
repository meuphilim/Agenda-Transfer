// src/components/company_profile/form/ProfileContactSection.tsx
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { CompanyProfile } from '@/services/companyProfileApi'
import FormField from './FormField'

interface SectionProps {
  register: UseFormRegister<CompanyProfile>
  errors: FieldErrors<CompanyProfile>
}

const ProfileContactSection = ({ register, errors }: SectionProps) => {
  return (
    <div className="space-y-4">
        <FormField
          id="address"
          label="Endereço Completo"
          register={register('address')}
          error={errors.address?.message}
          placeholder="Rua, Número, Bairro"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
            id="city"
            label="Cidade"
            register={register('city')}
            error={errors.city?.message}
            />
            <FormField
            id="state"
            label="Estado (UF)"
            register={register('state')}
            error={errors.state?.message}
            placeholder="MS"
            />
            <FormField
            id="zip_code"
            label="CEP"
            register={register('zip_code')}
            error={errors.zip_code?.message}
            />
        </div>

        <FormField
          id="google_maps_link"
          label="Link do Google Maps"
          register={register('google_maps_link')}
          error={errors.google_maps_link?.message}
          placeholder="https://maps.app.goo.gl/..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
             <FormField
                id="phone"
                label="Telefone Comercial"
                register={register('phone')}
                error={errors.phone?.message}
            />
             <FormField
                id="whatsapp"
                label="WhatsApp"
                register={register('whatsapp')}
                error={errors.whatsapp?.message}
            />
             <FormField
                id="email"
                label="E-mail Principal"
                register={register('email')}
                error={errors.email?.message}
                type="email"
            />
             <FormField
                id="website"
                label="Site"
                register={register('website')}
                error={errors.website?.message}
                placeholder="https://suaempresa.com.br"
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                id="instagram"
                label="Instagram"
                register={register('instagram')}
                error={errors.instagram?.message}
                placeholder="@seuinstagram"
            />
             <FormField
                id="facebook"
                label="Facebook"
                register={register('facebook')}
                error={errors.facebook?.message}
                placeholder="facebook.com/suaempresa"
            />
        </div>
    </div>
  )
}

export default ProfileContactSection;
