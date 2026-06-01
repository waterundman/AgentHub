export class ProviderAdapter {
  constructor(config) {
    this.config = config;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders()
    };
  }

  getAuthHeaders() {
    throw new Error('Not implemented');
  }

  buildBody(systemPrompt, messages, options = {}) {
    return {
      model: this.config.model,
      max_tokens: this.config.maxTokens,
      messages,
      ...this.getExtraOptions(options)
    };
  }

  getExtraOptions(options) {
    return {};
  }

  parseResponse(data) {
    return this.extractText(data);
  }

  extractText(data) {
    throw new Error('Not implemented');
  }

  extractUsage(data) {
    throw new Error('Not implemented');
  }

  getEndpoint() {
    return '';
  }

  parseStreamChunk(json) {
    return '';
  }
}
