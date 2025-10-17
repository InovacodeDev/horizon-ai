# Navigation Drawer Component

## Overview

The Navigation Drawer component implements Material Design 3 specifications for side navigation. It provides a flexible and accessible way to display navigation items in a drawer that can be opened and closed.

## Features

- **Two Variants**: Modal (256px with backdrop) and Standard (360px persistent)
- **Active Indicator**: Rounded rectangle shape with secondary container color
- **State Layers**: Visual feedback for hover, focus, and pressed states
- **Nested Navigation**: Expandable sections for organizing navigation items
- **Header & Footer Slots**: Customizable header and footer areas
- **Elevation**: Level 1 elevation for modal variant
- **Animations**: Smooth open/close animations with MD3 easing curves
- **Keyboard Navigation**: Full keyboard support with focus management
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA attributes
- **Badge Support**: Display notification counts on navigation items
- **Bidirectional**: Support for left and right side drawers

## Variants

### Modal Variant

- Width: 256px
- Includes backdrop overlay
- Elevation level 1
- Closes when clicking backdrop or pressing Escape
- Best for mobile or temporary navigation

### Standard Variant

- Width: 360px
- No backdrop overlay
- Persistent (stays visible)
- Border instead of elevation
- Best for desktop or permanent navigation

## Components

### NavigationDrawer

Main container component that wraps all drawer content.

**Props:**

| Prop           | Type                      | Default   | Description                                 |
| -------------- | ------------------------- | --------- | ------------------------------------------- |
| `open`         | `boolean`                 | -         | Whether the drawer is open (required)       |
| `onOpenChange` | `(open: boolean) => void` | -         | Callback when open state changes (required) |
| `variant`      | `"modal" \| "standard"`   | `"modal"` | Drawer variant                              |
| `side`         | `"left" \| "right"`       | `"left"`  | Side of the screen where drawer appears     |
| `children`     | `React.ReactNode`         | -         | Drawer content                              |
| `className`    | `string`                  | -         | Additional CSS classes                      |

### NavigationDrawerHeader

Optional header section for the drawer.

**Props:**

| Prop        | Type              | Default | Description            |
| ----------- | ----------------- | ------- | ---------------------- |
| `children`  | `React.ReactNode` | -       | Header content         |
| `className` | `string`          | -       | Additional CSS classes |

### NavigationDrawerContent

Main content area containing navigation items.

**Props:**

| Prop        | Type              | Default | Description                   |
| ----------- | ----------------- | ------- | ----------------------------- |
| `children`  | `React.ReactNode` | -       | Navigation items and sections |
| `className` | `string`          | -       | Additional CSS classes        |

### NavigationDrawerFooter

Optional footer section for the drawer.

**Props:**

| Prop        | Type              | Default | Description            |
| ----------- | ----------------- | ------- | ---------------------- |
| `children`  | `React.ReactNode` | -       | Footer content         |
| `className` | `string`          | -       | Additional CSS classes |

### NavigationDrawerItem

Individual navigation item with icon, label, and optional badge.

**Props:**

| Prop            | Type               | Default | Description                            |
| --------------- | ------------------ | ------- | -------------------------------------- |
| `icon`          | `React.ReactNode`  | -       | Icon element                           |
| `label`         | `string`           | -       | Label text (required)                  |
| `active`        | `boolean`          | `false` | Whether this item is active/selected   |
| `badge`         | `number \| string` | -       | Badge content (number or text)         |
| `badgeMax`      | `number`           | `99`    | Maximum badge value before showing "+" |
| `disableRipple` | `boolean`          | `false` | Disable ripple effect                  |
| `indent`        | `number`           | `0`     | Indentation level for nested items     |
| `disabled`      | `boolean`          | `false` | Disable the item                       |
| `onClick`       | `() => void`       | -       | Click handler                          |
| `className`     | `string`           | -       | Additional CSS classes                 |

### NavigationDrawerSection

Expandable section for grouping navigation items.

**Props:**

| Prop              | Type              | Default | Description                               |
| ----------------- | ----------------- | ------- | ----------------------------------------- |
| `label`           | `string`          | -       | Section label (required)                  |
| `icon`            | `React.ReactNode` | -       | Icon for the section header               |
| `defaultExpanded` | `boolean`         | `true`  | Whether the section is initially expanded |
| `children`        | `React.ReactNode` | -       | Nested navigation items                   |
| `className`       | `string`          | -       | Additional CSS classes                    |

## Usage Examples

### Basic Modal Drawer

```tsx
import {
  NavigationDrawer,
  NavigationDrawerHeader,
  NavigationDrawerContent,
  NavigationDrawerItem,
} from "@/components/ui/navigation-drawer";
import { Home, Search, Settings } from "lucide-react";

function MyComponent() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>Open Menu</button>

      <NavigationDrawer open={open} onOpenChange={setOpen} variant="modal">
        <NavigationDrawerHeader>
          <h2>Navigation</h2>
        </NavigationDrawerHeader>

        <NavigationDrawerContent>
          <NavigationDrawerItem icon={<Home />} label="Home" active onClick={() => navigate("/home")} />
          <NavigationDrawerItem icon={<Search />} label="Search" onClick={() => navigate("/search")} />
          <NavigationDrawerItem icon={<Settings />} label="Settings" onClick={() => navigate("/settings")} />
        </NavigationDrawerContent>
      </NavigationDrawer>
    </>
  );
}
```

### Standard Persistent Drawer

