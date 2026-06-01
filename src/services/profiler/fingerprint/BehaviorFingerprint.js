/**
 * 行为指纹生成器
 * 生成和对比Agent行为指纹向量
 */

export class BehaviorFingerprint {
  constructor() {
    this.vectorSize = 32; // 指纹向量维度
  }

  /**
   * 生成行为指纹向量
   * @param {BehaviorLayer} behavior - 行为层数据
   * @returns {Object} 行为指纹
   */
  generate(behavior) {
    const vector = new Array(this.vectorSize).fill(0);

    // 1. 编码调用频率分布 (维度 0-7)
    this._encodeFrequencyDistribution(behavior.callFrequency, vector);

    // 2. 编码序列模式 (维度 8-15)
    this._encodeSequencePatterns(behavior.sequencePatterns, vector);

    // 3. 编码组合模式 (维度 16-23)
    this._encodeCombinationPatterns(behavior.combinationPatterns, vector);

    // 4. 编码错误率和调用统计 (维度 24-31)
    this._encodeStatistics(behavior, vector);

    // 归一化向量
    const normalizedVector = this._normalizeVector(vector);

    return {
      vector: normalizedVector,
      hash: this._computeHash(normalizedVector),
      metadata: {
        totalCalls: behavior.totalCalls,
        errorRate: behavior.errorRate,
        uniqueTools: Object.keys(behavior.callFrequency).length,
        timestamp: Date.now()
      }
    };
  }

  /**
   * 对比两个指纹
   * @param {Object} fp1 - 指纹1
   * @param {Object} fp2 - 指纹2
   * @returns {Object} 对比结果
   */
  compare(fp1, fp2) {
    if (!fp1 || !fp2 || !fp1.vector || !fp2.vector) {
      return { similarity: 0, distance: 1, details: {} };
    }

    // 计算余弦相似度
    const cosineSimilarity = this._cosineSimilarity(fp1.vector, fp2.vector);

    // 计算欧氏距离
    const euclideanDistance = this._euclideanDistance(fp1.vector, fp2.vector);

    // 计算各维度相似度
    const details = {
      frequencySimilarity: this._compareDimensions(fp1.vector, fp2.vector, 0, 8),
      sequenceSimilarity: this._compareDimensions(fp1.vector, fp2.vector, 8, 16),
      combinationSimilarity: this._compareDimensions(fp1.vector, fp2.vector, 16, 24),
      statisticsSimilarity: this._compareDimensions(fp1.vector, fp2.vector, 24, 32)
    };

    // 计算综合相似度（加权平均）
    const similarity = (
      details.frequencySimilarity * 0.3 +
      details.sequenceSimilarity * 0.3 +
      details.combinationSimilarity * 0.2 +
      details.statisticsSimilarity * 0.2
    );

    return {
      similarity,
      distance: 1 - similarity,
      cosineSimilarity,
      euclideanDistance,
      details
    };
  }

