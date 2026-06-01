/**
 * Agent画像分析器
 * 采集五层数据，生成Agent画像，支持对比和序列化
 */

import { toolRegistry } from '../toolRegistry.js';
import {
  createAgentProfile,
  createProfileComparison,
  createSpecializationLayer
} from './types.js';
import { skillLayerCollector } from './layers/SkillLayerCollector.js';
import { toolLayerCollector } from './layers/ToolLayerCollector.js';
import { behaviorAnalyzer } from './layers/BehaviorAnalyzer.js';
import { capabilityInferrer } from './layers/CapabilityInferrer.js';
import { specializationScorer } from './layers/SpecializationScorer.js';

class AgentProfiler {
  constructor() {
    this.profiles = new Map();
  }

  /**
   * 生成Agent画像
   * @param {string} agentHash - Agent哈希值
   * @param {Object} agentData - Agent配置数据
   * @returns {Promise<AgentProfile>} Agent画像
   */
  async profile(agentHash, agentData = {}) {
    const profile = createAgentProfile(
      agentHash,
      agentData.name || 'Unknown Agent'
    );

    // 采集各层数据
    profile.toolLayer = await this._analyzeToolLayer(agentHash, agentData);
    profile.skillLayer = await this._analyzeSkillLayer(agentHash, agentData);
    profile.behaviorLayer = await this._analyzeBehaviorLayer(agentHash, agentData);
    profile.capabilityLayer = await this._analyzeCapabilityLayer(profile);
    profile.specializationLayer = await this._analyzeSpecializationLayer(profile);

    // 缓存画像
    this.profiles.set(agentHash, profile);

    return profile;
  }

  /**
   * 对比两个Agent画像
   * @param {AgentProfile} profile1 - 画像1
   * @param {AgentProfile} profile2 - 画像2
   * @returns {ProfileComparison} 对比结果
   */
  compare(profile1, profile2) {
    const comparison = createProfileComparison(
      profile1.agentHash,
      profile2.agentHash
    );

    // 对比各层
    comparison.toolDiff = this._compareToolLayers(profile1.toolLayer, profile2.toolLayer);
    comparison.skillDiff = this._compareSkillLayers(profile1.skillLayer, profile2.skillLayer);
    comparison.behaviorDiff = this._compareBehaviorLayers(profile1.behaviorLayer, profile2.behaviorLayer);
    comparison.capabilityDiff = this._compareCapabilityLayers(profile1.capabilityLayer, profile2.capabilityLayer);
    comparison.specializationDiff = this._compareSpecializationLayers(profile1.specializationLayer, profile2.specializationLayer);

    // 计算综合相似度
    comparison.similarity = this._calculateSimilarity(comparison);

    return comparison;
  }

  /**
   * 序列化为JSON
   * @param {AgentProfile} profile - Agent画像
   * @returns {string} JSON字符串
   */
  toJSON(profile) {
    return JSON.stringify(profile, null, 2);
  }

  /**
   * 从JSON反序列化
   * @param {string} json - JSON字符串
   * @returns {AgentProfile} Agent画像
   */
  fromJSON(json) {
    try {
      const profile = JSON.parse(json);
      // 验证必要字段
      if (!profile.agentHash || !profile.agentName) {
        throw new Error('Invalid profile format');
      }
      return profile;
    } catch (error) {
      throw new Error(`Failed to parse profile JSON: ${error.message}`);
    }
  }

  /**
   * 获取缓存的画像
   * @param {string} agentHash - Agent哈希值
   * @returns {AgentProfile|null} Agent画像
   */
  getCachedProfile(agentHash) {
    return this.profiles.get(agentHash) || null;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.profiles.clear();
  }

  // ==================== 私有方法：数据采集 ====================

  /**
   * 分析工具层
   */
  async _analyzeToolLayer(agentHash, agentData) {
    // 使用ToolLayerCollector采集工具层数据
    return await toolLayerCollector.collect(agentHash, agentData);
  }

