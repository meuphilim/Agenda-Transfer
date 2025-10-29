// src/components/company_profile/form/ProfileOperationSection.tsx
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { CompanyProfile } from '@/services/companyProfileApi'
import FormField from './FormField'

interface SectionProps {
  register: UseFormRegister<CompanyProfile>
  errors: FieldErrors<CompanyProfile>
}

const ProfileOperationSection = ({ register, errors }: SectionProps) => {
  return (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
                id="fleet_size"
                label="Tamanho da Frota"
                type="number"
                register={register('fleet_size')}
                error={errors.fleet_size?.message}
                placeholder="Ex: 15"
            />
            <FormField
                id="total_capacity"
                label="Capacidade Total de Transporte"
                type="number"
                register={register('total_capacity')}
                error={errors.total_capacity?.message}
                placeholder="Ex: 120"
            />
        </div>
        <FormField
            id="vehicle_types"
            label="Tipos de Veículos Operados"
            register={register('vehicle_types')}
            error={errors.vehicle_types?.message}
            placeholder="Ex: Van, Micro-ônibus, Sedan"
        />
        <FormField
            id="licenses"
            label="Licenças / ANTT / Alvarás"
            register={register('licenses')}
            error={errors.licenses?.message}
            placeholder="ANTT nº XXXXXX"
        />
        <FormField
            id="cancellation_policy"
            label="Política de Cancelamento e Reembolso"
            as="textarea"
            register={register('cancellation_policy')}
            error={errors.cancellation_policy?.message}
            placeholder="Descreva brevemente a política ou cole o link para a página."
        />

        <div className="pt-4">
             <h3 className="text-md font-semibold text-foreground mb-2">Responsável Legal / Administrativo</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    id="responsible_name"
                    label="Nome do Responsável"
                    register={register('responsible_name')}
                    error={errors.responsible_name?.message}
                />
                 <FormField
                    id="responsible_cpf"
                    label="CPF do Responsável"
                    register={register('responsible_cpf')}
                    error={errors.responsible_cpf?.message}
                />
                 <FormField
                    id="responsible_role"
                    label="Cargo / Função"
                    register={register('responsible_role')}
                    error={errors.responsible_role?.message}
                />
                 <FormField
                    id="responsible_phone"
                    label="Telefone de Contato Direto"
                    register={register('responsible_phone')}
                    error={errors.responsible_phone?.message}
                />
            </div>
        </div>
    </div>
  )
}

export default ProfileOperationSection
