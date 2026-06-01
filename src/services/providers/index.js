import { AnthropicAdapter } from './AnthropicAdapter.js';
import { OpenAIAdapter } from './OpenAIAdapter.js';
import { DeepSeekAdapter } from './DeepSeekAdapter.js';

const PROVIDER_MAP = {
  anthropic: AnthropicAdapter,
  openai: OpenAIAdapter,
  deepseek: DeepSeekAdapter,
  // 其他兼容OpenAI的Provider
  qwen: OpenAIAdapter,
  zhipu: OpenAIAdapter,
  kimi: OpenAIAdapter,
  minimax: OpenAIAdapter,
  mimo: OpenAIAdapter,
  grok: OpenAIAdapter,
  mistral: OpenAIAdapter,
  ollama: OpenAIAdapter,
  openrouter: OpenAIAdapter,
  siliconflow: OpenAIAdapter,
};

export function getProviderAdapter(providerName, config) {
  const AdapterClass = PROVIDER_MAP[providerName] || AnthropicAdapter;
  return new AdapterClass(config);
}

export { ProviderAdapter } from './ProviderAdapter.js';
export { AnthropicAdapter } from './AnthropicAdapter.js';
export { OpenAIAdapter } from './OpenAIAdapter.js';
export { DeepSeekAdapter } from './DeepSeekAdapter.js';
