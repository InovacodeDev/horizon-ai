# Lib

Lógica de negócio, utilitários e configurações da aplicação.

## Estrutura

### appwrite/

Cliente e configurações do Appwrite:

- **client.ts** - Cliente Appwrite para servidor
- **client-browser.ts** - Cliente Appwrite para browser
- **database.ts** - Helpers de database
- **adapter.ts** - Adapter para operações de DB
- **schema.ts** - Schema das collections
- **validation.ts** - Validações de dados

### auth/

Sistema de autenticação:

- **jwt.ts** - Geração e validação de JWT
- **session.ts** - Gerenciamento de sessões
- **middleware.ts** - Middleware de autenticação
- **sharing-permissions.ts** - Permissões de compartilhamento

### config/

Configurações da aplicação:

- **index.ts** - Configurações gerais
- **validate-env.ts** - Validação de variáveis de ambiente

### constants/

Constantes da aplicação:

- **categories.ts** - Categorias de transações

### contexts/

React Contexts:

- **UserContext.tsx** - Context de usuário
- **ThemeContext.tsx** - Context de tema

### database/

Migrações e schema do banco:

- **migrations/** - Scripts de migração do banco

### services/

Serviços de negócio:

- **account.service.ts** - Lógica de contas
- **transaction.service.ts** - Lógica de transações
- **credit-card.service.ts** - Lógica de cartões
- **invoice.service.ts** - Lógica de notas fiscais
- **balance-sync.service.ts** - Sincronização de saldos
- **import.service.ts** - Importação de transações
- **export.service.ts** - Exportação de dados
- E outros serviços...

### types/

Definições de tipos TypeScript:

- **index.ts** - Tipos principais
- **credit-card.types.ts** - Tipos de cartões
- **import.types.ts** - Tipos de importação
- **sharing.types.ts** - Tipos de compartilhamento

### utils/

Utilitários gerais:

- **cache.ts** - Sistema de cache
- **timezone.ts** - Helpers de timezone
- **toon.ts** - Formatação TOON para AI
- **temp-file-manager.ts** - Gerenciamento de arquivos temporários
- **rate-limiter.ts** - Rate limiting
- **audit-logger.ts** - Logs de auditoria
