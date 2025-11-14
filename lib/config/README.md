# Lib / Config

Configurações e validação de variáveis de ambiente.

## Arquivos

- **index.ts** - Configurações exportadas e validadas
- **validate-env.ts** - Lógica de validação de variáveis de ambiente

## Variáveis de Ambiente

### Essenciais

- `APPWRITE_ENDPOINT` - URL do Appwrite
- `APPWRITE_PROJECT_ID` - ID do projeto
- `APPWRITE_API_KEY` - API key do servidor
- `APPWRITE_DATABASE_ID` - ID do banco de dados
- `JWT_SECRET` - Secret para JWT
- `JWT_EXPIRATION` - Tempo de expiração do JWT

### Opcionais

- `NODE_ENV` - Ambiente (development/production)
- `CORS_ORIGIN` - Origem permitida para CORS
- `GOOGLE_AI_API_KEY` - API key do Google AI

## Validação

Execute para validar as variáveis:

```bash
pnpm validate:env
pnpm validate:env production
pnpm validate:env --verbose
```

## Uso

```typescript
import { config } from '@/lib/config';

const endpoint = config.appwrite.endpoint;
const jwtSecret = config.jwt.secret;
```
