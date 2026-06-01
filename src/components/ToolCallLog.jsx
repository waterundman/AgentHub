import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { ToolUseTag } from './ToolUseTag';
import { toolRegistry } from '../services/toolRegistry';

export function ToolCallLog({ agentHash, logs = [] }) {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState({});

  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    if (filter === 'success') return logs.filter(log => log.success);
    if (filter === 'failed') return logs.filter(log => !log.success);
    return logs.filter(log => log.toolName === filter);
  }, [logs, filter]);

  const toolNames = useMemo(() => {
    const names = new Set();
    logs.forEach(log => names.add(log.toolName));
    return Array.from(names);
  }, [logs]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter(log => log.success).length;
    const failed = total - success;
    const avgDuration = total > 0 
      ? logs.reduce((sum, log) => sum + (log.duration || 0), 0) / total 
      : 0;
    return { total, success, failed, avgDuration };
  }, [logs]);

  const toggleExpand = (logId) => {
    setExpanded(prev => ({ ...prev, [logId]: !prev[logId] }));
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (logs.length === 0) {
    return (
      <div style={{
        padding: '20px',
        textAlign: 'center',
        color: 'var(--color-text-tertiary)',
        fontSize: '13px'
      }}>
        暂无工具调用记录
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '0.5px solid var(--color-border-tertiary)',
      overflow: 'hidden'
    }}>
      {/* 头部统计 */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Icon name="Activity" size={16} color="var(--color-primary)" />
          <span style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>
            工具调用日志
          </span>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '12px',
          marginLeft: 'auto'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Icon name="Zap" size={12} />
            <span>总计: {stats.total}</span>
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-success, #1D9E75)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Icon name="Check" size={12} />
            <span>成功: {stats.success}</span>
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-danger, #E24B4A)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Icon name="X" size={12} />
            <span>失败: {stats.failed}</span>
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Icon name="Clock" size={12} />
            <span>平均: {Math.round(stats.avgDuration)}ms</span>
          </div>
        </div>
      </div>

      {/* 过滤器 */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            background: filter === 'all' ? 'var(--color-primary-light, #E6F1FB)' : 'transparent',
            border: `0.5px solid ${filter === 'all' ? 'var(--color-primary, #378ADD)' : 'var(--color-border-tertiary)'}`,
            borderRadius: '99px',
            cursor: 'pointer',
            color: filter === 'all' ? 'var(--color-primary, #185FA5)' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          全部
        </button>
        <button
          onClick={() => setFilter('success')}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            background: filter === 'success' ? 'var(--color-success-light, #E1F5EE)' : 'transparent',
            border: `0.5px solid ${filter === 'success' ? 'var(--color-success, #1D9E75)' : 'var(--color-border-tertiary)'}`,
            borderRadius: '99px',
            cursor: 'pointer',
            color: filter === 'success' ? 'var(--color-success, #1D9E75)' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          成功
        </button>
        <button
          onClick={() => setFilter('failed')}
          style={{
            padding: '4px 10px',
            fontSize: '11px',
            background: filter === 'failed' ? 'var(--color-danger-light, #FDE8E8)' : 'transparent',
            border: `0.5px solid ${filter === 'failed' ? 'var(--color-danger, #E24B4A)' : 'var(--color-border-tertiary)'}`,
            borderRadius: '99px',
            cursor: 'pointer',
            color: filter === 'failed' ? 'var(--color-danger, #E24B4A)' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)'
          }}
        >
          失败
        </button>
        
        {toolNames.map(toolName => {
          const tool = toolRegistry.get(toolName);
          return (
            <button
              key={toolName}
              onClick={() => setFilter(toolName)}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                background: filter === toolName ? 'var(--color-background-primary)' : 'transparent',
                border: `0.5px solid ${filter === toolName ? 'var(--color-border-secondary)' : 'var(--color-border-tertiary)'}`,
                borderRadius: '99px',
                cursor: 'pointer',
                color: filter === toolName ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-sans)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Icon name={tool?.icon || 'Wrench'} size={10} />
              {tool?.displayName || toolName}
            </button>
          );
        })}
      </div>

      {/* 日志列表 */}
      <div style={{
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        {filteredLogs.map((log, index) => (
          <div key={log.id || index} style={{
            padding: '10px 16px',
            borderBottom: '0.5px solid var(--color-border-tertiary)',
            background: expanded[log.id] ? 'var(--color-background-primary)' : 'transparent'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: expanded[log.id] ? '8px' : '0'
            }}>
              <ToolUseTag 
                toolName={log.toolName}
                duration={log.duration}
                success={log.success}
                onClick={() => toggleExpand(log.id)}
              />
              
              <span style={{
                fontSize: '10px',
                color: 'var(--color-text-tertiary)',
                marginLeft: 'auto'
              }}>
                {formatTimestamp(log.timestamp)}
              </span>
              
              <button
                onClick={() => toggleExpand(log.id)}
                style={{
                  padding: '2px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-tertiary)'
                }}
              >
                <Icon name={expanded[log.id] ? "ChevronUp" : "ChevronDown"} size={14} />
              </button>
            </div>
            
            {expanded[log.id] && (
              <div style={{
                marginTop: '8px',
                padding: '8px',
                background: 'var(--color-background-secondary)',
                borderRadius: 'var(--border-radius-md)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: 'var(--color-text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {log.error && (
                  <div style={{
                    color: 'var(--color-danger, #E24B4A)',
                    marginBottom: '6px',
                    fontWeight: 500
                  }}>
                    错误: {log.error}
                  </div>
                )}
                {log.input && (
                  <div style={{ marginBottom: '6px' }}>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--color-text-tertiary)',
                      marginBottom: '2px'
                    }}>
                      输入参数:
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: '4px',
                      background: 'var(--color-background-primary)',
                      borderRadius: '4px',
                      overflowX: 'auto'
                    }}>
                      {JSON.stringify(log.input, null, 2)}
                    </pre>
                  </div>
                )}
                {log.output && (
                  <div>
                    <div style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--color-text-tertiary)',
                      marginBottom: '2px'
                    }}>
                      输出结果:
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: '4px',
                      background: 'var(--color-background-primary)',
                      borderRadius: '4px',
                      overflowX: 'auto'
                    }}>
                      {typeof log.output === 'string' ? log.output : JSON.stringify(log.output, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 底部信息 */}
      <div style={{
        padding: '8px 16px',
        borderTop: '0.5px solid var(--color-border-tertiary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span style={{
          fontSize: '10px',
          color: 'var(--color-text-tertiary)'
        }}>
          显示 {filteredLogs.length} / {logs.length} 条记录
        </span>
        <span style={{
          fontSize: '10px',
          color: 'var(--color-text-tertiary)'
        }}>
          点击标签查看详细信息
        </span>
      </div>
    </div>
  );
}