  /**
   * 查找相似Agent
   * @param {string} agentHash - Agent哈希值
   * @param {Map} fingerprintStore - 指纹存储
   * @param {number} threshold - 相似度阈值
   * @returns {Array} 相似Agent列表
   */
  findSimilar(agentHash, fingerprintStore, threshold = 0.7) {
    const targetFp = fingerprintStore.get(agentHash);
    if (!targetFp) {
      return [];
    }

    const similarAgents = [];

    fingerprintStore.forEach((fp, hash) => {
      if (hash === agentHash) return;

      const comparison = this.compare(targetFp, fp);
      if (comparison.similarity >= threshold) {
        similarAgents.push({
          agentHash: hash,
          similarity: comparison.similarity,
          details: comparison.details
        });
      }
    });

    // 按相似度排序
    return similarAgents.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * 编码调用频率分布
   */
  _encodeFrequencyDistribution(callFrequency, vector) {
    const tools = Object.entries(callFrequency);
    if (tools.length === 0) return;

    // 计算频率统计
    const frequencies = tools.map(([, data]) => data.frequency || 0);
    const counts = tools.map(([, data]) => data.count || 0);

    // 维度 0-1: 频率均值和标准差
    vector[0] = this._mean(frequencies);
    vector[1] = this._stdDev(frequencies);

    // 维度 2-3: 调用次数均值和标准差
    vector[2] = this._mean(counts) / 100; // 归一化
    vector[3] = this._stdDev(counts) / 100;

    // 维度 4-5: 最大和最小频率
    vector[4] = Math.max(...frequencies);
    vector[5] = Math.min(...frequencies);

    // 维度 6: 频率熵（衡量分布均匀程度）
    const totalFreq = frequencies.reduce((a, b) => a + b, 0);
    if (totalFreq > 0) {
      const entropy = -frequencies.reduce((sum, f) => {
        if (f === 0) return sum;
        const p = f / totalFreq;
        return sum + p * Math.log2(p);
      }, 0);
      vector[6] = entropy / Math.log2(frequencies.length || 1); // 归一化熵
    }

    // 维度 7: 工具数量（归一化）
    vector[7] = Math.min(tools.length / 20, 1); // 假设最多20个工具
  }

  /**
   * 编码序列模式
   */
  _encodeSequencePatterns(sequencePatterns, vector) {
    if (sequencePatterns.length === 0) return;

    // 维度 8-9: 模式数量和平均出现次数
    vector[8] = Math.min(sequencePatterns.length / 10, 1);
    vector[9] = this._mean(sequencePatterns.map(p => p.count)) / 10;

    // 维度 10-11: 最频繁模式的出现次数和成功率
    const topPattern = sequencePatterns[0];
    vector[10] = Math.min(topPattern.count / 50, 1);
    vector[11] = topPattern.successRate || 0;

    // 维度 12-13: 模式多样性（不同模式数量 vs 总模式数）
    const uniquePatterns = new Set(sequencePatterns.map(p => p.pattern.split(' -> ').length));
    vector[12] = uniquePatterns.size / 3; // 假设最多3种长度
    vector[13] = sequencePatterns.length / 20;

    // 维度 14-15: 模式长度分布
    const patternLengths = sequencePatterns.map(p => p.pattern.split(' -> ').length);
    vector[14] = this._mean(patternLengths) / 3; // 归一化到0-1
    vector[15] = this._stdDev(patternLengths) / 3;
  }

  /**
   * 编码组合模式
   */
  _encodeCombinationPatterns(combinationPatterns, vector) {
    if (combinationPatterns.length === 0) return;

    // 维度 16-17: 组合数量和平均出现次数
    vector[16] = Math.min(combinationPatterns.length / 10, 1);
    vector[17] = this._mean(combinationPatterns.map(p => p.count)) / 10;

    // 维度 18-19: 最频繁组合的出现次数和大小
    const topCombo = combinationPatterns[0];
    vector[18] = Math.min(topCombo.count / 50, 1);
    vector[19] = (topCombo.size || 2) / 5; // 假设最多5个工具组合

    // 维度 20-21: 组合大小分布
    const comboSizes = combinationPatterns.map(p => p.size || 2);
    vector[20] = this._mean(comboSizes) / 5;
    vector[21] = this._stdDev(comboSizes) / 5;

    // 维度 22-23: 组合多样性
    const uniqueToolsInCombos = new Set();
    combinationPatterns.forEach(p => {
      if (p.tools) {
        p.tools.forEach(t => uniqueToolsInCombos.add(t));
      }
    });
    vector[22] = Math.min(uniqueToolsInCombos.size / 20, 1);
    vector[23] = combinationPatterns.length / 20;
  }

  /**
   * 编码统计信息
   */
  _encodeStatistics(behavior, vector) {
    // 维度 24: 总调用次数（归一化）
    vector[24] = Math.min(behavior.totalCalls / 1000, 1);

    // 维度 25: 错误率
    vector[25] = behavior.errorRate || 0;

    // 维度 26: 平均调用时长（归一化，假设最大10秒）
    vector[26] = Math.min((behavior.averageCallDuration || 0) / 10000, 1);

    // 维度 27: 工具多样性（唯一工具数 / 总调用数）
    const uniqueTools = Object.keys(behavior.callFrequency).length;
    vector[27] = behavior.totalCalls > 0 ? uniqueTools / behavior.totalCalls : 0;

    // 维度 28-31: 保留用于未来扩展
    vector[28] = 0;
    vector[29] = 0;
    vector[30] = 0;
    vector[31] = 0;
  }

  /**
   * 计算均值
   */
  _mean(values) {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /**
   * 计算标准差
   */
  _stdDev(values) {
    if (values.length === 0) return 0;
    const mean = this._mean(values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  /**
   * 归一化向量
   */
  _normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map(v => v / magnitude);
  }

  /**
   * 计算向量哈希
   */
  _computeHash(vector) {
    // 将向量转换为字符串并计算简单哈希
    const str = vector.map(v => v.toFixed(4)).join(',');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 计算余弦相似度
   */
  _cosineSimilarity(vec1, vec2) {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 计算欧氏距离
   */
  _euclideanDistance(vec1, vec2) {
    if (vec1.length !== vec2.length) return 1;

    let sum = 0;
    for (let i = 0; i < vec1.length; i++) {
      sum += Math.pow(vec1[i] - vec2[i], 2);
    }

    return Math.sqrt(sum);
  }

  /**
   * 对比指定维度范围
   */
  _compareDimensions(vec1, vec2, start, end) {
    const subVec1 = vec1.slice(start, end);
    const subVec2 = vec2.slice(start, end);
    return this._cosineSimilarity(subVec1, subVec2);
  }
}

// 导出单例
export const behaviorFingerprint = new BehaviorFingerprint();