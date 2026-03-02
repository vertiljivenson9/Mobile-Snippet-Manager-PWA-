import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [inspectAttr(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ui': ['framer-motion', '@radix-ui/react-dialog', '@radix-ui/react-select'],
          'db': ['idb'],
          'search': ['fuse.js'],
          'syntax': ['prismjs'],
        },
      },
    },
  },
  worker: {
    format: 'es',
  },
});
