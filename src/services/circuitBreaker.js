/**
 * 断路器 (Circuit Breaker) 实现
 * 支持 CLOSED/OPEN/HALF_OPEN 三状态
 * 用于 LLM Provider 故障检测和自动恢复
 */

// 断路器状态枚举
export const CircuitState = {
  CLOSED: 'CLOSED',       // 正常状态，允许请求通过
  OPEN: 'OPEN',           // 断路状态，拒绝所有请求
  HALF_OPEN: 'HALF_OPEN', // 半开状态，允许少量探测请求
};

// 断路器错误类型
export class CircuitBreakerOpenError extends Error {
  constructor(breakerName, retryAfter) {
    super(`Circuit breaker "${breakerName}" is OPEN. Retry after ${retryAfter}ms`);
    this.name = 'CircuitBreakerOpenError';
    this.breakerName = breakerName;
    this.retryAfter = retryAfter;
    this.isCircuitBreakerError = true;
  }
}

/**
 * 断路器类
 * @example
 * const breaker = new CircuitBreaker('anthropic', {
 *   failureThreshold: 3,
 *   recoveryTimeout: 60000,
 *   successThreshold: 2
 * });
 * 
 * // 使用断路器包装请求
 * const result = await breaker.call(() => fetch('https://api.anthropic.com/...'));
 */
export class CircuitBreaker {
  /**
   * @param {string} name - 断路器名称（通常为 Provider 名称）
   * @param {Object} options - 配置选项
   * @param {number} options.failureThreshold - 触发断路的失败次数阈值
   * @param {number} options.recoveryTimeout - 从 OPEN 到 HALF_OPEN 的恢复超时（毫秒）
   * @param {number} options.successThreshold - HALF_OPEN 状态下关闭断路所需的成功次数
   * @param {number} options.monitoringWindow - 监控窗口时间（毫秒），用于计算失败率
   */
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 3;
    this.recoveryTimeout = options.recoveryTimeout || 60000; // 默认 1 分钟
    this.successThreshold = options.successThreshold || 2;
    this.monitoringWindow = options.monitoringWindow || 120000; // 默认 2 分钟

    // 状态
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();

    // 历史记录（用于监控）
    this.history = [];
    this.maxHistorySize = 100;
  }

  /**
   * 获取当前状态
   * @returns {string}
   */
  getState() {
    // 检查是否应该从 OPEN 转换到 HALF_OPEN
    if (this.state === CircuitState.OPEN && this.lastFailureTime) {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.recoveryTimeout) {
        this._transitionTo(CircuitState.HALF_OPEN);
      }
    }
    return this.state;
  }

  /**
   * 执行受断路器保护的请求
   * @param {Function} fn - 要执行的异步函数
   * @returns {Promise<*>}
   * @throws {CircuitBreakerOpenError} 当断路器处于 OPEN 状态时
   */
  async call(fn) {
    const currentState = this.getState();

    // OPEN 状态：直接拒绝
    if (currentState === CircuitState.OPEN) {
      const retryAfter = this._getRetryAfter();
      this._recordEvent('rejected');
      throw new CircuitBreakerOpenError(this.name, retryAfter);
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (error) {
      this._onFailure(error);
      throw error;
    }
  }

  /**
   * 成功回调
   * @private
   */
  _onSuccess() {
    this.failures = 0; // 重置连续失败计数

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this._transitionTo(CircuitState.CLOSED);
        this.successes = 0;
      }
    }

    this._recordEvent('success');
  }

  /**
   * 失败回调
   * @private
   */
  _onFailure(error) {
    this.failures++;
    this.lastFailureTime = Date.now();
    this.successes = 0; // 重置成功计数

    if (this.state === CircuitState.HALF_OPEN) {
      // HALF_OPEN 状态下失败，立即回到 OPEN
      this._transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED && this.failures >= this.failureThreshold) {
      // CLOSED 状态下连续失败达到阈值，打开断路器
      this._transitionTo(CircuitState.OPEN);
    }

    this._recordEvent('failure', error.message);
  }

  /**
   * 状态转换
   * @private
   */
  _transitionTo(newState) {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();
    this._recordEvent('state_change', `${oldState} -> ${newState}`);
  }

  /**
   * 计算重试等待时间
   * @private
   */
  _getRetryAfter() {
    if (!this.lastFailureTime) return 0;
    const elapsed = Date.now() - this.lastFailureTime;
    return Math.max(0, this.recoveryTimeout - elapsed);
  }

  /**
   * 记录事件到历史
   * @private
   */
  _recordEvent(type, detail = '') {
    this.history.push({
      type,
      detail,
      state: this.state,
      failures: this.failures,
      timestamp: Date.now(),
    });

    // 保持历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }
  }

  /**
   * 重置断路器状态
   */
  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = null;
    this.lastStateChange = Date.now();
    this._recordEvent('reset');
  }

  /**
   * 获取断路器状态摘要
   * @returns {Object}
   */
  getStats() {
    return {
      name: this.name,
      state: this.getState(),
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      lastStateChange: this.lastStateChange,
      retryAfter: this.state === CircuitState.OPEN ? this._getRetryAfter() : 0,
      recentEvents: this.history.slice(-10),
    };
  }
}

