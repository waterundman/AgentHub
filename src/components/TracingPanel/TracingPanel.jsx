import React, { useState, useMemo } from 'react';
import { Icon } from '../Icon';
import { tracingService } from '../../services/tracing/TracingService';

/**
 * TracingPanel组件
 * 显示Trace树形结构，支持Span详情查看，可视化调用链路
 */
export function TracingPanel({ traces = [], onTraceSelect, onSpanSelect }) {
  const [selectedTraceId, setSelectedTraceId] = useState(null);
  const [selectedSpanId, setSelectedSpanId] = useState(null);
  const [expandedSpans, setExpandedSpans] = useState(new Set());

  // 获取选中的Trace
  const selectedTrace = useMemo(() => {
    if (!selectedTraceId) return null;
    return traces.find(trace => trace.id === selectedTraceId) || null;
  }, [selectedTraceId, traces]);

  // 获取选中Trace的所有Spans
  const traceSpans = useMemo(() => {
    if (!selectedTrace) return [];
    return tracingService.getSpans(selectedTrace.id);
  }, [selectedTrace]);

  // 构建Span树结构
  const spanTree = useMemo(() => {
    if (!traceSpans.length) return [];
    
    const rootSpans = [];
    const spanMap = new Map();
    
    // 首先创建所有Span的映射
    traceSpans.forEach(span => {
      spanMap.set(span.id, {
        ...span,
        children: []
      });
    });
    
    // 构建树结构
    traceSpans.forEach(span => {
      const spanNode = spanMap.get(span.id);
      if (span.parentSpanId) {
        const parent = spanMap.get(span.parentSpanId);
        if (parent) {
          parent.children.push(spanNode);
        } else {
          rootSpans.push(spanNode);
        }
      } else {
        rootSpans.push(spanNode);
      }
    });
    
    return rootSpans;
  }, [traceSpans]);

  // 处理Trace选择
  const handleTraceSelect = (traceId) => {
    setSelectedTraceId(traceId);
    setSelectedSpanId(null);
    setExpandedSpans(new Set());
    if (onTraceSelect) {
      onTraceSelect(traceId);
    }
  };

  // 处理Span选择
  const handleSpanSelect = (spanId) => {
    setSelectedSpanId(spanId);
    if (onSpanSelect) {
      onSpanSelect(spanId);
    }
  };

  // 切换Span展开/折叠
  const toggleSpanExpand = (spanId) => {
    setExpandedSpans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(spanId)) {
        newSet.delete(spanId);
      } else {
        newSet.add(spanId);
      }
      return newSet;
    });
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 计算持续时间
  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return '进行中';
    const duration = endTime - startTime;
    if (duration < 1000) return `${duration}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  // 渲染Span节点
  const renderSpanNode = (span, level = 0) => {
    const isExpanded = expandedSpans.has(span.id);
    const hasChildren = span.children && span.children.length > 0;
    const isSelected = selectedSpanId === span.id;
    const duration = formatDuration(span.startTime, span.endTime);
    
    return (
      <div key={span.id} style={{ marginLeft: `${level * 20}px` }}>
        <div 
          style={{
            padding: '8px 12px',
            margin: '4px 0',
            background: isSelected ? 'var(--color-primary-light, #E6F1FB)' : 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-md)',
            border: `0.5px solid ${isSelected ? 'var(--color-primary, #378ADD)' : 'var(--color-border-tertiary)'}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => handleSpanSelect(span.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleSpanExpand(span.id);
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                color: 'var(--color-text-secondary)'
              }}
            >
              <Icon name={isExpanded ? "ChevronDown" : "ChevronRight"} size={14} />
            </button>
          )}
          
          {!hasChildren && <div style={{ width: '14px' }} />}
          
          <Icon 
            name={span.status === 'error' ? "AlertCircle" : "Activity"} 
            size={16} 
            color={span.status === 'error' ? 'var(--color-danger, #E24B4A)' : 'var(--color-primary, #378ADD)'} 
          />
          
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-text-primary)'
            }}>
              {span.name}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              display: 'flex',
              gap: '8px'
            }}>
              <span>{formatTime(span.startTime)}</span>
              <span>•</span>
              <span>{duration}</span>
              <span>•</span>
              <span style={{ 
                color: span.status === 'error' ? 'var(--color-danger, #E24B4A)' : 'var(--color-success, #1D9E75)' 
              }}>
                {span.status}
              </span>
            </div>
          </div>
          
          {span.events && span.events.length > 0 && (
            <span style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: 'var(--color-background-primary)',
              borderRadius: '99px',
              color: 'var(--color-text-tertiary)'
            }}>
              {span.events.length} 事件
            </span>
          )}
        </div>
        
        {isExpanded && hasChildren && (
          <div style={{ marginLeft: '20px' }}>
            {span.children.map(child => renderSpanNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // 渲染Span详情
  const renderSpanDetails = () => {
    if (!selectedSpanId) return null;
    
    const span = tracingService.getSpan(selectedSpanId);
    if (!span) return null;
    
    const duration = formatDuration(span.startTime, span.endTime);
    
    return (
      <div style={{
        marginTop: '16px',
        padding: '16px',
        background: 'var(--color-background-secondary)',
        borderRadius: 'var(--border-radius-lg)',
        border: '0.5px solid var(--color-border-tertiary)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px'
        }}>
          <Icon name="Info" size={16} color="var(--color-primary)" />
          <h4 style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>
            Span详情
          </h4>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
          marginBottom: '16px'
        }}>
          <div style={{
            padding: '12px',
            background: 'var(--color-background-primary)',
            borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)'
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              marginBottom: '4px'
            }}>
              ID
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-primary)',
              wordBreak: 'break-all'
            }}>
              {span.id}
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            background: 'var(--color-background-primary)',
            borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)'
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              marginBottom: '4px'
            }}>
              Trace ID
            </div>
            <div style={{
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-primary)',
              wordBreak: 'break-all'
            }}>
              {span.traceId}
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            background: 'var(--color-background-primary)',
            borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)'
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              marginBottom: '4px'
            }}>
              持续时间
            </div>
            <div style={{
              fontSize: '12px',
              color: 'var(--color-text-primary)'
            }}>
              {duration}
            </div>
          </div>
          
          <div style={{
            padding: '12px',
            background: 'var(--color-background-primary)',
            borderRadius: 'var(--border-radius-md)',
            border: '0.5px solid var(--color-border-secondary)'
          }}>
            <div style={{
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              marginBottom: '4px'
            }}>
              状态
            </div>
            <div style={{
              fontSize: '12px',
              color: span.status === 'error' ? 'var(--color-danger, #E24B4A)' : 'var(--color-success, #1D9E75)',
              fontWeight: 500
            }}>
              {span.status}
            </div>
          </div>
        </div>
        
        {span.events && span.events.length > 0 && (
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '8px'
            }}>
              事件 ({span.events.length})
            </div>
            
            <div style={{
              maxHeight: '200px',
              overflowY: 'auto',
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-md)',
              border: '0.5px solid var(--color-border-secondary)'
            }}>
              {span.events.map((event, index) => (
                <div key={index} style={{
                  padding: '8px 12px',
                  borderBottom: '0.5px solid var(--color-border-tertiary)',
                  fontSize: '11px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px'
                  }}>
                    <span style={{
                      fontWeight: 500,
                      color: 'var(--color-text-primary)'
                    }}>
                      {event.type || 'Event'}
                    </span>
                    <span style={{
                      color: 'var(--color-text-tertiary)'
                    }}>
                      {formatTime(event.timestamp)}
                    </span>
                  </div>
                  <pre style={{
                    margin: 0,
                    padding: '4px',
                    background: 'var(--color-background-secondary)',
                    borderRadius: '4px',
                    fontSize: '10px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {JSON.stringify(event, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {span.metadata && Object.keys(span.metadata).length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              marginBottom: '8px'
            }}>
              元数据
            </div>
            <pre style={{
              margin: 0,
              padding: '8px',
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-md)',
              border: '0.5px solid var(--color-border-secondary)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-secondary)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {JSON.stringify(span.metadata, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  // 渲染Trace统计
  const renderTraceStats = () => {
    if (!selectedTrace) return null;
    
    const stats = tracingService.getTraceStats(selectedTrace.id);
    if (!stats) return null;
    
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '8px',
        marginBottom: '16px'
      }}>
        <div style={{
          padding: '12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-border-tertiary)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '4px'
          }}>
            {stats.totalSpans}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            总Span数
          </div>
        </div>
        
        <div style={{
          padding: '12px',
          background: stats.errorSpans > 0 ? 'var(--color-danger-light, #FDE8E8)' : 'var(--color-success-light, #E1F5EE)',
          borderRadius: 'var(--border-radius-md)',
          border: `0.5px solid ${stats.errorSpans > 0 ? 'var(--color-danger-border, #E24B4A)' : 'var(--color-success-border, #1D9E75)'}`,
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: stats.errorSpans > 0 ? 'var(--color-danger, #E24B4A)' : 'var(--color-success, #1D9E75)',
            marginBottom: '4px'
          }}>
            {stats.errorSpans > 0 ? stats.errorSpans : stats.completedSpans}
          </div>
          <div style={{
            fontSize: '10px',
            color: stats.errorSpans > 0 ? 'var(--color-danger, #E24B4A)' : 'var(--color-success, #1D9E75)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {stats.errorSpans > 0 ? '错误Span' : '已完成'}
          </div>
        </div>
        
        <div style={{
          padding: '12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-border-tertiary)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '4px'
          }}>
            {stats.totalDuration ? `${(stats.totalDuration / 1000).toFixed(2)}s` : '进行中'}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            总耗时
          </div>
        </div>
        
        <div style={{
          padding: '12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-border-tertiary)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '4px'
          }}>
            {stats.avgSpanDuration ? `${Math.round(stats.avgSpanDuration)}ms` : 'N/A'}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            平均Span耗时
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '0.5px solid var(--color-border-tertiary)',
      overflow: 'hidden'
    }}>
      {/* 头部 */}
      <div style={{
        padding: '16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Icon name="GitBranch" size={20} color="var(--color-primary)" />
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>
            追踪面板
          </h3>
          <p style={{
            margin: '2px 0 0',
            fontSize: '12px',
            color: 'var(--color-text-tertiary)'
          }}>
            查看和分析工具调用链路
          </p>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Trace选择器 */}
        <div style={{
          marginBottom: '16px'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            marginBottom: '8px'
          }}>
            选择Trace
          </div>
          
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {traces.length === 0 ? (
              <div style={{
                padding: '8px 12px',
                fontSize: '12px',
                color: 'var(--color-text-tertiary)',
                fontStyle: 'italic'
              }}>
                暂无Trace数据
              </div>
            ) : (
              traces.map(trace => (
                <button
                  key={trace.id}
                  onClick={() => handleTraceSelect(trace.id)}
                  style={{
                    padding: '8px 12px',
                    fontSize: '12px',
                    background: selectedTraceId === trace.id ? 'var(--color-primary-light, #E6F1FB)' : 'transparent',
                    border: `0.5px solid ${selectedTraceId === trace.id ? 'var(--color-primary, #378ADD)' : 'var(--color-border-tertiary)'}`,
                    borderRadius: '99px',
                    cursor: 'pointer',
                    color: selectedTraceId === trace.id ? 'var(--color-primary, #185FA5)' : 'var(--color-text-secondary)',
                    fontFamily: 'var(--font-sans)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Icon name="Activity" size={12} />
                  {trace.name}
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    background: selectedTraceId === trace.id ? 'var(--color-primary, #378ADD)' : 'var(--color-background-secondary)',
                    borderRadius: '99px',
                    color: selectedTraceId === trace.id ? '#fff' : 'var(--color-text-tertiary)'
                  }}>
                    {trace.spans.length}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Trace详情 */}
        {selectedTrace && (
          <div>
            {/* Trace统计 */}
            {renderTraceStats()}
            
            {/* Span树 */}
            <div style={{
              marginBottom: '16px'
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
                marginBottom: '8px'
              }}>
                Span树形结构
              </div>
              
              <div style={{
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-lg)',
                border: '0.5px solid var(--color-border-tertiary)',
                padding: '8px',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                {spanTree.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'var(--color-text-tertiary)',
                    fontSize: '13px'
                  }}>
                    暂无Span数据
                  </div>
                ) : (
                  spanTree.map(span => renderSpanNode(span))
                )}
              </div>
            </div>
            
            {/* Span详情 */}
            {renderSpanDetails()}
          </div>
        )}
      </div>
    </div>
  );
}