/**
 * esbuild 配置 - 主进程编译
 * 超快速编译，无类型检查，内存占用极低
 */

import * as esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import path from 'path'
import fs from 'fs'

const isDev = process.env.NODE_ENV === 'development'

// 清理输出目录
const outDir = 'dist/main'
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true })
}
fs.mkdirSync(outDir, { recursive: true })

// 主进程构建配置
const mainConfig = {
  entryPoints: ['electron/main.cjs'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: `${outDir}/main.cjs`,
  format: 'cjs',
  
  // 外部化所有 node_modules（减少内存）
  plugins: [nodeExternalsPlugin()],
  
  // 环境变量
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  
  // 减少内存占用
  minify: !isDev,
  sourcemap: isDev,
  
  // 排除原生模块
  external: [
    'electron',
    'child_process',
    'fs',
    'path',
    'crypto',
    'os',
    'stream',
    'events',
    'url',
    'util',
  ],
}

// Preload 脚本构建配置
const preloadConfig = {
  entryPoints: ['electron/preload.cjs'],
  bundle: true,
  platform: 'node',
  target: 'node18',
  outfile: `${outDir}/preload.cjs`,
  format: 'cjs',
  
  plugins: [nodeExternalsPlugin()],
  
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  
  minify: !isDev,
  sourcemap: isDev,
  
  external: ['electron'],
}

// 执行构建
async function build() {
  try {
    console.log('🔨 Building main process with esbuild...')
    
    await Promise.all([
      esbuild.build(mainConfig),
      esbuild.build(preloadConfig),
    ])
    
    console.log('✅ Main process built successfully')
    
    // 复制 package.json 到 dist
    const pkgPath = path.join(process.cwd(), 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
    
    // 只保留必要字段
    const minimalPkg = {
      name: pkg.name,
      version: pkg.version,
      main: 'main.cjs',
    }
    
    fs.writeFileSync(
      path.join(outDir, 'package.json'),
      JSON.stringify(minimalPkg, null, 2)
    )
    
    console.log('✅ package.json copied to dist/main/')
  } catch (error) {
    console.error('❌ Build failed:', error)
    process.exit(1)
  }
}

build()