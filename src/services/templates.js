const STORAGE_TEMPLATES = "agenthub_templates_v1";
const STORAGE_HISTORY = "agenthub_history_v1";

import { loadConfig, saveConfig } from "./storage";

export async function loadTemplates() {
  try {
    const raw = await loadConfig(STORAGE_TEMPLATES);
    return raw || [];
  } catch { return []; }
}

export async function saveTemplates(templates) {
  try {
    await saveConfig(templates);
  } catch {}
}

export async function loadHistory() {
  try {
    const raw = await loadConfig(STORAGE_HISTORY);
    return raw || [];
  } catch { return []; }
}

export async function saveHistory(history) {
  try {
    await saveConfig(history);
  } catch {}
}

export async function addHistoryEntry(entry) {
  const history = await loadHistory();
  history.unshift({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
  if (history.length > 100) history.length = 100;
  await saveHistory(history);
  return history;
}

export const DEFAULT_TEMPLATES = [
  {
    name: "代码审查",
    description: "审查代码质量、安全性和性能",
    task: "请审查以下代码，分析其质量、安全性和性能问题，并提供改进建议：\n\n{{code}}",
    agents: ["研究员", "审查员"],
  },
  {
    name: "文章撰写",
    description: "从规划到成品的完整写作流程",
    task: "请撰写一篇关于以下主题的文章：\n\n{{topic}}",
    agents: ["规划师", "研究员", "执行者", "审查员"],
  },
  {
    name: "方案设计",
    description: "技术方案设计与评审",
    task: "请为以下需求设计技术方案：\n\n{{requirements}}",
    agents: ["规划师", "研究员", "执行者"],
  },
];
