/**
 * Capability层推断器
 * 基于Tool+Skill+Behavior推断Agent能力边界，用于五层评述框架的第四层
 */

import { createCapabilityLayer } from '../types.js';

// 能力域定义
const CAPABILITY_DOMAINS = {
  coding: {
    label: '编码能力',
    toolCategories: ['execute'],
    toolKeywords: ['code', 'terminal', 'exec', 'compile', 'build', 'debug', 'git'],
    skillKeywords: ['code', 'programming', 'development', 'software', 'debug', 'refactor', 'implement', 'refactoring']
  },
  data: {
    label: '数据处理',
    toolCategories: ['read', 'write'],
    toolKeywords: ['database', 'sql', 'csv', 'json', 'data', 'query', 'export', 'import'],
    skillKeywords: ['data', 'analysis', 'database', 'sql', 'query', 'statistics', 'visualization']
  },
  writing: {
    label: '写作能力',
    toolCategories: ['write'],
    toolKeywords: ['write', 'file', 'document', 'edit', 'content', 'text'],
    skillKeywords: ['write', 'document', 'content', 'copywriting', 'editing', 'proofreading']
  },
  research: {
    label: '研究能力',
    toolCategories: ['read', 'network'],
    toolKeywords: ['search', 'web', 'fetch', 'browse', 'read', 'readFile', 'grep', 'glob'],
    skillKeywords: ['research', 'study', 'investigation', 'analysis', 'review', 'survey']
  },
  analysis: {
    label: '分析能力',
    toolCategories: ['read'],
    toolKeywords: ['analyze', 'parse', 'evaluate', 'calculate', 'compare', 'diff'],
    skillKeywords: ['analysis', 'evaluate', 'assess', 'diagnostic', 'reasoning']
  },
  design: {
    label: '设计能力',
    toolCategories: ['write'],
    toolKeywords: ['design', 'ui', 'ux', 'layout', 'style', 'css', 'svg', 'image'],
    skillKeywords: ['design', 'ui', 'ux', 'interface', 'layout', 'visual', 'creative']
  },
  communication: {
    label: '沟通能力',
    toolCategories: ['network'],
    toolKeywords: ['email', 'message', 'chat', 'notify', 'webhook', 'api', 'http', 'fetch'],
    skillKeywords: ['communication', 'chat', 'email', 'message', 'collaboration']
  },
  automation: {
    label: '自动化能力',
    toolCategories: ['execute', 'system'],
    toolKeywords: ['script', 'automate', 'workflow', 'pipeline', 'cron', 'schedule', 'batch', 'shell'],
    skillKeywords: ['automation', 'workflow', 'process', 'scripting', 'batch']
  },
  integration: {
    label: '集成能力',
    toolCategories: ['network', 'system'],
    toolKeywords: ['api', 'webhook', 'integration', 'connect', 'sync', 'plugin', 'mcp', 'rest'],
    skillKeywords: ['integration', 'api', 'webhook', 'connect', 'sync', 'plugin']
  },
  monitoring: {
    label: '监控能力',
    toolCategories: ['read', 'system'],
    toolKeywords: ['monitor', 'log', 'trace', 'metric', 'health', 'status', 'watch', 'alert'],
    skillKeywords: ['monitoring', 'logging', 'observability', 'health', 'metrics', 'system']
  }
};

export class CapabilityInferrer {
  constructor() {
    this.domains = CAPABILITY_DOMAINS;
    this.domainKeys = Object.keys(CAPABILITY_DOMAINS);
  }

