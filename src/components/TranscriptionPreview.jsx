import React from 'react';
import { Icon } from './Icon';

export function TranscriptionPreview({ data, onConfirm, onBack }) {
  const colorMap = {
    purple: '#7F77DD',
    teal: '#1D9E75',
    coral: '#E24B4A',
    blue: '#378ADD',
    amber: '#BA7517',
    green: '#1D9E75',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
        <Icon name="Eye" size={16} color="var(--color-text-secondary)" />
        <h3 style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)', margin: 0 }}>
          预览转写结果
        </h3>
      </div>

      {/* 项目信息 */}
      <div style={{ 
        background: 'var(--color-background-secondary)', 
        borderRadius: 'var(--border-radius-md)', 
        padding: '12px 14px',
        border: '0.5px solid var(--color-border-secondary)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
              项目: {data.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
              源格式: {data.sourceFormat} · 导入时间: {new Date(data.importedAt).toLocaleString()}
            </div>
          </div>
          <div style={{ 
            padding: '4px 10px', 
            background: 'var(--color-background-info)', 
            borderRadius: '12px',
            fontSize: '11px',
            color: 'var(--color-border-info)',
            fontWeight: 500
          }}>
            {data.agents.length} 个 Agent
          </div>
        </div>
      </div>

      {/* Agent列表 */}
      <div>
        <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--color-text-tertiary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Agent 列表
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {data.agents.map((agent, i) => {
            const borderColor = colorMap[agent.colorKey] || colorMap.purple;
            return (
              <div 
                key={agent.hash || i}
                style={{ 
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  padding: '10px 12px',
                  background: 'var(--color-background-primary)',
                  borderRadius: 'var(--border-radius-md)',
                  border: '0.5px solid var(--color-border-secondary)',
                  borderLeft: `3px solid ${borderColor}`,
                  animation: `slideInRight 0.3s ease ${i * 0.05}s both`,
                }}
              >
                <div style={{ 
                  width: '28px', 
                  height: '28px', 
                  borderRadius: '6px', 
                  background: `${borderColor}20`,
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: borderColor,
                  flexShrink: 0
                }}>
                  {agent.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: '2px' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginBottom: '6px' }}>
                    {agent.subtitle}
                  </div>
                  {agent.systemPrompt && (
                    <div style={{ 
                      fontSize: '11px', 
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.5,
                      maxHeight: '40px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      background: 'var(--color-background-secondary)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {agent.systemPrompt.substring(0, 120)}{agent.systemPrompt.length > 120 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '0.5px solid var(--color-border-secondary)' }}>
        <button 
          onClick={onBack}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px', 
            fontSize: '12px', 
            background: 'transparent', 
            border: '0.5px solid var(--color-border-secondary)', 
            borderRadius: 'var(--border-radius-md)', 
            cursor: 'pointer', 
            color: 'var(--color-text-secondary)', 
            fontFamily: 'var(--font-sans)' 
          }}
        >
          <Icon name="ChevronLeft" size={14} />
          返回
        </button>
        <button 
          onClick={onConfirm}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px', 
            fontSize: '12px', 
            fontWeight: 500, 
            background: 'var(--color-text-primary)', 
            color: 'var(--color-background-primary)', 
            border: 'none', 
            borderRadius: 'var(--border-radius-md)', 
            cursor: 'pointer', 
            fontFamily: 'var(--font-sans)' 
          }}
        >
          <Icon name="Check" size={14} />
          确认导入
        </button>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
