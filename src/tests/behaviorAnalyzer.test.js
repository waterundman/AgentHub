import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorAnalyzer } from '../services/profiler/layers/BehaviorAnalyzer.js';
import { BehaviorFingerprint } from '../services/profiler/fingerprint/BehaviorFingerprint.js';
import { createBehaviorLayer } from '../services/profiler/types.js';

describe('BehaviorAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new BehaviorAnalyzer();
  });

  it('should create BehaviorAnalyzer instance', () => {
    expect(analyzer).toBeDefined();
    expect(analyzer.sequenceWindowSize).toBe(3);
    expect(analyzer.combinationTimeWindow).toBe(5000);
  });

  it('should calculate call frequency correctly', () => {
    const toolStats = {
      'tool1': { total: 10, success: 8, failed: 2, totalDuration: 1000 },
      'tool2': { total: 5, success: 5, failed: 0, totalDuration: 500 }
    };

    const frequency = analyzer._calculateCallFrequency(toolStats);
    
    expect(frequency.tool1.count).toBe(10);
    expect(frequency.tool1.frequency).toBeCloseTo(10/15);
    expect(frequency.tool2.count).toBe(5);
    expect(frequency.tool2.frequency).toBeCloseTo(5/15);
  });

  it('should calculate error rate correctly', () => {
    const callHistory = [
      { success: true },
      { success: false },
      { success: true },
      { success: false },
      { success: true }
    ];

    const errorRate = analyzer._calculateErrorRate(callHistory);
    expect(errorRate).toBeCloseTo(0.4);
  });

  it('should generate summary', () => {
    const behaviorData = createBehaviorLayer();
    behaviorData.totalCalls = 100;
    behaviorData.errorRate = 0.1;
    behaviorData.callFrequency = {
      'tool1': { count: 50 },
      'tool2': { count: 30 }
    };

    const summary = analyzer.generateSummary(behaviorData);
    expect(summary).toContain('总调用次数: 100');
    expect(summary).toContain('错误率: 10.0%');
  });
});

describe('BehaviorFingerprint', () => {
  let fingerprint;

  beforeEach(() => {
    fingerprint = new BehaviorFingerprint();
  });

  it('should create BehaviorFingerprint instance', () => {
    expect(fingerprint).toBeDefined();
    expect(fingerprint.vectorSize).toBe(32);
  });

  it('should generate fingerprint from behavior data', () => {
    const behaviorData = createBehaviorLayer();
    behaviorData.totalCalls = 50;
    behaviorData.errorRate = 0.1;
    behaviorData.callFrequency = {
      'tool1': { count: 30, frequency: 0.6, successCount: 28, failedCount: 2, averageDuration: 100 },
      'tool2': { count: 20, frequency: 0.4, successCount: 20, failedCount: 0, averageDuration: 150 }
    };

    const fp = fingerprint.generate(behaviorData);
    
    expect(fp.vector).toBeDefined();
    expect(fp.vector.length).toBe(32);
    expect(fp.hash).toBeDefined();
    expect(fp.metadata.totalCalls).toBe(50);
  });

  it('should compare fingerprints correctly', () => {
    const behavior1 = createBehaviorLayer();
    behavior1.totalCalls = 50;
    behavior1.errorRate = 0.1;
    behavior1.averageCallDuration = 100;
    behavior1.callFrequency = {
      'tool1': { count: 30, frequency: 0.6, successCount: 28, failedCount: 2, averageDuration: 100 },
      'tool2': { count: 20, frequency: 0.4, successCount: 20, failedCount: 0, averageDuration: 150 }
    };
    behavior1.sequencePatterns = [
      { pattern: 'tool1 -> tool2', count: 10, successRate: 0.9 }
    ];
    behavior1.combinationPatterns = [
      { pattern: 'tool1 + tool2', count: 5, tools: ['tool1', 'tool2'], size: 2 }
    ];

    const behavior2 = createBehaviorLayer();
    behavior2.totalCalls = 50;
    behavior2.errorRate = 0.1;
    behavior2.averageCallDuration = 100;
    behavior2.callFrequency = {
      'tool1': { count: 30, frequency: 0.6, successCount: 28, failedCount: 2, averageDuration: 100 },
      'tool2': { count: 20, frequency: 0.4, successCount: 20, failedCount: 0, averageDuration: 150 }
    };
    behavior2.sequencePatterns = [
      { pattern: 'tool1 -> tool2', count: 10, successRate: 0.9 }
    ];
    behavior2.combinationPatterns = [
      { pattern: 'tool1 + tool2', count: 5, tools: ['tool1', 'tool2'], size: 2 }
    ];

    const fp1 = fingerprint.generate(behavior1);
    const fp2 = fingerprint.generate(behavior2);

    const comparison = fingerprint.compare(fp1, fp2);
    
    expect(comparison.similarity).toBeGreaterThan(0.8);
    expect(comparison.distance).toBeLessThan(0.2);
  });

  it('should normalize vector correctly', () => {
    const vector = [3, 4, 0, 0];
    const normalized = fingerprint._normalizeVector(vector);
    
    expect(normalized[0]).toBeCloseTo(0.6);
    expect(normalized[1]).toBeCloseTo(0.8);
    expect(normalized[2]).toBe(0);
    expect(normalized[3]).toBe(0);
  });

  it('should calculate cosine similarity correctly', () => {
    const vec1 = [1, 0, 0];
    const vec2 = [1, 0, 0];
    const vec3 = [0, 1, 0];

    expect(fingerprint._cosineSimilarity(vec1, vec2)).toBeCloseTo(1);
    expect(fingerprint._cosineSimilarity(vec1, vec3)).toBeCloseTo(0);
  });
});