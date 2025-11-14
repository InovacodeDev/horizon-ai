# Lib / Utils

Utilitários e helpers gerais da aplicação.

## Arquivos

- **index.ts** - Exports centralizados e utilitários gerais
- **cache.ts** - Sistema de cache em memória para otimização
- **timezone.ts** - Helpers para manipulação de datas e timezones
- **toon.ts** - Formatação de dados no formato TOON para economia de tokens em AI
- **temp-file-manager.ts** - Gerenciamento seguro de arquivos temporários
- **rate-limiter.ts** - Rate limiting para APIs
- **audit-logger.ts** - Sistema de logs de auditoria
- **file-security.ts** - Validação e segurança de arquivos
- **random-name.generator.ts** - Gerador de nomes aleatórios

## Documentação Adicional

- **CACHE_README.md** - Documentação detalhada do sistema de cache
- **README_SECURITY.md** - Guia de segurança para arquivos e uploads

## Uso

```typescript
import { formatCurrency, parseDate } from '@/lib/utils';
import { cache } from '@/lib/utils/cache';
import { encodeToToon } from '@/lib/utils/toon';

const formatted = formatCurrency(1000);
const cached = cache.get('key');
const toonData = encodeToToon(largeObject);
```
