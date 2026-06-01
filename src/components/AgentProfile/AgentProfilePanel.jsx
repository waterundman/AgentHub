import React, { useState, useCallback, useMemo } from 'react';
import { Icon } from '../Icon.jsx';

/**
 * Agent画像面板组件
 * 展示Agent五层画像，支持层级展开/折叠
 */
export function AgentProfilePanel({ profile, onCompare, className = '' }) {
  const [expandedLayers, setExpandedLayers] = useState({
    tool: true,
    skill: true,
    behavior: false,
    capability: false,
    specialization: false
  });

  const toggleLayer = useCallback((layer) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layer]: !prev[layer]
    }));
  }, []);

  const layers = useMemo(() => [
    {
      id: 'tool',
      title: '工具层',
      icon: 'Wrench',
      data: profile?.toolLayer,
      renderContent: renderToolLayer
    },
    {
      id: 'skill',
      title: 'Skill层',
      icon: 'Zap',
      data: profile?.skillLayer,
      renderContent: renderSkillLayer
    },
    {
      id: 'behavior',
      title: '行为层',
      icon: 'Activity',
      data: profile?.behaviorLayer,
      renderContent: renderBehaviorLayer
    },
    {
      id: 'capability',
      title: '能力层',
      icon: 'Shield',
      data: profile?.capabilityLayer,
      renderContent: renderCapabilityLayer
    },
    {
      id: 'specialization',
      title: '专业化层',
      icon: 'Target',
      data: profile?.specializationLayer,
      renderContent: renderSpecializationLayer
    }
  ], [profile]);

  if (!profile) {
    return (
      <div className={`agent-profile-panel empty ${className}`}>
        <div className="empty-state">
          <Icon name="User" size={48} />
          <p>暂无Agent画像数据</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  return (
    <div className={`agent-profile-panel ${className}`}>
      <div className="profile-header">
        <div className="agent-info">
          <Icon name="Hexagon" size={24} />
          <div>
            <h3>{profile.agentName}</h3>
            <span className="hash">{profile.agentHash}</span>
          </div>
        </div>
        <div className="timestamp">
          <Icon name="Clock" size={14} />
          <span>{new Date(profile.timestamp).toLocaleString()}</span>
        </div>
      </div>

      <div className="layers-container">
        {layers.map(layer => (
          <div key={layer.id} className="layer-section">
            <button
              className="layer-header"
              onClick={() => toggleLayer(layer.id)}
            >
              <div className="layer-title">
                <Icon name={layer.icon} size={18} />
                <span>{layer.title}</span>
              </div>
              <Icon 
                name={expandedLayers[layer.id] ? "ChevronUp" : "ChevronDown"} 
                size={16} 
              />
            </button>
            
            {expandedLayers[layer.id] && layer.data && (
              <div className="layer-content">
                {layer.renderContent(layer.data)}
              </div>
            )}
          </div>
        ))}
      </div>

      {onCompare && (
        <div className="actions">
          <button className="compare-btn" onClick={() => onCompare(profile)}>
            <Icon name="GitCompare" size={16} />
            <span>对比分析</span>
          </button>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

// ==================== 各层渲染函数 ====================

function renderToolLayer(data) {
  const categoryIcons = {
    read: 'FileText',
    write: 'FileEdit',
    execute: 'Terminal',
    network: 'Globe',
    system: 'Settings'
  };

  return (
    <div className="tool-layer">
      <div className="stats-row">
        <div className="stat">
          <span className="stat-value">{data.totalCount}</span>
          <span className="stat-label">总工具数</span>
        </div>
        <div className="stat">
          <span className="stat-value">{data.uniqueCount}</span>
          <span className="stat-label">唯一工具</span>
        </div>
      </div>

      <div className="categories">
        <h4>工具分类</h4>
        <div className="category-grid">
          {Object.entries(data.categories).map(([category, count]) => (
            <div key={category} className="category-item">
              <Icon name={categoryIcons[category] || 'Box'} size={16} />
              <span className="category-name">{category}</span>
              <span className="category-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="sources">
        <h4>工具来源</h4>
        <div className="source-bars">
          {Object.entries(data.sources).map(([source, count]) => (
            <div key={source} className="source-bar">
              <span className="source-label">{source}</span>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ width: `${(count / data.totalCount) * 100}%` }}
                />
              </div>
              <span className="source-count">{count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="tool-list">
        <h4>工具列表</h4>
        <div className="tools-grid">
          {data.tools.slice(0, 10).map(tool => (
            <div key={tool.name} className="tool-item">
              <Icon name={tool.category === 'network' ? 'Globe' : 'Tool'} size={14} />
              <span>{tool.displayName || tool.name}</span>
            </div>
          ))}
          {data.tools.length > 10 && (
            <div className="tool-item more">
              +{data.tools.length - 10} 更多
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function renderSkillLayer(data) {
  return (
    <div className="skill-layer">
      <div className="stats-row">
        <div className="stat">
          <span className="stat-value">{data.skills.length}</span>
          <span className="stat-label">技能数量</span>
        </div>
        <div className="stat">
          <span className="stat-value">{data.averageDepth.toFixed(1)}</span>
          <span className="stat-label">平均深度</span>
        </div>
        <div className="stat">
          <span className="stat-value">{data.maxDepth}</span>
          <span className="stat-label">最大深度</span>
        </div>
      </div>

      {data.topSkills.length > 0 && (
        <div className="top-skills">
          <h4>顶级技能</h4>
          <div className="skills-list">
            {data.topSkills.map(skill => (
              <div key={skill} className="skill-badge">
                <Icon name="Star" size={14} />
                <span>{skill}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="domains">
        <h4>领域分布</h4>
        <div className="domain-grid">
          {Object.entries(data.domains).map(([domain, count]) => (
            <div key={domain} className="domain-item">
              <span className="domain-name">{domain}</span>
              <span className="domain-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function renderBehaviorLayer(data) {
  return (
    <div className="behavior-layer">
      <div className="stats-row">
        <div className="stat">
          <span className="stat-value">{data.totalCalls}</span>
          <span className="stat-label">总调用次数</span>
        </div>
        <div className="stat">
          <span className="stat-value">{data.averageCallDuration.toFixed(0)}ms</span>
          <span className="stat-label">平均时长</span>
        </div>
      </div>

      {data.sequencePatterns.length > 0 && (
        <div className="patterns">
          <h4>顺序模式</h4>
          <div className="pattern-list">
            {data.sequencePatterns.map((pattern, idx) => (
              <div key={idx} className="pattern-item">
                <Icon name="ArrowRight" size={14} />
                <span className="pattern-text">{pattern.pattern}</span>
                <span className="pattern-count">×{pattern.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.combinationPatterns.length > 0 && (
        <div className="patterns">
          <h4>组合模式</h4>
          <div className="pattern-list">
            {data.combinationPatterns.map((pattern, idx) => (
              <div key={idx} className="pattern-item">
                <Icon name="Link" size={14} />
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

function renderCapabilityLayer(data) {
  const coverageLabels = {
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

  return (
    <div className="capability-layer">
      <div className="overall-score">
        <div className="score-circle">
          <span className="score-value">{(data.overallScore * 100).toFixed(0)}</span>
          <span className="score-label">综合评分</span>
        </div>
      </div>

      <div className="coverage">
        <h4>能力覆盖</h4>
        <div className="coverage-grid">
          {Object.entries(data.coverage).map(([cap, score]) => (
            <div key={cap} className={`coverage-item ${score > 0.05 ? 'active' : ''}`}>
              <Icon name={score > 0.05 ? 'CheckCircle' : 'Circle'} size={16} />
              <span>{coverageLabels[cap] || cap}</span>
              <span className="coverage-score">{(score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="depth">
        <h4>能力深度</h4>
        <div className="depth-bars">
          {Object.entries(data.depth).map(([key, value]) => (
            <div key={key} className="depth-bar">
              <span className="depth-label">{coverageLabels[key] || key}</span>
              <div className="bar-container">
                <div 
                  className="bar-fill"
                  style={{ width: `${value * 100}%` }}
                />
              </div>
              <span className="depth-value">{(value * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {data.boundaries && data.boundaries.length > 0 && (
        <div className="boundaries">
          <h4>能力边界</h4>
          <div className="boundary-list">
            {data.boundaries.map((b, idx) => (
              <div key={idx} className="boundary-item">
                <Icon name="AlertCircle" size={14} />
                <span>{typeof b === 'string' ? b : (b.label || b.domain || b)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.gaps && data.gaps.length > 0 && (
        <div className="gaps">
          <h4>能力缺口</h4>
          <div className="gap-list">
            {data.gaps.map((gap, idx) => (
              <div key={idx} className={`gap-item ${gap.severity || ''}`}>
                <Icon name={gap.severity === 'critical' ? 'XCircle' : 'AlertTriangle'} size={14} />
                <span>{gap.label || gap.domain}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderSpecializationLayer(data) {
  return (
    <div className="specialization-layer">
      <div className="specialization-index">
        <div className="index-bar">
          <div 
            className="index-fill"
            style={{ width: `${data.specializationIndex * 100}%` }}
          />
        </div>
        <span className="index-value">
          专业化指数: {(data.specializationIndex * 100).toFixed(0)}%
        </span>
      </div>

      {data.primaryFocus && (
        <div className="primary-focus">
          <Icon name="Focus" size={16} />
          <span>主要专注: {data.primaryFocus}</span>
        </div>
      )}

      {data.expertAreas.length > 0 && (
        <div className="expert-areas">
          <h4>擅长领域</h4>
          <div className="areas-list">
            {data.expertAreas.map(area => (
              <div key={area} className="area-badge">
                <Icon name="Award" size={14} />
                <span>{area}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.uniqueCapabilities.length > 0 && (
        <div className="unique-capabilities">
          <h4>独特能力</h4>
          <div className="capabilities-list">
            {data.uniqueCapabilities.map(capability => (
              <div key={capability} className="capability-badge">
                <Icon name="Sparkles" size={14} />
                <span>{capability}</span>
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
  .agent-profile-panel {
    font-family: var(--font-sans);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 16px;
    max-width: 600px;
  }

  .agent-profile-panel.empty {
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

  .profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-border);
  }

  .agent-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .agent-info h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .agent-info .hash {
    font-size: 12px;
    color: var(--color-text-tertiary);
    font-family: monospace;
  }

  .timestamp {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--color-text-tertiary);
  }

  .layers-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .layer-section {
    border: 1px solid var(--color-border);
    border-radius: 6px;
    overflow: hidden;
  }

  .layer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 12px;
    background: var(--color-bg-secondary);
    border: none;
    cursor: pointer;
    transition: background 0.2s;
  }

  .layer-header:hover {
    background: var(--color-bg-tertiary);
  }

  .layer-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .layer-content {
    padding: 12px;
    background: var(--color-bg-primary);
  }

  .stats-row {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 12px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    flex: 1;
  }

  .stat-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .stat-label {
    font-size: 12px;
    color: var(--color-text-tertiary);
    margin-top: 4px;
  }

  h4 {
    margin: 12px 0 8px;
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 8px;
  }

  .category-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    font-size: 12px;
  }

  .category-name {
    flex: 1;
    color: var(--color-text-primary);
  }

  .category-count {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .source-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .source-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .source-label {
    width: 60px;
    color: var(--color-text-secondary);
  }

  .bar-container {
    flex: 1;
    height: 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    background: var(--color-primary);
    border-radius: 4px;
    transition: width 0.3s;
  }

  .source-count {
    width: 30px;
    text-align: right;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 6px;
  }

  .tool-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    font-size: 12px;
    color: var(--color-text-primary);
  }

  .tool-item.more {
    color: var(--color-text-tertiary);
    font-style: italic;
  }

  .skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .skill-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    border-radius: 12px;
    font-size: 12px;
  }

  .domain-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 6px;
  }

  .domain-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    font-size: 12px;
  }

  .domain-name {
    color: var(--color-text-primary);
  }

  .domain-count {
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .pattern-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .pattern-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    font-size: 12px;
  }

  .pattern-text {
    flex: 1;
    color: var(--color-text-primary);
    font-family: monospace;
  }

  .pattern-count {
    font-weight: 600;
    color: var(--color-primary);
  }

  .overall-score {
    display: flex;
    justify-content: center;
    margin-bottom: 16px;
  }

  .score-circle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--color-primary-bg);
    border: 3px solid var(--color-primary);
  }

  .score-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-primary);
  }

  .score-label {
    font-size: 10px;
    color: var(--color-text-tertiary);
  }

  .coverage-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 6px;
  }

  .coverage-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    font-size: 12px;
    color: var(--color-text-tertiary);
  }

  .coverage-item.active {
    color: var(--color-success);
    background: var(--color-success-bg);
  }

  .coverage-score {
    margin-left: auto;
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  .depth-bars {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .depth-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
  }

  .depth-label {
    width: 60px;
    color: var(--color-text-secondary);
  }

  .depth-value {
    width: 40px;
    text-align: right;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .boundary-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .boundary-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--color-warning-bg);
    color: var(--color-warning);
    border-radius: 12px;
    font-size: 12px;
  }

  .gap-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .gap-item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
  }

  .gap-item.critical {
    background: var(--color-error-bg);
    color: var(--color-error);
  }

  .gap-item.warning {
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }

  .specialization-index {
    margin-bottom: 12px;
  }

  .index-bar {
    height: 8px;
    background: var(--color-bg-secondary);
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 4px;
  }

  .index-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), var(--color-success));
    border-radius: 4px;
    transition: width 0.3s;
  }

  .index-value {
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  .primary-focus {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--color-primary-bg);
    color: var(--color-primary);
    border-radius: 4px;
    font-size: 13px;
    font-weight: 500;
    margin-bottom: 12px;
  }

  .areas-list, .capabilities-list {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .area-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--color-success-bg);
    color: var(--color-success);
    border-radius: 12px;
    font-size: 12px;
  }

  .capability-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--color-info-bg);
    color: var(--color-info);
    border-radius: 12px;
    font-size: 12px;
  }

  .actions {
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--color-border);
    display: flex;
    justify-content: flex-end;
  }

  .compare-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 13px;
    transition: background 0.2s;
  }

  .compare-btn:hover {
    background: var(--color-primary-hover);
  }
`;

export default AgentProfilePanel;
