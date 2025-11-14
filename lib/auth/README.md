# Lib / Auth

Sistema de autenticação e autorização da aplicação.

## Arquivos

- **index.ts** - Exports centralizados
- **jwt.ts** - Geração, validação e refresh de tokens JWT
- **session.ts** - Gerenciamento de sessões de usuário
- **middleware.ts** - Middleware de autenticação para rotas protegidas
- **sharing-permissions.ts** - Sistema de permissões para contas compartilhadas
- **examples.tsx** - Exemplos de uso do sistema de auth

## Documentação

- **IMPLEMENTATION.md** - Guia completo de implementação
- **README.md** - Este arquivo

## Funcionalidades

- Autenticação JWT com httpOnly cookies
- Refresh tokens automático
- Proteção de rotas
- Permissões granulares para compartilhamento
- Middleware para Next.js
- Validação de sessão

## Uso

```typescript
import { requireAuth, verifyAuth } from '@/lib/auth';

// Verificar autenticação
const user = await verifyAuth();

// Proteger rota
await requireAuth();
```

## Segurança

- Tokens armazenados em httpOnly cookies
- CSRF protection
- Rate limiting
- Expiração automática de sessões
- Refresh token rotation
