import { describe, it, expect, beforeEach } from 'vitest';
import { ToolCallInterceptor, createInterceptor } from '../services/toolCallInterceptor';

describe('ToolCallInterceptor', () => {
  let interceptor;

  beforeEach(() => {
    interceptor = new ToolCallInterceptor({
      allowedTools: ['tool1', 'tool2'],
      deniedTools: ['tool3'],
      maxCallsPerRun: 5,
      maxCallsPerTool: 2,
      timeout: 1000
    });
  });

  it('should create interceptor with default config', () => {
    const defaultInterceptor = new ToolCallInterceptor();
    expect(defaultInterceptor.config.maxCallsPerRun).toBe(50);
    expect(defaultInterceptor.config.maxCallsPerTool).toBe(10);
    expect(defaultInterceptor.config.timeout).toBe(30000);
  });

  it('should create interceptor with custom config', () => {
    expect(interceptor.config.allowedTools).toEqual(['tool1', 'tool2']);
    expect(interceptor.config.deniedTools).toEqual(['tool3']);
    expect(interceptor.config.maxCallsPerRun).toBe(5);
    expect(interceptor.config.maxCallsPerTool).toBe(2);
    expect(interceptor.config.timeout).toBe(1000);
  });

  it('should validate allowed tools', () => {
    expect(interceptor.validate('tool1')).toBe(true);
    expect(interceptor.validate('tool2')).toBe(true);
  });

  it('should throw error for denied tools', () => {
    expect(() => interceptor.validate('tool3')).toThrow('Tool tool3 is denied for this agent');
  });

  it('should throw error for tools not in allowed list', () => {
    expect(() => interceptor.validate('tool4')).toThrow('Tool tool4 is not in allowed list');
  });

  it('should track call counts', () => {
    interceptor.validate('tool1');
    interceptor.validate('tool1');
    
    expect(interceptor.callCount['tool1']).toBe(2);
    expect(interceptor.totalCalls).toBe(2);
  });

  it('should throw error when exceeding max calls per tool', () => {
    interceptor.validate('tool1');
    interceptor.validate('tool1');
    
    expect(() => interceptor.validate('tool1')).toThrow('Tool tool1 call limit exceeded (2)');
  });

  it('should throw error when exceeding max calls per run', () => {
    // 设置更高的单工具限制
    const testInterceptor = new ToolCallInterceptor({
      allowedTools: ['tool1', 'tool2'],
      deniedTools: ['tool3'],
      maxCallsPerRun: 5,
      maxCallsPerTool: 10,
      timeout: 1000
    });
    
    // 调用5次（达到限制）
    testInterceptor.validate('tool1');
    testInterceptor.validate('tool2');
    testInterceptor.validate('tool1');
    testInterceptor.validate('tool2');
    testInterceptor.validate('tool1');
    
    // 第6次应该抛出错误（总调用次数超过限制）
    expect(() => testInterceptor.validate('tool2')).toThrow('Total call limit exceeded (5)');
  });

  it('should check if tool is allowed without incrementing count', () => {
    expect(interceptor.isToolAllowed('tool1')).toBe(true);
    expect(interceptor.isToolAllowed('tool3')).toBe(false);
    expect(interceptor.isToolAllowed('tool4')).toBe(false);
    
    // 验证计数器没有增加
    expect(interceptor.totalCalls).toBe(0);
    expect(interceptor.callCount['tool1']).toBeUndefined();
  });

  it('should check if call limit is reached', () => {
    expect(interceptor.isCallLimitReached('tool1')).toBe(false);
    
    // 达到单工具限制
    interceptor.validate('tool1');
    interceptor.validate('tool1');
    
    expect(interceptor.isCallLimitReached('tool1')).toBe(true);
    expect(interceptor.isCallLimitReached('tool2')).toBe(false);
  });

  it('should get stats', () => {
    interceptor.validate('tool1');
    interceptor.validate('tool2');
    interceptor.validate('tool1');
    
    const stats = interceptor.getStats();
    expect(stats.totalCalls).toBe(3);
    expect(stats.callCount['tool1']).toBe(2);
    expect(stats.callCount['tool2']).toBe(1);
    expect(stats.startTime).toBeDefined();
    expect(stats.uptime).toBeDefined();
  });

  it('should get remaining calls', () => {
    interceptor.validate('tool1');
    interceptor.validate('tool1');
    
    const remaining = interceptor.getRemainingCalls('tool1');
    expect(remaining.totalRemaining).toBe(3); // 5 - 2
    expect(remaining.toolRemaining).toBe(0); // 2 - 2
    
    const remaining2 = interceptor.getRemainingCalls('tool2');
    expect(remaining2.totalRemaining).toBe(3);
    expect(remaining2.toolRemaining).toBe(2); // 2 - 0
  });

  it('should reset counters', () => {
    interceptor.validate('tool1');
    interceptor.validate('tool2');
    
    expect(interceptor.totalCalls).toBe(2);
    
    interceptor.reset();
    
    expect(interceptor.totalCalls).toBe(0);
    expect(interceptor.callCount).toEqual({});
  });

  it('should wrap tool call with validation and timeout', async () => {
    const toolFn = async (input) => {
      return { result: input.value * 2 };
    };
    
    const wrappedFn = interceptor.wrapToolCall('tool1', toolFn);
    
    const result = await wrappedFn({ value: 5 });
    
    expect(result.success).toBe(true);
    expect(result.result).toEqual({ result: 10 });
    expect(result.duration).toBeDefined();
    expect(result.toolName).toBe('tool1');
    expect(result.timestamp).toBeDefined();
  });

  it('should handle tool call errors', async () => {
    const toolFn = async (input) => {
      throw new Error('Tool execution failed');
    };
    
    const wrappedFn = interceptor.wrapToolCall('tool1', toolFn);
    
    const result = await wrappedFn({ value: 5 });
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('Tool execution failed');
    expect(result.duration).toBeDefined();
    expect(result.toolName).toBe('tool1');
  });

  it('should timeout long running tool calls', async () => {
    const toolFn = async (input) => {
      // 模拟长时间运行
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { result: 'done' };
    };
    
    const wrappedFn = interceptor.wrapToolCall('tool1', toolFn);
    
    const result = await wrappedFn({ value: 5 });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('timeout');
  }, 3000);
});

