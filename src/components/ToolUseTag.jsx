import React from 'react';
import { Icon } from './Icon';
import { toolRegistry } from '../services/toolRegistry';

export function ToolUseTag({ toolName, duration, success, onClick }) {
  const tool = toolRegistry.get(toolName);
  const iconName = tool?.icon || 'Wrench';
  
  return (
    <span 
      className={`tool-tag ${success ? 'success' : 'error'}`}
      onClick={onClick}
      title={tool?.description || toolName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontFamily: 'var(--font-sans)',
        cursor: onClick ? 'pointer' : 'default',
        background: success ? 'var(--color-success-light, #E1F5EE)' : 'var(--color-danger-light, #FDE8E8)',
        color: success ? 'var(--color-success, #1D9E75)' : 'var(--color-danger, #E24B4A)',
        border: `0.5px solid ${success ? 'var(--color-success-border, #1D9E75)' : 'var(--color-danger-border, #E24B4A)'}`,
        transition: 'all 0.15s ease'
      }}
    >
      <Icon name={iconName} size={12} />
      <span style={{ fontWeight: 500 }}>{tool?.displayName || toolName}</span>
      {duration && (
        <span style={{ 
          fontSize: '10px', 
          opacity: 0.8,
          marginLeft: '2px'
        }}>
          {duration}ms
        </span>
      )}
    </span>
  );
}

// 工具标签列表组件
export function ToolUseTagList({ records }) {
  if (!records || records.length === 0) {
    return null;
  }
  
  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      marginTop: '6px'
    }}>
      {records.map((record, i) => (
        <ToolUseTag 
          key={i}
          toolName={record.toolName}
          duration={record.duration}
          success={record.success}
        />
      ))}
    </div>
  );
}