import { describe, it, expect, beforeEach } from 'vitest';
import { toolRegistry } from '../../src/services/toolRegistry';

describe('ToolRegistry', () => {
  beforeEach(() => {
    toolRegistry.clearHistory();
  });

  describe('register', () => {
    it('should register a tool', () => {
      const tool = {
        name: 'test_tool',
        displayName: 'Test Tool',
        category: 'read',
        icon: 'FileText'
      };

      toolRegistry.register(tool);
      expect(toolRegistry.get('test_tool')).toBeDefined();
      expect(toolRegistry.get('test_tool').displayName).toBe('Test Tool');
    });

    it('should throw if tool has no name', () => {
      expect(() => toolRegistry.register({})).toThrow('Tool must have a name');
    });

    it('should list all tools', () => {
      const initialCount = toolRegistry.list().length;
      toolRegistry.register({ name: 'extra_tool_1', category: 'read' });
      toolRegistry.register({ name: 'extra_tool_2', category: 'write' });

      const tools = toolRegistry.list();
      expect(tools.length).toBe(initialCount + 2);
    });

    it('should list tools by category', () => {
      const readTools = toolRegistry.listByCategory('read');
      expect(readTools.length).toBeGreaterThan(0);
      readTools.forEach(tool => {
        expect(tool.category).toBe('read');
      });
    });

    it('should have built-in tools', () => {
      expect(toolRegistry.get('file_read')).toBeDefined();
      expect(toolRegistry.get('file_write')).toBeDefined();
      expect(toolRegistry.get('execute_command')).toBeDefined();
    });
  });

  describe('call logging', () => {
    it('should log tool calls', () => {
      toolRegistry.logCall({
        agentHash: 'agent-1',
        toolName: 'file_read',
        duration: 100,
        success: true
      });

      const history = toolRegistry.getCallHistory('agent-1');
      expect(history).toHaveLength(1);
      expect(history[0].toolName).toBe('file_read');
    });

    it('should filter call history by agent', () => {
      toolRegistry.logCall({ agentHash: 'agent-1', toolName: 'file_read' });
      toolRegistry.logCall({ agentHash: 'agent-2', toolName: 'file_read' });
      toolRegistry.logCall({ agentHash: 'agent-1', toolName: 'file_write' });

      const history = toolRegistry.getCallHistory('agent-1');
      expect(history).toHaveLength(2);
    });

    it('should limit call history', () => {
      for (let i = 0; i < 10; i++) {
        toolRegistry.logCall({ agentHash: 'agent-1', toolName: 'file_read' });
      }

      const history = toolRegistry.getCallHistory('agent-1', 5);
      expect(history).toHaveLength(5);
    });

    it('should get tool stats', () => {
      toolRegistry.logCall({ agentHash: 'agent-1', toolName: 'file_read', success: true, duration: 100 });
      toolRegistry.logCall({ agentHash: 'agent-1', toolName: 'file_read', success: true, duration: 200 });
      toolRegistry.logCall({ agentHash: 'agent-1', toolName: 'file_write', success: false, duration: 50 });

      const stats = toolRegistry.getToolStats('agent-1');
      expect(stats.file_read.total).toBe(2);
      expect(stats.file_read.success).toBe(2);
      expect(stats.file_write.total).toBe(1);
      expect(stats.file_write.failed).toBe(1);
    });

    it('should clear history', () => {
      toolRegistry.logCall({ agentHash: 'agent-1', toolName: 'file_read' });
      toolRegistry.clearHistory();

      const history = toolRegistry.getCallHistory('agent-1');
      expect(history).toHaveLength(0);
    });
  });
});
