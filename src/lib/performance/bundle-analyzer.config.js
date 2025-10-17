/**
 * Bundle Analyzer Configuration
 *
 * Configuration for analyzing bundle size and identifying optimization opportunities.
 *
 * Usage:
 * 1. Install: pnpm add -D @next/bundle-analyzer
 * 2. Add to next.config.ts:
 *    const withBundleAnalyzer = require('@next/bundle-analyzer')({
 *      enabled: process.env.ANALYZE === 'true',
 *    })
 *    module.exports = withBundleAnalyzer(nextConfig)
 * 3. Run: ANALYZE=true pnpm build
 */

module.exports = {
  // Bundle size limits (in bytes, gzipped)
  limits: {
    // Individual component limits
    button: 2 * 1024, // 2KB
    card: 1.5 * 1024, // 1.5KB
    textField: 3 * 1024, // 3KB
    dialog: 5 * 1024, // 5KB
    navigationDrawer: 6 * 1024, // 6KB

    // Total MD3 components
    totalMD3: 50 * 1024, // 50KB

    // Animation libraries
    framerMotion: 30 * 1024, // 30KB

    // Total JavaScript
    totalJS: 200 * 1024, // 200KB

    // Total CSS
    totalCSS: 20 * 1024, // 20KB
  },

  // Files to analyze
  analyze: [".next/static/chunks/**/*.js", ".next/static/css/**/*.css"],

  // Exclude from analysis
  exclude: [".next/static/chunks/webpack-*.js", ".next/static/chunks/framework-*.js"],

  // Report configuration
  report: {
    format: "html",
    outputPath: ".next/analyze",
    openBrowser: true,
  },
};
