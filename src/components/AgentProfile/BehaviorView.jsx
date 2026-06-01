import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon.jsx';

/**
 * 行为层可视化组件
 * 展示Agent行为模式分析结果
 */
export function BehaviorView({ behaviorData, className = '' }) {
  const [activeTab, setActiveTab] = useState('frequency');

  if (!behaviorData) {
    return (
      <div className={`behavior-view empty ${className}`}>
        <div className="empty-state">
          <Icon name="Activity" size={32} />
          <p>暂无行为数据</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const tabs = [
    { id: 'frequency', label: '调用频率', icon: 'BarChart' },
    { id: 'sequences', label: '调用序列', icon: 'ArrowRight' },
    { id: 'combinations', label: '工具组合', icon: 'Link' },
    { id: 'overview', label: '总览', icon: 'PieChart' }
  ];

  return (
    <div className={`behavior-view ${className}`}>
      {/* 标签页导航 */}
      <div className="tabs-nav">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <Icon name={tab.icon} size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 标签页内容 */}
      <div className="tab-content">
        {activeTab === 'frequency' && <FrequencyTab data={behaviorData} />}
        {activeTab === 'sequences' && <SequencesTab data={behaviorData} />}
        {activeTab === 'combinations' && <CombinationsTab data={behaviorData} />}
        {activeTab === 'overview' && <OverviewTab data={behaviorData} />}
      </div>

      <style>{styles}</style>
    </div>
  );
}

/**
 * 调用频率标签页
 */
function FrequencyTab({ data }) {
  const { callFrequency } = data;

  const sortedTools = useMemo(() => {
    return Object.entries(callFrequency)
      .sort(([, a], [, b]) => b.count - a.count);
  }, [callFrequency]);

  const maxCount = useMemo(() => {
    return Math.max(...sortedTools.map(([, d]) => d.count), 1);
  }, [sortedTools]);

  return (
    <div className="frequency-tab">
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{sortedTools.length}</span>
          <span className="stat-label">使用工具数</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{data.totalCalls}</span>
          <span className="stat-label">总调用次数</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{(data.errorRate * 100).toFixed(1)}%</span>
          <span className="stat-label">错误率</span>
        </div>
      </div>

      <div className="frequency-chart">
        <h4>工具调用频率分布</h4>
        <div className="chart-bars">
          {sortedTools.slice(0, 10).map(([tool, stats]) => (
            <div key={tool} className="bar-item">
              <div className="bar-label">
                <span className="tool-name">{tool}</span>
                <span className="call-count">{stats.count}次</span>
              </div>
              <div className="bar-container">
                <div
                  className="bar-fill"
                  style={{ width: `${(stats.count / maxCount) * 100}%` }}
                />
                {stats.failedCount > 0 && (
                  <div
                    className="bar-fill error"
                    style={{ width: `${(stats.failedCount / maxCount) * 100}%` }}
                  />
                )}
              </div>
              <div className="bar-details">
                <span className="success-rate">
                  成功率: {stats.count > 0 ? ((stats.successCount / stats.count) * 100).toFixed(0) : 0}%
                </span>
                <span className="avg-duration">
                  平均: {stats.averageDuration.toFixed(0)}ms
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 调用序列标签页
 */
function SequencesTab({ data }) {
  const { sequencePatterns } = data;

  return (
    <div className="sequences-tab">
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{sequencePatterns.length}</span>
          <span className="stat-label">发现模式数</span>
        </div>
      </div>

      {sequencePatterns.length > 0 ? (
        <div className="patterns-list">
          <h4>调用顺序模式</h4>
          {sequencePatterns.map((pattern, idx) => (
            <div key={idx} className="pattern-item">
              <div className="pattern-rank">#{idx + 1}</div>
              <div className="pattern-content">
                <div className="pattern-flow">
                  {pattern.pattern.split(' -> ').map((tool, i, arr) => (
                    <React.Fragment key={i}>
                      <span className="tool-badge">{tool}</span>
                      {i < arr.length - 1 && <Icon name="ArrowRight" size={12} />}
                    </React.Fragment>
                  ))}
                </div>
                <div className="pattern-stats">
                  <span className="count">出现 {pattern.count} 次</span>
                  <span className="success-rate">
                    成功率: {((pattern.successRate || 0) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-patterns">
          <Icon name="Info" size={24} />
          <p>暂无足够的调用数据来识别序列模式</p>
        </div>
      )}
    </div>
  );
}

/**
 * 工具组合标签页
 */
function CombinationsTab({ data }) {
  const { combinationPatterns } = data;

  return (
    <div className="combinations-tab">
      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{combinationPatterns.length}</span>
          <span className="stat-label">发现组合数</span>
        </div>
      </div>

      {combinationPatterns.length > 0 ? (
        <div className="combinations-list">
          <h4>工具组合模式</h4>
          {combinationPatterns.map((combo, idx) => (
            <div key={idx} className="combo-item">
              <div className="combo-rank">#{idx + 1}</div>
              <div className="combo-content">
                <div className="combo-tools">
                  {combo.tools.map(tool => (
                    <span key={tool} className="tool-badge">{tool}</span>
                  ))}
                </div>
                <div className="combo-stats">
                  <span className="count">出现 {combo.count} 次</span>
                  <span className="size">{combo.size || combo.tools.length} 个工具</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-combinations">
          <Icon name="Info" size={24} />
          <p>暂无足够的调用数据来识别工具组合</p>
        </div>
      )}
    </div>
  );
}

/**
 * 总览标签页
 */
function OverviewTab({ data }) {
  const topTools = useMemo(() => {
    return Object.entries(data.callFrequency)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 5);
  }, [data.callFrequency]);

  return (
    <div className="overview-tab">
      <div className="overview-grid">
        <div className="overview-card">
          <Icon name="Activity" size={24} />
          <div className="card-content">
            <span className="card-value">{data.totalCalls}</span>
            <span className="card-label">总调用次数</span>
          </div>
        </div>

        <div className="overview-card">
          <Icon name="Clock" size={24} />
          <div className="card-content">
            <span className="card-value">{(data.averageCallDuration || 0).toFixed(0)}ms</span>
            <span className="card-label">平均调用时长</span>
          </div>
        </div>

        <div className="overview-card">
          <Icon name="AlertTriangle" size={24} />
          <div className="card-content">
            <span className="card-value">{(data.errorRate * 100).toFixed(1)}%</span>
            <span className="card-label">错误率</span>
          </div>
        </div>

        <div className="overview-card">
          <Icon name="Tool" size={24} />
          <div className="card-content">
            <span className="card-value">{Object.keys(data.callFrequency).length}</span>
            <span className="card-label">使用工具数</span>
          </div>
        </div>
      </div>

      {topTools.length > 0 && (
        <div className="top-tools">
          <h4>最常用工具</h4>
          <div className="tools-list">
            {topTools.map(([tool, stats], idx) => (
              <div key={tool} className="tool-item">
                <span className="rank">#{idx + 1}</span>
                <span className="name">{tool}</span>
                <span className="count">{stats.count}次</span>
                <span className="percentage">
                  {data.totalCalls > 0 ? ((stats.count / data.totalCalls) * 100).toFixed(1) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.sequencePatterns.length > 0 && (
        <div className="top-patterns">
          <h4>主要调用模式</h4>
          <div className="patterns-summary">
            {data.sequencePatterns.slice(0, 3).map((pattern, idx) => (
              <div key={idx} className="pattern-summary">
                <Icon name="ArrowRight" size={12} />
                <span className="pattern-text">{pattern.pattern}</span>
                <span className="pattern-count">×{pattern.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 样式 ====================

const styles = `
  .behavior-view {
    font-family: var(--font-sans);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .behavior-view.empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }

  .empty-state {
    text-align: center;
    color: var(--color-text-tertiary);
  }

  .empty-state p {
    margin-top: 8px;
    font-size: 14px;
  }

  .tabs-nav {
    display: flex;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
  }

  .tab-button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: none;
    border: none;
    border-bottom: 2px solid transparent;
    cursor: pointer;
    font-size: 13px;
    color: var(--color-text-secondary);
    transition: all 0.2s;
  }

  .tab-button:hover {
    color: var(--color-text-primary);
    background: var(--color-bg-tertiary);
  }

  .tab-button.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
    background: var(--color-bg-primary);
  }

  .tab-content {
    padding: 16px;
  }

  .stats-row {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .stat-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    flex: 1;
  }

  .stat-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin-top: 4px;
  }

  h4 {
    margin: 0 0 12px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  /* 频率图表 */
  .frequency-chart {
    margin-top: 16px;
  }

  .chart-bars {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .bar-item {
    background: var(--color-bg-secondary);
    border-radius: 6px;
    padding: 10px;
  }

  .bar-label {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .tool-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .call-count {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .bar-container {
    height: 8px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    overflow: hidden;
    position: relative;
  }

  .bar-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 4px;
    transition: width 0.3s;
  }

  .bar-fill.error {
    position: absolute;
    top: 0;
    left: 0;
    background: var(--color-error);
    opacity: 0.6;
  }

  .bar-details {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  /* 模式列表 */
  .patterns-list, .combinations-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pattern-item, .combo-item {
    display: flex;
    gap: 12px;
    padding: 12px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
  }

  .pattern-rank, .combo-rank {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 600;
  }

  .pattern-content, .combo-content {
    flex: 1;
  }

  .pattern-flow {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 8px;
  }

  .tool-badge {
    display: inline-block;
    padding: 4px 8px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    font-size: 12px;
    font-family: monospace;
    color: var(--color-text-primary);
  }

  .pattern-stats, .combo-stats {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .combo-tools {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: 8px;
  }

  /* 空状态 */
  .empty-patterns, .empty-combinations {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px;
    color: var(--color-text-tertiary);
    text-align: center;
  }

  .empty-patterns p, .empty-combinations p {
    margin-top: 8px;
    font-size: 13px;
  }

  /* 总览 */
  .overview-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .overview-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    color: var(--color-primary);
  }

  .card-content {
    display: flex;
    flex-direction: column;
  }

  .card-value {
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .card-label {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .top-tools {
    margin-bottom: 20px;
  }

  .tools-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tool-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
  }

  .rank {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-primary);
    width: 24px;
  }

  .name {
    flex: 1;
    font-size: 13px;
    color: var(--color-text-primary);
  }

  .count {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .percentage {
    font-size: 12px;
    font-weight: 500;
    color: var(--color-primary);
    width: 50px;
    text-align: right;
  }

  .top-patterns {
    margin-top: 16px;
  }

  .patterns-summary {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .pattern-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    font-size: 12px;
  }

  .pattern-text {
    flex: 1;
    font-family: monospace;
    color: var(--color-text-primary);
  }

  .pattern-count {
    font-weight: 600;
    color: var(--color-primary);
  }
`;

export default BehaviorView;