/**
 * AgentHub Agent 运行时执行器
 * 统一调用各项目 Agent 的入口
 */

import { PROJECT_AGENTS } from "../services/projectAgents";
import { createInterceptor } from "./toolCallInterceptor";
import { toolRegistry } from "./toolRegistry";

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
  // 创建工具调用拦截器
  const toolConfig = options.toolConfig || {};
  const interceptor = createInterceptor(toolConfig);
  
  // 记录工具调用
  const toolCalls = [];
  
  // 包装工具调用函数
  const wrapToolCall = (toolName, fn) => {
    return async (...args) => {
      const startTime = Date.now();
      try {
        // 验证调用权限
        interceptor.validate(toolName);
        
        // 执行工具调用
        const result = await fn(...args);
        const duration = Date.now() - startTime;
        
        // 记录成功的调用
        const callRecord = {
          toolName,
          duration,
          success: true,
          input: args[0],
          output: result,
          timestamp: Date.now()
        };
        toolCalls.push(callRecord);
        toolRegistry.logCall({
          ...callRecord,
          agentHash: options.agentHash,
          agentName: agentName
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // 记录失败的调用
        const callRecord = {
          toolName,
          duration,
          success: false,
          error: error.message,
          input: args[0],
          timestamp: Date.now()
        };
        toolCalls.push(callRecord);
        toolRegistry.logCall({
          ...callRecord,
          agentHash: options.agentHash,
          agentName: agentName
        });
        
        throw error;
      }
    };
  };
  
  // 创建工具包装器
  const wrappedTools = {};
  const tools = toolRegistry.list();
  tools.forEach(tool => {
    wrappedTools[tool.name] = wrapToolCall(tool.name, async (input) => {
      // 这里是工具的实际实现
      // 目前返回模拟数据，实际应该调用真实的工具
      return { success: true, tool: tool.name, input };
    });
  });
  
  // 优先从插件管理器查找
  if (pluginManager) {
    const plugin = pluginManager.agentExecutors.get(agentName);
    if (plugin && plugin.execute) {
      console.log(`[AgentRunner] Using plugin manager for: ${agentName}`);
      const result = await plugin.execute(task, { 
        ...options, 
        tools: wrappedTools,
        interceptor 
      });
      return { ...result, toolCalls };
    }
  }

  // 回退到传统的 switch-case
  console.log(`[AgentRunner] Using legacy switch-case for: ${agentName}`);
  
  let result;
  switch (agentName) {
    case "PPT 大师": {
      const { generatePPT, listTemplates } = await import("../../projects/ppt-master/src/index.js");
      if (options.listTemplates) {
        result = { templates: await listTemplates() };
      } else {
        result = await generatePPT(task, { ...options, tools: wrappedTools, interceptor });
      }
      break;
    }
    case "清扫者": {
      const { cleanPaths } = await import("../../projects/cleaner/src/index.js");
      result = await cleanPaths(options.paths, { ...options, tools: wrappedTools, interceptor });
      break;
    }
    case "生图": {
      const { generateImage, generateBatch } = await import("../../projects/image-gen/src/image_gen.js");
      if (Array.isArray(task)) {
        result = await generateBatch(task, { ...options, tools: wrappedTools, interceptor });
      } else {
        result = await generateImage(task, { ...options, tools: wrappedTools, interceptor });
      }
      break;
    }
    default:
      throw new Error(`不支持的 Agent: ${agentName}`);
  }
  
  return { ...result, toolCalls };
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

  // 获取Agent的工具配置
  const toolConfig = options.agent?.toolConfig || {};
  
  return await runProjectAgent(agentName, task, { 
    ...options, 
    agent: agentDef,
    toolConfig,
    agentHash: options.agentHash
  });
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
