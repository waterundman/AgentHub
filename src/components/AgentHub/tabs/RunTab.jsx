import React from 'react';
import Pipeline from '../../Pipeline/index';
import LogPanel from '../../LogPanel/index';
import TemplatesPanel from '../../TemplatesPanel/index';
import TokenStatsPanel from '../../TokenStatsPanel/index';
import ExecutionQueue from '../../ExecutionQueue/index';
import AgentChat from '../../AgentChat/index';

export const RunTab = React.memo(function RunTab({
  task,
  setTask,
  running,
  agents,
  dependencies,
  statuses,
  logs,
  finalOutput,
  doneCount,
  tokenStats,
  apiConfig,
  showTemplates,
  setShowTemplates,
  onRun,
  onStop,
  onClearLogs,
  onTemplateSelect,
  onExportMD,
  onExportJSON,
  onReorder
}) {
  return (
    <>
      <div style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.06em" }}>任务</span>
          <button onClick={() => setShowTemplates(!showTemplates)} style={{ fontSize: "11px", padding: "2px 8px", background: showTemplates ? "var(--color-background-secondary)" : "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "5px", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
            {showTemplates ? "隐藏模板" : "使用模板"}
          </button>
        </div>
        {showTemplates && (
          <div style={{ marginBottom: "10px" }}>
            <TemplatesPanel templates={[]} onSelect={onTemplateSelect} />
          </div>
        )}
        <textarea value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onRun(); }} placeholder="输入任务描述... (Ctrl+Enter 启动)" disabled={running} rows={3}
          style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "10px 12px", fontSize: "14px", lineHeight: 1.6, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
          <button onClick={onRun} disabled={running || !task.trim()} style={{ padding: "7px 18px", fontSize: "13px", fontWeight: 500, background: (!running && task.trim()) ? "var(--color-text-primary)" : "var(--color-background-secondary)", color: (!running && task.trim()) ? "var(--color-background-primary)" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", cursor: (!running && task.trim()) ? "pointer" : "not-allowed", fontFamily: "var(--font-sans)" }}>
            {running ? `处理中 ${doneCount}/${agents.length}` : "▶ 启动"}
          </button>
          {running && (
            <button onClick={onStop} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid #E24B4A", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "#E24B4A", fontFamily: "var(--font-sans)" }}>
              ■ 停止
            </button>
          )}
          {logs.length > 0 && !running && <button onClick={onClearLogs} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>清空</button>}
          {logs.length > 0 && !running && tokenStats && (
            <>
              <button onClick={onExportMD} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>导出 MD</button>
              <button onClick={onExportJSON} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>导出 JSON</button>
            </>
          )}
          {running && <div style={{ flex: 1, height: "3px", background: "var(--color-border-tertiary)", borderRadius: "2px", overflow: "hidden" }}><div style={{ height: "100%", background: "#1D9E75", width: `${(doneCount / agents.length) * 100}%`, transition: "width 0.6s ease", borderRadius: "2px" }} /></div>}
        </div>
      </div>

      <Pipeline agents={agents} statuses={statuses} dependencies={dependencies} />

      {!running && (
        <div style={{ marginBottom: "12px" }}>
          <ExecutionQueue
            agents={agents}
            dependencies={dependencies}
            onReorder={onReorder}
          />
        </div>
      )}

      <div style={{ marginBottom: "12px" }}>
        <AgentChat agents={agents} logs={logs} running={running} />
      </div>

      {logs.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: finalOutput ? "minmax(0,1fr) minmax(0,1fr)" : "1fr", gap: "12px" }}>
            <LogPanel logs={logs} agents={agents} />
            {finalOutput && (
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>最终输出</div>
                <div style={{ height: "320px", overflowY: "auto", background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", border: "1px solid var(--color-border-info)", padding: "14px" }}>
                  <div style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{finalOutput}</div>
                </div>
              </div>
            )}
          </div>
          {!running && tokenStats && (
            <div style={{ marginTop: "12px" }}>
              <TokenStatsPanel stats={tokenStats} config={apiConfig} />
            </div>
          )}
        </>
      )}
    </>
  );
});