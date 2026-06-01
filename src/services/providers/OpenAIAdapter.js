import { ProviderAdapter } from './ProviderAdapter.js';

export class OpenAIAdapter extends ProviderAdapter {
  getAuthHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  buildBody(systemPrompt, messages, options = {}) {
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      ...this.getExtraOptions(options)
    };
  }

  getEndpoint() {
    return '';
  }

  extractText(data) {
    return data.choices?.[0]?.message?.content || '(无输出)';
  }

  extractUsage(data) {
    const usage = data.usage || {};
    return {
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    };
  }

  parseStreamChunk(json) {
    return json.choices?.[0]?.delta?.content || '';
  }
}
