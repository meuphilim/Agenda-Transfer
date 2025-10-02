/*
  # Correção do Perfil do Usuário Administrador

  1. Correções Específicas
    - Garantir que o usuário fd73d474-018d-4a27-b220-c948b91eed11 tenha perfil completo
    - Configurar como administrador ativo
    - Sincronizar dados entre auth.users e profiles
    - Confirmar email se necessário

  2. Dados do Usuário
    - ID: fd73d474-018d-4a27-b220-c948b91eed11
    - Email: meuphilim@gmail.com
    - Nome: Celso Lima Cavalheiro
    - Telefone: (67) 99262-4818
    - Status: Administrador Ativo

  3. Segurança
    - Confirmar email automaticamente
    - Ativar conta imediatamente
    - Configurar privilégios de admin
*/

-- 1. GARANTIR QUE O USUÁRIO EXISTE NO AUTH.USERS
-- Verificar se o usuário existe e está com email confirmado
DO $$
BEGIN
    -- Verificar se o usuário existe
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11') THEN
        -- Atualizar dados do usuário no auth.users
        UPDATE auth.users
        SET 
            email = 'meuphilim@gmail.com',
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            phone = '67992624818',
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object(
                'full_name', 'Celso Lima Cavalheiro',
                'phone', '(67) 99262-4818'
            ),
            raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
                'is_admin', true
            ),
            updated_at = NOW()
        WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11';
        
        RAISE NOTICE 'Usuário atualizado no auth.users';
    ELSE
        RAISE NOTICE 'Usuário não encontrado no auth.users - pode precisar ser criado manualmente no Supabase Auth';
    END IF;
END $$;

-- 2. CRIAR/ATUALIZAR PERFIL NA TABELA PROFILES
-- Garantir que a tabela profiles existe
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL DEFAULT '',
    phone TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir ou atualizar o perfil do usuário
INSERT INTO public.profiles (
    id,
    full_name,
    phone,
    is_admin,
    status,
    created_at,
    updated_at
) VALUES (
    'fd73d474-018d-4a27-b220-c948b91eed11',
    'Celso Lima Cavalheiro',
    '(67) 99262-4818',
    true,
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    is_admin = EXCLUDED.is_admin,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 3. VERIFICAR E CORRIGIR POLÍTICAS RLS
-- Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Função para verificar se é admin (lendo do JWT)
CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::JSONB -> 'raw_app_meta_data' -> claim, 'null'::JSONB);
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((get_my_claim('is_admin'))::BOOLEAN, FALSE);
$$ LANGUAGE SQL STABLE;

-- Criar políticas atualizadas
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.profiles FOR SELECT
    USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
    ON public.profiles FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins can insert profiles"
    ON public.profiles FOR INSERT
    WITH CHECK (public.is_admin());

-- 4. FUNÇÃO PARA SINCRONIZAR CLAIMS
CREATE OR REPLACE FUNCTION private.sync_user_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o raw_app_meta_data no auth.users
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('is_admin', NEW.is_admin)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger para sincronização
DROP TRIGGER IF EXISTS on_profile_change_sync_claims ON public.profiles;
CREATE TRIGGER on_profile_change_sync_claims
  AFTER INSERT OR UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_user_claims();

-- 5. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, is_admin, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        COALESCE((NEW.raw_app_meta_data->>'is_admin')::boolean, FALSE),
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. FUNÇÃO PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 7. FORÇAR SINCRONIZAÇÃO DO USUÁRIO ADMIN
-- Disparar o trigger de sincronização para garantir que os claims estejam corretos
UPDATE public.profiles 
SET is_admin = true 
WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11';

-- 8. VERIFICAÇÕES FINAIS
-- Verificar se o perfil foi criado corretamente
DO $$
DECLARE
    profile_exists BOOLEAN;
    user_exists BOOLEAN;
BEGIN
    -- Verificar se o usuário existe no auth.users
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11') INTO user_exists;
    
    -- Verificar se o perfil existe
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11') INTO profile_exists;
    
    IF user_exists THEN
        RAISE NOTICE 'Usuário existe no auth.users: %', user_exists;
    ELSE
        RAISE WARNING 'Usuário NÃO existe no auth.users - precisa ser criado manualmente';
    END IF;
    
    IF profile_exists THEN
        RAISE NOTICE 'Perfil existe na tabela profiles: %', profile_exists;
    ELSE
        RAISE WARNING 'Perfil NÃO foi criado na tabela profiles';
    END IF;
END $$;

-- 9. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(id); -- Para joins com auth.users

-- 10. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.profiles IS 'Perfis de usuário com informações adicionais e controle de acesso';
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone do usuário no formato (XX) XXXXX-XXXX';
COMMENT ON COLUMN public.profiles.is_admin IS 'Indica se o usuário tem privilégios de administrador';
COMMENT ON COLUMN public.profiles.status IS 'Status da conta: pending (pendente), active (ativa), inactive (inativa)';

-- Finalizar
SELECT 
    'Migration executada com sucesso!' as result,
    'Usuário: ' || email as user_email,
    'Status: ' || CASE WHEN email_confirmed_at IS NOT NULL THEN 'Email Confirmado' ELSE 'Email Pendente' END as email_status
FROM auth.users 
WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11'
UNION ALL
SELECT 
    'Perfil criado/atualizado!' as result,
    'Nome: ' || full_name as user_name,
    'Admin: ' || CASE WHEN is_admin THEN 'Sim' ELSE 'Não' END as admin_status
FROM public.profiles 
WHERE id = 'fd73d474-018d-4a27-b220-c948b91eed11';