```tsx
function MyLayout() {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex h-screen">
      <NavigationDrawer open={open} onOpenChange={setOpen} variant="standard">
        <NavigationDrawerContent>
          <NavigationDrawerItem icon={<Home />} label="Home" active />
          <NavigationDrawerItem icon={<Search />} label="Search" />
        </NavigationDrawerContent>
      </NavigationDrawer>

      <main className="flex-1">{/* Main content */}</main>
    </div>
  );
}
```

### With Nested Sections

```tsx
import { NavigationDrawerSection } from "@/components/ui/navigation-drawer";

<NavigationDrawer open={open} onOpenChange={setOpen}>
  <NavigationDrawerContent>
    <NavigationDrawerItem icon={<Home />} label="Home" active />

    <NavigationDrawerSection label="Settings" icon={<Settings />}>
      <NavigationDrawerItem icon={<User />} label="Profile" />
      <NavigationDrawerItem icon={<Shield />} label="Security" />
      <NavigationDrawerItem icon={<Palette />} label="Appearance" />
    </NavigationDrawerSection>

    <NavigationDrawerItem icon={<HelpCircle />} label="Help" />
  </NavigationDrawerContent>
</NavigationDrawer>;
```

### With Badges

```tsx
<NavigationDrawerItem
  icon={<Bell />}
  label="Notifications"
  badge={5}
  onClick={() => navigate('/notifications')}
/>

<NavigationDrawerItem
  icon={<Message />}
  label="Messages"
  badge="New"
  onClick={() => navigate('/messages')}
/>

<NavigationDrawerItem
  icon={<Inbox />}
  label="Inbox"
  badge={150}
  badgeMax={99}
  onClick={() => navigate('/inbox')}
/>
```

### With Header and Footer

```tsx
<NavigationDrawer open={open} onOpenChange={setOpen}>
  <NavigationDrawerHeader>
    <div className="flex items-center gap-3">
      <Avatar src="/avatar.jpg" />
      <div>
        <p className="font-medium">John Doe</p>
        <p className="text-sm text-muted">john@example.com</p>
      </div>
    </div>
  </NavigationDrawerHeader>

  <NavigationDrawerContent>{/* Navigation items */}</NavigationDrawerContent>

  <NavigationDrawerFooter>
    <p className="text-xs text-muted">Version 1.0.0</p>
  </NavigationDrawerFooter>
</NavigationDrawer>
```

### Right-Side Drawer

```tsx
<NavigationDrawer open={open} onOpenChange={setOpen} variant="modal" side="right">
  <NavigationDrawerContent>
    <NavigationDrawerItem icon={<Bell />} label="Notifications" />
    <NavigationDrawerItem icon={<Settings />} label="Settings" />
  </NavigationDrawerContent>
</NavigationDrawer>
```

## Keyboard Navigation

The Navigation Drawer supports full keyboard navigation:

- **Tab**: Navigate between drawer items
- **Enter/Space**: Activate the focused item
- **Escape**: Close modal drawer
- **Arrow Up/Down**: Navigate between items (when focused)

## Accessibility

The component follows WCAG 2.1 AA guidelines:

- Proper ARIA roles (`navigation`, `menuitem`)
- ARIA attributes (`aria-current`, `aria-expanded`, `aria-label`)
- Keyboard navigation support
- Focus management and focus trap (modal variant)
- Screen reader announcements
- Sufficient color contrast ratios
- Visible focus indicators

## Design Tokens

The component uses the following MD3 design tokens:

### Colors

- `--md-sys-color-surface-container-low`: Drawer background
- `--md-sys-color-on-surface`: Text color
- `--md-sys-color-on-surface-variant`: Secondary text color
- `--md-sys-color-secondary-container`: Active indicator background
- `--md-sys-color-on-secondary-container`: Active indicator text
- `--md-sys-color-outline-variant`: Border color
- `--md-sys-color-scrim`: Backdrop color (modal variant)
- `--md-sys-color-error`: Badge background
- `--md-sys-color-on-error`: Badge text

### Elevation

- `--md-sys-elevation-level1`: Modal drawer shadow

### Shape

- `--md-sys-shape-corner-large`: Drawer border radius (16px)
- `--md-sys-shape-corner-full`: Active indicator and badge radius

### Motion

- `--md-sys-motion-duration-short2`: Quick transitions (100ms)
- `--md-sys-motion-duration-medium2`: Standard transitions (300ms)
- `--md-sys-motion-duration-medium4`: Drawer open/close (400ms)
- `--md-sys-motion-easing-standard`: Standard easing curve
- `--md-sys-motion-easing-emphasized`: Emphasized easing curve
- `--md-sys-motion-easing-emphasized-decelerate`: Decelerate easing

### Typography

- `--md-sys-typescale-label-large`: Navigation item labels
- `--md-sys-typescale-title-small`: Section headers

## Best Practices

1. **Use Modal for Mobile**: Modal variant works best on mobile devices where screen space is limited
2. **Use Standard for Desktop**: Standard variant works well on desktop for persistent navigation
3. **Limit Nesting**: Keep navigation hierarchy shallow (max 2 levels) for better usability
4. **Active Indicator**: Always mark the current page/section as active
5. **Badge Usage**: Use badges sparingly for important notifications only
6. **Icon Consistency**: Use consistent icon style throughout the drawer
7. **Section Organization**: Group related items in sections for better organization
8. **Responsive Design**: Consider switching between variants based on screen size

## Related Components

- [Navigation Bar](./navigation-bar.md) - Bottom/top navigation bar
- [Button](./button.md) - Used for actions in header/footer
- [State Layer](./state-layer.md) - Interactive state feedback

## References

- [Material Design 3 - Navigation Drawer](https://m3.material.io/components/navigation-drawer/overview)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
