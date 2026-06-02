// ESLint flat config (ESLint v9+/v10).
//
// Replaces the legacy `.eslintrc.json`. `eslint-config-next@16` ships native
// flat-config arrays, so we spread them directly — no FlatCompat shim needed.
//   - core-web-vitals: Next.js' recommended rules + perf/a11y checks
//   - typescript:      typescript-eslint recommended rules
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

const config = [
  // Files ESLint should never touch.
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "next-env.d.ts"],
  },
  ...nextCoreWebVitals,
  ...nextTypeScript,
  // Project-specific rule overrides.
  {
    rules: {
      // Apostrophes/quotes in JSX copy are intentional throughout the site.
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
