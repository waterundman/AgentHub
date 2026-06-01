import React, { useState, useMemo } from 'react';
import { Icon } from './Icon';
import { ToolCallManager } from './ToolCallManager';
import { toolRegistry } from '../services/toolRegistry';

export function ToolDashboard({ agents = [], toolCalls = {} }) {
  const [activeView, setActiveView] = useState('overview');

  // 获取工具统计
  const toolStats = useMemo(() => {
    const stats = {};
    Object.values(toolCalls).forEach(calls => {
      calls.forEach(call => {
        if (!stats[call.toolName]) {
          stats[call.toolName] = { total: 0, success: 0, failed: 0, totalDuration: 0 };
        }
        stats[call.toolName].total++;
        if (call.success) {
          stats[call.toolName].success++;
        } else {
          stats[call.toolName].failed++;
        }
        stats[call.toolName].totalDuration += call.duration || 0;
      });
    });
    
    return Object.entries(stats)
      .map(([toolName, stat]) => {
        const tool = toolRegistry.get(toolName);
        return {
          toolName,
          displayName: tool?.displayName || toolName,
          icon: tool?.icon || 'Wrench',
          category: tool?.category || 'unknown',
          avgDuration: stat.total > 0 ? Math.round(stat.totalDuration / stat.total) : 0,
          successRate: stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 0,
          ...stat
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [toolCalls]);

  // 按分类统计
  const categoryStats = useMemo(() => {
    const categories = {};
    toolStats.forEach(stat => {
      if (!categories[stat.category]) {
        categories[stat.category] = { total: 0, success: 0, failed: 0, tools: 0 };
      }
      categories[stat.category].total += stat.total;
      categories[stat.category].success += stat.success;
      categories[stat.category].failed += stat.failed;
      categories[stat.category].tools++;
    });
    
    return Object.entries(categories).map(([category, stat]) => ({
      category,
      ...stat,
      successRate: stat.total > 0 ? Math.round((stat.success / stat.total) * 100) : 0
    }));
  }, [toolStats]);

  // 最活跃的Agent
  const activeAgents = useMemo(() => {
    return agents
      .map(agent => {
        const calls = toolCalls[agent.hash] || [];
        return {
          ...agent,
          totalCalls: calls.length,
          successCalls: calls.filter(c => c.success).length,
          failedCalls: calls.filter(c => !c.success).length
        };
      })
      .filter(agent => agent.totalCalls > 0)
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, 5);
  }, [agents, toolCalls]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'read': return 'Eye';
      case 'write': return 'FileText';
      case 'execute': return 'Terminal';
      case 'network': return 'Globe';
      case 'system': return 'Settings';
      default: return 'Wrench';
    }
  };

  const getCategoryName = (category) => {
    switch (category) {
      case 'read': return '读取';
      case 'write': return '写入';
      case 'execute': return '执行';
      case 'network': return '网络';
      case 'system': return '系统';
      default: return '其他';
    }
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* 页面标题 */}
      <div style={{
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <Icon name="Tool" size={28} color="var(--color-primary)" />
            工具管理中心
          </h1>
          <p style={{
            margin: '4px 0 0',
            fontSize: '14px',
            color: 'var(--color-text-tertiary)'
          }}>
            监控、分析和管理Agent工具使用情况
          </p>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '8px'
        }}>
          <button
            onClick={() => setActiveView('overview')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: activeView === 'overview' ? 'var(--color-primary-light, #E6F1FB)' : 'transparent',
              border: `0.5px solid ${activeView === 'overview' ? 'var(--color-primary, #378ADD)' : 'var(--color-border-tertiary)'}`,
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              color: activeView === 'overview' ? 'var(--color-primary, #185FA5)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icon name="LayoutDashboard" size={14} />
            概览
          </button>
          <button
            onClick={() => setActiveView('manager')}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: activeView === 'manager' ? 'var(--color-primary-light, #E6F1FB)' : 'transparent',
              border: `0.5px solid ${activeView === 'manager' ? 'var(--color-primary, #378ADD)' : 'var(--color-border-tertiary)'}`,
              borderRadius: 'var(--border-radius-md)',
              cursor: 'pointer',
              color: activeView === 'manager' ? 'var(--color-primary, #185FA5)' : 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Icon name="Settings" size={14} />
            管理器
          </button>
        </div>
      </div>

      {activeView === 'overview' ? (
        <div>
          {/* 统计卡片 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              padding: '20px',
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-lg)',
              border: '0.5px solid var(--color-border-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'var(--color-primary-light, #E6F1FB)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name="Zap" size={20} color="var(--color-primary)" />
                </div>
                <div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1
                  }}>
                    {toolStats.reduce((sum, stat) => sum + stat.total, 0)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '2px'
                  }}>
                    总调用次数
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <Icon name="TrendingUp" size={12} color="var(--color-success, #1D9E75)" />
                <span style={{ color: 'var(--color-success, #1D9E75)' }}>
                  {toolStats.length} 种工具
                </span>
                已被使用
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-lg)',
              border: '0.5px solid var(--color-border-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'var(--color-success-light, #E1F5EE)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name="CheckCircle" size={20} color="var(--color-success, #1D9E75)" />
                </div>
                <div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--color-success, #1D9E75)',
                    lineHeight: 1
                  }}>
                    {toolStats.reduce((sum, stat) => sum + stat.success, 0)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '2px'
                  }}>
                    成功调用
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                成功率:
                <span style={{
                  color: 'var(--color-success, #1D9E75)',
                  fontWeight: 600
                }}>
                  {toolStats.length > 0 
                    ? Math.round((toolStats.reduce((sum, stat) => sum + stat.success, 0) / 
                        toolStats.reduce((sum, stat) => sum + stat.total, 0)) * 100)
                    : 0}%
                </span>
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-lg)',
              border: '0.5px solid var(--color-border-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'var(--color-danger-light, #FDE8E8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name="XCircle" size={20} color="var(--color-danger, #E24B4A)" />
                </div>
                <div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--color-danger, #E24B4A)',
                    lineHeight: 1
                  }}>
                    {toolStats.reduce((sum, stat) => sum + stat.failed, 0)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '2px'
                  }}>
                    失败调用
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                需要关注的失败调用
              </div>
            </div>

            <div style={{
              padding: '20px',
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-lg)',
              border: '0.5px solid var(--color-border-tertiary)',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--border-radius-md)',
                  background: 'var(--color-warning-light, #FAEEDA)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon name="Clock" size={20} color="var(--color-warning, #BA7517)" />
                </div>
                <div>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1
                  }}>
                    {toolStats.length > 0 
                      ? Math.round(toolStats.reduce((sum, stat) => sum + stat.avgDuration, 0) / toolStats.length)
                      : 0}ms
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'var(--color-text-tertiary)',
                    marginTop: '2px'
                  }}>
                    平均耗时
                  </div>
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--color-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                工具调用平均响应时间
              </div>
            </div>
          </div>

          {/* 分类统计 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <div style={{
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-lg)',
              border: '0.5px solid var(--color-border-tertiary)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '0.5px solid var(--color-border-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon name="PieChart" size={16} color="var(--color-primary)" />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)'
                }}>
                  工具分类统计
                </span>
              </div>
              <div style={{ padding: '16px' }}>
                {categoryStats.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'var(--color-text-tertiary)',
                    fontSize: '13px'
                  }}>
                    暂无分类数据
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {categoryStats.map((categoryStat) => (
                      <div key={categoryStat.category} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-background-secondary)',
                        borderRadius: 'var(--border-radius-md)',
                        border: '0.5px solid var(--color-border-secondary)'
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: 'var(--border-radius-md)',
                          background: 'var(--color-background-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '0.5px solid var(--color-border-tertiary)'
                        }}>
                          <Icon name={getCategoryIcon(categoryStat.category)} size={18} color="var(--color-text-secondary)" />
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'var(--color-text-primary)',
                            marginBottom: '2px'
                          }}>
                            {getCategoryName(categoryStat.category)}
                          </div>
                          <div style={{
                            fontSize: '11px',
                            color: 'var(--color-text-tertiary)'
                          }}>
                            {categoryStat.tools} 种工具
                          </div>
                        </div>
                        
                        <div style={{
                          display: 'flex',
                          gap: '16px',
                          alignItems: 'center'
                        }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              color: 'var(--color-text-primary)'
                            }}>
                              {categoryStat.total}
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: 'var(--color-text-tertiary)'
                            }}>
                              调用
                            </div>
                          </div>
                          
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              fontSize: '16px',
                              fontWeight: 700,
                              color: 'var(--color-success, #1D9E75)'
                            }}>
                              {categoryStat.successRate}%
                            </div>
                            <div style={{
                              fontSize: '10px',
                              color: 'var(--color-success, #1D9E75)'
                            }}>
                              成功率
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 最活跃的Agent */}
            <div style={{
              background: 'var(--color-background-primary)',
              borderRadius: 'var(--border-radius-lg)',
              border: '0.5px solid var(--color-border-tertiary)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px',
                borderBottom: '0.5px solid var(--color-border-tertiary)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Icon name="Users" size={16} color="var(--color-primary)" />
                <span style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--color-text-primary)'
                }}>
                  最活跃的Agent
                </span>
              </div>
              <div style={{ padding: '16px' }}>
                {activeAgents.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: 'var(--color-text-tertiary)',
                    fontSize: '13px'
                  }}>
                    暂无Agent活动记录
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gap: '12px'
                  }}>
                    {activeAgents.map((agent) => {
                      const c = COLORS[agent.colorKey] || COLORS.purple;
                      return (
                        <div key={agent.hash} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'var(--color-background-secondary)',
                          borderRadius: 'var(--border-radius-md)',
                          border: '0.5px solid var(--color-border-secondary)'
                        }}>
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: c.fill,
                            border: `1px solid ${c.stroke}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: c.text
                          }}>
                            {agent.icon}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--color-text-primary)',
                              marginBottom: '2px'
                            }}>
                              {agent.name}
                            </div>
                            <div style={{
                              fontSize: '11px',
                              color: 'var(--color-text-tertiary)'
                            }}>
                              {agent.subtitle}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            gap: '16px',
                            alignItems: 'center'
                          }}>
                            <div style={{ textAlign: 'center' }}>
                              <div style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)'
                              }}>
                                {agent.totalCalls}
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
                                fontSize: '16px',
                                fontWeight: 700,
                                color: 'var(--color-success, #1D9E75)'
                              }}>
                                {agent.successCalls}
                              </div>
                              <div style={{
                                fontSize: '10px',
                                color: 'var(--color-success, #1D9E75)'
                              }}>
                                成功
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 热门工具 */}
          <div style={{
            background: 'var(--color-background-primary)',
            borderRadius: 'var(--border-radius-lg)',
            border: '0.5px solid var(--color-border-tertiary)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '16px',
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
                热门工具排行
              </span>
            </div>
            <div style={{ padding: '16px' }}>
              {toolStats.length === 0 ? (
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
                  {toolStats.slice(0, 10).map((toolStat, index) => (
                    <div key={toolStat.toolName} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 12px',
                      background: index % 2 === 0 ? 'var(--color-background-secondary)' : 'transparent',
                      borderRadius: 'var(--border-radius-md)'
                    }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: index < 3 ? 'var(--color-primary-light, #E6F1FB)' : 'var(--color-background-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: index < 3 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                        border: '0.5px solid var(--color-border-tertiary)'
                      }}>
                        {index + 1}
                      </div>
                      
                      <Icon name={toolStat.icon} size={18} color="var(--color-text-secondary)" />
                      
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          color: 'var(--color-text-primary)'
                        }}>
                          {toolStat.displayName}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--color-text-tertiary)'
                        }}>
                          {toolStat.toolName} • {getCategoryName(toolStat.category)}
                        </div>
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        gap: '16px',
                        alignItems: 'center'
                      }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)'
                          }}>
                            {toolStat.total}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'var(--color-text-tertiary)'
                          }}>
                            调用
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-success, #1D9E75)'
                          }}>
                            {toolStat.successRate}%
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'var(--color-success, #1D9E75)'
                          }}>
                            成功率
                          </div>
                        </div>
                        
                        <div style={{ textAlign: 'center' }}>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--color-text-primary)'
                          }}>
                            {toolStat.avgDuration}ms
                          </div>
                          <div style={{
                            fontSize: '10px',
                            color: 'var(--color-text-tertiary)'
                          }}>
                            平均耗时
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <ToolCallManager 
          agents={agents}
          toolCalls={toolCalls}
        />
      )}
    </div>
  );
}

// 导入COLORS常量
import { COLORS } from "../constants/colors";