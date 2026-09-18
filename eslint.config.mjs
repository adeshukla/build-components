import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  {
    // registry/** ships to other people's projects: it must not depend on Next.js.
    files: ["registry/**/*.tsx"],
    rules: { "@next/next/no-html-link-for-pages": "off" },
  },
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated test outputs (copies of registry sources)
    "app/(bare)/harness/**",
    "e2e/.generated/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;
