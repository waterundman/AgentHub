import React from 'react';
import { Icon } from '../../Icon/index';
import AgentTemplates from '../../AgentTemplates/index';
import ExecutionHistory from '../../ExecutionHistory/index';
import AgentPerfComparison from '../../AgentPerfComparison/index';
import ImportExport from '../../ImportExport/index';

export const ToolsTab = React.memo(function ToolsTab({
  agents,
  versions,
  subTab,
  setSubTab,
  persistAgents,
  onImport,
  onShowImportWizard,
  onSelectHistory
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", background: "var(--color-background-secondary)", borderRadius: "8px", padding: "3px", gap: "2px", width: "fit-content" }}>
        {["templates", "history", "perf", "io"].map(t => (
          <button key={t} onClick={() => setSubTab(t)} style={{ padding: "4px 14px", fontSize: "12px", cursor: "pointer", background: subTab === t ? "var(--color-background-primary)" : "transparent", color: subTab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: subTab === t ? "0.5px solid var(--color-border-secondary)" : "none", borderRadius: "6px", fontFamily: "var(--font-sans)" }}>
            {t === "templates" ? "模板" : t === "history" ? "历史" : t === "perf" ? "性能" : "导入导出"}
          </button>
        ))}
      </div>
      
      <button 
        onClick={onShowImportWizard}
        style={{ 
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          padding: "12px 16px", 
          fontSize: "13px", 
          fontWeight: 500,
          background: "var(--color-background-info)", 
          color: "var(--color-border-info)", 
          border: "0.5px solid var(--color-border-info)", 
          borderRadius: "var(--border-radius-lg)", 
          cursor: "pointer", 
          fontFamily: "var(--font-sans)",
          transition: "all 0.2s ease"
        }}
      >
        <Icon name="Download" size={16} />
        从外部项目导入 Agent
      </button>
      
      {subTab === "templates" && <AgentTemplates agents={agents} persistAgents={persistAgents} />}
      {subTab === "history" && <ExecutionHistory onSelect={onSelectHistory} />}
      {subTab === "perf" && <AgentPerfComparison />}
      {subTab === "io" && <ImportExport agents={agents} versions={versions} onImport={onImport} />}
    </div>
  );
});