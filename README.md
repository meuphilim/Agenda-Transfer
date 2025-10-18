# 🚀 TourManager - Sistema de Gestão de Turismo

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.6-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-green.svg)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-cyan.svg)](https://tailwindcss.com/)

Sistema profissional de gestão para turismo receptivo, desenvolvido com React, TypeScript e Supabase. Gerencia agências, motoristas, veículos, pacotes turísticos e agendas de forma eficiente e segura.

---

## 📋 Índice
 
- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Licença](#-licença)

---

## 🎯 Sobre o Projeto

**TourManager** (anteriormente Agenda Transfer) é uma aplicação web moderna para gestão completa de operações de turismo receptivo. O sistema foi projetado para ser robusto, seguro e fácil de usar.

### 🌟 Diferenciais

- ✅ **Interface Responsiva e Moderna:** Layout adaptável para desktop e mobile, com uma barra lateral animada que melhora a experiência do usuário.
- ✅ **Backend com Supabase:** Utiliza o poder do Supabase para autenticação, banco de dados PostgreSQL e atualizações em tempo real.
- ✅ **Segurança:** Implementa Row Level Security (RLS) e separação de responsabilidades entre frontend e backend.
- ✅ **Qualidade de Código:** Desenvolvido com TypeScript e boas práticas, com verificações de lint e tipo.

---

## ⚡ Funcionalidades Principais

- **Gestão Completa:** CRUD para Agências, Motoristas, Veículos, Atrações e Pacotes.
- **Autenticação Segura:** Sistema de login com gerenciamento de sessão e perfis de usuário (Admin/User).
- **Aprovação de Usuários:** Novos usuários ficam com status "pendente" até serem aprovados por um administrador.
- **Dashboard Intuitivo:** Visão geral com as informações mais importantes do sistema.
- **Interface Responsiva:**
    - **Desktop:** Barra lateral expansível ao passar o mouse.
    - **Mobile:** Menu hambúrguer com painel lateral deslizante.

---

## 🛠️ Tecnologias

| Tecnologia | Descrição |
|------------|-----------|
| [React](https://react.dev/) | Biblioteca JavaScript para construção de interfaces. |
| [TypeScript](https://www.typescriptlang.org/) | Superset de JavaScript com tipagem estática. |
| [Vite](https://vitejs.dev/) | Ferramenta de build moderna e ultra-rápida. |
| [React Router](https://reactrouter.com/) | Para roteamento de páginas no lado do cliente. |
| [Tailwind CSS](https://tailwindcss.com/) | Framework CSS para estilização rápida e utilitária. |
| [Supabase](https://supabase.com/) | Plataforma de Backend-as-a-Service com PostgreSQL. |
| [Framer Motion](https://www.framer.com/motion/) | Biblioteca para animações complexas em React. |
| **Lucide React** | Biblioteca de ícones SVG leve e customizável. |
| **React Hook Form** | Gerenciamento de formulários. |
| **ESLint** | Ferramenta de linting para manter a qualidade do código. |

---

## 📋 Pré-requisitos

- **Node.js** (versão 18 ou superior)
- **npm** (versão 9 ou superior)
- **Git**

---

## 🚀 Instalação e Execução

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/TourManager.git
cd TourManager
```

### 2. Instale as dependências
Execute o comando na raiz do projeto:
```bash
npm install
```

### 3. Configure as Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto e adicione as seguintes variáveis com suas credenciais do Supabase:

```env
# URL do seu projeto Supabase
VITE_SUPABASE_URL=https://<seu-projeto>.supabase.co

# Chave anônima (pública) do seu projeto Supabase
VITE_SUPABASE_ANON_KEY=<sua-chave-anon>
```
*Estas credenciais podem ser encontradas em `Project Settings > API` no seu painel do Supabase.*

### 4. Execute o projeto
```bash
npm run dev
```
A aplicação estará disponível em **http://localhost:5173**.

---

## 📜 Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento.
- `npm run build`: Gera a build de produção na pasta `dist/`.
- `npm run lint`: Executa o ESLint para analisar o código.
- `npm run typecheck`: Verifica os tipos do TypeScript sem gerar build.
- `npm run check`: Executa `lint` e `typecheck` em sequência.
- `npm run preview`: Inicia um servidor local para visualizar a build de produção.

---

## 📁 Estrutura do Projeto

A estrutura de pastas principal é organizada da seguinte forma:

```
/
├── api/                  # Funções serverless (backend)
├── public/               # Arquivos estáticos
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   └── Layout/
│   │       ├── Sidebar.tsx
│   │       └── SidebarComponents.tsx  # Lógica da sidebar animada
│   ├── contexts/         # Contextos React (ex: AuthContext)
│   ├── hooks/            # Hooks customizados
│   ├── lib/              # Funções utilitárias e configuração de clientes
│   ├── pages/            # Componentes de página (rotas)
│   ├── services/         # Lógica de comunicação com APIs
│   └── types/            # Definições de tipos do TypeScript
├── .env.example          # Exemplo de variáveis de ambiente
├── eslint.config.js      # Configuração do ESLint
├── package.json          # Dependências e scripts
├── tailwind.config.js    # Configuração do Tailwind CSS
└── tsconfig.json         # Configuração do TypeScript
```

---

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.