  /**
   * 推断能力边界
   * @param {ToolLayer} toolLayer - 工具层数据
   * @param {SkillLayer} skillLayer - Skill层数据
   * @param {BehaviorLayer} behaviorLayer - 行为层数据
   * @returns {CapabilityLayer} 能力层数据
   */
  infer(toolLayer, skillLayer, behaviorLayer) {
    const layer = createCapabilityLayer();

    // 1. 基于Tool+Skill推断能力覆盖
    layer.coverage = this._inferCoverage(toolLayer, skillLayer);

    // 2. 基于Behavior推断能力深度
    layer.depth = this._inferDepth(toolLayer, skillLayer, behaviorLayer);

    // 3. 识别能力边界
    layer.boundaries = this._identifyBoundaries(layer.coverage, layer.depth);

    // 4. 识别能力缺口
    layer.gaps = this._identifyGaps(layer.coverage, layer.depth, toolLayer, skillLayer);

    // 5. 计算综合能力评分
    layer.overallScore = this._calculateOverallScore(layer);

    return layer;
  }

  /**
   * 推断能力覆盖度
   * 基于工具分类、工具关键词匹配、技能领域分布
   * @returns {Object} { domain: score } score 0-1
   */
  _inferCoverage(toolLayer, skillLayer) {
    const coverage = {};

    this.domainKeys.forEach(domain => {
      const config = this.domains[domain];
      const scores = [];

      // 因子1: 工具分类覆盖
      const categoryScore = this._calcCategoryCoverage(toolLayer, config.toolCategories);
      scores.push({ value: categoryScore, weight: 0.3 });

      // 因子2: 工具关键词匹配
      const toolKeywordScore = this._calcToolKeywordMatch(toolLayer, config.toolKeywords);
      scores.push({ value: toolKeywordScore, weight: 0.3 });

      // 因子3: 技能领域分布
      const skillDomainScore = this._calcSkillDomainMatch(skillLayer, domain, config.skillKeywords);
      scores.push({ value: skillDomainScore, weight: 0.4 });

      // 加权平均
      const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
      coverage[domain] = scores.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight;
    });

    return coverage;
  }

  /**
   * 推断能力深度
   * 基于工具使用频率、技能深度、行为模式复杂度
   * @returns {Object} { domain: score } score 0-1
   */
  _inferDepth(toolLayer, skillLayer, behaviorLayer) {
    const depth = {};

    this.domainKeys.forEach(domain => {
      const config = this.domains[domain];
      const scores = [];

      // 因子1: 相关工具的使用频率
      const usageScore = this._calcToolUsageDepth(toolLayer, behaviorLayer, config.toolKeywords);
      scores.push({ value: usageScore, weight: 0.3 });

      // 因子2: 相关技能的深度
      const skillDepthScore = this._calcSkillDepth(skillLayer, domain, config.skillKeywords);
      scores.push({ value: skillDepthScore, weight: 0.4 });

      // 因子3: 行为模式复杂度（序列和组合模式）
      const behaviorScore = this._calcBehaviorComplexity(behaviorLayer, config.toolKeywords);
      scores.push({ value: behaviorScore, weight: 0.3 });

      // 加权平均
      const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
      depth[domain] = scores.reduce((sum, s) => sum + s.value * s.weight, 0) / totalWeight;
    });

    return depth;
  }

  /**
   * 识别能力边界
   * 能力边界 = 覆盖度低但非零的领域（处于边缘）
   */
  _identifyBoundaries(coverage, depth) {
    const boundaries = [];

    this.domainKeys.forEach(domain => {
      const cov = coverage[domain] || 0;
      const dep = depth[domain] || 0;

      // 边界条件：覆盖度在 0.1-0.4 之间，或覆盖度>0但深度极低
      if (cov > 0.05 && cov < 0.4) {
        boundaries.push({
          domain,
          label: CAPABILITY_DOMAINS[domain].label,
          coverage: cov,
          depth: dep,
          type: 'low_coverage',
          description: `${CAPABILITY_DOMAINS[domain].label}能力覆盖度较低，处于能力边界`
        });
      } else if (cov >= 0.4 && dep < 0.2) {
        boundaries.push({
          domain,
          label: CAPABILITY_DOMAINS[domain].label,
          coverage: cov,
          depth: dep,
          type: 'shallow_depth',
          description: `${CAPABILITY_DOMAINS[domain].label}有基本覆盖但深度不足`
        });
      }
    });

    return boundaries.sort((a, b) => (a.coverage + a.depth) - (b.coverage + b.depth));
  }

