/**
 * 路由策略实现
 * 支持 cost、latency、fallback、manual 四种策略
 */

import { PROVIDERS, getProviderByName } from '../constants/providers.js';

// 路由策略枚举
export const RoutingStrategy = {
  COST: 'cost',         // 成本优先：选择最低成本的 Provider
  LATENCY: 'latency',   // 延迟优先：选择最快响应的 Provider
  FALLBACK: 'fallback', // 故障转移：按优先级顺序尝试
  MANUAL: 'manual',     // 手动选择：用户指定 Provider
};

// 路由结果
export class RoutingResult {
  constructor(provider, model, reason = '') {
    this.provider = provider;
    this.model = model;
    this.reason = reason;
    this.timestamp = Date.now();
  }
}

// 路由错误
export class RoutingError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'RoutingError';
    this.details = details;
  }
}

/**
 * 延迟追踪器
 * 记录各 Provider 的响应延迟，用于延迟优先策略
 */
export class LatencyTracker {
  constructor() {
    this.records = new Map(); // provider -> { samples: [], avg: 0, p95: 0 }
    this.maxSamples = 100;
  }

  /**
   * 记录延迟样本
   * @param {string} provider - Provider 名称
   * @param {number} latency - 延迟（毫秒）
   */
  record(provider, latency) {
    if (!this.records.has(provider)) {
      this.records.set(provider, { samples: [], avg: 0, p95: 0 });
    }

    const record = this.records.get(provider);
    record.samples.push(latency);

    // 保持样本大小
    if (record.samples.length > this.maxSamples) {
      record.samples.shift();
    }

    // 更新统计
    this._updateStats(record);
  }

  /**
   * 获取平均延迟
   * @param {string} provider
   * @returns {number}
   */
  getAvgLatency(provider) {
    const record = this.records.get(provider);
    return record ? record.avg : Infinity;
  }

  /**
   * 获取 P95 延迟
   * @param {string} provider
   * @returns {number}
   */
  getP95Latency(provider) {
    const record = this.records.get(provider);
    return record ? record.p95 : Infinity;
  }

  /**
   * 更新统计信息
   * @private
   */
  _updateStats(record) {
    const samples = record.samples;
    if (samples.length === 0) {
      record.avg = 0;
      record.p95 = 0;
      return;
    }

    // 计算平均值
    record.avg = samples.reduce((a, b) => a + b, 0) / samples.length;

    // 计算 P95
    const sorted = [...samples].sort((a, b) => a - b);
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    record.p95 = sorted[p95Index] || sorted[sorted.length - 1];
  }

  /**
   * 获取所有 Provider 延迟统计
   * @returns {Object}
   */
  getAllStats() {
    const stats = {};
    this.records.forEach((record, provider) => {
      stats[provider] = {
        avg: record.avg,
        p95: record.p95,
        samples: record.samples.length,
      };
    });
    return stats;
  }

  /**
   * 清除指定 Provider 的记录
   * @param {string} provider
   */
  clear(provider) {
    this.records.delete(provider);
  }

  /**
   * 清除所有记录
   */
  clearAll() {
    this.records.clear();
  }
}

// 默认延迟追踪器实例
export const defaultLatencyTracker = new LatencyTracker();

/**
 * 路由策略基类
 */
export class BaseRoutingStrategy {
  constructor(name) {
    this.name = name;
  }

  /**
   * 选择 Provider 和模型
   * @param {Object} options - 路由选项
   * @param {string} options.model - 模型 ID（可选，用于匹配）
   * @param {string[]} options.tags - 标签过滤（可选）
   * @param {string[]} options.excludeProviders - 排除的 Provider（可选）
   * @param {Object} options.breakerManager - 断路器管理器（可选）
   * @returns {RoutingResult}
   */
  route(options = {}) {
    throw new Error('route() must be implemented by subclass');
  }
}

/**
 * 成本优先策略
 * 选择成本最低的 Provider 和模型
 */
export class CostRoutingStrategy extends BaseRoutingStrategy {
  constructor() {
    super(RoutingStrategy.COST);
  }

