# Lib / Contexts

React Contexts para gerenciamento de estado global.

## Arquivos

- **UserContext.tsx** - Context de usuário autenticado e suas informações
- **ThemeContext.tsx** - Context de tema (light/dark mode)

## Uso

```tsx
import { useUser } from '@/lib/contexts/UserContext';
import { useTheme } from '@/lib/contexts/ThemeContext';

function Component() {
  const { user, loading } = useUser();
  const { theme, toggleTheme } = useTheme();

  return <div>...</div>;
}
```

## Convenções

- Cada context deve ter seu próprio Provider
- Exporte hooks customizados para consumir o context
- Valide se o context está sendo usado dentro do Provider
