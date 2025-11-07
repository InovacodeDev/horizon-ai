# Design Document - UI Refactor: Smooth & Clean Design

## Overview

This design document outlines the comprehensive refactoring of the Horizon AI application's user interface to achieve a smoother, cleaner, and more modern aesthetic. The refactor focuses on visual refinements including softer color palettes, improved spacing, refined typography, subtle shadows, and rounded corners, while maintaining the existing layout structure and functionality. A complete dark theme implementation is included, following the same design principles.

The design is inspired by modern financial applications that prioritize clarity, readability, and visual comfort. Key design principles include:

- **Softness**: Reduced color saturation, subtle borders, and diffused shadows
- **Consistency**: Unified spacing scale, typography system, and component patterns
- **Accessibility**: Sufficient contrast ratios, clear visual hierarchy, and readable text
- **Responsiveness**: Smooth transitions, hover states, and theme switching

## Architecture

### Design System Structure

```
Design System
├── Design Tokens (Tailwind Config + CSS Variables)
│   ├── Colors (Light & Dark palettes)
│   ├── Spacing (4px base scale)
│   ├── Typography (Font families, sizes, weights)
│   ├── Shadows (Soft, diffused effects)
│   └── Border Radius (Consistent rounding)
│
├── Theme Provider
│   ├── Theme Detection (System preference)
│   ├── Theme Persistence (Local storage)
│   └── Theme Switching (Smooth transitions)
│
└── Component Library
    ├── Base Components (Button, Input, Card, Badge)
    ├── Layout Components (Sidebar, Header, Container)
    └── Composite Components (Forms, Modals, Tables)
```

### Technology Stack

- **Styling**: Tailwind CSS with custom configuration
- **Theme Management**: CSS custom properties (variables) + React Context
- **State Persistence**: Local Storage API
- **Transitions**: CSS transitions and Tailwind utilities

## Components and Interfaces

### 1. Design Tokens System

#### Color Palette

**Light Mode Colors:**

```css
/* Backgrounds */
--bg-primary: #ffffff /* Main background */ --bg-secondary: #f8f9fa /* Secondary background */ --bg-tertiary: #f1f3f5
  /* Tertiary background */ /* Surfaces */ --surface-primary: #ffffff /* Cards, containers */
  --surface-secondary: #f8f9fa /* Elevated surfaces */ --surface-tertiary: #f1f3f5 /* Subtle surfaces */ /* Text */
  --text-primary: #1a1d1f /* Primary text */ --text-secondary: #6c757d /* Secondary text */ --text-tertiary: #adb5bd
  /* Muted text */ --text-disabled: #dee2e6 /* Disabled text */ /* Borders */ --border-primary: #e9ecef
  /* Subtle borders */ --border-secondary: #dee2e6 /* Medium borders */ --border-focus: #4f7cff /* Focus state */
  /* Brand Colors */ --blue-primary: #4f7cff /* Primary blue */ --blue-hover: #3d6ae8 /* Hover state */
  --blue-light: #ebf2ff /* Light background */ --blue-dark: #2952cc /* Dark variant */ /* Semantic Colors */
  --green-bg: #e8f5e9 /* Success background */ --green-text: #2e7d32 /* Success text */ --green-border: #81c784
  /* Success border */ --red-bg: #ffebee /* Error background */ --red-text: #c62828 /* Error text */
  --red-border: #e57373 /* Error border */ --orange-bg: #fff3e0 /* Warning background */ --orange-text: #e65100
  /* Warning text */ --orange-border: #ffb74d /* Warning border */ --blue-info-bg: #e3f2fd /* Info background */
  --blue-info-text: #1565c0 /* Info text */ --blue-info-border: #64b5f6 /* Info border */;
```

**Dark Mode Colors:**

