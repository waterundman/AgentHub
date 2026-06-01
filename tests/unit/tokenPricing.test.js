import { describe, it, expect } from 'vitest';
import { calcCost, calcTokenRate, formatCost, formatTokens, MODEL_PRICING } from '../../src/services/tokenPricing';

describe('tokenPricing', () => {
  describe('calcCost', () => {
    it('should calculate cost for anthropic model', () => {
      const cost = calcCost('anthropic', 'claude-3-5-sonnet-20241022', 1000000, 1000000);
      expect(cost.input).toBe(3.00);
      expect(cost.output).toBe(15.00);
      expect(cost.total).toBe(18.00);
    });

    it('should calculate cost for openai model', () => {
      const cost = calcCost('openai', 'gpt-4o', 1000000, 1000000);
      expect(cost.input).toBe(2.50);
      expect(cost.output).toBe(10.00);
      expect(cost.total).toBe(12.50);
    });

    it('should handle cache tokens for anthropic', () => {
      const cost = calcCost('anthropic', 'claude-3-5-sonnet-20241022', 1000000, 1000000, 500000, 200000);
      expect(cost.cacheRead).toBe(0.15);
      expect(cost.cacheWrite).toBe(0.75);
    });

    it('should return null for unknown provider', () => {
      const cost = calcCost('unknown', 'model', 100, 100);
      expect(cost).toBeNull();
    });

    it('should return null for unknown model', () => {
      const cost = calcCost('openai', 'unknown-model', 100, 100);
      expect(cost).toBeNull();
    });

    it('should handle zero tokens', () => {
      const cost = calcCost('openai', 'gpt-4o', 0, 0);
      expect(cost.total).toBe(0);
    });
  });

  describe('calcTokenRate', () => {
    it('should calculate tokens per second', () => {
      const rate = calcTokenRate(1000, 2000);
      expect(rate).toBe(500);
    });

    it('should return 0 for zero duration', () => {
      expect(calcTokenRate(1000, 0)).toBe(0);
    });

    it('should return 0 for null duration', () => {
      expect(calcTokenRate(1000, null)).toBe(0);
    });

    it('should round result', () => {
      const rate = calcTokenRate(1000, 3000);
      expect(rate).toBe(333);
    });
  });

  describe('formatCost', () => {
    it('should format very small costs', () => {
      expect(formatCost(0.00001)).toBe('$0.000010');
    });

    it('should format small costs', () => {
      expect(formatCost(0.005)).toBe('$0.0050');
    });

    it('should format medium costs', () => {
      expect(formatCost(0.5)).toBe('$0.500');
    });

    it('should format large costs', () => {
      expect(formatCost(1.5)).toBe('$1.50');
    });
  });

  describe('formatTokens', () => {
    it('should format millions', () => {
      expect(formatTokens(1500000)).toBe('1.5M');
    });

    it('should format thousands', () => {
      expect(formatTokens(1500)).toBe('1.5K');
    });

    it('should format small numbers', () => {
      expect(formatTokens(500)).toBe('500');
    });

    it('should format zero', () => {
      expect(formatTokens(0)).toBe('0');
    });
  });

  describe('MODEL_PRICING', () => {
    it('should have anthropic models', () => {
      expect(MODEL_PRICING.anthropic).toBeDefined();
      expect(MODEL_PRICING.anthropic['claude-3-5-sonnet-20241022']).toBeDefined();
    });

    it('should have openai models', () => {
      expect(MODEL_PRICING.openai).toBeDefined();
      expect(MODEL_PRICING.openai['gpt-4o']).toBeDefined();
    });
  });
});
