import { PPT_MASTER_AGENT } from "../../projects/ppt-master/agent";
import { CLEANER_AGENT } from "../../projects/cleaner/agent";
import { IMAGE_GEN_AGENT } from "../../projects/image-gen/agent";

export const PROJECT_AGENTS = [
  PPT_MASTER_AGENT,
  CLEANER_AGENT,
  IMAGE_GEN_AGENT,
];

export function getProjectAgent(name) {
  return PROJECT_AGENTS.find(a => a.name === name);
}

export function getProjectAgentsByCapability(capability) {
  return PROJECT_AGENTS.filter(a => a.capabilities.includes(capability));
}

/**
 * 注册项目 Agent（向后兼容）
 * @deprecated 使用 pluginManager.register() 替代
 */
export function registerProjectAgent(agent) {
  PROJECT_AGENTS.push(agent);
}

/**
 * 初始化项目 Agent 到插件系统
 * @param {PluginManager} pluginManager - 插件管理器实例
 */
export async function initProjectAgents(pluginManager) {
  const { createAgentPlugin } = await import("../plugins/factory.js");
  
  for (const agentDef of PROJECT_AGENTS) {
    try {
      const agentName = agentDef.name;
      
      const plugin = createAgentPlugin({
        name: `project-${agentName}`,
        version: '1.0.0',
        definition: agentDef,
        capabilities: agentDef.capabilities || [],
        
        async execute(task, options) {
          const { runProjectAgent } = await import("./agentRunner.js");
          return await runProjectAgent(agentName, task, options);
        },
        
        async onRegister() {
          console.log(`[ProjectAgents] Plugin registered: ${agentName}`);
        },
      });
      
      await pluginManager.register(plugin);
    } catch (error) {
      console.error(`[ProjectAgents] Error registering agent ${agentDef.name}:`, error);
    }
  }
}
