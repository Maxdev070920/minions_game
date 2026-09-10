import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  ssr: {
    noExternal: ['child_process', 'path', 'fs', 'url', 'module']
  },
  define: {
    'process.platform': JSON.stringify(process.platform),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  },
  server: { watch: { usePolling: true } },
  build: {
    rollupOptions: { output: { manualChunks: { phaser: ["phaser"] } } },
  },
});
