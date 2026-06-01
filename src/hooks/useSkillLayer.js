import { useState, useEffect, useCallback } from 'react';
import { skillLayerCollector } from '../services/profiler/layers/SkillLayerCollector.js';

/**
 * Skill层数据采集Hook
 * @param {string} agentHash - Agent哈希值
 * @param {Object} agentData - Agent配置数据
 * @param {Object} options - 配置选项
 * @returns {Object} Skill层数据和状态
 */
export function useSkillLayer(agentHash, agentData = {}, options = {}) {
  const { autoRefresh = false, refreshInterval = 30000 } = options;

  const [state, setState] = useState({
    skills: [],
    domains: {},
    levels: { basic: 0, intermediate: 0, advanced: 0 },
    total: 0,
    loading: true,
    error: null
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const collectData = useCallback(async () => {
    if (!agentHash) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Agent hash is required'
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const layer = await skillLayerCollector.collect(agentHash, agentData);

      // 计算技能等级分布
      const levels = layer.skills.reduce(
        (acc, skill) => {
          if (skill.depth <= 2) acc.basic++;
          else if (skill.depth <= 3) acc.intermediate++;
          else acc.advanced++;
          return acc;
        },
        { basic: 0, intermediate: 0, advanced: 0 }
      );

      setState({
        skills: layer.skills,
        domains: layer.domains,
        levels,
        total: layer.skills.length,
        loading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to collect skill layer data'
      }));
    }
  }, [agentHash, agentData]);

  // 自动刷新
  useEffect(() => {
    collectData();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(() => {
        setRefreshKey(prev => prev + 1);
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [collectData, autoRefresh, refreshInterval, refreshKey]);

  const refresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return {
    ...state,
    refresh
  };
}