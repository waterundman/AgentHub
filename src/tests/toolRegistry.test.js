import { describe, it, expect, beforeEach } from 'vitest';
import { toolRegistry } from '../services/toolRegistry';

describe('ToolRegistry', () => {
  beforeEach(() => {
    // 只清空调用日志，保留工具注册表
    toolRegistry.callLogs = [];
  });

  it('should register a tool', () => {
    const tool = {
      name: 'test_tool',
      displayName: 'Test Tool',
      description: 'A test tool',
      category: 'read',
      icon: 'FileText',
      parameters: {},
      permissions: ['test'],
      sandboxed: false
    };

    toolRegistry.register(tool);
    expect(toolRegistry.get('test_tool')).toBeDefined();
    expect(toolRegistry.get('test_tool').name).toBe('test_tool');
  });

  it('should throw error when registering tool without name', () => {
    const tool = {
      displayName: 'Test Tool',
      description: 'A test tool'
    };

    expect(() => toolRegistry.register(tool)).toThrow('Tool must have a name');
  });

  it('should list all tools', () => {
    const initialCount = toolRegistry.list().length;
    
    const tool1 = { name: 'test_tool1', displayName: 'Test Tool 1', category: 'read' };
    const tool2 = { name: 'test_tool2', displayName: 'Test Tool 2', category: 'write' };

    toolRegistry.register(tool1);
    toolRegistry.register(tool2);

    const tools = toolRegistry.list();
    expect(tools).toHaveLength(initialCount + 2);
    expect(tools.map(t => t.name)).toContain('test_tool1');
    expect(tools.map(t => t.name)).toContain('test_tool2');
  });

  it('should list tools by category', () => {
    const initialReadCount = toolRegistry.listByCategory('read').length;
    const initialWriteCount = toolRegistry.listByCategory('write').length;
    
    const readTool = { name: 'test_read_tool', displayName: 'Test Read Tool', category: 'read' };
    const writeTool = { name: 'test_write_tool', displayName: 'Test Write Tool', category: 'write' };
    const anotherReadTool = { name: 'test_another_read', displayName: 'Test Another Read', category: 'read' };

    toolRegistry.register(readTool);
    toolRegistry.register(writeTool);
    toolRegistry.register(anotherReadTool);

    const readTools = toolRegistry.listByCategory('read');
    expect(readTools).toHaveLength(initialReadCount + 2);
    expect(readTools.every(t => t.category === 'read')).toBe(true);

    const writeTools = toolRegistry.listByCategory('write');
    expect(writeTools).toHaveLength(initialWriteCount + 1);
    expect(writeTools.some(t => t.name === 'test_write_tool')).toBe(true);
  });

  it('should log tool calls', () => {
    const record = {
      toolName: 'test_tool',
      agentHash: 'agent123',
      agentName: 'Test Agent',
      duration: 100,
      success: true,
      timestamp: Date.now()
    };

    const logEntry = toolRegistry.logCall(record);
    expect(logEntry.id).toBeDefined();
    expect(logEntry.toolName).toBe('test_tool');
    expect(logEntry.agentHash).toBe('agent123');
    expect(toolRegistry.callLogs).toHaveLength(1);
  });

  it('should get call history for agent', () => {
    const record1 = {
      toolName: 'tool1',
      agentHash: 'agent1',
      agentName: 'Agent 1',
      duration: 100,
      success: true,
      timestamp: Date.now()
    };

    const record2 = {
      toolName: 'tool2',
      agentHash: 'agent2',
      agentName: 'Agent 2',
      duration: 200,
      success: false,
      timestamp: Date.now() + 1000
    };

    const record3 = {
      toolName: 'tool3',
      agentHash: 'agent1',
      agentName: 'Agent 1',
      duration: 150,
      success: true,
      timestamp: Date.now() + 2000
    };

    toolRegistry.logCall(record1);
    toolRegistry.logCall(record2);
    toolRegistry.logCall(record3);

    const agent1History = toolRegistry.getCallHistory('agent1');
    expect(agent1History).toHaveLength(2);
    expect(agent1History.every(log => log.agentHash === 'agent1')).toBe(true);

    const agent2History = toolRegistry.getCallHistory('agent2');
    expect(agent2History).toHaveLength(1);
    expect(agent2History[0].toolName).toBe('tool2');
  });

  it('should get tool stats for agent', () => {
    const record1 = {
      toolName: 'tool1',
      agentHash: 'agent1',
      duration: 100,
      success: true,
      timestamp: Date.now()
    };

    const record2 = {
      toolName: 'tool1',
      agentHash: 'agent1',
      duration: 200,
      success: false,
      timestamp: Date.now() + 1000
    };

    const record3 = {
      toolName: 'tool2',
      agentHash: 'agent1',
      duration: 150,
      success: true,
      timestamp: Date.now() + 2000
    };

    toolRegistry.logCall(record1);
    toolRegistry.logCall(record2);
    toolRegistry.logCall(record3);

    const stats = toolRegistry.getToolStats('agent1');
    expect(stats.tool1).toBeDefined();
    expect(stats.tool1.total).toBe(2);
    expect(stats.tool1.success).toBe(1);
    expect(stats.tool1.failed).toBe(1);
    expect(stats.tool1.totalDuration).toBe(300);

    expect(stats.tool2).toBeDefined();
    expect(stats.tool2.total).toBe(1);
    expect(stats.tool2.success).toBe(1);
    expect(stats.tool2.failed).toBe(0);
    expect(stats.tool2.totalDuration).toBe(150);
  });

  it('should clear history', () => {
    toolRegistry.logCall({
      toolName: 'tool1',
      agentHash: 'agent1',
      duration: 100,
      success: true,
      timestamp: Date.now()
    });

    expect(toolRegistry.callLogs).toHaveLength(1);
    toolRegistry.clearHistory();
    expect(toolRegistry.callLogs).toHaveLength(0);
  });

  it('should maintain maximum 1000 logs', () => {
    const baseTime = Date.now();
    // 添加1001条记录
    for (let i = 0; i < 1001; i++) {
      toolRegistry.logCall({
        toolName: 'tool1',
        agentHash: 'agent1',
        duration: 100,
        success: true,
        timestamp: baseTime + i
      });
    }

    expect(toolRegistry.callLogs).toHaveLength(1000);
    // 验证保留的是最近的1000条（应该是从baseTime+1到baseTime+1000）
    const timestamps = toolRegistry.callLogs.map(log => log.timestamp);
    expect(timestamps[0]).toBeGreaterThanOrEqual(baseTime + 1);
    expect(timestamps[999]).toBeLessThanOrEqual(baseTime + 1000);
  });
});

