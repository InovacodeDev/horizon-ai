# App Directory

Estrutura de rotas do Next.js 16 usando App Router.

## Estrutura

### (app)/ - Rotas Protegidas

Rotas que requerem autenticação. Inclui:

- **accounts/** - Gerenciamento de contas bancárias
- **analytics/** - Dashboard de análises financeiras
- **categories/** - Gerenciamento de categorias de transações
- **credit/** - Gestão de crédito e score
- **credit-card-bills/** - Faturas de cartões de crédito
- **invoices/** - Notas fiscais (NFe)
- **transactions/** - Listagem e gerenciamento de transações
- **overview/** - Dashboard principal
- **settings/** - Configurações do usuário
- E outras features...

### (auth)/ - Rotas Públicas

Rotas de autenticação acessíveis sem login:

- **login/** - Página de login
- **register/** - Página de registro

### api/ - API Routes

Endpoints REST para operações específicas:

- **accounts/** - CRUD de contas
- **auth/** - Autenticação e sessão
- **credit-cards/** - CRUD de cartões
- **transactions/** - CRUD de transações
- **invoices/** - Upload e processamento de NFe
- **sharing/** - Compartilhamento de contas

### Arquivos Raiz

- **layout.tsx** - Layout global da aplicação
- **page.tsx** - Página inicial (redireciona para /overview ou /login)
- **globals.css** - Estilos globais com Tailwind CSS

## Convenções

- Pastas entre parênteses `(nome)` são route groups (não afetam a URL)
- `layout.tsx` define layouts compartilhados
- `page.tsx` define a UI da rota
- `loading.tsx` define estados de carregamento
- `error.tsx` define páginas de erro
