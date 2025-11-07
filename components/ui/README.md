# UI Component Library

This directory contains the base UI components for the Horizon AI Design System. All components support both light and dark themes automatically.

## Components

- [Button](#button)
- [Input](#input)
- [Card](#card)
- [Badge](#badge)
- [Modal](#modal)
- [Dropdown](#dropdown)
- [Tooltip](#tooltip)
- [Toast](#toast)
- [Spinner](#spinner)
- [Skeleton](#skeleton)
- [ThemeToggle](#themetoggle)

---

## Button

A versatile button component with multiple variants, sizes, and states.

### Import

```tsx
import { Button } from '@/components/ui/Button';
```

### Props

| Prop        | Type                                                           | Default     | Description                  |
| ----------- | -------------------------------------------------------------- | ----------- | ---------------------------- |
| `variant`   | `'primary' \| 'secondary' \| 'outline' \| 'ghost' \| 'danger'` | `'primary'` | Button style variant         |
| `size`      | `'sm' \| 'md' \| 'lg'`                                         | `'md'`      | Button size                  |
| `leftIcon`  | `React.ReactNode`                                              | -           | Icon to display on the left  |
| `rightIcon` | `React.ReactNode`                                              | -           | Icon to display on the right |
| `loading`   | `boolean`                                                      | `false`     | Show loading spinner         |
| `disabled`  | `boolean`                                                      | `false`     | Disable the button           |
| `className` | `string`                                                       | -           | Additional CSS classes       |
| `onClick`   | `() => void`                                                   | -           | Click handler                |

### Examples

#### Basic Usage

```tsx
<Button variant="primary">
  Click Me
</Button>
```

#### All Variants

```tsx
<div className="flex gap-3">
  <Button variant="primary">Primary</Button>
  <Button variant="secondary">Secondary</Button>
  <Button variant="outline">Outline</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="danger">Danger</Button>
</div>
```

#### All Sizes

```tsx
<div className="flex items-center gap-3">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
</div>
```

#### With Icons

```tsx
import { PlusIcon, ArrowRightIcon } from '@/components/assets/Icons';

<div className="flex gap-3">
  <Button leftIcon={<PlusIcon />}>
    Add Item
  </Button>
  <Button rightIcon={<ArrowRightIcon />}>
    Continue
  </Button>
</div>
```

#### Loading State

```tsx
<Button loading>
  Processing...
</Button>
```

#### Disabled State

```tsx
<Button disabled>
  Disabled Button
</Button>
```

---

## Input

A flexible input component with support for labels, icons, error states, and password visibility toggle.

### Import

```tsx
import { Input } from '@/components/ui/Input';
```

### Props

| Prop         | Type              | Default  | Description              |
| ------------ | ----------------- | -------- | ------------------------ |
| `label`      | `string`          | -        | Input label              |
| `leftIcon`   | `React.ReactNode` | -        | Icon on the left side    |
| `rightIcon`  | `React.ReactNode` | -        | Icon on the right side   |
| `error`      | `string`          | -        | Error message to display |
| `helperText` | `string`          | -        | Helper text below input  |
| `type`       | `string`          | `'text'` | Input type               |
| `disabled`   | `boolean`         | `false`  | Disable the input        |
| `className`  | `string`          | -        | Additional CSS classes   |

### Examples

#### Basic Usage

```tsx
<Input
  label="Email"
  type="email"
  placeholder="Enter your email"
/>
```

#### With Left Icon

```tsx
import { SearchIcon } from '@/components/assets/Icons';

<Input
  leftIcon={<SearchIcon />}
  placeholder="Search..."
/>
```

#### With Error

```tsx
<Input
  label="Username"
  error="Username is required"
  value={username}
  onChange={(e) => setUsername(e.target.value)}
/>
```

#### With Helper Text

```tsx
<Input
  label="Password"
  type="password"
  helperText="Must be at least 8 characters"
/>
```

#### Password Input (Auto Toggle)

```tsx
<Input
  label="Password"
  type="password"
  placeholder="Enter password"
/>
// Automatically includes show/hide toggle
```

#### Disabled State

```tsx
<Input
  label="Account ID"
  value="12345"
  disabled
/>
```

#### Full Form Example

```tsx
<form className="space-y-4">
  <Input
    label="Full Name"
    placeholder="John Doe"
  />
  <Input
    label="Email"
    type="email"
    placeholder="john@example.com"
  />
  <Input
    label="Password"
    type="password"
    helperText="At least 8 characters"
  />
  <Button variant="primary" type="submit">
    Sign Up
  </Button>
</form>
```

---

## Card

A container component for grouping related content with multiple variants.

### Import

```tsx
import { Card } from '@/components/ui/Card';
```

### Props

| Prop        | Type                                                 | Default     | Description                            |
| ----------- | ---------------------------------------------------- | ----------- | -------------------------------------- |
| `variant`   | `'default' \| 'elevated' \| 'flat' \| 'interactive'` | `'default'` | Card style variant                     |
| `padding`   | `'none' \| 'sm' \| 'md' \| 'lg'`                     | `'md'`      | Internal padding                       |
| `className` | `string`                                             | -           | Additional CSS classes                 |
| `onClick`   | `() => void`                                         | -           | Click handler (makes card interactive) |

### Examples

#### Basic Usage

```tsx
<Card>
  <h3 className="text-lg font-semibold mb-2">Card Title</h3>
  <p className="text-text-secondary">Card content goes here</p>
</Card>
```

#### All Variants

```tsx
<div className="grid grid-cols-2 gap-4">
  <Card variant="default">
    <p>Default (with border)</p>
  </Card>
  <Card variant="elevated">
    <p>Elevated (with shadow)</p>
  </Card>
  <Card variant="flat">
    <p>Flat (no border/shadow)</p>
  </Card>
  <Card variant="interactive">
    <p>Interactive (hover effect)</p>
  </Card>
</div>
```

#### All Padding Sizes

```tsx
<div className="space-y-4">
  <Card padding="none">
    <div className="bg-blue-light h-20" />
    <div className="p-4">No padding on card</div>
  </Card>
  <Card padding="sm">
    Small padding (16px)
  </Card>
  <Card padding="md">
    Medium padding (24px)
  </Card>
  <Card padding="lg">
    Large padding (32px)
  </Card>
</div>
```

#### Interactive Card

```tsx
<Card onClick={() => console.log('Clicked!')}>
  <h3 className="font-semibold">Clickable Card</h3>
  <p className="text-text-secondary">Click me to see the effect</p>
</Card>
```

#### Dashboard Card Example

```tsx
<Card variant="elevated">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold">Total Balance</h3>
    <Badge variant="success">+5.2%</Badge>
  </div>
  <p className="text-3xl font-bold text-blue-primary">
    $12,345.67
  </p>
  <p className="text-sm text-text-tertiary mt-2">
    Updated 5 minutes ago
  </p>
</Card>
```

---

## Badge

A small label component for status indicators and tags.

### Import

```tsx
import { Badge } from '@/components/ui/Badge';
```

### Props

| Prop        | Type                                                       | Default     | Description            |
| ----------- | ---------------------------------------------------------- | ----------- | ---------------------- |
| `variant`   | `'success' \| 'warning' \| 'error' \| 'info' \| 'neutral'` | `'neutral'` | Badge color scheme     |
| `size`      | `'sm' \| 'md'`                                             | `'md'`      | Badge size             |
| `className` | `string`                                                   | -           | Additional CSS classes |

### Examples

#### Basic Usage

```tsx
<Badge variant="success">Active</Badge>
```

#### All Variants

```tsx
<div className="flex gap-2">
  <Badge variant="success">Success</Badge>
  <Badge variant="warning">Warning</Badge>
  <Badge variant="error">Error</Badge>
  <Badge variant="info">Info</Badge>
  <Badge variant="neutral">Neutral</Badge>
</div>
```

#### All Sizes

```tsx
<div className="flex items-center gap-2">
  <Badge variant="success" size="sm">Small</Badge>
  <Badge variant="success" size="md">Medium</Badge>
</div>
```

#### Status Indicators

```tsx
<div className="space-y-2">
  <div className="flex items-center justify-between">
    <span>Payment Status</span>
    <Badge variant="success">Completed</Badge>
  </div>
  <div className="flex items-center justify-between">
    <span>Verification</span>
    <Badge variant="warning">Pending</Badge>
  </div>
  <div className="flex items-center justify-between">
    <span>Subscription</span>
    <Badge variant="error">Expired</Badge>
  </div>
</div>
```

#### Tag List

```tsx
<div className="flex flex-wrap gap-2">
  <Badge variant="info">React</Badge>
  <Badge variant="info">TypeScript</Badge>
  <Badge variant="info">Tailwind</Badge>
  <Badge variant="info">Next.js</Badge>
</div>
```

---

## Modal

A dialog component for displaying content in an overlay.

### Import

```tsx
import { Modal } from '@/components/ui/Modal';
```

### Props

| Prop       | Type                           | Default | Description              |
| ---------- | ------------------------------ | ------- | ------------------------ |
| `isOpen`   | `boolean`                      | -       | Control modal visibility |
| `onClose`  | `() => void`                   | -       | Close handler            |
| `title`    | `string`                       | -       | Modal title              |
| `children` | `React.ReactNode`              | -       | Modal content            |
| `size`     | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'`  | Modal width              |

### Examples

#### Basic Usage

```tsx
const [isOpen, setIsOpen] = useState(false);

<>
  <Button onClick={() => setIsOpen(true)}>
    Open Modal
  </Button>

  <Modal
    isOpen={isOpen}
    onClose={() => setIsOpen(false)}
    title="Modal Title"
  >
    <p className="text-text-secondary">
      Modal content goes here
    </p>
  </Modal>
</>
```

#### Confirmation Dialog

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Confirm Delete"
  size="sm"
>
  <p className="text-text-secondary mb-6">
    Are you sure you want to delete this item? This action cannot be undone.
  </p>
  <div className="flex gap-3 justify-end">
    <Button variant="outline" onClick={onClose}>
      Cancel
    </Button>
    <Button variant="danger" onClick={handleDelete}>
      Delete
    </Button>
  </div>
</Modal>
```

#### Form Modal

```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Add New Item"
>
  <form className="space-y-4">
    <Input label="Name" />
    <Input label="Description" />
    <div className="flex gap-3 justify-end mt-6">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button variant="primary" type="submit">
        Save
      </Button>
    </div>
  </form>
</Modal>
```

---

## ThemeToggle

A button component for switching between light and dark themes.

### Import

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';
```

### Props

No props required. The component manages theme state internally.

### Examples

#### Basic Usage

```tsx
<ThemeToggle />
```

#### In Header

```tsx
<header className="flex items-center justify-between p-4">
  <h1>My App</h1>
  <ThemeToggle />
</header>
```

---

## Utility Classes

### Transition Classes

```tsx
// Smooth transitions
<div className="transition-smooth">
<div className="transition-smooth-200">
<div className="transition-colors-smooth">
<div className="transition-transform-smooth">
<div className="transition-shadow-smooth">
```

### Focus Classes

```tsx
// Focus ring
<button className="focus-ring">
<input className="focus-ring-inset">
```

### Interactive Classes

```tsx
// Hover lift effect
<div className="interactive-lift">

// Active scale effect
<button className="interactive-scale">
```

### Card Pattern Classes

```tsx
// Pre-built card patterns
<div className="card-base">
<div className="card-elevated">
<div className="card-interactive">
```

### Button Pattern Classes

```tsx
// Pre-built button patterns
<button className="btn-base">
<button className="btn-primary">
<button className="btn-secondary">
<button className="btn-outline">
<button className="btn-ghost">
```

### Badge Pattern Classes

```tsx
// Pre-built badge patterns
<span className="badge-base">
<span className="badge-success">
<span className="badge-error">
<span className="badge-warning">
<span className="badge-info">
```

---

## Best Practices

### Do's ✅

1. **Use design tokens** for colors instead of hardcoded values

   ```tsx
   <div className="bg-surface-new-primary text-text-primary">
   ```

2. **Use component props** instead of custom styling

   ```tsx
   <Button variant="primary" size="lg">
   ```

3. **Maintain spacing consistency** using the spacing scale

   ```tsx
   <div className="p-6 gap-4">
   ```

4. **Test in both themes** before committing
   ```tsx
   // Always verify light and dark mode
   ```

### Don'ts ❌

1. **Don't use hardcoded colors**

   ```tsx
   // ❌ Bad
   <div className="bg-white text-black">

   // ✅ Good
   <div className="bg-surface-new-primary text-text-primary">
   ```

2. **Don't bypass component APIs**

   ```tsx
   // ❌ Bad
   <button className="px-4 py-2 bg-blue-600 rounded">

   // ✅ Good
   <Button variant="primary">
   ```

3. **Don't use arbitrary values**

   ```tsx
   // ❌ Bad
   <div className="p-[23px] text-[15px]">

   // ✅ Good
   <div className="p-6 text-base">
   ```

---

## Accessibility

All components follow WCAG AA accessibility standards:

- ✅ Sufficient color contrast (4.5:1 for normal text)
- ✅ Visible focus indicators
- ✅ Keyboard navigation support
- ✅ Screen reader compatible
- ✅ Semantic HTML
- ✅ ARIA labels where needed

---

## Resources

- **Full Documentation**: [DESIGN_SYSTEM.md](../../docs/DESIGN_SYSTEM.md)
- **Migration Guide**: [MIGRATION_GUIDE.md](../../docs/MIGRATION_GUIDE.md)
- **Design Spec**: [design.md](../../.kiro/specs/ui-refactor-smooth-design/design.md)
- **Tailwind Config**: [tailwind.config.js](../../tailwind.config.js)
- **Global Styles**: [globals.css](../../app/globals.css)

---

**Last Updated**: November 2025
