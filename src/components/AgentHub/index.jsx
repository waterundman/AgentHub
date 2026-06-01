import { useState, useEffect, useCallback } from "react";
import { useAgents, useVersions, usePipeline } from "../../hooks";
import useKeyboardShortcuts from "../../hooks/useKeyboardShortcuts";
import { useTheme } from "../../hooks/useTheme";
import useSwipe from "../../hooks/useSwipe";
import { DEFAULT_CONFIG } from "../../services/api";
import { setPluginManager } from "../../services/agentRunner";
import { initializePlugins, getPluginManager } from "../../services/pluginInit";
import { useExport } from "../../utils/export";
import { ImportWizard } from '../ImportWizard';
import PerformanceMonitor from "../PerformanceMonitor";
import NotificationSystem, { notify } from "../NotificationSystem";
import { AgentHubHeader } from "./AgentHubHeader";
import { AgentHubModals } from "./AgentHubModals";
import { RunTab } from "./tabs/RunTab";
import { ConfigTab } from "./tabs/ConfigTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { ApiTab } from "./tabs/ApiTab";
import { ToolsTab } from "./tabs/ToolsTab";

export default function AgentHub() {
  const { agents, ready, init, persistAgents, addAgent, updateAgentLLMConfig } = useAgents();
  const [savedVers, setSavedVers] = useState(null);
  const { versions, setVersions, commitVer, revertTo, deleteVer } = useVersions(savedVers);
  const [apiConfig, setApiConfig] = useState(() => ({ ...DEFAULT_CONFIG }));
  const { running, statuses, logs, finalOutput, doneCount, tokenStats, run, stop, clearLogs } = usePipeline(apiConfig);

  const [task, setTask] = useState("");
  const [tab, setTab] = useState("run");
  const [openAgent, setOpenAgent] = useState(null);
  const [dependencies, setDependencies] = useState({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [subTab, setSubTab] = useState("templates");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();
  const { exportMarkdown, exportJSON } = useExport();

  useEffect(() => {
    (async () => {
      const vers = await init();
      setSavedVers(vers);
      
      try {
        await initializePlugins();
        const manager = getPluginManager();
        setPluginManager(manager);
      } catch (error) {
        console.error('[AgentHub] Plugin system initialization failed:', error);
      }
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

  const handleRunWithConfirm = useCallback(() => {
    if (agents.length > 4) {
      setShowConfirm(true);
    } else {
      handleRun();
    }
  }, [handleRun, agents.length]);

  const confirmRun = useCallback(() => {
    setShowConfirm(false);
    handleRun();
  }, [handleRun]);

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

  const handleImportWizardComplete = useCallback(async (project) => {
    setShowImportWizard(false);
    
    const existingNames = new Set(agents.map(a => a.name));
    const newAgents = project.agents.filter(a => !existingNames.has(a.name));
    
    if (newAgents.length > 0) {
      await persistAgents([...agents, ...newAgents]);
      notify(`成功导入 ${newAgents.length} 个 Agent`, 'success');
    } else {
      notify('没有新的 Agent 可以导入', 'warning');
    }
  }, [agents, persistAgents]);

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
      <AgentHubHeader 
        agents={agents}
        tab={tab}
        onTabChange={setTab}
        onToggleTheme={toggleTheme}
        isDark={isDark}
      />

      {tab === "run" && (
        <RunTab 
          task={task}
          setTask={setTask}
          running={running}
          agents={agents}
          dependencies={dependencies}
          statuses={statuses}
          logs={logs}
          finalOutput={finalOutput}
          doneCount={doneCount}
          tokenStats={tokenStats}
          apiConfig={apiConfig}
          showTemplates={showTemplates}
          setShowTemplates={setShowTemplates}
          onRun={handleRunWithConfirm}
          onStop={handleStop}
          onClearLogs={clearLogs}
          onTemplateSelect={handleTemplateSelect}
          onExportMD={() => exportMarkdown(logs, finalOutput, task)}
          onExportJSON={() => exportJSON(logs, finalOutput, task, tokenStats)}
          onReorder={(from, to) => {
            const newAgents = [...agents];
            const [moved] = newAgents.splice(from, 1);
            newAgents.splice(to, 0, moved);
            persistAgents(newAgents);
          }}
        />
      )}

      {tab === "config" && (
        <ConfigTab 
          agents={agents}
          versions={versions}
          openAgent={openAgent}
          setOpenAgent={setOpenAgent}
          dependencies={dependencies}
          apiConfig={apiConfig}
          onPersistAgents={persistAgents}
          onCommit={handleCommit}
          onRevert={handleRevert}
          onDeleteVer={handleDeleteVer}
          onToggleDep={toggleDep}
          onUpdateAgentLLMConfig={updateAgentLLMConfig}
          onAddAgent={handleAddAgent}
        />
      )}

      {tab === "projects" && (
        <ProjectsTab 
          agents={agents}
          persistAgents={persistAgents}
          onSwitchToConfig={() => setTab("config")}
        />
      )}

      {tab === "api" && (
        <ApiTab 
          config={apiConfig} 
          onChange={setApiConfig} 
        />
      )}

      {tab === "tools" && (
        <ToolsTab 
          agents={agents}
          versions={versions}
          subTab={subTab}
          setSubTab={setSubTab}
          persistAgents={persistAgents}
          onImport={handleImport}
          onShowImportWizard={() => setShowImportWizard(true)}
          onSelectHistory={(entry) => setTask(entry.task)}
        />
      )}

      <AgentHubModals 
        showConfirm={showConfirm}
        showShortcuts={showShortcuts}
        agents={agents}
        onConfirmRun={confirmRun}
        onCloseConfirm={() => setShowConfirm(false)}
        onCloseShortcuts={() => setShowShortcuts(false)}
      />

      <style>{`
        @keyframes scanbar { 0% { left: -45%; } 100% { left: 110%; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes tooltipFadeIn { from { opacity: 0; transform: translate(-50%, 4px); } to { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      <PerformanceMonitor />
      <NotificationSystem />
      
      {showImportWizard && (
        <ImportWizard 
          onComplete={handleImportWizardComplete}
          onCancel={() => setShowImportWizard(false)}
        />
      )}
    </div>
  );
}