import React, { useState } from 'react';
import { Icon } from './Icon';
import { AgentImport } from './AgentImport';
import { AgentExport } from './AgentExport';
import { notify } from './NotificationSystem';

export function AgentFormatUI({ agents, persistAgents, onComplete }) {
  const [mode, setMode] = useState(null);

  const handleImportComplete = (manifest) => {
    notify(`成功导入 Agent: ${manifest.agent.name}`, 'success');
    setMode(null);
    if (onComplete) onComplete();
  };

  const handleExportComplete = (agent) => {
    notify(`成功导出 Agent: ${agent.name}`, 'success');
    setMode(null);
  };

  if (!mode) {
    return (
      <div className="agent-format-ui">
        <h3>
          <Icon name="Package" size={16} />
          Agent 格式
        </h3>
        <p className="description">
          导入或导出 .agent 文件，方便分享和备份 Agent 配置
        </p>

        <div className="format-actions">
          <button onClick={() => setMode('import')} className="import-btn">
            <Icon name="Download" size={20} />
            <span>导入 Agent</span>
            <span className="hint">从 .agent 文件导入</span>
          </button>

          <button onClick={() => setMode('export')} className="export-btn">
            <Icon name="Upload" size={20} />
            <span>导出 Agent</span>
            <span className="hint">导出为 .agent 文件</span>
          </button>
        </div>

        <style>{`
          .agent-format-ui {
            padding: 16px;
            background: var(--color-background-primary);
            border-radius: 12px;
            border: 1px solid var(--color-border-secondary);
          }
          .agent-format-ui h3 {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 0 8px 0;
            font-size: 14px;
            font-weight: 600;
          }
          .description {
            font-size: 12px;
            color: var(--color-text-secondary);
            margin: 0 0 16px 0;
          }
          .format-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }
          .format-actions button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 20px;
            background: var(--color-background-secondary);
            border: 1px solid var(--color-border-tertiary);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }
          .format-actions button:hover {
            border-color: var(--color-border-secondary);
          }
          .format-actions button span:first-of-type {
            font-size: 13px;
            font-weight: 500;
          }
          .format-actions button .hint {
            font-size: 11px;
            color: var(--color-text-tertiary);
          }
        `}</style>
      </div>
    );
  }

  if (mode === 'import') {
    return (
      <AgentImport
        onComplete={handleImportComplete}
        onCancel={() => setMode(null)}
      />
    );
  }

  if (mode === 'export') {
    return (
      <AgentExport
        agents={agents}
        onComplete={handleExportComplete}
        onCancel={() => setMode(null)}
      />
    );
  }

  return null;
}
