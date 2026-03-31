import { useState, useCallback } from "react";
import { agentHash, sha256 } from "../utils/hash";
import { loadAgents, saveAgents, loadVersions, saveVersions } from "../services/storage";
import { callAgent, streamCallAgent, DEFAULT_CONFIG } from "../services/api";
import { calcCost, calcTokenRate } from "../services/tokenPricing";
import { PRESET_DEFS } from "../constants/presets";

const STORAGE_HISTORY = "agenthub_history_v1";
const STORAGE_TOKEN_STATS = "agenthub_token_stats_v1";

async function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function saveHistory(history) {
  try {
    localStorage.setItem(STORAGE_HISTORY, JSON.stringify(history));
  } catch {}
}

async function loadTokenStats() {
  try {
    const raw = localStorage.getItem(STORAGE_TOKEN_STATS);
    return raw ? JSON.parse(raw) : { runs: [], agents: {} };
  } catch { return { runs: [], agents: {} }; }
}

async function saveTokenStats(stats) {
  try {
    localStorage.setItem(STORAGE_TOKEN_STATS, JSON.stringify(stats));
  } catch {}
}

const COLOR_KEYS = ["purple", "teal", "coral", "blue", "amber", "green"];
const ICON_CHARS = "ABCDEFGHIJKLMNOP";

export function useAgents() {
  const [agents, setAgents] = useState([]);
  const [ready, setReady] = useState(false);

  const init = useCallback(async () => {
    const [savedAgents, savedVers] = await Promise.all([loadAgents(), loadVersions()]);
    if (savedAgents && savedAgents.length) {
      setAgents(savedAgents);
    } else {
      const withHashes = await Promise.all(PRESET_DEFS.map(async (d, i) => {
        const hash = await agentHash(d.name, d.colorKey, Date.now() + i);
        return { ...d, hash };
      }));
      setAgents(withHashes);
      await saveAgents(withHashes);
    }
    setReady(true);
    return savedVers;
  }, []);

  const persistAgents = useCallback(async (updated) => {
    setAgents(updated);
    await saveAgents(updated);
  }, []);

  const addAgent = useCallback(async (agents) => {
    const idx = agents.length;
    const hash = await agentHash(`Agent ${idx + 1}`, COLOR_KEYS[idx % COLOR_KEYS.length], Date.now());
    const newAgent = { hash, name: `Agent ${idx + 1}`, subtitle: "Custom", icon: ICON_CHARS[idx % ICON_CHARS.length], colorKey: COLOR_KEYS[idx % COLOR_KEYS.length], systemPrompt: "You are a helpful agent. Based on the context from previous agents, complete your assigned task. Respond in Chinese." };
    const updated = [...agents, newAgent];
    await persistAgents(updated);
    return updated;
  }, [persistAgents]);

  return { agents, ready, init, persistAgents, addAgent };
}

export function useVersions(initialVersions) {
  const [versions, setVersions] = useState(initialVersions || {});

  const commitVer = useCallback(async (agent, msg) => {
    const contentHash = await sha256(agent.systemPrompt + agent.name + agent.colorKey + Date.now());
    const entry = {
      sha: contentHash.slice(0, 7),
      fullSha: contentHash,
      message: msg.trim() || "无备注",
      ts: Date.now(),
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      colorKey: agent.colorKey,
    };
    const updated = { ...versions, [agent.hash]: [entry, ...(versions[agent.hash] || [])] };
    setVersions(updated);
    await saveVersions(updated);
    return updated;
  }, [versions]);

  const revertTo = useCallback(async (agentHash, v, agents, persistAgents) => {
    const updated = agents.map(a => a.hash === agentHash ? { ...a, name: v.name, systemPrompt: v.systemPrompt, colorKey: v.colorKey } : a);
    await persistAgents(updated);
  }, []);

  const deleteVer = useCallback(async (agentHash, sha) => {
    const updated = { ...versions, [agentHash]: (versions[agentHash] || []).filter(v => v.sha !== sha) };
    setVersions(updated);
    await saveVersions(updated);
  }, [versions]);

  return { versions, setVersions, commitVer, revertTo, deleteVer };
}

