-- supabase/migrations/20251030165500_create_rpc_create_agency_and_link_user.sql

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
    -- Etapa 1: Inserir a nova agência na tabela 'agencies'
    INSERT INTO public.agencies (name, contact_person, phone, email, cnpj, address)
    VALUES (p_name, p_contact_person, p_phone, p_email, p_cnpj, p_address)
    RETURNING id INTO v_agency_id;

    -- Etapa 2: Atualizar o perfil do usuário para vincular o agency_id
    -- A trigger 'on_auth_user_created' já cria um perfil básico.
    -- Aqui, nós o atualizamos com o ID da agência recém-criada.
    UPDATE public.profiles
    SET agency_id = v_agency_id
    WHERE id = p_user_id;

    -- Retorna o ID da agência criada para confirmação
    RETURN v_agency_id;
END;
$$;