/**
 * 断路器管理器
 * 管理多个 Provider 的断路器实例
 */
export class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  /**
   * 获取或创建断路器
   * @param {string} name - 断路器名称
   * @param {Object} options - 配置选项
   * @returns {CircuitBreaker}
   */
  getOrCreate(name, options = {}) {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, options));
    }
    return this.breakers.get(name);
  }

  /**
   * 获取断路器
   * @param {string} name
   * @returns {CircuitBreaker|undefined}
   */
  get(name) {
    return this.breakers.get(name);
  }

  /**
   * 检查断路器是否打开
   * @param {string} name
   * @returns {boolean}
   */
  isOpen(name) {
    const breaker = this.breakers.get(name);
    return breaker ? breaker.getState() === CircuitState.OPEN : false;
  }

  /**
   * 重置所有断路器
   */
  resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
  }

  /**
   * 重置指定断路器
   * @param {string} name
   */
  reset(name) {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
    }
  }

  /**
   * 获取所有断路器状态
   * @returns {Object[]}
   */
  getAllStats() {
    const stats = [];
    this.breakers.forEach((breaker, name) => {
      stats.push(breaker.getStats());
    });
    return stats;
  }

  /**
   * 获取可用的断路器列表（非 OPEN 状态）
   * @returns {string[]}
   */
  getAvailable() {
    const available = [];
    this.breakers.forEach((breaker, name) => {
      if (breaker.getState() !== CircuitState.OPEN) {
        available.push(name);
      }
    });
    return available;
  }
}

// 默认断路器管理器实例
export const defaultBreakerManager = new CircuitBreakerManager();

// 默认断路器配置
export const DEFAULT_BREAKER_CONFIGS = {
  anthropic: { failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 2 },
  openai: { failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 2 },
  deepseek: { failureThreshold: 5, recoveryTimeout: 15000, successThreshold: 2 },
  xai: { failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 2 },
  mistral: { failureThreshold: 3, recoveryTimeout: 30000, successThreshold: 2 },
  zhipu: { failureThreshold: 3, recoveryTimeout: 60000, successThreshold: 2 },
  qwen: { failureThreshold: 3, recoveryTimeout: 60000, successThreshold: 2 },
  kimi: { failureThreshold: 3, recoveryTimeout: 60000, successThreshold: 2 },
  minimax: { failureThreshold: 3, recoveryTimeout: 60000, successThreshold: 2 },
  mimo: { failureThreshold: 3, recoveryTimeout: 60000, successThreshold: 2 },
  openrouter: { failureThreshold: 5, recoveryTimeout: 60000, successThreshold: 2 },
  siliconflow: { failureThreshold: 5, recoveryTimeout: 60000, successThreshold: 2 },
  ollama: { failureThreshold: 2, recoveryTimeout: 10000, successThreshold: 1 },
};

export default CircuitBreaker;