  /**
   * 分析Skill层
   */
  async _analyzeSkillLayer(agentHash, agentData) {
    return await skillLayerCollector.collect(agentHash, agentData);
  }

  /**
   * 分析行为层
   */
  async _analyzeBehaviorLayer(agentHash, agentData) {
    // 使用BehaviorAnalyzer分析行为模式
    return await behaviorAnalyzer.analyze(agentHash, agentData);
  }

  /**
   * 分析能力层
   */
  async _analyzeCapabilityLayer(profile) {
    const { toolLayer, skillLayer, behaviorLayer } = profile;
    return capabilityInferrer.infer(toolLayer, skillLayer, behaviorLayer);
  }

  /**
   * 分析专业化层
   */
  async _analyzeSpecializationLayer(profile) {
    const { capabilityLayer } = profile;
    
    // 使用SpecializationScorer计算专业化层
    return specializationScorer.score(capabilityLayer);
  }

  // ==================== 私有方法：对比分析 ====================

  _compareToolLayers(layer1, layer2) {
    const tools1 = new Set(layer1.tools.map(t => t.name));
    const tools2 = new Set(layer2.tools.map(t => t.name));
    
    const common = [...tools1].filter(t => tools2.has(t));
    const onlyIn1 = [...tools1].filter(t => !tools2.has(t));
    const onlyIn2 = [...tools2].filter(t => !tools1.has(t));

    return {
      common,
      onlyIn1,
      onlyIn2,
      totalCountDiff: layer2.totalCount - layer1.totalCount,
      categoryDiff: this._diffObjects(layer1.categories, layer2.categories)
    };
  }

  _compareSkillLayers(layer1, layer2) {
    const skills1 = new Set(layer1.skills.map(s => s.name));
    const skills2 = new Set(layer2.skills.map(s => s.name));
    
    return {
      common: [...skills1].filter(s => skills2.has(s)),
      onlyIn1: [...skills1].filter(s => !skills2.has(s)),
      onlyIn2: [...skills2].filter(s => !skills1.has(s)),
      depthDiff: layer2.averageDepth - layer1.averageDepth,
      domainDiff: this._diffObjects(layer1.domains, layer2.domains)
    };
  }

  _compareBehaviorLayers(layer1, layer2) {
    return {
      totalCallsDiff: layer2.totalCalls - layer1.totalCalls,
      durationDiff: layer2.averageCallDuration - layer1.averageCallDuration,
      frequencyDiff: this._diffObjects(layer1.callFrequency, layer2.callFrequency)
    };
  }

  _compareCapabilityLayers(layer1, layer2) {
    return {
      coverageDiff: this._diffObjects(layer1.coverage, layer2.coverage),
      depthDiff: this._diffObjects(layer1.depth, layer2.depth),
      scoreDiff: layer2.overallScore - layer1.overallScore,
      boundariesDiff: {
        added: layer2.boundaries.filter(b => !layer1.boundaries.includes(b)),
        removed: layer1.boundaries.filter(b => !layer2.boundaries.includes(b))
      }
    };
  }

  _compareSpecializationLayers(layer1, layer2) {
    return {
      indexDiff: layer2.specializationIndex - layer1.specializationIndex,
      expertAreasDiff: {
        added: layer2.expertAreas.filter(a => !layer1.expertAreas.includes(a)),
        removed: layer1.expertAreas.filter(a => !layer2.expertAreas.includes(a))
      },
      uniqueCapabilitiesDiff: {
        added: layer2.uniqueCapabilities.filter(c => !layer1.uniqueCapabilities.includes(c)),
        removed: layer1.uniqueCapabilities.filter(c => !layer2.uniqueCapabilities.includes(c))
      }
    };
  }