```css
/* Backgrounds */
--bg-primary: #0f1419 /* Main background */ --bg-secondary: #1a1f26 /* Secondary background */ --bg-tertiary: #242a33
  /* Tertiary background */ /* Surfaces */ --surface-primary: #1a1f26 /* Cards, containers */
  --surface-secondary: #242a33 /* Elevated surfaces */ --surface-tertiary: #2e3440 /* Subtle surfaces */ /* Text */
  --text-primary: #e5e7eb /* Primary text */ --text-secondary: #9ca3af /* Secondary text */ --text-tertiary: #6b7280
  /* Muted text */ --text-disabled: #4b5563 /* Disabled text */ /* Borders */ --border-primary: #2e3440
  /* Subtle borders */ --border-secondary: #374151 /* Medium borders */ --border-focus: #5b8cff /* Focus state */
  /* Brand Colors */ --blue-primary: #5b8cff /* Primary blue (lighter for dark mode) */ --blue-hover: #7ba3ff
  /* Hover state */ --blue-light: #1e3a5f /* Light background */ --blue-dark: #4f7cff /* Dark variant */
  /* Semantic Colors */ --green-bg: #1b3a2f /* Success background */ --green-text: #6ee7b7 /* Success text */
  --green-border: #34d399 /* Success border */ --red-bg: #3a1f1f /* Error background */ --red-text: #fca5a5
  /* Error text */ --red-border: #f87171 /* Error border */ --orange-bg: #3a2f1f /* Warning background */
  --orange-text: #fcd34d /* Warning text */ --orange-border: #fbbf24 /* Warning border */ --blue-info-bg: #1f2937
  /* Info background */ --blue-info-text: #93c5fd /* Info text */ --blue-info-border: #60a5fa /* Info border */;
```

#### Spacing Scale

```javascript
spacing: {
  '0': '0px',
  '1': '4px',
  '2': '8px',
  '3': '12px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '10': '40px',
  '12': '48px',
  '16': '64px',
  '20': '80px',
  '24': '96px',
}
```

#### Typography System

```javascript
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
  mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace'],
}

fontSize: {
  'xs': ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
  'sm': ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
  'base': ['16px', { lineHeight: '24px', letterSpacing: '0' }],
  'lg': ['18px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
  'xl': ['20px', { lineHeight: '28px', letterSpacing: '-0.01em' }],
  '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.02em' }],
  '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.02em' }],
  '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
}

fontWeight: {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

#### Shadow System

```javascript
boxShadow: {
  'soft-xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
  'soft-sm': '0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
  'soft-md': '0 4px 8px 0 rgba(0, 0, 0, 0.05), 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
  'soft-lg': '0 8px 16px 0 rgba(0, 0, 0, 0.06), 0 4px 8px 0 rgba(0, 0, 0, 0.04)',
  'soft-xl': '0 12px 24px 0 rgba(0, 0, 0, 0.07), 0 6px 12px 0 rgba(0, 0, 0, 0.05)',
}
```

#### Border Radius

```javascript
borderRadius: {
  'none': '0',
  'sm': '4px',
  'DEFAULT': '8px',
  'md': '8px',
  'lg': '12px',
  'xl': '16px',
  '2xl': '20px',
  'full': '9999px',
}
```

### 2. Theme Provider Component

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: 'light' | 'dark';
  storageKey?: string;
}
```

**Functionality:**

- Detects system theme preference on initial load
- Persists user's theme choice in localStorage
- Provides theme context to all child components
- Applies theme class to document root element
- Handles smooth transitions between themes

### 3. Component Specifications

#### Button Component

**Variants:**

- `primary`: Filled blue button with white text
- `secondary`: Subtle gray background with dark text
- `outline`: Transparent with border
- `ghost`: Transparent without border
- `danger`: Red variant for destructive actions

**Sizes:**

- `sm`: 32px height, 12px horizontal padding
- `md`: 40px height, 16px horizontal padding (default)
- `lg`: 48px height, 20px horizontal padding

**States:**

- Default: Base styling
- Hover: Slight color shift, subtle shadow
- Active: Pressed appearance
- Disabled: Reduced opacity, no interaction
- Loading: Spinner icon, disabled state

**Styling:**

```css
/* Primary Button */
.btn-primary {
  background: var(--blue-primary);
  color: white;
  border-radius: 8px;
  font-weight: 500;
  transition: all 150ms ease;
}

.btn-primary:hover {
  background: var(--blue-hover);
  box-shadow: var(--soft-sm);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

#### Card Component

**Variants:**

- `default`: Standard card with border
- `elevated`: Card with shadow, no border
- `flat`: No border, no shadow
- `interactive`: Hover effects for clickable cards

**Styling:**

```css
.card {
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: 12px;
  padding: 24px;
  transition: all 200ms ease;
}

.card-elevated {
  box-shadow: var(--soft-md);
  border: none;
}

