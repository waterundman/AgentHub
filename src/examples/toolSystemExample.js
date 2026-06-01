/**
 * 工具系统使用示例
 * 展示如何使用工具注册表、拦截器和沙箱配置
 */

import { toolRegistry } from '../services/toolRegistry';
import { createInterceptor } from '../services/toolCallInterceptor';

// 示例1：注册自定义工具
export function registerCustomTool() {
  const customTool = {
    name: 'custom_analysis',
    displayName: '自定义分析',
    description: '执行自定义数据分析',
    category: 'system',
    icon: 'BarChart3',
    parameters: {
      data: 'array',
      options: 'object'
    },
    permissions: ['analysis.execute'],
    sandboxed: true
  };
  
  toolRegistry.register(customTool);
  console.log('自定义工具已注册:', customTool.name);
}

// 示例2：创建工具拦截器
export function createToolInterceptor() {
  const agentConfig = {
    allowedTools: ['file_read', 'code_search', 'web_search'],
    deniedTools: ['execute_command', 'file_write'],
    maxCallsPerRun: 20,
    maxCallsPerTool: 5,
    timeout: 10000
  };
  
  const interceptor = createInterceptor(agentConfig);
  
  // 验证工具调用
  try {
    interceptor.validate('file_read'); // 允许
    interceptor.validate('execute_command'); // 被禁止，抛出错误
  } catch (error) {
    console.error('工具调用被拒绝:', error.message);
  }
  
  return interceptor;
}

// 示例3：包装工具调用
export function wrappedToolCallExample() {
  const interceptor = createInterceptor({
    allowedTools: ['file_read'],
    maxCallsPerRun: 10,
    maxCallsPerTool: 3,
    timeout: 5000
  });
  
  // 模拟工具函数
  const fileReadTool = async (input) => {
    // 模拟文件读取
    await new Promise(resolve => setTimeout(resolve, 100));
    return { content: `File content of ${input.path}` };
  };
  
  // 包装工具调用
  const wrappedFileRead = interceptor.wrapToolCall('file_read', fileReadTool);
  
  // 使用包装后的工具
  return async () => {
    try {
      const result = await wrappedFileRead({ path: '/path/to/file.txt' });
      console.log('工具调用成功:', result);
      return result;
    } catch (error) {
      console.error('工具调用失败:', error.message);
      throw error;
    }
  };
}

// 示例4：获取工具统计
export function getToolStatistics() {
  // 获取所有工具
  const allTools = toolRegistry.list();
  console.log('注册的工具数量:', allTools.length);
  
  // 按分类获取工具
  const readTools = toolRegistry.listByCategory('read');
  const writeTools = toolRegistry.listByCategory('write');
  console.log('读取工具:', readTools.length);
  console.log('写入工具:', writeTools.length);
  
  // 获取调用历史
  const agentHash = 'agent123';
  const callHistory = toolRegistry.getCallHistory(agentHash);
  console.log('调用历史:', callHistory.length);
  
  // 获取工具统计
  const toolStats = toolRegistry.getToolStats(agentHash);
  console.log('工具统计:', toolStats);
  
  return {
    allTools,
    readTools,
    writeTools,
    callHistory,
    toolStats
  };
}

// 示例5：工具沙箱配置
export function createSandboxConfig() {
  const sandboxConfig = {
    allowedTools: ['file_read', 'code_search', 'web_search'],
    deniedTools: ['execute_command', 'file_write', 'http_request'],
    maxCallsPerRun: 50,
    maxCallsPerTool: 10,
    timeout: 30000
  };
  
  // 创建拦截器
  const interceptor = createInterceptor(sandboxConfig);
  
  // 检查工具是否允许
  const toolsToCheck = ['file_read', 'execute_command', 'web_search', 'file_write'];
  
  toolsToCheck.forEach(toolName => {
    const isAllowed = interceptor.isToolAllowed(toolName);
    console.log(`工具 ${toolName}: ${isAllowed ? '允许' : '禁止'}`);
  });
  
  // 获取剩余调用次数
  const remaining = interceptor.getRemainingCalls('file_read');
  console.log('剩余调用次数:', remaining);
  
  return {
    config: sandboxConfig,
    interceptor,
    remaining
  };
}

// 示例6：批量工具注册
export function registerBatchTools() {
  const tools = [
    {
      name: 'data_export',
      displayName: '数据导出',
      description: '导出数据到各种格式',
      category: 'write',
      icon: 'Download',
      parameters: { format: 'string', data: 'array' },
      permissions: ['data.export'],
      sandboxed: true
    },
    {
      name: 'data_import',
      displayName: '数据导入',
      description: '从各种格式导入数据',
      category: 'read',
      icon: 'Upload',
      parameters: { format: 'string', source: 'string' },
      permissions: ['data.import'],
      sandboxed: true
    },
    {
      name: 'report_generate',
      displayName: '生成报告',
      description: '生成分析报告',
      category: 'system',
      icon: 'FileText',
      parameters: { template: 'string', data: 'object' },
      permissions: ['report.generate'],
      sandboxed: true
    }
  ];
  
  tools.forEach(tool => {
    toolRegistry.register(tool);
    console.log(`注册工具: ${tool.name}`);
  });
  
  return tools;
}

// 示例7：工具调用监控
export function monitorToolCalls() {
  // 模拟工具调用记录
  const mockCalls = [
    {
      toolName: 'file_read',
      agentHash: 'agent1',
      agentName: '分析Agent',
      duration: 150,
      success: true,
      timestamp: Date.now() - 1000
    },
    {
      toolName: 'code_search',
      agentHash: 'agent1',
      agentName: '分析Agent',
      duration: 200,
      success: true,
      timestamp: Date.now() - 2000
    },
    {
      toolName: 'execute_command',
      agentHash: 'agent2',
      agentName: '执行Agent',
      duration: 500,
      success: false,
      error: '命令执行超时',
      timestamp: Date.now() - 3000
    }
  ];
  
  // 记录调用
  mockCalls.forEach(call => {
    toolRegistry.logCall(call);
  });
  
  // 获取统计
  const stats = {
    total: toolRegistry.callLogs.length,
    success: toolRegistry.callLogs.filter(log => log.success).length,
    failed: toolRegistry.callLogs.filter(log => !log.success).length
  };
  
  console.log('调用统计:', stats);
  
  return stats;
}

// 导出示例函数
export const examples = {
  registerCustomTool,
  createToolInterceptor,
  wrappedToolCallExample,
  getToolStatistics,
  createSandboxConfig,
  registerBatchTools,
  monitorToolCalls
};