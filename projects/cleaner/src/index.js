/**
 * Cleaner Agent - 标准化接口
 * 将清扫者 agent 适配到 AgentHub 范式
 */

import { CLEANER_AGENT } from "../agent";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLEANER_SCRIPT = path.join(__dirname, "clean_disk.py");

export async function scanPaths(paths, options = {}) {
  const config = { ...CLEANER_AGENT.config, ...options };
  return {
    type: "disk_scan",
    agent: CLEANER_AGENT.name,
    status: "ready",
    sourcePath: __dirname,
    scanPaths: paths || config.scanPaths,
    filePatterns: config.filePatterns,
    dryRun: config.dryRun,
  };
}

export async function cleanPaths(paths, options = {}) {
  const config = { ...CLEANER_AGENT.config, ...options };
  const dryRun = config.dryRun !== false;

  return new Promise((resolve, reject) => {
    const args = dryRun ? ["--dry-run"] : [];
    const proc = spawn("python", [CLEANER_SCRIPT, ...args], {
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
        resolve({
          type: "disk_cleanup",
          agent: CLEANER_AGENT.name,
          status: "completed",
          output: stdout,
          dryRun,
        });
      } else {
        reject(new Error(`清理失败 (exit ${code}): ${stderr}`));
      }
    });

    proc.on("error", reject);
  });
}

export { CLEANER_AGENT };
