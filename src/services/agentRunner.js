/**
 * AgentHub Agent 运行时执行器
 * 统一调用各项目 Agent 的入口
 */

import { PROJECT_AGENTS } from "../services/projectAgents";

export async function launchAgent(agentName, task, options = {}) {
  const agentDef = PROJECT_AGENTS.find(a => a.name === agentName);
  if (!agentDef) {
    throw new Error(`未找到 Agent: ${agentName}`);
  }

  switch (agentName) {
    case "PPT 大师": {
      const { generatePPT, listTemplates } = await import("../../projects/ppt-master/src/index.js");
      if (options.listTemplates) return { templates: await listTemplates() };
      return generatePPT(task, options);
    }
    case "清扫者": {
      const { cleanPaths } = await import("../../projects/cleaner/src/index.js");
      return cleanPaths(options.paths, options);
    }
    case "生图": {
      const { generateImage, generateBatch } = await import("../../projects/image-gen/src/index.js");
      if (Array.isArray(task)) {
        return generateBatch(task, options);
      }
      return generateImage(task, options);
    }
    default:
      throw new Error(`不支持的 Agent: ${agentName}`);
  }
}

export async function getAgentInfo(agentName) {
  const agentDef = PROJECT_AGENTS.find(a => a.name === agentName);
  if (!agentDef) return null;

  return {
    name: agentDef.name,
    subtitle: agentDef.subtitle,
    description: agentDef.description,
    capabilities: agentDef.capabilities,
    version: agentDef.version,
    config: agentDef.config,
  };
}

export { PROJECT_AGENTS };
