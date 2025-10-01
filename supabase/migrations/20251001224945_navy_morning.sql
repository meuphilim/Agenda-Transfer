/*
  # Validação e Atualização das Tabelas para Sistema de Autenticação

  1. Verificações e Correções
    - Garantir que a tabela profiles existe com todas as colunas necessárias
    - Verificar se as funções de autenticação estão funcionando
    - Atualizar políticas RLS se necessário
    - Garantir que os triggers estão funcionando

  2. Correções de Schema
    - Adicionar colunas faltantes se necessário
    - Corrigir tipos de dados
    - Atualizar constraints

  3. Segurança
    - Verificar e corrigir políticas RLS
    - Garantir que as funções de segurança estão funcionando
*/

-- 1. VERIFICAR E CORRIGIR TABELA PROFILES
-- Garantir que a tabela profiles existe com a estrutura correta
DO $$
BEGIN
    -- Verificar se a tabela profiles existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Criar tabela profiles se não existir
        CREATE TABLE public.profiles (
            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            full_name TEXT NOT NULL DEFAULT '',
            phone TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela profiles criada';
    ELSE
        RAISE NOTICE 'Tabela profiles já existe';
    END IF;
END $$;

-- Verificar e adicionar colunas faltantes na tabela profiles
DO $$
BEGIN
    -- Verificar se a coluna full_name existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT NOT NULL DEFAULT '';
        RAISE NOTICE 'Coluna full_name adicionada à tabela profiles';
    END IF;
    
    -- Verificar se a coluna phone existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Coluna phone adicionada à tabela profiles';
    END IF;
    
    -- Verificar se a coluna is_admin existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna is_admin adicionada à tabela profiles';
    END IF;
    
    -- Verificar se a coluna status existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive'));
        RAISE NOTICE 'Coluna status adicionada à tabela profiles';
    END IF;
    
    -- Verificar se a coluna created_at existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada à tabela profiles';
    END IF;
    
    -- Verificar se a coluna updated_at existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada à tabela profiles';
    END IF;
END $$;

-- 2. VERIFICAR E CRIAR SCHEMA PRIVADO
CREATE SCHEMA IF NOT EXISTS private;

-- 3. VERIFICAR E CRIAR FUNÇÕES DE SEGURANÇA
-- Função para pegar claims do JWT
CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::JSONB -> 'raw_app_meta_data' -> claim, 'null'::JSONB);
$$ LANGUAGE SQL STABLE;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE((get_my_claim('is_admin'))::BOOLEAN, FALSE);
$$ LANGUAGE SQL STABLE;

-- 4. CONFIGURAR ROW LEVEL SECURITY
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se existirem
DROP POLICY IF EXISTS "Usuários podem ver e atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

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

-- 5. FUNÇÃO PARA SINCRONIZAR CLAIMS
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

-- Remover trigger existente se existir
DROP TRIGGER IF EXISTS on_profile_change_sync_claims ON public.profiles;

-- Criar trigger para sincronização
CREATE TRIGGER on_profile_change_sync_claims
  AFTER INSERT OR UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_user_claims();

-- 6. FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, is_admin, status)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
        FALSE,
        'pending'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger existente se existir
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger para novos usuários
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. FUNÇÃO PARA ATUALIZAR TIMESTAMP
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Remover trigger existente se existir
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;

-- Criar trigger para updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 8. VERIFICAR E CORRIGIR DADOS EXISTENTES
-- Garantir que usuários existentes tenham perfis
INSERT INTO public.profiles (id, full_name, phone, is_admin, status)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', ''),
    COALESCE(au.phone, au.raw_user_meta_data->>'phone'),
    FALSE,
    'pending'
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 9. ATUALIZAR USUÁRIO ADMIN SE EXISTIR
UPDATE public.profiles 
SET 
    is_admin = true, 
    status = 'active',
    full_name = COALESCE(NULLIF(full_name, ''), 'Administrador'),
    updated_at = NOW()
WHERE id IN (
    SELECT id FROM auth.users 
    WHERE email = 'meuphilim@gmail.com'
    LIMIT 1
);

-- 10. VERIFICAR INTEGRIDADE DAS OUTRAS TABELAS
-- Garantir que as tabelas principais existem e têm as colunas corretas

-- Verificar tabela agencies
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'agencies') THEN
        RAISE EXCEPTION 'Tabela agencies não existe. Execute primeiro a migration principal do schema.';
    END IF;
END $$;

-- Verificar tabela vehicles
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vehicles') THEN
        RAISE EXCEPTION 'Tabela vehicles não existe. Execute primeiro a migration principal do schema.';
    END IF;
    
    -- Verificar se a coluna license_plate existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'vehicles' AND column_name = 'license_plate') THEN
        RAISE EXCEPTION 'Coluna license_plate não existe na tabela vehicles. Execute primeiro a migration principal do schema.';
    END IF;
END $$;

-- Verificar tabela drivers
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'drivers') THEN
        RAISE EXCEPTION 'Tabela drivers não existe. Execute primeiro a migration principal do schema.';
    END IF;
END $$;

-- Verificar tabela packages
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'packages') THEN
        RAISE EXCEPTION 'Tabela packages não existe. Execute primeiro a migration principal do schema.';
    END IF;
    
    -- Verificar se a coluna client_name existe
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'client_name') THEN
        ALTER TABLE packages ADD COLUMN client_name TEXT;
        RAISE NOTICE 'Coluna client_name adicionada à tabela packages';
    END IF;
END $$;

-- 11. CRIAR ÍNDICES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);

-- 12. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON TABLE public.profiles IS 'Perfis de usuário com informações adicionais e controle de acesso';
COMMENT ON COLUMN public.profiles.full_name IS 'Nome completo do usuário';
COMMENT ON COLUMN public.profiles.phone IS 'Telefone do usuário no formato (XX) XXXXX-XXXX';
COMMENT ON COLUMN public.profiles.is_admin IS 'Indica se o usuário tem privilégios de administrador';
COMMENT ON COLUMN public.profiles.status IS 'Status da conta: pending (pendente), active (ativa), inactive (inativa)';

-- Finalizar
SELECT 'Migration de validação e atualização das tabelas de autenticação executada com sucesso!' as result;