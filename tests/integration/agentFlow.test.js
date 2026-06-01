import { describe, it, expect, vi } from 'vitest';
import { computeDiff, countChanges } from '../../src/utils/diff';
import { sha256, shortHash } from '../../src/utils/hash';
import { ToolCallInterceptor } from '../../src/services/toolCallInterceptor';
import { toolRegistry } from '../../src/services/toolRegistry';

describe('Agent Execution Flow', () => {
  describe('Agent Interface', () => {
    it('should define agent execution interface', () => {
      const agent = {
        hash: 'test-agent',
        name: 'Test Agent',
        systemPrompt: 'You are helpful',
        colorKey: 'purple'
      };

      expect(agent).toHaveProperty('hash');
      expect(agent).toHaveProperty('name');
      expect(agent).toHaveProperty('systemPrompt');
      expect(agent).toHaveProperty('colorKey');
    });
  });

  describe('Pipeline Status Transitions', () => {
    it('should define valid status transitions', () => {
      const validTransitions = {
        idle: ['running', 'error'],
        running: ['done', 'error'],
        done: ['idle'],
        error: ['idle']
      };

      expect(validTransitions.idle).toContain('running');
      expect(validTransitions.running).toContain('done');
      expect(validTransitions.running).toContain('error');
    });
  });

  describe('Dependency Resolution', () => {
    it('should identify ready agents with no dependencies', () => {
      const agents = [
        { hash: 'a', name: 'Agent A' },
        { hash: 'b', name: 'Agent B' },
        { hash: 'c', name: 'Agent C' }
      ];

      const dependencies = {
        'b': ['a'],
        'c': ['a', 'b']
      };

      const completed = new Set();

      const ready = agents.filter(a => {
        const deps = dependencies[a.hash] || [];
        return deps.every(d => completed.has(d));
      });

      expect(ready).toHaveLength(1);
      expect(ready[0].hash).toBe('a');
    });

    it('should unlock dependent agents after completion', () => {
      const agents = [
        { hash: 'a', name: 'Agent A' },
        { hash: 'b', name: 'Agent B' },
        { hash: 'c', name: 'Agent C' }
      ];

      const dependencies = {
        'b': ['a'],
        'c': ['a', 'b']
      };

      const completed = new Set(['a']);

      const ready = agents.filter(a => {
        if (completed.has(a.hash)) return false;
        const deps = dependencies[a.hash] || [];
        return deps.every(d => completed.has(d));
      });

      expect(ready).toHaveLength(1);
      expect(ready[0].hash).toBe('b');
    });

    it('should allow parallel execution of independent agents', () => {
      const agents = [
        { hash: 'a', name: 'Agent A' },
        { hash: 'b', name: 'Agent B' },
        { hash: 'c', name: 'Agent C' }
      ];

      const dependencies = {
        'c': ['a', 'b']
      };

      const completed = new Set();

      const ready = agents.filter(a => {
        const deps = dependencies[a.hash] || [];
        return deps.every(d => completed.has(d));
      });

      expect(ready).toHaveLength(2);
      expect(ready.map(a => a.hash)).toContain('a');
      expect(ready.map(a => a.hash)).toContain('b');
    });
  });

  describe('Diff and Hash Integration', () => {
    it('should compute diff and count changes', () => {
      const oldPrompt = 'You are a planner.\nCreate a plan.';
      const newPrompt = 'You are a planner.\nCreate a detailed plan.\nUse bullet points.';

      const diff = computeDiff(oldPrompt, newPrompt);
      const { adds, dels } = countChanges(diff);

      expect(adds).toBeGreaterThan(0);
      expect(dels).toBeGreaterThanOrEqual(0);
    });

    it('should generate consistent short hashes', async () => {
      const hash = await sha256('test');
      expect(shortHash(hash)).toBe(hash.slice(0, 7));
    });
  });

  describe('Tool System Integration', () => {
    it('should validate tool calls through interceptor', () => {
      const interceptor = new ToolCallInterceptor({
        allowedTools: ['file_read', 'file_write'],
        maxCallsPerRun: 5
      });

      expect(interceptor.validate('file_read')).toBe(true);
      expect(() => interceptor.validate('unknown_tool')).toThrow();
    });

    it('should register and retrieve tools', () => {
      const tool = toolRegistry.get('file_read');
      expect(tool).toBeDefined();
      expect(tool.name).toBe('file_read');
    });

    it('should log tool calls', () => {
      toolRegistry.logCall({
        agentHash: 'test-agent',
        toolName: 'file_read',
        success: true,
        duration: 100
      });

      const history = toolRegistry.getCallHistory('test-agent');
      expect(history.length).toBeGreaterThan(0);
    });
  });
});
