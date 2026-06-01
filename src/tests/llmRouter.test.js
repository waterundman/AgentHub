/**
 * LLM Router 集成测试
 * 测试各个模块的基本功能
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PROVIDERS, getProviderByName, getModelsByProvider, getProviderNames, getFreeModels } from '../constants/providers.js';
import { CircuitBreaker, CircuitBreakerManager, CircuitState, CircuitBreakerOpenError } from '../services/circuitBreaker.js';
import { RoutingStrategy, RoutingStrategyFactory, LatencyTracker, RoutingError } from '../services/routingStrategy.js';
import { LLMRouter, createLLMRouter } from '../services/llmRouter.js';

describe('Providers', () => {
  it('should have at least 10 providers', () => {
    expect(PROVIDERS.length).toBeGreaterThanOrEqual(10);
  });

  it('should get provider by name', () => {
    const anthropic = getProviderByName('anthropic');
    expect(anthropic).toBeDefined();
    expect(anthropic.name).toBe('anthropic');
    expect(anthropic.displayName).toBe('Anthropic Claude');
  });

  it('should get models by provider', () => {
    const models = getModelsByProvider('openai');
    expect(models.length).toBeGreaterThan(0);
    expect(models[0]).toHaveProperty('id');
    expect(models[0]).toHaveProperty('cost');
  });

  it('should get all provider names', () => {
    const names = getProviderNames();
    expect(names).toContain('anthropic');
    expect(names).toContain('openai');
    expect(names).toContain('deepseek');
  });

  it('should get free models', () => {
    const freeModels = getFreeModels();
    expect(freeModels.length).toBeGreaterThan(0);
    freeModels.forEach(model => {
      expect(model.cost.input).toBe(0);
      expect(model.cost.output).toBe(0);
    });
  });
});

describe('CircuitBreaker', () => {
  let breaker;

  beforeEach(() => {
    breaker = new CircuitBreaker('test', {
      failureThreshold: 3,
      recoveryTimeout: 1000,
      successThreshold: 2,
    });
  });

  it('should start in CLOSED state', () => {
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('should open after threshold failures', async () => {
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.call(() => Promise.reject(new Error('test')));
      } catch {}
    }
    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it('should reject calls when OPEN', async () => {
    // Force open
    for (let i = 0; i < 3; i++) {
      try {
        await breaker.call(() => Promise.reject(new Error('test')));
      } catch {}
    }

    await expect(breaker.call(() => Promise.resolve())).rejects.toThrow(CircuitBreakerOpenError);
  });

  it('should reset to CLOSED', () => {
    breaker.reset();
    expect(breaker.getState()).toBe(CircuitState.CLOSED);
    expect(breaker.failures).toBe(0);
  });

  it('should provide stats', () => {
    const stats = breaker.getStats();
    expect(stats).toHaveProperty('name', 'test');
    expect(stats).toHaveProperty('state', CircuitState.CLOSED);
    expect(stats).toHaveProperty('failures', 0);
  });
});

describe('CircuitBreakerManager', () => {
  let manager;

  beforeEach(() => {
    manager = new CircuitBreakerManager();
  });

  it('should create breaker on demand', () => {
    const breaker = manager.getOrCreate('test');
    expect(breaker).toBeInstanceOf(CircuitBreaker);
  });

  it('should return existing breaker', () => {
    const breaker1 = manager.getOrCreate('test');
    const breaker2 = manager.getOrCreate('test');
    expect(breaker1).toBe(breaker2);
  });

  it('should check if breaker is open', () => {
    expect(manager.isOpen('test')).toBe(false);
  });

  it('should reset all breakers', () => {
    manager.getOrCreate('test1');
    manager.getOrCreate('test2');
    manager.resetAll();
    expect(manager.get('test1').getState()).toBe(CircuitState.CLOSED);
    expect(manager.get('test2').getState()).toBe(CircuitState.CLOSED);
  });
});

describe('LatencyTracker', () => {
  let tracker;

  beforeEach(() => {
    tracker = new LatencyTracker();
  });

  it('should record latency', () => {
    tracker.record('test', 100);
    tracker.record('test', 200);
    expect(tracker.getAvgLatency('test')).toBe(150);
  });

  it('should calculate P95', () => {
    for (let i = 0; i < 100; i++) {
      tracker.record('test', i * 10);
    }
    const p95 = tracker.getP95Latency('test');
    expect(p95).toBeGreaterThan(0);
  });

  it('should return Infinity for unknown provider', () => {
    expect(tracker.getAvgLatency('unknown')).toBe(Infinity);
  });

  it('should clear records', () => {
    tracker.record('test', 100);
    tracker.clear('test');
    expect(tracker.getAvgLatency('test')).toBe(Infinity);
  });
});

describe('RoutingStrategyFactory', () => {
  let factory;

  beforeEach(() => {
    factory = new RoutingStrategyFactory();
  });

  it('should have default strategies', () => {
    const strategies = factory.getAvailable();
    expect(strategies).toContain('cost');
    expect(strategies).toContain('latency');
    expect(strategies).toContain('fallback');
    expect(strategies).toContain('manual');
  });

  it('should get strategy by name', () => {
    const costStrategy = factory.get('cost');
    expect(costStrategy.name).toBe('cost');
  });

  it('should throw for unknown strategy', () => {
    expect(() => factory.get('unknown')).toThrow(RoutingError);
  });
});

describe('LLMRouter', () => {
  let router;

  beforeEach(() => {
    router = createLLMRouter();
  });

  it('should create router with default config', () => {
    expect(router).toBeInstanceOf(LLMRouter);
    expect(router.defaultStrategy).toBe('fallback');
  });

  it('should get providers', () => {
    const providers = router.getProviders();
    expect(providers.length).toBeGreaterThanOrEqual(10);
  });

  it('should get models for provider', () => {
    const models = router.getModels('anthropic');
    expect(models.length).toBeGreaterThan(0);
  });

  it('should get config', () => {
    const config = router.getConfig();
    expect(config).toHaveProperty('defaultStrategy');
    expect(config).toHaveProperty('providers');
    expect(config).toHaveProperty('breakerStats');
  });

  it('should set strategy', () => {
    router.setStrategy('cost');
    expect(router.defaultStrategy).toBe('cost');
  });

  it('should throw for invalid strategy', () => {
    expect(() => router.setStrategy('invalid')).toThrow(RoutingError);
  });

  it('should reset', () => {
    router.reset();
    // Should not throw
  });
});
