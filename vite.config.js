import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      external: ['child_process', 'fs', 'path', 'spawn'],
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'react-vendor': ['react', 'react-dom'],
        },
      },
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['node-fetch', 'dotenv', 'fs', 'path', 'child_process'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})