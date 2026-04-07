/**
 * Vite 配置 - 渲染进程编译
 * 使用 Vite 的 esbuild 底层，内存占用极低
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  mode: process.env.NODE_ENV || 'production',
  
  root: '.',
  base: './',
  
  build: {
    outDir: 'dist/renderer',
    assetsDir: 'assets',
    emptyOutDir: true,
    
    // 使用 esbuild 进行压缩和转换
    minify: 'esbuild',
    esbuild: {
      drop: ['console', 'debugger'], // 生产环境移除 console
    },
    
    // 分块策略（减少内存占用）
    rollupOptions: {
      output: {
        manualChunks: {
          'monaco-editor': ['monaco-editor'],
          'react-vendor': ['react', 'react-dom'],
          'zustand': ['zustand'],
        },
      },
    },
    
    // 减少内存占用
    chunkSizeWarningLimit: 1000,
    
    // CSS 处理
    cssCodeSplit: true,
  },
  
  server: {
    port: 5173,
    strictPort: true,
  },
  
  optimizeDeps: {
    // 排除 Node.js 专属模块
    exclude: ['node-fetch', 'dotenv', 'fs', 'path', 'child_process'],
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
})