import React, { useState } from 'react';
import { Icon } from './Icon';

export function AgentExport({ agents, onComplete, onCancel }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleExport = async () => {
    if (!selectedAgent) return;

    setExporting(true);
    setProgress(0);
    setError(null);

    try {
      for (let i = 0; i <= 100; i += 20) {
        setProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const agentData = {
        manifest: {
          formatVersion: '1.0',
          agent: {
            name: selectedAgent.name,
            version: selectedAgent.version || '1.0.0',
            description: selectedAgent.description || '',
            icon: selectedAgent.icon || 'A',
            colorKey: selectedAgent.colorKey || 'purple'
          },
          runtime: {
            engine: 'agenthub',
            minVersion: '1.2.0'
          }
        },
        files: {
          'agent.js': `export const AGENT = ${JSON.stringify(selectedAgent, null, 2)};`
        }
      };

      const blob = new Blob([JSON.stringify(agentData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedAgent.name.toLowerCase().replace(/\s+/g, '-')}.agent`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      onComplete(selectedAgent);
    } catch (err) {
      setError(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="agent-export">
      <h3>
        <Icon name="Upload" size={16} />
        导出 Agent
      </h3>

      <div className="agent-list">
        {agents.map(agent => (
          <div
            key={agent.hash}
            className={`agent-item ${selectedAgent?.hash === agent.hash ? 'selected' : ''}`}
            onClick={() => setSelectedAgent(agent)}
          >
            <div className="agent-icon" style={{ background: `var(--color-${agent.colorKey})` }}>
              {agent.icon}
            </div>
            <div className="agent-info">
              <div className="agent-name">{agent.name}</div>
              <div className="agent-subtitle">{agent.subtitle}</div>
            </div>
            {selectedAgent?.hash === agent.hash && (
              <Icon name="Check" size={16} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="error-message">
          <Icon name="AlertCircle" size={14} />
          <span>{error}</span>
        </div>
      )}

      {exporting && (
        <div className="export-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span>{progress}%</span>
        </div>
      )}

      <div className="export-actions">
        <button onClick={onCancel} className="cancel-btn">
          取消
        </button>
        <button
          onClick={handleExport}
          disabled={!selectedAgent || exporting}
          className="export-btn"
        >
          <Icon name="Download" size={14} />
          导出 .agent 文件
        </button>
      </div>

      <style>{`
        .agent-export {
          padding: 16px;
          background: var(--color-background-primary);
          border-radius: 12px;
          border: 1px solid var(--color-border-secondary);
        }
        .agent-export h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0 0 16px 0;
          font-size: 14px;
          font-weight: 600;
        }
        .agent-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }
        .agent-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--color-background-secondary);
          border: 1px solid var(--color-border-tertiary);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .agent-item:hover {
          border-color: var(--color-border-secondary);
        }
        .agent-item.selected {
          border-color: var(--color-border-info);
          background: var(--color-background-info);
        }
        .agent-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          font-size: 16px;
          color: white;
        }
        .agent-name {
          font-size: 13px;
          font-weight: 500;
        }
        .agent-subtitle {
          font-size: 11px;
          color: var(--color-text-secondary);
        }
        .export-actions {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      `}</style>
    </div>
  );
}
