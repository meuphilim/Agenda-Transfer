# 🚀 TourManager - Sistema de Gestão para Turismo Receptivo

[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.3.6-purple?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-2.58.0-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-cyan?logo=tailwindcss)](https://tailwindcss.com/)
[![Licença](https://img.shields.io/badge/Licença-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**TourManager** é uma aplicação web completa e robusta, projetada para otimizar a gestão de empresas de turismo receptivo. O sistema centraliza o controle de agências, motoristas, veículos e pacotes turísticos, oferecendo uma plataforma segura e eficiente para agendar e acompanhar todas as operações do dia a dia.

---

## 📋 Índice
 
- [🎯 Sobre o Projeto](#-sobre-o-projeto)
- [⚡ Funcionalidades Principais](#-funcionalidades-principais)
- [🛠️ Tecnologias](#-tecnologias)
- [📋 Pré-requisitos](#-pré-requisitos)
- [🚀 Instalação e Execução](#-instalação-e-execução)
- [📜 Scripts Disponíveis](#-scripts-disponíveis)
- [📁 Estrutura do Projeto](#-estrutura-do-projeto)
- [📄 Licença](#-licença)

---

## 🎯 Sobre o Projeto

O **TourManager** foi desenvolvido para resolver os desafios logísticos de agências de turismo, substituindo planilhas e processos manuais por uma solução integrada. A plataforma permite um gerenciamento claro e em tempo real de todas as atividades, desde o cadastro de um novo pacote até a conclusão de um serviço.

### 🌟 Diferenciais

- **Interface Moderna e Responsiva:** Construído com React e Tailwind CSS, o sistema oferece uma experiência de usuário fluida tanto em desktops quanto em dispositivos móveis.
- **Backend Poderoso com Supabase:** Utiliza o Supabase para autenticação, banco de dados PostgreSQL em tempo real e segurança de dados com Row Level Security (RLS).
- **Arquitetura Segura:** As operações sensíveis (como gerenciamento de usuários) são tratadas por funções de backend (`api/`), garantindo que chaves de serviço não sejam expostas no frontend.
- **Qualidade de Código:** Desenvolvido com TypeScript para garantir a tipagem e a robustez do código, com verificações de qualidade via ESLint.

---

## ⚡ Funcionalidades Principais

### Gestão
- **CRUD Completo:** Gerenciamento de Agências, Motoristas, Veículos, Atrações e Pacotes Turísticos.
- **Agenda Inteligente:** Visualização de agendamentos em formato de lista ou calendário (semanal/mensal).
- **Dashboard Central:** Painel com informações rápidas sobre as operações.

### Segurança
- **Autenticação e Autorização:** Sistema de login seguro com perfis de usuário (Administrador e Usuário).
- **Aprovação de Usuários:** Novos usuários cadastrados precisam ser ativados por um administrador.
- **Rotas Protegidas:** O acesso às páginas do sistema é protegido e requer autenticação.

### Experiência do Usuário (UX)
- **Design Responsivo:** Layout adaptado para desktop e mobile, com componentes reutilizáveis.
- **Interface Intuitiva:** Navegação clara com barra lateral animada em desktop e menu hambúrguer em mobile.
- **Feedback ao Usuário:** Notificações (toasts) para ações como sucesso e erro.

---

## 🛠️ Tecnologias

A tabela a seguir lista as principais tecnologias utilizadas no desenvolvimento do TourManager:

| Tecnologia | Versão | Descrição |
| :--- | :--- | :--- |
| **React** | `18.3.1` | Biblioteca principal para a construção da interface de usuário. |
| **TypeScript** | `5.5.3` | Garante a tipagem estática e a qualidade do código. |
| **Vite** | `6.3.6` | Ferramenta de build moderna e de alta performance. |
| **Supabase** | `2.58.0` | Plataforma de Backend-as-a-Service para banco de dados e autenticação. |
| **React Router** | `7.9.3` | Biblioteca para gerenciamento de rotas no lado do cliente. |
| **Tailwind CSS** | `3.4.1` | Framework CSS utilitário para estilização rápida. |
| **Framer Motion**| `12.23.24`| Biblioteca para criação de animações fluidas. |
| **Lucide React** | `0.344.0` | Conjunto de ícones SVG leves e customizáveis. |

---

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
- `npm run preview`: Inicia um servidor local para visualizar a build de produção.

---

## 📁 Estrutura do Projeto

A estrutura de diretórios foi organizada para separar responsabilidades e facilitar a manutenção:

```
TourManager/
├── api/                # Funções serverless (backend) para operações seguras
├── public/             # Arquivos estáticos (ícones, imagens)
├── src/
│   ├── components/     # Componentes React reutilizáveis (Common/, Layout/)
│   ├── contexts/       # Contextos da aplicação (ex: AuthContext)
│   ├── hooks/          # Hooks customizados (ex: useAuth)
│   ├── lib/            # Configuração de clientes (Supabase) e utilitários
│   ├── pages/          # Componentes que representam as páginas da aplicação
│   ├── services/       # Lógica de comunicação com a API (ex: adminApi)
│   └── types/          # Definições de tipos TypeScript (enums.ts, database.types.ts)
├── .env.example        # Arquivo de exemplo para variáveis de ambiente
├── eslint.config.js    # Configurações do ESLint
├── package.json        # Dependências e scripts do projeto
└── vite.config.ts      # Configurações do Vite
```

---

## 📄 Licença

Este projeto está licenciado sob a **Licença MIT**. Consulte o arquivo [LICENSE](LICENSE) para mais detalhes.