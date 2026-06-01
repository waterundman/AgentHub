import React, { useState } from 'react';
import { TracingPanel } from './TracingPanel';
import AgentTracingUI from './AgentTracingUI';

export function TracingPanelContainer({ traces = [], agents = [], handoffs = [], onTraceSelect, onSpanSelect }) {
  const [activeTab, setActiveTab] = useState('tracing');

  const tabs = [
    { key: 'tracing', label: '追踪' },
    { key: 'logs', label: '日志' },
  ];

  return (
    <div style={{
      background: 'var(--color-background-primary)',
      borderRadius: 'var(--border-radius-lg)',
      border: '0.5px solid var(--color-border-tertiary)',
      overflow: 'hidden',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        padding: '8px 12px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        background: 'var(--color-background-secondary)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '5px 14px',
              fontSize: '12px',
              fontWeight: 500,
              border: 'none',
              borderRadius: '99px',
              background: activeTab === tab.key ? '#378ADD' : 'transparent',
              color: activeTab === tab.key ? '#fff' : 'var(--color-text-tertiary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ padding: '0' }}>
        {activeTab === 'tracing' && (
          <AgentTracingUI
            traces={traces}
            agents={agents}
            handoffs={handoffs}
            onTraceSelect={onTraceSelect}
            onSpanSelect={onSpanSelect}
          />
        )}
        {activeTab === 'logs' && (
          <div style={{ border: 'none' }}>
            <TracingPanel
              traces={traces}
              onTraceSelect={onTraceSelect}
              onSpanSelect={onSpanSelect}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export { TracingPanel } from './TracingPanel';
export { default as AgentTracingUI } from './AgentTracingUI';
