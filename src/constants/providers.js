/**
 * LLM Provider 常量定义
 * 包含所有支持的 Provider 配置信息
 */

// Provider 认证类型
export const AUTH_TYPES = {
  BEARER: 'bearer',
  HEADER: 'header',
  QUERY: 'query',
  SIGNED: 'signed',
};

// 兼容协议类型
export const COMPATIBILITY = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  COHERE: 'cohere',
  GOOGLE: 'google',
};

// 路由标签
export const ROUTING_TAGS = {
  CORE: 'core',
  REASONING: 'reasoning',
  GENERAL: 'general',
  VISION: 'vision',
  COST: 'cost',
  THINKING: 'thinking',
  LOCAL: 'local',
  FALLBACK: 'fallback',
  FREE: 'free',
  DOMESTIC: 'domestic',
  INTERNATIONAL: 'international',
};

/**
 * Provider 配置列表
 * 每个 Provider 包含：name, displayName, baseUrl, apiKeyEnv, authType, compatibility, models, routing
 */
export const PROVIDERS = [
  // ==================== 国际厂商 ====================
  {
    name: 'anthropic',
    displayName: 'Anthropic Claude',
    baseUrl: 'https://api.anthropic.com/v1',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    authType: AUTH_TYPES.HEADER,
    authHeader: 'x-api-key',
    compatibility: [COMPATIBILITY.ANTHROPIC, COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'claude-opus-4-7',
        displayName: 'Claude Opus 4.7',
        contextWindow: 1000000,
        maxOutput: 32000,
        cost: { input: 5.00, output: 25.00, cacheRead: 0.50, cacheWrite: 6.25 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'claude-sonnet-4-5',
        displayName: 'Claude Sonnet 4.5',
        contextWindow: 1000000,
        maxOutput: 16000,
        cost: { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'claude-haiku-3-5',
        displayName: 'Claude Haiku 3.5',
        contextWindow: 200000,
        maxOutput: 8192,
        cost: { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.30 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: true },
      },
    ],
    routing: { priority: 1, tags: [ROUTING_TAGS.CORE, ROUTING_TAGS.REASONING, ROUTING_TAGS.INTERNATIONAL] },
    healthCheck: { enabled: true, interval: 60, timeout: 10 },
  },

  {
    name: 'openai',
    displayName: 'OpenAI GPT',
    baseUrl: 'https://api.openai.com/v1',
    apiKeyEnv: 'OPENAI_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'gpt-5.5',
        displayName: 'GPT-5.5',
        contextWindow: 1100000,
        maxOutput: 32000,
        cost: { input: 5.00, output: 30.00 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'gpt-5',
        displayName: 'GPT-5',
        contextWindow: 1000000,
        maxOutput: 16000,
        cost: { input: 2.50, output: 15.00 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'o4-mini',
        displayName: 'O4 Mini',
        contextWindow: 256000,
        maxOutput: 32000,
        cost: { input: 1.10, output: 4.40 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'o3',
        displayName: 'O3',
        contextWindow: 256000,
        maxOutput: 32000,
        cost: { input: 2.00, output: 8.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
    ],
    routing: { priority: 2, tags: [ROUTING_TAGS.GENERAL, ROUTING_TAGS.VISION, ROUTING_TAGS.INTERNATIONAL] },
    healthCheck: { enabled: true, interval: 60, timeout: 10 },
  },

  {
    name: 'deepseek',
    displayName: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI, COMPATIBILITY.ANTHROPIC],
    models: [
      {
        id: 'deepseek-v4-pro',
        displayName: 'DeepSeek V4 Pro',
        contextWindow: 1000000,
        maxOutput: 32000,
        cost: { input: 0.44, output: 0.87 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'deepseek-v4-flash',
        displayName: 'DeepSeek V4 Flash',
        contextWindow: 1000000,
        maxOutput: 16000,
        cost: { input: 0.14, output: 0.28 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: false },
      },
    ],
    routing: { priority: 3, tags: [ROUTING_TAGS.COST, ROUTING_TAGS.THINKING, ROUTING_TAGS.INTERNATIONAL] },
    healthCheck: { enabled: true, interval: 60, timeout: 15 },
  },

  {
    name: 'xai',
    displayName: 'xAI Grok',
    baseUrl: 'https://api.x.ai/v1',
    apiKeyEnv: 'XAI_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'grok-4.3',
        displayName: 'Grok 4.3',
        contextWindow: 1000000,
        maxOutput: 32000,
        cost: { input: 1.25, output: 2.50 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'grok-4.20',
        displayName: 'Grok 4.20',
        contextWindow: 2000000,
        maxOutput: 32000,
        cost: { input: 1.25, output: 2.50 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
    ],
    routing: { priority: 4, tags: [ROUTING_TAGS.GENERAL, ROUTING_TAGS.INTERNATIONAL] },
    healthCheck: { enabled: true, interval: 60, timeout: 10 },
  },

  {
    name: 'mistral',
    displayName: 'Mistral AI',
    baseUrl: 'https://api.mistral.ai/v1',
    apiKeyEnv: 'MISTRAL_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'mistral-large-3',
        displayName: 'Mistral Large 3',
        contextWindow: 262000,
        maxOutput: 16000,
        cost: { input: 0.50, output: 1.50 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'mistral-small-4',
        displayName: 'Mistral Small 4',
        contextWindow: 256000,
        maxOutput: 8192,
        cost: { input: 0.15, output: 0.60 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'codestral',
        displayName: 'Codestral',
        contextWindow: 256000,
        maxOutput: 16000,
        cost: { input: 0.20, output: 0.60 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'pixtral-large',
        displayName: 'Pixtral Large',
        contextWindow: 128000,
        maxOutput: 8192,
        cost: { input: 2.00, output: 6.00 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: true },
      },
    ],
    routing: { priority: 5, tags: [ROUTING_TAGS.GENERAL, ROUTING_TAGS.COST, ROUTING_TAGS.INTERNATIONAL] },
    healthCheck: { enabled: true, interval: 60, timeout: 10 },
  },

  // ==================== 国内厂商 ====================
  {
    name: 'zhipu',
    displayName: '智谱 GLM',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    apiKeyEnv: 'ZHIPU_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'glm-5.1',
        displayName: 'GLM-5.1',
        contextWindow: 200000,
        maxOutput: 16000,
        cost: { input: 6.00, output: 28.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'glm-4.7',
        displayName: 'GLM-4.7',
        contextWindow: 200000,
        maxOutput: 8192,
        cost: { input: 1.00, output: 2.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'glm-4.5-flash',
        displayName: 'GLM-4.5 Flash',
        contextWindow: 128000,
        maxOutput: 8192,
        cost: { input: 0, output: 0 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
    ],
    routing: { priority: 6, tags: [ROUTING_TAGS.DOMESTIC, ROUTING_TAGS.FREE] },
    healthCheck: { enabled: true, interval: 60, timeout: 15 },
  },

  {
    name: 'qwen',
    displayName: '通义千问 Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    apiKeyEnv: 'QWEN_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'qwen3.5-max',
        displayName: 'Qwen3.5 Max',
        contextWindow: 262000,
        maxOutput: 16000,
        cost: { input: 0.80, output: 3.50 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'qwen3.5-plus',
        displayName: 'Qwen3.5 Plus',
        contextWindow: 131000,
        maxOutput: 16000,
        cost: { input: 0.40, output: 1.60 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'qwen3.5-35b-a3b',
        displayName: 'Qwen3.5 35B',
        contextWindow: 131000,
        maxOutput: 8192,
        cost: { input: 0.20, output: 0.80 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: false },
      },
    ],
    routing: { priority: 7, tags: [ROUTING_TAGS.DOMESTIC, ROUTING_TAGS.COST] },
    healthCheck: { enabled: true, interval: 60, timeout: 15 },
  },

  {
    name: 'kimi',
    displayName: '月之暗面 Kimi',
    baseUrl: 'https://api.moonshot.cn/v1',
    apiKeyEnv: 'KIMI_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'kimi-k2.6',
        displayName: 'Kimi K2.6',
        contextWindow: 262000,
        maxOutput: 16000,
        cost: { input: 0.73, output: 3.40, cacheRead: 0.16 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'kimi-k2.5',
        displayName: 'Kimi K2.5',
        contextWindow: 128000,
        maxOutput: 8192,
        cost: { input: 0.60, output: 3.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'moonshot-v1-128k',
        displayName: 'Moonshot V1 128K',
        contextWindow: 128000,
        maxOutput: 8192,
        cost: { input: 2.00, output: 5.00 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
    ],
    routing: { priority: 8, tags: [ROUTING_TAGS.DOMESTIC, ROUTING_TAGS.THINKING] },
    healthCheck: { enabled: true, interval: 60, timeout: 15 },
  },

  {
    name: 'minimax',
    displayName: 'MiniMax',
    baseUrl: 'https://api.minimax.chat/v1',
    apiKeyEnv: 'MINIMAX_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI, COMPATIBILITY.ANTHROPIC],
    models: [
      {
        id: 'minimax-m2.7',
        displayName: 'MiniMax M2.7',
        contextWindow: 205000,
        maxOutput: 16000,
        cost: { input: 0.28, output: 1.20, cacheRead: 0.06 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'minimax-m2.5',
        displayName: 'MiniMax M2.5',
        contextWindow: 197000,
        maxOutput: 16000,
        cost: { input: 0.15, output: 1.15, cacheRead: 0.03 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'minimax-01',
        displayName: 'MiniMax 01',
        contextWindow: 1000000,
        maxOutput: 16000,
        cost: { input: 0.20, output: 1.10 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
    ],
    routing: { priority: 9, tags: [ROUTING_TAGS.DOMESTIC, ROUTING_TAGS.COST] },
    healthCheck: { enabled: true, interval: 60, timeout: 15 },
  },

  {
    name: 'mimo',
    displayName: '小米 MiMo',
    baseUrl: 'https://api.mimo-v2.com/v1',
    baseUrlAnthropic: 'https://api.mimo-v2.com/anthropic',
    apiKeyEnv: 'MIMO_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI, COMPATIBILITY.ANTHROPIC],
    models: [
      {
        id: 'mimo-v2.5-pro',
        displayName: 'MiMo V2.5 Pro',
        contextWindow: 1000000,
        maxOutput: 32000,
        cost: { input: 1.00, output: 3.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'mimo-v2.5',
        displayName: 'MiMo V2.5',
        contextWindow: 1000000,
        maxOutput: 16000,
        cost: { input: 0.50, output: 1.50 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'mimo-v2-flash',
        displayName: 'MiMo V2 Flash',
        contextWindow: 256000,
        maxOutput: 8192,
        cost: { input: 0.10, output: 0.30 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
    ],
    routing: { priority: 10, tags: [ROUTING_TAGS.DOMESTIC, ROUTING_TAGS.COST] },
    healthCheck: { enabled: true, interval: 60, timeout: 15 },
  },

  // ==================== 聚合路由厂商 ====================
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'openai/gpt-5.5',
        displayName: 'GPT-5.5 (via OpenRouter)',
        contextWindow: 1100000,
        maxOutput: 32000,
        cost: { input: 5.00, output: 30.00 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'anthropic/claude-opus-4.7',
        displayName: 'Claude Opus 4.7 (via OpenRouter)',
        contextWindow: 1000000,
        maxOutput: 32000,
        cost: { input: 5.00, output: 25.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'deepseek/deepseek-v4-pro',
        displayName: 'DeepSeek V4 Pro (via OpenRouter)',
        contextWindow: 1000000,
        maxOutput: 32000,
        cost: { input: 0.44, output: 0.87 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'google/gemini-3.5-flash',
        displayName: 'Gemini 3.5 Flash (via OpenRouter)',
        contextWindow: 1000000,
        maxOutput: 16000,
        cost: { input: 1.50, output: 9.00 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: true },
      },
    ],
    routing: { priority: 11, tags: [ROUTING_TAGS.INTERNATIONAL, ROUTING_TAGS.FALLBACK] },
    healthCheck: { enabled: true, interval: 120, timeout: 20 },
  },

  {
    name: 'siliconflow',
    displayName: 'SiliconFlow 硅基流动',
    baseUrl: 'https://api.siliconflow.cn/v1',
    apiKeyEnv: 'SILICONFLOW_API_KEY',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'deepseek-ai/DeepSeek-V4-Flash',
        displayName: 'DeepSeek V4 Flash (硅基)',
        contextWindow: 1000000,
        maxOutput: 16000,
        cost: { input: 1.00, output: 2.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'Pro/Kimi-K2.6',
        displayName: 'Kimi K2.6 Pro (硅基)',
        contextWindow: 262000,
        maxOutput: 16000,
        cost: { input: 6.50, output: 27.00 },
        features: { streaming: true, thinking: true, toolCalls: true, structuredOutput: true, vision: true },
      },
      {
        id: 'THUDM/GLM-4-9B-Chat',
        displayName: 'GLM-4 9B (硅基免费)',
        contextWindow: 128000,
        maxOutput: 4096,
        cost: { input: 0, output: 0 },
        features: { streaming: true, thinking: false, toolCalls: false, structuredOutput: false, vision: false },
      },
      {
        id: 'Qwen/Qwen3-8B',
        displayName: 'Qwen3 8B (硅基免费)',
        contextWindow: 32000,
        maxOutput: 4096,
        cost: { input: 0, output: 0 },
        features: { streaming: true, thinking: false, toolCalls: false, structuredOutput: false, vision: false },
      },
    ],
    routing: { priority: 12, tags: [ROUTING_TAGS.DOMESTIC, ROUTING_TAGS.FREE, ROUTING_TAGS.FALLBACK] },
    healthCheck: { enabled: true, interval: 120, timeout: 20 },
  },

  {
    name: 'ollama',
    displayName: 'Ollama 本地',
    baseUrl: 'http://localhost:11434/v1',
    apiKeyEnv: 'NO_AUTH',
    authType: AUTH_TYPES.BEARER,
    compatibility: [COMPATIBILITY.OPENAI],
    models: [
      {
        id: 'llama3.2',
        displayName: 'Llama 3.2',
        contextWindow: 128000,
        maxOutput: 4096,
        cost: { input: 0, output: 0 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'qwen2.5',
        displayName: 'Qwen 2.5',
        contextWindow: 32000,
        maxOutput: 4096,
        cost: { input: 0, output: 0 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
      {
        id: 'mistral',
        displayName: 'Mistral',
        contextWindow: 32000,
        maxOutput: 4096,
        cost: { input: 0, output: 0 },
        features: { streaming: true, thinking: false, toolCalls: true, structuredOutput: true, vision: false },
      },
    ],
    routing: { priority: 13, tags: [ROUTING_TAGS.LOCAL, ROUTING_TAGS.FALLBACK, ROUTING_TAGS.FREE] },
    healthCheck: { enabled: true, interval: 300, timeout: 5 },
  },
];

/**
 * 获取所有 Provider 名称列表
 * @returns {string[]}
 */
export function getProviderNames() {
  return PROVIDERS.map(p => p.name);
}

/**
 * 根据名称获取 Provider 配置
 * @param {string} name
 * @returns {Object|undefined}
 */
export function getProviderByName(name) {
  return PROVIDERS.find(p => p.name === name);
}

/**
 * 获取指定 Provider 的模型列表
 * @param {string} providerName
 * @returns {Object[]}
 */
export function getModelsByProvider(providerName) {
  const provider = getProviderByName(providerName);
  return provider ? provider.models : [];
}

/**
 * 根据标签筛选 Provider
 * @param {string} tag
 * @returns {Object[]}
 */
export function getProvidersByTag(tag) {
  return PROVIDERS.filter(p => p.routing.tags.includes(tag));
}

/**
 * 获取所有免费模型
 * @returns {Object[]}
 */
export function getFreeModels() {
  const freeModels = [];
  PROVIDERS.forEach(provider => {
    provider.models.forEach(model => {
      if (model.cost.input === 0 && model.cost.output === 0) {
        freeModels.push({ ...model, provider: provider.name });
      }
    });
  });
  return freeModels;
}

export default PROVIDERS;