.card-interactive:hover {
  box-shadow: var(--soft-lg);
  transform: translateY(-2px);
}
```

#### Input Component

**States:**

- Default: Subtle border
- Focus: Blue border, subtle glow
- Error: Red border, error message
- Disabled: Reduced opacity, gray background
- Success: Green border (optional)

**Styling:**

```css
.input {
  height: 44px;
  padding: 0 16px;
  background: var(--surface-primary);
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  font-size: 14px;
  transition: all 150ms ease;
}

.input:focus {
  border-color: var(--border-focus);
  box-shadow: 0 0 0 3px rgba(79, 124, 255, 0.1);
  outline: none;
}

.input::placeholder {
  color: var(--text-tertiary);
}
```

#### Badge Component

**Variants:**

- `success`: Green color scheme
- `warning`: Orange color scheme
- `error`: Red color scheme
- `info`: Blue color scheme
- `neutral`: Gray color scheme

**Sizes:**

- `sm`: 20px height, 10px horizontal padding
- `md`: 24px height, 12px horizontal padding (default)

**Styling:**

```css
.badge-success {
  background: var(--green-bg);
  color: var(--green-text);
  border: 1px solid var(--green-border);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
}
```

### 4. Layout Components

#### Sidebar

**Styling Updates:**

- Background: `var(--surface-primary)` with subtle border
- Width: 240px (collapsed: 64px)
- Border: 1px solid `var(--border-primary)` on right edge
- Navigation items: Rounded corners (8px), hover background
- Active state: Blue background with white text
- Icons: 20px size, consistent spacing

#### Header

**Styling Updates:**

- Background: `var(--surface-primary)` with bottom border
- Height: 64px
- Border: 1px solid `var(--border-primary)` on bottom edge
- Search bar: Integrated input with icon
- User menu: Dropdown with soft shadow
- Theme toggle: Icon button with smooth transition

#### Container

**Spacing:**

- Page container: 32px padding on desktop, 16px on mobile
- Section spacing: 24px between major sections
- Content max-width: 1280px (centered)

## Data Models

### Theme Configuration

```typescript
interface ThemeConfig {
  colors: {
    light: ColorPalette;
    dark: ColorPalette;
  };
  spacing: SpacingScale;
  typography: TypographySystem;
  shadows: ShadowSystem;
  borderRadius: BorderRadiusScale;
}

interface ColorPalette {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  surface: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
  brand: {
    primary: string;
    hover: string;
    light: string;
    dark: string;
  };
  semantic: {
    success: SemanticColor;
    error: SemanticColor;
    warning: SemanticColor;
    info: SemanticColor;
  };
}

