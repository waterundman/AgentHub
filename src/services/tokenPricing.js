export const MODEL_PRICING = {
  anthropic: {
    "claude-sonnet-4-20250514": { input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
    "claude-opus-4-20250514":    { input: 15.00, output: 75.00, cacheRead: 1.50, cacheWrite: 18.75 },
    "claude-3-5-sonnet-20241022":{ input: 3.00, output: 15.00, cacheRead: 0.30, cacheWrite: 3.75 },
    "claude-3-haiku-20240307":   { input: 0.25, output: 1.25, cacheRead: 0.03, cacheWrite: 0.30 },
  },
  openai: {
    "gpt-4o":          { input: 2.50, output: 10.00 },
    "gpt-4o-mini":     { input: 0.15, output: 0.60 },
    "gpt-4-turbo":     { input: 10.00, output: 30.00 },
  },
};

export function calcCost(provider, model, inputTokens, outputTokens, cacheReadTokens = 0, cacheWriteTokens = 0) {
  const pricing = MODEL_PRICING[provider]?.[model];
  if (!pricing) return null;
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cacheReadCost = cacheReadTokens ? (cacheReadTokens / 1_000_000) * (pricing.cacheRead || 0) : 0;
  const cacheWriteCost = cacheWriteTokens ? (cacheWriteTokens / 1_000_000) * (pricing.cacheWrite || 0) : 0;
  return {
    input: inputCost,
    output: outputCost,
    cacheRead: cacheReadCost,
    cacheWrite: cacheWriteCost,
    total: inputCost + outputCost + cacheReadCost + cacheWriteCost,
  };
}

export function calcTokenRate(tokens, durationMs) {
  if (!durationMs || durationMs === 0) return 0;
  return Math.round((tokens / durationMs) * 1000);
}

export function formatCost(usd) {
  if (usd < 0.0001) return `$${usd.toFixed(6)}`;
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  if (usd < 1) return `$${usd.toFixed(3)}`;
  return `$${usd.toFixed(2)}`;
}

export function formatTokens(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}
