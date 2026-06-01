import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join } from 'path';

// 生成manifest.json
export async function generateManifest(projectDir, agentConfig) {
  const manifest = {
    formatVersion: '1.0',
    agent: {
      name: agentConfig.name,
      id: agentConfig.id || agentConfig.name.toLowerCase().replace(/\s+/g, '-'),
      version: agentConfig.version || '1.0.0',
      subtitle: agentConfig.subtitle || '',
      icon: agentConfig.icon || 'A',
      colorKey: agentConfig.colorKey || 'purple',
      description: agentConfig.description || '',
      author: agentConfig.author || 'AgentHub',
      license: agentConfig.license || 'MIT'
    },
    runtime: {
      engine: 'agenthub',
      minVersion: '1.2.0',
      nodeVersion: '>=18.0.0'
    },
    capabilities: agentConfig.capabilities || [],
    dependencies: agentConfig.dependencies || [],
    entry: agentConfig.entry || 'src/index.js',
    checksum: {
      algorithm: 'sha256',
      files: {}
    }
  };

  return manifest;
}

// 计算文件校验和
export function calculateChecksum(filePath) {
  const content = readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

// 验证manifest.json
export function validateManifest(manifest) {
  const errors = [];

  if (!manifest.formatVersion) {
    errors.push('Missing formatVersion');
  }

  if (!manifest.agent) {
    errors.push('Missing agent section');
  } else {
    if (!manifest.agent.name) errors.push('Missing agent.name');
    if (!manifest.agent.version) errors.push('Missing agent.version');
  }

  if (!manifest.runtime) {
    errors.push('Missing runtime section');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// 检查版本兼容性
export function checkCompatibility(manifest, currentVersion) {
  const minVersion = manifest.runtime?.minVersion;
  if (!minVersion) return { compatible: true };

  // 简单的版本比较
  const [minMajor, minMinor] = minVersion.split('.').map(Number);
  const [curMajor, curMinor] = currentVersion.split('.').map(Number);

  if (curMajor > minMajor) return { compatible: true };
  if (curMajor === minMajor && curMinor >= minMinor) return { compatible: true };

  return {
    compatible: false,
    message: `Requires AgentHub ${minVersion} or higher`
  };
}
