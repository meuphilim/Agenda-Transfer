# Agenda-Transfer: ERP para Gestão de Turismo Receptivo

**Agenda-Transfer** é uma plataforma de software (ERP) projetada para a gestão completa das operações logísticas e financeiras de empresas de turismo receptivo. O sistema centraliza o gerenciamento de pacotes, agendamentos, motoristas, veículos e faturamento, servindo como uma fonte única de verdade para todas as operações da empresa.

---

## 1. Visão Geral e Objetivos

O principal objetivo do Agenda-Transfer é otimizar a operação de agências de turismo receptivo, reduzindo a carga de trabalho manual e minimizando erros através da automação e centralização de informações.

-   **Dashboard Operacional:** Visualização em tempo real das atividades do dia.
-   **Gestão de Pacotes:** Criação e gerenciamento de pacotes turísticos, incluindo atividades e clientes.
-   **Módulo Financeiro:** Controle completo de custos, receitas, comissões de agências e pagamentos de motoristas.
-   **Cadastros Centralizados:** Gerenciamento de entidades essenciais como agências, veículos e motoristas.
-   **Portal de Agências:** Uma área dedicada para parceiros externos criarem e gerenciarem suas próprias reservas.

---

## 2. Princípios de Arquitetura e Design

A arquitetura do sistema foi projetada para ser robusta, segura e manutenível.

-   **Lógica de Negócio no Backend (Supabase/PostgreSQL):**
    -   **Funções RPC (PostgreSQL):** Operações complexas, transacionais ou que envolvem agregações de dados (ex: cálculos financeiros) são encapsuladas em funções no banco de dados. Isso garante a integridade dos dados, melhora a performance e reduz a complexidade do frontend.
    -   **Row Level Security (RLS):** O acesso aos dados é controlado primariamente por políticas de RLS. Esta é a nossa principal camada de segurança, garantindo que um usuário só possa acessar os dados aos quais tem permissão.

-   **Infraestrutura como Código (IaC) para o Banco de Dados:**
    -   Todas as alterações no schema do banco de dados (tabelas, políticas, funções) **devem** ser gerenciadas através de arquivos de migração no diretório `supabase/migrations/`. **Alterações manuais no painel do Supabase são estritamente proibidas** para evitar "schema drift" e garantir um histórico versionado.

-   **Frontend Reativo e Eficiente:**
    -   **"Data Stitching" Consciente:** Para relatórios e visualizações complexas (ex: `financeApi.ts`), favorecemos a execução de múltiplas consultas específicas em vez de uma única consulta SQL complexa com `JOIN`s. Os dados são combinados ("stitched") na camada de serviço do cliente. Esta abordagem aumenta a resiliência a mudanças no schema e simplifica a depuração.

---

## 3. Tech Stack

### Frontend
| Tecnologia | Propósito |
| :--- | :--- |
| **React & TypeScript** | UI reativa com segurança de tipos para robustez. |
| **Vite** | Ambiente de desenvolvimento de alta performance. |
| **Tailwind CSS** | Framework CSS utility-first para estilização rápida e consistente. |
| **shadcn/ui** | Componentes de UI acessíveis e reutilizáveis. |
| **React Hook Form & Yup**| Gerenciamento de formulários performático e validação baseada em schemas. |
| **React Router** | Roteamento no lado do cliente. |
| **Sonner & React Toastify**| Bibliotecas para notificações (toasts). |

### Backend & Infraestrutura
| Tecnologia | Propósito |
| :--- | :--- |
| **Supabase** | Plataforma BaaS que fornece toda a infraestrutura: |
| &nbsp;&nbsp;↳ **PostgreSQL** | Banco de dados relacional. |
| &nbsp;&nbsp;↳ **Auth & RLS** | Autenticação, autorização e segurança a nível de linha. |
| &nbsp;&nbsp;↳ **Storage** | Armazenamento de arquivos (ex: logos). |
| &nbsp;&nbsp;↳ **RPC Functions** | Lógica de negócio no banco de dados. |

