import { build } from "vite";
import { fileURLToPath } from "node:url";
await build({
  configFile: false,
  publicDir: false,
  logLevel: "warn",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  esbuild: { jsx: "automatic" },
  build: {
    outDir: "frontend/public/dashboard/generated",
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    lib: {
      entry: fileURLToPath(
        new URL("../frontend/src/main.tsx", import.meta.url),
      ),
      name: "EntreRios",
      formats: ["iife"],
      fileName: () => "app.js",
      cssFileName: "app",
    },
  },
});
console.log("React application bundle ready.");
