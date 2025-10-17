# CSS Optimization Guide

## Overview

This guide covers CSS optimization strategies for MD3 components to minimize bundle size and improve render performance.

## Tailwind CSS Optimization

### 1. JIT Mode (Just-In-Time)

Tailwind v4 uses JIT mode by default, which generates CSS on-demand:

**Benefits:**

- Smaller CSS bundle size
- Faster build times
- No need for PurgeCSS configuration

### 2. CSS Variables for Design Tokens

Use CSS variables instead of hardcoded values:

```css
/* ✅ Good - uses CSS variables */
.button {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
  border-radius: var(--md-sys-shape-corner-small);
}

/* ❌ Bad - hardcoded values */
.button {
  background: #6750a4;
  color: #ffffff;
  border-radius: 8px;
}
```

**Benefits:**

- Smaller CSS bundle (variables are defined once)
- Easier theme switching
- Better maintainability

### 3. Avoid Duplicate Styles

Use Tailwind's `@apply` directive sparingly:

```css
/* ❌ Bad - creates duplicate CSS */
.button-primary {
  @apply bg-primary text-on-primary rounded-lg px-6 py-3;
}

.button-secondary {
  @apply bg-secondary text-on-secondary rounded-lg px-6 py-3;
}

/* ✅ Good - use component variants instead */
```

Use `class-variance-authority` for component variants instead.

### 4. Critical CSS

Inline critical CSS for above-the-fold content:

```tsx
// In app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Critical CSS for above-the-fold content */
            :root {
              --md-sys-color-primary: #6750a4;
              --md-sys-color-on-primary: #ffffff;
            }
          `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 5. Remove Unused Utilities

Tailwind automatically removes unused utilities in production builds.

Verify by checking the build output:

```bash
pnpm build
# Check .next/static/css/*.css file sizes
```

## CSS Performance Best Practices

### 1. Minimize Specificity

Use low-specificity selectors:

```css
/* ✅ Good - low specificity */
.button {
  background: var(--md-sys-color-primary);
}

/* ❌ Bad - high specificity */
div.container > div.row > button.button-primary {
  background: var(--md-sys-color-primary);
}
```

### 2. Avoid Deep Nesting

Keep CSS nesting shallow:

```css
/* ✅ Good - shallow nesting */
.card {
  padding: 16px;
}

.card-header {
  margin-bottom: 12px;
}

/* ❌ Bad - deep nesting */
.card {
  padding: 16px;

  .card-header {
    margin-bottom: 12px;

    .card-title {
      font-size: 20px;

      .card-icon {
        margin-right: 8px;
      }
    }
  }
}
```

### 3. Use Shorthand Properties

Use CSS shorthand properties:

```css
/* ✅ Good - shorthand */
.element {
  margin: 16px 24px;
  padding: 8px 16px 12px;
}

/* ❌ Bad - longhand */
.element {
  margin-top: 16px;
  margin-right: 24px;
  margin-bottom: 16px;
  margin-left: 24px;
  padding-top: 8px;
  padding-right: 16px;
  padding-bottom: 12px;
  padding-left: 16px;
}
```

### 4. Combine Selectors

Combine selectors with shared styles:

```css
/* ✅ Good - combined selectors */
.button-primary,
.button-secondary,
.button-tertiary {
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 200ms;
}

/* ❌ Bad - duplicate styles */
.button-primary {
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 200ms;
}

.button-secondary {
  padding: 10px 24px;
  border-radius: 8px;
  transition: all 200ms;
}
```

## Animation CSS Optimization

### 1. Use Transform and Opacity

Only animate GPU-accelerated properties:

```css
/* ✅ Good - GPU accelerated */
.element {
  transition:
    transform 200ms,
    opacity 200ms;
}

.element:hover {
  transform: translateY(-2px);
  opacity: 0.8;
}

/* ❌ Bad - causes layout recalculation */
.element {
  transition:
    top 200ms,
    width 200ms;
}

.element:hover {
  top: -2px;
  width: 110%;
}
```

### 2. Use will-change Sparingly

Only use `will-change` when necessary:

```css
/* ✅ Good - used sparingly */
.dialog-entering {
  will-change: transform, opacity;
}

.dialog-entered {
  will-change: auto; /* Remove after animation */
}

/* ❌ Bad - overused */
.button,
.card,
.input,
.dialog {
  will-change: transform, opacity;
}
```

### 3. Use CSS Variables for Timing

Use MD3 motion tokens:

```css
/* ✅ Good - uses motion tokens */
.element {
  transition: transform var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

/* ❌ Bad - hardcoded values */
.element {
  transition: transform 100ms ease-in-out;
}
```

## Measurement

### Check CSS Bundle Size

```bash
# Build the project
pnpm build

# Check CSS file sizes
ls -lh .next/static/css/

# Expected: < 20KB gzipped
```

### Analyze CSS Coverage

Use Chrome DevTools Coverage tool:

1. Open Chrome DevTools
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Type "Coverage" and select "Show Coverage"
4. Click the record button
5. Navigate through your app
6. Stop recording
7. Check CSS coverage percentage

**Target:** > 80% CSS coverage

### Monitor CSS Performance

Use Lighthouse to check CSS performance:

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse http://localhost:3000 --view

# Check "Reduce unused CSS" metric
```

## Optimization Checklist

- [ ] Use CSS variables for design tokens
- [ ] Enable Tailwind JIT mode (default in v4)
- [ ] Remove unused CSS utilities
- [ ] Minimize CSS specificity
- [ ] Avoid deep nesting
- [ ] Use shorthand properties
- [ ] Combine selectors with shared styles
- [ ] Only animate transform and opacity
- [ ] Use will-change sparingly
- [ ] Use MD3 motion tokens
- [ ] Inline critical CSS
- [ ] Measure CSS bundle size (< 20KB gzipped)
- [ ] Check CSS coverage (> 80%)
- [ ] Run Lighthouse audit

## Resources

- [Tailwind CSS Performance](https://tailwindcss.com/docs/optimizing-for-production)
- [CSS Triggers](https://csstriggers.com/)
- [Web.dev CSS Performance](https://web.dev/css-performance/)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)
