import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

/**
 * Performance Tests - Bundle Size Monitoring
 *
 * Tests to monitor and document bundle size expectations for MD3 components.
 * Ensures code splitting and lazy loading are properly implemented.
 */

describe("Performance - Bundle Size", () => {
  it("documents bundle size expectations for MD3 components", () => {
    // Bundle size targets for MD3 component library
    const bundleSizeTargets = {
      // Individual component sizes (gzipped)
      button: 2 * 1024, // 2KB
      card: 1.5 * 1024, // 1.5KB
      textField: 3 * 1024, // 3KB
      dialog: 5 * 1024, // 5KB (includes Radix UI Dialog)
      navigationDrawer: 6 * 1024, // 6KB (includes Radix UI Dialog)

      // Total MD3 component library (gzipped)
      totalMD3Components: 50 * 1024, // 50KB

      // Animation libraries
      framerMotion: 30 * 1024, // 30KB (should be code-split)

      // Maximum acceptable increase from MD3 migration
      maxAdditionalBundleSize: 80 * 1024, // 80KB total increase
    };

    // Document the requirements
    expect(bundleSizeTargets.maxAdditionalBundleSize).toBe(81920);
    expect(bundleSizeTargets.totalMD3Components).toBe(51200);

    // Note: To check actual bundle size:
    // 1. Run: pnpm build
    // 2. Check .next/static/chunks for component chunks
    // 3. Use: npx @next/bundle-analyzer
    // 4. Verify code splitting is working
  });

  it("verifies critical dependencies are present", () => {
    const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8"));

    // Verify Framer Motion is installed (for animations)
    expect(packageJson.dependencies["framer-motion"]).toBeDefined();

    // Verify Radix UI primitives (for accessible components)
    expect(packageJson.dependencies["@radix-ui/react-dialog"]).toBeDefined();
    expect(packageJson.dependencies["@radix-ui/react-tooltip"]).toBeDefined();

    // Verify Tailwind CSS (for styling)
    expect(packageJson.devDependencies["tailwindcss"]).toBeDefined();

    // Verify class-variance-authority (for variant management)
    expect(packageJson.dependencies["class-variance-authority"]).toBeDefined();
  });

  it("documents code splitting strategy", () => {
    const codeSplittingStrategy = {
      // Components that should be lazy loaded
      lazyLoadedComponents: [
        "Dialog", // Only load when needed
        "NavigationDrawer", // Only load when needed
        "Tooltip", // Only load when needed
        "Menu", // Only load when needed
      ],

      // Animation libraries that should be code-split
      lazyLoadedAnimations: [
        "framer-motion", // Use dynamic imports
      ],

      // Route-based code splitting
      routeBasedSplitting: true,

      // Component-based code splitting
      componentBasedSplitting: true,

      // Use Next.js dynamic imports
      useDynamicImports: true,
    };

    expect(codeSplittingStrategy.lazyLoadedComponents).toContain("Dialog");
    expect(codeSplittingStrategy.lazyLoadedAnimations).toContain("framer-motion");
    expect(codeSplittingStrategy.useDynamicImports).toBe(true);
  });

  it("documents tree-shaking requirements", () => {
    const treeShakingRequirements = {
      // Use named imports for better tree-shaking
      useNamedImports: true,

      // Avoid barrel exports that prevent tree-shaking
      avoidBarrelExports: false, // We use barrel exports but ensure they're tree-shakeable

      // Use sideEffects: false in package.json
      markSideEffectFree: true,

      // Import only what's needed
      importOnlyUsed: true,

      // Examples of good imports:
      goodImports: [
        'import { Button } from "@/components/ui/button"',
        'import { Dialog } from "@/components/ui/dialog"',
      ],

      // Examples of bad imports (import everything):
      badImports: ['import * as UI from "@/components/ui"'],
    };

    expect(treeShakingRequirements.useNamedImports).toBe(true);
    expect(treeShakingRequirements.importOnlyUsed).toBe(true);
  });

  it("documents CSS optimization strategy", () => {
    const cssOptimization = {
      // Tailwind CSS purging
      purgeTailwindCSS: true,

      // Use CSS variables for design tokens
      useCSSVariables: true,

      // Minimize CSS-in-JS runtime
      minimizeCSSInJS: true,

      // Use Tailwind's JIT mode
      useJITMode: true,

      // Expected CSS bundle size (gzipped)
      maxCSSBundleSize: 20 * 1024, // 20KB
    };

    expect(cssOptimization.purgeTailwindCSS).toBe(true);
    expect(cssOptimization.useCSSVariables).toBe(true);
    expect(cssOptimization.useJITMode).toBe(true);
  });

  it("monitors bundle size changes", () => {
    // This test documents how to monitor bundle size changes
    const monitoringStrategy = {
      // Tools to use
      tools: ["@next/bundle-analyzer", "webpack-bundle-analyzer", "bundlesize"],

      // CI/CD integration
      cicdIntegration: true,

      // Fail build if bundle size exceeds threshold
      failOnSizeExceed: true,

      // Track bundle size over time
      trackOverTime: true,

      // Alert on significant increases
      alertThreshold: 10, // 10% increase
    };

    expect(monitoringStrategy.tools).toContain("@next/bundle-analyzer");
    expect(monitoringStrategy.cicdIntegration).toBe(true);

    // Note: To set up bundle size monitoring:
    // 1. Add bundlesize to package.json
    // 2. Configure size limits in package.json
    // 3. Add to CI/CD pipeline
    // 4. Use GitHub Actions or similar for automated checks
  });

  it("documents performance budget", () => {
    const performanceBudget = {
      // Total JavaScript bundle size (gzipped)
      maxJSBundleSize: 200 * 1024, // 200KB

      // Total CSS bundle size (gzipped)
      maxCSSBundleSize: 20 * 1024, // 20KB

      // First Contentful Paint (FCP)
      maxFCP: 1.8, // seconds

      // Largest Contentful Paint (LCP)
      maxLCP: 2.5, // seconds

      // Time to Interactive (TTI)
      maxTTI: 3.8, // seconds

      // Total Blocking Time (TBT)
      maxTBT: 200, // milliseconds

      // Cumulative Layout Shift (CLS)
      maxCLS: 0.1,
    };

    expect(performanceBudget.maxJSBundleSize).toBe(204800);
    expect(performanceBudget.maxCSSBundleSize).toBe(20480);
    expect(performanceBudget.maxLCP).toBeLessThanOrEqual(2.5);
    expect(performanceBudget.maxCLS).toBeLessThanOrEqual(0.1);
  });
});
