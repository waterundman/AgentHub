/**
 * Behavior层分析器
 * 分析Agent行为模式，用于五层评述框架的第三层
 */

import { toolRegistry } from '../../toolRegistry.js';
import { createBehaviorLayer } from '../types.js';

export class BehaviorAnalyzer {
  constructor() {
    this.sequenceWindowSize = 3; // 序列模式窗口大小
    this.combinationTimeWindow = 5000; // 组合模式时间窗口（毫秒）
  }

  /**
   * 分析Agent行为模式
   * @param {string} agentHash - Agent哈希值
   * @param {Object} agentData - Agent配置数据
   * @returns {Promise<BehaviorLayer>} 行为层数据
   */
  async analyze(agentHash, agentData = {}) {
    const layer = createBehaviorLayer();

    // 1. 获取调用历史和统计
    const callHistory = toolRegistry.getCallHistory(agentHash, 1000);
    const toolStats = toolRegistry.getToolStats(agentHash);

    // 2. 统计工具调用频率
    layer.callFrequency = this._calculateCallFrequency(toolStats);

    // 3. 识别调用顺序模式
    layer.sequencePatterns = this._extractSequencePatterns(callHistory);

    // 4. 发现工具组合模式
    layer.combinationPatterns = this._extractCombinationPatterns(callHistory);

    // 5. 计算错误率
    layer.errorRate = this._calculateErrorRate(callHistory);

    // 6. 计算总调用次数
    layer.totalCalls = callHistory.length;

    // 7. 计算平均调用时长
    if (callHistory.length > 0) {
      const totalDuration = callHistory.reduce((sum, log) => sum + (log.duration || 0), 0);
      layer.averageCallDuration = totalDuration / callHistory.length;
    }

    return layer;
  }

  /**
   * 计算工具调用频率
   * @param {Object} toolStats - 工具统计信息
   * @returns {Object} 调用频率统计
   */
  _calculateCallFrequency(toolStats) {
    const frequency = {};
    let totalCalls = 0;

    // 计算总调用次数
    Object.values(toolStats).forEach(stats => {
      totalCalls += stats.total || 0;
    });

    // 计算每个工具的调用频率
    Object.entries(toolStats).forEach(([toolName, stats]) => {
      const total = stats.total || 0;
      frequency[toolName] = {
        count: total,
        successCount: stats.success || 0,
        failedCount: stats.failed || 0,
        frequency: totalCalls > 0 ? total / totalCalls : 0,
        averageDuration: total > 0 ? (stats.totalDuration || 0) / total : 0
      };
    });

    return frequency;
  }

