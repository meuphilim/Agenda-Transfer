# 🚀 Agenda Transfer - Sistema de Gestão de Turismo

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Sistema profissional de gestão para turismo receptivo, desenvolvido com React, TypeScript e Supabase. Gerencia agências, motoristas, veículos, pacotes turísticos e agendas de forma eficiente e segura.

---

## 📋 Índice
 
- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Arquitetura](#-arquitetura)
- [Segurança](#-segurança)
- [Deploy](#-deploy)
- [Troubleshooting](#-troubleshooting)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

**Agenda Transfer** é uma aplicação web moderna para gestão completa de operações de turismo receptivo. O sistema permite controle total sobre:

- 🏢 Agências de turismo
- 🚗 Frota de veículos
- 👨‍✈️ Motoristas e guias
- 🎫 Pacotes e roteiros turísticos
- 🗺️ Atrações e pontos turísticos
- 📅 Agendamento de transfers e passeios
- 👥 Gestão de usuários e permissões

### 🌟 Diferenciais

- ✅ Interface moderna e intuitiva
- ✅ Autenticação e autorização robustas
- ✅ Atualização em tempo real via Supabase Realtime
- ✅ Sistema de sessão com timeout configurável
- ✅ Gestão de perfis e permissões (Admin/User)
- ✅ Validação de formulários com feedback visual
- ✅ Responsivo e otimizado para dispositivos móveis
- ✅ Error boundaries e tratamento de erros robusto

---

## ⚡ Funcionalidades

### 🔐 Autenticação e Perfis
- [x] Login com email/senha
- [x] Cadastro de novos usuários
- [x] Sistema de aprovação de contas (pending/active/inactive)
- [x] Perfis de usuário com informações completas
- [x] Edição de perfil com validação
- [x] Sessão automática com timeout por inatividade
- [x] Logout seguro com limpeza de cache

### 📊 Dashboard
- [x] Visão geral do sistema
- [x] Estatísticas em tempo real
- [x] Pacotes ativos e agendamentos
- [x] Alertas e notificações

### 🚗 Gestão de Veículos
- [x] Cadastro completo (placa, marca, modelo, capacidade)
- [x] Status (disponível, em uso, manutenção)
- [x] Edição e exclusão
- [x] Listagem com ordenação
- [x] Atualização em tempo real

### 👨‍✈️ Gestão de Motoristas
- [x] Dados pessoais (nome, telefone, email)
- [x] CNH (número, categoria, validade, EAR)
- [x] Status (disponível, ocupado, indisponível)
- [x] Validação de CNH expirada com alerta visual
- [x] Formatação automática de telefone
- [x] CRUD completo com realtime

### 🏢 Gestão de Agências
- [x] Cadastro de agências parceiras
- [x] Informações de contato
- [x] Status ativo/inativo
- [x] Sistema de busca e filtros

### 🎫 Gestão de Pacotes
- [x] Criação de pacotes turísticos
- [x] Vinculação com atrações
- [x] Controle de datas e horários
- [x] Gestão de reservas

### 🗺️ Gestão de Atrações
- [x] Cadastro de pontos turísticos
- [x] Descrição e informações
- [x] Status e disponibilidade

### 📅 Agenda e Schedule
- [x] Visualização de agendamentos
- [x] Gestão de disponibilidade
- [x] Conflitos de horário

### 👥 Gerenciamento de Usuários (Admin)
- [x] Aprovação/rejeição de novos usuários
- [x] Ativação/desativação de contas
- [x] Promoção a administrador
- [x] Listagem com filtros de status

---

## 🛠️ Tecnologias

### Frontend
| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| [React](https://react.dev/) | 18.3.1 | Biblioteca JavaScript para UI |
| [TypeScript](https://www.typescriptlang.org/) | 5.5.3 | Superset JavaScript com tipagem |
| [Vite](https://vitejs.dev/) | 5.4.2 | Build tool ultra-rápida |
| [React Router](https://reactrouter.com/) | 6.26.2 | Roteamento declarativo |
| [Tailwind CSS](https://tailwindcss.com/) | 3.4.11 | Framework CSS utilitário |

### Backend & Database
| Tecnologia | Descrição |
|------------|-----------|
| [Supabase](https://supabase.com/) | Backend-as-a-Service (PostgreSQL) |
| PostgreSQL | Banco de dados relacional |
| Supabase Realtime | Atualizações em tempo real |
| Row Level Security (RLS) | Segurança em nível de linha |

### Bibliotecas Adicionais
- **React Toastify** - Notificações elegantes
- **Headless UI** - Componentes acessíveis
- **Lucide React** - Ícones SVG
- **React Hook Form** - Gerenciamento de formulários

### DevOps & CI/CD
- **GitHub Actions** - Automação de workflows
- **ESLint** - Linting de código
- **TypeScript ESLint** - Linting para TypeScript

---

## 📋 Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 ou **yarn** >= 1.22.0
- **Git**
- **Conta no Supabase** (gratuita disponível)

---

## 🚀 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/meuphilim/Agenda-Transfer.git
cd Agenda-Transfer
```

### 2. Instale as dependências

```bash
npm install
# ou
yarn install
```

### 3. Configure as variáveis de ambiente

```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais:

```env
# Supabase
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_aqui

# Sessão (30 minutos = 1800000ms)
VITE_SESSION_TIMEOUT=1800000

# App
VITE_APP_URL=http://localhost:5173

# Backend (Vercel Environment)
# Esta chave é usada no endpoint da API para operações de administrador.
# NUNCA exponha esta chave no frontend.
SUPABASE_SERVICE_KEY=sua_chave_de_serviço_aqui
```

### 4. Execute o projeto

```bash
npm run dev
# ou
yarn dev
```

Acesse: **http://localhost:5173**

---

## ⚙️ Configuração

### Supabase Setup

1. **Crie um projeto** no [Supabase](https://supabase.com/)

2. **Configure o banco de dados:**
   - Execute as migrations em `supabase/migrations/`
   - Configure Row Level Security (RLS)
   - Habilite Realtime para as tabelas necessárias

3. **Obtenha as credenciais:**
   - URL do projeto: `Settings > API > Project URL`
   - Chave anônima: `Settings > API > anon public`

4. **Configure CORS:**
   - `Settings > API > CORS > Add URL: http://localhost:5173`

### Estrutura do Banco de Dados

```sql
-- Tabelas principais
- profiles (usuários)
- agencies (agências)
- drivers (motoristas)
- vehicles (veículos)
- attractions (atrações)
- packages (pacotes)
- schedules (agendamentos)
```

---

## 📜 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento

# Build
npm run build            # Cria build de produção
npm run preview          # Preview do build localmente

# Qualidade de Código
npm run lint             # Executa ESLint
npm run typecheck        # Verifica tipos TypeScript
npm run check            # Lint + TypeCheck

# Deploy
npm run deploy           # Build + Deploy (GitHub Pages)
```

---

## 📁 Estrutura do Projeto

```
Agenda-Transfer/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI/CD automático
├── public/                        # Assets públicos
├── src/
│   ├── components/                # Componentes React
│   │   ├── Auth/                 # Login, Signup, CompleteProfile
│   │   ├── Layout/               # Layout, Sidebar
│   │   ├── Profile/              # ProfileModal
│   │   ├── ErrorBoundary.tsx     # Tratamento de erros
│   │   └── ProtectedRoute.tsx    # Proteção de rotas
│   ├── contexts/                  # Contextos React
│   │   ├── AuthContext.tsx       # Autenticação global
│   │   └── DataContext.tsx       # Dados globais
│   ├── hooks/                     # Custom hooks
│   │   └── useSupabaseData.ts    # Hook para Supabase
│   ├── lib/                       # Bibliotecas
│   │   └── supabase.ts           # Cliente Supabase
│   ├── pages/                     # Páginas da aplicação
│   │   ├── Dashboard.tsx         # Dashboard principal
│   │   ├── Schedule.tsx          # Agenda
│   │   ├── Packages.tsx          # Pacotes
│   │   ├── Settings.tsx          # Configurações/Cadastros
│   │   ├── Drivers.tsx           # Motoristas
│   │   ├── Vehicles.tsx          # Veículos
│   │   └── UserManagement.tsx    # Gestão de usuários
│   ├── types/                     # Definições TypeScript
│   ├── utils/                     # Utilitários
│   ├── App.tsx                    # Componente raiz
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Estilos globais
├── supabase/
│   └── migrations/                # Migrations do banco
├── .env.example                   # Exemplo de variáveis
├── .eslintrc.cjs                  # Config ESLint
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js             # Config Tailwind
├── tsconfig.json                  # Config TypeScript
├── vite.config.ts                 # Config Vite
└── README.md
```

---

## 🏗️ Arquitetura

### Fluxo de Autenticação

```
Login → AuthContext → Supabase Auth
  ↓
Verifica Sessão
  ↓
Busca Profile (com retry)
  ↓
ProtectedRoute valida status
  ↓
Renderiza App ou Tela de Erro
```

### Gestão de Sessão

- **Timeout de Carregamento:** 10 segundos
- **Timeout de Inatividade:** Configurável via `.env` (padrão: 30 minutos)
- **Detecção de Atividade:** Click, scroll, teclado, mouse move
- **Verificação:** A cada 1 minuto
- **Logout Automático:** Após inatividade configurada

### Fluxo de Dados (Realtime)

```
useSupabaseData Hook
  ↓
Supabase Client
  ↓
PostgreSQL + Realtime
  ↓
Atualização Automática na UI
```

---

## 🔒 Segurança

### Medidas Implementadas

✅ **Row Level Security (RLS)** habilitado em todas as tabelas  
✅ **CORS** configurado no Supabase  
✅ **Validação** de variáveis de ambiente no startup  
✅ **Secrets** gerenciados pelo GitHub Actions  
✅ **Proteção de rotas** com ProtectedRoute  
✅ **Sanitização** de inputs  
✅ **Error Boundaries** para prevenir crashes  
✅ **Timeout de sessão** configurável  
✅ **Limpeza** de cache ao fazer logout

### Práticas Recomendadas

- ⚠️ **Nunca** commite o arquivo `.env.local`
- ⚠️ Mantenha as dependências atualizadas
- ⚠️ Configure backups regulares do banco
- ⚠️ Use HTTPS em produção
- ⚠️ Implemente rate limiting para APIs públicas

---

## 🚀 Deploy

### GitHub Pages (Automático)

O projeto está configurado com GitHub Actions para deploy automático:

1. **Configure os secrets no GitHub:**
   - `Settings > Secrets and variables > Actions`
   - Adicione: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

2. **Push para branch `main`:**
   ```bash
   git push origin main
   ```

3. **Deploy automático:**
   - GitHub Actions executa build
   - Publica no GitHub Pages
   - Acesse: `https://seu-usuario.github.io/Agenda-Transfer`

### Deploy Manual

```bash
# Build de produção
npm run build

# Deploy para seu servidor
# Copie o conteúdo da pasta dist/ para seu servidor web
```

### Vercel

O deploy na Vercel é o método recomendado para este projeto, pois ele suporta os endpoints de API serverless.

1.  **Conecte seu repositório do Git** com a Vercel.
2.  **Configure o projeto:**
    *   **Framework Preset:** `Vite`
    *   **Build Command:** `npm run build`
    *   **Output Directory:** `dist`
    *   **Install Command:** `npm install`
3.  **Configure as Variáveis de Ambiente:**
    *   Vá para `Settings > Environment Variables` no seu projeto Vercel.
    *   Adicione as seguintes variáveis:
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_ANON_KEY`
        *   `SUPABASE_SERVICE_KEY` (esta é a sua chave de serviço, que deve ser mantida em segredo)

4.  **Faça o deploy.**

---

## 🐛 Troubleshooting

### Problema: "Tempo Limite Excedido"

**Causa:** Aplicação demorou > 10s para carregar

**Soluções:**
1. Verifique sua conexão com a internet
2. Clique em "Recarregar Página"
3. Se persistir, clique em "Limpar Sessão e Tentar Novamente"
4. Verifique se o Supabase está online

### Problema: "Sessão Expirada"

**Causa:** Inatividade por tempo configurado (padrão: 30 minutos)

**Solução:**
- Faça login novamente
- Para aumentar o tempo: altere `VITE_SESSION_TIMEOUT` no `.env`

### Problema: Loading Infinito

**Possíveis causas:**
- Problemas no AuthContext
- Profile não encontrado no banco
- Trigger do banco não executado

**Soluções:**
1. Limpe localStorage: `localStorage.clear()`
2. Verifique se o trigger de criação de profile existe
3. Verifique logs do console do navegador
4. Force refresh: Ctrl+Shift+R (ou Cmd+Shift+R no Mac)

### Problema: Realtime não funciona

**Causa:** Realtime não habilitado no Supabase

**Solução:**
```sql
-- No Supabase SQL Editor
ALTER TABLE profiles REPLICA IDENTITY FULL;
ALTER TABLE drivers REPLICA IDENTITY FULL;
ALTER TABLE vehicles REPLICA IDENTITY FULL;
-- Repita para todas as tabelas com realtime
```

### Problema: Build falha

**Causa:** Variáveis de ambiente não definidas

**Solução:**
```bash
# Verifique se o .env.local existe e tem as variáveis corretas
cat .env.local

# Reconstrua
rm -rf node_modules dist
npm install
npm run build
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. **Fork** o projeto
2. **Clone** seu fork:
   ```bash
   git clone https://github.com/seu-usuario/Agenda-Transfer.git
   ```
3. Crie uma **branch** para sua feature:
   ```bash
   git checkout -b feature/MinhaFeature
   ```
4. **Commit** suas mudanças:
   ```bash
   git commit -m 'feat: adiciona nova funcionalidade'
   ```
5. **Push** para a branch:
   ```bash
   git push origin feature/MinhaFeature
   ```
6. Abra um **Pull Request**

### Convenção de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração de código
- `test:` Testes
- `chore:` Manutenção

### Diretrizes

- ✅ Mantenha o código limpo e bem documentado
- ✅ Siga os padrões de código existentes (ESLint)
- ✅ Adicione testes para novas funcionalidades
- ✅ Atualize a documentação conforme necessário
- ✅ Respeite o código de conduta

---

## 📊 Performance

### Métricas Alvo

- ⚡ Tempo de carregamento < 3 segundos
- ⚡ Score Lighthouse > 90
- ⚡ First Contentful Paint < 1.5s
- ⚡ Time to Interactive < 3.5s

### Otimizações Implementadas

✅ **Build otimizado** com Vite  
✅ **Code splitting** automático  
✅ **Lazy loading** de componentes  
✅ **Debounce** em buscas  
✅ **Prevenção** de requisições duplicadas  
✅ **Cache** de dados com Supabase  

---

## 📈 Roadmap

### Em Desenvolvimento
- [ ] Validação avançada com Yup
- [ ] Testes automatizados (Jest + React Testing Library)
- [ ] Paginação em listagens
- [ ] Sistema de logs profissional
- [ ] Monitoramento com Sentry

### Próximas Funcionalidades
- [ ] Notificações por email
- [ ] Integração WhatsApp Business
- [ ] App mobile PWA
- [ ] Dashboard de relatórios avançados
- [ ] Sistema de avaliações e feedback
- [ ] Integração com gateways de pagamento
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Integração com calendários externos (Google Calendar)

---

## 👥 Autor

**Maintainer:** [@meuphilim](https://github.com/meuphilim)

**Desenvolvido para:** Bonito Ecoexpedições

---

## 🙏 Agradecimentos

- Equipe Bonito Ecoexpedições pela inspiração
- Comunidade React por ferramentas incríveis
- Supabase por excelente backend-as-a-service
- Todos os contribuidores open source

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/meuphilim/Agenda-Transfer/issues)
- **Documentação:** Este README
- **Supabase Docs:** [docs.supabase.com](https://docs.supabase.com)

---

## 📊 Status do Projeto

![Build Status](https://img.shields.io/github/actions/workflow/status/meuphilim/Agenda-Transfer/ci.yml?branch=main)
![Last Commit](https://img.shields.io/github/last-commit/meuphilim/Agenda-Transfer)
![Issues](https://img.shields.io/github/issues/meuphilim/Agenda-Transfer)
![Pull Requests](https://img.shields.io/github/issues-pr/meuphilim/Agenda-Transfer)

---

<div align="center">
  <p>Feito com ❤️ para simplificar a gestão de turismo</p>
  <p>⭐ Se este projeto te ajudou, considere dar uma estrela!</p>
</div>
