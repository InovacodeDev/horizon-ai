# Navigation Bar Component

Material Design 3 compliant navigation bar component for primary navigation.

## Overview

The Navigation Bar component implements MD3 specifications for bottom or top navigation patterns. It's typically used for primary navigation in mobile applications (bottom) or as an alternative desktop navigation pattern (top).

## Features

- ✅ MD3 compliant design with 80px height
- ✅ Active indicator with pill shape and primary color
- ✅ State layers for hover, focus, and pressed states
- ✅ Badge support for notifications with customizable max values
- ✅ Full keyboard navigation (Tab, Arrow keys, Home, End)
- ✅ Responsive positioning (top/bottom)
- ✅ Ripple effects on interaction
- ✅ Full accessibility support (ARIA attributes, screen reader friendly)
- ✅ Light and dark mode support

## Usage

### Basic Example

```tsx
import { NavigationBar, NavigationBarItem } from "@/components/ui/navigation-bar";
import { Home, Search, Bell, User } from "lucide-react";

function MyApp() {
  const [activeItem, setActiveItem] = useState("home");

  return (
    <NavigationBar position="bottom">
      <NavigationBarItem
        icon={<Home />}
        label="Home"
        active={activeItem === "home"}
        onClick={() => setActiveItem("home")}
      />
      <NavigationBarItem
        icon={<Search />}
        label="Search"
        active={activeItem === "search"}
        onClick={() => setActiveItem("search")}
      />
      <NavigationBarItem
        icon={<Bell />}
        label="Notifications"
        badge={5}
        active={activeItem === "notifications"}
        onClick={() => setActiveItem("notifications")}
      />
      <NavigationBarItem
        icon={<User />}
        label="Profile"
        active={activeItem === "profile"}
        onClick={() => setActiveItem("profile")}
      />
    </NavigationBar>
  );
}
```

### With Router Integration (Next.js)

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { NavigationBar, NavigationBarItem } from "@/components/ui/navigation-bar";
import { Home, Search, Bell, User } from "lucide-react";

const navItems = [
  { id: "home", label: "Home", icon: Home, href: "/dashboard" },
  { id: "search", label: "Search", icon: Search, href: "/search" },
  { id: "notifications", label: "Notifications", icon: Bell, href: "/notifications", badge: 5 },
  { id: "profile", label: "Profile", icon: User, href: "/profile" },
];

export function AppNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <NavigationBar position="bottom">
      {navItems.map((item) => (
        <NavigationBarItem
          key={item.id}
          icon={<item.icon />}
          label={item.label}
          badge={item.badge}
          active={pathname === item.href}
          onClick={() => router.push(item.href)}
        />
      ))}
    </NavigationBar>
  );
}
```

### With Large Badge Numbers

```tsx
<NavigationBar position="bottom">
  <NavigationBarItem
    icon={<Bell />}
    label="Notifications"
    badge={150}
    badgeMax={99} // Shows "99+"
    active={activeItem === "notifications"}
    onClick={() => setActiveItem("notifications")}
  />
</NavigationBar>
```

### Top Position (Desktop)

```tsx
<NavigationBar position="top">
  <NavigationBarItem
    icon={<Dashboard />}
    label="Dashboard"
    active={activeItem === "dashboard"}
    onClick={() => setActiveItem("dashboard")}
  />
  {/* More items... */}