  /**
   * 提取调用顺序模式
   * @param {Array} callHistory - 调用历史
   * @returns {Array} 顺序模式列表
   */
  _extractSequencePatterns(callHistory) {
    if (callHistory.length < 2) {
      return [];
    }

    const patterns = new Map();

    // 按时间排序（从旧到新）
    const sortedHistory = [...callHistory].sort((a, b) => a.timestamp - b.timestamp);

    // 提取长度为2的序列模式
    for (let i = 0; i < sortedHistory.length - 1; i++) {
      const current = sortedHistory[i].toolName;
      const next = sortedHistory[i + 1].toolName;

      if (current !== next) {
        const pattern = `${current} -> ${next}`;
        const existing = patterns.get(pattern) || { count: 0, successRate: 0, totalSuccess: 0 };
        existing.count++;
        
        // 统计序列成功率
        if (sortedHistory[i].success && sortedHistory[i + 1].success) {
          existing.totalSuccess++;
        }
        existing.successRate = existing.totalSuccess / existing.count;
        
        patterns.set(pattern, existing);
      }
    }

    // 提取长度为3的序列模式
    if (sortedHistory.length >= 3) {
      for (let i = 0; i < sortedHistory.length - 2; i++) {
        const tools = [
          sortedHistory[i].toolName,
          sortedHistory[i + 1].toolName,
          sortedHistory[i + 2].toolName
        ];

        // 检查是否都是不同的工具
        if (new Set(tools).size === tools.length) {
          const pattern = tools.join(' -> ');
          const existing = patterns.get(pattern) || { count: 0, successRate: 0, totalSuccess: 0 };
          existing.count++;

          if (sortedHistory[i].success && sortedHistory[i + 1].success && sortedHistory[i + 2].success) {
            existing.totalSuccess++;
          }
          existing.successRate = existing.totalSuccess / existing.count;

          patterns.set(pattern, existing);
        }
      }
    }

    // 转换为数组并按出现次数排序
    return Array.from(patterns.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        successRate: data.successRate
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 返回前10个模式
  }

  /**
   * 提取工具组合模式
   * @param {Array} callHistory - 调用历史
   * @returns {Array} 组合模式列表
   */
  _extractCombinationPatterns(callHistory) {
    if (callHistory.length < 2) {
      return [];
    }

    const combinations = new Map();

    // 按时间排序
    const sortedHistory = [...callHistory].sort((a, b) => a.timestamp - b.timestamp);

    // 在时间窗口内查找工具组合
    for (let i = 0; i < sortedHistory.length; i++) {
      const combo = new Set([sortedHistory[i].toolName]);
      
      // 查找时间窗口内的其他工具调用
      for (let j = i + 1; j < sortedHistory.length; j++) {
        if (sortedHistory[j].timestamp - sortedHistory[i].timestamp > this.combinationTimeWindow) {
          break;
        }
        combo.add(sortedHistory[j].toolName);
      }

      // 只记录包含多个工具的组合
      if (combo.size > 1) {
        const pattern = Array.from(combo).sort().join(' + ');
        const existing = combinations.get(pattern) || { count: 0, tools: Array.from(combo) };
        existing.count++;
        combinations.set(pattern, existing);
      }
    }

    // 转换为数组并按出现次数排序
    return Array.from(combinations.entries())
      .map(([pattern, data]) => ({
        pattern,
        count: data.count,
        tools: data.tools,
        size: data.tools.length
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 返回前10个组合
  }

  /**
   * 计算错误率
   * @param {Array} callHistory - 调用历史
   * @returns {number} 错误率 (0-1)
   */
  _calculateErrorRate(callHistory) {
    if (callHistory.length === 0) {
      return 0;
    }

    const failedCalls = callHistory.filter(log => !log.success).length;
    return failedCalls / callHistory.length;
  }

  /**
   * 分析工具使用趋势
   * @param {string} agentHash - Agent哈希值
   * @param {number} timeRange - 时间范围（毫秒）
   * @returns {Object} 趋势分析
   */
  async analyzeTrends(agentHash, timeRange = 7 * 24 * 60 * 60 * 1000) {
    const callHistory = toolRegistry.getCallHistory(agentHash, 10000);
    const now = Date.now();
    const startTime = now - timeRange;

    // 过滤时间范围内的调用
    const recentCalls = callHistory.filter(log => log.timestamp >= startTime);

    // 按天分组
    const dailyStats = {};
    recentCalls.forEach(log => {
      const day = new Date(log.timestamp).toISOString().split('T')[0];
      if (!dailyStats[day]) {
        dailyStats[day] = { total: 0, success: 0, failed: 0, tools: new Set() };
      }
      dailyStats[day].total++;
      if (log.success) {
        dailyStats[day].success++;
      } else {
        dailyStats[day].failed++;
      }
      dailyStats[day].tools.add(log.toolName);
    });

    // 转换为数组
    const trendData = Object.entries(dailyStats)
      .map(([date, stats]) => ({
        date,
        total: stats.total,
        success: stats.success,
        failed: stats.failed,
        successRate: stats.total > 0 ? stats.success / stats.total : 0,
        uniqueTools: stats.tools.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 计算趋势
    const trend = this._calculateTrend(trendData.map(d => d.total));

    return {
      dailyData: trendData,
      trend,
      totalCalls: recentCalls.length,
      averageDaily: trendData.length > 0 ? recentCalls.length / trendData.length : 0
    };
  }

  /**
   * 计算趋势方向
   * @param {Array} values - 数值数组
   * @returns {Object} 趋势信息
   */
  _calculateTrend(values) {
    if (values.length < 2) {
      return { direction: 'stable', slope: 0, confidence: 0 };
    }

    // 简单线性回归
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const avgY = sumY / n;

    // 计算R²值
    const ssRes = values.reduce((sum, y, i) => {
      const predicted = slope * i + (sumY - slope * sumX) / n;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - avgY, 2), 0);
    const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

    // 判断趋势方向
    let direction = 'stable';
    if (Math.abs(slope) > avgY * 0.1) { // 斜率超过平均值的10%
      direction = slope > 0 ? 'increasing' : 'decreasing';
    }

    return {
      direction,
      slope,
      confidence: Math.abs(r2)
    };
  }

  /**
   * 识别异常行为
   * @param {string} agentHash - Agent哈希值
   * @returns {Array} 异常行为列表
   */
  async detectAnomalies(agentHash) {
    const callHistory = toolRegistry.getCallHistory(agentHash, 1000);
    const anomalies = [];

    if (callHistory.length === 0) {
      return anomalies;
    }

    // 1. 检测异常高频调用
    const toolCounts = {};
    callHistory.forEach(log => {
      toolCounts[log.toolName] = (toolCounts[log.toolName] || 0) + 1;
    });

    const avgCalls = callHistory.length / Object.keys(toolCounts).length;
    Object.entries(toolCounts).forEach(([tool, count]) => {
      if (count > avgCalls * 3) { // 超过平均值3倍
        anomalies.push({
          type: 'high_frequency',
          tool,
          count,
          threshold: avgCalls * 3,
          severity: 'warning'
        });
      }
    });

    // 2. 检测连续失败
    let consecutiveFailures = 0;
    let maxConsecutiveFailures = 0;
    callHistory.forEach(log => {
      if (!log.success) {
        consecutiveFailures++;
        maxConsecutiveFailures = Math.max(maxConsecutiveFailures, consecutiveFailures);
      } else {
        consecutiveFailures = 0;
      }
    });

    if (maxConsecutiveFailures >= 3) {
      anomalies.push({
        type: 'consecutive_failures',
        count: maxConsecutiveFailures,
        threshold: 3,
        severity: 'error'
      });
    }

    // 3. 检测异常长调用时间
    const durations = callHistory.map(log => log.duration || 0).filter(d => d > 0);
    if (durations.length > 0) {
      const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
      const stdDev = Math.sqrt(durations.reduce((sum, d) => sum + Math.pow(d - avgDuration, 2), 0) / durations.length);
      
      callHistory.forEach(log => {
        if (log.duration && log.duration > avgDuration + 3 * stdDev) {
          anomalies.push({
            type: 'long_duration',
            tool: log.toolName,
            duration: log.duration,
            threshold: avgDuration + 3 * stdDev,
            severity: 'info'
          });
        }
      });
    }

    return anomalies;
  }

  /**
   * 生成行为摘要
   * @param {BehaviorLayer} behaviorData - 行为层数据
   * @returns {string} 行为摘要
   */
  generateSummary(behaviorData) {
    const parts = [];

    // 总调用次数
    parts.push(`总调用次数: ${behaviorData.totalCalls}`);

    // 错误率
    if (behaviorData.errorRate > 0) {
      parts.push(`错误率: ${(behaviorData.errorRate * 100).toFixed(1)}%`);
    }

    // 最常用工具
    const topTools = Object.entries(behaviorData.callFrequency)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([tool]) => tool);
    
    if (topTools.length > 0) {
      parts.push(`最常用工具: ${topTools.join(', ')}`);
    }

    // 主要模式
    if (behaviorData.sequencePatterns.length > 0) {
      parts.push(`主要模式: ${behaviorData.sequencePatterns[0].pattern}`);
    }

    return parts.join(' | ');
  }
}

// 导出单例
export const behaviorAnalyzer = new BehaviorAnalyzer();