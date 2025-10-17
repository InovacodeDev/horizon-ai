# Material Design 3 Design Token System

This directory contains the Material Design 3 (MD3) design token system for the Horizon AI application.

## Structure

```
src/styles/
├── tokens/
│   ├── colors.css       # MD3 color roles (primary, secondary, surface, etc.)
│   ├── typography.css   # MD3 type scale (display, headline, body, label)
│   ├── elevation.css    # MD3 elevation levels (shadows)
│   ├── shape.css        # MD3 shape scale (border radius)
│   ├── motion.css       # MD3 motion system (duration, easing)
│   └── state.css        # MD3 state layer opacities
├── md3.css              # Main entry point, imports all tokens
└── README.md            # This file
```

## Usage

### Importing Tokens

The MD3 tokens are automatically imported in `src/app/globals.css`:

```css
@import "../styles/md3.css";
```

### Using Tokens in Components

#### With Tailwind Classes

All MD3 tokens are exposed as Tailwind utilities with the `md-` prefix:

```tsx
// Colors
<div className="bg-md-primary text-md-on-primary">Primary Button</div>
<div className="bg-md-surface-container text-md-on-surface">Card</div>

// Shape (border radius)
<div className="rounded-md-md">Medium corners (12px)</div>
<div className="rounded-md-xl">Extra large corners (28px)</div>

// Elevation (shadows)
<div className="shadow-md-1">Elevation level 1</div>
<div className="shadow-md-3">Elevation level 3</div>
```

#### With CSS Variables

You can also use the raw CSS variables directly:

```tsx
<div
  style={{
    backgroundColor: "hsl(var(--md-sys-color-primary))",
    color: "hsl(var(--md-sys-color-on-primary))",
  }}
>
  Custom styled element
</div>
```

#### With Token Utilities

Use the token utility functions for programmatic access:

```tsx
import { tokens } from "@/lib/theme";

// Get color values
const primaryColor = tokens.colors.primary();
const surfaceColor = tokens.colors.surface();

// Get typography values
const headlineSize = tokens.typography.headlineLarge.size();
const bodyFont = tokens.typography.bodyLarge.font();

// Get elevation values
const elevation1 = tokens.elevation.level1();

// Get shape values
const mediumCorner = tokens.shape.medium();

// Get motion values
const standardEasing = tokens.motion.easing.standard();
const mediumDuration = tokens.motion.duration.medium1();

// Create state layers
const hoverLayer = tokens.createStateLayer(tokens.colors.primary(), tokens.state.hoverOpacity());
```

## Theme System

### ThemeProvider

The application uses a `ThemeProvider` to manage light/dark mode:

```tsx
import { ThemeProvider } from "@/lib/theme";

<ThemeProvider defaultTheme="system" storageKey="horizon-theme">
  {children}
</ThemeProvider>;
```

### useTheme Hook

Use the `useTheme` hook to access and control the theme:

```tsx
import { useTheme } from "@/lib/theme";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>Toggle theme</button>;
}
```

## Color Roles

MD3 uses semantic color roles instead of fixed colors:

- **Primary**: Main brand color, used for primary actions
- **Secondary**: Secondary brand color, used for less prominent actions
- **Tertiary**: Accent color for highlights and special elements
- **Error**: Error states and destructive actions
- **Surface**: Background surfaces (cards, sheets, dialogs)
- **Outline**: Borders and dividers

Each color role has corresponding "on-" colors for text/icons on that surface.

## Typography Scale

MD3 defines a type scale with three categories:

- **Display**: Largest text, used for hero sections (large, medium, small)
- **Headline**: Section headers (large, medium, small)
- **Title**: Subsection headers (large, medium, small)
- **Body**: Body text (large, medium, small)
- **Label**: UI labels and buttons (large, medium, small)

## Elevation Levels

MD3 uses 6 elevation levels (0-5):

- **Level 0**: No elevation (flat)
- **Level 1**: Subtle elevation (cards, chips)
- **Level 2**: Medium elevation (menus, search bars)
- **Level 3**: High elevation (dialogs, snackbars)
- **Level 4**: Higher elevation (navigation drawers)
- **Level 5**: Highest elevation (modal dialogs)

## Shape Scale

MD3 defines corner radius values:

- **None**: 0px (sharp corners)
- **Extra Small**: 4px (small chips, badges)
- **Small**: 8px (chips, small buttons)
- **Medium**: 12px (cards, standard buttons)
- **Large**: 16px (large cards, FABs)
- **Extra Large**: 28px (dialogs, bottom sheets)
- **Full**: 9999px (pills, circular elements)

## Motion System

MD3 provides duration and easing tokens for animations:

### Duration

- **Short**: 50-200ms (micro-interactions)
- **Medium**: 250-400ms (standard transitions)
- **Long**: 450-600ms (complex animations)
- **Extra Long**: 700-1000ms (page transitions)

### Easing

- **Standard**: Default easing for most transitions
- **Emphasized**: More pronounced easing for important transitions
- **Legacy**: Compatibility with Material Design 2
- **Linear**: Constant speed (for continuous animations)

## State Layers

MD3 uses state layers to indicate interactive states:

- **Hover**: 0.08 opacity
- **Focus**: 0.12 opacity
- **Pressed**: 0.12 opacity
- **Dragged**: 0.16 opacity

Apply state layers using the `createStateLayer` utility:

```tsx
const hoverStyle = {
  backgroundColor: tokens.createStateLayer(tokens.colors.primary(), tokens.state.hoverOpacity()),
};
```

## Best Practices

1. **Always use color roles**, not fixed colors
2. **Use the type scale** for consistent typography
3. **Apply appropriate elevation** for visual hierarchy
4. **Use shape tokens** for consistent corner radius
5. **Apply motion tokens** for smooth, consistent animations
6. **Use state layers** for interactive feedback

## Resources

- [Material Design 3 Guidelines](https://m3.material.io/)
- [MD3 Color System](https://m3.material.io/styles/color/overview)
- [MD3 Typography](https://m3.material.io/styles/typography/overview)
- [MD3 Elevation](https://m3.material.io/styles/elevation/overview)
