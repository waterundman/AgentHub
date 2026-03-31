const DEFAULT_CONFIG = {
  provider: "anthropic",
  model: "claude-sonnet-4-20250514",
  apiKey: "",
  baseUrl: "https://api.anthropic.com/v1/messages",
  maxTokens: 1000,
  maxRetries: 3,
  retryDelay: 1000,
};

function getProviderHeaders(config) {
  switch (config.provider) {
    case "anthropic":
      return {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
        "anthropic-version": "2023-06-01",
      };
    case "openai":
      return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`,
      };
    default:
      return { "Content-Type": "application/json" };
  }
}

function buildRequestBody(config, systemPrompt, messages) {
  switch (config.provider) {
    case "anthropic":
      return {
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages,
      };
    case "openai":
      return {
        model: config.model,
        max_tokens: config.maxTokens,
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      };
    default:
      return {
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages,
      };
  }
}

function parseResponse(config, data) {
  switch (config.provider) {
    case "anthropic":
      return data.content?.find(b => b.type === "text")?.text || "(无输出)";
    case "openai":
      return data.choices?.[0]?.message?.content || "(无输出)";
    default:
      return data.content?.find(b => b.type === "text")?.text || "(无输出)";
  }
}

function extractUsage(config, data) {
  switch (config.provider) {
    case "anthropic": {
      const usage = data.usage || {};
      return {
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        cacheReadTokens: usage.cache_read_input_tokens || 0,
        cacheWriteTokens: usage.cache_creation_input_tokens || 0,
      };
    }
    case "openai": {
      const usage = data.usage || {};
      return {
        inputTokens: usage.prompt_tokens || 0,
        outputTokens: usage.completion_tokens || 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      };
    }
    default: {
      const usage = data.usage || {};
      return {
        inputTokens: usage.input_tokens || 0,
        outputTokens: usage.output_tokens || 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
      };
    }
  }
}

async function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function callAgent(config, systemPrompt, content) {
  const { maxRetries = 3, retryDelay = 1000 } = config;
  let lastErr;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const headers = getProviderHeaders(config);
      const body = buildRequestBody(config, systemPrompt, [{ role: "user", content }]);
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
      const usage = extractUsage(config, data);

      return {
        text: parseResponse(config, data),
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
  const headers = getProviderHeaders(config);
  const body = buildRequestBody(config, systemPrompt, [{ role: "user", content }]);
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
    const usage = extractUsage(config, data);
    const duration = Date.now() - startTime;
    return {
      text: parseResponse(config, data),
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
        let chunk = "";
        if (config.provider === "anthropic") {
          if (json.type === "content_block_delta") {
            chunk = json.delta?.text || "";
          }
        } else if (config.provider === "openai") {
          chunk = json.choices?.[0]?.delta?.content || "";
        }
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