  /**
   * 识别能力缺口
   * 能力缺口 = 覆盖度接近零的领域
   */
  _identifyGaps(coverage, depth, toolLayer, skillLayer) {
    const gaps = [];

    this.domainKeys.forEach(domain => {
      const cov = coverage[domain] || 0;

      if (cov < 0.1) {
        const config = this.domains[domain];
        const missingTools = this._findMissingTools(toolLayer, config.toolKeywords);
        const missingSkills = this._findMissingSkills(skillLayer, domain);

        gaps.push({
          domain,
          label: config.label,
          coverage: cov,
          missingTools,
          missingSkills,
          severity: cov < 0.03 ? 'critical' : 'warning',
          recommendation: this._generateGapRecommendation(domain, missingTools, missingSkills)
        });
      }
    });

    return gaps.sort((a, b) => a.coverage - b.coverage);
  }

  // ==================== 覆盖度计算辅助 ====================

  _calcCategoryCoverage(toolLayer, targetCategories) {
    if (!toolLayer.categories || toolLayer.totalCount === 0) return 0;

    const matchedCount = targetCategories.reduce((sum, cat) => {
      return sum + (toolLayer.categories[cat] || 0);
    }, 0);

    return Math.min(matchedCount / Math.max(targetCategories.length, 1), 1);
  }

  _calcToolKeywordMatch(toolLayer, keywords) {
    if (!toolLayer.tools || toolLayer.tools.length === 0) return 0;

    const matchedTools = toolLayer.tools.filter(tool => {
      const toolText = `${tool.name} ${tool.displayName || ''} ${tool.description || ''} ${tool.category || ''}`.toLowerCase();
      return keywords.some(kw => toolText.includes(kw.toLowerCase()));
    });

    return Math.min(matchedTools.length / Math.max(keywords.length * 0.5, 1), 1);
  }

  _calcSkillDomainMatch(skillLayer, targetDomain, keywords) {
    if (!skillLayer.skills || skillLayer.skills.length === 0) return 0;

    // 直接领域匹配
    const domainMatches = skillLayer.skills.filter(s => s.domain === targetDomain);

    // 关键词匹配
    const keywordMatches = skillLayer.skills.filter(skill => {
      const skillText = `${skill.name} ${skill.description || ''}`.toLowerCase();
      return keywords.some(kw => skillText.includes(kw.toLowerCase()));
    });

    const directScore = Math.min(domainMatches.length / 3, 1);
    const keywordScore = Math.min(keywordMatches.length / 5, 1);

    return directScore * 0.6 + keywordScore * 0.4;
  }

  // ==================== 深度计算辅助 ====================

  _calcToolUsageDepth(toolLayer, behaviorLayer, keywords) {
    if (!behaviorLayer.callFrequency || !toolLayer.tools) return 0;

    // 找到相关工具
    const relatedToolNames = toolLayer.tools
      .filter(tool => {
        const toolText = `${tool.name} ${tool.displayName || ''} ${tool.category || ''}`.toLowerCase();
        return keywords.some(kw => toolText.includes(kw.toLowerCase()));
      })
      .map(t => t.name);

    if (relatedToolNames.length === 0) return 0;

    // 计算相关工具的使用频率
    const totalCalls = behaviorLayer.totalCalls || 1;
    const relatedCalls = relatedToolNames.reduce((sum, name) => {
      const freq = behaviorLayer.callFrequency[name];
      return sum + (freq ? freq.count || 0 : 0);
    }, 0);

    // 使用频率归一化（对数尺度）
    if (relatedCalls === 0) return 0;
    return Math.min(Math.log2(relatedCalls + 1) / Math.log2(totalCalls + 1) * 2, 1);
  }

