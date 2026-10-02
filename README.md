# ChromeWear - E-commerce Full-Stack (Next.js + Prisma + MySQL)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma_ORM-6-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![MySQL](https://img.shields.io/badge/MySQL-8-00758F?style=for-the-badge&logo=mysql)](https://www.mysql.com/)

---

## 📌 Sobre o Projeto

O **ChromeWear** é uma aplicação web moderna de e-commerce completa, voltada para marcas de streetwear e moda urbana contemporânea. O projeto foi arquitetado do zero a partir da referência visual de alta fidelidade fornecida em HTML, estruturado em uma arquitetura limpa, escalável e otimizada para deploy em produção (incluindo suporte nativo a hospedagens Node.js na **Hostinger**).

### ✨ Funcionalidades Principais
- 🛍️ **Catálogo de Produtos Responsivo**: Filtros por categorias (Jaquetas, Camisetas, Calças, Acessórios, Calçados), busca em tempo real e ordenação.
- 🎨 **Fidelidade Visual Rigorosa**: Tipografia (*Hanken Grotesk* e *Cinzel*), paleta de cores personalizada via Tailwind CSS, layouts responsivos (mobile, tablet, desktop).
- 🛒 **Sacola de Compras Interativa (Cart Drawer)**: Adição/remoção de itens, seleção de tamanhos, ajuste de quantidades e cálculo dinâmico de totais.
- 📱 **Checkout Direto via WhatsApp**: Geração automática de link `wa.me` com o resumo formatado do pedido para fechamento direto com o vendedor.
- 🔍 **Barra de Pesquisa Dinâmica**: Filtro em tempo real de produtos por nome e descrição.
- 👤 **Autenticação de Usuários**: Modais interativos para Login e Cadastro de Clientes com validação e armazenamento seguro de senhas (Bcrypt).
- 🗄️ **Infraestrutura Pronta com Prisma ORM + MySQL**: Modelos para Usuários, Categorias, Produtos e Pedidos com rotas de API REST organizadas.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: Next.js (App Router), React 19, TypeScript, Tailwind CSS.
- **Backend / API**: Next.js Route Handlers (`app/api/`), Node.js.
- **Banco de Dados**: MySQL gerenciado via Prisma ORM.
- **Segurança**: Hashing de senhas com `bcryptjs`.
- **Utilitários**: `clsx`, `tailwind-merge`.

---

## 📂 Estrutura do Projeto

```text
ChromeWear/
├── app/
│   ├── api/                  # API Routes (products, categories, auth, orders)
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── categories/
│   │   ├── orders/
│   │   └── products/
│   ├── globals.css           # Estilos globais e utilitários Tailwind
│   ├── layout.tsx            # Root Layout com fontes Google e Metadados SEO
│   └── page.tsx              # Página principal (Single Page / Catalog application)
│
├── components/
│   ├── ui/                   # Componentes base reutilizáveis (Button, Input, Modal)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Modal.tsx
│   ├── AccountModal.tsx      # Modal de Login / Registro / Perfil
│   ├── CartDrawer.tsx        # Drawer lateral da sacola de compras
│   ├── Footer.tsx            # Rodapé institucional
│   ├── Header.tsx            # Cabeçalho com navegação, busca e sacola
│   ├── HeroBanner.tsx        # Banner principal com chamada para coleção
│   ├── InfoModal.tsx         # Modal de Informações (Sobre / Contato)
│   ├── ProductCard.tsx       # Card de produto com badges e preço
│   ├── ProductDetailModal.tsx# Modal de detalhes do produto (Tamanhos e Qtd)
│   ├── ProductGrid.tsx       # Grid responsivo de produtos com abas de categoria
│   └── SearchBar.tsx         # Barra de pesquisa retrátil
│
├── lib/
│   ├── prisma.ts             # Instância Singleton do Prisma Client
│   └── utils.ts              # Funções utilitárias (formatação BRL, links WhatsApp)
│
├── prisma/
│   ├── schema.prisma         # Esquema de modelos MySQL (User, Category, Product, Order)
│   └── seed.js               # Script de povoamento inicial de dados
│
├── public/
│   └── images/               # Ativos estáticos e imagens dos produtos (logo, hero)
│
├── types/
│   └── index.ts              # Definições de tipos TypeScript
│
├── .env.example              # Modelo de variáveis de ambiente
├── next.config.ts            # Configurações do Next.js
├── package.json              # Dependências e scripts de execução
├── tailwind.config.ts        # Tema e paleta de cores estendida do Tailwind
└── tsconfig.json             # Configuração TypeScript
```

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
- **Node.js**: `v18.x` ou superior (recomendado `v20` ou `v22`).
- **NPM**: `v9.x` ou superior.
- **MySQL**: (opcional para desenvolvimento local - a aplicação possui fallback Gracioso com mock data integrado).

