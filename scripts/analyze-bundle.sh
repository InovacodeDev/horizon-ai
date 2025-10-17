#!/bin/bash

# Bundle Analysis Script
# Analyzes the Next.js bundle and generates a report

set -e

echo "🔍 Analyzing bundle size..."
echo ""

# Check if @next/bundle-analyzer is installed
if ! grep -q "@next/bundle-analyzer" package.json; then
  echo "⚠️  @next/bundle-analyzer not found. Installing..."
  pnpm add -D @next/bundle-analyzer
  echo "✅ Installed @next/bundle-analyzer"
  echo ""
fi

# Build with bundle analyzer
echo "📦 Building with bundle analyzer..."
ANALYZE=true pnpm build

echo ""
echo "✅ Bundle analysis complete!"
echo ""
echo "📊 Reports generated in .next/analyze/"
echo ""
echo "💡 Tips for optimization:"
echo "  - Use lazy loading for large components"
echo "  - Enable tree-shaking for unused code"
echo "  - Optimize images with next/image"
echo "  - Use dynamic imports for code splitting"
echo ""
