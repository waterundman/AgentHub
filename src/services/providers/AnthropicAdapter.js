import { ProviderAdapter } from './ProviderAdapter.js';

export class AnthropicAdapter extends ProviderAdapter {
  getAuthHeaders() {
    return {
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01'
    };
  }

  buildBody(systemPrompt, messages, options = {}) {
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      system: systemPrompt,
      messages,
      ...this.getExtraOptions(options)
    };
  }

  getEndpoint() {
    return '';
  }

  extractText(data) {
    return data.content?.find(b => b.type === 'text')?.text || '(无输出)';
  }

  extractUsage(data) {
    const usage = data.usage || {};
    return {
      inputTokens: usage.input_tokens || 0,
      outputTokens: usage.output_tokens || 0,
      cacheReadTokens: usage.cache_read_input_tokens || 0,
      cacheWriteTokens: usage.cache_creation_input_tokens || 0,
    };
  }

  parseStreamChunk(json) {
    if (json.type === 'content_block_delta') {
      return json.delta?.text || '';
    }
    return '';
  }
}
