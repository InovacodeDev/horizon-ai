# Design Document - MD3 Component Migration

## Overview

Este documento descreve a arquitetura e estratégia de design para migrar todos os componentes de UI da aplicação para seguir as diretrizes do Material Design 3 (MD3). A migração utilizará Base UI como fundação funcional e Tailwind CSS para estilização, garantindo consistência visual, acessibilidade e conformidade com os padrões MD3.

### Objetivos

1. Migrar componentes existentes para MD3 mantendo funcionalidade
2. Criar novos componentes MD3 para uso futuro
3. Implementar sistema de design tokens baseado em MD3
4. Garantir acessibilidade WCAG 2.1 AA em todos os componentes
5. Suportar temas claro e escuro

### Estratégia de Migração

A migração será incremental, priorizando componentes base (button, input, card) antes de componentes compostos (navigation, dialogs). Cada componente será:

1. Analisado quanto à funcionalidade atual
2. Mapeado para especificações MD3
3. Reimplementado usando Base UI (quando disponível) + Tailwind
4. Testado para acessibilidade e funcionalidade
5. Documentado com exemplos de uso

## Architecture

### Design Token System

Implementaremos um sistema de design tokens baseado em CSS Custom Properties que seguem as especificações MD3:

```
src/styles/
├── tokens/
│   ├── colors.css          # Color roles MD3
│   ├── typography.css      # Type scale MD3
│   ├── elevation.css       # Elevation levels
│   ├── motion.css          # Easing & duration
│   └── shape.css           # Border radius scale
├── themes/
│   ├── light.css           # Light mode tokens
│   └── dark.css            # Dark mode tokens
└── md3.css                 # Main import
```

### Component Structure

```
src/components/ui/
├── primitives/             # Base UI wrappers
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   ├── menu.tsx
│   └── ...
├── composed/               # Composed components
│   ├── navigation-bar.tsx
│   ├── navigation-drawer.tsx
│   ├── app-bar.tsx
│   └── ...
├── feedback/               # Feedback components
│   ├── snackbar.tsx
│   ├── progress.tsx
│   └── loading.tsx
└── utils/
    ├── state-layer.tsx     # Reusable state layer
    └── ripple.tsx          # Ripple effect (já existe)
```

## Components and Interfaces

### 1. Design Token System

#### Color System

Implementar color roles do MD3 usando CSS variables:

```css
/* colors.css */
:root {
  /* Primary */
  --md-sys-color-primary: #6750a4;
  --md-sys-color-on-primary: #ffffff;
  --md-sys-color-primary-container: #eaddff;
  --md-sys-color-on-primary-container: #21005d;

  /* Secondary */
  --md-sys-color-secondary: #625b71;
  --md-sys-color-on-secondary: #ffffff;
  --md-sys-color-secondary-container: #e8def8;
  --md-sys-color-on-secondary-container: #1d192b;

  /* Tertiary */
  --md-sys-color-tertiary: #7d5260;
  --md-sys-color-on-tertiary: #ffffff;
  --md-sys-color-tertiary-container: #ffd8e4;
  --md-sys-color-on-tertiary-container: #31111d;

  /* Error */
  --md-sys-color-error: #b3261e;
  --md-sys-color-on-error: #ffffff;
  --md-sys-color-error-container: #f9dedc;
  --md-sys-color-on-error-container: #410e0b;

  /* Surface */
  --md-sys-color-surface: #fffbfe;
  --md-sys-color-on-surface: #1c1b1f;
  --md-sys-color-surface-variant: #e7e0ec;
  --md-sys-color-on-surface-variant: #49454f;

  /* Outline */
  --md-sys-color-outline: #79747e;
  --md-sys-color-outline-variant: #cac4d0;

  /* Background */
  --md-sys-color-background: #fffbfe;
  --md-sys-color-on-background: #1c1b1f;

  /* Surface tints for elevation */
  --md-sys-color-surface-tint: var(--md-sys-color-primary);
}

[data-theme="dark"] {
  --md-sys-color-primary: #d0bcff;
  --md-sys-color-on-primary: #381e72;
  /* ... dark mode colors */
}
```

