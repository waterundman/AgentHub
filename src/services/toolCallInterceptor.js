/**
 * 工具调用拦截器
 * 验证工具调用权限，记录日志，强制调用限制
 */
export class ToolCallInterceptor {
  constructor(agentConfig = {}) {
    this.config = {
      allowedTools: [],
      deniedTools: [],
      maxCallsPerRun: 50,
      maxCallsPerTool: 10,
      timeout: 30000,
      ...agentConfig
    };
    this.callCount = {};
    this.totalCalls = 0;
    this.startTime = Date.now();
  }

  /**
   * 验证工具调用是否允许
   * @param {string} toolName - 工具名称
   * @throws {Error} 如果调用不被允许
   */
  validate(toolName) {
    // 检查是否在禁止列表
    if (this.config.deniedTools?.includes(toolName)) {
      throw new Error(`Tool ${toolName} is denied for this agent`);
    }

    // 检查是否在允许列表（如果设置了允许列表）
    if (this.config.allowedTools?.length > 0 && 
        !this.config.allowedTools.includes(toolName)) {
      throw new Error(`Tool ${toolName} is not in allowed list`);
    }

    // 检查总调用次数
    this.totalCalls++;
    if (this.totalCalls > this.config.maxCallsPerRun) {
      throw new Error(`Total call limit exceeded (${this.config.maxCallsPerRun})`);
    }

    // 检查单工具调用次数
    this.callCount[toolName] = (this.callCount[toolName] || 0) + 1;
    if (this.callCount[toolName] > this.config.maxCallsPerTool) {
      throw new Error(`Tool ${toolName} call limit exceeded (${this.config.maxCallsPerTool})`);
    }

    return true;
  }

  /**
   * 检查工具是否被允许（不增加计数）
   * @param {string} toolName - 工具名称
   * @returns {boolean}
   */
  isToolAllowed(toolName) {
    // 检查是否在禁止列表
    if (this.config.deniedTools?.includes(toolName)) {
      return false;
    }

    // 检查是否在允许列表（如果设置了允许列表）
    if (this.config.allowedTools?.length > 0 && 
        !this.config.allowedTools.includes(toolName)) {
      return false;
    }

    return true;
  }

  /**
   * 检查是否达到调用限制
   * @param {string} toolName - 工具名称
   * @returns {boolean}
   */
  isCallLimitReached(toolName) {
    // 检查总调用次数
    if (this.totalCalls >= this.config.maxCallsPerRun) {
      return true;
    }

    // 检查单工具调用次数
    if ((this.callCount[toolName] || 0) >= this.config.maxCallsPerTool) {
      return true;
    }

    return false;
  }

  /**
   * 获取调用统计
   * @returns {Object}
   */
  getStats() {
    return {
      totalCalls: this.totalCalls,
      callCount: { ...this.callCount },
      startTime: this.startTime,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * 获取剩余调用次数
   * @param {string} toolName - 工具名称
   * @returns {Object}
   */
  getRemainingCalls(toolName) {
    return {
      totalRemaining: Math.max(0, this.config.maxCallsPerRun - this.totalCalls),
      toolRemaining: Math.max(0, this.config.maxCallsPerTool - (this.callCount[toolName] || 0))
    };
  }

  /**
   * 重置计数器
   */
  reset() {
    this.callCount = {};
    this.totalCalls = 0;
    this.startTime = Date.now();
  }

  /**
   * 创建超时包装器
   * @param {Function} fn - 要执行的函数
   * @param {number} timeout - 超时时间（毫秒）
   * @returns {Function}
   */
  withTimeout(fn, timeout) {
    return async (...args) => {
      const timeoutMs = timeout || this.config.timeout;
      return Promise.race([
        fn(...args),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Tool call timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]);
    };
  }

  /**
   * 包装工具调用，添加验证和超时
   * @param {string} toolName - 工具名称
   * @param {Function} toolFn - 工具函数
   * @returns {Function}
   */
  wrapToolCall(toolName, toolFn) {
    return async (...args) => {
      // 验证调用
      this.validate(toolName);
      
      // 包装超时
      const wrappedFn = this.withTimeout(toolFn, this.config.timeout);
      
      // 记录开始时间
      const startTime = Date.now();
      
      try {
        const result = await wrappedFn(...args);
        const duration = Date.now() - startTime;
        
        return {
          success: true,
          result,
          duration,
          toolName,
          timestamp: Date.now()
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        
        return {
          success: false,
          error: error.message,
          duration,
          toolName,
          timestamp: Date.now()
        };
      }
    };
  }
}

/**
 * 创建工具调用拦截器
 * @param {Object} agentConfig - Agent配置
 * @returns {ToolCallInterceptor}
 */
export function createInterceptor(agentConfig) {
  return new ToolCallInterceptor(agentConfig);
}