/**
 * LLM Router 核心服务
 * 统一的 LLM API 网关层，支持多 Provider 配置、路由策略和故障转移
 */

import { PROVIDERS, getProviderByName, getModelsByProvider } from '../constants/providers.js';
import { CircuitBreakerManager, defaultBreakerManager, DEFAULT_BREAKER_CONFIGS } from './circuitBreaker.js';
import { RoutingStrategy, RoutingStrategyFactory, defaultStrategyFactory, RoutingError } from './routingStrategy.js';

/**
 * LLM Router 类
 * 提供统一的 LLM API 调用接口
 */
export class LLMRouter {
  /**
   * @param {Object} options - 配置选项
   * @param {Object} options.strategyFactory - 路由策略工厂
   * @param {Object} options.breakerManager - 断路器管理器
   * @param {string} options.defaultStrategy - 默认路由策略
   * @param {number} options.timeout - 请求超时时间（毫秒）
   * @param {number} options.maxRetries - 最大重试次数
   * @param {number} options.retryDelay - 重试延迟（毫秒）
   */
  constructor(options = {}) {
    this.strategyFactory = options.strategyFactory || defaultStrategyFactory;
    this.breakerManager = options.breakerManager || defaultBreakerManager;
    this.defaultStrategy = options.defaultStrategy || RoutingStrategy.FALLBACK;
    this.timeout = options.timeout || 30000;
    this.maxRetries = options.maxRetries || 2;
    this.retryDelay = options.retryDelay || 1000;

    // 初始化所有 Provider 的断路器
    this._initBreakers();
  }

  /**
   * 初始化断路器
   * @private
   */
  _initBreakers() {
    PROVIDERS.forEach(provider => {
      const config = DEFAULT_BREAKER_CONFIGS[provider.name] || {
        failureThreshold: 3,
        recoveryTimeout: 60000,
        successThreshold: 2,
      };
      this.breakerManager.getOrCreate(provider.name, config);
    });
  }

  /**
   * 路由请求到指定 Provider 和模型
   * @param {string} providerName - Provider 名称
   * @param {string} modelId - 模型 ID
   * @param {Object} options - 请求选项
   * @param {string} options.systemPrompt - 系统提示词
   * @param {string} options.content - 用户内容
   * @param {boolean} options.stream - 是否流式输出
   * @param {Function} options.onChunk - 流式输出回调
   * @returns {Promise<Object>} 请求结果
   */
  async route(providerName, modelId, options = {}) {
    const provider = getProviderByName(providerName);
    if (!provider) {
      throw new RoutingError(`Provider "${providerName}" not found`);
    }

    const model = provider.models.find(m => m.id === modelId);
    if (!model) {
      throw new RoutingError(`Model "${modelId}" not found in provider "${providerName}"`);
    }

    return this._executeWithBreaker(provider, model, options);
  }

  /**
   * 使用路由策略自动选择 Provider 并发送请求
   * @param {string} model - 模型 ID（可选，用于匹配）
   * @param {Object} options - 请求选项
   * @param {string} options.strategy - 路由策略名称
   * @param {string[]} options.tags - 标签过滤
   * @param {string[]} options.excludeProviders - 排除的 Provider
   * @param {string} options.systemPrompt - 系统提示词
   * @param {string} options.content - 用户内容
   * @param {boolean} options.stream - 是否流式输出
   * @param {Function} options.onChunk - 流式输出回调
   * @returns {Promise<Object>} 请求结果
   */
  async routeWithFallback(model, options = {}) {
    const strategyName = options.strategy || this.defaultStrategy;
    const strategy = this.strategyFactory.get(strategyName);

    // 对于故障转移策略，获取完整的故障转移链
    if (strategyName === RoutingStrategy.FALLBACK) {
      return this._executeWithFallbackChain(model, options);
    }

    // 对于其他策略，使用单次路由
    const routeOptions = {
      model,
      tags: options.tags,
      excludeProviders: options.excludeProviders,
      breakerManager: this.breakerManager,
      provider: options.provider,
    };

    const result = strategy.route(routeOptions);
    return this._executeWithBreaker(result.provider, result.model, options);
  }

