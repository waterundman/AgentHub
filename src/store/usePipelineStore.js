import { create } from 'zustand';
import { callAgent, DEFAULT_CONFIG } from '../services/api';
import { calcCost } from '../services/tokenPricing';

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

export const usePipelineStore = create((set, get) => ({
  // 状态
  running: false,
  statuses: {},
  logs: [],
  finalOutput: "",
  doneCount: 0,
  tokenStats: null,
  abortController: null,

  // 操作
  run: async (task, agents, dependencies = {}, config = {}) => {
    const { running } = get();
    if (!task.trim() || running || !agents.length) return;
    
    const ctrl = new AbortController();
    set({ 
      abortController: ctrl,
      running: true, 
      logs: [], 
      finalOutput: "", 
      tokenStats: null,
      doneCount: 0,
      statuses: Object.fromEntries(agents.map(a => [a.hash, "idle"]))
    });
    
    const outputs = {};
    const activeConfig = { ...DEFAULT_CONFIG, ...config };
    const completed = new Set();
    const inProgress = new Set();
    const failed = new Set();
    const startTime = Date.now();
    const agentTokenData = {};

    const setStatus = (hash, s) => {
      set(state => ({
        statuses: { ...state.statuses, [hash]: s }
      }));
    };

    const streamLog = async (logId, fullText) => {
      for (let i = 12; i <= fullText.length; i += 12) {
        await new Promise(r => setTimeout(r, 18));
        set(state => ({
          logs: state.logs.map(l => l.id === logId ? { ...l, content: fullText.slice(0, i) } : l)
        }));
      }
      set(state => ({
        logs: state.logs.map(l => l.id === logId ? { ...l, content: fullText, done: true } : l)
      }));
    };

    const buildContext = (task, agent, agents, outputs, dependencies) => {
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
    };

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
      set(state => ({
        logs: [...state.logs, { 
          id: logId, 
          agentHash: agent.hash, 
          agentName: agent.name, 
          content: "", 
          done: false, 
          ts: new Date().toLocaleTimeString("zh-CN", { hour12: false }) 
        }]
      }));
      
      try {
        const agentConfig = { ...activeConfig, ...(agent.llmConfig || {}) };
        const result = await callAgent(agentConfig, agent.systemPrompt, ctx);
        const text = typeof result === "string" ? result : result.text;
        const usage = result.usage || { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };
        const duration = result.duration || 0;
        const tokenRate = result.tokenRate || 0;
        const cost = calcCost(agentConfig.provider, agentConfig.model, usage.inputTokens, usage.outputTokens, usage.cacheReadTokens, usage.cacheWriteTokens);

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
        set(state => ({ doneCount: state.doneCount + 1 }));
        return text;
      } catch (err) {
        set(state => ({
          logs: state.logs.map(l => l.id === logId ? { ...l, content: `❌ ${err.message}`, done: true, isError: true } : l)
        }));
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
        set({ finalOutput: outputs[lastCompleted[lastCompleted.length - 1].hash] || "" });
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
      set({ tokenStats: stats });

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

    } catch (error) {
      console.error('Pipeline error:', error);
      throw error;
    } finally {
      set({ running: false, abortController: null });
    }
  },

  stop: () => {
    const { abortController } = get();
    abortController?.abort();
  },

  clearLogs: () => {
    set({ logs: [], finalOutput: "", statuses: {}, tokenStats: null, doneCount: 0 });
  },
}));