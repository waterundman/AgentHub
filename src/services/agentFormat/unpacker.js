import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { validateManifest, checkCompatibility } from './manifest';

// 解压.agent文件
export async function unpackAgent(agentFilePath, targetDir, options = {}) {
  const { overwrite = false, verify = true } = options;

  // 1. 读取并解析.agent文件
  const packageData = await readAgentFile(agentFilePath);

  // 2. 验证manifest
  if (verify) {
    const validation = validateManifest(packageData.manifest);
    if (!validation.valid) {
      throw new Error(`Invalid manifest: ${validation.errors.join(', ')}`);
    }
  }

  // 3. 检查版本兼容性
  const compatibility = checkCompatibility(packageData.manifest, '1.2.0');
  if (!compatibility.compatible) {
    throw new Error(compatibility.message);
  }

  // 4. 创建目标目录
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  // 5. 解压文件
  const extractedFiles = [];
  for (const [filePath, content] of Object.entries(packageData.files)) {
    const fullPath = join(targetDir, filePath);
    const dir = dirname(fullPath);

    // 创建目录
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    writeFileSync(fullPath, content);
    extractedFiles.push(filePath);
  }

  return {
    success: true,
    targetDir,
    manifest: packageData.manifest,
    fileCount: extractedFiles.length,
    files: extractedFiles
  };
}

// 读取.agent文件
async function readAgentFile(agentFilePath) {
  const content = readFileSync(agentFilePath, 'utf-8');

  // 简化实现：假设是JSON格式
  try {
    return JSON.parse(content);
  } catch (error) {
    throw new Error('Invalid .agent file format');
  }
}

// 加载agent定义
export async function loadAgentDefinition(targetDir) {
  const agentPath = join(targetDir, 'agent.js');

  if (!existsSync(agentPath)) {
    throw new Error('agent.js not found in extracted directory');
  }

  const agentModule = await import(agentPath);
  return agentModule.default || Object.values(agentModule)[0];
}

export default unpackAgent;