### Testes & Qualidade de Código
| Tecnologia | Propósito |
| :--- | :--- |
| **Vitest & RTL** | Testes unitários e de integração focados no comportamento do usuário. |
| **Playwright** | Testes End-to-End e de regressão visual. |
| **ESLint & TypeScript** | Análise estática para garantir a qualidade e a consistência do código. |

---

## 4. Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js (v18+)
- npm (v9+)
- Git

### Instalação e Configuração

1.  **Clone o repositório:**
    ```bash
    git clone <URL_DO_REPOSITORIO>
    cd agenda-transfer
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    -   Copie `.env.example` para um novo arquivo `.env`.
    -   Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com as credenciais do seu projeto Supabase.

4.  **Aplique as migrações do banco de dados (se aplicável):**
    -   Com a [Supabase CLI](https://supabase.com/docs/guides/cli) instalada e configurada, aplique as migrações:
        ```bash
        npx supabase db push
        ```

### Execução

-   **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:5173`.

---

## 5. Scripts Essenciais

-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run build`: Gera a build de produção.
-   `npm test`: Executa a suíte de testes do Vitest.
-   `npm run check`: Roda o linter e o type-checker.
-   `npx playwright test`: Executa os testes E2E (requer que o servidor de `dev` esteja rodando).

---

## 6. Fluxos de Trabalho e Diretrizes de Contribuição

### Fluxo de Trabalho para Novas Funcionalidades

1.  **Crie uma Branch:** A partir da `main`, crie uma branch seguindo o padrão `feat/<nome-da-funcionalidade>` ou `fix/<nome-da-correcao>`.
2.  **Desenvolvimento Orientado a Testes (TDD):** Para componentes críticos ou lógica de serviços, inicie escrevendo os testes (unitários ou de integração) que falham. Em seguida, implemente o código para fazê-los passar.
3.  **Migrações de Banco de Dados:** Se a funcionalidade exigir uma alteração no schema:
    -   Crie um novo arquivo de migração (`supabase/migrations/<timestamp>_nome_descritivo.sql`).
    -   Escreva o SQL para a alteração.
    -   Aplique a migração localmente.
4.  **Desenvolvimento do Frontend:** Crie os componentes e a lógica necessários, seguindo os padrões existentes.
5.  **Verificação e Testes:**
    -   Certifique-se de que todos os testes (`npm test`) passam.
    -   Execute as verificações de qualidade (`npm run check`).
    -   Crie ou atualize os testes E2E (Playwright) se a mudança impactar um fluxo crítico do usuário.
6.  **Pull Request:** Abra um Pull Request para a `main`, descrevendo claramente as alterações e o motivo.

### Padrões de Qualidade

-   **Código Limpo:** Mantenha o código legível, bem documentado (quando necessário) e siga os padrões de lint configurados.
-   **Commits Atômicos:** Faça commits pequenos e focados em uma única alteração lógica. As mensagens de commit devem seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/).
-   **Revisão de Código:** Toda alteração deve ser revisada por pelo menos um outro membro da equipe antes de ser mesclada.

---

## 7. Estrutura do Projeto

```
agenda-transfer/
├── supabase/           # Configurações e migrações do Supabase (IaC)
├── tests/              # Testes E2E e de regressão visual (Playwright)
├── src/
│   ├── components/     # Componentes React (UI)
│   ├── contexts/       # Contextos da aplicação (ex: AuthContext)
│   ├── services/       # Lógica de acesso a dados e de negócio do cliente
│   ├── pages/          # Componentes que representam as páginas/rotas
│   ├── types/          # Definições de tipos (incluindo tipos gerados do DB)
│   ├── lib/            # Configuração de bibliotecas (ex: Supabase client)
│   └── ...
└── ...
```

---

## 8. Licença

Este projeto está licenciado sob a **Licença MIT**.
