import React, { useMemo } from 'react';
import { Icon } from '../Icon.jsx';

const DOMAIN_LABELS = {
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

const DOMAIN_ICONS = {
  coding: 'Terminal',
  data: 'Database',
  writing: 'FileText',
  research: 'Search',
  analysis: 'BarChart',
  design: 'Palette',
  communication: 'MessageCircle',
  automation: 'Zap',
  integration: 'Link',
  monitoring: 'Activity'
};

/**
 * SpecializationView组件
 * 展示Agent专业化层数据：专业化指数、擅长领域、独特能力
 */
export function SpecializationView({ specializationData, comparisonData, className = '' }) {
  if (!specializationData) {
    return (
      <div className={`specialization-view empty ${className}`}>
        <div className="empty-state">
          <Icon name="Target" size={32} />
          <p>暂无专业化数据</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const {
    specializationIndex = 0,
    expertAreas = [],
    uniqueCapabilities = [],
    primaryFocus = ''
  } = specializationData;

  const specializationLevel = useMemo(() => {
    if (specializationIndex >= 0.8) return { label: '极度专业', color: 'var(--color-error)' };
    if (specializationIndex >= 0.6) return { label: '高度专业', color: 'var(--color-warning)' };
    if (specializationIndex >= 0.4) return { label: '中等专业', color: 'var(--color-primary)' };
    if (specializationIndex >= 0.2) return { label: '较为通用', color: 'var(--color-info)' };
    return { label: '完全通用', color: 'var(--color-success)' };
  }, [specializationIndex]);

  return (
    <div className={`specialization-view ${className}`}>
      {/* 专业化指数 */}
      <div className="index-section">
        <div className="index-header">
          <h4>
            <Icon name="Target" size={16} />
            <span>专业化指数</span>
          </h4>
          <span className="level-badge" style={{ background: specializationLevel.color }}>
            {specializationLevel.label}
          </span>
        </div>
        <div className="index-visual">
          <div className="gauge-container">
            <Gauge value={specializationIndex} color={specializationLevel.color} />
          </div>
          <div className="index-info">
            <div className="index-value">{(specializationIndex * 100).toFixed(1)}%</div>
            <div className="index-description">
              {specializationIndex >= 0.5 
                ? '专注于特定领域，具有深度专业知识' 
                : '能力分布广泛，适用于多种场景'}
            </div>
          </div>
        </div>
      </div>

      {/* 主要专注点 */}
      {primaryFocus && (
        <div className="focus-section">
          <div className="focus-card">
            <Icon name="Crosshair" size={20} />
            <div>
              <div className="focus-label">主要专注</div>
              <div className="focus-value">{primaryFocus}</div>
            </div>
          </div>
        </div>
      )}

      {/* 擅长领域排名 */}
      {expertAreas.length > 0 && (
        <div className="domains-section">
          <h4>
            <Icon name="Award" size={16} />
            <span>擅长领域 TOP {expertAreas.length}</span>
          </h4>
          <div className="domain-ranking">
            {expertAreas.map((area, idx) => (
              <DomainRankItem
                key={area.domain || area}
                rank={idx + 1}
                domain={area.domain || area}
                label={area.label || DOMAIN_LABELS[area.domain] || area}
                score={area.score || 0}
                coverage={area.coverage || 0}
                depth={area.depth || 0}
              />
            ))}
          </div>
        </div>
      )}

      {/* 独特能力 */}
      {uniqueCapabilities.length > 0 && (
        <div className="capabilities-section">
          <h4>
            <Icon name="Sparkles" size={16} />
            <span>独特能力</span>
          </h4>
          <div className="capabilities-list">
            {uniqueCapabilities.map((capability, idx) => (
              <div key={idx} className="capability-item">
                <Icon name="Zap" size={14} />
                <span>{capability}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 对比数据 */}
      {comparisonData && (
        <div className="comparison-section">
          <h4>
            <Icon name="GitCompare" size={16} />
            <span>与同类Agent对比</span>
          </h4>
          <ComparisonView data={comparisonData} />
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

/**
 * 仪表盘组件
 */
function Gauge({ value, color }) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const progress = value * circumference;
  const rotation = -90;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140">
      {/* 背景圆 */}
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke="var(--color-bg-tertiary)"
        strokeWidth="12"
      />
      {/* 进度圆 */}
      <circle
        cx="70"
        cy="70"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference - progress}
        transform={`rotate(${rotation} 70 70)`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
      {/* 中心文字 */}
      <text
        x="70"
        y="65"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="700"
        fill="var(--color-text-primary)"
      >
        {(value * 100).toFixed(0)}
      </text>
      <text
        x="70"
        y="85"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fill="var(--color-text-tertiary)"
      >
        分
      </text>
    </svg>
  );
}

/**
 * 领域排名项
 */
function DomainRankItem({ rank, domain, label, score, coverage, depth }) {
  const icon = DOMAIN_ICONS[domain] || 'Circle';
  const scorePercent = (score * 100).toFixed(0);
  const covPercent = (coverage * 100).toFixed(0);
  const depPercent = (depth * 100).toFixed(0);

  return (
    <div className="domain-rank-item">
      <div className="rank-badge">{rank}</div>
      <div className="rank-icon">
        <Icon name={icon} size={18} />
      </div>
      <div className="rank-info">
        <div className="rank-header">
          <span className="rank-label">{label}</span>
          <span className="rank-score">{scorePercent}分</span>
        </div>
        <div className="rank-bars">
          <div className="bar-item">
            <span className="bar-label">覆盖</span>
            <div className="bar-track">
              <div className="bar-fill coverage" style={{ width: `${covPercent}%` }} />
            </div>
            <span className="bar-value">{covPercent}%</span>
          </div>
          <div className="bar-item">
            <span className="bar-label">深度</span>
            <div className="bar-track">
              <div className="bar-fill depth" style={{ width: `${depPercent}%` }} />
            </div>
            <span className="bar-value">{depPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 对比视图组件
 */
function ComparisonView({ data }) {
  const {
    indexDiff = 0,
    commonDomains = [],
    uniqueToAgent1 = [],
    uniqueToAgent2 = [],
    similarity = 0
  } = data;

  const diffLabel = indexDiff > 0 ? '更高' : indexDiff < 0 ? '更低' : '相同';
  const diffColor = indexDiff > 0 
    ? 'var(--color-success)' 
    : indexDiff < 0 
      ? 'var(--color-error)' 
      : 'var(--color-text-secondary)';

  return (
    <div className="comparison-view">
      <div className="comparison-stats">
        <div className="comp-stat">
          <div className="comp-stat-value" style={{ color: diffColor }}>
            {indexDiff > 0 ? '+' : ''}{(indexDiff * 100).toFixed(1)}%
          </div>
          <div className="comp-stat-label">专业化指数差异</div>
        </div>
        <div className="comp-stat">
          <div className="comp-stat-value">{(similarity * 100).toFixed(0)}%</div>
          <div className="comp-stat-label">领域相似度</div>
        </div>
        <div className="comp-stat">
          <div className="comp-stat-value">{commonDomains.length}</div>
          <div className="comp-stat-label">共同领域</div>
        </div>
      </div>

      {commonDomains.length > 0 && (
        <div className="comp-domains">
          <div className="comp-label">共同擅长领域</div>
          <div className="comp-tags">
            {commonDomains.map(d => (
              <span key={d} className="comp-tag common">
                <Icon name={DOMAIN_ICONS[d] || 'Circle'} size={12} />
                {DOMAIN_LABELS[d] || d}
              </span>
            ))}
          </div>
        </div>
      )}

      {uniqueToAgent1.length > 0 && (
        <div className="comp-domains">
          <div className="comp-label">仅当前Agent</div>
          <div className="comp-tags">
            {uniqueToAgent1.map(d => (
              <span key={d} className="comp-tag unique">
                <Icon name={DOMAIN_ICONS[d] || 'Circle'} size={12} />
                {DOMAIN_LABELS[d] || d}
              </span>
            ))}
          </div>
        </div>
      )}

      {uniqueToAgent2.length > 0 && (
        <div className="comp-domains">
          <div className="comp-label">仅对比Agent</div>
          <div className="comp-tags">
            {uniqueToAgent2.map(d => (
              <span key={d} className="comp-tag other">
                <Icon name={DOMAIN_ICONS[d] || 'Circle'} size={12} />
                {DOMAIN_LABELS[d] || d}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== 样式 ====================

const styles = `
  .specialization-view {
    font-family: var(--font-sans);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .specialization-view.empty {
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

  h4 {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  /* 专业化指数 */
  .index-section {
    padding: 20px;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .index-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .level-badge {
    font-size: 11px;
    font-weight: 600;
    color: white;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .index-visual {
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .gauge-container {
    flex-shrink: 0;
  }

  .index-info {
    flex: 1;
  }

  .index-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text-primary);
    line-height: 1;
    margin-bottom: 8px;
  }

  .index-description {
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.4;
  }

  /* 主要专注点 */
  .focus-section {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .focus-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--color-primary-bg);
    border-radius: 6px;
    color: var(--color-primary);
  }

  .focus-label {
    font-size: 11px;
    opacity: 0.8;
  }

  .focus-value {
    font-size: 16px;
    font-weight: 600;
  }

  /* 擅长领域 */
  .domains-section {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .domain-ranking {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .domain-rank-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    transition: background 0.2s;
  }

  .domain-rank-item:hover {
    background: var(--color-bg-tertiary);
  }

  .rank-badge {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--color-primary);
    color: white;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .rank-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .rank-info {
    flex: 1;
    min-width: 0;
  }

  .rank-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;
  }

  .rank-label {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-primary);
  }

  .rank-score {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-primary);
  }

  .rank-bars {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .bar-item {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .bar-label {
    font-size: 10px;
    color: var(--color-text-tertiary);
    width: 28px;
  }

  .bar-track {
    flex: 1;
    height: 4px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }

  .bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s;
  }

  .bar-fill.coverage {
    background: var(--color-primary);
  }

  .bar-fill.depth {
    background: var(--color-info);
  }

  .bar-value {
    font-size: 10px;
    color: var(--color-text-tertiary);
    width: 32px;
    text-align: right;
  }

  /* 独特能力 */
  .capabilities-section {
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
  }

  .capabilities-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .capability-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: var(--color-info-bg);
    color: var(--color-info);
    border-radius: 16px;
    font-size: 12px;
    font-weight: 500;
  }

  /* 对比 */
  .comparison-section {
    padding: 16px 20px;
  }

  .comparison-view {
    background: var(--color-bg-secondary);
    border-radius: 6px;
    padding: 12px;
  }

  .comparison-stats {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
  }

  .comp-stat {
    flex: 1;
    text-align: center;
  }

  .comp-stat-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--color-text-primary);
  }

  .comp-stat-label {
    font-size: 10px;
    color: var(--color-text-tertiary);
    margin-top: 2px;
  }

  .comp-domains {
    margin-top: 10px;
  }

  .comp-label {
    font-size: 11px;
    color: var(--color-text-tertiary);
    margin-bottom: 6px;
  }

  .comp-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .comp-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
  }

  .comp-tag.common {
    background: var(--color-success-bg);
    color: var(--color-success);
  }

  .comp-tag.unique {
    background: var(--color-primary-bg);
    color: var(--color-primary);
  }

  .comp-tag.other {
    background: var(--color-warning-bg);
    color: var(--color-warning);
  }
`;

export default SpecializationView;