# Auditoria Completa do Repositório
Data: 2025-10-15

## 1. ESTRUTURA GERAL

### Arquivos de Configuração
- ✅ `package.json` - Configuração de dependências e scripts.
- ✅ `tsconfig.json` - Configuração TypeScript "solution-style".
- ✅ `tsconfig.app.json` - Configuração TypeScript para o código da aplicação.
- ✅ `tsconfig.node.json` - Configuração TypeScript para o ambiente Node.js (Vite config).
- ✅ `vite.config.ts` - Configuração do build com Vite.
- ✅ `tailwind.config.js` - Configuração do Tailwind CSS.
- ✅ `postcss.config.js` - Configuração do PostCSS.
- ✅ `eslint.config.js` - Configuração do ESLint.
- ✅ `vercel.json` - Configuração de deploy para a Vercel (rewrites).
- ⚠️ `tsconfig.json` & `tsconfig.app.json` - Contêm uma configuração de alias de caminho (`@/*`) que não está sendo utilizada no projeto nem configurada no Vite. **AÇÃO: Remover a configuração de `paths`**.

### Arquivos de Documentação
- ✅ `README.md` - Documentação principal do projeto. **AÇÃO: Atualizar para refletir o estado atual do código.**
- ✅ `LICENSE` - Licença MIT.
- ✅ `SECURITY_ARCHITECTURE.md` - Documentação detalhada da arquitetura de segurança.
- ✅ `OPTIMIZATIONS.md` - Documentação de otimizações futuras.

### Outros Arquivos na Raiz
- ✅ `index.html` - Ponto de entrada do HTML.
- ✅ `cleanup.sh` - Script auxiliar para limpar o ambiente de desenvolvimento.

---

## 2. CÓDIGO FONTE (/src, /api)

### ✅ NECESSÁRIOS E EM USO

#### Componentes (`src/components`)
- `Auth/CompleteProfile.tsx`: Parte do fluxo de autenticação, usado em `ProtectedRoute`.
- `Auth/Login.tsx`: Componente de login, usado em `ProtectedRoute`.
- `ErrorBoundary/index.tsx`: Captura de erros, envolve toda a aplicação em `App.tsx`.
- `Layout/Layout.tsx`: Estrutura principal da UI, usado em `App.tsx`.
- `Layout/Sidebar.tsx`: Barra de navegação lateral, usada em `Layout`.
- `Profile/ProfileModal.tsx`: Modal para edição de perfil do usuário.
- `ProtectedRoute.tsx`: Rota protegida que gerencia o acesso com base na autenticação e status do usuário.

#### Contextos (`src/contexts`)
- `AuthContext.tsx`: Gerencia estado de autenticação, perfil do usuário e sessão. Usado em toda a aplicação.

#### Hooks (`src/hooks`)
- `useSupabaseData.ts`: Hook para buscar dados do Supabase. Usado nas páginas de cadastros.

#### Páginas (`src/pages`)
- `Dashboard.tsx`: Rota `/`.
- `Schedule.tsx`: Rota `/agenda`.
- `Packages.tsx`: Rota `/reservas`.
- `Settings.tsx`: Rota `/cadastros`. Atua como um hub para outras páginas de gerenciamento.
- `UserManagement.tsx`: Rota `/usuarios`.
- `Agencies.tsx`: Usado dentro de `Settings.tsx`.
- `Attractions.tsx`: Usado dentro de `Settings.tsx`.
- `Drivers.tsx`: Usado dentro de `Settings.tsx`.
- `Vehicles.tsx`: Usado dentro de `Settings.tsx`.

#### Serviços (`src/services`)
- `adminApi.ts`: Serviço para fazer chamadas à API de administração do backend.

#### Utilitários (`src/utils`)
- `messageFormat.ts`: Funções para formatar mensagens. Usado em `Schedule.tsx`.
- `whatsapp.ts`: Função para enviar mensagens via WhatsApp. Usado em `Schedule.tsx`.

#### Código da Aplicação
- `App.tsx`: Componente raiz que define rotas e provedores.
- `main.tsx`: Ponto de entrada da aplicação React.
- `index.css`: Estilos globais.
- `lib/supabase.ts`: Inicialização do cliente Supabase.

#### API Backend (`api/`)
- `admin.ts`: Função serverless (Vercel) que lida com operações de administrador de forma segura.

---

### ❌ ARQUIVOS MORTOS (Dead Code)

**Componentes**
- `src/components/Auth/AccountSetup.tsx`
  - Status: ❌ NÃO USADO
  - Importado por: Ninguém (apenas exportado por `index.ts`).
  - **AÇÃO: ❌ REMOVER**
