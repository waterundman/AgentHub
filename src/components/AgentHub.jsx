import { useState, useEffect, useCallback } from "react";
import { useAgents, useVersions, usePipeline } from "../hooks";
import useKeyboardShortcuts, { getShortcutsHelp } from "../hooks/useKeyboardShortcuts";
import { useTheme } from "../hooks/useTheme";
import useSwipe from "../hooks/useSwipe";
import { DEFAULT_CONFIG } from "../services/api";
import { DEFAULT_TEMPLATES } from "../services/templates";
import Pipeline from "./Pipeline";
import LogPanel from "./LogPanel";
import ConfigPanel from "./ConfigPanel";
import ApiConfig from "./ApiConfig";
import TemplatesPanel from "./TemplatesPanel";
import ImportExport from "./ImportExport";
import ExecutionHistory from "./ExecutionHistory";
import ProjectManager from "./ProjectManager";
import TokenStatsPanel from "./TokenStatsPanel";
import PerformanceMonitor from "./PerformanceMonitor";
import AgentTemplates from "./AgentTemplates";
import AgentPerfComparison from "./AgentPerfComparison";
import { useExport } from "../utils/export";

export default function AgentHub() {
  const { agents, ready, init, persistAgents, addAgent } = useAgents();
  const [savedVers, setSavedVers] = useState(null);
  const { versions, setVersions, commitVer, revertTo, deleteVer } = useVersions(savedVers);
  const [apiConfig, setApiConfig] = useState(() => ({ ...DEFAULT_CONFIG }));
  const { running, statuses, logs, finalOutput, doneCount, tokenStats, run, stop, clearLogs } = usePipeline(apiConfig);

  const [task, setTask] = useState("");
  const [tab, setTab] = useState("run");
  const [openAgent, setOpenAgent] = useState(null);
  const [dependencies, setDependencies] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [subTab, setSubTab] = useState("templates");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { exportMarkdown, exportJSON } = useExport();

  useEffect(() => {
    (async () => {
      const vers = await init();
      setSavedVers(vers);
    })();
  }, [init]);

  useEffect(() => {
    if (agents.length > 0 && Object.keys(dependencies).length === 0) {
      const defaultDeps = {};
      for (let i = 1; i < agents.length; i++) {
        defaultDeps[agents[i].hash] = agents.slice(0, i).map(a => a.hash);
      }
      setDependencies(defaultDeps);
    }
  }, [agents]);

  const handleCommit = useCallback(async (agent, msg) => {
    const updated = await commitVer(agent, msg);
    setVersions(updated);
  }, [commitVer, setVersions]);

  const handleRevert = useCallback(async (agentHash, v) => {
    await revertTo(agentHash, v, agents, persistAgents);
    setOpenAgent(null);
  }, [agents, persistAgents, revertTo]);

  const handleDeleteVer = useCallback(async (agentHash, sha) => {
    await deleteVer(agentHash, sha);
  }, [deleteVer]);

  const handleAddAgent = useCallback(async () => {
    await addAgent(agents);
  }, [addAgent, agents]);

  const handleRun = useCallback(() => {
    run(task, agents, dependencies);
  }, [run, task, agents, dependencies]);

  const handleStop = useCallback(() => {
    stop();
  }, [stop]);

  const handleTemplateSelect = useCallback((tpl) => {
    setTask(tpl.task);
    const matchedAgents = agents.filter(a => tpl.agents.includes(a.name));
    if (matchedAgents.length > 0) {
      const deps = {};
      for (let i = 1; i < matchedAgents.length; i++) {
        deps[matchedAgents[i].hash] = matchedAgents.slice(0, i).map(a => a.hash);
      }
      setDependencies(deps);
    }
  }, [agents]);

  const handleImport = useCallback(async (importedAgents, importedVersions) => {
    await persistAgents(importedAgents);
    if (Object.keys(importedVersions).length > 0) {
      const merged = { ...versions };
      for (const [hash, vers] of Object.entries(importedVersions)) {
        merged[hash] = [...(merged[hash] || []), ...vers];
      }
      setVersions(merged);
    }
  }, [persistAgents, versions, setVersions]);

  const toggleDep = useCallback((agentHash, depHash) => {
    setDependencies(prev => {
      const current = prev[agentHash] || [];
      const updated = current.includes(depHash)
        ? current.filter(d => d !== depHash)
        : [...current, depHash];
      return { ...prev, [agentHash]: updated };
    });
  }, []);

  const handlers = useCallback(() => ({
    run: handleRun,
    stop: handleStop,
    clear_logs: clearLogs,
    tab_run: () => setTab("run"),
    tab_config: () => setTab("config"),
    tab_api: () => setTab("api"),
    tab_tools: () => setTab("tools"),
    toggle_shortcuts: () => setShowShortcuts(p => !p),
  }), [handleRun, handleStop, clearLogs]);

  useKeyboardShortcuts(handlers());

  const tabs = ["run", "config", "projects", "api", "tools"];
  const handleSwipeLeft = useCallback(() => {
    const idx = tabs.indexOf(tab);
    if (idx < tabs.length - 1) setTab(tabs[idx + 1]);
  }, [tab]);
  const handleSwipeRight = useCallback(() => {
    const idx = tabs.indexOf(tab);
    if (idx > 0) setTab(tabs[idx - 1]);
  }, [tab]);
  const swipeProps = useSwipe(handleSwipeLeft, handleSwipeRight);

  if (!ready) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>初始化中...</div>;

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1rem" }} {...swipeProps}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>⬡</div>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>AgentHub</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{agents.length} 个 agent · 轻量多 Agent 协作平台</div>
          </div>
        </div>
        <div style={{ display: "flex", background: "var(--color-background-secondary)", borderRadius: "8px", padding: "3px", gap: "2px" }}>
          {["run", "config", "projects", "api", "tools"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "4px 14px", fontSize: "12px", cursor: "pointer", background: tab === t ? "var(--color-background-primary)" : "transparent", color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: tab === t ? "0.5px solid var(--color-border-secondary)" : "none", borderRadius: "6px", fontFamily: "var(--font-sans)" }}>
              {t === "run" ? "运行" : t === "config" ? "配置" : t === "projects" ? "项目" : t === "api" ? "API" : "工具"}
            </button>
          ))}
          <button onClick={toggleTheme} title={isDark ? "切换亮色主题" : "切换暗色主题"} style={{ padding: "4px 10px", fontSize: "14px", cursor: "pointer", background: "transparent", color: "var(--color-text-secondary)", border: "none", borderRadius: "6px", fontFamily: "var(--font-sans)" }}>
            {isDark ? "☀" : "☾"}
          </button>
        </div>
      </div>

      {/* ══ RUN TAB ══════════════════════════════════════════ */}
      {tab === "run" && (
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
                <TemplatesPanel templates={[]} onSelect={handleTemplateSelect} />
              </div>
            )}
            <textarea value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleRun(); }} placeholder="输入任务描述... (Ctrl+Enter 启动)" disabled={running} rows={3}
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "10px 12px", fontSize: "14px", lineHeight: 1.6, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
              <button onClick={handleRun} disabled={running || !task.trim()} style={{ padding: "7px 18px", fontSize: "13px", fontWeight: 500, background: (!running && task.trim()) ? "var(--color-text-primary)" : "var(--color-background-secondary)", color: (!running && task.trim()) ? "var(--color-background-primary)" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", cursor: (!running && task.trim()) ? "pointer" : "not-allowed", fontFamily: "var(--font-sans)" }}>
                {running ? `处理中 ${doneCount}/${agents.length}` : "▶ 启动"}
              </button>
              {running && (
                <button onClick={handleStop} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid #E24B4A", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "#E24B4A", fontFamily: "var(--font-sans)" }}>
                  ■ 停止
                </button>
              )}
              {logs.length > 0 && !running && <button onClick={clearLogs} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>清空</button>}
              {logs.length > 0 && !running && tokenStats && (
                <>
                  <button onClick={() => exportMarkdown(logs, finalOutput, task)} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>导出 MD</button>
                  <button onClick={() => exportJSON(logs, finalOutput, task, tokenStats)} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>导出 JSON</button>
                </>
              )}
              {running && <div style={{ flex: 1, height: "3px", background: "var(--color-border-tertiary)", borderRadius: "2px", overflow: "hidden" }}><div style={{ height: "100%", background: "#1D9E75", width: `${(doneCount / agents.length) * 100}%`, transition: "width 0.6s ease", borderRadius: "2px" }} /></div>}
            </div>
          </div>

          <Pipeline agents={agents} statuses={statuses} dependencies={dependencies} />

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
      )}

      {/* ══ CONFIG TAB ═══════════════════════════════════════ */}
      {tab === "config" && (
        <>
          <ConfigPanel
            agents={agents}
            versions={versions}
            openAgent={openAgent}
            setOpenAgent={setOpenAgent}
            onPersistAgents={persistAgents}
            onCommit={handleCommit}
            onRevert={handleRevert}
            onDeleteVer={handleDeleteVer}
            dependencies={dependencies}
            onToggleDep={toggleDep}
            allAgents={agents}
          />
          <button onClick={handleAddAgent} style={{ marginTop: "10px", width: "100%", padding: "10px", fontSize: "13px", background: "transparent", color: "var(--color-text-secondary)", border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            + 添加 Agent
          </button>
        </>
      )}

      {/* ══ PROJECTS TAB ═════════════════════════════════════ */}
      {tab === "projects" && (
        <ProjectManager onLaunch={(agent) => {
          setTab("config");
          const existing = agents.find(a => a.name === agent.name);
          if (!existing) {
            const newAgent = {
              hash: `${agent.name}-${Date.now()}`,
              name: agent.name,
              subtitle: agent.subtitle,
              icon: agent.icon,
              colorKey: agent.colorKey,
              systemPrompt: agent.systemPrompt,
            };
            persistAgents([...agents, newAgent]);
          }
        }} />
      )}

      {/* ══ API TAB ══════════════════════════════════════════ */}
      {tab === "api" && (
        <ApiConfig config={apiConfig} onChange={setApiConfig} />
      )}

      {/* ══ TOOLS TAB ═══════════════════════════════════════ */}
      {tab === "tools" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", background: "var(--color-background-secondary)", borderRadius: "8px", padding: "3px", gap: "2px", width: "fit-content" }}>
            {["templates", "history", "perf", "io"].map(t => (
              <button key={t} onClick={() => setSubTab(t)} style={{ padding: "4px 14px", fontSize: "12px", cursor: "pointer", background: subTab === t ? "var(--color-background-primary)" : "transparent", color: subTab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: subTab === t ? "0.5px solid var(--color-border-secondary)" : "none", borderRadius: "6px", fontFamily: "var(--font-sans)" }}>
                {t === "templates" ? "模板" : t === "history" ? "历史" : t === "perf" ? "性能" : "导入导出"}
              </button>
            ))}
          </div>
          {subTab === "templates" && <AgentTemplates agents={agents} persistAgents={persistAgents} />}
          {subTab === "history" && <ExecutionHistory onSelect={(entry) => { setTask(entry.task); }} />}
          {subTab === "perf" && <AgentPerfComparison />}
          {subTab === "io" && <ImportExport agents={agents} versions={versions} onImport={handleImport} />}
        </div>
      )}

      {/* ══ SHORTCUTS MODAL ═════════════════════════════════ */}
      {showShortcuts && (
        <div onClick={() => setShowShortcuts(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "12px", padding: "20px 24px", maxWidth: "400px", width: "90%", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>快捷键</div>
              <button onClick={() => setShowShortcuts(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--color-text-tertiary)", padding: "4px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {getShortcutsHelp().map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{s.desc}</span>
                  <kbd style={{ fontSize: "11px", padding: "2px 8px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "4px", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scanbar { 0% { left: -45%; } 100% { left: 110%; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes tooltipFadeIn { from { opacity: 0; transform: translate(-50%, 4px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
      <PerformanceMonitor />
    </div>
  );
}
