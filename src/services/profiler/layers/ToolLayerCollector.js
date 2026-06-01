/**
 * Tool层数据采集器
 * 采集Agent工具层数据，用于五层评述框架的第一层
 */

import { toolRegistry } from '../../toolRegistry.js';
import { createToolLayer } from '../types.js';

export class ToolLayerCollector {
  /**
   * 采集Agent的工具层数据
   * @param {string} agentHash - Agent哈希值
   * @param {Object} agentData - Agent配置数据
   * @returns {Promise<ToolLayer>} 工具层数据
   */
  async collect(agentHash, agentData = {}) {
    const layer = createToolLayer();
    
    // 1. 扫描Agent配置中的工具引用
    const agentToolRefs = this._extractToolReferences(agentData);
    
    // 2. 从工具注册表获取所有可用工具
    const allTools = toolRegistry.list();
    
    // 3. 合并Agent工具引用和注册表工具
    const toolSet = new Set([...agentToolRefs]);
    allTools.forEach(tool => toolSet.add(tool.name));
    
    // 4. 获取工具详情并构建工具列表
    layer.tools = Array.from(toolSet).map(toolName => {
      const registeredTool = toolRegistry.get(toolName);
      const stats = this._getToolStats(agentHash, toolName);
      
      return {
        name: toolName,
        category: registeredTool?.category || 'unknown',
        source: this._determineToolSource(registeredTool, agentData),
        displayName: registeredTool?.displayName || toolName,
        description: registeredTool?.description || '',
        stats: stats
      };
    });
    
    // 5. 统计分类分布
    layer.categories = this._calculateCategories(layer.tools);
    
    // 6. 统计来源分布
    layer.sources = this._calculateSources(layer.tools);
    
    // 7. 计算总数
    layer.totalCount = layer.tools.length;
    layer.uniqueCount = new Set(layer.tools.map(t => t.name)).size;
    
    return layer;
  }
  
  /**
   * 从Agent配置中提取工具引用
   * @param {Object} agentData - Agent配置数据
   * @returns {Array<string>} 工具名称列表
   */
  _extractToolReferences(agentData) {
    const tools = [];
    
    // 从直接配置的工具列表
    if (Array.isArray(agentData.tools)) {
      tools.push(...agentData.tools);
    }
    
    // 从capabilities配置中提取
    if (agentData.capabilities && Array.isArray(agentData.capabilities.tools)) {
      tools.push(...agentData.capabilities.tools);
    }
    
    // 从skills配置中提取关联工具
    if (Array.isArray(agentData.skills)) {
      agentData.skills.forEach(skill => {
        if (skill.tools && Array.isArray(skill.tools)) {
          tools.push(...skill.tools);
        }
      });
    }
    
    // 去重并过滤无效值
    return [...new Set(tools.filter(t => t && typeof t === 'string'))];
  }
  
  /**
   * 确定工具来源
   * @param {Object|null} registeredTool - 注册的工具信息
   * @param {Object} agentData - Agent配置数据
   * @returns {string} 工具来源：'builtin' | 'plugin' | 'custom'
   */
  _determineToolSource(registeredTool, agentData) {
    // 如果在注册表中，根据注册信息判断
    if (registeredTool) {
      // 检查是否为内置工具（在预定义列表中）
      if (registeredTool.sandboxed !== undefined || registeredTool.permissions) {
        return 'builtin';
      }
      return 'plugin';
    }
    
    // 检查是否在自定义工具列表中
    const customTools = agentData.customTools || [];
    if (customTools.some(t => t.name === registeredTool?.name)) {
      return 'custom';
    }
    
    // 默认为自定义
    return 'custom';
  }
  
  /**
   * 获取工具调用统计
   * @param {string} agentHash - Agent哈希值
   * @param {string} toolName - 工具名称
   * @returns {Object} 调用统计
   */
  _getToolStats(agentHash, toolName) {
    try {
      const stats = toolRegistry.getToolStats(agentHash);
      return stats[toolName] || { total: 0, success: 0, failed: 0, totalDuration: 0 };
    } catch (error) {
      return { total: 0, success: 0, failed: 0, totalDuration: 0 };
    }
  }
  
  /**
   * 计算分类分布
   * @param {Array} tools - 工具列表
   * @returns {Object} 分类统计
   */
  _calculateCategories(tools) {
    const categories = {};
    
    tools.forEach(tool => {
      const category = tool.category || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    });
    
    return categories;
  }
  
  /**
   * 计算来源分布
   * @param {Array} tools - 工具列表
   * @returns {Object} 来源统计
   */
  _calculateSources(tools) {
    const sources = {
      builtin: 0,
      plugin: 0,
      custom: 0
    };
    
    tools.forEach(tool => {
      const source = tool.source || 'custom';
      if (sources.hasOwnProperty(source)) {
        sources[source]++;
      } else {
        sources.custom++;
      }
    });
    
    return sources;
  }
  
  /**
   * 获取工具分类详情
   * @param {string} agentHash - Agent哈希值
   * @param {Object} agentData - Agent配置数据
   * @returns {Promise<Object>} 分类详情
   */
  async getCategoryDetails(agentHash, agentData = {}) {
    const layer = await this.collect(agentHash, agentData);
    
    const details = {};
    Object.keys(layer.categories).forEach(category => {
      details[category] = layer.tools.filter(t => t.category === category);
    });
    
    return details;
  }
  
  /**
   * 获取工具来源详情
   * @param {string} agentHash - Agent哈希值
   * @param {Object} agentData - Agent配置数据
   * @returns {Promise<Object>} 来源详情
   */
  async getSourceDetails(agentHash, agentData = {}) {
    const layer = await this.collect(agentHash, agentData);
    
    const details = {};
    Object.keys(layer.sources).forEach(source => {
      details[source] = layer.tools.filter(t => t.source === source);
    });
    
    return details;
  }
  
  /**
   * 比较两个Agent的工具层差异
   * @param {string} agentHash1 - Agent1哈希值
   * @param {Object} agentData1 - Agent1配置数据
   * @param {string} agentHash2 - Agent2哈希值
   * @param {Object} agentData2 - Agent2配置数据
   * @returns {Promise<Object>} 差异分析
   */
  async compareToolLayers(agentHash1, agentData1, agentHash2, agentData2) {
    const [layer1, layer2] = await Promise.all([
      this.collect(agentHash1, agentData1),
      this.collect(agentHash2, agentData2)
    ]);
    
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
      categoryDiff: this._diffObjects(layer1.categories, layer2.categories),
      sourceDiff: this._diffObjects(layer1.sources, layer2.sources),
      similarity: common.length / (common.length + onlyIn1.length + onlyIn2.length)
    };
  }
  
  /**
   * 对比两个对象差异
   * @param {Object} obj1 - 对象1
   * @param {Object} obj2 - 对象2
   * @returns {Object} 差异
   */
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

// 导出单例
export const toolLayerCollector = new ToolLayerCollector();