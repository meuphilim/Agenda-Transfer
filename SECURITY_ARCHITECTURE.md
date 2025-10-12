# Arquitetura de Segurança - Agenda Transfer

## Visão Geral

Este documento descreve a arquitetura de segurança implementada para separar operações administrativas em um backend seguro, mantendo o frontend com acesso limitado apenas às operações permitidas.

## Arquitetura

### Frontend (Cliente)

**Chave Utilizada**: `VITE_SUPABASE_ANON_KEY`

**Operações Permitidas**:
- ✅ Leitura de dados próprios do usuário
- ✅ Edição de dados que o usuário está autorizado (RLS)
- ✅ Operações padrão do Supabase com Row Level Security

**Operações Administrativas**:
- ❌ **NÃO** pode listar todos os usuários diretamente
- ❌ **NÃO** pode deletar usuários do sistema
- ❌ **NÃO** pode usar `admin.listUsers()` ou `admin.deleteUser()`
- ✅ **SIM** pode chamar Edge Functions com token JWT

### Backend (Edge Functions)

**Chave Utilizada**: `SUPABASE_SERVICE_ROLE_KEY`

**Localização**: `/supabase/functions/admin-users/`

**Operações Disponíveis**:

1. **GET**: Lista todos os usuários com emails
   - Busca perfis na tabela `profiles`
   - Busca emails do Supabase Auth
   - Combina os dados e retorna

2. **PUT**: Atualiza dados de usuário
   - Permite editar: `full_name`, `phone`, `status`, `is_admin`
   - Requer validação de admin

3. **DELETE**: Remove usuário do sistema
   - Remove do Supabase Auth
   - Remove da tabela `profiles`
   - Requer validação de admin

## Fluxo de Segurança

### 1. Autenticação

```
Cliente → Supabase Auth → JWT Token
```

### 2. Validação de Admin

```
Edge Function recebe request
  ↓
Extrai JWT Token do header Authorization
  ↓
Valida token com Supabase Auth
  ↓
Busca perfil do usuário
  ↓
Verifica: is_admin = true AND status = 'active'
  ↓
✅ Autorizado  ou  ❌ Negado (403)
```

### 3. Execução Segura

```
Validação OK
  ↓
Cria cliente Supabase com SERVICE_ROLE_KEY
  ↓
Executa operação administrativa
  ↓
Retorna resultado ao cliente
```

## Sessão e Cache

### Gestão de Sessão

**Timeout de Inatividade**: 30 minutos (configurável)

**Variável de Ambiente**: `VITE_SESSION_TIMEOUT=1800000`

**Comportamento**:
- Timer reinicia a cada interação do usuário
- Eventos monitorados: `mousedown`, `keydown`, `scroll`, `touchstart`, `click`, `mousemove`
- Verificação a cada 1 minuto
- Logout automático após timeout
- Sessão mantida mesmo se aba ficar inativa (desde que haja interação dentro do período)

### Sistema de Cache

**Hook Criado**: `useCachedQuery`

**Configurações**:
- `cacheTime`: 5 minutos (tempo que dados ficam em cache)
- `staleTime`: 1 minuto (tempo até dados serem considerados obsoletos)

**Recursos**:
- ✅ Cache em memória para evitar requisições duplicadas
- ✅ Debouncing automático de 50ms
- ✅ Previne requisições paralelas duplicadas
- ✅ Invalidação por tabela ou global
- ✅ Atualização automática de dados obsoletos
- ✅ Cache compartilhado entre componentes

**Funções de Utilidade**:
```typescript
invalidateAllQueries()        // Limpa todo o cache
invalidateQueriesByTable(table) // Invalida cache de uma tabela específica
```

## Segurança Implementada

### ✅ Checklist de Segurança

- [x] Service Role Key apenas no backend
- [x] Validação de JWT Token em todas as requisições
- [x] Verificação de privilégios de administrador
- [x] Verificação de status ativo do usuário
- [x] CORS configurado corretamente
- [x] Row Level Security (RLS) habilitado
- [x] Timeout de sessão configurável
- [x] Cache eficiente para reduzir consultas
- [x] Logs de erro no console (desenvolvimento)
- [x] Tratamento de erros em todas as operações

