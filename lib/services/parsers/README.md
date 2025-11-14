# Lib / Services / Parsers

Parsers para diferentes formatos de arquivo de transações e documentos.

## Parsers Disponíveis

- **OFX Parser** - Parse de arquivos OFX (Open Financial Exchange) de bancos
- **CSV Parser** - Parse de arquivos CSV de extratos bancários
- **PDF Parser** - Extração de transações de PDFs de extratos
- **XML Parser** - Parse de arquivos XML de notas fiscais (NFe)

## Funcionalidades

- Detecção automática de formato
- Validação de estrutura
- Extração de dados estruturados
- Tratamento de erros e formatos inválidos
- Normalização de dados

## Uso

```typescript
import { parseOFX } from '@/lib/services/parsers/ofx-parser';

const transactions = await parseOFX(fileBuffer);
```