describe('createInterceptor', () => {
  it('should create interceptor instance', () => {
    const config = {
      allowedTools: ['tool1'],
      maxCallsPerRun: 10
    };
    
    const interceptor = createInterceptor(config);
    
    expect(interceptor).toBeInstanceOf(ToolCallInterceptor);
    expect(interceptor.config.allowedTools).toEqual(['tool1']);
    expect(interceptor.config.maxCallsPerRun).toBe(10);
  });
});

describe('Edge Cases', () => {
  it('should handle empty allowed tools list', () => {
    const interceptor = new ToolCallInterceptor({
      allowedTools: [],
      deniedTools: ['tool3']
    });
    
    // 空允许列表应该允许所有工具（除了被禁止的）
    expect(interceptor.validate('tool1')).toBe(true);
    expect(interceptor.validate('tool2')).toBe(true);
    expect(() => interceptor.validate('tool3')).toThrow();
  });

  it('should handle undefined config properties', () => {
    const interceptor = new ToolCallInterceptor({
      allowedTools: ['tool1']
    });
    
    expect(interceptor.config.deniedTools).toEqual([]);
    expect(interceptor.config.maxCallsPerRun).toBe(50);
    expect(interceptor.config.maxCallsPerTool).toBe(10);
    expect(interceptor.config.timeout).toBe(30000);
  });

  it('should handle concurrent calls', async () => {
    const interceptor = new ToolCallInterceptor({
      maxCallsPerRun: 5,
      maxCallsPerTool: 5
    });
    
    const toolFn = async (input) => {
      await new Promise(resolve => setTimeout(resolve, 100));
      return { result: input.value };
    };
    
    const wrappedFn = interceptor.wrapToolCall('tool1', toolFn);
    
    // 并发调用
    const promises = [
      wrappedFn({ value: 1 }),
      wrappedFn({ value: 2 }),
      wrappedFn({ value: 3 })
    ];
    
    const results = await Promise.all(promises);
    
    // 验证所有调用都成功
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
    
    // 验证计数器正确
    expect(interceptor.totalCalls).toBe(3);
    expect(interceptor.callCount['tool1']).toBe(3);
  });
});