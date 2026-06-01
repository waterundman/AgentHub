import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { validateManifest, checkCompatibility } from './manifest';

// 验证.agent文件
export async function verifyAgent(agentFilePath) {
  const result = {
    valid: true,
    errors: [],
    warnings: [],
    manifest: null
  };

  try {
    // 1. 读取文件
    const content = readFileSync(agentFilePath, 'utf-8');
    let packageData;

    try {
      packageData = JSON.parse(content);
    } catch (error) {
      result.valid = false;
      result.errors.push('Invalid .agent file format: not valid JSON');
      return result;
    }

    // 2. 验证manifest
    if (!packageData.manifest) {
      result.valid = false;
      result.errors.push('Missing manifest.json');
      return result;
    }

    result.manifest = packageData.manifest;

    const manifestValidation = validateManifest(packageData.manifest);
    if (!manifestValidation.valid) {
      result.valid = false;
      result.errors.push(...manifestValidation.errors);
    }

    // 3. 检查版本兼容性
    const compatibility = checkCompatibility(packageData.manifest, '1.2.0');
    if (!compatibility.compatible) {
      result.warnings.push(compatibility.message);
    }

    // 4. 验证文件完整性
    if (packageData.manifest.checksum?.files) {
      for (const [file, expectedHash] of Object.entries(packageData.manifest.checksum.files)) {
        if (!packageData.files[file]) {
          result.errors.push(`Missing file: ${file}`);
          continue;
        }

        const actualHash = createHash('sha256')
          .update(packageData.files[file])
          .digest('hex');

        if (actualHash !== expectedHash) {
          result.errors.push(`Checksum mismatch for ${file}`);
        }
      }
    }

    if (result.errors.length > 0) {
      result.valid = false;
    }

  } catch (error) {
    result.valid = false;
    result.errors.push(error.message);
  }

  return result;
}

export default verifyAgent;