  route(options = {}) {
    const { model, tags, excludeProviders = [], breakerManager } = options;

    let candidates = this._getCandidates(model, tags, excludeProviders, breakerManager);

    if (candidates.length === 0) {
      throw new RoutingError('No available providers found for cost routing', { model, tags });
    }

    // 按成本排序（输入 + 输出）
    candidates.sort((a, b) => {
      const costA = (a.model.cost.input || 0) + (a.model.cost.output || 0);
      const costB = (b.model.cost.input || 0) + (b.model.cost.output || 0);
      return costA - costB;
    });

    const selected = candidates[0];
    return new RoutingResult(
      selected.provider,
      selected.model,
      `Selected lowest cost provider: ${selected.provider.name} ($${selected.model.cost.input}/$${selected.model.cost.output} per 1M tokens)`
    );
  }

  _getCandidates(model, tags, excludeProviders, breakerManager) {
    const candidates = [];

    PROVIDERS.forEach(provider => {
      // 排除指定 Provider
      if (excludeProviders.includes(provider.name)) return;

      // 检查断路器状态
      if (breakerManager && breakerManager.isOpen(provider.name)) return;

      // 过滤模型
      provider.models.forEach(modelConfig => {
        // 如果指定了模型 ID，检查是否匹配
        if (model && modelConfig.id !== model) return;

        // 如果指定了标签，检查 Provider 标签
        if (tags && tags.length > 0) {
          const hasTag = tags.some(tag => provider.routing.tags.includes(tag));
          if (!hasTag) return;
        }

        candidates.push({ provider, model: modelConfig });
      });
    });

    return candidates;
  }
}

/**
 * 延迟优先策略
 * 选择响应最快的 Provider
 */
export class LatencyRoutingStrategy extends BaseRoutingStrategy {
  constructor(latencyTracker = defaultLatencyTracker) {
    super(RoutingStrategy.LATENCY);
    this.latencyTracker = latencyTracker;
  }

  route(options = {}) {
    const { model, tags, excludeProviders = [], breakerManager } = options;

    let candidates = this._getCandidates(model, tags, excludeProviders, breakerManager);

    if (candidates.length === 0) {
      throw new RoutingError('No available providers found for latency routing', { model, tags });
    }

    // 按延迟排序
    candidates.sort((a, b) => {
      const latencyA = this.latencyTracker.getAvgLatency(a.provider.name);
      const latencyB = this.latencyTracker.getAvgLatency(b.provider.name);
      return latencyA - latencyB;
    });

    const selected = candidates[0];
    const avgLatency = this.latencyTracker.getAvgLatency(selected.provider.name);

    return new RoutingResult(
      selected.provider,
      selected.model,
      `Selected lowest latency provider: ${selected.provider.name} (avg: ${Math.round(avgLatency)}ms)`
    );
  }

  _getCandidates(model, tags, excludeProviders, breakerManager) {
    const candidates = [];

    PROVIDERS.forEach(provider => {
      if (excludeProviders.includes(provider.name)) return;
      if (breakerManager && breakerManager.isOpen(provider.name)) return;

      provider.models.forEach(modelConfig => {
        if (model && modelConfig.id !== model) return;

        if (tags && tags.length > 0) {
          const hasTag = tags.some(tag => provider.routing.tags.includes(tag));
          if (!hasTag) return;
        }

        candidates.push({ provider, model: modelConfig });
      });
    });

    return candidates;
  }
}

/**
 * 故障转移策略
 * 按优先级顺序尝试 Provider
 */
export class FallbackRoutingStrategy extends BaseRoutingStrategy {
  constructor() {
    super(RoutingStrategy.FALLBACK);
  }

  route(options = {}) {
    const { model, tags, excludeProviders = [], breakerManager } = options;

    let candidates = this._getCandidates(model, tags, excludeProviders, breakerManager);

    if (candidates.length === 0) {
      throw new RoutingError('No available providers found for fallback routing', { model, tags });
    }

    // 按优先级排序
    candidates.sort((a, b) => a.provider.routing.priority - b.provider.routing.priority);

    const selected = candidates[0];
    return new RoutingResult(
      selected.provider,
      selected.model,
      `Selected highest priority provider: ${selected.provider.name} (priority: ${selected.provider.routing.priority})`
    );
  }