export function usePipeline(config) {
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [logs, setLogs] = useState([]);
  const [finalOutput, setFinalOutput] = useState("");
  const [abortController, setAbortController] = useState(null);
  const [tokenStats, setTokenStats] = useState(null);

  const setStatus = useCallback((hash, s) => setStatuses(p => ({ ...p, [hash]: s })), []);

  const streamLog = useCallback(async (logId, fullText) => {
    for (let i = 12; i <= fullText.length; i += 12) {
      await new Promise(r => setTimeout(r, 18));
      setLogs(p => p.map(l => l.id === logId ? { ...l, content: fullText.slice(0, i) } : l));
    }
    setLogs(p => p.map(l => l.id === logId ? { ...l, content: fullText, done: true } : l));
  }, []);

  const buildContext = useCallback((task, agent, agents, outputs, dependencies) => {
    let ctx = `任务：${task}`;
    const deps = dependencies[agent.hash] || [];
    if (deps.length > 0) {
      ctx += "\n\n---依赖的前序工作成果---";
      for (const depHash of deps) {
        const depAgent = agents.find(a => a.hash === depHash);
        if (depAgent && outputs[depHash]) {
          ctx += `\n\n[${depAgent.name} · ${depHash.slice(0, 7)}]:\n${outputs[depHash]}`;
        }
      }
      ctx += "\n\n请基于以上成果，执行你的职责。";
    }
    return ctx;
  }, []);

  const run = useCallback(async (task, agents, dependencies = {}) => {
    if (!task.trim() || running || !agents.length) return;
    const ctrl = new AbortController();
    setAbortController(ctrl);
    setRunning(true); setLogs([]); setFinalOutput(""); setTokenStats(null);
    setStatuses(Object.fromEntries(agents.map(a => [a.hash, "idle"])));
    const outputs = {};
    const activeConfig = { ...DEFAULT_CONFIG, ...config };
    const completed = new Set();
    const inProgress = new Set();
    const failed = new Set();
    const startTime = Date.now();
    const agentTokenData = {};

    const getReadyAgents = () => {
      return agents.filter(a => {
        if (completed.has(a.hash) || inProgress.has(a.hash) || failed.has(a.hash)) return false;
        const deps = dependencies[a.hash] || [];
        return deps.every(d => completed.has(d));
      });
    };

    const runAgent = async (agent, idx) => {
      inProgress.add(agent.hash);
      setStatus(agent.hash, "running");
      const ctx = buildContext(task, agent, agents, outputs, dependencies);
      const logId = `${Date.now()}-${idx}`;
      setLogs(p => [...p, { id: logId, agentHash: agent.hash, agentName: agent.name, content: "", done: false, ts: new Date().toLocaleTimeString("zh-CN", { hour12: false }) }]);
      try {
        const result = await callAgent(activeConfig, agent.systemPrompt, ctx);
        const text = typeof result === "string" ? result : result.text;
        const usage = result.usage || { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
        const duration = result.duration || 0;
        const tokenRate = result.tokenRate || 0;
        const cost = calcCost(activeConfig.provider, activeConfig.model, usage.inputTokens, usage.outputTokens, usage.cacheReadTokens, usage.cacheWriteTokens);

        outputs[agent.hash] = text;
        agentTokenData[agent.hash] = {
          name: agent.name,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
          cacheReadTokens: usage.cacheReadTokens,
          cacheWriteTokens: usage.cacheWriteTokens,
          totalTokens: usage.inputTokens + usage.outputTokens + usage.cacheReadTokens + usage.cacheWriteTokens,
          duration,
          tokenRate,
          cost,
        };

        await streamLog(logId, text);
        setStatus(agent.hash, "done");
        completed.add(agent.hash);
        inProgress.delete(agent.hash);
        return text;
      } catch (err) {
        setLogs(p => p.map(l => l.id === logId ? { ...l, content: `❌ ${err.message}`, done: true, isError: true } : l));
        setStatus(agent.hash, "error");
        failed.add(agent.hash);
        inProgress.delete(agent.hash);
        throw err;
      }
    };

    try {
      let iteration = 0;
      while (completed.size + failed.size < agents.length && !ctrl.signal.aborted) {
        const ready = getReadyAgents();
        if (ready.length === 0) {
          if (inProgress.size === 0) break;
          await new Promise(r => setTimeout(r, 50));
          continue;
        }

        if (ready.length === 1) {
          await runAgent(ready[0], iteration++);
        } else {
          await Promise.all(ready.map((a, i) => runAgent(a, iteration++ + i)));
        }
      }

      const lastCompleted = agents.filter(a => completed.has(a.hash));
      if (lastCompleted.length > 0) {
        setFinalOutput(outputs[lastCompleted[lastCompleted.length - 1].hash] || "");
      }

      const totalInput = Object.values(agentTokenData).reduce((s, d) => s + d.inputTokens, 0);
      const totalOutput = Object.values(agentTokenData).reduce((s, d) => s + d.outputTokens, 0);
      const totalCacheRead = Object.values(agentTokenData).reduce((s, d) => s + d.cacheReadTokens, 0);
      const totalCacheWrite = Object.values(agentTokenData).reduce((s, d) => s + d.cacheWriteTokens, 0);
      const totalCost = Object.values(agentTokenData).reduce((s, d) => s + (d.cost?.total || 0), 0);
      const totalDuration = Date.now() - startTime;

      const stats = {
        agents: agentTokenData,
        summary: {
          totalInput,
          totalOutput,
          totalCacheRead,
          totalCacheWrite,
          totalTokens: totalInput + totalOutput + totalCacheRead + totalCacheWrite,
          totalCost,
          totalDuration,
          agentCount: agents.length,
          completedCount: completed.size,
          failedCount: failed.size,
          avgTokenRate: Object.values(agentTokenData).reduce((s, d) => s + d.tokenRate, 0) / Math.max(Object.keys(agentTokenData).length, 1),
        },
        task,
        ts: startTime,
      };
      setTokenStats(stats);

      const history = await loadHistory();
      history.unshift({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        task,
        agents: agents.map(a => ({ name: a.name, hash: a.hash })),
        status: failed.size > 0 ? "failed" : "completed",
        ts: startTime,
        duration: totalDuration,
        tokenStats: stats,
        output: lastCompleted.length > 0 ? outputs[lastCompleted[lastCompleted.length - 1].hash] : "",
      });
      if (history.length > 100) history.length = 100;
      await saveHistory(history);

      const prevStats = await loadTokenStats();
      prevStats.runs.unshift(stats);
      if (prevStats.runs.length > 50) prevStats.runs.length = 50;
      for (const [hash, data] of Object.entries(agentTokenData)) {
        if (!prevStats.agents[hash]) prevStats.agents[hash] = { name: data.name, runs: 0, totalTokens: 0, totalCost: 0 };
        prevStats.agents[hash].runs += 1;
        prevStats.agents[hash].totalTokens += data.totalTokens;
        prevStats.agents[hash].totalCost += data.cost?.total || 0;
      }
      await saveTokenStats(prevStats);
    } catch {
    } finally {
      setRunning(false);
      setAbortController(null);
    }
  }, [running, config, setStatus, streamLog, buildContext]);

  const stop = useCallback(() => {
    abortController?.abort();
  }, [abortController]);

  const clearLogs = useCallback(() => {
    setLogs([]); setFinalOutput(""); setStatuses({}); setTokenStats(null);
  }, []);

  const doneCount = Object.values(statuses).filter(s => s === "done").length;

  return { running, statuses, logs, finalOutput, doneCount, tokenStats, run, stop, clearLogs };
}