#### Typography Scale

```css
/* typography.css */
:root {
  /* Display */
  --md-sys-typescale-display-large-font: "Roboto";
  --md-sys-typescale-display-large-size: 57px;
  --md-sys-typescale-display-large-line-height: 64px;
  --md-sys-typescale-display-large-weight: 400;

  /* Headline */
  --md-sys-typescale-headline-large-size: 32px;
  --md-sys-typescale-headline-large-line-height: 40px;
  --md-sys-typescale-headline-large-weight: 400;

  /* Title */
  --md-sys-typescale-title-large-size: 22px;
  --md-sys-typescale-title-large-line-height: 28px;
  --md-sys-typescale-title-large-weight: 400;

  /* Body */
  --md-sys-typescale-body-large-size: 16px;
  --md-sys-typescale-body-large-line-height: 24px;
  --md-sys-typescale-body-large-weight: 400;

  /* Label */
  --md-sys-typescale-label-large-size: 14px;
  --md-sys-typescale-label-large-line-height: 20px;
  --md-sys-typescale-label-large-weight: 500;
  --md-sys-typescale-label-large-tracking: 0.1px;
}
```

#### Elevation System

```css
/* elevation.css */
:root {
  --md-sys-elevation-level0: none;
  --md-sys-elevation-level1: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level2: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level3: 0px 1px 3px 0px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level4: 0px 2px 3px 0px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-level5: 0px 4px 4px 0px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15);
}
```

#### Shape System

```css
/* shape.css */
:root {
  --md-sys-shape-corner-none: 0px;
  --md-sys-shape-corner-extra-small: 4px;
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;
  --md-sys-shape-corner-extra-large: 28px;
  --md-sys-shape-corner-full: 9999px;
}
```

#### Motion System

```css
/* motion.css */
:root {
  /* Duration */
  --md-sys-motion-duration-short1: 50ms;
  --md-sys-motion-duration-short2: 100ms;
  --md-sys-motion-duration-short3: 150ms;
  --md-sys-motion-duration-short4: 200ms;
  --md-sys-motion-duration-medium1: 250ms;
  --md-sys-motion-duration-medium2: 300ms;
  --md-sys-motion-duration-medium3: 350ms;
  --md-sys-motion-duration-medium4: 400ms;
  --md-sys-motion-duration-long1: 450ms;
  --md-sys-motion-duration-long2: 500ms;
  --md-sys-motion-duration-long3: 550ms;
  --md-sys-motion-duration-long4: 600ms;

  /* Easing */
  --md-sys-motion-easing-standard: cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-emphasized: cubic-bezier(0.2, 0, 0, 1);
  --md-sys-motion-easing-emphasized-decelerate: cubic-bezier(0.05, 0.7, 0.1, 1);
  --md-sys-motion-easing-emphasized-accelerate: cubic-bezier(0.3, 0, 0.8, 0.15);
}
```

### 2. Button Component

#### Design Decisions

- Usar Base UI Button como fundação
- Implementar 5 variantes MD3: filled, outlined, text, elevated, tonal
- Manter ripple effect existente
- Adicionar state layers para hover/focus/pressed

