/**
 * PPT Master Agent - 标准化接口
 * 将 ppt-master 项目适配到 AgentHub 范式
 */

import { PPT_MASTER_AGENT } from "../agent";

// Node.js 模块延迟导入，仅在 Electron 环境中使用
let spawn, path, fs;
let PPT_SOURCE, SCRIPTS_DIR;

async function ensureNodeModules() {
  if (!spawn || !path || !fs) {
    // 动态导入 Node.js 模块
    const childProcess = await import('child_process');
    const pathModule = await import('path');
    const fsModule = await import('fs');
    
    spawn = childProcess.spawn;
    path = pathModule.default || pathModule;
    fs = fsModule.default || fsModule;
    
    PPT_SOURCE = path.resolve(process.cwd(), 'projects/ppt-master');
    SCRIPTS_DIR = path.join(PPT_SOURCE, "scripts");
  }
}

export async function analyzeDocument(content, options = {}) {
  await ensureNodeModules();
  
  return {
    type: "document_analysis",
    agent: PPT_MASTER_AGENT.name,
    status: "ready",
    sourcePath: PPT_SOURCE,
    templates: PPT_MASTER_AGENT.config.templates,
    maxSlides: PPT_MASTER_AGENT.config.maxSlides,
  };
}

export async function generatePPT(task, options = {}) {
  await ensureNodeModules();
  
  const config = { ...PPT_MASTER_AGENT.config, ...options };
  const template = options.template || config.defaultTemplate;
  const outputDir = options.outputDir || path.join(PPT_SOURCE, "output");

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    const args = [
      path.join(SCRIPTS_DIR, "pptx_cli.py"),
      "--task", task,
      "--template", template,
      "--output", outputDir,
      "--max-slides", String(config.maxSlides),
    ];

    if (options.dryRun) args.push("--dry-run");
    if (options.noImages) args.push("--no-images");

    const proc = spawn("python", args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: PPT_SOURCE,
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
          type: "ppt_generation",
          agent: PPT_MASTER_AGENT.name,
          status: "completed",
          output: stdout,
          template,
          outputDir,
        });
      } else {
        reject(new Error(`PPT 生成失败 (exit ${code}): ${stderr}`));
      }
    });

    proc.on("error", reject);
  });
}

export async function listTemplates() {
  await ensureNodeModules();
  
  const layoutsDir = path.join(PPT_SOURCE, "templates", "layouts");
  if (!fs.existsSync(layoutsDir)) return [];

  return fs.readdirSync(layoutsDir).filter(f => {
    const fullPath = path.join(layoutsDir, f);
    return fs.statSync(fullPath).isDirectory();
  });
}

export { PPT_MASTER_AGENT };