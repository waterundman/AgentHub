import React from 'react';
import ConfigPanel from '../../ConfigPanel/index';

export const ConfigTab = React.memo(function ConfigTab({
  agents,
  versions,
  openAgent,
  setOpenAgent,
  dependencies,
  apiConfig,
  onPersistAgents,
  onCommit,
  onRevert,
  onDeleteVer,
  onToggleDep,
  onUpdateAgentLLMConfig,
  onAddAgent
}) {
  return (
    <>
      <ConfigPanel
        agents={agents}
        versions={versions}
        openAgent={openAgent}
        setOpenAgent={setOpenAgent}
        onPersistAgents={onPersistAgents}
        onCommit={onCommit}
        onRevert={onRevert}
        onDeleteVer={onDeleteVer}
        dependencies={dependencies}
        onToggleDep={onToggleDep}
        allAgents={agents}
        globalConfig={apiConfig}
        onUpdateAgentLLMConfig={onUpdateAgentLLMConfig}
      />
      <button onClick={onAddAgent} style={{ marginTop: "10px", width: "100%", padding: "10px", fontSize: "13px", background: "transparent", color: "var(--color-text-secondary)", border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
        + 添加 Agent
      </button>
    </>
  );
});