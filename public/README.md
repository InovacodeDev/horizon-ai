# Public

Arquivos estáticos servidos publicamente pelo Next.js.

## Estrutura

### assets/

Assets estáticos da aplicação:

- Imagens
- Ícones
- Logos
- Outros recursos visuais

## Uso

Arquivos nesta pasta são acessíveis diretamente pela URL:

```
/assets/logo.png → public/assets/logo.png
```

Em componentes React:

```tsx
<img src="/assets/logo.png" alt="Logo" />
```

## Convenções

- Use nomes descritivos e em kebab-case
- Otimize imagens antes de adicionar
- Para imagens dinâmicas, considere usar Next.js Image component
- Mantenha a estrutura organizada em subpastas
