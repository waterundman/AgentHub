import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { ToolCallLog } from './ToolCallLog';
import { toolRegistry } from '../services/toolRegistry';

export function ToolCallManager({ agents = [], toolCalls = {} }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [activeTab, setActiveTab] = useState('log');

  // 获取所有工具调用记录
  const allLogs = useMemo(() => {
    const logs = [];
    Object.entries(toolCalls).forEach(([agentHash, calls]) => {
      calls.forEach(call => {
        logs.push({
          ...call,
          agentHash
        });
      });
    });
    return logs.sort((a, b) => b.timestamp - a.timestamp);
  }, [toolCalls]);

  // 获取选中Agent的日志
  const selectedLogs = useMemo(() => {
    if (!selectedAgent) return allLogs;
    return toolCalls[selectedAgent] || [];
  }, [selectedAgent, toolCalls, allLogs]);

  // 获取统计信息
  const stats = useMemo(() => {
    const totalCalls = allLogs.length;
    const successCalls = allLogs.filter(log => log.success).length;
    const failedCalls = totalCalls - successCalls;
    
    const toolStats = {};
    allLogs.forEach(log => {
      if (!toolStats[log.toolName]) {
        toolStats[log.toolName] = { total: 0, success: 0, failed: 0 };
      }
      toolStats[log.toolName].total++;
      if (log.success) {
        toolStats[log.toolName].success++;
      } else {
        toolStats[log.toolName].failed++;
      }
    });

    return {
      totalCalls,
      successCalls,
      failedCalls,
      toolStats
    };
  }, [allLogs]);

  // 获取工具统计
  const toolStatsList = useMemo(() => {
    return Object.entries(stats.toolStats)
      .map(([toolName, stat]) => {
        const tool = toolRegistry.get(toolName);
        return {
          toolName,
          displayName: tool?.displayName || toolName,
          icon: tool?.icon || 'Wrench',
          ...stat
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [stats.toolStats]);

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
        <Icon name="Activity" size={20} color="var(--color-primary)" />
        <div>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text-primary)'
          }}>
            工具调用管理器
          </h3>
          <p style={{
            margin: '2px 0 0',
            fontSize: '12px',
            color: 'var(--color-text-tertiary)'
          }}>
            监控和管理Agent工具调用
          </p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div style={{
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '12px',
        borderBottom: '0.5px solid var(--color-border-tertiary)'
      }}>
        <div style={{
          padding: '12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-border-secondary)'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '4px'
          }}>
            {stats.totalCalls}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            总调用次数
          </div>
        </div>
        
        <div style={{
          padding: '12px',
          background: 'var(--color-success-light, #E1F5EE)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-success-border, #1D9E75)'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-success, #1D9E75)',
            marginBottom: '4px'
          }}>
            {stats.successCalls}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-success, #1D9E75)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            成功调用
          </div>
        </div>
        
        <div style={{
          padding: '12px',
          background: 'var(--color-danger-light, #FDE8E8)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-danger-border, #E24B4A)'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-danger, #E24B4A)',
            marginBottom: '4px'
          }}>
            {stats.failedCalls}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-danger, #E24B4A)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            失败调用
          </div>
        </div>
        
        <div style={{
          padding: '12px',
          background: 'var(--color-background-secondary)',
          borderRadius: 'var(--border-radius-md)',
          border: '0.5px solid var(--color-border-secondary)'
        }}>
          <div style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            marginBottom: '4px'
          }}>
            {toolStatsList.length}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            使用工具数
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div style={{ padding: '16px' }}>
        {/* Agent过滤器 */}
        <div style={{
          marginBottom: '16px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setSelectedAgent(null)}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: selectedAgent === null ? 'var(--color-primary-light, #E6F1FB)' : 'transparent',
              border: `0.5px solid ${selectedAgent === null ? 'var(--color-primary, #378ADD)' : 'var(--color-border-tertiary)'}`,
              borderRadius: '99px',
              cursor: 'pointer',
              color: selectedAgent === null ? 'var(--color-primary, #185FA5)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            所有Agent
          </button>
          {agents.map(agent => {
            const agentCalls = toolCalls[agent.hash] || [];
            const c = COLORS[agent.colorKey] || COLORS.purple;
            return (
              <button
                key={agent.hash}
                onClick={() => setSelectedAgent(agent.hash)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  background: selectedAgent === agent.hash ? c.fill : 'transparent',
                  border: `0.5px solid ${selectedAgent === agent.hash ? c.stroke : 'var(--color-border-tertiary)'}`,
                  borderRadius: '99px',
                  cursor: 'pointer',
                  color: selectedAgent === agent.hash ? c.text : 'var(--color-text-secondary)',
                  fontFamily: 'var(--font-sans)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: c.stroke
                }} />
                {agent.name}
                {agentCalls.length > 0 && (
                  <span style={{
                    fontSize: '10px',
                    padding: '1px 5px',
                    background: selectedAgent === agent.hash ? c.stroke : 'var(--color-background-secondary)',
                    borderRadius: '99px',
                    color: selectedAgent === agent.hash ? '#fff' : 'var(--color-text-tertiary)'
                  }}>
                    {agentCalls.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 标签页 */}
        <div style={{
          display: 'flex',
          gap: '4px',
          marginBottom: '16px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
          paddingBottom: '8px'
        }}>
          <button
            onClick={() => setActiveTab('log')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: activeTab === 'log' ? 'var(--color-background-secondary)' : 'transparent',
              border: `0.5px solid ${activeTab === 'log' ? 'var(--color-border-secondary)' : 'transparent'}`,
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              color: activeTab === 'log' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            调用日志
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              background: activeTab === 'stats' ? 'var(--color-background-secondary)' : 'transparent',
              border: `0.5px solid ${activeTab === 'stats' ? 'var(--color-border-secondary)' : 'transparent'}`,
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              color: activeTab === 'stats' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)'
            }}
          >
            工具统计
          </button>
        </div>

        {/* 内容 */}
        {activeTab === 'log' ? (
          <ToolCallLog 
            agentHash={selectedAgent}
            logs={selectedLogs}
          />
        ) : (
          <div style={{
            background: 'var(--color-background-secondary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '0.5px solid var(--color-border-tertiary)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '12px 16px',
              borderBottom: '0.5px solid var(--color-border-tertiary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Icon name="BarChart3" size={16} color="var(--color-primary)" />
              <span style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--color-text-primary)'
              }}>
                工具使用统计
              </span>
            </div>
            
            <div style={{ padding: '16px' }}>
              {toolStatsList.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  color: 'var(--color-text-tertiary)',
                  fontSize: '13px'
                }}>
                  暂无工具使用记录
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '8px'
                }}>
                  {toolStatsList.map((toolStat) => (
                    <div key={toolStat.toolName} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-background-primary)',
                      borderRadius: 'var(--border-radius-md)',
                      border: '0.5px solid var(--color-border-secondary)'
                    }}>
                      <Icon name={toolStat.icon} size={20} color="var(--color-text-secondary)" />
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--color-text-primary)',
                          marginBottom: '2px'
                        }}>
                          {toolStat.displayName}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--color-text-tertiary)'
                        }}>
                          {toolStat.toolName}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)'
                          }}>
                            {toolStat.total}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'var(--color-text-tertiary)'
                          }}>
                            总调用
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--color-success, #1D9E75)'
                          }}>
                            {toolStat.success}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'var(--color-success, #1D9E75)'
                          }}>
                            成功
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: 'var(--color-danger, #E24B4A)'
                          }}>
                            {toolStat.failed}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'var(--color-danger, #E24B4A)'
                          }}>
                            失败
                          </div>
                        </div>
                        
                        <div style={{
                          width: '100px',
                          height: '6px',
                          background: 'var(--color-background-secondary)',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${(toolStat.success / toolStat.total) * 100}%`,
                            height: '100%',
                            background: toolStat.failed > 0 ? 'var(--color-warning, #BA7517)' : 'var(--color-success, #1D9E75)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 导入COLORS常量
import { COLORS } from "../constants/colors";