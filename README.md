# Agenda-Transfer: ERP para Gestão de Turismo Receptivo

**Agenda-Transfer** é uma plataforma de software (ERP) projetada para a gestão completa das operações logísticas e financeiras de empresas de turismo receptivo. O sistema centraliza o gerenciamento de pacotes, agendamentos, motoristas, veículos e faturamento, servindo como uma fonte única de verdade para todas as operações da empresa.

---

## 1. Princípios Arquiteturais

A arquitetura do sistema foi projetada com base nos seguintes princípios para garantir manutenibilidade, escalabilidade e segurança:

-   **Lógica de Negócio no Backend:** Operações complexas, transacionais ou que envolvam regras de negócio críticas são encapsuladas em **Funções RPC (PostgreSQL)** no Supabase. Esta abordagem garante a integridade dos dados, melhora a performance e reduz a complexidade do frontend.
-   **Segurança a Nível de Banco de Dados:** O acesso aos dados é controlado primariamente por políticas de **Row Level Security (RLS)** no PostgreSQL. Isso garante que as regras de segurança sejam aplicadas de forma consistente, independentemente de como os dados são acessados.
-   **Flexibilidade no Frontend com "Data Stitching":** Para relatórios e visualizações complexas (ex: módulo financeiro), a aplicação favorece a execução de múltiplas consultas simples à API em vez de uma única consulta SQL complexa com `JOIN`s. Os dados são "costurados" (stitched) no lado do cliente (`services/financeApi.ts`). Esta abordagem aumenta a resiliência a mudanças no schema e simplifica a depuração, embora exija uma gestão de estado cuidadosa no cliente.
-   **Infraestrutura como Código (IaC) para o Banco de Dados:** Todas as alterações no schema do banco de dados (tabelas, políticas, funções) **devem** ser gerenciadas através de arquivos de migração no diretório `supabase/migrations/`. Alterações manuais no painel do Supabase são estritamente desencorajadas para evitar "schema drift".

---

## 2. Tech Stack

### Frontend

| Tecnologia | Justificativa |
| :--- | :--- |
| **React & TypeScript** | UI reativa com a segurança de tipos do TypeScript para robustez. |
| **Vite** | Build tool moderna que oferece um ambiente de desenvolvimento rápido. |
| **Tailwind CSS** | Framework CSS utility-first para estilização rápida e consistente. |
| **shadcn/ui** | Componentes de UI que seguem as melhores práticas de acessibilidade. |
| **React Hook Form & Yup**| Gerenciamento de formulários performático e validação baseada em schemas. |
| **React Router** | Padrão da indústria para roteamento no lado do cliente. |
| **Sonner** | Biblioteca leve para notificações (toasts). |

### Backend & Infraestrutura

| Tecnologia | Justificativa |
| :--- | :--- |
| **Supabase** | Plataforma BaaS que fornece toda a infraestrutura de backend: |
| &nbsp;&nbsp;↳ **PostgreSQL** | Banco de dados relacional robusto e escalável. |
| &nbsp;&nbsp;↳ **Auth** | Gerenciamento completo de autenticação e autorização (JWT). |
| &nbsp;&nbsp;↳ **Storage** | Armazenamento de arquivos, utilizado para os logos das empresas. |
| &nbsp;&nbsp;↳ **RLS & RPC** | Ferramentas nativas do PostgreSQL para segurança e lógica de negócio. |

### Testes & Qualidade de Código

| Tecnologia | Justificativa |
| :--- | :--- |
| **Vitest** | Framework de testes unitários e de integração, rápido e com boa integração com Vite. |
| **React Testing Library** | Foco em testes que simulam o comportamento do usuário. |
| **Playwright** | Testes End-to-End e de regressão visual robustos e confiáveis. |
| **ESLint & TypeScript Strict** | Análise estática para garantir a qualidade e a consistência do código. |

---

## 3. Ambiente de Desenvolvimento

### Pré-requisitos
- Node.js (v18+)
- npm (v9+)
- Git

### Instalação

1.  **Clonar o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/TourManager.git
    cd TourManager
    ```

2.  **Instalar dependências:**
    ```bash
    npm install
    ```

3.  **Configurar variáveis de ambiente:**
    -   Copie o arquivo `.env.example` para um novo arquivo chamado `.env`.
    -   Preencha as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com as credenciais do seu projeto Supabase (encontradas em *Project Settings > API*).

4.  **Aplicar migrações do banco de dados:**
    -   Certifique-se de que a CLI do Supabase está instalada e configurada.
    -   Aplique as migrações para configurar o schema do banco de dados no seu projeto:
        ```bash
        npx supabase db push
        ```

### Execução

-   **Iniciar o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```
    A aplicação estará disponível em `http://localhost:5173`.

---

## 4. Scripts Disponíveis

-   `npm run dev`: Inicia o servidor de desenvolvimento.
-   `npm run build`: Gera a build de produção na pasta `dist/`.
-   `npm test`: Executa os testes unitários/integração com Vitest.
-   `npm run check`: Executa o `lint` e o `typecheck` para garantir a qualidade do código.
-   `npx playwright test`: Executa os testes E2E (requer que o servidor de `dev` esteja rodando).

---

## 5. Estrutura do Projeto

```
agenda-transfer/
├── supabase/           # Migrações e configurações do banco de dados (IaC)
├── tests/              # Testes E2E e de regressão visual (Playwright)
├── src/
│   ├── components/     # Componentes React (UI)
│   ├── contexts/       # Contextos da aplicação (ex: AuthContext)
│   ├── services/       # Lógica de acesso a dados e de negócio do cliente
│   ├── pages/          # Componentes que representam as páginas da aplicação
│   ├── types/          # Definições de tipos TypeScript
│   ├── lib/            # Configuração de clientes (ex: Supabase)
│   └── ...
└── ...
```

---

## 6. Licença

Este projeto está licenciado sob a **Licença MIT**.
