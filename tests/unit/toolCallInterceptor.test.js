import { describe, it, expect, beforeEach } from 'vitest';
import { ToolCallInterceptor } from '../../src/services/toolCallInterceptor';

describe('ToolCallInterceptor', () => {
  let interceptor;

  beforeEach(() => {
    interceptor = new ToolCallInterceptor({
      allowedTools: ['file_read', 'file_write'],
      deniedTools: ['execute_command'],
      maxCallsPerRun: 10,
      maxCallsPerTool: 3,
      timeout: 30000
    });
  });

  describe('validate', () => {
    it('should allow tools in allowed list', () => {
      expect(interceptor.validate('file_read')).toBe(true);
      expect(interceptor.validate('file_write')).toBe(true);
    });

    it('should deny tools in denied list', () => {
      expect(() => interceptor.validate('execute_command')).toThrow('denied');
    });

    it('should deny tools not in allowed list', () => {
      expect(() => interceptor.validate('http_request')).toThrow('not in allowed list');
    });

    it('should enforce per-tool call limit', () => {
      interceptor.validate('file_read');
      interceptor.validate('file_read');
      interceptor.validate('file_read');

      expect(() => interceptor.validate('file_read')).toThrow('call limit exceeded');
    });

    it('should enforce total call limit', () => {
      // maxCallsPerTool is 3, maxCallsPerRun is 10
      // Need to use different tools to hit total limit before per-tool limit
      const tools = ['file_read', 'file_write'];
      let callCount = 0;
      // Call 3 times each = 6 total, then more to reach 10
      for (let i = 0; i < 3; i++) {
        interceptor.validate('file_read');
        interceptor.validate('file_write');
      }
      // Now at 6 total calls, file_read and file_write both at 3 (limit)
      // Need to test total limit differently - use a fresh interceptor
      const testInterceptor = new ToolCallInterceptor({
        allowedTools: ['file_read', 'file_write'],
        maxCallsPerRun: 5,
        maxCallsPerTool: 10
      });

      for (let i = 0; i < 5; i++) {
        testInterceptor.validate(i % 2 === 0 ? 'file_read' : 'file_write');
      }

      expect(() => testInterceptor.validate('file_read')).toThrow('Total call limit exceeded');
    });
  });

  describe('isToolAllowed', () => {
    it('should return true for allowed tools', () => {
      expect(interceptor.isToolAllowed('file_read')).toBe(true);
    });

    it('should return false for denied tools', () => {
      expect(interceptor.isToolAllowed('execute_command')).toBe(false);
    });

    it('should return false for tools not in allowed list', () => {
      expect(interceptor.isToolAllowed('http_request')).toBe(false);
    });

    it('should not increment counters', () => {
      interceptor.isToolAllowed('file_read');
      interceptor.isToolAllowed('file_read');

      const stats = interceptor.getStats();
      expect(stats.totalCalls).toBe(0);
    });
  });

  describe('isCallLimitReached', () => {
    it('should return false when under limit', () => {
      expect(interceptor.isCallLimitReached('file_read')).toBe(false);
    });

    it('should return true when tool limit reached', () => {
      interceptor.validate('file_read');
      interceptor.validate('file_read');
      interceptor.validate('file_read');

      expect(interceptor.isCallLimitReached('file_read')).toBe(true);
    });

    it('should return true when total limit reached', () => {
      const testInterceptor = new ToolCallInterceptor({
        allowedTools: ['file_read', 'file_write'],
        maxCallsPerRun: 5,
        maxCallsPerTool: 10
      });

      for (let i = 0; i < 5; i++) {
        testInterceptor.validate(i % 2 === 0 ? 'file_read' : 'file_write');
      }

      expect(testInterceptor.isCallLimitReached('file_read')).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should track call statistics', () => {
      interceptor.validate('file_read');
      interceptor.validate('file_read');
      interceptor.validate('file_write');

      const stats = interceptor.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.callCount['file_read']).toBe(2);
      expect(stats.callCount['file_write']).toBe(1);
      expect(stats).toHaveProperty('startTime');
      expect(stats).toHaveProperty('uptime');
    });
  });

  describe('getRemainingCalls', () => {
    it('should return remaining calls', () => {
      interceptor.validate('file_read');
      interceptor.validate('file_read');

      const remaining = interceptor.getRemainingCalls('file_read');
      expect(remaining.totalRemaining).toBe(8);
      expect(remaining.toolRemaining).toBe(1);
    });

    it('should return zero when exhausted', () => {
      const testInterceptor = new ToolCallInterceptor({
        allowedTools: ['file_read', 'file_write'],
        maxCallsPerRun: 5,
        maxCallsPerTool: 10
      });

      for (let i = 0; i < 5; i++) {
        testInterceptor.validate(i % 2 === 0 ? 'file_read' : 'file_write');
      }

      const remaining = testInterceptor.getRemainingCalls('file_read');
      expect(remaining.totalRemaining).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset all counters', () => {
      interceptor.validate('file_read');
      interceptor.validate('file_write');

      interceptor.reset();

      const stats = interceptor.getStats();
      expect(stats.totalCalls).toBe(0);
      expect(stats.callCount).toEqual({});
    });
  });

  describe('withTimeout', () => {
    it('should resolve if function completes in time', async () => {
      const fastFn = () => Promise.resolve('done');
      const wrapped = interceptor.withTimeout(fastFn, 1000);

      const result = await wrapped();
      expect(result).toBe('done');
    });

    it('should reject if function times out', async () => {
      const slowFn = () => new Promise(resolve => setTimeout(resolve, 200));
      const wrapped = interceptor.withTimeout(slowFn, 50);

      await expect(wrapped()).rejects.toThrow('timeout');
    });
  });

  describe('wrapToolCall', () => {
    it('should wrap tool call with validation', async () => {
      const toolFn = () => Promise.resolve('result');
      const wrapped = interceptor.wrapToolCall('file_read', toolFn);

      const result = await wrapped();
      expect(result.success).toBe(true);
      expect(result.result).toBe('result');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('toolName', 'file_read');
    });

    it('should return error result for failed calls', async () => {
      const toolFn = () => Promise.reject(new Error('fail'));
      const wrapped = interceptor.wrapToolCall('file_read', toolFn);

      const result = await wrapped();
      expect(result.success).toBe(false);
      expect(result.error).toBe('fail');
    });

    it('should throw for denied tools', async () => {
      const toolFn = () => Promise.resolve('result');
      const wrapped = interceptor.wrapToolCall('execute_command', toolFn);

      await expect(wrapped()).rejects.toThrow('denied');
    });
  });

  describe('default config', () => {
    it('should use defaults when no config provided', () => {
      const defaultInterceptor = new ToolCallInterceptor();
      expect(defaultInterceptor.config.maxCallsPerRun).toBe(50);
      expect(defaultInterceptor.config.maxCallsPerTool).toBe(10);
      expect(defaultInterceptor.config.timeout).toBe(30000);
    });
  });
});
