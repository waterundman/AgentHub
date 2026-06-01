import { getProviderAdapter } from './providers/index.js';

const DEFAULT_CONFIG = {
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  apiKey: "",
  baseUrl: "https://api.anthropic.com/v1/messages",
  maxTokens: 1000,
  maxRetries: 3,
  retryDelay: 1000,
  useRouter: false,
  routingStrategy: "fallback",
};

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function callAgent(config, systemPrompt, content) {
  if (config.useRouter) {
    try {
      const { callAgentWithRouter } = await import('./llmRouter.js');
      return await callAgentWithRouter(config, systemPrompt, content, {
        strategy: config.routingStrategy,
      });
    } catch (error) {
      console.warn('LLM Router not available, falling back to direct call:', error.message);
    }
  }

  const adapter = getProviderAdapter(config.provider, config);
  const { maxRetries = 3, retryDelay = 1000 } = config;
  let lastErr;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const headers = adapter.getHeaders();
      const body = adapter.buildBody(systemPrompt, [{ role: "user", content }]);
      const startTime = Date.now();

      const res = await fetch(config.baseUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.error?.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const duration = Date.now() - startTime;
      const usage = adapter.extractUsage(data);

      return {
        text: adapter.extractText(data),
        usage,
        duration,
        tokenRate: usage.outputTokens > 0 ? Math.round((usage.outputTokens / duration) * 1000) : 0,
      };
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1) {
        await delay(retryDelay * (attempt + 1));
      }
    }
  }

  throw lastErr || new Error("未知错误");
}

export async function streamCallAgent(config, systemPrompt, content, onChunk) {
  if (config.useRouter) {
    try {
      const { streamCallAgentWithRouter } = await import('./llmRouter.js');
      return await streamCallAgentWithRouter(config, systemPrompt, content, onChunk, {
        strategy: config.routingStrategy,
      });
    } catch (error) {
      console.warn('LLM Router not available, falling back to direct stream:', error.message);
    }
  }

  const adapter = getProviderAdapter(config.provider, config);
  const headers = adapter.getHeaders();
  const body = adapter.buildBody(systemPrompt, [{ role: "user", content }]);
  const startTime = Date.now();

  const res = await fetch(config.baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, stream: true }),
  });

  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error?.message || `HTTP ${res.status}`);
  }

  if (!res.body) {
    const data = await res.json();
    const usage = adapter.extractUsage(data);
    const duration = Date.now() - startTime;
    return {
      text: adapter.extractText(data),
      usage,
      duration,
      tokenRate: usage.outputTokens > 0 ? Math.round((usage.outputTokens / duration) * 1000) : 0,
    };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let fullText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed === "data: [DONE]") continue;
      if (!trimmed.startsWith("data: ")) continue;

      try {
        const json = JSON.parse(trimmed.slice(6));
        const chunk = adapter.parseStreamChunk(json);
        if (chunk) {
          fullText += chunk;
          onChunk(fullText);
        }
      } catch {
      }
    }
  }

  const duration = Date.now() - startTime;
  const estimatedOutput = fullText.length * 0.75;

  return {
    text: fullText || "(无输出)",
    usage: {
      inputTokens: 0,
      outputTokens: Math.round(estimatedOutput),
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    },
    duration,
    tokenRate: estimatedOutput > 0 ? Math.round((estimatedOutput / duration) * 1000) : 0,
  };
}

export { DEFAULT_CONFIG };
