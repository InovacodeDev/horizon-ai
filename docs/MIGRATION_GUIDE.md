# Design System Migration Guide

## Overview

This guide helps developers migrate existing components and pages to the new Horizon AI Design System. The migration focuses on updating styling while maintaining functionality.

## Table of Contents

1. [Before You Start](#before-you-start)
2. [Color Token Migration](#color-token-migration)
3. [Component Migration](#component-migration)
4. [Common Patterns](#common-patterns)
5. [Troubleshooting](#troubleshooting)

---

## Before You Start

### Prerequisites

1. **Understand the Design System**: Read [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md)
2. **Review Design Tokens**: Familiarize yourself with new color, spacing, and typography tokens
3. **Test Environment**: Ensure you can test in both light and dark themes

### Migration Strategy

We recommend a **gradual migration** approach:

1. Start with base components (Button, Input, Card, Badge)
2. Move to layout components (Sidebar, Header)
3. Update page-level components
4. Test thoroughly in both themes

### Backward Compatibility

The design system maintains backward compatibility with legacy tokens. Old color variables still work but are deprecated. Plan to migrate fully over time.

---

## Color Token Migration

### Background Colors

#### Old → New

```tsx
// OLD
className = 'bg-white dark:bg-gray-900';

// NEW
className = 'bg-surface-new-primary';
```

```tsx
// OLD
className = 'bg-gray-50 dark:bg-gray-800';

// NEW
className = 'bg-bg-secondary';
```

### Text Colors

```tsx
// OLD
className = 'text-gray-900 dark:text-gray-100';

// NEW
className = 'text-text-primary';
```

```tsx
// OLD
className = 'text-gray-600 dark:text-gray-400';

// NEW
className = 'text-text-secondary';
```

```tsx
// OLD
className = 'text-gray-400 dark:text-gray-500';

// NEW
className = 'text-text-tertiary';
```

### Border Colors

```tsx
// OLD
className = 'border-gray-200 dark:border-gray-700';

// NEW
className = 'border-border-primary';
```

```tsx
// OLD
className = 'border-gray-300 dark:border-gray-600';

// NEW
className = 'border-border-secondary';
```

### Brand Colors

```tsx
// OLD
className = 'bg-blue-600 hover:bg-blue-700';

// NEW
className = 'bg-blue-primary hover:bg-blue-hover';
```

### Semantic Colors

```tsx
// OLD - Success
className = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';

// NEW - Success
className = 'bg-green-bg text-green-text';
```

```tsx
// OLD - Error
className = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';

// NEW - Error
className = 'bg-red-bg text-red-text';
```

```tsx
// OLD - Warning
className = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

// NEW - Warning
className = 'bg-orange-bg text-orange-text';
```

---

## Component Migration

### Button Migration

#### Before

```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
  Click Me
</button>
```

#### After

```tsx
import { Button } from '@/components/ui/Button';

<Button variant="primary" size="md">
  Click Me
</Button>
```

#### Variant Mapping

| Old Style                   | New Variant           |
| --------------------------- | --------------------- |
| `bg-blue-600 text-white`    | `variant="primary"`   |
| `bg-gray-100 text-gray-900` | `variant="secondary"` |
| `border border-gray-300`    | `variant="outline"`   |
| `bg-transparent`            | `variant="ghost"`     |
| `bg-red-600 text-white`     | `variant="danger"`    |

### Input Migration

#### Before

```tsx
<div>
  <label className="block text-sm font-medium mb-2">
    Email
  </label>
  <input
    type="email"
    className="w-full px-3 py-2 border border-gray-300 rounded focus:border-blue-500"
    placeholder="Enter email"
  />
</div>
```

#### After

```tsx
import { Input } from '@/components/ui/Input';

<Input
  label="Email"
  type="email"
  placeholder="Enter email"
/>
```

#### With Icons

```tsx
// Before
<div className="relative">
  <input className="pl-10 ..." />
  <SearchIcon className="absolute left-3 top-3" />
</div>

// After
<Input
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>
```

### Card Migration

#### Before

```tsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-gray-600 dark:text-gray-400">Card content</p>
</div>
```

#### After

```tsx
import { Card } from '@/components/ui/Card';

<Card variant="default" padding="md">
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-text-secondary">Card content</p>
</Card>
```

#### Elevated Card

```tsx
// Before
<div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
  Content
</div>

// After
<Card variant="elevated" padding="md">
  Content
</Card>
```

### Badge Migration

#### Before

```tsx
<span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
  Active
</span>
```

#### After

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="success">Active</Badge>
```

#### Status Mapping

| Old Color                       | New Variant         |
| ------------------------------- | ------------------- |
| `bg-green-100 text-green-800`   | `variant="success"` |
| `bg-red-100 text-red-800`       | `variant="error"`   |
| `bg-yellow-100 text-yellow-800` | `variant="warning"` |
| `bg-blue-100 text-blue-800`     | `variant="info"`    |
| `bg-gray-100 text-gray-800`     | `variant="neutral"` |

---

## Common Patterns

### Form Layout

#### Before

```tsx
<form className="space-y-4">
  <div>
    <label className="block text-sm font-medium mb-2">Name</label>
    <input className="w-full px-3 py-2 border rounded" />
  </div>
  <div>
    <label className="block text-sm font-medium mb-2">Email</label>
    <input className="w-full px-3 py-2 border rounded" />
  </div>
  <button className="px-4 py-2 bg-blue-600 text-white rounded">
    Submit
  </button>
</form>
```

#### After

```tsx
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

<form className="space-y-4">
  <Input label="Name" />
  <Input label="Email" type="email" />
  <Button variant="primary" type="submit">
    Submit
  </Button>
</form>
```

### Card Grid

#### Before

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
    Card 1
  </div>
  <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
    Card 2
  </div>
  <div className="bg-white dark:bg-gray-800 border rounded-lg p-6">
    Card 3
  </div>
</div>
```

#### After

```tsx
import { Card } from '@/components/ui/Card';

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>
```

### Status Indicators

#### Before

```tsx
<div className="flex items-center gap-2">
  <span className="w-2 h-2 bg-green-500 rounded-full" />
  <span className="text-sm text-gray-600">Online</span>
</div>
```

#### After

```tsx
import { Badge } from '@/components/ui/Badge';

<Badge variant="success" size="sm">Online</Badge>
```

### Action Buttons

#### Before

```tsx
<div className="flex gap-2">
  <button className="px-4 py-2 bg-blue-600 text-white rounded">
    Save
  </button>
  <button className="px-4 py-2 border border-gray-300 rounded">
    Cancel
  </button>
</div>
```

#### After

```tsx
import { Button } from '@/components/ui/Button';

<div className="flex gap-2">
  <Button variant="primary">Save</Button>
  <Button variant="outline">Cancel</Button>
</div>
```

### Modal/Dialog

#### Before

```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
    <h2 className="text-xl font-semibold mb-4">Modal Title</h2>
    <p className="text-gray-600 dark:text-gray-400 mb-6">Modal content</p>
    <div className="flex gap-2 justify-end">
      <button className="px-4 py-2 border rounded">Cancel</button>
      <button className="px-4 py-2 bg-blue-600 text-white rounded">Confirm</button>
    </div>
  </div>
</div>
```

#### After

```tsx
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

<Modal isOpen={isOpen} onClose={onClose} title="Modal Title">
  <p className="text-text-secondary mb-6">Modal content</p>
  <div className="flex gap-2 justify-end">
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button variant="primary" onClick={onConfirm}>Confirm</Button>
  </div>
</Modal>
```

---

## Shadow Migration

### Old → New

```tsx
// OLD
className = 'shadow-sm';
// NEW
className = 'shadow-soft-sm';

// OLD
className = 'shadow-md';
// NEW
className = 'shadow-soft-md';

// OLD
className = 'shadow-lg';
// NEW
className = 'shadow-soft-lg';
```

---

## Border Radius Migration

### Old → New

```tsx
// OLD
className = 'rounded';
// NEW
className = 'rounded-md'; // 8px

// OLD
className = 'rounded-lg';
// NEW
className = 'rounded-lg'; // 12px (same)

// OLD
className = 'rounded-xl';
// NEW
className = 'rounded-xl'; // 16px (same)
```

---

## Spacing Migration

The new system uses a 4px base scale. Most spacing values remain the same, but ensure consistency:

```tsx
// Padding
p-4  = 16px ✓
p-6  = 24px ✓
p-8  = 32px ✓

// Margin
m-4  = 16px ✓
m-6  = 24px ✓
m-8  = 32px ✓

// Gap
gap-3 = 12px ✓
gap-4 = 16px ✓
gap-6 = 24px ✓
```

---

## Typography Migration

### Font Sizes

```tsx
// OLD
className = 'text-sm';
// NEW
className = 'text-sm'; // 14px (same)

// OLD
className = 'text-base';
// NEW
className = 'text-base'; // 16px (same)

// OLD
className = 'text-lg';
// NEW
className = 'text-lg'; // 18px (same)
```

### Font Weights

```tsx
// OLD
className = 'font-normal';
// NEW
className = 'font-normal'; // 400 (same)

// OLD
className = 'font-medium';
// NEW
className = 'font-medium'; // 500 (same)

// OLD
className = 'font-semibold';
// NEW
className = 'font-semibold'; // 600 (same)
```

---

## Transition Migration

### Old → New

```tsx
// OLD
className = 'transition duration-150';
// NEW
className = 'transition-smooth';

// OLD
className = 'transition duration-200';
// NEW
className = 'transition-smooth-200';

// OLD
className = 'transition-colors';
// NEW
className = 'transition-colors-smooth';
```

---

## Theme Integration

### Adding Theme Support to Custom Components

#### Before (Manual Dark Mode)

```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>
```

#### After (Using Design Tokens)

```tsx
<div className="bg-surface-new-primary text-text-primary">
  Content
</div>
```

The theme automatically switches based on the ThemeProvider context.

### Using Theme in JavaScript

```tsx
'use client';

import { useTheme } from '@/lib/contexts/ThemeContext';

function MyComponent() {
  const { theme } = useTheme();

  return (
    <div>
      Current theme: {theme}
      {/* Component adapts automatically via CSS variables */}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: Colors not updating in dark mode

**Solution**: Ensure you're using the new design tokens instead of hardcoded Tailwind colors.

```tsx
// ❌ Wrong
<div className="bg-white text-black">

// ✅ Correct
<div className="bg-surface-new-primary text-text-primary">
```

### Issue: Shadows look too harsh

**Solution**: Use the new soft shadow utilities.

```tsx
// ❌ Wrong
<div className="shadow-lg">

// ✅ Correct
<div className="shadow-soft-lg">
```

### Issue: Focus states not visible

**Solution**: Use the focus-ring utility or ensure focus styles are applied.

```tsx
// ✅ Correct
<button className="focus-ring">
  Button
</button>
```

### Issue: Transitions feel abrupt

**Solution**: Use the smooth transition utilities.

```tsx
// ❌ Wrong
<div className="transition">

// ✅ Correct
<div className="transition-smooth">
```

### Issue: Component doesn't match design

**Solution**: Check the component documentation in DESIGN_SYSTEM.md for correct props and usage.

---

## Testing Checklist

After migrating a component or page:

- [ ] Test in light theme
- [ ] Test in dark theme
- [ ] Test theme switching (smooth transition)
- [ ] Test all interactive states (hover, focus, active, disabled)
- [ ] Test keyboard navigation
- [ ] Test on mobile viewport
- [ ] Test on tablet viewport
- [ ] Test on desktop viewport
- [ ] Verify color contrast (WCAG AA)
- [ ] Test with screen reader (if applicable)

---

## Migration Examples

### Example 1: Dashboard Card

#### Before

```tsx
<div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
    Total Balance
  </h3>
  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
    $12,345.67
  </p>
  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
    +5.2% from last month
  </p>
</div>
```

#### After

```tsx
import { Card } from '@/components/ui/Card';

<Card variant="default" padding="md">
  <h3 className="text-lg font-semibold text-text-primary mb-2">
    Total Balance
  </h3>
  <p className="text-3xl font-bold text-blue-primary">
    $12,345.67
  </p>
  <p className="text-sm text-text-tertiary mt-2">
    +5.2% from last month
  </p>
</Card>
```

### Example 2: Transaction List Item

#### Before

```tsx
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750">
  <div>
    <p className="font-medium text-gray-900 dark:text-gray-100">
      Coffee Shop
    </p>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Today, 10:30 AM
    </p>
  </div>
  <div className="text-right">
    <p className="font-semibold text-red-600 dark:text-red-400">
      -$4.50
    </p>
    <span className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded">
      Completed
    </span>
  </div>
</div>
```

#### After

```tsx
import { Badge } from '@/components/ui/Badge';

<div className="flex items-center justify-between p-4 bg-surface-new-primary border-b border-border-primary hover:bg-bg-secondary transition-colors-smooth">
  <div>
    <p className="font-medium text-text-primary">
      Coffee Shop
    </p>
    <p className="text-sm text-text-tertiary">
      Today, 10:30 AM
    </p>
  </div>
  <div className="text-right">
    <p className="font-semibold text-red-text">
      -$4.50
    </p>
    <Badge variant="success" size="sm">
      Completed
    </Badge>
  </div>
</div>
```

### Example 3: Settings Form

#### Before

```tsx
<form className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Display Name
    </label>
    <input
      type="text"
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Email
    </label>
    <input
      type="email"
      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
    />
  </div>

  <div className="flex gap-3">
    <button
      type="submit"
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
    >
      Save Changes
    </button>
    <button
      type="button"
      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
    >
      Cancel
    </button>
  </div>
</form>
```

#### After

```tsx
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

<Card variant="default" padding="md">
  <form className="space-y-6">
    <Input
      label="Display Name"
      type="text"
    />

    <Input
      label="Email"
      type="email"
    />

    <div className="flex gap-3">
      <Button variant="primary" type="submit">
        Save Changes
      </Button>
      <Button variant="outline" type="button">
        Cancel
      </Button>
    </div>
  </form>
</Card>
```

---

## Quick Reference

### Color Token Cheat Sheet

| Use Case        | Token                           |
| --------------- | ------------------------------- |
| Page background | `bg-bg-primary`                 |
| Card background | `bg-surface-new-primary`        |
| Primary text    | `text-text-primary`             |
| Secondary text  | `text-text-secondary`           |
| Muted text      | `text-text-tertiary`            |
| Border          | `border-border-primary`         |
| Focus border    | `border-border-focus`           |
| Primary button  | `bg-blue-primary`               |
| Success         | `bg-green-bg text-green-text`   |
| Error           | `bg-red-bg text-red-text`       |
| Warning         | `bg-orange-bg text-orange-text` |

### Component Quick Reference

| Old Pattern   | New Component   |
| ------------- | --------------- |
| Custom button | `<Button>`      |
| Custom input  | `<Input>`       |
| Custom card   | `<Card>`        |
| Status badge  | `<Badge>`       |
| Theme toggle  | `<ThemeToggle>` |

---

## Need Help?

- Review [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for detailed component documentation
- Check component source code in `components/ui/`
- Review the design specification in `.kiro/specs/ui-refactor-smooth-design/design.md`
- Ask in the team design system channel

---

**Last Updated**: November 2025
**Version**: 1.0.0
