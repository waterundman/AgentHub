/**
 * Specialization层评分器
 * 基于CapabilityLayer计算Agent专业化指数，用于五层评述框架的第五层
 */

import { createSpecializationLayer } from '../types.js';

const DOMAIN_LABELS = {
  coding: '编码',
  data: '数据',
  writing: '写作',
  research: '研究',
  analysis: '分析',
  design: '设计',
  communication: '沟通',
  automation: '自动化',
  integration: '集成',
  monitoring: '监控'
};

export class SpecializationScorer {
  constructor() {
    this.domainLabels = DOMAIN_LABELS;
  }

  /**
   * 计算专业化层数据
   * @param {CapabilityLayer} capabilityLayer - 能力层数据
   * @returns {SpecializationLayer} 专业化层数据
   */
  score(capabilityLayer) {
    const layer = createSpecializationLayer();

    if (!capabilityLayer || !capabilityLayer.coverage) {
      return layer;
    }

    const { coverage = {}, depth = {}, boundaries = [], gaps = [] } = capabilityLayer;

    // 1. 计算专业化指数
    layer.specializationIndex = this._calculateSpecializationIndex(coverage, depth);

    // 2. 识别TOP擅长领域
    layer.expertAreas = this.identifyTopDomains(capabilityLayer);

    // 3. 发现独特能力
    layer.uniqueCapabilities = this.findUniqueCapabilities(capabilityLayer);

    // 4. 确定主要专注点
    layer.primaryFocus = this._determinePrimaryFocus(layer.expertAreas, coverage);

    return layer;
  }

  /**
   * 识别TOP 3擅长领域
   * @param {CapabilityLayer} capabilityLayer - 能力层数据
   * @returns {Array} 擅长领域列表
   */
  identifyTopDomains(capabilityLayer) {
    if (!capabilityLayer || !capabilityLayer.coverage) {
      return [];
    }

    const { coverage = {}, depth = {} } = capabilityLayer;
    const domains = Object.keys(coverage);

    // 计算每个领域的综合得分 (覆盖度 * 0.6 + 深度 * 0.4)
    const domainScores = domains.map(domain => ({
      domain,
      label: this.domainLabels[domain] || domain,
      coverage: coverage[domain] || 0,
      depth: depth[domain] || 0,
      score: (coverage[domain] || 0) * 0.6 + (depth[domain] || 0) * 0.4
    }));

    // 按得分降序排序，取TOP 3
    return domainScores
      .filter(d => d.score > 0.1) // 过滤掉得分太低的领域
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(d => ({
        domain: d.domain,
        label: d.label,
        score: d.score,
        coverage: d.coverage,
        depth: d.depth
      }));
  }

  /**
   * 发现独特能力
   * @param {CapabilityLayer} capabilityLayer - 能力层数据
   * @returns {Array} 独特能力列表
   */
  findUniqueCapabilities(capabilityLayer) {
    if (!capabilityLayer) {
      return [];
    }

    const { coverage = {}, depth = {}, boundaries = [], gaps = [] } = capabilityLayer;
    const capabilities = [];

    // 1. 检查是否有领域达到专家级别 (覆盖度 > 0.7 且深度 > 0.6)
    Object.entries(coverage).forEach(([domain, cov]) => {
      const dep = depth[domain] || 0;
      if (cov > 0.7 && dep > 0.6) {
        capabilities.push({
          type: 'expert',
          domain,
          label: this.domainLabels[domain] || domain,
          description: `${this.domainLabels[domain] || domain}领域专家`,
          score: cov * 0.5 + dep * 0.5
        });
      }
    });

    // 2. 检查是否有领域达到高级水平 (覆盖度 > 0.5 且深度 > 0.5)
    Object.entries(coverage).forEach(([domain, cov]) => {
      const dep = depth[domain] || 0;
      if (cov > 0.5 && dep > 0.5 && !capabilities.find(c => c.domain === domain)) {
        capabilities.push({
          type: 'advanced',
          domain,
          label: this.domainLabels[domain] || domain,
          description: `${this.domainLabels[domain] || domain}高级能力`,
          score: cov * 0.5 + dep * 0.5
        });
      }
    });

    // 3. 检查是否有独特组合能力
    const highDomains = Object.entries(coverage)
      .filter(([_, cov]) => cov > 0.4)
      .map(([domain]) => domain);

    if (highDomains.length >= 3) {
      capabilities.push({
        type: 'combination',
        domain: 'multi',
        label: '多领域能力',
        description: `跨${highDomains.length}个领域的综合能力`,
        score: highDomains.length / Object.keys(coverage).length
      });
    }

    // 4. 检查边界能力（处于能力边界的领域可能代表正在发展的独特能力）
    boundaries.forEach(boundary => {
      if (boundary.coverage > 0.2) {
        capabilities.push({
          type: 'developing',
          domain: boundary.domain,
          label: this.domainLabels[boundary.domain] || boundary.domain,
          description: `${boundary.label || boundary.domain}发展中能力`,
          score: boundary.coverage
        });
      }
    });

    // 按得分排序，返回前5个
    return capabilities
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map(c => c.description);
  }

