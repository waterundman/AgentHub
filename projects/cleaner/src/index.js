/**
 * Cleaner Agent - 标准化接口
 * 将清扫者 agent 适配到 AgentHub 范式
 */

import { CLEANER_AGENT } from "../agent";

// Node.js 模块延迟导入
let spawn, path, fileURLToPath;
let CLEANER_SCRIPT;

async function ensureNodeModules() {
  if (!spawn || !path) {
    const childProcess = await import('child_process');
    const pathModule = await import('path');
    const urlModule = await import('url');
    
    spawn = childProcess.spawn;
    path = pathModule.default || pathModule;
    fileURLToPath = urlModule.fileURLToPath;
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    CLEANER_SCRIPT = path.join(__dirname, "clean_disk.py");
  }
}

export async function scanPaths(paths, options = {}) {
  await ensureNodeModules();
  
  const config = { ...CLEANER_AGENT.config, ...options };
  return {
    type: "disk_scan",
    agent: CLEANER_AGENT.name,
    status: "ready",
    sourcePath: CLEANER_SCRIPT,
    scanPaths: paths || config.scanPaths,
    filePatterns: config.filePatterns,
    dryRun: config.dryRun,
  };
}

export async function cleanPaths(paths, options = {}) {
  await ensureNodeModules();
  
  const config = { ...CLEANER_AGENT.config, ...options };
  const dryRun = config.dryRun !== false;

  return new Promise((resolve, reject) => {
    const args = [CLEANER_SCRIPT, "--paths"];
    if (Array.isArray(paths)) {
      args.push(...paths);
    } else {
      args.push(paths);
    }
    if (dryRun) args.push("--dry-run");
    if (config.deletePattern) args.push("--pattern", config.deletePattern);
    if (config.safeMode) args.push("--safe");

    const proc = spawn("python", args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env },
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
      if (options.onProgress) options.onProgress(data.toString());
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
      if (options.onProgress) options.onProgress(data.toString());
    });

    proc.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(stdout);
          resolve({
            type: "disk_clean",
            agent: CLEANER_AGENT.name,
            status: "completed",
            ...result,
          });
        } catch {
          resolve({
            type: "disk_clean",
            agent: CLEANER_AGENT.name,
            status: "completed",
            output: stdout,
          });
        }
      } else {
        reject(new Error(`清理失败 (exit ${code}): ${stderr}`));
      }
    });

    proc.on("error", reject);
  });
}

export { CLEANER_AGENT };