import React, { useState } from 'react';
import { Icon } from './Icon';
import { toolRegistry } from '../services/toolRegistry';

export function AgentToolSandbox({ agent, onUpdate }) {
  const [config, setConfig] = useState(agent.toolConfig || {
    allowedTools: [],
    deniedTools: [],
    maxCallsPerRun: 50,
    maxCallsPerTool: 10,
    timeout: 30000,
  });

  const allTools = toolRegistry.list();
  const categories = ['read', 'write', 'execute', 'network', 'system'];

  const handleToggleTool = (toolName, type) => {
    const list = type === 'allow' ? 'allowedTools' : 'deniedTools';
    const oppositeList = type === 'allow' ? 'deniedTools' : 'allowedTools';
    
    // 从相反列表中移除
    const newOppositeList = config[oppositeList].filter(t => t !== toolName);
    
    // 切换当前列表
    const newList = config[list].includes(toolName)
      ? config[list].filter(t => t !== toolName)
      : [...config[list], toolName];
    
    const newConfig = { 
      ...config, 
      [list]: newList,
      [oppositeList]: newOppositeList
    };
    setConfig(newConfig);
    onUpdate({ ...agent, toolConfig: newConfig });
  };

  const handleLimitChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    setConfig(newConfig);
    onUpdate({ ...agent, toolConfig: newConfig });
  };

  const isToolAllowed = (toolName) => {
    if (config.deniedTools.includes(toolName)) return false;
    if (config.allowedTools.length === 0) return true; // 没有允许列表时默认允许
    return config.allowedTools.includes(toolName);
  };

  const getToolStatus = (toolName) => {
    if (config.deniedTools.includes(toolName)) return 'denied';
    if (config.allowedTools.includes(toolName)) return 'allowed';
    return 'default';
  };

  return (
    <div style={{
      background: 'var(--color-background-secondary)',
      borderRadius: 'var(--border-radius-lg)',
      padding: '16px',
      border: '0.5px solid var(--color-border-tertiary)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        paddingBottom: '12px',
        borderBottom: '0.5px solid var(--color-border-tertiary)'
      }}>
        <Icon name="Shield" size={16} color="var(--color-primary)" />
        <span style={{
          fontSize: '14px',
          fontWeight: 600,
          color: 'var(--color-text-primary)'
        }}>
          工具权限配置
        </span>
        <span style={{
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          marginLeft: 'auto'
        }}>
          配置此Agent可使用的工具
        </span>
      </div>

      {/* 工具列表 */}
      <div style={{ marginBottom: '20px' }}>
        {categories.map(category => (
          <div key={category} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--color-text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <Icon name={
                category === 'read' ? 'Eye' :
                category === 'write' ? 'FileText' :
                category === 'execute' ? 'Terminal' :
                category === 'network' ? 'Globe' :
                'Settings'
              } size={12} />
              {category === 'read' ? '读取' :
               category === 'write' ? '写入' :
               category === 'execute' ? '执行' :
               category === 'network' ? '网络' :
               '系统'}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '6px'
            }}>
              {allTools
                .filter(t => t.category === category)
                .map(tool => {
                  const status = getToolStatus(tool.name);
                  return (
                    <div key={tool.name} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      background: status === 'allowed' ? 'var(--color-success-light, #E1F5EE)' :
                                 status === 'denied' ? 'var(--color-danger-light, #FDE8E8)' :
                                 'var(--color-background-primary)',
                      borderRadius: 'var(--border-radius-md)',
                      border: `0.5px solid ${
                        status === 'allowed' ? 'var(--color-success-border, #1D9E75)' :
                        status === 'denied' ? 'var(--color-danger-border, #E24B4A)' :
                        'var(--color-border-secondary)'
                      }`,
                      transition: 'all 0.15s ease'
                    }}>
                      <Icon name={tool.icon} size={14} color={
                        status === 'allowed' ? 'var(--color-success, #1D9E75)' :
                        status === 'denied' ? 'var(--color-danger, #E24B4A)' :
                        'var(--color-text-secondary)'
                      } />
                      <span style={{
                        fontSize: '12px',
                        color: 'var(--color-text-primary)',
                        flex: 1,
                        minWidth: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {tool.displayName}
                      </span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleToggleTool(tool.name, 'allow')}
                          style={{
                            padding: '4px',
                            background: status === 'allowed' ? 'var(--color-success, #1D9E75)' : 'transparent',
                            border: `0.5px solid ${status === 'allowed' ? 'var(--color-success, #1D9E75)' : 'var(--color-border-tertiary)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: status === 'allowed' ? '#fff' : 'var(--color-text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="允许"
                        >
                          <Icon name="Check" size={12} />
                        </button>
                        <button
                          onClick={() => handleToggleTool(tool.name, 'deny')}
                          style={{
                            padding: '4px',
                            background: status === 'denied' ? 'var(--color-danger, #E24B4A)' : 'transparent',
                            border: `0.5px solid ${status === 'denied' ? 'var(--color-danger, #E24B4A)' : 'var(--color-border-tertiary)'}`,
                            borderRadius: '4px',
                            cursor: 'pointer',
                            color: status === 'denied' ? '#fff' : 'var(--color-text-tertiary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title="禁止"
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* 限制配置 */}
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: 'var(--border-radius-md)',
        padding: '16px',
        border: '0.5px solid var(--color-border-secondary)'
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <Icon name="Clock" size={14} />
          调用限制
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px'
            }}>
              单次运行最大调用次数
            </label>
            <input 
              type="number" 
              value={config.maxCallsPerRun}
              onChange={(e) => handleLimitChange('maxCallsPerRun', parseInt(e.target.value) || 0)}
              min="0"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px'
            }}>
              单工具最大调用次数
            </label>
            <input 
              type="number" 
              value={config.maxCallsPerTool}
              onChange={(e) => handleLimitChange('maxCallsPerTool', parseInt(e.target.value) || 0)}
              min="0"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              color: 'var(--color-text-secondary)',
              marginBottom: '4px'
            }}>
              单次调用超时 (ms)
            </label>
            <input 
              type="number" 
              value={config.timeout}
              onChange={(e) => handleLimitChange('timeout', parseInt(e.target.value) || 0)}
              min="0"
              style={{
                width: '100%',
                padding: '6px 10px',
                fontSize: '12px',
                border: '0.5px solid var(--color-border-secondary)',
                borderRadius: 'var(--border-radius-md)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)',
                fontFamily: 'var(--font-mono)'
              }}
            />
          </div>
        </div>
      </div>

      {/* 统计信息 */}
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'var(--color-background-primary)',
        borderRadius: 'var(--border-radius-md)',
        border: '0.5px solid var(--color-border-secondary)'
      }}>
        <div style={{
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
          marginBottom: '8px'
        }}>
          当前配置摘要
        </div>
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)'
          }}>
            <span style={{ fontWeight: 500 }}>允许工具:</span> {config.allowedTools.length === 0 ? '全部' : config.allowedTools.length}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)'
          }}>
            <span style={{ fontWeight: 500 }}>禁止工具:</span> {config.deniedTools.length}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--color-text-secondary)'
          }}>
            <span style={{ fontWeight: 500 }}>最大调用:</span> {config.maxCallsPerRun}
          </div>
        </div>
      </div>
    </div>
  );
}