- `src/components/Debug/SessionDebug.tsx`
  - Status: ❌ NÃO USADO
  - Importado por: Ninguém.
  - **AÇÃO: ❌ REMOVER**

**Contextos**
- `src/contexts/DataContext.tsx`
  - Status: ❌ NÃO USADO
  - O `DataProvider` envolve a aplicação, mas o hook `useData` nunca é chamado. A funcionalidade de cache parece ter sido substituída por outros hooks.
  - **AÇÃO: ❌ REMOVER** (e remover o Provider do `App.tsx`).

**Hooks**
- `src/hooks/useCachedQuery.ts`
  - Status: ❌ NÃO USADO
  - Importado por: Ninguém. Documentado no `SECURITY_ARCHITECTURE.md` mas não implementado.
  - **AÇÃO: ❌ REMOVER**
- `src/hooks/useSessionHeartbeat.ts`
  - Status: ❌ NÃO USADO
  - Importado por: Ninguém.
  - **AÇÃO: ❌ REMOVER**
- `src/hooks/useSessionMonitor.ts`
  - Status: ❌ NÃO USADO
  - Importado por: `SessionDebug.tsx` (que também é código morto).
  - **AÇÃO: ❌ REMOVER**

**Utilitários**
- `src/utils/messageFormat.ts.bak`
  - Status: ❌ BACKUP
  - É um arquivo de backup desnecessário.
  - **AÇÃO: ❌ REMOVER**
- `src/utils/supabaseSync.ts`
  - Status: ❌ NÃO USADO
  - Importado por: Ninguém.
  - **AÇÃO: ❌ REMOVER**
- `src/utils/testAccountSetup.ts`
  - Status: ❌ SCRIPT DE TESTE ÓRFÃO
  - Não é um teste automatizado e não é importado em nenhum lugar.
  - **AÇÃO: ❌ REMOVER**

---

## 3. RESUMO EXECUTIVO

### Estatísticas
- **Total de arquivos analisados (TS/TSX/JS):** ~45
- **Arquivos necessários:** 36 (80%)
- **Arquivos mortos/backup:** 9 (20%)

### Ações Recomendadas

#### 🔴 PRIORIDADE ALTA (Remoção de Código)
1.  **Remover Contexto Inutilizado:**
    - ❌ `src/contexts/DataContext.tsx`
    - 🔄 Modificar `src/App.tsx` para remover o `DataProvider`.
2.  **Remover Componentes Órfãos:**
    - ❌ `src/components/Auth/AccountSetup.tsx`
    - ❌ `src/components/Debug/SessionDebug.tsx`
3.  **Remover Hooks Não Utilizados:**
    - ❌ `src/hooks/useCachedQuery.ts`
    - ❌ `src/hooks/useSessionHeartbeat.ts`
    - ❌ `src/hooks/useSessionMonitor.ts`
4.  **Remover Utilitários Desnecessários:**
    - ❌ `src/utils/messageFormat.ts.bak`
    - ❌ `src/utils/supabaseSync.ts`
    - ❌ `src/utils/testAccountSetup.ts`

#### 🟡 PRIORIDADE MÉDIA (Limpeza de Configuração)
5.  **Ajustar `tsconfig.json` e `tsconfig.app.json`:**
    - 🔄 Remover a chave `paths` que define o alias não utilizado `@/*`.
6.  **Atualizar Documentação:**
    - 🔄 Editar o `README.md` para remover referências a funcionalidades/arquivos que não existem e ajustar a estrutura de arquivos para corresponder à realidade.

---

## 4. MAPA DE DEPENDÊNCIAS CRÍTICAS

### Arquivos Core (A remoção quebraria a aplicação)
```
api/admin.ts
  └─ chamado por: src/services/adminApi.ts

src/services/adminApi.ts
  └─ usado por: src/pages/UserManagement.tsx

src/contexts/AuthContext.tsx
  ├─ usado por: Quase todos os componentes autenticados
  └─ provider em: src/App.tsx

src/lib/supabase.ts
  └─ usado por: AuthContext, adminApi, useSupabaseData, etc.

src/App.tsx
  └─ Ponto de entrada do Roteamento e Contextos
```

### Arquivos Isolados (Remoção segura)
```
- src/components/Auth/AccountSetup.tsx
- src/components/Debug/SessionDebug.tsx
- src/contexts/DataContext.tsx
- src/hooks/useCachedQuery.ts
- src/hooks/useSessionHeartbeat.ts
- src/hooks/useSessionMonitor.ts
- src/utils/messageFormat.ts.bak
- src/utils/supabaseSync.ts
- src/utils/testAccountSetup.ts
```