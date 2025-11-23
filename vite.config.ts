import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  appType: "spa",
  base: "./",
  root: fileURLToPath(new URL(".", import.meta.url)),
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false,
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: true,
    open: false,
  },
  build: {
    sourcemap: true,
  },
});