describe('Built-in Tools', () => {
  it('should have built-in tools registered', () => {
    const tools = toolRegistry.list();
    expect(tools.length).toBeGreaterThan(0);
    
    // 检查一些关键工具是否存在
    const toolNames = tools.map(t => t.name);
    expect(toolNames).toContain('file_read');
    expect(toolNames).toContain('file_write');
    expect(toolNames).toContain('execute_command');
    expect(toolNames).toContain('http_request');
    expect(toolNames).toContain('web_search');
    expect(toolNames).toContain('code_edit');
    expect(toolNames).toContain('code_search');
    expect(toolNames).toContain('env_read');
  });

  it('should have correct tool categories', () => {
    const readTools = toolRegistry.listByCategory('read');
    const writeTools = toolRegistry.listByCategory('write');
    const executeTools = toolRegistry.listByCategory('execute');
    const networkTools = toolRegistry.listByCategory('network');
    const systemTools = toolRegistry.listByCategory('system');

    expect(readTools.length).toBeGreaterThan(0);
    expect(writeTools.length).toBeGreaterThan(0);
    expect(executeTools.length).toBeGreaterThan(0);
    expect(networkTools.length).toBeGreaterThan(0);
    expect(systemTools.length).toBeGreaterThan(0);

    // 验证每个工具都有正确的分类
    readTools.forEach(tool => expect(tool.category).toBe('read'));
    writeTools.forEach(tool => expect(tool.category).toBe('write'));
    executeTools.forEach(tool => expect(tool.category).toBe('execute'));
    networkTools.forEach(tool => expect(tool.category).toBe('network'));
    systemTools.forEach(tool => expect(tool.category).toBe('system'));
  });

  it('should have required properties for each tool', () => {
    const tools = toolRegistry.list();
    
    tools.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      
      expect(tool.displayName).toBeDefined();
      expect(typeof tool.displayName).toBe('string');
      
      // description是可选的
      if (tool.description) {
        expect(typeof tool.description).toBe('string');
      }
      
      expect(tool.category).toBeDefined();
      expect(['read', 'write', 'execute', 'network', 'system']).toContain(tool.category);
      
      // icon是可选的
      if (tool.icon) {
        expect(typeof tool.icon).toBe('string');
      }
      
      // parameters, permissions, sandboxed是可选的
      if (tool.parameters) {
        expect(typeof tool.parameters).toBe('object');
      }
      
      if (tool.permissions) {
        expect(Array.isArray(tool.permissions)).toBe(true);
      }
      
      if (tool.sandboxed !== undefined) {
        expect(typeof tool.sandboxed).toBe('boolean');
      }
    });
  });
});