/**
 * PPT Master Agent - 标准化接口
 * 将 ppt-master 项目适配到 AgentHub 范式
 */

import { PPT_MASTER_AGENT } from "../agent";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const PPT_SOURCE = path.resolve("W:\\项目仓库\\agenthub\\projects\\ppt-master");
const SCRIPTS_DIR = path.join(PPT_SOURCE, "scripts");

export async function analyzeDocument(content, options = {}) {
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
  const layoutsDir = path.join(PPT_SOURCE, "templates", "layouts");
  if (!fs.existsSync(layoutsDir)) return [];

  return fs.readdirSync(layoutsDir).filter(f => {
    const fullPath = path.join(layoutsDir, f);
    return fs.statSync(fullPath).isDirectory();
  });
}

export { PPT_MASTER_AGENT };
