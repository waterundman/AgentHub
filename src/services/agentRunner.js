/**
 * AgentHub Agent 运行时执行器
 * 统一调用各项目 Agent 的入口
 */

import { PROJECT_AGENTS } from "../services/projectAgents";

let pluginManager = null;

/**
 * 设置插件管理器（由主程序在初始化时调用）
 * @param {PluginManager} manager - 插件管理器实例
 */
export function setPluginManager(manager) {
  pluginManager = manager;
}

/**
 * 运行项目 Agent（向后兼容 + 插件支持）
 * @param {string} agentName - Agent 名称
 * @param {string} task - 任务描述
 * @param {Object} options - 执行选项
 * @returns {Promise<any>}
 */
export async function runProjectAgent(agentName, task, options = {}) {
  // 优先从插件管理器查找
  if (pluginManager) {
    const plugin = pluginManager.agentExecutors.get(agentName);
    if (plugin && plugin.execute) {
      console.log(`[AgentRunner] Using plugin manager for: ${agentName}`);
      return await plugin.execute(task, options);
    }
  }

  // 回退到传统的 switch-case
  console.log(`[AgentRunner] Using legacy switch-case for: ${agentName}`);
  
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
      const { generateImage, generateBatch } = await import("../../projects/image-gen/src/image_gen.js");
      if (Array.isArray(task)) {
        return generateBatch(task, options);
      }
      return generateImage(task, options);
    }
    default:
      throw new Error(`不支持的 Agent: ${agentName}`);
  }
}

/**
 * 启动 Agent（主要入口）
 * @param {string} agentName - Agent 名称
 * @param {string} task - 任务描述
 * @param {Object} options - 执行选项
 * @returns {Promise<any>}
 */
export async function launchAgent(agentName, task, options = {}) {
  const agentDef = PROJECT_AGENTS.find(a => a.name === agentName);
  if (!agentDef) {
    throw new Error(`未找到 Agent: ${agentName}`);
  }

  return await runProjectAgent(agentName, task, { ...options, agent: agentDef });
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