#### Interface

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "filled" | "outlined" | "text" | "elevated" | "tonal";
  size?: "small" | "medium" | "large";
  icon?: React.ReactNode;
  iconPosition?: "start" | "end";
  fullWidth?: boolean;
  disableRipple?: boolean;
  disableElevation?: boolean;
}
```

#### Tailwind Classes Mapping

```typescript
const buttonVariants = {
  filled: {
    base: "bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)]",
    hover: "hover:shadow-[var(--md-sys-elevation-level1)]",
    disabled: "disabled:bg-[var(--md-sys-color-on-surface)] disabled:opacity-[0.12]",
  },
  outlined: {
    base: "border border-[var(--md-sys-color-outline)] text-[var(--md-sys-color-primary)]",
    hover: "hover:bg-[var(--md-sys-color-primary)] hover:bg-opacity-[0.08]",
    disabled: "disabled:border-[var(--md-sys-color-on-surface)] disabled:opacity-[0.12]",
  },
  text: {
    base: "text-[var(--md-sys-color-primary)]",
    hover: "hover:bg-[var(--md-sys-color-primary)] hover:bg-opacity-[0.08]",
    disabled: "disabled:text-[var(--md-sys-color-on-surface)] disabled:opacity-[0.38]",
  },
  elevated: {
    base: "bg-[var(--md-sys-color-surface-container-low)] text-[var(--md-sys-color-primary)] shadow-[var(--md-sys-elevation-level1)]",
    hover: "hover:shadow-[var(--md-sys-elevation-level2)]",
    disabled: "disabled:bg-[var(--md-sys-color-on-surface)] disabled:opacity-[0.12] disabled:shadow-none",
  },
  tonal: {
    base: "bg-[var(--md-sys-color-secondary-container)] text-[var(--md-sys-color-on-secondary-container)]",
    hover: "hover:shadow-[var(--md-sys-elevation-level1)]",
    disabled: "disabled:bg-[var(--md-sys-color-on-surface)] disabled:opacity-[0.12]",
  },
};
```

### 3. Card Component

#### Design Decisions

- Implementar 3 variantes: elevated, filled, outlined
- Manter estrutura composável (CardHeader, CardContent, CardFooter)
- Aplicar border-radius medium (12px)
- Suportar cards interativos com state layers

#### Interface

```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "elevated" | "filled" | "outlined";
  interactive?: boolean;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  avatar?: React.ReactNode;
  action?: React.ReactNode;
}
```

#### Tailwind Classes Mapping

```typescript
const cardVariants = {
  elevated: {
    base: "bg-[var(--md-sys-color-surface-container-low)] shadow-[var(--md-sys-elevation-level1)]",
    interactive: "hover:shadow-[var(--md-sys-elevation-level2)] transition-shadow",
  },
  filled: {
    base: "bg-[var(--md-sys-color-surface-container-highest)]",
    interactive: "hover:shadow-[var(--md-sys-elevation-level1)] transition-shadow",
  },
  outlined: {
    base: "border border-[var(--md-sys-color-outline-variant)] bg-[var(--md-sys-color-surface)]",
    interactive: "hover:shadow-[var(--md-sys-elevation-level1)] transition-shadow",
  },
};
```

### 4. Input / Text Field Component

#### Design Decisions

- Usar Base UI Input como fundação
- Implementar variantes filled e outlined
- Suportar label, helper text, error message
- Implementar estados: default, focused, error, disabled
- Adicionar indicador de foco conforme MD3

#### Interface

```typescript
interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "filled" | "outlined";
  label?: string;
  helperText?: string;
  error?: boolean;
  errorMessage?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}
```

#### Structure

```tsx
<div className="text-field-root">
  {leadingIcon && <div className="leading-icon">{leadingIcon}</div>}
  <div className="input-wrapper">
    <input />
    <label>{label}</label>
  </div>
  {trailingIcon && <div className="trailing-icon">{trailingIcon}</div>}
  {(helperText || errorMessage) && <div className="supporting-text">{errorMessage || helperText}</div>}
