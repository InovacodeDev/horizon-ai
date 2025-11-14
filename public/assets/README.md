# Public / Assets

Assets estáticos da aplicação (imagens, ícones, logos, etc.).

## Estrutura

Esta pasta contém todos os recursos visuais estáticos servidos publicamente:

- Imagens
- Ícones
- Logos de bancos
- Ilustrações
- Outros recursos gráficos

## Acesso

Arquivos são acessíveis diretamente pela URL:

```
/assets/logo.png → public/assets/logo.png
/assets/banks/nubank.svg → public/assets/banks/nubank.svg
```

## Uso em Componentes

```tsx
// Imagem simples
<img src="/assets/logo.png" alt="Logo" />

// Com Next.js Image (recomendado)
import Image from 'next/image';

<Image
  src="/assets/logo.png"
  alt="Logo"
  width={200}
  height={100}
/>
```

## Convenções

- Use nomes descritivos em kebab-case
- Otimize imagens antes de adicionar (compressão, formato adequado)
- Prefira SVG para ícones e logos
- Use WebP para fotos quando possível
- Organize em subpastas por categoria
