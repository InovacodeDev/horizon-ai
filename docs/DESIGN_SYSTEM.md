# Horizon AI Design System Documentation

## Overview

The Horizon AI Design System provides a comprehensive set of design tokens, components, and patterns for building consistent, accessible, and beautiful user interfaces. The system supports both light and dark themes with smooth transitions and follows modern design principles.

## Table of Contents

1. [Design Tokens](#design-tokens)
2. [Components](#components)
3. [Usage Examples](#usage-examples)
4. [Theme System](#theme-system)
5. [Accessibility](#accessibility)
6. [Migration Guide](#migration-guide)

---

## Design Tokens

Design tokens are the foundational building blocks of the design system. They ensure consistency across the application.

### Color Palette

#### Light Theme

**Backgrounds:**

- `--bg-primary`: `#ffffff` - Main page background
- `--bg-secondary`: `#f8f9fa` - Secondary sections
- `--bg-tertiary`: `#f1f3f5` - Tertiary backgrounds

**Surfaces:**

- `--surface-primary`: `#ffffff` - Cards, containers
- `--surface-secondary`: `#f8f9fa` - Elevated surfaces
- `--surface-tertiary`: `#f1f3f5` - Subtle surfaces

**Text:**

- `--text-primary`: `#1a1d1f` - Primary text (WCAG AA compliant)
- `--text-secondary`: `#6c757d` - Secondary text
- `--text-tertiary`: `#adb5bd` - Muted text
- `--text-disabled`: `#dee2e6` - Disabled state

**Borders:**

- `--border-primary`: `#e9ecef` - Subtle borders
- `--border-secondary`: `#dee2e6` - Medium borders
- `--border-focus`: `#4f7cff` - Focus state

**Brand Colors:**

- `--blue-primary`: `#2d5adc` - Primary brand color (WCAG AA: 4.5:1)
- `--blue-hover`: `#2449b8` - Hover state
- `--blue-light`: `#ebf2ff` - Light backgrounds
- `--blue-dark`: `#1e3a94` - Dark variant

#### Dark Theme

**Backgrounds:**

- `--bg-primary`: `#0f1419` - Main page background
- `--bg-secondary`: `#1a1f26` - Secondary sections
- `--bg-tertiary`: `#242a33` - Tertiary backgrounds

**Surfaces:**

- `--surface-primary`: `#1a1f26` - Cards, containers
- `--surface-secondary`: `#242a33` - Elevated surfaces
- `--surface-tertiary`: `#2e3440` - Subtle surfaces

**Text:**

- `--text-primary`: `#e5e7eb` - Primary text
- `--text-secondary`: `#9ca3af` - Secondary text
- `--text-tertiary`: `#6b7280` - Muted text
- `--text-disabled`: `#4b5563` - Disabled state

**Brand Colors:**

- `--blue-primary`: `#5b8cff` - Lighter for dark mode
- `--blue-hover`: `#7ba3ff` - Hover state
- `--blue-light`: `#1e3a5f` - Dark backgrounds
- `--blue-dark`: `#4f7cff` - Dark variant

#### Semantic Colors

**Success (Green):**

- Light: `bg: #e8f5e9`, `text: #2e7d32`, `border: #81c784`
- Dark: `bg: #1b3a2f`, `text: #6ee7b7`, `border: #34d399`

**Error (Red):**

- Light: `bg: #ffebee`, `text: #c62828`, `border: #e57373`
- Dark: `bg: #3a1f1f`, `text: #fca5a5`, `border: #f87171`

**Warning (Orange):**

- Light: `bg: #fff3e0`, `text: #e65100`, `border: #ffb74d`
- Dark: `bg: #3a2f1f`, `text: #fcd34d`, `border: #fbbf24`

**Info (Blue):**

- Light: `bg: #e3f2fd`, `text: #1565c0`, `border: #64b5f6`
- Dark: `bg: #1f2937`, `text: #93c5fd`, `border: #60a5fa`

### Spacing Scale

Based on a 4px grid system:

```javascript
0:  0px
1:  4px
2:  8px
3:  12px
4:  16px
5:  20px
6:  24px
7:  28px
8:  32px
10: 40px
12: 48px
16: 64px
20: 80px
24: 96px
```

**Usage:**

- `p-4` = 16px padding
- `m-6` = 24px margin
- `gap-3` = 12px gap

### Typography

**Font Family:**

- Sans: `Inter, system-ui, -apple-system, sans-serif`
- Mono: `JetBrains Mono, Menlo, Monaco, monospace`

**Font Sizes:**

```javascript
xs:   12px / 16px line-height
sm:   14px / 20px line-height
base: 16px / 24px line-height
lg:   18px / 28px line-height
xl:   20px / 28px line-height
2xl:  24px / 32px line-height
3xl:  30px / 36px line-height
4xl:  36px / 40px line-height
```

**Font Weights:**

- `normal`: 400 - Body text
- `medium`: 500 - Emphasis, buttons
- `semibold`: 600 - Headings
- `bold`: 700 - Strong emphasis

### Shadows

Soft, diffused shadows for depth:

```javascript
soft-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.03)
soft-sm: 0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)
soft-md: 0 4px 8px 0 rgba(0, 0, 0, 0.05), 0 2px 4px 0 rgba(0, 0, 0, 0.03)
soft-lg: 0 8px 16px 0 rgba(0, 0, 0, 0.06), 0 4px 8px 0 rgba(0, 0, 0, 0.04)
soft-xl: 0 12px 24px 0 rgba(0, 0, 0, 0.07), 0 6px 12px 0 rgba(0, 0, 0, 0.05)
```

### Border Radius

```javascript
sm:      4px  - Small elements
DEFAULT: 8px  - Buttons, inputs
md:      8px  - Same as default
lg:      12px - Cards
xl:      16px - Large containers
2xl:     20px - Extra large
full:    9999px - Circular
```

---

## Components

### Button

A versatile button component with multiple variants and sizes.

#### Props

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}
```

#### Variants

- **primary**: Blue filled button with white text (default)
- **secondary**: Gray background with dark text
- **outline**: Transparent with border
- **ghost**: Transparent without border
- **danger**: Red variant for destructive actions

#### Sizes

- **sm**: 32px height, 12px horizontal padding
- **md**: 40px height, 16px horizontal padding (default)
- **lg**: 48px height, 20px horizontal padding

#### States

- **Default**: Base styling
- **Hover**: Color shift + subtle shadow
- **Active**: Pressed appearance (scale 0.98)
- **Disabled**: 60% opacity, no interaction
- **Loading**: Spinner icon, disabled state

#### Usage Examples

```tsx
import { Button } from '@/components/ui/Button';
import { PlusIcon } from '@/components/assets/Icons';

// Primary button
<Button variant="primary" size="md">
  Save Changes
</Button>

// With icon
<Button variant="primary" leftIcon={<PlusIcon />}>
  Add Item
</Button>

// Loading state
<Button variant="primary" loading>
  Processing...
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  Delete Account
</Button>

// Ghost button
<Button variant="ghost" size="sm">
  Cancel
</Button>
```

---

### Input

A flexible input component with support for icons, labels, and error states.

#### Props

```typescript
interface InputProps {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  label?: string;
  error?: string;
  helperText?: string;
  type?: string;
  disabled?: boolean;
  className?: string;
  // ...standard input props
}
```

#### Features

- **Icons**: Left and right icon support
- **Labels**: Optional label with proper association
- **Error States**: Red border + error message
- **Helper Text**: Muted text below input
- **Password Toggle**: Built-in show/hide for password inputs
- **Disabled State**: Reduced opacity + gray background

#### Usage Examples

```tsx
import { Input } from '@/components/ui/Input';
import { SearchIcon, MailIcon } from '@/components/assets/Icons';

// Basic input
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
/>

// With icon
<Input
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>

// With error
<Input
  label="Username"
  error="Username is required"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>

// With helper text
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>

// Disabled
<Input
  label="Account ID"
  value="12345"
  disabled
/>
```

---

### Card

A container component for grouping related content.

#### Props

```typescript
interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'flat' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}
```

#### Variants

- **default**: Border with no shadow
- **elevated**: Shadow with no border
- **flat**: No border, no shadow
- **interactive**: Hover effects (auto-applied with onClick)

#### Padding

- **none**: No padding
- **sm**: 16px padding
- **md**: 24px padding (default)
- **lg**: 32px padding

#### Usage Examples

```tsx
import { Card } from '@/components/ui/Card';

// Default card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here</p>
</Card>

// Elevated card
<Card variant="elevated" padding="lg">
  <h2>Featured Content</h2>
  <p>This card has a shadow and larger padding</p>
</Card>

// Interactive card
<Card variant="interactive" onClick={handleClick}>
  <h3>Clickable Card</h3>
  <p>Hover to see the lift effect</p>
</Card>

// No padding (for custom layouts)
<Card padding="none">
  <img src="/image.jpg" alt="Cover" />
  <div className="p-6">
    <h3>Custom Layout</h3>
  </div>
</Card>
```

---

### Badge

A small label component for status indicators and tags.

#### Props

```typescript
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}
```

#### Variants

- **success**: Green color scheme
- **warning**: Orange color scheme
- **error**: Red color scheme
- **info**: Blue color scheme
- **neutral**: Gray color scheme (default)

#### Sizes

- **sm**: 20px height, 10px horizontal padding
- **md**: 24px height, 12px horizontal padding (default)

#### Usage Examples

```tsx
import { Badge } from '@/components/ui/Badge';

// Success badge
<Badge variant="success">Active</Badge>

// Error badge
<Badge variant="error">Failed</Badge>

// Warning badge
<Badge variant="warning">Pending</Badge>

// Info badge
<Badge variant="info">New</Badge>

// Small size
<Badge variant="success" size="sm">
  Verified
</Badge>

// In a list
<div className="flex gap-2">
  <Badge variant="info">React</Badge>
  <Badge variant="info">TypeScript</Badge>
  <Badge variant="info">Tailwind</Badge>
</div>
```

---

## Theme System

### ThemeProvider

The theme system uses React Context and CSS custom properties for dynamic theme switching.

#### Setup

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/lib/contexts/ThemeContext';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

#### Using the Theme

```tsx
'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';

function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={toggleTheme}>
        Toggle Theme
      </button>
      <button onClick={() => setTheme('dark')}>
        Dark Mode
      </button>
      <button onClick={() => setTheme('light')}>
        Light Mode
      </button>
    </div>
  );
}
```

#### Theme Toggle Component

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// In your header or navigation
<ThemeToggle />
```

### Theme Persistence

The theme preference is automatically saved to `localStorage` with the key `horizon-theme-preference` and persists across sessions.

### System Preference Detection

On first load, the theme system detects the user's system preference using `prefers-color-scheme` media query.

---

## Accessibility

### Color Contrast

All color combinations meet WCAG AA standards:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18px+): Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio

