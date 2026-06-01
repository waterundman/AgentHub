/**
 * LLM Router 使用示例
 * 展示如何使用 LLM Router 进行多 Provider 路由
 */

import {
  LLMRouter,
  createLLMRouter,
  callAgentWithRouter,
  streamCallAgentWithRouter,
} from '../services/llmRouter.js';
import { RoutingStrategy } from '../services/routingStrategy.js';
import { getProviderByName, getModelsByProvider, getFreeModels } from '../constants/providers.js';

// 示例 1: 基本使用 - 直接指定 Provider 和 Model
async function example1_directRoute() {
  console.log('=== 示例 1: 直接路由 ===');
  
  const router = createLLMRouter();
  
  try {
    const result = await router.route('anthropic', 'claude-sonnet-4-5', {
      systemPrompt: 'You are a helpful assistant.',
      content: 'What is the capital of France?',
    });
    
    console.log('Response:', result.text);
    console.log('Provider:', result.provider);
    console.log('Model:', result.model);
    console.log('Duration:', result.duration, 'ms');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 示例 2: 使用路由策略自动选择
async function example2_strategyRouting() {
  console.log('\n=== 示例 2: 策略路由 ===');
  
  const router = createLLMRouter();
  
  // 使用成本优先策略
  try {
    const result = await router.routeWithFallback('deepseek-v4-pro', {
      strategy: RoutingStrategy.COST,
      systemPrompt: 'You are a helpful assistant.',
      content: 'Explain quantum computing in simple terms.',
    });
    
    console.log('Response:', result.text);
    console.log('Routing:', result.routing);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 示例 3: 故障转移
async function example3_fallback() {
  console.log('\n=== 示例 3: 故障转移 ===');
  
  const router = createLLMRouter();
  
  try {
    const result = await router.routeWithFallback(null, {
      strategy: RoutingStrategy.FALLBACK,
      tags: ['domestic'], // 只使用国内 Provider
      systemPrompt: 'You are a helpful assistant.',
      content: 'Hello!',
    });
    
    console.log('Response:', result.text);
    console.log('Routing:', result.routing);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 示例 4: 流式输出
async function example4_streaming() {
  console.log('\n=== 示例 4: 流式输出 ===');
  
  const router = createLLMRouter();
  
  try {
    const result = await router.route('openai', 'gpt-5.5', {
      systemPrompt: 'You are a helpful assistant.',
      content: 'Write a short poem about coding.',
      stream: true,
      onChunk: (text) => {
        process.stdout.write('.');
      },
    });
    
    console.log('\nFull response:', result.text);
  } catch (error) {
    console.error('\nError:', error.message);
  }
}

// 示例 5: 兼容现有 api.js 接口
async function example5_compatibility() {
  console.log('\n=== 示例 5: 兼容 api.js 接口 ===');
  
  const config = {
    provider: 'deepseek',
    model: 'deepseek-v4-flash',
    apiKey: process.env.DEEPSEEK_API_KEY || 'test-key',
    baseUrl: 'https://api.deepseek.com',
    maxTokens: 100,
  };
  
  try {
    const result = await callAgentWithRouter(
      config,
      'You are a helpful assistant.',
      'What is 2+2?'
    );
    
    console.log('Response:', result.text);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// 示例 6: 获取 Provider 和模型信息
function example6_info() {
  console.log('\n=== 示例 6: Provider 信息 ===');
  
  // 获取所有 Provider
  const router = createLLMRouter();
  const providers = router.getProviders();
  console.log('Total providers:', providers.length);
  
  // 获取特定 Provider 的模型
  const anthropicModels = getModelsByProvider('anthropic');
  console.log('Anthropic models:', anthropicModels.map(m => m.id));
  
  // 获取免费模型
  const freeModels = getFreeModels();
  console.log('Free models:', freeModels.map(m => `${m.provider}/${m.id}`));
  
  // 获取 Provider 配置
  const deepseek = getProviderByName('deepseek');
  console.log('DeepSeek config:', {
    name: deepseek.name,
    displayName: deepseek.displayName,
    baseUrl: deepseek.baseUrl,
    models: deepseek.models.length,
  });
}

// 示例 7: 健康检查
async function example7_healthCheck() {
  console.log('\n=== 示例 7: 健康检查 ===');
  
  const router = createLLMRouter();
  
  const providers = ['anthropic', 'openai', 'deepseek', 'ollama'];
  
  for (const provider of providers) {
    try {
      const isHealthy = await router.healthCheck(provider);
      console.log(`${provider}: ${isHealthy ? '✓ Healthy' : '✗ Unhealthy'}`);
    } catch (error) {
      console.log(`${provider}: ✗ Error - ${error.message}`);
    }
  }
}

// 示例 8: 自定义配置
async function example8_customConfig() {
  console.log('\n=== 示例 8: 自定义配置 ===');
  
  const router = createLLMRouter({
    defaultStrategy: RoutingStrategy.COST,
    timeout: 60000,
    maxRetries: 3,
    retryDelay: 2000,
  });
  
  console.log('Router config:', {
    defaultStrategy: router.defaultStrategy,
    timeout: router.timeout,
    maxRetries: router.maxRetries,
  });
  
  // 更改策略
  router.setStrategy(RoutingStrategy.LATENCY);
  console.log('Updated strategy:', router.defaultStrategy);
}

// 运行示例
async function main() {
  console.log('LLM Router 使用示例\n');
  
  // 注意：以下示例需要设置相应的环境变量才能正常运行
  // 例如: ANTHROPIC_API_KEY, OPENAI_API_KEY, DEEPSEEK_API_KEY 等
  
  // 示例 6 不需要 API 调用
  example6_info();
  
  // 其他示例需要 API 调用，根据环境变量可用性选择运行
  // await example1_directRoute();
  // await example2_strategyRouting();
  // await example3_fallback();
  // await example4_streaming();
  // await example5_compatibility();
  // await example7_healthCheck();
  // await example8_customConfig();
}

main().catch(console.error);
