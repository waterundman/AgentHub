import { describe, it, expect } from 'vitest';
import { getProviderAdapter } from '../../src/services/providers';
import { AnthropicAdapter } from '../../src/services/providers/AnthropicAdapter';
import { OpenAIAdapter } from '../../src/services/providers/OpenAIAdapter';
import { DeepSeekAdapter } from '../../src/services/providers/DeepSeekAdapter';

describe('Provider Adapters', () => {
  describe('getProviderAdapter', () => {
    it('should return AnthropicAdapter for anthropic', () => {
      const adapter = getProviderAdapter('anthropic', { apiKey: 'test' });
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });

    it('should return OpenAIAdapter for openai', () => {
      const adapter = getProviderAdapter('openai', { apiKey: 'test' });
      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should return DeepSeekAdapter for deepseek', () => {
      const adapter = getProviderAdapter('deepseek', { apiKey: 'test' });
      expect(adapter).toBeInstanceOf(DeepSeekAdapter);
    });

    it('should return OpenAIAdapter for compatible providers', () => {
      const providers = ['qwen', 'zhipu', 'kimi', 'ollama', 'minimax', 'mimo'];
      providers.forEach(provider => {
        const adapter = getProviderAdapter(provider, { apiKey: 'test' });
        expect(adapter).toBeInstanceOf(OpenAIAdapter);
      });
    });

    it('should default to AnthropicAdapter for unknown provider', () => {
      const adapter = getProviderAdapter('unknown', { apiKey: 'test' });
      expect(adapter).toBeInstanceOf(AnthropicAdapter);
    });
  });

  describe('AnthropicAdapter', () => {
    const adapter = new AnthropicAdapter({
      apiKey: 'test-key',
      model: 'claude-3-5-sonnet-20241022',
      maxTokens: 4096
    });

    it('should build correct headers', () => {
      const headers = adapter.getHeaders();
      expect(headers).toHaveProperty('x-api-key', 'test-key');
      expect(headers).toHaveProperty('anthropic-version', '2023-06-01');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('should build correct body', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const body = adapter.buildBody('You are helpful', messages);

      expect(body.model).toBe('claude-3-5-sonnet-20241022');
      expect(body.messages).toEqual(messages);
      expect(body.system).toBe('You are helpful');
      expect(body.max_tokens).toBe(4096);
    });

    it('should extract text from response', () => {
      const data = { content: [{ type: 'text', text: 'Hello world' }] };
      expect(adapter.extractText(data)).toBe('Hello world');
    });

    it('should return fallback for empty content', () => {
      const data = { content: [] };
      expect(adapter.extractText(data)).toBe('(无输出)');
    });

    it('should extract usage from response', () => {
      const data = { usage: { input_tokens: 100, output_tokens: 50 } };
      const usage = adapter.extractUsage(data);
      expect(usage.inputTokens).toBe(100);
      expect(usage.outputTokens).toBe(50);
    });

    it('should handle missing usage', () => {
      const data = {};
      const usage = adapter.extractUsage(data);
      expect(usage.inputTokens).toBe(0);
      expect(usage.outputTokens).toBe(0);
    });

    it('should parse stream chunk', () => {
      const json = { type: 'content_block_delta', delta: { text: 'Hello' } };
      expect(adapter.parseStreamChunk(json)).toBe('Hello');
    });

    it('should return empty for non-content chunk', () => {
      const json = { type: 'other' };
      expect(adapter.parseStreamChunk(json)).toBe('');
    });
  });

  describe('OpenAIAdapter', () => {
    const adapter = new OpenAIAdapter({
      apiKey: 'test-key',
      model: 'gpt-4',
      maxTokens: 4096
    });

    it('should build correct headers', () => {
      const headers = adapter.getHeaders();
      expect(headers).toHaveProperty('Authorization', 'Bearer test-key');
      expect(headers).toHaveProperty('Content-Type', 'application/json');
    });

    it('should build correct body with system prompt', () => {
      const messages = [{ role: 'user', content: 'Hello' }];
      const body = adapter.buildBody('You are helpful', messages);

      expect(body.messages).toHaveLength(2);
      expect(body.messages[0]).toEqual({ role: 'system', content: 'You are helpful' });
      expect(body.messages[1]).toEqual({ role: 'user', content: 'Hello' });
      expect(body.model).toBe('gpt-4');
      expect(body.max_tokens).toBe(4096);
    });

    it('should extract text from response', () => {
      const data = { choices: [{ message: { content: 'Hello world' } }] };
      expect(adapter.extractText(data)).toBe('Hello world');
    });

    it('should return fallback for empty choices', () => {
      const data = { choices: [] };
      expect(adapter.extractText(data)).toBe('(无输出)');
    });

    it('should extract usage from response', () => {
      const data = { usage: { prompt_tokens: 100, completion_tokens: 50 } };
      const usage = adapter.extractUsage(data);
      expect(usage.inputTokens).toBe(100);
      expect(usage.outputTokens).toBe(50);
    });

    it('should handle missing usage', () => {
      const data = {};
      const usage = adapter.extractUsage(data);
      expect(usage.inputTokens).toBe(0);
      expect(usage.outputTokens).toBe(0);
    });

    it('should parse stream chunk', () => {
      const json = { choices: [{ delta: { content: 'Hello' } }] };
      expect(adapter.parseStreamChunk(json)).toBe('Hello');
    });

    it('should return empty for no delta', () => {
      const json = { choices: [{}] };
      expect(adapter.parseStreamChunk(json)).toBe('');
    });
  });

  describe('DeepSeekAdapter', () => {
    it('should extend OpenAIAdapter', () => {
      const adapter = new DeepSeekAdapter({ apiKey: 'test' });
      expect(adapter).toBeInstanceOf(OpenAIAdapter);
    });

    it('should use OpenAI compatible headers', () => {
      const adapter = new DeepSeekAdapter({ apiKey: 'test-key' });
      const headers = adapter.getHeaders();
      expect(headers).toHaveProperty('Authorization', 'Bearer test-key');
    });
  });
});