### 2. Clonar e Instalar Dependências
```bash
git clone https://github.com/seu-usuario/chromewear.git
cd ChromeWear
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie o arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
DATABASE_URL="mysql://root:senha@localhost:3306/chromewear"
JWT_SECRET="chromewear-secret-key-development"
NEXT_PUBLIC_WHATSAPP_NUMBER="5511999999999"
```

### 4. Executar Migrações e Seed do Prisma (Com MySQL ativo)
```bash
# Sincronizar o schema com o banco de dados MySQL
npx prisma db push

# Executar o seed para popular produtos e categorias iniciais
npx prisma db seed
```

### 5. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: `http://localhost:3000`

---

## 📦 Build para Produção

Para testar a compilação de produção localmente:
```bash
# Gerar o cliente Prisma e compilar a aplicação Next.js
npm run build

# Iniciar o servidor em modo de produção
npm run start
```

---

## 🌐 Guia de Deploy na Hostinger (Hospedagem Node.js / VPS)

A **Hostinger** oferece suporte a aplicações Node.js / Next.js tanto em planos de hospedagem com suporte a Node.js (via Gerenciador de Aplicações Node.js / hPanel) quanto em VPS (Virtual Private Server).

### Opção A: Deploy via Hostinger Node.js Application / hPanel

1. **Criar Banco de Dados MySQL na Hostinger**:
   - Acesse o painel da Hostinger (**hPanel**).
   - Vá em **Bancos de Dados MySQL** -> **Criar novo Banco de Dados e Usuário**.
   - Anote o *Nome do Banco*, *Usuário*, *Senha* e o *Host* (normalmente `localhost`).

2. **Conectar repositório GitHub**:
   - Vá para **Avançado** -> **Git** no hPanel.
   - Conecte o repositório do seu projeto ChromeWear no GitHub.
   - Realize o `Deploy` dos arquivos para a pasta pública da aplicação.

3. **Configurar Variáveis de Ambiente no hPanel**:
   - Adicione no arquivo `.env` do servidor:
     ```env
     DATABASE_URL="mysql://usuario_hostinger:senha_hostinger@localhost:3306/banco_hostinger"
     JWT_SECRET="sua-chave-secreta-de-producao"
     NEXT_PUBLIC_WHATSAPP_NUMBER="5511999999999"
     ```

4. **Executar Build e Migrações via Terminal SSH / hPanel**:
   Acesse via SSH ou Terminal do hPanel:
   ```bash
   npm install
   npx prisma db push
   npx prisma db seed
   npm run build
   ```

5. **Iniciar a Aplicação**:
   - No Gerenciador de Aplicações Node.js do hPanel, defina:
     - **Node.js Version**: `18.x` ou `20.x`
     - **Application Root**: `/`
     - **Application Startup File**: `node_modules/next/dist/bin/next` (ou comando `start` `npm run start`).

---

### Opção B: Deploy em Hostinger VPS (Ubuntu com PM2 e Nginx)

1. **Acessar a VPS via SSH**:
   ```bash
   ssh root@ip_da_sua_vps
   ```

2. **Instalar Node.js, PM2, Git e MySQL**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs mysql-server git nginx
   sudo npm install -g pm2
   ```

3. **Clonar o Repositório e Configurar**:
   ```bash
   git clone https://github.com/seu-usuario/chromewear.git /var/www/chromewear
   cd /var/www/chromewear
   npm install
   cp .env.example .env
   # Edite o arquivo .env com suas credenciais do MySQL
   ```

4. **Executar Migrações e Build**:
   ```bash
   npx prisma db push
   npx prisma db seed
   npm run build
   ```

5. **Iniciar com PM2**:
   ```bash
   pm2 start npm --name "chromewear" -- start
   pm2 save
   pm2 startup
   ```

6. **Configurar o Nginx como Proxy Reverso para a porta 3000**:
   ```nginx
   server {
       listen 80;
       server_name seudominio.com.br www.seudominio.com.br;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Reinicie o Nginx: `sudo systemctl restart nginx`.

---

## 📝 Licença

Este projeto foi desenvolvido como aplicação de referência profissional de e-commerce.
Sinta-se à vontade para utilizar e estender o código!
