import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa",
  base: "./",
  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
  },
  build: {
    sourcemap: true,
  },
});