  _calcSkillDepth(skillLayer, targetDomain, keywords) {
    if (!skillLayer.skills || skillLayer.skills.length === 0) return 0;

    const relatedSkills = skillLayer.skills.filter(skill => {
      if (skill.domain === targetDomain) return true;
      const skillText = `${skill.name} ${skill.description || ''}`.toLowerCase();
      return keywords.some(kw => skillText.includes(kw.toLowerCase()));
    });

    if (relatedSkills.length === 0) return 0;

    const maxPossibleDepth = 5;
    const avgDepth = relatedSkills.reduce((sum, s) => sum + (s.depth || 1), 0) / relatedSkills.length;
    return Math.min(avgDepth / maxPossibleDepth, 1);
  }

  _calcBehaviorComplexity(behaviorLayer, keywords) {
    if (!behaviorLayer) return 0;

    let score = 0;
    let factors = 0;

    // 序列模式中包含相关工具
    if (behaviorLayer.sequencePatterns && behaviorLayer.sequencePatterns.length > 0) {
      const relatedPatterns = behaviorLayer.sequencePatterns.filter(p => {
        const patternText = p.pattern.toLowerCase();
        return keywords.some(kw => patternText.includes(kw.toLowerCase()));
      });
      score += Math.min(relatedPatterns.length / 3, 1);
      factors++;
    }

    // 组合模式中包含相关工具
    if (behaviorLayer.combinationPatterns && behaviorLayer.combinationPatterns.length > 0) {
      const relatedCombos = behaviorLayer.combinationPatterns.filter(p => {
        const comboText = (p.pattern || (p.tools || []).join(' ')).toLowerCase();
        return keywords.some(kw => comboText.includes(kw.toLowerCase()));
      });
      score += Math.min(relatedCombos.length / 3, 1);
      factors++;
    }

    // 总调用次数（经验深度）
    if (behaviorLayer.totalCalls > 0) {
      score += Math.min(behaviorLayer.totalCalls / 200, 1);
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  // ==================== 缺口分析辅助 ====================

  _findMissingTools(toolLayer, keywords) {
    const existingToolText = (toolLayer.tools || []).map(t =>
      `${t.name} ${t.displayName || ''} ${t.category || ''}`.toLowerCase()
    );

    return keywords.filter(kw => {
      return !existingToolText.some(text => text.includes(kw.toLowerCase()));
    });
  }

  _findMissingSkills(skillLayer, domain) {
    const domainSkills = (skillLayer.skills || []).filter(s => s.domain === domain);

    if (domainSkills.length === 0) {
      return [`缺少${CAPABILITY_DOMAINS[domain].label}相关技能`];
    }

    return [];
  }

  _generateGapRecommendation(domain, missingTools, missingSkills) {
    const label = CAPABILITY_DOMAINS[domain].label;
    const parts = [`增强${label}能力:`];

    if (missingTools.length > 0) {
      parts.push(`添加相关工具 (${missingTools.slice(0, 3).join(', ')})`);
    }
    if (missingSkills.length > 0) {
      parts.push(`培养${label}技能`);
    }

    return parts.join(' ');
  }

  // ==================== 综合评分 ====================

  _calculateOverallScore(layer) {
    const domains = this.domainKeys;
    if (domains.length === 0) return 0;

    // 覆盖度评分（40%权重）
    const coverageScore = domains.reduce((sum, d) => sum + (layer.coverage[d] || 0), 0) / domains.length;

    // 深度评分（40%权重）
    const depthScore = domains.reduce((sum, d) => sum + (layer.depth[d] || 0), 0) / domains.length;

    // 边界惩罚（20%权重）- 缺口越多扣分越多
    const gapPenalty = layer.gaps.length / domains.length;

    return Math.max(0, coverageScore * 0.4 + depthScore * 0.4 + (1 - gapPenalty) * 0.2);
  }
}

export const capabilityInferrer = new CapabilityInferrer();