### Focus States

All interactive elements have visible focus indicators:

- Blue outline with subtle shadow
- 2px outline with 2px offset
- Consistent across all components

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Proper tab order maintained
- Enter/Space keys work on custom interactive elements
- Theme toggle accessible via keyboard

### Screen Reader Support

- Semantic HTML elements used throughout
- ARIA labels for icon-only buttons
- Proper heading hierarchy
- Descriptive link and button text

### Reduced Motion

The system respects `prefers-reduced-motion` preference:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Utility Classes

### Transition Utilities

```css
.transition-smooth          /* 150ms smooth transition */
.transition-smooth-200      /* 200ms smooth transition */
.transition-colors-smooth   /* Color transitions only */
.transition-transform-smooth /* Transform transitions only */
.transition-shadow-smooth   /* Shadow transitions only */
```

### Focus Utilities

```css
.focus-ring        /* Standard focus ring */
.focus-ring-inset  /* Inset focus ring */
```

### Interactive Utilities

```css
.interactive-lift  /* Hover lift effect */
.interactive-scale /* Active scale effect */
```

### Layout Utilities

```css
.page-section-spacing /* Consistent section spacing */
```

### Component Pattern Utilities

```css
/* Cards */
.card-base         /* Basic card styling */
.card-elevated     /* Elevated card with shadow */
.card-interactive  /* Interactive card with hover */

/* Inputs */
.input-base        /* Basic input styling */

/* Buttons */
.btn-base          /* Base button styling */
.btn-primary       /* Primary button */
.btn-secondary     /* Secondary button */
.btn-outline       /* Outline button */
.btn-ghost         /* Ghost button */

/* Badges */
.badge-base        /* Base badge styling */
.badge-success     /* Success badge */
.badge-error       /* Error badge */
.badge-warning     /* Warning badge */
.badge-info        /* Info badge */
```