### 🔒 Princípios de Segurança

1. **Least Privilege**: Frontend tem apenas permissões mínimas necessárias
2. **Defense in Depth**: Múltiplas camadas de validação (JWT + Admin + Status)
3. **Separation of Concerns**: Operações admin isoladas em Edge Functions
4. **Secure by Default**: RLS ativo, validações obrigatórias
5. **Zero Trust**: Toda requisição é validada, não confia no cliente

## Arquivos Criados/Modificados

### Novos Arquivos

1. **`/supabase/functions/admin-users/index.ts`**
   - Edge Function para operações administrativas

2. **`/src/services/adminApi.ts`**
   - Cliente frontend para chamar Edge Functions

3. **`/src/hooks/useCachedQuery.ts`**
   - Hook com cache otimizado

4. **`/supabase/functions/README.md`**
   - Documentação das Edge Functions

### Arquivos Modificados

1. **`/src/pages/UserManagement.tsx`**
   - Agora usa `adminApi` ao invés de queries diretas
   - Remove dependência de `supabase.auth.admin`

2. **`/src/components/ProtectedRoute.tsx`**
   - Timeout de sessão ajustado para 30 minutos
   - Usa variável de ambiente `VITE_SESSION_TIMEOUT`

3. **`/.env`**
   - Adicionada `VITE_SESSION_TIMEOUT=1800000`

## Como Usar

### No Frontend

```typescript
import { adminApi } from '../services/adminApi';

// Listar usuários
const { data, error } = await adminApi.listUsers();

// Atualizar usuário
const { data, error } = await adminApi.updateUser(userId, {
  status: 'active',
  is_admin: true
});

// Deletar usuário
const { data, error } = await adminApi.deleteUser(userId);
```

### Cache Otimizado

```typescript
import { useCachedQuery } from '../hooks/useCachedQuery';

const { data, loading, error, refresh, invalidate } = useCachedQuery({
  table: 'drivers',
  orderBy: { column: 'name' },
  cacheTime: 5 * 60 * 1000, // 5 minutos
  staleTime: 1 * 60 * 1000,  // 1 minuto
});
```

## Monitoramento

### Logs

- Erros são logados no console (desenvolvimento)
- Edge Functions têm logs disponíveis no Supabase Dashboard
- Caminho: `Project > Edge Functions > Logs`

### Métricas de Cache

O sistema de cache mantém estatísticas internas sobre:
- Hits de cache
- Requisições evitadas
- Tempo de vida dos dados

## Troubleshooting

### Erro 401: Unauthorized
- Verificar se usuário está autenticado
- Confirmar que token JWT é válido

### Erro 403: Forbidden
- Verificar se usuário tem `is_admin = true`
- Confirmar que status é `active`

### Erro 500: Internal Server Error
- Verificar logs da Edge Function
- Confirmar variáveis de ambiente

### Cache não atualiza
- Usar `refresh()` para forçar atualização
- Usar `invalidate()` para limpar cache específico

## Próximos Passos

### Melhorias Sugeridas

1. **Logs Estruturados**: Implementar sistema de logs profissional
2. **Rate Limiting**: Adicionar limitação de requisições por IP/usuário
3. **Auditoria**: Registrar todas as operações administrativas
4. **Backup Automático**: Sistema de backup antes de operações destrutivas
5. **2FA**: Adicionar autenticação de dois fatores para admins
6. **Webhooks**: Notificar eventos críticos via webhook

## Conclusão

A arquitetura implementada garante que:
- ✅ Frontend não tem acesso direto a operações sensíveis
- ✅ Apenas admins autorizados podem gerenciar usuários
- ✅ Sessão expira após 30 minutos de inatividade
- ✅ Cache eficiente reduz carga no banco de dados
- ✅ Sistema é seguro, escalável e fácil de manter
