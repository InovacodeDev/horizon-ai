# Lib / Services / Mappers

Mapeadores de dados entre diferentes formatos e estruturas.

## Arquivos

- **transaction.mapper.ts** - Mapeia transações entre diferentes formatos (OFX, CSV, API, Database)

## Responsabilidades

- Converter dados de entrada (OFX, CSV) para formato interno
- Mapear dados do banco para formato de API
- Normalizar campos e valores
- Aplicar transformações de dados

## Uso

```typescript
import { mapOFXToTransaction } from '@/lib/services/mappers/transaction.mapper';

const transaction = mapOFXToTransaction(ofxData);
```
