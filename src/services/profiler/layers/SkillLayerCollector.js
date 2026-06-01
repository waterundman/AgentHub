/**
 * Skill层数据采集器
 * 采集Agent的Skill层数据，用于五层评述框架的第二层
 */

import { createSkillLayer } from '../types.js';

// 领域关键词映射
const DOMAIN_KEYWORDS = {
  coding: ['code', 'programming', 'development', 'software', 'debug', 'refactor', 'implement'],
  data: ['data', 'analysis', 'database', 'sql', 'query', 'statistics', 'visualization'],
  writing: ['write', 'document', 'content', 'copywriting', 'editing', 'proofreading'],
  design: ['design', 'ui', 'ux', 'interface', 'layout', 'visual', 'creative'],
  research: ['research', 'study', 'investigation', 'analysis', 'review', 'survey'],
  system: ['system', 'admin', 'configuration', 'setup', 'deployment', 'devops'],
  communication: ['communication', 'chat', 'email', 'message', 'collaboration'],
  automation: ['automation', 'workflow', 'process', 'scripting', 'batch'],
  security: ['security', 'authentication', 'authorization', 'encryption', 'protection'],
  testing: ['test', 'quality', 'validation', 'verification', 'qa']
};

// 工作流模式识别
const WORKFLOW_PATTERNS = {
  sequential: ['then', 'after', 'next', 'subsequently', 'following'],
  conditional: ['if', 'when', 'unless', 'otherwise', 'else'],
  iterative: ['loop', 'repeat', 'iterate', 'while', 'for each'],
  parallel: ['simultaneously', 'parallel', 'concurrent', 'at the same time']
};

export class SkillLayerCollector {
  constructor() {
    this.domainKeywords = DOMAIN_KEYWORDS;
    this.workflowPatterns = WORKFLOW_PATTERNS;
  }

  /**
   * 采集Agent的Skill层数据
   * @param {string} agentHash - Agent哈希值
   * @param {Object} agentData - Agent配置数据
   * @returns {Promise<SkillLayer>} Skill层数据
   */
  async collect(agentHash, agentData = {}) {
    const layer = createSkillLayer();

    // 1. 解析Agent配置中的Skill引用
    const configSkills = this._parseSkillReferences(agentData);

    // 2. 分析系统提示词中的领域知识
    const promptDomains = this._analyzeSystemPrompt(agentData.systemPrompt || '');

    // 3. 识别工作流模式
    const workflowPatterns = this._identifyWorkflowPatterns(agentData.systemPrompt || '');

    // 4. 合并技能数据
    layer.skills = this._mergeSkills(configSkills, promptDomains, workflowPatterns);

    // 5. 评估Skill深度
    layer.skills = layer.skills.map(skill => ({
      ...skill,
      depth: this._evaluateSkillDepth(skill, agentData)
    }));

    // 6. 计算统计信息
    this._calculateStatistics(layer);

    return layer;
  }

  /**
   * 解析Agent配置中的Skill引用
   */
  _parseSkillReferences(agentData) {
    const skills = [];

    // 从capabilities中提取
    if (agentData.capabilities && Array.isArray(agentData.capabilities)) {
      agentData.capabilities.forEach(capability => {
        skills.push({
          name: capability,
          domain: this._detectDomain(capability),
          source: 'capability',
          description: ''
        });
      });
    }

    // 从skillConfig中提取
    if (agentData.skillConfig) {
      if (Array.isArray(agentData.skillConfig)) {
        agentData.skillConfig.forEach(skill => {
          skills.push({
            name: skill.name || skill,
            domain: skill.domain || this._detectDomain(skill.name || skill),
            source: 'config',
            description: skill.description || ''
          });
        });
      } else if (typeof agentData.skillConfig === 'object') {
        Object.entries(agentData.skillConfig).forEach(([key, value]) => {
          skills.push({
            name: key,
            domain: value.domain || this._detectDomain(key),
            source: 'config',
            description: value.description || ''
          });
        });
      }
    }

    // 从skills中提取（如果存在）
    if (agentData.skills && Array.isArray(agentData.skills)) {
      agentData.skills.forEach(skill => {
        const skillName = skill.name || skill;
        // 避免重复
        if (!skills.some(s => s.name === skillName)) {
          skills.push({
            name: skillName,
            domain: skill.domain || this._detectDomain(skillName),
            source: 'explicit',
            description: skill.description || ''
          });
        }
      });
    }

    return skills;
  }

