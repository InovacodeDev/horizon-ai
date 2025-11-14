# Components / Assets

Componentes que renderizam assets visuais como logos e ícones.

## Arquivos

- **BankLogos.tsx** - Componente com logos SVG de bancos brasileiros (Nubank, Inter, Itaú, etc.)
- **Icons.tsx** - Biblioteca de ícones SVG customizados usados na aplicação
- **index.ts** - Exports centralizados

## Uso

```tsx
import { NubankLogo, InterLogo } from '@/components/assets/BankLogos';
import { ChevronIcon, CheckIcon } from '@/components/assets/Icons';

<NubankLogo className="w-8 h-8" />
<ChevronIcon direction="right" />
```
