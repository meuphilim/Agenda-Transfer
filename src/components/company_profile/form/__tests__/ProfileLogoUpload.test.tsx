// src/components/company_profile/form/__tests__/ProfileLogoUpload.test.tsx
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { useForm, FormProvider } from 'react-hook-form'
import { toast } from 'sonner' // Corrigido: Importar toast
import ProfileLogoUpload from '../ProfileLogoUpload'
import { vi } from 'vitest'
import { CompanyProfile } from '@/services/companyProfileApi'

// --- Mocks ---

vi.mock('sonner', () => ({
  toast: {
    loading: vi.fn(() => 'toast-id'),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

vi.mock('browser-image-compression', () => ({
  default: vi.fn((file) => Promise.resolve(file)),
}))

const mockUpload = vi.fn()
const mockRemove = vi.fn()
const mockGetPublicUrl = vi.fn()

vi.mock('@/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: mockUpload,
        remove: mockRemove,
        getPublicUrl: mockGetPublicUrl,
      })),
    },
  },
}))

import { supabase } from '@/lib/supabase'

// --- Componente Wrapper para Testes ---

const TestComponent = ({ companyId, defaultLogoUrl = null }: { companyId: string, defaultLogoUrl?: string | null }) => {
  const methods = useForm<CompanyProfile>({
    defaultValues: { logo_url: defaultLogoUrl },
  })

  return (
    <FormProvider {...methods}>
      <form>
        <ProfileLogoUpload control={methods.control} companyId={companyId} />
      </form>
    </FormProvider>
  )
}

// --- Testes ---

describe('ProfileLogoUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpload.mockResolvedValue({ error: null })
    mockRemove.mockResolvedValue({ error: null })
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: 'https://example.com/logo.png' },
    })
  })

  it('deve renderizar o estado inicial corretamente', () => {
    render(<TestComponent companyId="123" />)
    expect(screen.getByText(/Arraste uma logo ou clique para selecionar/i)).toBeInTheDocument()
  })

  it('deve exibir a pré-visualização se uma URL de logo existir', () => {
    render(<TestComponent companyId="123" defaultLogoUrl="https://example.com/existing-logo.png" />)
    expect(screen.getByAltText('Pré-visualização do logo')).toBeInTheDocument()
  })

  it('deve exibir erro se o arquivo for muito grande', async () => {
    render(<TestComponent companyId="123" />)
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' })
    Object.defineProperty(file, 'size', { value: 3 * 1024 * 1024 })

    const input = screen.getByLabelText('Área para upload de logo').querySelector('input')!
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Arquivo muito grande. O limite é de 2MB.')
    })
  })

  it('deve exibir erro se o tipo do arquivo for inválido', async () => {
    render(<TestComponent companyId="123" />)
    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' })

    const input = screen.getByLabelText('Área para upload de logo').querySelector('input')!
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Formato de arquivo inválido.')
    })
  })

  it('deve fazer o upload de um arquivo válido e mostrar a pré-visualização', async () => {
    render(<TestComponent companyId="123" />)
    const file = new File(['dummy'], 'logo.png', { type: 'image/png' })

    const input = screen.getByLabelText('Área para upload de logo').querySelector('input')!
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => expect(screen.getByText('Processando...')).toBeInTheDocument())

    await waitFor(() => {
      expect(supabase.storage.from).toHaveBeenCalledWith('company-logos')
      expect(mockUpload).toHaveBeenCalled()
      expect(screen.getByAltText('Pré-visualização do logo')).toHaveAttribute('src', 'https://example.com/logo.png')
    })
  })

  it('deve remover um logo existente', async () => {
    const urlToRemove = 'https://xyz.supabase.co/storage/v1/object/public/company-logos/logo-to-remove.png';
    render(<TestComponent companyId="123" defaultLogoUrl={urlToRemove} />);

    const removeButton = screen.getByLabelText('Remover logo');
    fireEvent.click(removeButton);

    await waitFor(() => expect(screen.getByText('Processando...')).toBeInTheDocument());

    await waitFor(() => {
      expect(supabase.storage.from).toHaveBeenCalledWith('company-logos');
      expect(mockRemove).toHaveBeenCalledWith(['logo-to-remove.png']);
      expect(screen.getByText(/Arraste uma logo ou clique para selecionar/i)).toBeInTheDocument();
    });
  });
})
