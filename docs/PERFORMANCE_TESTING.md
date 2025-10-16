# Performance Testing Guide

This document outlines how to test and validate the performance requirements for the landing page and application.

## Requirements

- **Lighthouse Performance Score**: 90+
- **Additional Bundle Size**: < 50KB for landing page features
- **Animation Performance**: 60fps target

## Running Performance Tests

### 1. Automated Tests

Run the automated performance tests:

```bash
pnpm test performance
```

These tests verify:

- Bundle size expectations are documented
- Animation components use proper optimization techniques
- Dependencies are correctly configured

### 2. Lighthouse Testing

#### Local Testing

1. Build the production version:

```bash
pnpm build
pnpm start
```

2. Open Chrome DevTools (F12)

3. Navigate to the **Lighthouse** tab

4. Configure settings:
   - Mode: Navigation
   - Device: Desktop or Mobile
   - Categories: Performance (minimum)

5. Click **Analyze page load**

6. Verify Performance score is **90+**

#### Key Metrics to Check

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Total Blocking Time (TBT)**: < 200ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Speed Index**: < 3.4s

### 3. Bundle Size Analysis

Check the actual bundle size after build:

```bash
pnpm build
```

Then inspect the build output:

```bash
ls -lh .next/static/chunks/
```

Look for:

- Landing page chunks should be code-split
- Framer Motion should be in a separate chunk
- Total additional size for landing features < 50KB

For detailed analysis:

```bash
# Install bundle analyzer
pnpm add -D @next/bundle-analyzer

# Add to next.config.ts:
# const withBundleAnalyzer = require('@next/bundle-analyzer')({
#   enabled: process.env.ANALYZE === 'true',
# })

# Run analysis
ANALYZE=true pnpm build
```

### 4. Animation Performance Testing

#### Chrome DevTools Performance Panel

1. Open Chrome DevTools > **Performance** tab

2. Click **Record** (or Ctrl+E)

3. Scroll through the landing page

4. Stop recording

5. Analyze the results:
   - Check FPS meter stays at **60fps**
   - Look for green bars (good performance)
   - Avoid red bars (jank/dropped frames)
   - Verify no layout thrashing

#### Key Indicators

- **Frame Rate**: Should maintain 60fps during animations
- **GPU Usage**: Animations should use GPU acceleration
- **Layout Shifts**: Minimal to no layout recalculations during animations

### 5. Low-End Device Testing

Test on lower-performance devices:

1. Chrome DevTools > **Performance** tab

2. Click the gear icon ⚙️

3. Enable **CPU throttling**: 4x or 6x slowdown

4. Record and scroll through landing page

5. Verify animations still feel smooth (may drop to 30fps on 6x throttle, which is acceptable)

## Performance Optimization Checklist

- [x] Framer Motion configured for hardware acceleration
- [x] Animations use CSS transforms (translateY, scale, opacity)
- [x] Avoid animating layout properties (width, height, top, left)
- [x] Use `whileInView` for scroll-triggered animations
- [x] Lazy load below-the-fold content
- [x] Code split animation library
- [x] Optimize images with next/image
- [x] Use WebP format for images

## Troubleshooting

### Low Lighthouse Score

- Check for render-blocking resources
- Ensure images are optimized
- Verify code splitting is working
- Check for unused JavaScript

### Animation Jank

- Verify using CSS transforms only
- Check for layout thrashing in Performance panel
- Ensure `will-change` is not overused
- Test with CPU throttling

### Large Bundle Size

- Run bundle analyzer to identify large dependencies
- Ensure Framer Motion is code-split
- Check for duplicate dependencies
- Consider lazy loading heavy components

## Continuous Monitoring

For production monitoring, consider:

- Google PageSpeed Insights
- WebPageTest
- Real User Monitoring (RUM) tools
- Lighthouse CI in deployment pipeline

## References

- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse Scoring](https://web.dev/performance-scoring/)
- [Framer Motion Performance](https://www.framer.com/motion/guide-reduce-bundle-size/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
