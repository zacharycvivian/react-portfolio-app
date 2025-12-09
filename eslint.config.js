const baseConfig = require("eslint-config-next");

module.exports = [
  ...baseConfig,
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    rules: {
      "react/no-unescaped-entities": "off",
      "react-hooks/unsupported-syntax": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
    },
  },
  {
    ignores: ["node_modules", ".next", "dist"],
  },
];
