/**
 * Electron 主构建脚本
 * 内存优化版 - 使用 esbuild + Vite
 */

import { execSync } from 'child_process'
import { existsSync, rmSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const ROOT_DIR = process.cwd()
const DIST_DIR = join(ROOT_DIR, 'dist')
const RELEASE_DIR = join(ROOT_DIR, 'release')

console.log('🚀 Starting Electron build process...\n')

// 1. 环境清理
console.log('🧹 Cleaning build directories...')
if (existsSync(DIST_DIR)) {
  rmSync(DIST_DIR, { recursive: true })
  console.log('   ✓ Cleaned dist/')
}
if (existsSync(RELEASE_DIR)) {
  rmSync(RELEASE_DIR, { recursive: true })
  console.log('   ✓ Cleaned release/')
}
mkdirSync(DIST_DIR, { recursive: true })
console.log('   ✓ Created dist/\n')

// 2. 检查依赖
console.log('📦 Checking dependencies...')
try {
  execSync('npm ls --depth=0', { stdio: 'ignore', cwd: ROOT_DIR })
  console.log('   ✓ Dependencies OK\n')
} catch {
  console.log('   ⚠ Some dependencies might be missing\n')
}

// 3. 编译主进程
console.log('🔨 Step 1: Building main process (esbuild)...')
try {
  execSync('node electron/esbuild.config.js', {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    env: { ...process.env, NODE_ENV: 'production' }
  })
  console.log('   ✓ Main process compiled\n')
} catch (error) {
  console.error('   ✗ Main process build failed')
  process.exit(1)
}

// 4. 编译渲染进程
console.log('⚡ Step 2: Building renderer process (Vite)...')
try {
  execSync('npx vite build --config electron/vite.config.js', {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    env: { ...process.env, NODE_ENV: 'production' }
  })
  console.log('   ✓ Renderer process compiled\n')
} catch (error) {
  console.error('   ✗ Renderer process build failed')
  process.exit(1)
}

// 5. 复制 package.json
console.log('📄 Step 3: Preparing package metadata...')
const pkg = JSON.parse(readFileSync(join(ROOT_DIR, 'package.json'), 'utf-8'))

// 精简 package.json
const electronPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  main: 'dist/main/main.cjs',
  author: pkg.author,
  license: pkg.license,
}

writeFileSync(
  join(ROOT_DIR, 'dist/package.json'),
  JSON.stringify(electronPkg, null, 2)
)
console.log('   ✓ package.json prepared\n')

// 6. 打包 Electron
console.log('📦 Step 4: Packaging Electron application...')
console.log('   Memory limit: 4GB NODE_OPTIONS')

try {
  execSync('npx electron-builder --win --x64', {
    stdio: 'inherit',
    cwd: ROOT_DIR,
    env: {
      ...process.env,
      NODE_OPTIONS: '--max-old-space-size=4096',
      NODE_ENV: 'production',
    },
  })
  console.log('\n✨ Build completed successfully!')
  console.log('   Output: release/')
} catch (error) {
  console.error('\n❌ Build failed')
  process.exit(1)
}