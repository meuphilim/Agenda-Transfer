# 🚀 Agenda-Transfer - Sistema de Gestão para Turismo Receptivo

[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.6-purple?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-cyan?logo=tailwindcss)](https://tailwindcss.com/)
[![Licença](https://img.shields.io/badge/Licença-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Agenda-Transfer** é uma aplicação web robusta, desenhada como um sistema ERP para otimizar a gestão logística e financeira de empresas de turismo receptivo. A plataforma centraliza o controle de agências, motoristas, veículos e pacotes turísticos, oferecendo uma solução segura e eficiente para agendar, executar e faturar todas as operações.

---

## 📋 Índice
 
- [🎯 Sobre o Projeto](#-sobre-o-projeto)
- [⚡ Funcionalidades Principais](#-funcionalidades-principais)
- [🛠️ Tecnologias](#-tecnologias)
- [📋 Pré-requisitos](#-pré-requisitos)
- [🚀 Instalação e Execução](#-instalação-e-execução)
- [📜 Scripts Disponíveis](#-scripts-disponíveis)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [📊 Status do Projeto](#-status-do-projeto)
- [📄 Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **Agenda-Transfer** foi arquitetado para resolver os desafios logísticos e financeiros de agências de turismo, substituindo planilhas e processos manuais por uma solução centralizada e em tempo real. A plataforma permite um gerenciamento completo do ciclo de vida de um pacote turístico, desde o agendamento inicial até o fechamento financeiro.

### 🌟 Diferenciais Técnicos

- **Interface Reativa e Responsiva:** Construído com React e Tailwind CSS, o sistema oferece uma experiência de usuário fluida e adaptável a desktops e dispositivos móveis, seguindo uma abordagem *mobile-first*.
- **Backend Robusto com Supabase:** Utiliza o Supabase para autenticação, banco de dados PostgreSQL com real-time, e segurança de dados via Row Level Security (RLS). A lógica de negócio complexa é encapsulada em **Funções RPC PostgreSQL**, garantindo transações atômicas e performance.
- **Arquitetura Segura:** Operações sensíveis, como o gerenciamento de usuários e a lógica de faturamento, são tratadas no backend para garantir que chaves de serviço e regras de negócio críticas não sejam expostas no frontend.
- **Código de Alta Qualidade:** Desenvolvido com TypeScript para garantir tipagem estática e robustez. O projeto segue boas práticas de engenharia de software, com verificações de qualidade via ESLint e testes automatizados.

---

## ⚡ Funcionalidades

### Gestão Operacional
- **CRUD Completo:** Gerenciamento de Agências, Motoristas, Veículos, Atrações e Pacotes Turísticos.
- **Agenda Inteligente:** Visualização de agendamentos com validação de conflitos de disponibilidade para motoristas e veículos, evitando sobreposições.
- **Dashboard Central:** Painel com métricas em tempo real e uma lista detalhada das atividades do dia com status dinâmico (Aguardando, Em andamento, Concluída), calculado com base no fuso horário (`America/Campo_Grande`).
- **Roteirização e Mensagens:** Geração de roteiro diário para motoristas com envio simplificado via WhatsApp.

### Módulo Financeiro
- **Gestão de Faturamento:** Relatórios detalhados por pacote, com cálculo de custos (diárias de motoristas, valores NET de atrações) e receita.
- **Fechamento por Agência:** Geração de extratos de faturamento para agências parceiras.
- **Controle de Pagamentos:** Módulo para gerenciar pagamentos de motoristas e despesas de veículos.
- **Venda Direta:** Suporte a pacotes sem vínculo com agências, tratados como uma categoria financeira distinta.

### Portal da Agência
- **Acesso Restrito:** Agências parceiras podem acessar um portal exclusivo para gerenciar suas próprias reservas.
- **Self-Service:** As agências podem criar, visualizar e gerenciar pacotes, com a lógica de negócio garantindo que elas só acessem seus próprios dados.

### Segurança e Acesso
- **Autenticação e Autorização:** Sistema de login seguro com perfis de usuário (Administrador e Colaborador).
- **Aprovação de Usuários:** Novos colaboradores cadastrados precisam ser ativados por um administrador.
- **Rotas Protegidas:** O acesso às páginas internas do sistema é protegido e requer autenticação.

---

## 🛠️ Tech Stack

O projeto utiliza um conjunto de tecnologias modernas para garantir performance, escalabilidade e qualidade de código.

### Frontend
| Tecnologia | Descrição |
| :--- | :--- |
| **React** | Biblioteca principal para a construção da interface de usuário. |
| **TypeScript** | Garante a tipagem estática e a robustez do código. |
| **Vite** | Ferramenta de build moderna e de alta performance para o desenvolvimento. |
| **React Router** | Biblioteca para gerenciamento de rotas no lado do cliente. |
| **Tailwind CSS** | Framework CSS utilitário para estilização rápida e responsiva. |
| **React Hook Form**| Gerenciamento de formulários com validação via `Yup`. |
| **Headless UI** | Componentes de UI acessíveis e não estilizados. |
| **Framer Motion**| Biblioteca para criação de animações fluidas. |
| **Lucide React** | Conjunto de ícones SVG leves e customizáveis. |

### Backend
| Tecnologia | Descrição |
| :--- | :--- |
| **Supabase** | Plataforma BaaS (Backend-as-a-Service) que provê: |
| &nbsp;&nbsp;&nbsp;↳ **PostgreSQL** | Banco de dados relacional com suporte a real-time. |
| &nbsp;&nbsp;&nbsp;↳ **Auth** | Gerenciamento de autenticação e autorização. |
| &nbsp;&nbsp;&nbsp;↳ **Storage** | Armazenamento de arquivos (não utilizado atualmente). |
| &nbsp;&nbsp;&nbsp;↳ **Edge Functions** | Funções serverless (não utilizado atualmente). |

### Testes e Qualidade de Código
| Tecnologia | Descrição |
| :--- | :--- |
| **Vitest** | Framework de testes unitários e de integração. |
| **React Testing Library** | Utilitários para testar componentes React. |
| **Playwright** | Ferramenta para testes E2E (End-to-End) e de regressão visual. |
| **ESLint** | Ferramenta para análise estática de código e padronização. |

---

## 🏛️ Arquitetura do Backend com Supabase

A arquitetura do backend é construída inteiramente sobre os serviços do Supabase, explorando seus recursos nativos para garantir segurança, performance e escalabilidade.

- **Banco de Dados PostgreSQL**: O schema do banco de dados, localizado em `supabase/migrations/`, é a fonte da verdade para a estrutura de dados. Ele inclui tabelas, tipos customizados e índices para otimização de consultas.

- **Row Level Security (RLS)**: Todas as tabelas críticas possuem políticas de RLS ativadas. Isso garante que um usuário autenticado só possa acessar ou modificar os dados que lhe são permitidos, aplicando a lógica de segurança diretamente no nível do banco de dados.

- **Funções RPC (Remote Procedure Call)**: Para operações complexas ou que exigem transações atômicas (como criar um pacote e suas atividades simultaneamente), utilizamos funções PostgreSQL. Elas são expostas como endpoints de API seguros, permitindo que o frontend execute lógicas de negócio complexas com uma única chamada, reduzindo a latência e garantindo a integridade dos dados.

- **Database Triggers**: Gatilhos são usados para automações. Um exemplo notável é o trigger `on_auth_user_created`, que, após a criação de um usuário no serviço de autenticação do Supabase, dispara a função `handle_new_user` para criar um perfil correspondente na tabela `public.profiles`, mantendo os dados sincronizados.

- **Autenticação**: O serviço de Auth do Supabase gerencia todo o ciclo de vida do usuário, desde o cadastro até o login, utilizando JWT (JSON Web Tokens) para proteger as rotas da aplicação.

## 📋 Pré-requisitos

Para executar o projeto localmente, você precisará ter as seguintes ferramentas instaladas:

- **Node.js**: `v18.0.0` ou superior
- **npm**: `v9.0.0` ou superior
- **Git**: Para clonar o repositório

---

## 🚀 Instalação e Execução

Siga os passos abaixo para configurar e executar o ambiente de desenvolvimento:

**1. Clone o repositório**
```bash
git clone https://github.com/seu-usuario/TourManager.git
cd TourManager
```

**2. Instale as dependências**
```bash
npm install
```

**3. Configure as Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto, utilizando o `.env.example` como referência.
```bash
cp .env.example .env
```
Em seguida, preencha o arquivo `.env` com suas credenciais do Supabase:
```env
# URL do seu projeto Supabase
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"

# Chave anônima (pública) do seu projeto Supabase
VITE_SUPABASE_ANON_KEY="sua-chave-publica-anon"
```
> **Onde encontrar as credenciais?**
> Você pode obter a `URL` e a `ANON_KEY` no painel do seu projeto Supabase, em **Project Settings > API**.

**4. Execute o projeto**
```bash
npm run dev
```
A aplicação estará disponível em **http://localhost:5173**.

---

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento com Hot Reload.
- `npm run build`: Gera a build de produção otimizada na pasta `dist/`.
- `npm run lint`: Executa o ESLint para identificar problemas de formatação e estilo.
- `npm run typecheck`: Realiza a verificação de tipos do TypeScript em todo o projeto.
- `npm run check`: Executa os scripts `lint` e `typecheck` em sequência.
- `npm test`: Executa os testes unitários com Vitest.
- `npm run preview`: Inicia um servidor local para visualizar a build de produção.

### 🧪 Testes

O projeto conta com duas suítes de testes para garantir a qualidade do código:

**1. Testes Unitários e de Integração (Vitest)**

Para executar os testes que validam componentes e funções de forma isolada:
```bash
npm test
```

**2. Testes End-to-End e de Regressão Visual (Playwright)**

Esses testes simulam a interação do usuário no navegador e comparam screenshots para detectar mudanças visuais inesperadas.

Primeiro, certifique-se de que o servidor de desenvolvimento está rodando:
```bash
npm run dev
```

Em seguida, em outro terminal, execute a suíte de testes do Playwright:
```bash
npx playwright test
```
> **Nota:** Na primeira vez que executar o Playwright, pode ser necessário instalar os navegadores com o comando: `npx playwright install`

---

## 📁 Estrutura do Projeto

A estrutura de diretórios foi organizada para separar responsabilidades e facilitar a manutenção, seguindo as melhores práticas de desenvolvimento com React e TypeScript.

```
agenda-transfer/
├── supabase/           # Configurações e migrações do banco de dados Supabase
├── tests/              # Testes E2E e de regressão visual com Playwright
├── public/             # Arquivos estáticos (ícones, imagens)
├── src/
│   ├── components/     # Componentes React reutilizáveis (Common/, Layout/, Auth/)
│   ├── contexts/       # Contextos da aplicação (ex: AuthContext)
│   ├── hooks/          # Hooks customizados (ex: useAuth)
│   ├── lib/            # Configuração de clientes (Supabase)
│   ├── pages/          # Componentes que representam as páginas da aplicação
│   ├── services/       # Lógica de comunicação com a API (ex: financeApi, availabilityService)
│   ├── types/          # Definições de tipos TypeScript
│   ├── utils/          # Funções utilitárias (ex: formatação de data, timezone)
│   ├── validators/     # Schemas de validação com Yup
│   ├── App.tsx         # Componente raiz da aplicação
│   └── main.tsx        # Ponto de entrada da aplicação
├── .env.example        # Arquivo de exemplo para variáveis de ambiente
├── playwright.config.ts# Configurações do Playwright
├── tailwind.config.js  # Configurações do Tailwind CSS
└── vite.config.ts      # Configurações do Vite e Vitest
```

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.