  /**
   * 使用故障转移链执行请求
   * @private
   */
  async _executeWithFallbackChain(model, options = {}) {
    const strategy = this.strategyFactory.get(RoutingStrategy.FALLBACK);
    const chain = strategy.getFallbackChain({
      model,
      tags: options.tags,
      excludeProviders: options.excludeProviders,
      breakerManager: this.breakerManager,
    });

    if (chain.length === 0) {
      throw new RoutingError('No available providers in fallback chain');
    }

    const errors = [];

    for (const item of chain) {
      try {
        const result = await this._executeWithBreaker(item.provider, item.model, options);
        return {
          ...result,
          routing: {
            strategy: RoutingStrategy.FALLBACK,
            provider: item.provider.name,
            model: item.model.id,
            attempt: errors.length + 1,
          },
        };
      } catch (error) {
        errors.push({
          provider: item.provider.name,
          model: item.model.id,
          error: error.message,
        });

        // 如果是断路器错误，继续尝试下一个
        if (error.isCircuitBreakerError) {
          continue;
        }

        // 其他错误也继续尝试
        continue;
      }
    }

    throw new RoutingError('All providers in fallback chain failed', { errors });
  }

  /**
   * 使用断路器执行请求
   * @private
   */
  async _executeWithBreaker(provider, model, options = {}) {
    const breaker = this.breakerManager.getOrCreate(provider.name, DEFAULT_BREAKER_CONFIGS[provider.name]);

    const startTime = Date.now();

    try {
      const result = await breaker.call(async () => {
        return this._makeRequest(provider, model, options);
      });

      const duration = Date.now() - startTime;

      // 记录延迟
      this.strategyFactory.getLatencyTracker().record(provider.name, duration);

      return {
        ...result,
        provider: provider.name,
        model: model.id,
        duration,
        routing: {
          strategy: options.strategy || this.defaultStrategy,
          provider: provider.name,
          model: model.id,
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.strategyFactory.getLatencyTracker().record(provider.name, duration);

      // 如果是断路器错误，添加额外信息
      if (error.isCircuitBreakerError) {
        throw error;
      }

      throw error;
    }
  }

  /**
   * 发送实际请求
   * @private
   */
  async _makeRequest(provider, model, options = {}) {
    const { systemPrompt, content, stream = false, onChunk } = options;

    // 构建请求配置
    const config = {
      provider: provider.name,
      model: model.id,
      apiKey: this._getApiKey(provider),
      baseUrl: this._getBaseUrl(provider),
      maxTokens: options.maxTokens || 4096,
      maxRetries: 0, // 由 Router 处理重试
      retryDelay: 0,
    };

    // 如果是流式请求
    if (stream && onChunk) {
      return this._streamRequest(config, provider, model, systemPrompt, content, onChunk);
    }

    // 普通请求
    return this._normalRequest(config, provider, model, systemPrompt, content);
  }

  /**
   * 普通请求
   * @private
   */
  async _normalRequest(config, provider, model, systemPrompt, content) {
    const headers = this._getHeaders(provider, config.apiKey);
    const body = this._buildRequestBody(provider, model, config, systemPrompt, content);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      return this._parseResponse(provider, model, data);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 流式请求
   * @private
   */
  async _streamRequest(config, provider, model, systemPrompt, content, onChunk) {
    const headers = this._getHeaders(provider, config.apiKey);
    const body = this._buildRequestBody(provider, model, config, systemPrompt, content, true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(config.baseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error?.message || `HTTP ${res.status}`);
      }

      if (!res.body) {
        const data = await res.json();
        return this._parseResponse(provider, model, data);
      }

      return this._processStream(res, provider, model, onChunk);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 处理流式响应
   * @private
   */
  async _processStream(res, provider, model, onChunk) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;

        try {
          const json = JSON.parse(trimmed.slice(6));
          const chunk = this._extractStreamChunk(provider, json);
          if (chunk) {
            fullText += chunk;
            onChunk(fullText);
          }
        } catch {
          // 忽略解析错误
        }
      }
    }

    return {
      text: fullText || '(无输出)',
      usage: { inputTokens: 0, outputTokens: Math.round(fullText.length * 0.75) },
    };
  }

  /**
   * 提取流式响应中的文本块
   * @private
   */
  _extractStreamChunk(provider, json) {
    switch (provider.name) {
      case 'anthropic':
        if (json.type === 'content_block_delta') {
          return json.delta?.text || '';
        }
        break;
      case 'openai':
      default:
        return json.choices?.[0]?.delta?.content || '';
    }
    return '';
  }

  /**
   * 获取 API Key
   * @private
   */
  _getApiKey(provider) {
    if (provider.apiKeyEnv === 'NO_AUTH') {
      return 'no-auth';
    }

    const apiKey = process.env[provider.apiKeyEnv];
    if (!apiKey) {
      throw new Error(`API key not found. Please set ${provider.apiKeyEnv} environment variable.`);
    }

    return apiKey;
  }

  /**
   * 获取 Base URL
   * @private
   */
  _getBaseUrl(provider) {
    return provider.baseUrl;
  }

  /**
   * 获取请求头
   * @private
   */
  _getHeaders(provider, apiKey) {
    const headers = {
      'Content-Type': 'application/json',
    };

    switch (provider.authType) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${apiKey}`;
        break;
      case 'header':
        if (provider.authHeader) {
          headers[provider.authHeader] = apiKey;
        }
        break;
      case 'query':
        // URL 参数方式，需要在 URL 中添加
        break;
      case 'signed':
        // 需要签名，暂时不支持
        break;
    }

    // Anthropic 特殊处理
    if (provider.name === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers['Authorization'];
    }

    return headers;
  }

  /**
   * 构建请求体
   * @private
   */
  _buildRequestBody(provider, model, config, systemPrompt, content, stream = false) {
    const isOpenAICompatible = provider.compatibility.includes('openai');
    const isAnthropicCompatible = provider.compatibility.includes('anthropic');

    // 优先使用 OpenAI 兼容格式
    if (isOpenAICompatible && provider.name !== 'anthropic') {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content });

      return {
        model: model.id,
        max_tokens: config.maxTokens,
        messages,
        stream,
      };
    }

    // Anthropic 格式
    if (provider.name === 'anthropic' || isAnthropicCompatible) {
      return {
        model: model.id,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content }],
        stream,
      };
    }

    // 默认使用 OpenAI 格式
    return {
      model: model.id,
      max_tokens: config.maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      stream,
    };
  }

  /**
   * 解析响应
   * @private
   */
  _parseResponse(provider, model, data) {
    const isOpenAICompatible = provider.compatibility.includes('openai');

    // OpenAI 兼容格式
    if (isOpenAICompatible && provider.name !== 'anthropic') {
      return {
        text: data.choices?.[0]?.message?.content || '(无输出)',
        usage: {
          inputTokens: data.usage?.prompt_tokens || 0,
          outputTokens: data.usage?.completion_tokens || 0,
          cacheReadTokens: 0,
          cacheWriteTokens: 0,
        },
      };
    }

    // Anthropic 格式
    if (provider.name === 'anthropic') {
      return {
        text: data.content?.find(b => b.type === 'text')?.text || '(无输出)',
        usage: {
          inputTokens: data.usage?.input_tokens || 0,
          outputTokens: data.usage?.output_tokens || 0,
          cacheReadTokens: data.usage?.cache_read_input_tokens || 0,
          cacheWriteTokens: data.usage?.cache_creation_input_tokens || 0,
        },
      };
    }

    // 默认格式
    return {
      text: data.choices?.[0]?.message?.content || data.content?.find(b => b.type === 'text')?.text || '(无输出)',
      usage: {
        inputTokens: data.usage?.prompt_tokens || data.usage?.input_tokens || 0,
        outputTokens: data.usage?.completion_tokens || data.usage?.output_tokens || 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      },
    };
  }

  /**
   * 获取所有 Provider 列表
   * @returns {Object[]}
   */
  getProviders() {
    return PROVIDERS.map(p => ({
      name: p.name,
      displayName: p.displayName,
      baseUrl: p.baseUrl,
      models: p.models.map(m => m.id),
      routing: p.routing,
    }));
  }

  /**
   * 获取指定 Provider 的模型列表
   * @param {string} providerName - Provider 名称
   * @returns {Object[]}
   */
  getModels(providerName) {
    return getModelsByProvider(providerName);
  }

  /**
   * 健康检查
   * @param {string} providerName - Provider 名称
   * @returns {Promise<boolean>}
   */
  async healthCheck(providerName) {
    const provider = getProviderByName(providerName);
    if (!provider) {
      return false;
    }

    try {
      // 尝试发送一个简单的请求来检查健康状态
      const apiKey = this._getApiKey(provider);
      const headers = this._getHeaders(provider, apiKey);

      // 对于大多数 Provider，发送一个简单的请求
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const res = await fetch(provider.baseUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: provider.models[0].id,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'hi' }],
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return res.ok;
      } catch {
        clearTimeout(timeoutId);
        return false;
      }
    } catch {
      return false;
    }
  }

  /**
   * 设置默认路由策略
   * @param {string} strategy - 策略名称
   */
  setStrategy(strategy) {
    if (!this.strategyFactory.get(strategy)) {
      throw new RoutingError(`Unknown routing strategy: "${strategy}"`);
    }
    this.defaultStrategy = strategy;
  }

  /**
   * 获取当前配置
   * @returns {Object}
   */
  getConfig() {
    return {
      defaultStrategy: this.defaultStrategy,
      timeout: this.timeout,
      maxRetries: this.maxRetries,
      retryDelay: this.retryDelay,
      availableStrategies: this.strategyFactory.getAvailable(),
      providers: this.getProviders(),
      breakerStats: this.breakerManager.getAllStats(),
      latencyStats: this.strategyFactory.getLatencyTracker().getAllStats(),
    };
  }

  /**
   * 重置所有状态
   */
  reset() {
    this.breakerManager.resetAll();
    this.strategyFactory.getLatencyTracker().clearAll();
  }
}

/**
 * 创建默认的 LLM Router 实例
 * @param {Object} options - 配置选项
 * @returns {LLMRouter}
 */
export function createLLMRouter(options = {}) {
  return new LLMRouter(options);
}

// 默认实例
export const defaultRouter = createLLMRouter();

/**
 * 兼容现有 api.js 接口的包装函数
 * 使用 LLM Router 替代原有的 callAgent 和 streamCallAgent
 */
export async function callAgentWithRouter(config, systemPrompt, content, routerOptions = {}) {
  const router = routerOptions.router || defaultRouter;

  // 从 config 中提取 provider 和 model
  const providerName = config.provider || 'anthropic';
  const modelId = config.model || 'claude-sonnet-4-20250514';

  return router.route(providerName, modelId, {
    systemPrompt,
    content,
    maxTokens: config.maxTokens || 1000,
    ...routerOptions,
  });
}

export async function streamCallAgentWithRouter(config, systemPrompt, content, onChunk, routerOptions = {}) {
  const router = routerOptions.router || defaultRouter;

  const providerName = config.provider || 'anthropic';
  const modelId = config.model || 'claude-sonnet-4-20250514';

  return router.route(providerName, modelId, {
    systemPrompt,
    content,
    stream: true,
    onChunk,
    maxTokens: config.maxTokens || 1000,
    ...routerOptions,
  });
}

export default LLMRouter;