### Scrollbar Utilities

```css
.scrollbar-thin    /* Thin custom scrollbar */
```

---

## Best Practices

### Using Design Tokens

✅ **Do:**

```tsx
<div className="bg-surface-new-primary text-text-primary border-border-primary">
  Content
</div>
```

❌ **Don't:**

```tsx
<div className="bg-white text-black border-gray-200">
  Content
</div>
```

### Spacing

✅ **Do:** Use the spacing scale

```tsx
<div className="p-6 mb-4 gap-3">
  Content
</div>
```

❌ **Don't:** Use arbitrary values

```tsx
<div className="p-[25px] mb-[15px] gap-[13px]">
  Content
</div>
```

### Typography

✅ **Do:** Use defined font sizes and weights

```tsx
<h1 className="text-2xl font-semibold">Heading</h1>
<p className="text-base font-normal">Body text</p>
```

❌ **Don't:** Use arbitrary sizes

```tsx
<h1 className="text-[23px] font-[550]">Heading</h1>
```

### Shadows

✅ **Do:** Use soft shadow utilities

```tsx
<div className="shadow-soft-md hover:shadow-soft-lg">
  Card
</div>
```

❌ **Don't:** Use default Tailwind shadows

```tsx
<div className="shadow-md hover:shadow-lg">
  Card
</div>
```

---

## Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions on migrating existing components to the new design system.

---

## Resources

- **Tailwind Config**: `tailwind.config.js`
- **Global Styles**: `app/globals.css`
- **Theme Context**: `lib/contexts/ThemeContext.tsx`
- **Component Library**: `components/ui/`
- **Design Spec**: `.kiro/specs/ui-refactor-smooth-design/design.md`

---

## Support

For questions or issues with the design system, please refer to:

1. This documentation
2. Component source code in `components/ui/`
3. Design specification document
4. Team design system channel

---

**Last Updated**: November 2025
**Version**: 1.0.0
