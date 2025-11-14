# Lib / Constants

Constantes e valores fixos usados em toda a aplicação.

## Arquivos

- **categories.ts** - Categorias de transações (alimentação, transporte, saúde, etc.)

## Uso

```typescript
import { TRANSACTION_CATEGORIES } from '@/lib/constants/categories';

const categories = TRANSACTION_CATEGORIES;
```

## Convenções

- Use UPPER_SNAKE_CASE para constantes
- Agrupe constantes relacionadas em objetos
- Exporte constantes individuais e objetos agrupados
- Documente o propósito de cada constante
