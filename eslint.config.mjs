import { defineConfig } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: compat.extends("next/core-web-vitals", "next/typescript"),
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "no-unused-vars": ["error", {
            "vars": "all",
            "args": "after-used",
            "caughtErrors": "all",
            "ignoreRestSiblings": false,
            "ignoreUsingDeclarations": false,
            "reportUsedIgnorePattern": false
        }]
    },
    settings: {
      next: {
        rootDir: ["src/*"],
      },
    },
  },
  {
    ignores: [
      ".next/",
      "out/",
      "dist/",
      "node_modules/",
      "eslint.config.mjs",
      "pnpm-lock.yaml",
      "package.json",
      "package-lock.json",
      "yarn.lock",
      "pnpm-workspace.yaml",
      "README.md",
      "tsconfig.json",
      "tsconfig.node.json",
      "*.test.tsx",
      "*.test.ts",
      "*.test.js",
      "*.test.jsx",
      "*.config.js",
      "*.config.cjs",
      "*.setup.ts",
      "next.config.js",
      "next-env.d.ts",
      "next-sitemap.config.js",
      "next.config.mjs",
      "next-env.d.ts",
    ],
  },
]);