</NavigationBar>
```

### Disabled State

```tsx
<NavigationBarItem icon={<Settings />} label="Settings" disabled onClick={() => {}} />
```

## API Reference

### NavigationBar

Container component for navigation items.

#### Props

| Prop        | Type                | Default    | Description                    |
| ----------- | ------------------- | ---------- | ------------------------------ |
| `position`  | `"top" \| "bottom"` | `"bottom"` | Position of the navigation bar |
| `children`  | `React.ReactNode`   | -          | Navigation bar items           |
| `className` | `string`            | -          | Additional CSS classes         |

### NavigationBarItem

Individual navigation item with icon, label, and optional badge.

#### Props

| Prop            | Type                      | Default | Description                            |
| --------------- | ------------------------- | ------- | -------------------------------------- |
| `icon`          | `React.ReactNode`         | -       | Icon element (required)                |
| `label`         | `string`                  | -       | Label text (required)                  |
| `active`        | `boolean`                 | `false` | Whether this item is active/selected   |
| `badge`         | `number \| string`        | -       | Badge content (number or text)         |
| `badgeMax`      | `number`                  | `99`    | Maximum badge value before showing "+" |
| `disableRipple` | `boolean`                 | `false` | Disable ripple effect                  |
| `disabled`      | `boolean`                 | `false` | Disable the item                       |
| `onClick`       | `(e: MouseEvent) => void` | -       | Click handler                          |
| `className`     | `string`                  | -       | Additional CSS classes                 |

## Keyboard Navigation

The Navigation Bar supports full keyboard navigation:

- **Tab**: Focus next item (follows browser tab order)
- **Arrow Left/Up**: Navigate to previous item
- **Arrow Right/Down**: Navigate to next item
- **Home**: Navigate to first item
- **End**: Navigate to last item
- **Enter/Space**: Activate focused item

## Accessibility

The component implements WCAG 2.1 AA standards:

- ✅ Proper ARIA roles (`tablist`, `tab`)
- ✅ ARIA states (`aria-selected`, `aria-label`)
- ✅ Keyboard navigation support
- ✅ Focus indicators
- ✅ Screen reader friendly badge announcements
- ✅ Color contrast ratios meet minimum requirements

### Screen Reader Announcements

- Navigation items announce as "Home, tab, selected" or "Search, tab, not selected"
- Badges announce as "5 notifications" when focused

## Design Specifications

### Dimensions

- **Container Height**: 80px (MD3 specification)
- **Item Min Width**: 64px
- **Item Max Width**: 168px
- **Icon Size**: 24x24px
- **Badge Min Width**: 16px
- **Badge Height**: 16px

### Colors

- **Active Indicator**: `secondary-container`
- **Active Icon/Label**: `on-secondary-container` / `on-surface`
- **Inactive Icon**: `on-surface-variant`
- **Inactive Label**: `on-surface-variant`
- **Badge Background**: `error`
- **Badge Text**: `on-error`

### Typography

- **Label**: Label Medium (12px, 500 weight, 0.5px tracking)
- **Badge**: Label Small (10px, 500 weight)

### Motion

- **State Transitions**: 200ms with standard easing
- **Active Indicator**: 300ms with emphasized easing
- **Badge Appearance**: 200ms with standard easing

## Best Practices

### Do's ✅

- Use 3-5 navigation items for optimal usability
- Provide clear, concise labels (1-2 words)
- Use recognizable icons that match labels
- Keep badge numbers meaningful (avoid showing 0)
- Use bottom position for mobile, consider top for desktop
- Maintain consistent navigation across the app

### Don'ts ❌

- Don't use more than 5 items (consider a drawer for more options)
- Don't use ambiguous icons
- Don't show badges for every item
- Don't change navigation items dynamically
- Don't use long labels that wrap
- Don't mix navigation patterns in the same app

## Examples

### Mobile App Pattern

```tsx
// Bottom navigation for mobile app
<div className="flex flex-col h-screen">
  <main className="flex-1 overflow-auto">{/* Content */}</main>
  <NavigationBar position="bottom">
    <NavigationBarItem icon={<Home />} label="Home" active />
    <NavigationBarItem icon={<Search />} label="Search" />
    <NavigationBarItem icon={<Bell />} label="Alerts" badge={3} />
    <NavigationBarItem icon={<User />} label="Profile" />
  </NavigationBar>
</div>
```

### Desktop App Pattern

```tsx
// Top navigation for desktop app
<div className="flex flex-col h-screen">
  <NavigationBar position="top">
    <NavigationBarItem icon={<Dashboard />} label="Dashboard" active />
    <NavigationBarItem icon={<Analytics />} label="Analytics" />
    <NavigationBarItem icon={<Reports />} label="Reports" />
    <NavigationBarItem icon={<Settings />} label="Settings" />
  </NavigationBar>
  <main className="flex-1 overflow-auto">{/* Content */}</main>
</div>
```

## Related Components

- **Navigation Drawer**: For secondary navigation or more items
- **App Bar**: For top app bar with title and actions
- **Tabs**: For content organization within a page

## Migration from Old Components

If you're migrating from a custom navigation component:

```tsx
// Old pattern
<nav className="flex justify-around">
  <button className={isActive ? "active" : ""}>
    <Icon />
    <span>Label</span>
  </button>
</nav>

// New MD3 pattern
<NavigationBar position="bottom">
  <NavigationBarItem
    icon={<Icon />}
    label="Label"
    active={isActive}
    onClick={handleClick}
  />
</NavigationBar>
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

## Performance

- Lightweight: ~2KB gzipped
- No layout shifts
- Optimized animations (GPU-accelerated)
- Minimal re-renders with proper React patterns