</div>
```

### 5. Navigation Components

#### Navigation Bar

Design para navegação principal bottom/top:

```typescript
interface NavigationBarProps {
  items: NavigationItem[];
  activeItem?: string;
  position?: "top" | "bottom";
  onItemClick?: (item: NavigationItem) => void;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  disabled?: boolean;
}
```

Características MD3:

- Container height: 80px
- Active indicator: pill shape com primary color
- State layers para hover/focus/pressed
- Badge support para notificações

#### Navigation Drawer

Design para navegação lateral:

```typescript
interface NavigationDrawerProps {
  open: boolean;
  onClose: () => void;
  variant?: "standard" | "modal";
  items: NavigationDrawerItem[];
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

interface NavigationDrawerItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number | string;
  children?: NavigationDrawerItem[];
}
```

Características MD3:

- Width: 360px (standard), 256px (modal)
- Elevation level 1 (modal)
- Active indicator: rounded rectangle
- Suporte para itens aninhados

### 6. Dialog Component

#### Design Decisions

- Usar Base UI Dialog como fundação
- Aplicar elevation level 3
- Border-radius extra-large (28px)
- Backdrop com scrim opacity
- Suportar full-screen em mobile

#### Interface

```typescript
interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  icon?: React.ReactNode;
  actions?: DialogAction[];
  fullScreen?: boolean;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}

interface DialogAction {
  label: string;
  onClick: () => void;
  variant?: "text" | "filled" | "tonal";
  disabled?: boolean;
}
```

### 7. Progress Indicators

#### Circular Progress

```typescript
interface CircularProgressProps {
  value?: number; // undefined = indeterminate
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "tertiary";
  thickness?: number;
}
```

#### Linear Progress

```typescript
interface LinearProgressProps {
  value?: number; // undefined = indeterminate
  buffer?: number;
  color?: "primary" | "secondary" | "tertiary";
}
```

### 8. Snackbar Component

#### Design Decisions

- Usar Base UI Snackbar/Toast como fundação
- Elevation level 3
- Suportar ação opcional
- Auto-dismiss configurável
- Posicionamento bottom-center

#### Interface

```typescript
interface SnackbarProps {
  open: boolean;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
  onClose: () => void;
  severity?: "info" | "success" | "warning" | "error";
}
```

### 9. List Components

#### List Item

```typescript
interface ListItemProps {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  overline?: string;
  headline: string;
  supportingText?: string;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}
```

Características MD3:

- Height: 56px (one-line), 72px (two-line), 88px (three-line)
- State layers para interactive items
- Active indicator para selected items

### 10. New Components

#### Chip

```typescript
interface ChipProps {
  label: string;
  variant?: "assist" | "filter" | "input" | "suggestion";
  selected?: boolean;
  icon?: React.ReactNode;
  avatar?: React.ReactNode;
  onDelete?: () => void;
  onClick?: () => void;
  disabled?: boolean;
}
```

#### Badge

```typescript
interface BadgeProps {
  content?: number | string;
  variant?: "standard" | "dot";
  color?: "primary" | "secondary" | "error";
  max?: number;
  invisible?: boolean;
  children: React.ReactNode;
}
```

#### Tooltip

```typescript
interface TooltipProps {
  title: string;
  placement?: "top" | "bottom" | "left" | "right";
  arrow?: boolean;
  children: React.ReactNode;
}
```

#### Menu

```typescript
interface MenuProps {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  items: MenuItem[];
}

interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  divider?: boolean;
  onClick?: () => void;
}
```

#### Tabs

```typescript
interface TabsProps {
  value: string | number;
  onChange: (value: string | number) => void;
  variant?: "primary" | "secondary";
  children: React.ReactNode;
}

interface TabProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  disabled?: boolean;
}
```

### 11. State Layer Utility

Componente reutilizável para aplicar state layers MD3:

```typescript
interface StateLayerProps {
  hover?: boolean;
  focus?: boolean;
  pressed?: boolean;
  dragged?: boolean;
  color?: string;
  opacity?: {
    hover?: number;
    focus?: number;
    pressed?: number;
    dragged?: number;
  };
}
```

Opacidades padrão MD3:

- Hover: 0.08
- Focus: 0.12
- Pressed: 0.12
- Dragged: 0.16

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  mode: "light" | "dark";
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    error: string;
    // ... outros color roles
  };
  typography: {
    fontFamily: string;
    // ... type scale
  };
  shape: {
    borderRadius: number;
  };
  elevation: {
    enabled: boolean;
  };
}
```

### Component State

