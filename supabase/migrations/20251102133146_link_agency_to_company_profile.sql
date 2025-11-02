-- Migration: Vincular Agências a Perfis de Empresa Dedicados

-- Etapa 1: Adicionar a coluna 'company_id' à tabela 'agencies'.
-- Esta coluna cria a associação direta entre uma agência e seu perfil de empresa.
ALTER TABLE public.agencies
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.company_profile(id) ON DELETE CASCADE;

-- Etapa 2: Criar a função RPC para o cadastro atômico.
-- Esta função cria um company_profile, uma agência e vincula o usuário em uma única transação.
CREATE OR REPLACE FUNCTION public.create_agency_with_company_profile(
    p_agency_name TEXT,
    p_agency_cnpj TEXT,
    p_agency_address TEXT,
    p_agency_phone TEXT,
    p_agency_email TEXT,
    p_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_company_id UUID;
    v_agency_id UUID;
BEGIN
    -- 1. Criar o perfil da empresa (company_profile)
    INSERT INTO public.company_profile (name, cnpj, address, phone, email)
    VALUES (p_agency_name, p_agency_cnpj, p_agency_address, p_agency_phone, p_agency_email)
    RETURNING id INTO v_company_id;

    -- 2. Criar a agência e vinculá-la ao company_profile recém-criado
    INSERT INTO public.agencies (name, cnpj, address, phone, email, company_id)
    VALUES (p_agency_name, p_agency_cnpj, p_agency_address, p_agency_phone, p_agency_email, v_company_id)
    RETURNING id INTO v_agency_id;

    -- 3. Vincular o usuário à agência recém-criada
    UPDATE public.profiles
    SET agency_id = v_agency_id
    WHERE id = p_user_id;

    -- Retornar o ID da agência criada
    RETURN v_agency_id;
END;
$$;
