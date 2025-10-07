-- 1. CRIAÇÃO DE OBJETOS INICIAIS

-- Criar schema privado para funções de segurança internas
CREATE SCHEMA IF NOT EXISTS private;

-- Criar tipo enum para status do usuário se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
        CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive');
    END IF;
END$$;

-- Criar tabela de perfis de usuário se não existir
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT NOT NULL,
    phone TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    status user_status DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FUNÇÕES DE VERIFICAÇÃO DE PERMISSÃO (LENDO DO JWT)
-- Estas funções leem os "claims" do JWT do usuário autenticado.
-- Elas não consultam a tabela `profiles`, quebrando o ciclo de recursão.

-- Função genérica para pegar um "claim" do JWT.
CREATE OR REPLACE FUNCTION public.get_my_claim(claim TEXT)
RETURNS JSONB AS $$
  SELECT COALESCE(current_setting('request.jwt.claims', true)::JSONB -> 'raw_app_meta_data' -> claim, 'null'::JSONB);
$$ LANGUAGE SQL STABLE;

-- Função específica para verificar se o usuário é administrador.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT (get_my_claim('is_admin'))::BOOLEAN;
$$ LANGUAGE SQL STABLE;


-- 3. POLÍTICAS DE SEGURANÇA (ROW LEVEL SECURITY)
-- As políticas agora usam a função is_admin() que lê do JWT, evitando o erro.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuários podem ver e atualizar seus próprios perfis" ON public.profiles;
CREATE POLICY "Usuários podem ver e atualizar seus próprios perfis"
    ON public.profiles FOR ALL
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON public.profiles;
CREATE POLICY "Administradores podem gerenciar todos os perfis"
    ON public.profiles FOR ALL
    -- Apenas administradores podem acessar/modificar perfis que não são os seus.
    USING (public.is_admin())
    WITH CHECK (public.is_admin());


-- 4. SINCRONIZAÇÃO DE PERMISSÕES (Profiles -> Auth)
-- Trigger que atualiza os dados de autenticação (auth.users) sempre que
-- a tabela `profiles` é alterada. Isso mantém o JWT atualizado.

CREATE OR REPLACE FUNCTION private.sync_user_claims()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza o raw_app_meta_data no auth.users
  UPDATE auth.users
  SET raw_app_meta_data = raw_app_meta_data || jsonb_build_object('is_admin', NEW.is_admin)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Trigger que dispara a sincronização em cada insert ou update na tabela profiles
DROP TRIGGER IF EXISTS on_profile_change_sync_claims ON public.profiles;
CREATE TRIGGER on_profile_change_sync_claims
  AFTER INSERT OR UPDATE OF is_admin ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_user_claims();


-- 5. TRIGGERS E FUNÇÕES AUXILIARES

-- Função para criar um perfil automaticamente quando um novo usuário se cadastra
-- Ajustada para usar COALESCE e buscar o telefone do campo principal do usuário.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', ''), -- Garante que full_name não seja nulo
        COALESCE(new.phone, new.raw_user_meta_data->>'phone') -- Prioriza o telefone do campo auth.users.phone
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para atualizar o timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 6. ATUALIZAÇÃO INICIAL DO ADMINISTRADOR
-- Dispara o trigger de sincronização para o admin existente para que
-- o claim 'is_admin' seja inserido no JWT na próxima vez que ele logar.
UPDATE public.profiles 
SET is_admin = true, status = 'active' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'meuphilim@gmail.com' LIMIT 1);