  _calculateSimilarity(comparison) {
    const weights = {
      tool: 0.25,
      skill: 0.25,
      behavior: 0.2,
      capability: 0.2,
      specialization: 0.1
    };

    let similarity = 0;

    // 工具相似度
    const toolCommon = comparison.toolDiff.common?.length || 0;
    const toolTotal = (comparison.toolDiff.common?.length || 0) + 
                     (comparison.toolDiff.onlyIn1?.length || 0) + 
                     (comparison.toolDiff.onlyIn2?.length || 0);
    similarity += (toolTotal > 0 ? toolCommon / toolTotal : 0) * weights.tool;

    // 技能相似度
    const skillCommon = comparison.skillDiff.common?.length || 0;
    const skillTotal = (comparison.skillDiff.common?.length || 0) + 
                      (comparison.skillDiff.onlyIn1?.length || 0) + 
                      (comparison.skillDiff.onlyIn2?.length || 0);
    similarity += (skillTotal > 0 ? skillCommon / skillTotal : 0) * weights.skill;

    // 能力相似度
    const capabilityScore = 1 - Math.abs(comparison.capabilityDiff.scoreDiff || 0);
    similarity += capabilityScore * weights.capability;

    // 专业化相似度
    const specializationScore = 1 - Math.abs(comparison.specializationDiff.indexDiff || 0);
    similarity += specializationScore * weights.specialization;

    // 行为相似度（基于调用次数差异）
    const behaviorScore = 1 - Math.min(Math.abs(comparison.behaviorDiff.totalCallsDiff || 0) / 100, 1);
    similarity += behaviorScore * weights.behavior;

    return Math.max(0, Math.min(1, similarity));
  }

  // ==================== 私有方法：工具函数 ====================

  _extractSequencePatterns(callHistory) {
    const patterns = [];
    
    // 分析连续调用的工具对
    for (let i = 0; i < callHistory.length - 1; i++) {
      const current = callHistory[i].toolName;
      const next = callHistory[i + 1].toolName;
      
      if (current !== next) {
        const pattern = `${current} -> ${next}`;
        const existing = patterns.find(p => p.pattern === pattern);
        if (existing) {
          existing.count++;
        } else {
          patterns.push({ pattern, count: 1 });
        }
      }
    }

    // 返回出现次数最多的前5个模式
    return patterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  _extractCombinationPatterns(callHistory) {
    const patterns = [];
    
    // 分析在相近时间内使用的工具组合
    const timeWindow = 5000; // 5秒时间窗口
    
    for (let i = 0; i < callHistory.length; i++) {
      const combo = new Set([callHistory[i].toolName]);
      
      for (let j = i + 1; j < callHistory.length; j++) {
        if (callHistory[j].timestamp - callHistory[i].timestamp > timeWindow) {
          break;
        }
        combo.add(callHistory[j].toolName);
      }

      if (combo.size > 1) {
        const pattern = Array.from(combo).sort().join(' + ');
        const existing = patterns.find(p => p.pattern === pattern);
        if (existing) {
          existing.count++;
        } else {
          patterns.push({ pattern, count: 1 });
        }
      }
    }

    return patterns
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  _identifyUniqueCapabilities(profile) {
    const unique = [];
    
    // 识别独特的工具组合
    const { toolLayer, skillLayer } = profile;
    
    // 如果有多个网络工具，标记为"网络集成专家"
    if ((toolLayer.categories.network || 0) >= 2) {
      unique.push('网络集成专家');
    }
    
    // 如果有多个系统工具，标记为"系统管理专家"
    if ((toolLayer.categories.system || 0) >= 2) {
      unique.push('系统管理专家');
    }
    
    // 如果有深度技能，标记为"领域专家"
    if (skillLayer.maxDepth >= 3) {
      unique.push('领域专家');
    }
    
    // 如果工具覆盖全面，标记为"全栈能力"
    const coverageCount = Object.values(toolLayer.categories).filter(v => v > 0).length;
    if (coverageCount >= 4) {
      unique.push('全栈能力');
    }

    return unique;
  }

  _diffObjects(obj1, obj2) {
    const diff = {};
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    
    allKeys.forEach(key => {
      const val1 = obj1[key] || 0;
      const val2 = obj2[key] || 0;
      if (val1 !== val2) {
        diff[key] = { from: val1, to: val2, diff: val2 - val1 };
      }
    });

    return diff;
  }
}

export const agentProfiler = new AgentProfiler();
