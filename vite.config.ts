import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Production build is emitted into Laravel's public/spa (served under /spa/).
// Dev server keeps base "/" for simpler local URLs.
export default defineConfig(({ mode }) => ({
  base: mode === "production" ? "/spa/" : "/",
  build: {
    outDir: path.resolve(__dirname, "../backend/public/spa"),
    emptyOutDir: true,
    assetsDir: "assets",
 },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
