#!/usr/bin/env node

/**
 * Bundle Analyzer Script
 *
 * Analyzes the Next.js build output for bundle size and provides
 * recommendations for optimization.
 *
 * Usage:
 *   npm run analyze
 *   npm run analyze -- --ci (for CI/CD)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// Configuration
// ============================================================================

const performanceBudget = {
  js: 280 * 1024, // 280KB
  css: 95 * 1024, // 95KB
  total: 300 * 1024, // 300KB
};

const nextBuildDir = path.join(__dirname, "../.next");
const staticDir = path.join(nextBuildDir, "static");
const buildManifest = path.join(nextBuildDir, "build-manifest.json");

// ============================================================================
// Helper Functions
// ============================================================================

function formatBytes(bytes) {
  const sizes = ["Bytes", "KB", "MB", "GB"];
  if (bytes === 0) return "0 Bytes";
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
}

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function getAllFiles(dir, ext) {
  if (!fs.existsSync(dir)) return [];

  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...getAllFiles(fullPath, ext));
    } else if (item.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

// ============================================================================
// Analysis Functions
// ============================================================================

function analyzeJsBundle() {
  console.log("\n📦 JavaScript Bundle Analysis\n");

  const jsDir = path.join(staticDir, "chunks");
  const jsFiles = getAllFiles(jsDir || "", ".js");

  if (jsFiles.length === 0) {
    console.log('⚠️  No JavaScript files found. Run "npm run build" first.\n');
    return 0;
  }

  let totalSize = 0;
  const chunks = [];

  for (const file of jsFiles) {
    const size = getFileSize(file);
    totalSize += size;
    const relativePath = path.relative(nextBuildDir, file);
    chunks.push({ file: relativePath, size });
  }

  // Sort by size descending
  chunks.sort((a, b) => b.size - a.size);

  // Display top chunks
  console.log("Top 10 Largest Chunks:");
  console.log("─".repeat(60));
  chunks.slice(0, 10).forEach((chunk, i) => {
    const percentage = ((chunk.size / totalSize) * 100).toFixed(1);
    console.log(`${i + 1}. ${chunk.file}`);
    console.log(`   ${formatBytes(chunk.size)} (${percentage}%)\n`);
  });

  console.log("─".repeat(60));
  console.log(`Total JS Size: ${formatBytes(totalSize)}`);
  console.log(`Budget: ${formatBytes(performanceBudget.js)}`);

  const percentage = ((totalSize / performanceBudget.js) * 100).toFixed(1);
  console.log(`Status: ${percentage}% of budget\n`);

  if (totalSize > performanceBudget.js) {
    console.log("❌ JS bundle EXCEEDS budget!");
    console.log(`   Exceeded by: ${formatBytes(totalSize - performanceBudget.js)}\n`);
  } else {
    console.log(`✅ JS bundle within budget (${formatBytes(performanceBudget.js - totalSize)} remaining)\n`);
  }

  return totalSize;
}

function analyzeCssBundle() {
  console.log("\n🎨 CSS Bundle Analysis\n");

  const cssDir = path.join(staticDir, "css");
  const cssFiles = getAllFiles(cssDir || "", ".css");

  if (cssFiles.length === 0) {
    console.log("⚠️  No CSS files found.\n");
    return 0;
  }

  let totalSize = 0;
  const files = [];

  for (const file of cssFiles) {
    const size = getFileSize(file);
    totalSize += size;
    const relativePath = path.relative(nextBuildDir, file);
    files.push({ file: relativePath, size });
  }

  files.sort((a, b) => b.size - a.size);

  console.log("CSS Files:");
  console.log("─".repeat(60));
  files.forEach((file, i) => {
    const percentage = ((file.size / totalSize) * 100).toFixed(1);
    console.log(`${i + 1}. ${file.file}`);
    console.log(`   ${formatBytes(file.size)} (${percentage}%)\n`);
  });

  console.log("─".repeat(60));
  console.log(`Total CSS Size: ${formatBytes(totalSize)}`);
  console.log(`Budget: ${formatBytes(performanceBudget.css)}`);

  const percentage = ((totalSize / performanceBudget.css) * 100).toFixed(1);
  console.log(`Status: ${percentage}% of budget\n`);

  if (totalSize > performanceBudget.css) {
    console.log("❌ CSS bundle EXCEEDS budget!");
    console.log(`   Exceeded by: ${formatBytes(totalSize - performanceBudget.css)}\n`);
  } else {
    console.log(`✅ CSS bundle within budget (${formatBytes(performanceBudget.css - totalSize)} remaining)\n`);
  }

  return totalSize;
}

function generateRecommendations(jsSize, cssSize) {
  console.log("\n💡 Optimization Recommendations\n");

  const recommendations = [];

  // JS Bundle recommendations
  if (jsSize > performanceBudget.js * 0.8) {
    recommendations.push({
      priority: "🔴 HIGH",
      issue: "Large JavaScript bundle",
      action: "Implement code splitting for heavy routes",
      example: "Use dynamic() for /dashboard and /marketplace routes",
    });
  }

  if (jsSize > performanceBudget.js * 0.9) {
    recommendations.push({
      priority: "🔴 CRITICAL",
      issue: "JavaScript bundle exceeds 90% of budget",
      action: "Audit dependencies and remove unused packages",
      example: "npm audit && npm prune",
    });
  }

  // CSS Bundle recommendations
  if (cssSize > performanceBudget.css * 0.8) {
    recommendations.push({
      priority: "🟡 MEDIUM",
      issue: "Large CSS bundle",
      action: "Review Tailwind CSS configuration",
      example: "Check tailwind.config.ts content paths",
    });
  }

  // Total size recommendations
  const totalSize = jsSize + cssSize;
  if (totalSize > performanceBudget.total) {
    recommendations.push({
      priority: "🔴 CRITICAL",
      issue: "Total bundle exceeds performance budget",
      action: "Implement aggressive code splitting",
      example: "Split Dashboard, Marketplace, and Onboarding routes",
    });
  }

  if (recommendations.length === 0) {
    console.log("✅ No issues found! Bundle is well optimized.\n");
    return;
  }

  recommendations.forEach((rec) => {
    console.log(`${rec.priority} ${rec.issue}`);
    console.log(`   Action: ${rec.action}`);
    console.log(`   Example: ${rec.example}\n`);
  });
}

function generateReport(jsSize, cssSize) {
  console.log("\n📊 Bundle Summary Report\n");
  console.log("─".repeat(60));

  const totalSize = jsSize + cssSize;
  const jsPercent = ((jsSize / performanceBudget.js) * 100).toFixed(1);
  const cssPercent = ((cssSize / performanceBudget.css) * 100).toFixed(1);
  const totalPercent = ((totalSize / performanceBudget.total) * 100).toFixed(1);

  console.log(
    `JavaScript:  ${formatBytes(jsSize).padStart(12)} (${jsPercent}% of ${formatBytes(performanceBudget.js)})`
  );
  console.log(
    `CSS:         ${formatBytes(cssSize).padStart(12)} (${cssPercent}% of ${formatBytes(performanceBudget.css)})`
  );
  console.log("─".repeat(60));
  console.log(
    `Total:       ${formatBytes(totalSize).padStart(12)} (${totalPercent}% of ${formatBytes(performanceBudget.total)})`
  );
  console.log("─".repeat(60));

  // Trend analysis
  console.log("\n📈 Budget Status:");
  if (totalSize > performanceBudget.total) {
    console.log("❌ EXCEEDS BUDGET");
    console.log(`   By: ${formatBytes(totalSize - performanceBudget.total)}\n`);
    process.exit(1);
  } else if (totalSize > performanceBudget.total * 0.9) {
    console.log("⚠️  WARNING: Approaching budget limit");
    console.log(`   Remaining: ${formatBytes(performanceBudget.total - totalSize)}\n`);
  } else {
    console.log("✅ WITHIN BUDGET");
    console.log(`   Remaining: ${formatBytes(performanceBudget.total - totalSize)}\n`);
  }
}

function saveMetrics(jsSize, cssSize) {
  const metricsDir = path.join(__dirname, "../.next/metrics");
  if (!fs.existsSync(metricsDir)) {
    fs.mkdirSync(metricsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const metrics = {
    timestamp,
    jsSize,
    cssSize,
    totalSize: jsSize + cssSize,
    budgets: performanceBudget,
  };

  fs.writeFileSync(path.join(metricsDir, `bundle-${Date.now()}.json`), JSON.stringify(metrics, null, 2));

  console.log(`📝 Metrics saved to .next/metrics/`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log("\n🔍 Next.js Bundle Analysis Report");
  console.log("═".repeat(60));

  const isCi = process.argv.includes("--ci");

  if (!fs.existsSync(nextBuildDir)) {
    console.log("\n❌ Build output not found at:", nextBuildDir);
    console.log('Run "npm run build" first.\n');
    process.exit(1);
  }

  // Analyze bundles
  const jsSize = analyzeJsBundle();
  const cssSize = analyzeCssBundle();

  // Generate report
  generateReport(jsSize, cssSize);

  // Generate recommendations
  generateRecommendations(jsSize, cssSize);

  // Save metrics
  saveMetrics(jsSize, cssSize);

  console.log("═".repeat(60));
  console.log("\n✨ Analysis complete!\n");
}

main().catch((error) => {
  console.error("Error running bundle analyzer:", error);
  process.exit(1);
});