  /**
   * 与同类Agent对比
   * @param {SpecializationLayer} agent1 - Agent1的专业化层
   * @param {SpecializationLayer} agent2 - Agent2的专业化层
   * @returns {Object} 对比结果
   */
  compare(agent1, agent2) {
    if (!agent1 || !agent2) {
      return {
        indexDiff: 0,
        commonDomains: [],
        uniqueToAgent1: [],
        uniqueToAgent2: [],
        similarity: 0
      };
    }

    const indexDiff = (agent2.specializationIndex || 0) - (agent1.specializationIndex || 0);

    // 计算共同擅长领域
    const domains1 = new Set((agent1.expertAreas || []).map(d => d.domain || d));
    const domains2 = new Set((agent2.expertAreas || []).map(d => d.domain || d));

    const commonDomains = [...domains1].filter(d => domains2.has(d));
    const uniqueToAgent1 = [...domains1].filter(d => !domains2.has(d));
    const uniqueToAgent2 = [...domains2].filter(d => !domains1.has(d));

    // 计算相似度
    const totalDomains = new Set([...domains1, ...domains2]).size;
    const similarity = totalDomains > 0 ? commonDomains.length / totalDomains : 0;

    return {
      indexDiff,
      commonDomains,
      uniqueToAgent1,
      uniqueToAgent2,
      similarity
    };
  }

  // ==================== 私有方法 ====================

  /**
   * 计算专业化指数
   * 基于能力分布的集中度和深度
   * @returns {number} 0-1，0=完全通用，1=极度专业
   */
  _calculateSpecializationIndex(coverage, depth) {
    const domains = Object.keys(coverage);
    if (domains.length === 0) return 0;

    const scores = domains.map(d => coverage[d] || 0);
    const totalScore = scores.reduce((sum, s) => sum + s, 0);

    if (totalScore === 0) return 0;

    // 计算能力分布的集中度（使用基尼系数或赫芬达尔指数）
    // 赫芬达尔指数 = sum(market_share^2)
    const shares = scores.map(s => s / totalScore);
    const herfindahlIndex = shares.reduce((sum, share) => sum + share * share, 0);

    // 归一化到0-1范围
    // 如果所有能力集中在1个领域，指数=1
    // 如果所有能力均匀分布，指数=1/n
    const normalizedIndex = (herfindahlIndex - 1 / domains.length) / (1 - 1 / domains.length);

    // 考虑深度因素
    const depthValues = domains.map(d => depth[d] || 0);
    const avgDepth = depthValues.reduce((sum, d) => sum + d, 0) / domains.length;
    const maxDepth = Math.max(...depthValues);

    // 深度集中度
    const depthConcentration = maxDepth > 0 ? maxDepth / (avgDepth * domains.length) : 0;

    // 综合指数：集中度权重0.7，深度集中度权重0.3
    const finalIndex = Math.max(0, Math.min(1,
      normalizedIndex * 0.7 + depthConcentration * 0.3
    ));

    return finalIndex;
  }

  /**
   * 确定主要专注点
   */
  _determinePrimaryFocus(expertAreas, coverage) {
    if (expertAreas.length > 0) {
      return expertAreas[0].label || expertAreas[0];
    }

    // 如果没有明显专家领域，找覆盖度最高的
    const domains = Object.entries(coverage);
    if (domains.length === 0) return '通用';

    const [topDomain] = domains.sort((a, b) => b[1] - a[1])[0];
    return this.domainLabels[topDomain] || topDomain;
  }
}

export const specializationScorer = new SpecializationScorer();