  /**
   * 分析系统提示词中的领域知识
   */
  _analyzeSystemPrompt(systemPrompt) {
    if (!systemPrompt) return [];

    const domains = [];
    const lowerPrompt = systemPrompt.toLowerCase();

    // 检测每个领域的关键词
    Object.entries(this.domainKeywords).forEach(([domain, keywords]) => {
      const matchCount = keywords.filter(keyword => 
        lowerPrompt.includes(keyword.toLowerCase())
      ).length;

      if (matchCount > 0) {
        domains.push({
          domain,
          confidence: matchCount / keywords.length,
          matchedKeywords: keywords.filter(k => lowerPrompt.includes(k.toLowerCase()))
        });
      }
    });

    // 按置信度排序
    return domains.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * 识别工作流模式
   */
  _identifyWorkflowPatterns(systemPrompt) {
    if (!systemPrompt) return [];

    const patterns = [];
    const lowerPrompt = systemPrompt.toLowerCase();

    Object.entries(this.workflowPatterns).forEach(([pattern, keywords]) => {
      const matchCount = keywords.filter(keyword => 
        lowerPrompt.includes(keyword.toLowerCase())
      ).length;

      if (matchCount > 0) {
        patterns.push({
          pattern,
          strength: matchCount / keywords.length,
          matchedKeywords: keywords.filter(k => lowerPrompt.includes(k.toLowerCase()))
        });
      }
    });

    return patterns;
  }

  /**
   * 合并技能数据
   */
  _mergeSkills(configSkills, promptDomains, workflowPatterns) {
    const mergedSkills = [...configSkills];

    // 将高置信度的领域转换为技能
    promptDomains
      .filter(domain => domain.confidence >= 0.3)
      .forEach(domain => {
        const skillName = `${domain.domain}_expertise`;
        if (!mergedSkills.some(s => s.name === skillName)) {
          mergedSkills.push({
            name: skillName,
            domain: domain.domain,
            source: 'prompt_analysis',
            description: `Expertise in ${domain.domain} based on system prompt analysis`,
            confidence: domain.confidence,
            matchedKeywords: domain.matchedKeywords
          });
        }
      });

    // 将工作流模式转换为技能
    workflowPatterns
      .filter(pattern => pattern.strength >= 0.2)
      .forEach(pattern => {
        const skillName = `${pattern.pattern}_workflow`;
        if (!mergedSkills.some(s => s.name === skillName)) {
          mergedSkills.push({
            name: skillName,
            domain: 'automation',
            source: 'workflow_analysis',
            description: `Capability for ${pattern.pattern} workflow patterns`,
            strength: pattern.strength,
            matchedKeywords: pattern.matchedKeywords
          });
        }
      });

    return mergedSkills;
  }

  /**
   * 评估Skill深度
   */
  _evaluateSkillDepth(skill, agentData) {
    let depth = 1; // 基础深度

    // 基于来源的深度评估
    switch (skill.source) {
      case 'explicit':
        depth += 2; // 明确定义的技能深度更高
        break;
      case 'config':
        depth += 1;
        break;
      case 'capability':
        depth += 1;
        break;
      case 'prompt_analysis':
        depth += skill.confidence ? Math.floor(skill.confidence * 2) : 0;
        break;
      case 'workflow_analysis':
        depth += skill.strength ? Math.floor(skill.strength * 2) : 0;
        break;
    }

    // 基于领域专业性的深度评估
    if (skill.matchedKeywords && skill.matchedKeywords.length > 0) {
      depth += Math.min(skill.matchedKeywords.length, 2);
    }

    // 基于Agent整体能力的深度评估
    if (agentData.capabilities && agentData.capabilities.length > 3) {
      depth += 1; // 多功能Agent的技能深度更高
    }

    return Math.min(depth, 5); // 最大深度为5
  }

  /**
   * 检测领域
   */
  _detectDomain(skillName) {
    const lowerName = skillName.toLowerCase();
    
    for (const [domain, keywords] of Object.entries(this.domainKeywords)) {
      if (keywords.some(keyword => lowerName.includes(keyword))) {
        return domain;
      }
    }
    
    return 'general';
  }

  /**
   * 计算统计信息
   */
  _calculateStatistics(layer) {
    // 统计领域分布
    layer.domains = layer.skills.reduce((acc, skill) => {
      acc[skill.domain] = (acc[skill.domain] || 0) + 1;
      return acc;
    }, {});

    // 计算深度统计
    if (layer.skills.length > 0) {
      const depths = layer.skills.map(s => s.depth);
      layer.averageDepth = depths.reduce((a, b) => a + b, 0) / depths.length;
      layer.maxDepth = Math.max(...depths);
      
      // 获取顶级技能（深度最高的前3个）
      layer.topSkills = [...layer.skills]
        .sort((a, b) => b.depth - a.depth)
        .slice(0, 3)
        .map(s => s.name);
    }
  }
}

export const skillLayerCollector = new SkillLayerCollector();