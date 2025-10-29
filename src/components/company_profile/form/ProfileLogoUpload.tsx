// src/components/company_profile/form/ProfileLogoUpload.tsx
import { useState, useEffect } from 'react';
import { useController, Control } from 'react-hook-form';
import { CompanyProfile } from '@/services/companyProfileApi';
import { Building } from 'lucide-react';
import { Input } from '@/components/ui/input';
import FormField from './FormField'; // Importando o FormField

interface LogoUploadProps {
  control: Control<CompanyProfile>;
  currentLogo: string | null | undefined;
}

const ProfileLogoUpload = ({ control, currentLogo }: LogoUploadProps) => {
  const { field } = useController({
    name: 'logo_url',
    control,
    defaultValue: currentLogo || '',
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo || null);

  useEffect(() => {
    setPreviewUrl(field.value || null);
  }, [field.value]);

  // Futuramente, aqui entrará a lógica para upload de arquivo.
  // Por ora, manteremos o campo de URL para não quebrar o fluxo.

  return (
    <div className="space-y-4">
       <FormField
            id="logo_url"
            label="URL do Logo"
            register={field}
            placeholder="https://.../logo.png"
        />
      <div className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border/50 bg-muted/30 h-full">
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
  );
};

export default ProfileLogoUpload;
