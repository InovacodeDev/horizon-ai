# Performance Optimization Guide

This directory contains utilities and configurations for optimizing the performance of MD3 components.

## Overview

Performance optimization focuses on three key areas:

1. **Bundle Size** - Reducing JavaScript and CSS bundle sizes
2. **Render Performance** - Ensuring components render efficiently
3. **Animation Performance** - Maintaining 60fps for smooth animations

## Files

### `lazy-components.tsx`

Lazy-loaded versions of MD3 components for code splitting.

**Usage:**

```tsx
import { LazyDialog, LazyDialogContent } from "@/lib/performance/lazy-components";

function MyComponent() {
  return (
    <LazyDialog open={isOpen} onOpenChange={setIsOpen}>
      <LazyDialogContent>
        <p>This dialog is lazy-loaded!</p>
      </LazyDialogContent>
    </LazyDialog>
  );
}
```

**Benefits:**

- Reduces initial bundle size by ~20-30KB
- Improves Time to Interactive (TTI)
- Better Core Web Vitals scores

### `optimize-animations.ts`

Utilities for optimizing animation performance.

**Usage:**

```tsx
import {
  measureFPS,
  optimizeAnimation,
  prefersReducedMotion,
  getSafeAnimationDuration,
} from "@/lib/performance/optimize-animations";

// Measure FPS
const fps = await measureFPS(1000);
console.log(`Current FPS: ${fps}`);

// Respect user preferences
const duration = getSafeAnimationDuration(300);

// Optimize animation
const cancel = optimizeAnimation((progress) => {
  element.style.opacity = `${progress}`;
}, 300);
```

**Features:**

- FPS measurement and monitoring
- Hardware acceleration detection
- Reduced motion support
- Animation performance profiling

### `bundle-analyzer.config.js`

Configuration for bundle size analysis.

**Setup:**

1. Install bundle analyzer:

```bash
pnpm add -D @next/bundle-analyzer
```

2. Update `next.config.ts`:

```typescript
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer(nextConfig);
```

3. Run analysis:

```bash
ANALYZE=true pnpm build
```

## Performance Targets

### Bundle Size

| Component         | Target (gzipped) | Max (gzipped) |
| ----------------- | ---------------- | ------------- |
| Button            | 2KB              | 3KB           |
| Card              | 1.5KB            | 2KB           |
| TextField         | 3KB              | 4KB           |
| Dialog            | 5KB              | 6KB           |
| Navigation Drawer | 6KB              | 8KB           |
| **Total MD3**     | **50KB**         | **80KB**      |

### Render Performance

- **Target:** < 16ms per component (60fps)
- **Maximum:** < 32ms per component (30fps)
- **Re-renders:** < 8ms

### Animation Performance

- **Target FPS:** 60fps
- **Minimum FPS:** 30fps
- **Frame Budget:** 16.67ms per frame
- **Properties:** Use only `transform` and `opacity`

## Best Practices

### 1. Code Splitting

Use lazy loading for components that are not immediately visible:

```tsx
// ❌ Bad - loads everything upfront
import { Dialog } from "@/components/ui/dialog";

// ✅ Good - lazy loads when needed
import { LazyDialog } from "@/lib/performance/lazy-components";
```

### 2. Animation Optimization

Only animate GPU-accelerated properties:

```css
/* ✅ Good - GPU accelerated */
.element {
  transform: translateY(10px);
  opacity: 0.5;
}

/* ❌ Bad - causes layout recalculation */
.element {
  top: 10px;
  width: 100px;
}
```

### 3. CSS Optimization

Use CSS variables for design tokens:

```css
/* ✅ Good - uses CSS variables */
.button {
  background: var(--md-sys-color-primary);
  transition: transform var(--md-sys-motion-duration-short2);
}

/* ❌ Bad - hardcoded values */
.button {
  background: #6750a4;
  transition: transform 100ms;
}
```

### 4. Component Optimization

Use React.memo for expensive components:

```tsx
// ✅ Good - memoized component
export const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
  return <div>{data}</div>;
});

// ❌ Bad - re-renders on every parent update
export function ExpensiveComponent({ data }) {
  // Expensive rendering logic
  return <div>{data}</div>;
}
```

### 5. Image Optimization

Use Next.js Image component:

```tsx
// ✅ Good - optimized images
import Image from 'next/image';

<Image
  src="/hero.jpg"
  width={800}
  height={600}
  alt="Hero"
  priority
/>

// ❌ Bad - unoptimized images
<img src="/hero.jpg" alt="Hero" />
```

## Monitoring

### Development

Use React DevTools Profiler to identify performance issues:

1. Open React DevTools
2. Go to Profiler tab
3. Click Record
4. Interact with components
5. Stop recording
6. Analyze render times

### Production

Use Chrome DevTools Performance tab:

1. Open Chrome DevTools
2. Go to Performance tab
3. Click Record
4. Interact with the page
5. Stop recording
6. Analyze:
   - FPS (should be green, 60fps)
   - Layout shifts (should be minimal)
   - Paint operations (should be minimal)

### Automated Testing

Run performance tests:

```bash
pnpm test src/__tests__/performance
```

## Troubleshooting

### Low FPS

1. Check if animations use `transform`/`opacity` only
2. Verify hardware acceleration is enabled
3. Reduce number of animated elements
4. Use `will-change` sparingly

### Large Bundle Size

1. Run bundle analyzer: `ANALYZE=true pnpm build`
2. Identify large dependencies
3. Use lazy loading for heavy components
4. Enable tree-shaking

### Slow Renders

1. Use React DevTools Profiler
2. Identify slow components
3. Add React.memo where appropriate
4. Optimize expensive calculations with useMemo

## Resources

- [Web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Material Design Motion](https://m3.material.io/styles/motion/overview)
- [CSS Triggers](https://csstriggers.com/)
