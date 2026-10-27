import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: "frontend/public",
  plugins: [
    vinext(),
    cloudflare({
      viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
      inspectorPort: false,
      config: {
        main: "./backend/worker/index.ts",
        compatibility_flags: ["nodejs_compat"],
      },
    }),
  ],
});
