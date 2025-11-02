-- supabase/migrations/20251030205400_setup_agency_onboarding.sql

-- Etapa 1: Adicionar a coluna 'agency_id' à tabela de perfis.
-- Esta coluna vinculará um usuário a uma agência e é a única fonte de verdade para essa relação.
ALTER TABLE public.profiles
ADD COLUMN agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL;

-- Etapa 2: Criar a função RPC para o cadastro atômico de agência e usuário.
-- Esta função garante que a agência seja criada e o perfil do usuário seja
-- imediatamente vinculado a ela em uma única transação.
CREATE OR REPLACE FUNCTION public.create_agency_and_link_user(
    p_name text,
    p_contact_person text,
    p_phone text,
    p_email text,
    p_cnpj text,
    p_address text,
    p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_agency_id uuid;
BEGIN
    -- Inserir a nova agência na tabela 'agencies'
    INSERT INTO public.agencies (name, contact_person, phone, email, cnpj, address)
    VALUES (p_name, p_contact_person, p_phone, p_email, p_cnpj, p_address)
    RETURNING id INTO v_agency_id;

    -- Atualizar o perfil do usuário para vincular o agency_id.
    -- O perfil é criado por uma trigger ('on_auth_user_created'), então ele já existe.
    -- A função SECURITY DEFINER garante que esta operação tenha permissão para ser executada.
    UPDATE public.profiles
    SET agency_id = v_agency_id
    WHERE id = p_user_id;

    -- Retornar o ID da agência criada para confirmação
    RETURN v_agency_id;
END;
$$;
