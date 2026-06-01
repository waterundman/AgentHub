import { readFileSync, writeFileSync, existsSync, statSync, readdirSync } from 'fs';
import { join, relative, extname } from 'path';
import { createHash } from 'crypto';
import { generateManifest, calculateChecksum } from './manifest';

// 打包agent项目为.agent文件
export async function packAgent(projectDir, outputPath, options = {}) {
  const { sign = false, includeNodeModules = false } = options;

  // 1. 读取agent配置
  const agentConfig = await readAgentConfig(projectDir);

  // 2. 生成manifest
  const manifest = await generateManifest(projectDir, agentConfig);

  // 3. 收集文件
  const files = await collectFiles(projectDir, includeNodeModules);

  // 4. 计算校验和
  for (const file of files) {
    const filePath = join(projectDir, file);
    manifest.checksum.files[file] = calculateChecksum(filePath);
  }

  // 5. 创建ZIP包
  const zipBuffer = await createZip(files, projectDir, manifest);

  // 6. 写入文件
  writeFileSync(outputPath, zipBuffer);

  return {
    success: true,
    outputPath,
    manifest,
    fileCount: files.length
  };
}

// 读取agent配置
async function readAgentConfig(projectDir) {
  const agentPath = join(projectDir, 'agent.js');

  if (!existsSync(agentPath)) {
    throw new Error('agent.js not found in project directory');
  }

  // 动态导入agent配置
  const agentModule = await import(agentPath);
  const agentConfig = agentModule.default || Object.values(agentModule)[0];

  return agentConfig;
}

// 收集需要打包的文件
async function collectFiles(projectDir, includeNodeModules) {
  const files = [];
  const excludePatterns = [
    'node_modules',
    '.git',
    '*.log',
    '.DS_Store',
    'Thumbs.db'
  ];

  function walkDir(dir, relativePath = '') {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      // 检查是否排除
      if (shouldExclude(entry.name, excludePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        walkDir(fullPath, relPath);
      } else {
        files.push(relPath);
      }
    }
  }

  walkDir(projectDir);
  return files;
}

// 检查是否应该排除
function shouldExclude(name, patterns) {
  return patterns.some(pattern => {
    if (pattern.startsWith('*')) {
      return name.endsWith(pattern.slice(1));
    }
    return name === pattern;
  });
}

// 创建ZIP包（简化实现，实际应使用archiver或jszip库）
async function createZip(files, projectDir, manifest) {
  // 这里应该使用ZIP库来创建压缩包
  // 简化实现：返回JSON格式的包
  const packageData = {
    manifest,
    files: {}
  };

  for (const file of files) {
    const filePath = join(projectDir, file);
    const content = readFileSync(filePath, 'utf-8');
    packageData.files[file] = content;
  }

  return Buffer.from(JSON.stringify(packageData, null, 2));
}

export default packAgent;
