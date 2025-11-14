# Tests

Testes automatizados da aplicação.

## Estrutura

### Testes de Fluxo

- **auth-flow.test.ts** - Fluxo completo de autenticação
- **accounts-crud.test.ts** - CRUD de contas
- **transactions-crud.test.ts** - CRUD de transações
- **credit-cards-crud.test.ts** - CRUD de cartões

### Testes de Serviços

- **analytics-service.test.ts** - Serviço de analytics
- **invoice-service.test.ts** - Serviço de notas fiscais
- **import-service.test.ts** - Serviço de importação
- **price-tracking-service.test.ts** - Tracking de preços

### Testes de API

- **analytics-api.test.ts** - Endpoints de analytics
- **invoice-api.test.ts** - Endpoints de NFe
- **import-api.test.ts** - Endpoints de importação
- **price-tracking-api.test.ts** - Endpoints de preços

### Testes de Parsers

- **csv-parser.test.ts** - Parser de CSV
- **ofx-parser.test.ts** - Parser de OFX
- **pdf-parser.test.ts** - Parser de PDF
- **invoice-parser.test.ts** - Parser de NFe

### Testes de Compartilhamento

- **sharing-data-access.test.ts** - Acesso a dados compartilhados
- **sharing-invitation-flow.test.ts** - Fluxo de convites
- **sharing-permissions.test.ts** - Permissões
- **sharing-termination.test.ts** - Término de compartilhamento

### Testes de Componentes

- **import-components.test.ts** - Componentes de importação
- **import-accessibility.test.ts** - Acessibilidade
- **price-comparison-ui.test.ts** - UI de comparação

### Testes de Integração

- **import-integration.test.ts** - Integração de importação
- **nfe-crawler-integration.test.ts** - Crawler de NFe
- **invoice-navigation-integration.test.ts** - Navegação de NFe

### Outros

- **run-all-tests.ts** - Script para executar todos os testes
- **toon-usage.example.ts** - Exemplo de uso do formato TOON

## Executar Testes

```bash
# Todos os testes
pnpm test

# Testes específicos
pnpm test:auth
pnpm test:accounts
pnpm test:transactions
pnpm test:credit-cards
pnpm test:nfe-crawler
```

## Convenções

- Use nomes descritivos para testes
- Organize testes por funcionalidade
- Limpe dados de teste após execução
- Use mocks para serviços externos
