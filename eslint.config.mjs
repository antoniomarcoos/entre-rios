import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "dist/**",
    "frontend/public/dashboard/generated/**",
    ".vinext/**",
    ".wrangler/**",
    "outputs/**",
    "work/**",
  ]),
  {
    files: ["frontend/src/features/maps/OfficialMaps.tsx"],
    rules: { "@next/next/no-img-element": "off" },
  },
  {
    files: ["tests/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
