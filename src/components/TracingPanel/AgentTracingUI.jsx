import React, { useState, useMemo, useCallback } from 'react';

const COLORS = {
  purple: { fill: '#EEEDFE', stroke: '#7F77DD', text: '#3C3489', mid: '#534AB7' },
  teal:   { fill: '#E1F5EE', stroke: '#1D9E75', text: '#085041', mid: '#0F6E56' },
  coral:  { fill: '#FAECE7', stroke: '#D85A30', text: '#4A1B0C', mid: '#993C1D' },
  blue:   { fill: '#E6F1FB', stroke: '#378ADD', text: '#042C53', mid: '#185FA5' },
  amber:  { fill: '#FAEEDA', stroke: '#BA7517', text: '#412402', mid: '#854F0B' },
};

const STATUS_COLORS = {
  running: { bg: '#FAEEDA', color: '#BA7517', label: '运行中' },
  ok:      { bg: '#E1F5EE', color: '#1D9E75', label: '完成' },
  error:   { bg: '#FAECE7', color: '#D85A30', label: '错误' },
};

function formatDuration(ms) {
  if (ms == null) return '进行中';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function formatTime(ts) {
  if (!ts) return 'N/A';
  return new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// ── Timeline Bar ──
function TimelineBar({ span, totalStart, totalDuration, onClick, selected }) {
  const offset = totalDuration > 0 ? ((span.startTime - totalStart) / totalDuration) * 100 : 0;
  const duration = span.endTime ? span.endTime - span.startTime : Date.now() - span.startTime;
  const width = totalDuration > 0 ? Math.max((duration / totalDuration) * 100, 2) : 50;
  const status = STATUS_COLORS[span.status] || STATUS_COLORS.running;

  return (
    <div
      onClick={() => onClick(span.id)}
      style={{
        position: 'relative',
        height: '28px',
        marginBottom: '4px',
        cursor: 'pointer',
        borderRadius: 'var(--border-radius-md)',
        background: selected ? 'rgba(55, 138, 221, 0.06)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      <div style={{
        position: 'absolute',
        left: `${offset}%`,
        width: `${width}%`,
        height: '100%',
        borderRadius: 'var(--border-radius-md)',
        background: `linear-gradient(90deg, ${status.color}44, ${status.color}aa)`,
        border: `1px solid ${status.color}66`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        minWidth: '60px',
        overflow: 'hidden',
      }}>
        <span style={{
          fontSize: '10px',
          fontWeight: 500,
          color: status.color,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {span.name}
        </span>
      </div>
    </div>
  );
}

// ── Agent Call Graph (simple node-link) ──
function AgentCallGraph({ spanTree, agents }) {
  const nodes = useMemo(() => {
    const result = [];
    const traverse = (items, depth = 0) => {
      items.forEach((span, i) => {
        const agentMeta = span.metadata?.agentHash;
        const agent = agents?.find(a => a.hash === agentMeta);
        const c = agent ? (COLORS[agent.colorKey] || COLORS.purple) : COLORS.blue;
        result.push({ span, depth, index: i, color: c, agent });
        if (span.children?.length) traverse(span.children, depth + 1);
      });
    };
    traverse(spanTree);
    return result;
  }, [spanTree, agents]);

  if (nodes.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '24px', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
        暂无 Agent 调用数据
      </div>
    );
  }

  return (
    <div style={{ padding: '12px', overflowX: 'auto' }}>
      <svg width={Math.max(nodes.length * 140, 400)} height={nodes.length * 52 + 20} style={{ display: 'block' }}>
        {nodes.map((node, idx) => {
          const x = node.depth * 130 + 20;
          const y = idx * 52 + 10;
          const nextSameLevel = nodes.findIndex((n, i) => i > idx && n.depth === node.depth);
          return (
            <g key={node.span.id}>
              {idx > 0 && (
                <line
                  x1={nodes[idx - 1].depth * 130 + 60}
                  y1={(idx - 1) * 52 + 34}
                  x2={x + 50}
                  y2={y + 10}
                  stroke="var(--color-border-tertiary)"
                  strokeWidth="1"
                  strokeDasharray="4,3"
                />
              )}
              <rect
                x={x} y={y}
                width="100" height="40"
                rx="8"
                fill={node.color.fill}
                stroke={node.color.stroke}
                strokeWidth="1"
              />
              <text
                x={x + 50} y={y + 16}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill={node.color.text}
              >
                {node.agent?.name || node.span.name.slice(0, 12)}
              </text>
              <text
                x={x + 50} y={y + 30}
                textAnchor="middle"
                fontSize="9"
                fill={node.color.mid}
              >
                {formatDuration(node.span.endTime ? node.span.endTime - node.span.startTime : null)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Performance Metrics ──
function PerformanceMetrics({ stats, spanTree }) {
  const tokenData = useMemo(() => {
    let totalTokens = 0;
    const traverse = (items) => {
      items.forEach(span => {
        if (span.metadata?.tokenUsage) {
          totalTokens += (span.metadata.tokenUsage.prompt || 0) + (span.metadata.tokenUsage.completion || 0);
        }
        if (span.children?.length) traverse(span.children);
      });
    };
    traverse(spanTree);
    return totalTokens;
  }, [spanTree]);

  const metrics = [
    { label: '总Span数', value: stats.totalSpans, color: COLORS.blue },
    { label: '已完成', value: stats.completedSpans, color: COLORS.teal },
    { label: '错误', value: stats.errorSpans, color: stats.errorSpans > 0 ? COLORS.coral : COLORS.teal },
    { label: '总耗时', value: formatDuration(stats.totalDuration), color: COLORS.amber },
    { label: '平均耗时', value: formatDuration(stats.avgSpanDuration), color: COLORS.purple },
    { label: 'Token使用', value: tokenData > 0 ? tokenData.toLocaleString() : 'N/A', color: COLORS.blue },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
      gap: '8px',
      marginBottom: '16px',
    }}>
      {metrics.map((m, i) => (
        <div key={i} style={{
          padding: '12px',
          background: m.color.fill,
          borderRadius: 'var(--border-radius-md)',
          border: `1px solid ${m.color.stroke}33`,
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: m.color.text, marginBottom: '2px' }}>
            {m.value}
          </div>
          <div style={{ fontSize: '9px', color: m.color.mid, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {m.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Handoff List ──
function HandoffList({ handoffs }) {
  if (!handoffs || handoffs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
        暂无 Handoff 记录
      </div>
    );
  }

  const statusStyle = (status) => {
    const map = {
      pending:   { bg: '#FAEEDA', color: '#BA7517', label: '等待中' },
      accepted:  { bg: '#E1F5EE', color: '#1D9E75', label: '已接受' },
      rejected:  { bg: '#FAECE7', color: '#D85A30', label: '已拒绝' },
      completed: { bg: '#E1F5EE', color: '#1D9E75', label: '已完成' },
    };
    return map[status] || map.pending;
  };

  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '0.5px solid var(--color-border-tertiary)',
      overflow: 'hidden',
    }}>
      {handoffs.map((h, i) => {
        const s = statusStyle(h.status);
        return (
          <div key={h.id || i} style={{
            padding: '10px 14px',
            borderBottom: i < handoffs.length - 1 ? '0.5px solid var(--color-border-tertiary)' : 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
          }}>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', minWidth: '80px' }}>
              {h.fromAgent}
            </span>
            <span style={{ color: 'var(--color-text-tertiary)' }}>→</span>
            <span style={{ fontWeight: 500, color: 'var(--color-text-primary)', minWidth: '80px' }}>
              {h.toAgent}
            </span>
            <span style={{ flex: 1, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {h.task?.title || h.task || '—'}
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 500,
              background: s.bg, color: s.color,
            }}>
              {s.label}
            </span>
            <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              {formatTime(h.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Component ──
export default function AgentTracingUI({ traces = [], agents = [], handoffs = [], onTraceSelect, onSpanSelect }) {
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [selectedSpanId, setSelectedSpanId] = useState(null);
  const [expandedSpans, setExpandedSpans] = useState(new Set());
  const [activeView, setActiveView] = useState('timeline');

  const selectedTrace = useMemo(() => {
    if (!selectedTraceId) return traces[0] || null;
    return traces.find(t => t.id === selectedTraceId) || null;
  }, [selectedTraceId, traces]);

  const spanTree = useMemo(() => {
    if (!selectedTrace?.spans?.length) return [];
    const spanMap = new Map();
    selectedTrace.spans.forEach(s => spanMap.set(s.id, { ...s, children: [] }));
    const roots = [];
    selectedTrace.spans.forEach(s => {
      const node = spanMap.get(s.id);
      if (s.parentSpanId) {
        const parent = spanMap.get(s.parentSpanId);
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  }, [selectedTrace]);

  const flatSpans = useMemo(() => {
    if (!selectedTrace?.spans) return [];
    return [...selectedTrace.spans].sort((a, b) => a.startTime - b.startTime);
  }, [selectedTrace]);

  const traceStats = useMemo(() => {
    if (!selectedTrace?.spans) return null;
    const spans = selectedTrace.spans;
    const completed = spans.filter(s => s.endTime);
    const errors = spans.filter(s => s.status === 'error');
    const totalDuration = selectedTrace.endTime ? selectedTrace.endTime - selectedTrace.startTime : null;
    const avgDuration = completed.length > 0
      ? completed.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / completed.length
      : null;
    return { totalSpans: spans.length, completedSpans: completed.length, errorSpans: errors.length, totalDuration, avgSpanDuration: avgDuration };
  }, [selectedTrace]);

  const toggleExpand = useCallback((spanId) => {
    setExpandedSpans(prev => {
      const next = new Set(prev);
      next.has(spanId) ? next.delete(spanId) : next.add(spanId);
      return next;
    });
  }, []);

  const handleTraceSelect = useCallback((traceId) => {
    setSelectedTraceId(traceId);
    setSelectedSpanId(null);
    setExpandedSpans(new Set());
    onTraceSelect?.(traceId);
  }, [onTraceSelect]);

  const handleSpanSelect = useCallback((spanId) => {
    setSelectedSpanId(spanId);
    onSpanSelect?.(spanId);
  }, [onSpanSelect]);

  // ── Render span tree node ──
  const renderSpanNode = (span, level = 0) => {
    const isExpanded = expandedSpans.has(span.id);
    const hasChildren = span.children?.length > 0;
    const isSelected = selectedSpanId === span.id;
    const duration = span.endTime ? span.endTime - span.startTime : null;
    const st = STATUS_COLORS[span.status] || STATUS_COLORS.running;

    return (
      <div key={span.id} style={{ marginLeft: `${level * 16}px` }}>
        <div
          onClick={() => handleSpanSelect(span.id)}
          style={{
            padding: '6px 10px', margin: '2px 0', cursor: 'pointer',
            background: isSelected ? COLORS.blue.fill : 'transparent',
            borderRadius: 'var(--border-radius-md)',
            border: `1px solid ${isSelected ? COLORS.blue.stroke : 'transparent'}`,
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.15s',
          }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggleExpand(span.id); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--color-text-tertiary)', fontSize: '10px' }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : <div style={{ width: '14px' }} />}

          <span style={{
            width: '6px', height: '6px', borderRadius: '50%', background: st.color, flexShrink: 0,
          }} />

          <span style={{ flex: 1, fontSize: '11px', fontWeight: 500, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {span.name}
          </span>

          <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
            {formatDuration(duration)}
          </span>
        </div>
        {isExpanded && hasChildren && (
          <div style={{ marginLeft: '8px' }}>
            {span.children.map(child => renderSpanNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const viewTabs = [
    { key: 'timeline', label: '时间线' },
    { key: 'graph', label: '调用图' },
    { key: 'tree', label: 'Span树' },
    { key: 'handoff', label: 'Handoff' },
  ];

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '0.5px solid var(--color-border-tertiary)',
      overflow: 'hidden',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: 'var(--border-radius-md)',
            background: 'linear-gradient(135deg, #378ADD22, #7F77DD44)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px',
          }}>
            ⚡
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
              Agent 执行追踪
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              可视化调用链路与性能指标
            </div>
          </div>
        </div>

        {/* View tabs */}
        <div style={{ display: 'flex', gap: '2px', background: 'var(--color-background-secondary)', borderRadius: '99px', padding: '2px' }}>
          {viewTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveView(tab.key)}
              style={{
                padding: '4px 12px', fontSize: '10px', fontWeight: 500,
                border: 'none', borderRadius: '99px',
                background: activeView === tab.key ? '#378ADD' : 'transparent',
                color: activeView === tab.key ? '#fff' : 'var(--color-text-tertiary)',
                cursor: 'pointer', fontFamily: 'var(--font-sans)',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Trace selector */}
        {traces.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {traces.map(trace => (
              <button
                key={trace.id}
                onClick={() => handleTraceSelect(trace.id)}
                style={{
                  padding: '6px 12px', fontSize: '11px', fontWeight: 500,
                  border: `1px solid ${selectedTrace?.id === trace.id ? COLORS.blue.stroke : 'var(--color-border-tertiary)'}`,
                  borderRadius: '99px',
                  background: selectedTrace?.id === trace.id ? COLORS.blue.fill : 'transparent',
                  color: selectedTrace?.id === trace.id ? COLORS.blue.text : 'var(--color-text-secondary)',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                {trace.name}
                <span style={{ marginLeft: '4px', fontSize: '9px', opacity: 0.7 }}>
                  ({trace.spans?.length || 0})
                </span>
              </button>
            ))}
          </div>
        )}

        {!selectedTrace ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-text-tertiary)' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px', opacity: 0.4 }}>⚡</div>
            <div style={{ fontSize: '13px' }}>暂无追踪数据</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>开始执行后将自动收集链路信息</div>
          </div>
        ) : (
          <>
            {/* Performance Metrics */}
            {traceStats && <PerformanceMetrics stats={traceStats} spanTree={spanTree} />}

            {/* Active View */}
            {activeView === 'timeline' && (
              <div style={{
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '0.5px solid var(--color-border-tertiary)',
                padding: '12px',
                maxHeight: '320px',
                overflowY: 'auto',
              }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'linear-gradient(135deg, #378ADD, #7F77DD)' }} />
                  执行时间线
                </div>
                {flatSpans.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                    暂无Span数据
                  </div>
                ) : (
                  flatSpans.map(span => (
                    <TimelineBar
                      key={span.id}
                      span={span}
                      totalStart={selectedTrace.startTime}
                      totalDuration={selectedTrace.endTime ? selectedTrace.endTime - selectedTrace.startTime : Date.now() - selectedTrace.startTime}
                      onClick={handleSpanSelect}
                      selected={selectedSpanId === span.id}
                    />
                  ))
                )}
              </div>
            )}

            {activeView === 'graph' && (
              <div style={{
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '0.5px solid var(--color-border-tertiary)',
                maxHeight: '320px',
                overflow: 'auto',
              }}>
                <AgentCallGraph spanTree={spanTree} agents={agents} />
              </div>
            )}

            {activeView === 'tree' && (
              <div style={{
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '0.5px solid var(--color-border-tertiary)',
                padding: '8px',
                maxHeight: '320px',
                overflowY: 'auto',
              }}>
                {spanTree.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-tertiary)', fontSize: '12px' }}>
                    暂无Span数据
                  </div>
                ) : (
                  spanTree.map(span => renderSpanNode(span))
                )}
              </div>
            )}

            {activeView === 'handoff' && (
              <HandoffList handoffs={handoffs} />
            )}

            {/* Span detail panel */}
            {selectedSpanId && (() => {
              const span = selectedTrace.spans.find(s => s.id === selectedSpanId);
              if (!span) return null;
              const duration = span.endTime ? span.endTime - span.startTime : null;
              const st = STATUS_COLORS[span.status] || STATUS_COLORS.running;
              return (
                <div style={{
                  marginTop: '12px', padding: '14px',
                  background: 'var(--color-background-secondary)',
                  borderRadius: 'var(--border-radius-lg)',
                  border: '0.5px solid var(--color-border-tertiary)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: st.color }} />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                      {span.name}
                    </span>
                    <span style={{
                      padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 500,
                      background: st.bg, color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                    {[
                      { label: 'ID', value: span.id },
                      { label: '持续时间', value: formatDuration(duration) },
                      { label: '开始时间', value: formatTime(span.startTime) },
                      { label: '状态', value: st.label },
                    ].map((item, i) => (
                      <div key={i} style={{
                        padding: '8px', background: 'var(--color-background-primary)',
                        borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-secondary)',
                      }}>
                        <div style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', marginBottom: '2px' }}>{item.label}</div>
                        <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)', wordBreak: 'break-all' }}>
                          {item.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {span.events?.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                        事件 ({span.events.length})
                      </div>
                      {span.events.map((evt, i) => (
                        <div key={i} style={{
                          padding: '6px 10px', marginBottom: '4px',
                          background: 'var(--color-background-primary)',
                          borderRadius: 'var(--border-radius-md)',
                          fontSize: '10px', fontFamily: 'var(--font-mono)',
                          color: 'var(--color-text-secondary)',
                        }}>
                          <span style={{ fontWeight: 500 }}>{evt.type}</span>
                          <span style={{ marginLeft: '8px', color: 'var(--color-text-tertiary)' }}>
                            {formatTime(evt.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
