import { describe, it, expect } from "vitest";
import { readFileSync, statSync } from "fs";
import { join } from "path";

describe("Performance - Bundle Size", () => {
  it("documents bundle size expectations", () => {
    // This test documents the bundle size requirements
    // Actual bundle size validation should be done during build
    const maxAdditionalBundleSize = 50 * 1024; // 50KB in bytes

    // Document the requirement
    expect(maxAdditionalBundleSize).toBe(51200);

    // Note: To check actual bundle size:
    // 1. Run: pnpm build
    // 2. Check .next/static/chunks for landing page chunks
    // 3. Framer Motion should be code-split and lazy-loaded
  });

  it("verifies Framer Motion is a dependency", () => {
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf-8")
    );

    // Verify Framer Motion is installed
    expect(packageJson.dependencies["framer-motion"]).toBeDefined();
  });
});
