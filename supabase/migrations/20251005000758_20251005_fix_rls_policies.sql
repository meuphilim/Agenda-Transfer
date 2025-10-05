/*
  # Correção de Políticas RLS - Remover Recursão Infinita

  1. Problema Identificado
    - A função is_admin() causa recursão infinita ao tentar ler da tabela profiles
    - As políticas "FOR ALL" causam conflitos ao tentar INSERT

  2. Solução
    - Remover todas as políticas existentes
    - Criar políticas separadas para cada operação (SELECT, INSERT, UPDATE, DELETE)
    - Permitir que usuários autenticados criem seus próprios perfis
    - Permitir que usuários atualizem apenas seus próprios perfis
    - Usar apenas auth.uid() nas políticas, sem consultar a tabela profiles

  3. Segurança
    - Usuários só podem ler e modificar seus próprios perfis
    - Sistema de administração será controlado pela aplicação, não pelo RLS
*/

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
DROP POLICY IF EXISTS "Administradores podem gerenciar todos os perfis" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem ver e atualizar seus próprios perfis" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- 2. GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS SIMPLES SEM RECURSÃO

-- Política para SELECT: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Política para INSERT: usuários podem criar apenas seu próprio perfil
CREATE POLICY "Users can create their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Política para UPDATE: usuários podem atualizar apenas seu próprio perfil
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Política para DELETE: usuários podem deletar apenas seu próprio perfil
CREATE POLICY "Users can delete their own profile"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- 4. CRIAR POLÍTICA ESPECIAL PARA SERVICE ROLE (Admin via Backend)
-- Esta política permite que o service role (usado pela aplicação) acesse todos os perfis

CREATE POLICY "Service role can manage all profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5. VERIFICAR E CORRIGIR FUNÇÃO handle_new_user
-- Garantir que ela use SECURITY DEFINER para evitar problemas de RLS

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Inserir o perfil usando ON CONFLICT para evitar erros de duplicação
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
EXCEPTION
    WHEN OTHERS THEN
        -- Em caso de erro, apenas loga e continua
        RAISE WARNING 'Erro ao criar perfil para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON POLICY "Users can view their own profile" ON public.profiles IS 
  'Permite que usuários autenticados visualizem apenas seu próprio perfil';

COMMENT ON POLICY "Users can create their own profile" ON public.profiles IS 
  'Permite que usuários autenticados criem seu próprio perfil no primeiro login';

COMMENT ON POLICY "Users can update their own profile" ON public.profiles IS 
  'Permite que usuários autenticados atualizem apenas seu próprio perfil';

COMMENT ON POLICY "Users can delete their own profile" ON public.profiles IS 
  'Permite que usuários autenticados deletem apenas seu próprio perfil';

COMMENT ON POLICY "Service role can manage all profiles" ON public.profiles IS 
  'Permite que o service role (backend) gerencie todos os perfis para funcionalidades administrativas';

-- 7. CRIAR ÍNDICE PARA MELHOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);

-- Finalizar
SELECT 'Políticas RLS corrigidas com sucesso! A recursão infinita foi resolvida.' as result;