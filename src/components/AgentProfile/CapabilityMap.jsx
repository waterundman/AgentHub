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
 * 能力地图组件
 * 展示能力雷达图、覆盖度、能力边界和缺口
 */
export function CapabilityMap({ capabilityData, className = '' }) {
  if (!capabilityData) {
    return (
      <div className={`capability-map empty ${className}`}>
        <div className="empty-state">
          <Icon name="Shield" size={32} />
          <p>暂无能力数据</p>
        </div>
        <style>{styles}</style>
      </div>
    );
  }

  const { coverage = {}, depth = {}, boundaries = [], gaps = [], overallScore = 0 } = capabilityData;

  const domains = useMemo(() => Object.keys(DOMAIN_LABELS), []);

  return (
    <div className={`capability-map ${className}`}>
      <div className="capability-header">
        <div className="score-badge">
          <span className="score-value">{(overallScore * 100).toFixed(0)}</span>
          <span className="score-label">综合评分</span>
        </div>
      </div>

      <div className="capability-body">
        {/* 雷达图 */}
        <div className="radar-section">
          <h4>能力雷达</h4>
          <RadarChart coverage={coverage} depth={depth} domains={domains} />
        </div>

        {/* 覆盖度概览 */}
        <div className="coverage-section">
          <h4>能力覆盖度</h4>
          <div className="coverage-grid">
            {domains.map(domain => (
              <CoverageItem
                key={domain}
                domain={domain}
                coverage={coverage[domain] || 0}
                depth={depth[domain] || 0}
              />
            ))}
          </div>
        </div>

        {/* 能力边界 */}
        {boundaries.length > 0 && (
          <div className="boundaries-section">
            <h4>
              <Icon name="AlertTriangle" size={14} />
              <span>能力边界</span>
            </h4>
            <div className="boundary-list">
              {boundaries.map((b, idx) => (
                <div key={idx} className={`boundary-item ${b.type}`}>
                  <div className="boundary-header">
                    <Icon name={DOMAIN_ICONS[b.domain] || 'Circle'} size={14} />
                    <span className="boundary-label">{b.label}</span>
                    <span className="boundary-type">
                      {b.type === 'low_coverage' ? '覆盖不足' : '深度不足'}
                    </span>
                  </div>
                  <p className="boundary-desc">{b.description}</p>
                  <div className="boundary-bars">
                    <MiniBar label="覆盖" value={b.coverage} />
                    <MiniBar label="深度" value={b.depth} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 能力缺口 */}
        {gaps.length > 0 && (
          <div className="gaps-section">
            <h4>
              <Icon name="XCircle" size={14} />
              <span>能力缺口</span>
            </h4>
            <div className="gap-list">
              {gaps.map((gap, idx) => (
                <div key={idx} className={`gap-item ${gap.severity}`}>
                  <div className="gap-header">
                    <Icon name={DOMAIN_ICONS[gap.domain] || 'Circle'} size={14} />
                    <span className="gap-label">{gap.label}</span>
                    <span className={`severity-badge ${gap.severity}`}>
                      {gap.severity === 'critical' ? '严重' : '警告'}
                    </span>
                  </div>
                  <p className="gap-recommendation">{gap.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{styles}</style>
    </div>
  );
}

/**
 * SVG雷达图组件
 */
function RadarChart({ coverage, depth, domains }) {
  const size = 220;
  const center = size / 2;
  const maxRadius = 80;
  const levels = 4;
  const angleStep = (2 * Math.PI) / domains.length;

  const getPoint = (domain, value, radiusScale = 1) => {
    const idx = domains.indexOf(domain);
    const angle = angleStep * idx - Math.PI / 2;
    const r = value * maxRadius * radiusScale;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const buildPath = (dataSource) => {
    const points = domains.map(d => getPoint(d, dataSource[d] || 0));
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  const gridLines = [];
  for (let i = 1; i <= levels; i++) {
    const r = (maxRadius / levels) * i;
    gridLines.push(
      <circle
        key={`grid-${i}`}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke="var(--color-border)"
        strokeWidth="1"
        strokeDasharray={i < levels ? '3,3' : 'none'}
        opacity={0.5}
      />
    );
  }

  const axisLines = domains.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const x2 = center + maxRadius * Math.cos(angle);
    const y2 = center + maxRadius * Math.sin(angle);
    return (
      <line
        key={`axis-${i}`}
        x1={center}
        y1={center}
        x2={x2}
        y2={y2}
        stroke="var(--color-border)"
        strokeWidth="1"
        opacity={0.3}
      />
    );
  });

  const labels = domains.map((d, i) => {
    const angle = angleStep * i - Math.PI / 2;
    const labelR = maxRadius + 18;
    const x = center + labelR * Math.cos(angle);
    const y = center + labelR * Math.sin(angle);
    return (
      <text
        key={`label-${i}`}
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill="var(--color-text-secondary)"
      >
        {DOMAIN_LABELS[d] || d}
      </text>
    );
  });

  return (
    <div className="radar-chart">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* 网格 */}
        {gridLines}
        {axisLines}

        {/* 深度层（底层） */}
        <path
          d={buildPath(depth)}
          fill="var(--color-info)"
          fillOpacity="0.15"
          stroke="var(--color-info)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />

        {/* 覆盖层（顶层） */}
        <path
          d={buildPath(coverage)}
          fill="var(--color-primary)"
          fillOpacity="0.25"
          stroke="var(--color-primary)"
          strokeWidth="2"
        />

        {/* 数据点 */}
        {domains.map((d, i) => {
          const covPoint = getPoint(d, coverage[d] || 0);
          const depPoint = getPoint(d, depth[d] || 0);
          return (
            <React.Fragment key={`points-${i}`}>
              <circle cx={covPoint.x} cy={covPoint.y} r="3" fill="var(--color-primary)" />
              <circle cx={depPoint.x} cy={depPoint.y} r="2.5" fill="var(--color-info)" />
            </React.Fragment>
          );
        })}
      </svg>

      <div className="radar-legend">
        <div className="legend-item">
          <span className="legend-dot primary" />
          <span>覆盖度</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot info" />
          <span>深度</span>
        </div>
      </div>
    </div>
  );
}

/**
 * 覆盖度单项
 */
function CoverageItem({ domain, coverage, depth }) {
  const covPercent = (coverage * 100).toFixed(0);
  const depPercent = (depth * 100).toFixed(0);
  const isActive = coverage > 0.05;

  return (
    <div className={`coverage-item ${isActive ? 'active' : 'inactive'}`}>
      <div className="coverage-icon">
        <Icon name={DOMAIN_ICONS[domain] || 'Circle'} size={16} />
      </div>
      <div className="coverage-info">
        <span className="coverage-name">{DOMAIN_LABELS[domain] || domain}</span>
        <div className="coverage-bars">
          <div className="bar-row">
            <span className="bar-label">C</span>
            <div className="bar-track">
              <div className="bar-fill coverage-bar" style={{ width: `${covPercent}%` }} />
            </div>
            <span className="bar-value">{covPercent}%</span>
          </div>
          <div className="bar-row">
            <span className="bar-label">D</span>
            <div className="bar-track">
              <div className="bar-fill depth-bar" style={{ width: `${depPercent}%` }} />
            </div>
            <span className="bar-value">{depPercent}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 迷你进度条
 */
function MiniBar({ label, value }) {
  return (
    <div className="mini-bar">
      <span className="mini-label">{label}</span>
      <div className="mini-track">
        <div
          className="mini-fill"
          style={{ width: `${(value * 100).toFixed(0)}%` }}
        />
      </div>
      <span className="mini-value">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}

// ==================== 样式 ====================

const styles = `
  .capability-map {
    font-family: var(--font-sans);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .capability-map.empty {
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

  .capability-header {
    display: flex;
    justify-content: center;
    padding: 20px 16px 12px;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
  }

  .score-badge {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--color-primary-bg);
    border: 3px solid var(--color-primary);
  }

  .score-value {
    font-size: 22px;
    font-weight: 700;
    color: var(--color-primary);
    line-height: 1;
  }

  .score-label {
    font-size: 10px;
    color: var(--color-text-tertiary);
    margin-top: 2px;
  }

  .capability-body {
    padding: 16px;
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

  /* 雷达图 */
  .radar-section {
    margin-bottom: 20px;
  }

  .radar-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .radar-legend {
    display: flex;
    gap: 16px;
    margin-top: 8px;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .legend-dot.primary {
    background: var(--color-primary);
  }

  .legend-dot.info {
    background: var(--color-info);
  }

  /* 覆盖度网格 */
  .coverage-section {
    margin-bottom: 20px;
  }

  .coverage-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .coverage-item {
    display: flex;
    gap: 8px;
    padding: 8px;
    background: var(--color-bg-secondary);
    border-radius: 6px;
    transition: background 0.2s;
  }

  .coverage-item.inactive {
    opacity: 0.5;
  }

  .coverage-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }

  .coverage-info {
    flex: 1;
    min-width: 0;
  }

  .coverage-name {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--color-text-primary);
    margin-bottom: 4px;
  }

  .coverage-bars {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .bar-label {
    font-size: 9px;
    color: var(--color-text-tertiary);
    width: 10px;
    text-align: right;
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

  .coverage-bar {
    background: var(--color-primary);
  }

  .depth-bar {
    background: var(--color-info);
  }

  .bar-value {
    font-size: 9px;
    color: var(--color-text-tertiary);
    width: 28px;
    text-align: right;
  }

  /* 能力边界 */
  .boundaries-section {
    margin-bottom: 20px;
  }

  .boundary-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .boundary-item {
    padding: 10px;
    background: var(--color-warning-bg);
    border-left: 3px solid var(--color-warning);
    border-radius: 0 6px 6px 0;
  }

  .boundary-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    color: var(--color-text-primary);
  }

  .boundary-label {
    font-size: 13px;
    font-weight: 500;
    flex: 1;
  }

  .boundary-type {
    font-size: 11px;
    padding: 2px 6px;
    background: var(--color-warning);
    color: white;
    border-radius: 10px;
  }

  .boundary-desc {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin: 4px 0 8px;
  }

  .boundary-bars {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .mini-bar {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .mini-label {
    font-size: 10px;
    color: var(--color-text-tertiary);
    width: 24px;
    text-align: right;
  }

  .mini-track {
    flex: 1;
    height: 4px;
    background: var(--color-bg-tertiary);
    border-radius: 2px;
    overflow: hidden;
  }

  .mini-fill {
    height: 100%;
    background: var(--color-warning);
    border-radius: 2px;
  }

  .mini-value {
    font-size: 10px;
    color: var(--color-text-tertiary);
    width: 30px;
    text-align: right;
  }

  /* 能力缺口 */
  .gaps-section {
    margin-bottom: 8px;
  }

  .gap-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .gap-item {
    padding: 10px;
    border-radius: 6px;
    border-left: 3px solid;
  }

  .gap-item.critical {
    background: var(--color-error-bg);
    border-color: var(--color-error);
  }

  .gap-item.warning {
    background: var(--color-warning-bg);
    border-color: var(--color-warning);
  }

  .gap-header {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    color: var(--color-text-primary);
  }

  .gap-label {
    font-size: 13px;
    font-weight: 500;
    flex: 1;
  }

  .severity-badge {
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 10px;
    color: white;
  }

  .severity-badge.critical {
    background: var(--color-error);
  }

  .severity-badge.warning {
    background: var(--color-warning);
  }

  .gap-recommendation {
    font-size: 12px;
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

export default CapabilityMap;
