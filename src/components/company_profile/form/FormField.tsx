// src/components/company_profile/form/FormField.tsx
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export interface FormFieldProps {
  id: string
  label: string
  type?: string
  register: any // Mantido simples por enquanto
  error?: string
  required?: boolean
  as?: 'textarea'
  placeholder?: string
}

const FormField = ({
  id,
  label,
  type = 'text',
  register,
  error,
  required,
  as,
  placeholder,
}: FormFieldProps) => {
  const InputComponent = as === 'textarea' ? Textarea : Input;

  return (
    <div className="flex flex-col">
      <label
        htmlFor={id}
        className="text-sm font-medium text-muted-foreground mb-1 flex items-center"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <InputComponent
        id={id}
        type={type}
        {...register}
        placeholder={placeholder}
        className="focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200"
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export default FormField;
