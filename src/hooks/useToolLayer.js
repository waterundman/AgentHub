import { useState, useEffect, useCallback, useRef } from 'react';
import { toolLayerCollector } from '../services/profiler/layers/ToolLayerCollector.js';

/**
 * Tool层数据采集Hook
 * @param {string} agentHash - Agent哈希值
 * @param {Object} agentData - Agent配置数据
 * @param {Object} options - 配置选项
 * @param {boolean} options.autoRefresh - 是否自动刷新
 * @param {number} options.refreshInterval - 刷新间隔（毫秒）
 * @returns {Object} Tool层数据
 */
export function useToolLayer(agentHash, agentData = {}, options = {}) {
  const { 
    autoRefresh = false, 
    refreshInterval = 30000 
  } = options;
  
  const [data, setData] = useState({
    tools: [],
    categories: {},
    sources: { builtin: 0, plugin: 0, custom: 0 },
    totalCount: 0,
    uniqueCount: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);
  const agentHashRef = useRef(agentHash);
  const agentDataRef = useRef(agentData);
  
  // 更新ref
  agentHashRef.current = agentHash;
  agentDataRef.current = agentData;
  
  const collectToolLayer = useCallback(async () => {
    if (!agentHash) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const toolLayer = await toolLayerCollector.collect(
        agentHashRef.current, 
        agentDataRef.current
      );
      
      if (mountedRef.current) {
        setData(toolLayer);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err.message || 'Failed to collect tool layer data');
        console.error('useToolLayer error:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);
  
  // 初始加载和agentHash变化时重新采集
  useEffect(() => {
    collectToolLayer();
  }, [agentHash, collectToolLayer]);
  
  // 自动刷新
  useEffect(() => {
    if (!autoRefresh || !agentHash) {
      return;
    }
    
    const interval = setInterval(collectToolLayer, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, agentHash, collectToolLayer]);
  
  // 清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);
  
  // 手动刷新
  const refresh = useCallback(() => {
    return collectToolLayer();
  }, [collectToolLayer]);
  
  // 获取指定分类的工具
  const getToolsByCategory = useCallback((category) => {
    return data.tools.filter(tool => tool.category === category);
  }, [data.tools]);
  
  // 获取指定来源的工具
  const getToolsBySource = useCallback((source) => {
    return data.tools.filter(tool => tool.source === source);
  }, [data.tools]);
  
  // 获取工具详情
  const getToolDetails = useCallback((toolName) => {
    return data.tools.find(tool => tool.name === toolName) || null;
  }, [data.tools]);
  
  // 获取调用统计最高的工具
  const getMostUsedTools = useCallback((limit = 5) => {
    return [...data.tools]
      .filter(tool => tool.stats && tool.stats.total > 0)
      .sort((a, b) => (b.stats?.total || 0) - (a.stats?.total || 0))
      .slice(0, limit);
  }, [data.tools]);
  
  // 获取成功率
  const getSuccessRate = useCallback((toolName) => {
    const tool = data.tools.find(t => t.name === toolName);
    if (!tool || !tool.stats || tool.stats.total === 0) {
      return 0;
    }
    return tool.stats.success / tool.stats.total;
  }, [data.tools]);
  
  return {
    // 数据
    tools: data.tools,
    categories: data.categories,
    sources: data.sources,
    totalCount: data.totalCount,
    uniqueCount: data.uniqueCount,
    
    // 状态
    loading,
    error,
    
    // 方法
    refresh,
    getToolsByCategory,
    getToolsBySource,
    getToolDetails,
    getMostUsedTools,
    getSuccessRate
  };
}