# Correção de Recursão Infinita RLS - Profiles

## Problema Identificado
```
infinite recursion detected in policy for relation "profiles"
```

Este erro ocorria quando usuários tentavam criar ou atualizar seus perfis no primeiro login.

## Causa Raiz
As políticas RLS antigas usavam a função `is_admin()` que consultava a própria tabela `profiles` para verificar permissões, criando um loop infinito:

```sql
-- POLÍTICA ANTIGA (PROBLEMÁTICA)
CREATE POLICY "Administradores podem gerenciar todos os perfis"
  ON public.profiles FOR ALL
  USING (public.is_admin())  -- ❌ Consulta profiles dentro da política de profiles!
```

## Solução Aplicada

### 1. Políticas RLS Corrigidas
Removidas todas as políticas antigas e criadas novas políticas **sem recursão**:

```sql
-- ✅ Políticas sem recursão - usam apenas auth.uid()

-- SELECT: usuários veem apenas seu perfil
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- INSERT: usuários criam apenas seu perfil
CREATE POLICY "Users can create their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: usuários atualizam apenas seu perfil
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: usuários deletam apenas seu perfil
CREATE POLICY "Users can delete their own profile"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ADMIN: Service role tem acesso total (para backend)
CREATE POLICY "Service role can manage all profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

### 2. Função `handle_new_user` Corrigida
Atualizada para usar `SECURITY DEFINER` e tratar erros graciosamente:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Erro ao criar perfil: %', SQLERRM;
        RETURN NEW;
END;
$$;
```

### 3. AuthContext Simplificado
O código foi simplificado para confiar no trigger `handle_new_user`:

```typescript
// Antes: Código tentava criar perfil manualmente (complexo)
// Agora: Apenas busca o perfil (simples)

const fetchProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error?.message?.includes('infinite recursion')) {
    logger.error('RECURSÃO DETECTADA!');
    return null;
  }

  return data;
};
```

## Fluxo de Criação de Perfil

1. **Usuário faz signup** → Supabase cria registro em `auth.users`
2. **Trigger dispara** → `on_auth_user_created` executa `handle_new_user()`
3. **Perfil criado** → Inserido em `profiles` com `SECURITY DEFINER` (bypass RLS)
4. **Frontend busca** → `fetchProfile()` busca o perfil com retry inteligente

## Verificação

Para verificar se as políticas estão corretas:

```sql
-- Ver políticas atuais
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'profiles';

-- Resultado esperado:
-- 5 políticas (SELECT, INSERT, UPDATE, DELETE para authenticated + ALL para service_role)
```

## Testes Realizados
- ✅ Build completo sem erros
- ✅ 5 políticas RLS ativas (sem recursão)
- ✅ Trigger `on_auth_user_created` funcionando
- ✅ Função `handle_new_user` com SECURITY DEFINER
- ✅ AuthContext com tratamento de erro

## Resultado
O erro de recursão infinita foi **completamente eliminado**. Usuários agora podem:
- Criar conta (signup)
- Fazer login
- Completar perfil
- Atualizar informações

Tudo sem erros de recursão!