```typescript
interface ComponentState {
  enabled: boolean;
  hovered: boolean;
  focused: boolean;
  pressed: boolean;
  dragged: boolean;
  selected: boolean;
  activated: boolean;
  error: boolean;
}
```

## Error Handling

### Component Error Boundaries

Cada componente complexo terá error boundary:

```typescript
<ErrorBoundary fallback={<ComponentErrorFallback />}>
  <Component />
</ErrorBoundary>
```

### Validation

- Props validation usando TypeScript
- Runtime validation para valores críticos
- Console warnings para uso incorreto em desenvolvimento

### Graceful Degradation

- Fallback para variantes não suportadas
- Fallback para tokens não definidos
- Manter funcionalidade básica mesmo sem estilos MD3

## Testing Strategy

### Unit Tests

- Testar cada variante de componente
- Testar estados (hover, focus, disabled, error)
- Testar props e callbacks
- Testar acessibilidade (ARIA attributes)

### Visual Regression Tests

- Snapshots de cada variante
- Snapshots de estados interativos
- Comparação light vs dark mode

### Accessibility Tests

- Contraste de cores (WCAG AA)
- Navegação por teclado
- Screen reader compatibility
- Focus indicators

### Integration Tests

- Testar componentes compostos
- Testar interações entre componentes
- Testar theme switching

### Performance Tests

- Render performance
- Animation performance
- Bundle size impact

## Implementation Phases

### Phase 1: Foundation (Tokens & Utilities)

1. Criar sistema de design tokens
2. Implementar theme provider
3. Criar state layer utility
4. Configurar Tailwind para usar tokens

### Phase 2: Core Components

1. Button (todas as variantes)
2. Input/TextField
3. Card
4. Dialog

### Phase 3: Navigation Components

1. Navigation Bar
2. Navigation Drawer
3. App Bar

### Phase 4: Feedback Components

1. Progress Indicators
2. Snackbar
3. Loading States

### Phase 5: List & Data Display

1. List Items
2. Dividers
3. Badges

### Phase 6: New Components

1. Chips
2. Tooltips
3. Menus
4. Tabs

### Phase 7: Migration & Cleanup

1. Migrar componentes existentes
2. Atualizar testes
3. Atualizar documentação
4. Remover código legado

## Accessibility Considerations

### Color Contrast

- Garantir contraste mínimo 4.5:1 para texto normal
- Garantir contraste mínimo 3:1 para texto grande (18px+)
- Garantir contraste mínimo 3:1 para elementos interativos

### Keyboard Navigation

- Todos os componentes interativos acessíveis via Tab
- Suporte para Enter/Space em botões
- Suporte para Arrow keys em listas e menus
- Escape para fechar dialogs e menus

### Screen Readers

- ARIA labels apropriados
- ARIA roles semânticos
- ARIA states (expanded, selected, checked)
- Live regions para feedback dinâmico

### Focus Management

- Focus indicators visíveis (outline ou ring)
- Focus trap em dialogs
- Focus restoration ao fechar modals
- Skip links quando apropriado

## Performance Considerations

### Code Splitting

- Lazy load componentes complexos
- Dynamic imports para componentes raramente usados
- Tree-shaking de variantes não utilizadas

### CSS Optimization

- Usar CSS variables para tokens (melhor performance que Tailwind classes)
- Minimizar reflows com will-change
- Usar transform/opacity para animações

### Bundle Size

- Manter componentes modulares
- Evitar dependências pesadas
- Usar Base UI (headless, menor bundle)

## Migration Strategy

### Backward Compatibility

- Manter componentes antigos temporariamente
- Criar aliases para facilitar migração
- Documentar breaking changes

### Gradual Migration

1. Criar novos componentes MD3
2. Usar novos componentes em features novas
3. Migrar componentes existentes gradualmente
4. Deprecar componentes antigos
5. Remover componentes antigos após migração completa

### Documentation

- Criar Storybook com todos os componentes
- Documentar props e variantes
- Incluir exemplos de uso
- Criar guia de migração