interface SemanticColor {
  bg: string;
  text: string;
  border: string;
}
```

### Theme State

```typescript
interface ThemeState {
  current: 'light' | 'dark';
  systemPreference: 'light' | 'dark';
  userPreference: 'light' | 'dark' | 'system';
}
```

## Error Handling

### Theme Loading Errors

**Scenario**: Theme preference cannot be loaded from localStorage
**Handling**: Fall back to system preference, log warning

**Scenario**: System preference detection fails
**Handling**: Default to light theme, log error

### CSS Variable Fallbacks

**Strategy**: Provide fallback values for all CSS custom properties

```css
background: var(--surface-primary, #ffffff);
color: var(--text-primary, #1a1d1f);
```

### Component Rendering Errors

**Strategy**: Use Error Boundaries to catch rendering errors in themed components
**Fallback**: Display unstyled but functional component

## Testing Strategy

### Visual Regression Testing

**Approach**: Capture screenshots of key components in both themes
**Tools**: Playwright or Chromatic for visual diff testing
**Coverage**:

- All base components (Button, Input, Card, Badge)
- Layout components (Sidebar, Header)
- Key pages (Dashboard, Transactions, Accounts)
- Both light and dark themes

### Accessibility Testing

**Contrast Ratios**:

- Test all text/background combinations
- Ensure WCAG AA compliance (4.5:1 for normal text, 3:1 for large text)
- Use automated tools (axe-core, Lighthouse)

**Keyboard Navigation**:

- Verify focus states are visible
- Test tab order and keyboard shortcuts
- Ensure theme toggle is keyboard accessible

### Theme Switching Testing

**Scenarios**:

- Toggle between light and dark themes
- Verify persistence across page reloads
- Test system preference detection
- Validate smooth transitions

### Component Testing

**Unit Tests**:

- Button: All variants, sizes, and states
- Input: Focus, error, disabled states
- Card: Hover effects, elevation
- Badge: All color variants

**Integration Tests**:

- Theme Provider: Context propagation
- Layout: Sidebar collapse, header interactions
- Forms: Input validation with styled components

### Browser Compatibility

**Target Browsers**:

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

**Testing Focus**:

- CSS custom properties support
- Smooth transitions
- Shadow rendering
- Border radius consistency

## Implementation Phases

### Phase 1: Design Tokens Setup

1. Update `tailwind.config.js` with new color palette, spacing, typography
2. Update `globals.css` with CSS custom properties for both themes
3. Add font imports (Inter for sans-serif)

### Phase 2: Theme Provider

1. Create `ThemeContext` and `ThemeProvider` components
2. Implement theme detection and persistence logic
3. Add theme toggle button component
4. Integrate provider into root layout

### Phase 3: Base Components

1. Refactor Button component with new styling
2. Refactor Input component with new styling
3. Refactor Card component with new styling
4. Refactor Badge component with new styling
5. Update other UI components (Modal, Dropdown, Tooltip, etc.)

### Phase 4: Layout Components

1. Update Sidebar styling and interactions
2. Update Header styling and theme toggle integration
3. Update page containers and spacing
4. Ensure responsive behavior

### Phase 5: Page-Level Updates

1. Apply new styling to Dashboard page
2. Apply new styling to Transactions page
3. Apply new styling to Accounts page
4. Apply new styling to remaining pages
5. Verify consistency across all pages

### Phase 6: Testing & Refinement

1. Conduct visual regression testing
2. Perform accessibility audits
3. Test theme switching functionality
4. Gather feedback and make adjustments
5. Document component usage patterns

## Design Decisions & Rationales

### Why CSS Custom Properties?

CSS custom properties (variables) allow for dynamic theme switching without JavaScript manipulation of styles. They provide:

- Runtime theme changes without page reload
- Better performance than inline styles
- Easier maintenance and consistency
- Native browser support

### Why Inter Font?

Inter is a modern, highly readable sans-serif font designed specifically for user interfaces:

- Excellent readability at small sizes
- Wide character set with proper OpenType features
- Free and open-source
- Optimized for digital screens

### Why Soft Shadows?

Soft, diffused shadows create a more modern and less harsh appearance:

- Multiple shadow layers for depth
- Low opacity values (3-7%)
- Larger blur radius for softer edges
- Consistent with modern design trends

### Why 8px Spacing Scale?

An 8px base spacing scale provides:

- Consistent rhythm and alignment
- Easy mental math for designers and developers
- Compatibility with common screen densities
- Flexibility for various component sizes

### Why Separate Light/Dark Palettes?

Rather than inverting colors, separate palettes allow for:

- Optimized contrast in each mode
- Better color choices for dark backgrounds
- Semantic color adjustments (e.g., lighter blues in dark mode)
- More control over the visual experience

## Accessibility Considerations

### Color Contrast

All text/background combinations meet WCAG AA standards:

- Normal text: Minimum 4.5:1 contrast ratio
- Large text (18px+): Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

### Focus Indicators

All interactive elements have visible focus states:

- Blue outline with subtle shadow
- Sufficient contrast against background
- Consistent across all components

### Reduced Motion

Respect user's motion preferences:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Screen Reader Support

- Semantic HTML elements
- ARIA labels for icon-only buttons
- Proper heading hierarchy
- Descriptive link text

## Performance Considerations

### CSS Optimization

- Use Tailwind's JIT mode for minimal CSS bundle
- Purge unused styles in production
- Minimize custom CSS in favor of utility classes

### Font Loading

- Use `font-display: swap` for web fonts
- Preload critical font files
- Subset fonts to include only necessary characters

### Theme Switching

- Use CSS custom properties for instant theme changes
- Avoid JavaScript style manipulation
- Minimize repaints and reflows

### Image Optimization

- Use appropriate image formats (WebP with fallbacks)
- Implement lazy loading for below-fold images
- Provide responsive image sizes

## Migration Strategy

### Backward Compatibility

- Maintain existing component APIs
- Provide fallbacks for legacy styles
- Gradual rollout page by page

### Developer Experience

- Document new design tokens and usage
- Provide component examples and guidelines
- Create Storybook stories for all components

### User Experience

- No breaking changes to functionality
- Smooth visual transition
- Optional theme preference (light/dark/system)