  /**
   * 获取所有候选 Provider（按优先级排序）
   * 用于故障转移链
   * @param {Object} options
   * @returns {Array}
   */
  getFallbackChain(options = {}) {
    const { model, tags, excludeProviders = [], breakerManager } = options;

    let candidates = this._getCandidates(model, tags, excludeProviders, breakerManager);
    candidates.sort((a, b) => a.provider.routing.priority - b.provider.routing.priority);

    return candidates.map(c => ({
      provider: c.provider,
      model: c.model,
      priority: c.provider.routing.priority,
    }));
  }

  _getCandidates(model, tags, excludeProviders, breakerManager) {
    const candidates = [];

    PROVIDERS.forEach(provider => {
      if (excludeProviders.includes(provider.name)) return;
      if (breakerManager && breakerManager.isOpen(provider.name)) return;

      provider.models.forEach(modelConfig => {
        if (model && modelConfig.id !== model) return;

        if (tags && tags.length > 0) {
          const hasTag = tags.some(tag => provider.routing.tags.includes(tag));
          if (!hasTag) return;
        }

        candidates.push({ provider, model: modelConfig });
      });
    });

    return candidates;
  }
}

/**
 * 手动选择策略
 * 用户直接指定 Provider 和模型
 */
export class ManualRoutingStrategy extends BaseRoutingStrategy {
  constructor() {
    super(RoutingStrategy.MANUAL);
  }

  route(options = {}) {
    const { provider: providerName, model: modelId } = options;

    if (!providerName) {
      throw new RoutingError('Provider name is required for manual routing');
    }

    const provider = getProviderByName(providerName);
    if (!provider) {
      throw new RoutingError(`Provider "${providerName}" not found`, { provider: providerName });
    }

    // 如果指定了模型，查找匹配的模型配置
    let modelConfig;
    if (modelId) {
      modelConfig = provider.models.find(m => m.id === modelId);
      if (!modelConfig) {
        // 如果找不到精确匹配，使用第一个模型
        modelConfig = provider.models[0];
        return new RoutingResult(
          provider,
          modelConfig,
          `Model "${modelId}" not found in provider "${providerName}", using default: ${modelConfig.id}`
        );
      }
    } else {
      // 未指定模型，使用第一个模型
      modelConfig = provider.models[0];
    }

    return new RoutingResult(
      provider,
      modelConfig,
      `Manual selection: ${provider.name}/${modelConfig.id}`
    );
  }
}

/**
 * 路由策略工厂
 */
export class RoutingStrategyFactory {
  constructor() {
    this.strategies = new Map();
    this.latencyTracker = defaultLatencyTracker;

    // 注册默认策略
    this.register(new CostRoutingStrategy());
    this.register(new LatencyRoutingStrategy(this.latencyTracker));
    this.register(new FallbackRoutingStrategy());
    this.register(new ManualRoutingStrategy());
  }

  /**
   * 注册策略
   * @param {BaseRoutingStrategy} strategy
   */
  register(strategy) {
    this.strategies.set(strategy.name, strategy);
  }

  /**
   * 获取策略
   * @param {string} name - 策略名称
   * @returns {BaseRoutingStrategy}
   */
  get(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new RoutingError(`Unknown routing strategy: "${name}"`, {
        available: Array.from(this.strategies.keys()),
      });
    }
    return strategy;
  }

  /**
   * 获取所有可用策略名称
   * @returns {string[]}
   */
  getAvailable() {
    return Array.from(this.strategies.keys());
  }

  /**
   * 获取延迟追踪器
   * @returns {LatencyTracker}
   */
  getLatencyTracker() {
    return this.latencyTracker;
  }
}

// 默认策略工厂实例
export const defaultStrategyFactory = new RoutingStrategyFactory();

export default RoutingStrategyFactory;
