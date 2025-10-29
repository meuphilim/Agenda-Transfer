// src/components/company_profile/form/ProfileLogoUpload.tsx
import { useCallback, useState, useEffect } from 'react'
import { useController, Control } from 'react-hook-form'
import { useDropzone, FileRejection, Accept } from 'react-dropzone'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { UploadCloud, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CompanyProfile } from '@/services/companyProfileApi'

// --- Tipos e Constantes ---

interface LogoUploaderProps {
  control: Control<CompanyProfile>
  companyId: string | undefined
}

const MAX_SIZE_MB = 2
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024
const COMPRESSION_THRESHOLD_BYTES = 500 * 1024 // 500KB
const ACCEPTED_FORMATS: Accept = {
  'image/png': ['.png'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
}
const BUCKET_NAME = 'company-logos'

// --- Componente Principal ---

const ProfileLogoUpload = ({ control, companyId }: LogoUploaderProps) => {
  const [loading, setLoading] = useState(false)

  const {
    field: { onChange, value },
  } = useController({
    name: 'logo_url',
    control,
    defaultValue: null,
  })

  const [preview, setPreview] = useState<string | null>(value || null)

  // Sincroniza o preview com o valor do formulário
  useEffect(() => {
    setPreview(value || null)
  }, [value])

  const getFilePathFromUrl = (url: string): string | null => {
    try {
      const urlObject = new URL(url)
      const pathSegments = urlObject.pathname.split('/')
      // O caminho é o nome do bucket + nome do arquivo
      const filePath = pathSegments.slice(pathSegments.indexOf(BUCKET_NAME) + 1).join('/')
      return filePath
    } catch (error) {
      console.error('URL inválida, não foi possível extrair o caminho do arquivo:', error)
      return null
    }
  }

  const handleUpload = useCallback(
    async (file: File) => {
      if (!companyId) {
        toast.error('ID da empresa não encontrado. Salve o perfil antes de enviar o logo.')
        return
      }
      setLoading(true)
      const toastId = toast.loading('Enviando logo...')

      try {
        const imageFile =
          file.size > COMPRESSION_THRESHOLD_BYTES
            ? await imageCompression(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
              })
            : file

        if (value) {
          const oldFilePath = getFilePathFromUrl(value)
          if (oldFilePath) {
            await supabase.storage.from(BUCKET_NAME).remove([oldFilePath])
          }
        }

        const fileExt = imageFile.name.split('.').pop()
        const filePath = `${companyId}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, imageFile)

        if (uploadError) throw uploadError

        const { data: publicUrlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath)

        if (!publicUrlData) {
            throw new Error('Não foi possível obter a URL pública do logo.')
        }

        onChange(publicUrlData.publicUrl)
        toast.success('Logo atualizado com sucesso!', { id: toastId })
      } catch (error: any) {
        console.error('Erro no upload:', error)
        toast.error(`Falha no upload: ${error.message}`, { id: toastId })
      } finally {
        setLoading(false)
      }
    },
    [companyId, onChange, value]
  )

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      if (fileRejections.length > 0) {
        fileRejections.forEach(({ errors }) => {
          errors.forEach((err) => {
            if (err.code === 'file-too-large') {
              toast.error(`Arquivo muito grande. O limite é de ${MAX_SIZE_MB}MB.`)
            } else if (err.code === 'file-invalid-type') {
              toast.error('Formato de arquivo inválido.')
            } else {
              toast.error(err.message)
            }
          })
        })
        return
      }

      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0])
      }
    },
    [handleUpload]
  )

  const handleRemoveLogo = async () => {
      if (!value) return
      setLoading(true)
      const toastId = toast.loading('Removendo logo...')
      try {
          const filePath = getFilePathFromUrl(value)
          if (!filePath) throw new Error('URL do logo inválida.')

          const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath])
          if (error) throw error

          onChange(null)
          toast.success('Logo removido com sucesso!', { id: toastId })
      } catch (error: any) {
          console.error('Erro ao remover logo:', error)
          toast.error(`Falha ao remover: ${error.message}`, { id: toastId })
      } finally {
          setLoading(false)
      }
  }


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FORMATS,
    maxSize: MAX_SIZE_BYTES,
    multiple: false,
    disabled: loading,
  })

  // --- Renderização ---

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 w-full border-2 border-dashed rounded-lg text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">Processando...</p>
      </div>
    )
  }

  if (preview) {
    return (
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
            <img
                src={preview}
                alt="Pré-visualização do logo"
                className="h-24 w-24 rounded-full object-cover border-2 border-border"
            />
             <button
                type="button"
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remover logo"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
        <div {...getRootProps()} className="cursor-pointer">
          <input {...getInputProps()} />
          <p className="text-sm text-primary hover:underline">Alterar logo</p>
        </div>
      </div>
    )
  }

  return (
    <div
      {...getRootProps()}
      className={cn(
        'flex flex-col items-center justify-center h-48 w-full border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors',
        isDragActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
      )}
      aria-label="Área para upload de logo"
    >
      <input {...getInputProps()} />
      <UploadCloud className="h-10 w-10 text-muted-foreground" />
      <p className="mt-2 font-semibold text-foreground">
        Arraste uma logo ou clique para selecionar
      </p>
      <p className="text-xs text-muted-foreground">
        PNG, JPG, WEBP, SVG (máx. {MAX_SIZE_MB}MB)
      </p>
    </div>
  )
}

export default ProfileLogoUpload
