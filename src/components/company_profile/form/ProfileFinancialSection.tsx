// src/components/company_profile/form/ProfileFinancialSection.tsx
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { CompanyProfile } from '@/services/companyProfileApi'
import FormField from './FormField'

interface SectionProps {
  register: UseFormRegister<CompanyProfile>
  errors: FieldErrors<CompanyProfile>
}

const ProfileFinancialSection = ({ register, errors }: SectionProps) => {
  return (
    <div className="space-y-4">
        <h3 className="text-md font-semibold text-foreground mb-2">Faturamento e Emissão de Notas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField
                id="billing_cnpj"
                label="CNPJ Emissor da Nota Fiscal"
                register={register('billing_cnpj')}
                error={errors.billing_cnpj?.message}
                placeholder="Se for o mesmo, pode deixar em branco"
            />
            <FormField
                id="billing_email"
                label="Email para Envio de NF / Boletos"
                register={register('billing_email')}
                error={errors.billing_email?.message}
                type="email"
                placeholder="financeiro@suaempresa.com.br"
            />
        </div>
        <FormField
            id="bank_details"
            label="Dados Bancários (Opcional)"
            as="textarea"
            register={register('bank_details')}
            error={errors.bank_details?.message}
            placeholder="Banco, Agência, Conta Corrente, PIX..."
        />
         <div className="pt-4">
            <p className="text-sm text-muted-foreground">
                As informações financeiras são confidenciais e serão usadas apenas para operações de faturamento e pagamentos dentro do sistema.
            </p>
        </div>
    </div>
  )
}

export default ProfileFinancialSection
