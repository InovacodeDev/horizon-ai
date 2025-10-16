# Guia de Contribuição

Obrigado por considerar contribuir com o Horizon AI! Este documento fornece diretrizes e melhores práticas para contribuir com o projeto.

## 📋 Índice

- [Código de Conduta](#código-de-conduta)
- [Como Posso Contribuir?](#como-posso-contribuir)
- [Workflow de Desenvolvimento](#workflow-de-desenvolvimento)
- [Padrões de Código](#padrões-de-código)
- [Convenções de Commit](#convenções-de-commit)
- [Pull Requests](#pull-requests)
- [Reportando Bugs](#reportando-bugs)
- [Sugerindo Melhorias](#sugerindo-melhorias)

## Código de Conduta

Este projeto segue um código de conduta que todos os contribuidores devem respeitar:

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros da comunidade

## Como Posso Contribuir?

### Reportando Bugs

Antes de criar um bug report, verifique se o problema já não foi reportado. Se você encontrar um bug:

1. Use um título claro e descritivo
2. Descreva os passos exatos para reproduzir o problema
3. Forneça exemplos específicos
4. Descreva o comportamento observado e o esperado
5. Inclua screenshots se aplicável
6. Inclua informações sobre seu ambiente (OS, Node version, etc)

### Sugerindo Melhorias

Se você tem uma ideia para melhorar o projeto:

1. Use um título claro e descritivo
2. Forneça uma descrição detalhada da melhoria sugerida
3. Explique por que essa melhoria seria útil
4. Liste exemplos de como a feature funcionaria

### Contribuindo com Código

1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça suas alterações
4. Escreva ou atualize testes se necessário
5. Certifique-se de que todos os testes passam
6. Faça commit das suas alterações
7. Push para sua branch
8. Abra um Pull Request

## Workflow de Desenvolvimento

### Setup Inicial

```bash
# Clone o repositório
git clone <repository-url>
cd horizon-ai-mvp

# Instale as dependências
pnpm install

# Configure as variáveis de ambiente
./scripts/setup-env.sh

# Inicie o servidor de desenvolvimento
pnpm dev
```

### Criando uma Branch

```bash
# Atualize sua main
git checkout main
git pull origin main

# Crie uma nova branch
git checkout -b feature/nome-da-feature
# ou
git checkout -b fix/nome-do-bug
```

### Fazendo Alterações

1. Faça suas alterações no código
2. Teste localmente com `pnpm dev`
3. Execute o linter: `pnpm lint`
4. Execute o type check: `pnpm typecheck`
5. Certifique-se de que o build funciona: `pnpm build`

### Testando

```bash
# Execute todos os testes (quando implementados)
pnpm test

# Execute testes em modo watch
pnpm test:watch

# Execute testes com coverage
pnpm test:coverage
```

## Padrões de Código

### TypeScript

- Use TypeScript strict mode
- Sempre defina tipos explícitos para funções públicas
- Evite usar `any` - use `unknown` se necessário
- Use interfaces para objetos e types para unions/intersections

```typescript
// ✅ Bom
interface User {
  id: string;
  email: string;
  firstName: string;
}

function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Ruim
function getUser(id: any): any {
  // ...
}
```

### Nomenclatura

- **Componentes**: PascalCase (`DashboardLayout.tsx`)
- **Funções/Variáveis**: camelCase (`getUserId`, `isAuthenticated`)
- **Constantes**: UPPER_SNAKE_CASE (`JWT_ACCESS_SECRET`)
- **Tipos/Interfaces**: PascalCase (`UserType`, `AuthResponse`)
- **Arquivos**: kebab-case para utilitários (`get-user.ts`)

### Componentes React

```typescript
// ✅ Bom - Componente funcional com tipos
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled = false }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

// ❌ Ruim - Sem tipos
export function Button({ label, onClick, disabled }) {
  // ...
}
```

### Estrutura de Arquivos

- Mantenha arquivos pequenos e focados (< 300 linhas)
- Um componente por arquivo
- Agrupe arquivos relacionados em pastas
- Use `index.ts` para exports públicos

```
src/lib/auth/
├── index.ts          # Exports públicos
├── tokens.ts         # Geração de tokens
├── password.ts       # Hashing de senhas
└── cookies.ts        # Gerenciamento de cookies
```

### Imports

Organize imports na seguinte ordem:

1. Imports externos (React, Next.js, etc)
2. Imports internos absolutos
3. Imports internos relativos
4. Imports de tipos
5. Imports de estilos

```typescript
// 1. Externos
import { useState } from "react";
import { NextRequest } from "next/server";

// 2. Internos absolutos
import { getUser } from "@/lib/auth/get-user";
import { supabase } from "@/lib/db/supabase";

// 3. Internos relativos
import { Button } from "../ui/button";

// 4. Tipos
import type { User } from "@/lib/db/types";

// 5. Estilos
import "./styles.css";
```

### Comentários

- Escreva código auto-explicativo
- Use comentários para explicar "por quê", não "o quê"
- Documente funções complexas com JSDoc

```typescript
// ✅ Bom
/**
 * Generates a JWT access token for the user.
 * Token expires in 15 minutes for security.
 *
 * @param userId - The unique identifier of the user
 * @returns Signed JWT token
 */
export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
}

// ❌ Ruim
// This function generates a token
export function generateAccessToken(userId: string): string {
  // Sign the token
  return jwt.sign({ userId }, JWT_ACCESS_SECRET, { expiresIn: "15m" });
}
```

### Error Handling

```typescript
// ✅ Bom - Tratamento específico de erros
try {
  const user = await getUser(userId);
  return NextResponse.json(user);
} catch (error) {
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { error: "Invalid input", details: error.details },
      { status: 400 }
    );
  }

  console.error("Unexpected error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

// ❌ Ruim - Catch genérico
try {
  const user = await getUser(userId);
  return NextResponse.json(user);
} catch (error) {
  return NextResponse.json({ error: "Error" }, { status: 500 });
}
```

## Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

### Formato

```
<tipo>(<escopo>): <descrição>

[corpo opcional]

[rodapé opcional]
```

### Tipos

- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Alterações na documentação
- `style`: Formatação, ponto e vírgula, etc (não afeta o código)
- `refactor`: Refatoração de código
- `perf`: Melhorias de performance
- `test`: Adição ou correção de testes
- `chore`: Tarefas de manutenção, configuração, etc

### Exemplos

```bash
# Feature
git commit -m "feat(auth): add refresh token rotation"

# Bug fix
git commit -m "fix(dashboard): correct balance calculation"

# Documentation
git commit -m "docs: update API documentation"

# Refactor
git commit -m "refactor(db): simplify query logic"

# Breaking change
git commit -m "feat(api)!: change authentication endpoint structure

BREAKING CHANGE: /api/auth/login now returns tokens in response body instead of cookies"
```

## Pull Requests

### Antes de Abrir um PR

- [ ] Código está formatado (Prettier)
- [ ] Linter passa sem erros (ESLint)
- [ ] Type check passa (TypeScript)
- [ ] Build funciona (`pnpm build`)
- [ ] Testes passam (quando aplicável)
- [ ] Documentação atualizada (se necessário)

### Template de PR

```markdown
## Descrição

Breve descrição do que foi implementado/corrigido.

## Tipo de Mudança

- [ ] Bug fix (mudança que corrige um problema)
- [ ] Nova feature (mudança que adiciona funcionalidade)
- [ ] Breaking change (mudança que quebra compatibilidade)
- [ ] Documentação

## Como Testar

1. Passo 1
2. Passo 2
3. Passo 3

## Checklist

- [ ] Código segue os padrões do projeto
- [ ] Comentários foram adicionados em código complexo
- [ ] Documentação foi atualizada
- [ ] Testes foram adicionados/atualizados
- [ ] Todas as verificações passam
```

### Code Review

Ao revisar PRs:

- Seja construtivo e respeitoso
- Foque em melhorias, não em críticas pessoais
- Explique o "por quê" das suas sugestões
- Aprove quando o código atende aos padrões

## Reportando Bugs

### Template de Bug Report

```markdown
## Descrição do Bug

Descrição clara e concisa do bug.

## Passos para Reproduzir

1. Vá para '...'
2. Clique em '...'
3. Role até '...'
4. Veja o erro

## Comportamento Esperado

Descrição clara do que deveria acontecer.

## Comportamento Atual

Descrição clara do que está acontecendo.

## Screenshots

Se aplicável, adicione screenshots.

## Ambiente

- OS: [ex: macOS 14.0]
- Node: [ex: 20.10.0]
- Browser: [ex: Chrome 120]
- Version: [ex: 0.1.0]

## Contexto Adicional

Qualquer outra informação relevante.
```

## Sugerindo Melhorias

### Template de Feature Request

```markdown
## Descrição da Feature

Descrição clara e concisa da feature sugerida.

## Problema que Resolve

Explique o problema que essa feature resolveria.

## Solução Proposta

Descrição clara de como você imagina que a feature funcionaria.

## Alternativas Consideradas

Outras soluções que você considerou.

## Contexto Adicional

Screenshots, mockups, ou qualquer outra informação relevante.
```

## Recursos Adicionais

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Documentation](https://react.dev/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Dúvidas?

Se você tiver dúvidas sobre como contribuir, sinta-se à vontade para:

- Abrir uma issue com a tag `question`
- Entrar em contato com a equipe

Obrigado por contribuir! 🎉
