
Agenda-Transfer

Descrição
-------

Agenda-Transfer é uma aplicação front-end em React + TypeScript construída com Vite que fornece uma interface administrativa para gerenciar agências, motoristas, veículos, pacotes, atrações e agendas. O back-end/armazenamento usa o Supabase (cliente presente em `src/lib/supabase.ts`).

Status do projeto
-----------------

Em desenvolvimento — estrutura inicial pronta com páginas e componentes divididos por responsabilidade. Não há testes automatizados incluídos até o momento.

Principais tecnologias
---------------------

- React 18 + TypeScript
- Vite (dev server e build)
- Tailwind CSS para estilos
- Supabase (autenticação e banco)
- React Router para rotas
- React Hook Form + Yup para formulários
- ESLint + TypeScript para lint/checagem de tipos

Características implementadas (base em `src/pages`)
------------------------------------------------

- Dashboard
- Agências (Agencies)
- Atrações (Attractions)
- Motoristas (Drivers)
- Pacotes (Packages)
- Agenda / Schedule
- Veículos (Vehicles)

Estrutura do repositório (resumo)
---------------------------------

- `src/` — código fonte
  - `components/` — componentes reutilizáveis e layout
  - `contexts/` — providers (ex.: `AuthContext.tsx`)
  - `lib/` — clientes e helpers (ex.: `supabase.ts`)
  - `pages/` — páginas da aplicação
  - `main.tsx`, `App.tsx` — bootstrap da aplicação
- `supabase/migrations/` — migrations SQL (há pelo menos uma migration)
- `package.json`, `tsconfig.*`, `vite.config.ts` — configuração do projeto

Como rodar localmente
---------------------

Pré-requisitos

- Node.js (recomendado >=18)
- npm ou pnpm/yarn

Instalação

```bash
npm install
```

Variáveis de ambiente
---------------------

Crie um arquivo `.env.local` (não comitar) contendo pelo menos as variáveis do Supabase usadas por `src/lib/supabase.ts`:

- SUPABASE_URL
- SUPABASE_ANON_KEY

Exemplo (não use chaves reais no repositório):

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=public-anon-key
```

Scripts úteis
------------

- `npm run dev` — inicia o servidor de desenvolvimento (Vite)
- `npm run build` — gera build de produção
- `npm run preview` — serve o build localmente
- `npm run lint` — roda ESLint
- `npm run typecheck` — checagem de tipos do TypeScript

Análise detalhada do projeto
----------------------------

Observações sobre o estado atual e recomendações priorizadas:

1. Organização e legibilidade
	- A divisão por pastas (`components`, `pages`, `contexts`, `lib`) está correta e segue boas práticas. Recomendo manter componentes pequenos e garantir que cada página reutilize componentes comuns.

2. Tipagem e qualidade
	- O projeto já usa TypeScript com `strict: true` — ótimo. Garantir cobertura de tipos em todos os `props` de componentes e nos retornos de chamadas à API/Supabase evitará erros em runtime.

3. Autenticação e segurança
	- Verifique se as regras do Supabase (RLS) estão corretamente configuradas para proteger dados sensíveis. Não comitar `.env.local` ou chaves privadas.

4. Testes automatizados
	- Recomendo adicionar testes unitários (Jest + React Testing Library) e 1–2 testes E2E (Playwright) para fluxos críticos (login, CRUD de recursos principais).

5. CI / CD
	- Adicionar workflow GitHub Actions para rodar lint, typecheck e testes em PRs. Configurar deploy automático (ex.: Vercel, Netlify ou um pipeline que rode o build e publique).

6. Lint e formatação
	- ESLint está presente. Considere adicionar Prettier e integrar com ESLint para formatação consistente e hooks git (husky) para pré-commit.

7. Migrations e backups
	- Há uma migration em `supabase/migrations/`. Documentar o fluxo de migração (como aplicar, rollback) e manter migrations no repositório é uma boa prática.

8. Acessibilidade e UX
	- Fazer uma auditoria rápida com Lighthouse e checar contraste, foco e labels em formulários.

Checklist de melhorias (curto prazo)
----------------------------------

- [ ] Adicionar README completo (feito)
- [ ] Configurar CI básico (lint + typecheck)
- [ ] Adicionar testes unitários iniciais
- [ ] Garantir variáveis de ambiente e evitar commits sensíveis
- [ ] Documentar deploy (Vercel/Netlify)

Contribuição
------------

1. Fork e clone
2. Crie uma branch: `feature/minha-melhora`
3. Abra um PR descrevendo a mudança

Por favor, abra issues para discutir features maiores antes de implementar.

Contato / Autor
---------------

Projeto mantido por meuphilim (visto no repositório).

Licença
-------

Este projeto está licenciado sob a licença MIT — veja o arquivo `LICENSE` para detalhes.
