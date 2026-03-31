import { useState, useRef, useEffect, useCallback } from "react";

// ─── Hash ─────────────────────────────────────────────────────
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}
function shortHash(h) { return h.slice(0, 7); }
async function agentHash(name, colorKey, ts) {
  return sha256(`${name}::${colorKey}::${ts}::${Math.random()}`);
}

// ─── Constants ────────────────────────────────────────────────
const COLORS = {
  purple: { fill: "#EEEDFE", stroke: "#7F77DD", text: "#3C3489", mid: "#534AB7" },
  teal:   { fill: "#E1F5EE", stroke: "#1D9E75", text: "#085041", mid: "#0F6E56" },
  coral:  { fill: "#FAECE7", stroke: "#D85A30", text: "#4A1B0C", mid: "#993C1D" },
  blue:   { fill: "#E6F1FB", stroke: "#378ADD", text: "#042C53", mid: "#185FA5" },
  amber:  { fill: "#FAEEDA", stroke: "#BA7517", text: "#412402", mid: "#854F0B" },
  green:  { fill: "#EAF3DE", stroke: "#3B6D11", text: "#173404", mid: "#639922" },
};
const COLOR_KEYS = Object.keys(COLORS);
const ICON_CHARS = "ABCDEFGHIJKLMNOP";
const STATUS_MAP = {
  idle:    { label: "待机",   color: "var(--color-text-tertiary)" },
  running: { label: "工作中", color: "#BA7517" },
  done:    { label: "完成",   color: "#1D9E75" },
  error:   { label: "出错",   color: "#E24B4A" },
};

// Preset agents — hashes injected at init
const PRESET_DEFS = [
  { name: "规划师", subtitle: "Planner",    icon: "P", colorKey: "purple", systemPrompt: `You are a strategic planning agent. Break down the user's task into a clear numbered execution plan (3-5 steps). Be concise and actionable. Respond in Chinese.` },
  { name: "研究员", subtitle: "Researcher", icon: "R", colorKey: "teal",   systemPrompt: `You are a research and analysis agent. Based on the task and execution plan provided, analyze key considerations and provide relevant insights and background knowledge. Respond in Chinese.` },
  { name: "执行者", subtitle: "Executor",   icon: "E", colorKey: "coral",  systemPrompt: `You are an execution agent. Based on the task, plan, and research provided, produce the actual deliverable. Be thorough and high-quality. Respond in Chinese.` },
  { name: "审查员", subtitle: "Reviewer",   icon: "Q", colorKey: "blue",   systemPrompt: `You are a quality review agent. Review all previous work and produce an improved, polished final version. Respond in Chinese.` },
];

// ─── Diff ─────────────────────────────────────────────────────
function computeDiff(a, b) {
  if (a === b) return [];
  const al = a.split("\n"), bl = b.split("\n"), r = [];
  const max = Math.max(al.length, bl.length);
  for (let i = 0; i < max; i++) {
    if (al[i] === undefined) r.push({ type: "add", text: bl[i] });
    else if (bl[i] === undefined) r.push({ type: "del", text: al[i] });
    else if (al[i] !== bl[i]) { r.push({ type: "del", text: al[i] }); r.push({ type: "add", text: bl[i] }); }
    else r.push({ type: "same", text: al[i] });
  }
  return r;
}

// ─── Storage ──────────────────────────────────────────────────
const STORAGE_VERS = "agenthub_versions_v2";
const STORAGE_AGENTS = "agenthub_agents_v2";
async function load(key) { try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; } }
async function save(key, d) { try { await window.storage.set(key, JSON.stringify(d)); } catch {} }

function fmtTs(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }) + " " +
    d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─── Sub-components ───────────────────────────────────────────
function HashBadge({ hash, color, dim }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "10px",
      padding: "1px 6px", borderRadius: "4px",
      background: color ? color.fill : "var(--color-background-secondary)",
      color: color ? color.mid : "var(--color-text-tertiary)",
      border: `0.5px solid ${color ? color.stroke : "var(--color-border-tertiary)"}`,
      opacity: dim ? 0.7 : 1, letterSpacing: "0.03em", userSelect: "all"
    }}>{shortHash(hash)}</span>
  );
}

function DiffView({ lines, border }) {
  if (!lines.length) return null;
  return (
    <div style={{ background: "var(--color-background-primary)", border: `0.5px solid ${border || "var(--color-border-tertiary)"}`, borderRadius: "6px", overflow: "hidden", fontSize: "11px", fontFamily: "var(--font-mono)", lineHeight: 1.75 }}>
      {lines.map((d, i) => (
        <div key={i} style={{ padding: "0 8px", display: "flex", gap: "6px", background: d.type === "add" ? "#E1F5EE" : d.type === "del" ? "#FAECE7" : "transparent", color: d.type === "add" ? "#085041" : d.type === "del" ? "#993C1D" : "var(--color-text-secondary)" }}>
          <span style={{ minWidth: "12px", opacity: 0.6, userSelect: "none" }}>{d.type === "add" ? "+" : d.type === "del" ? "−" : " "}</span>
          <span style={{ wordBreak: "break-all" }}>{d.text || " "}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function AgentHub() {
  const [agents, setAgents] = useState([]);
  const [ready, setReady] = useState(false);
  const [task, setTask] = useState("");
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState({});
  const [logs, setLogs] = useState([]);
  const [finalOutput, setFinalOutput] = useState("");
  const [tab, setTab] = useState("run");
  const [openAgent, setOpenAgent] = useState(null);
  const [versions, setVersions] = useState({});
  const [vUI, setVUI] = useState({});
  const [commitMsg, setCommitMsg] = useState({});
  const [copied, setCopied] = useState(null);
  const logEndRef = useRef(null);

  // ── Init ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const [savedAgents, savedVers] = await Promise.all([load(STORAGE_AGENTS), load(STORAGE_VERS)]);
      if (savedAgents && savedAgents.length) {
        setAgents(savedAgents);
      } else {
        // First run: generate hashes for preset agents
        const withHashes = await Promise.all(PRESET_DEFS.map(async (d, i) => {
          const hash = await agentHash(d.name, d.colorKey, Date.now() + i);
          return { ...d, hash };
        }));
        setAgents(withHashes);
        await save(STORAGE_AGENTS, withHashes);
      }
      if (savedVers) setVersions(savedVers);
      setReady(true);
    })();
  }, []);

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  const persistAgents = useCallback(async (updated) => {
    setAgents(updated);
    await save(STORAGE_AGENTS, updated);
  }, []);

  // ── Version ops ───────────────────────────────────────────
  const getVers = hash => versions[hash] || [];

  const commitVer = async (agent, msg) => {
    // Each commit also gets its own content hash
    const contentHash = await sha256(agent.systemPrompt + agent.name + agent.colorKey + Date.now());
    const entry = {
      sha: shortHash(contentHash),       // short 7-char commit hash
      fullSha: contentHash,
      message: msg.trim() || "无备注",
      ts: Date.now(),
      name: agent.name,
      systemPrompt: agent.systemPrompt,
      colorKey: agent.colorKey,
    };
    const updated = { ...versions, [agent.hash]: [entry, ...(versions[agent.hash] || [])] };
    setVersions(updated);
    await save(STORAGE_VERS, updated);
    setCommitMsg(p => ({ ...p, [agent.hash]: "" }));
  };

  const revertTo = async (agentHash, v) => {
    const updated = agents.map(a => a.hash === agentHash ? { ...a, name: v.name, systemPrompt: v.systemPrompt, colorKey: v.colorKey } : a);
    await persistAgents(updated);
    setVUI(p => ({ ...p, [agentHash]: { panel: null } }));
  };

  const deleteVer = async (agentHash, sha) => {
    const updated = { ...versions, [agentHash]: (versions[agentHash] || []).filter(v => v.sha !== sha) };
    setVersions(updated);
    await save(STORAGE_VERS, updated);
  };

  // ── Run ops ───────────────────────────────────────────────
  const setStatus = (hash, s) => setStatuses(p => ({ ...p, [hash]: s }));

  const streamLog = async (logId, fullText) => {
    for (let i = 12; i <= fullText.length; i += 12) {
      await new Promise(r => setTimeout(r, 18));
      setLogs(p => p.map(l => l.id === logId ? { ...l, content: fullText.slice(0, i) } : l));
    }
    setLogs(p => p.map(l => l.id === logId ? { ...l, content: fullText, done: true } : l));
  };

  const callAgent = async (agent, content) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: agent.systemPrompt, messages: [{ role: "user", content }] })
    });
    if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${res.status}`); }
    const data = await res.json();
    return data.content?.find(b => b.type === "text")?.text || "(无输出)";
  };

  const run = async () => {
    if (!task.trim() || running || !agents.length) return;
    setRunning(true); setLogs([]); setFinalOutput("");
    setStatuses(Object.fromEntries(agents.map(a => [a.hash, "idle"])));
    const outputs = {};
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      setStatus(agent.hash, "running");
      let ctx = `任务：${task}`;
      if (i > 0) {
        ctx += "\n\n---前序工作成果---";
        for (let j = 0; j < i; j++) ctx += `\n\n[${agents[j].name} · ${shortHash(agents[j].hash)}]:\n${outputs[agents[j].hash]}`;
        ctx += "\n\n请基于以上成果，执行你的职责。";
      }
      const logId = `${Date.now()}-${i}`;
      setLogs(p => [...p, { id: logId, agentHash: agent.hash, agentName: agent.name, content: "", done: false, ts: new Date().toLocaleTimeString("zh-CN", { hour12: false }) }]);
      try {
        const out = await callAgent(agent, ctx);
        outputs[agent.hash] = out; await streamLog(logId, out); setStatus(agent.hash, "done");
        if (i === agents.length - 1) setFinalOutput(out);
      } catch (err) {
        setLogs(p => p.map(l => l.id === logId ? { ...l, content: `❌ ${err.message}`, done: true, isError: true } : l));
        setStatus(agent.hash, "error"); break;
      }
      if (i < agents.length - 1) await new Promise(r => setTimeout(r, 350));
    }
    setRunning(false);
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopied(hash); setTimeout(() => setCopied(null), 1500);
  };

  const doneCount = Object.values(statuses).filter(s => s === "done").length;
  const hasLogs = logs.length > 0;

  if (!ready) return <div style={{ padding: "2rem", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>初始化中...</div>;

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1rem" }}>
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
          {["run", "config"].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "4px 14px", fontSize: "12px", cursor: "pointer", background: tab === t ? "var(--color-background-primary)" : "transparent", color: tab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)", border: tab === t ? "0.5px solid var(--color-border-secondary)" : "none", borderRadius: "6px", fontFamily: "var(--font-sans)" }}>
              {t === "run" ? "运行" : "配置"}
            </button>
          ))}
        </div>
      </div>

      {/* ══ RUN TAB ══════════════════════════════════════════ */}
      {tab === "run" && (
        <>
          <div style={{ marginBottom: "1rem" }}>
            <textarea value={task} onChange={e => setTask(e.target.value)} onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "Enter") run(); }} placeholder="输入任务描述... (Ctrl+Enter 启动)" disabled={running} rows={3}
              style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "10px 12px", fontSize: "14px", lineHeight: 1.6, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
              <button onClick={run} disabled={running || !task.trim()} style={{ padding: "7px 18px", fontSize: "13px", fontWeight: 500, background: (!running && task.trim()) ? "var(--color-text-primary)" : "var(--color-background-secondary)", color: (!running && task.trim()) ? "var(--color-background-primary)" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", cursor: (!running && task.trim()) ? "pointer" : "not-allowed", fontFamily: "var(--font-sans)" }}>
                {running ? `处理中 ${doneCount}/${agents.length}` : "▶ 启动"}
              </button>
              {hasLogs && !running && <button onClick={() => { setLogs([]); setFinalOutput(""); setStatuses({}); }} style={{ padding: "7px 14px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>清空</button>}
              {running && <div style={{ flex: 1, height: "3px", background: "var(--color-border-tertiary)", borderRadius: "2px", overflow: "hidden" }}><div style={{ height: "100%", background: "#1D9E75", width: `${(doneCount / agents.length) * 100}%`, transition: "width 0.6s ease", borderRadius: "2px" }} /></div>}
            </div>
          </div>

          {/* Pipeline */}
          <div style={{ padding: "14px 16px", marginBottom: "1rem", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }}>
            <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", marginBottom: "12px", textTransform: "uppercase" }}>流水线</div>
            <div style={{ display: "flex", alignItems: "center", overflowX: "auto", gap: 0, paddingBottom: "4px" }}>
              {agents.map((agent, i) => {
                const c = COLORS[agent.colorKey] || COLORS.purple;
                const s = statuses[agent.hash] || "idle";
                const isDone = s === "done", isRunning = s === "running", isError = s === "error";
                const vList = getVers(agent.hash);
                return (
                  <div key={agent.hash} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", padding: "10px 14px", background: (isDone || isRunning) ? c.fill : "var(--color-background-primary)", border: `${isRunning ? "1.5" : "0.5"}px solid ${isError ? "#E24B4A" : (isDone || isRunning) ? c.stroke : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", minWidth: "84px", position: "relative", overflow: "hidden", transition: "all 0.35s ease", boxSizing: "border-box" }}>
                      {isRunning && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", overflow: "hidden" }}><div style={{ position: "absolute", height: "100%", width: "45%", background: c.mid, animation: "scanbar 1.1s ease-in-out infinite" }} /></div>}
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: isDone ? c.stroke : isRunning ? c.fill : "var(--color-background-secondary)", border: `1.5px solid ${(isDone || isRunning) ? c.stroke : "var(--color-border-secondary)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.35s ease" }}>
                        {isDone ? <span style={{ color: "#fff", fontSize: "14px", fontWeight: 500 }}>✓</span> : isError ? <span style={{ color: "#E24B4A", fontSize: "13px", fontWeight: 500 }}>✕</span> : <span style={{ fontSize: "12px", fontWeight: 500, color: isRunning ? c.text : "var(--color-text-secondary)" }}>{agent.icon}</span>}
                      </div>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>{agent.name}</span>
                      {/* Agent hash badge */}
                      <HashBadge hash={agent.hash} color={isDone || isRunning ? c : null} />
                      <span style={{ fontSize: "10px", color: STATUS_MAP[s]?.color, fontWeight: s !== "idle" ? 500 : 400 }}>{STATUS_MAP[s]?.label}</span>
                      {vList.length > 0 && <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>v{vList.length}</span>}
                    </div>
                    {i < agents.length - 1 && <div style={{ padding: "0 3px", fontSize: "16px", color: isDone ? c.stroke : "var(--color-text-tertiary)", transition: "color 0.35s ease" }}>›</div>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logs + Output */}
          {hasLogs && (
            <div style={{ display: "grid", gridTemplateColumns: finalOutput ? "minmax(0,1fr) minmax(0,1fr)" : "1fr", gap: "12px" }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>工作日志</div>
                <div style={{ height: "320px", overflowY: "auto", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", padding: "10px" }}>
                  {logs.map(log => {
                    const ag = agents.find(a => a.hash === log.agentHash);
                    const c = ag ? (COLORS[ag.colorKey] || COLORS.purple) : COLORS.purple;
                    return (
                      <div key={log.id} style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: c.fill, color: c.text, border: `0.5px solid ${c.stroke}`, fontWeight: 500 }}>{log.agentName}</span>
                          <HashBadge hash={log.agentHash} dim />
                          <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{log.ts}</span>
                          {!log.done && <span style={{ fontSize: "10px", color: "#BA7517" }}>处理中...</span>}
                        </div>
                        <div style={{ fontSize: "12px", lineHeight: 1.75, color: log.isError ? "var(--color-text-danger)" : "var(--color-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", background: "var(--color-background-primary)", padding: "7px 10px", borderRadius: "6px", border: "0.5px solid var(--color-border-tertiary)" }}>
                          {log.content || "\u00a0"}{!log.done && <span style={{ animation: "blink 0.9s step-start infinite" }}>▌</span>}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={logEndRef} />
                </div>
              </div>
              {finalOutput && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>最终输出</div>
                  <div style={{ height: "320px", overflowY: "auto", background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", border: "1px solid var(--color-border-info)", padding: "14px" }}>
                    <div style={{ fontSize: "13px", lineHeight: 1.8, color: "var(--color-text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{finalOutput}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══ CONFIG TAB ═══════════════════════════════════════ */}
      {tab === "config" && (
        <div>
          <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>每个 Agent 持有唯一 SHA-256 身份哈希，修改内容不会改变 ID。提交版本时自动生成内容哈希作为 commit hash。</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {agents.map((agent, idx) => {
              const c = COLORS[agent.colorKey] || COLORS.purple;
              const isOpen = openAgent === agent.hash;
              const vList = getVers(agent.hash);
              const latestV = vList[0];
              const ui = vUI[agent.hash] || {};
              const isDirty = latestV && (latestV.systemPrompt !== agent.systemPrompt || latestV.name !== agent.name || latestV.colorKey !== agent.colorKey);

              return (
                <div key={agent.hash} style={{ background: "var(--color-background-primary)", border: `0.5px solid ${isOpen ? c.stroke : "var(--color-border-tertiary)"}`, borderRadius: "var(--border-radius-lg)" }}>
                  {/* ── Header ── */}
                  <div onClick={() => setOpenAgent(isOpen ? null : agent.hash)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", background: isOpen ? c.fill : "transparent", borderRadius: isOpen ? "var(--border-radius-lg) var(--border-radius-lg) 0 0" : "var(--border-radius-lg)" }}>
                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", minWidth: "14px" }}>{idx + 1}</span>
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: c.fill, border: `1px solid ${c.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500, color: c.text }}>{agent.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{agent.name}</span>
                        {/* Clickable hash — copies full hash */}
                        <span onClick={e => { e.stopPropagation(); copyHash(agent.hash); }} title={agent.hash} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", padding: "1px 6px", borderRadius: "4px", background: c.fill, color: c.mid, border: `0.5px solid ${c.stroke}`, cursor: "pointer", letterSpacing: "0.03em", transition: "opacity 0.15s" }}>
                          {copied === agent.hash ? "已复制" : shortHash(agent.hash)}
                        </span>
                      </div>
                      <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginTop: "1px" }}>{agent.subtitle}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      {vList.length > 0 && <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: c.fill, color: c.mid, border: `0.5px solid ${c.stroke}`, fontWeight: 500 }}>{vList.length} 个版本</span>}
                      {isDirty && <span style={{ fontSize: "10px", padding: "2px 7px", borderRadius: "99px", background: "#FAEEDA", color: "#854F0B", border: "0.5px solid #BA7517", fontWeight: 500 }}>未提交</span>}
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>

                  {/* ── Expanded ── */}
                  {isOpen && (
                    <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                      {/* Full hash display */}
                      <div style={{ padding: "10px 14px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", fontWeight: 500 }}>Agent ID</span>
                        <span onClick={() => copyHash(agent.hash)} title="点击复制完整哈希" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--color-text-secondary)", cursor: "pointer", letterSpacing: "0.04em", wordBreak: "break-all" }}>
                          {agent.hash}
                        </span>
                        <span style={{ fontSize: "10px", color: copied === agent.hash ? "#1D9E75" : "var(--color-text-tertiary)", transition: "color 0.2s", flexShrink: 0 }}>
                          {copied === agent.hash ? "✓ 已复制" : "点击复制"}
                        </span>
                      </div>

                      <div style={{ padding: "10px 14px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>名称</label>
                            <input value={agent.name} onChange={e => { const u = agents.map(a => a.hash === agent.hash ? { ...a, name: e.target.value } : a); persistAgents(u); }}
                              style={{ width: "100%", boxSizing: "border-box", padding: "6px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>颜色</label>
                            <select value={agent.colorKey} onChange={e => { const u = agents.map(a => a.hash === agent.hash ? { ...a, colorKey: e.target.value } : a); persistAgents(u); }}
                              style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
                              {COLOR_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                          </div>
                        </div>
                        <div style={{ marginBottom: "12px" }}>
                          <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>系统提示词</label>
                          <textarea value={agent.systemPrompt} onChange={e => { const u = agents.map(a => a.hash === agent.hash ? { ...a, systemPrompt: e.target.value } : a); persistAgents(u); }} rows={4}
                            style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "8px 10px", fontSize: "12px", lineHeight: 1.6, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }} />
                        </div>

                        {/* Commit */}
                        <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
                          <input value={commitMsg[agent.hash] || ""} onChange={e => setCommitMsg(p => ({ ...p, [agent.hash]: e.target.value }))} placeholder="提交备注（可选）"
                            onKeyDown={e => { if (e.key === "Enter") commitVer(agent, commitMsg[agent.hash] || ""); }}
                            style={{ flex: 1, padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
                          <button onClick={() => commitVer(agent, commitMsg[agent.hash] || "")}
                            style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 500, background: c.stroke, color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", whiteSpace: "nowrap", fontFamily: "var(--font-sans)" }}>
                            提交版本
                          </button>
                          {vList.length > 0 && (
                            <button onClick={() => setVUI(p => ({ ...p, [agent.hash]: { ...ui, panel: ui.panel === "history" ? null : "history", diffSha: null } }))}
                              style={{ padding: "6px 12px", fontSize: "12px", background: ui.panel === "history" ? c.fill : "transparent", border: `0.5px solid ${ui.panel === "history" ? c.stroke : "var(--color-border-secondary)"}`, borderRadius: "var(--border-radius-md)", cursor: "pointer", color: ui.panel === "history" ? c.text : "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
                              历史 {ui.panel === "history" ? "▲" : "▼"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* ── Version history ── */}
                      {ui.panel === "history" && vList.length > 0 && (
                        <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", borderRadius: "0 0 var(--border-radius-lg) var(--border-radius-lg)" }}>
                          <div style={{ padding: "12px 14px 4px" }}>
                            <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>提交历史</div>
                            {vList.map((v, vi) => {
                              const isLatest = vi === 0;
                              const isDiffOpen = ui.diffSha === v.sha;
                              const prevPrompt = vi < vList.length - 1 ? vList[vi + 1].systemPrompt : "";
                              const dLines = computeDiff(prevPrompt, v.systemPrompt);
                              const adds = dLines.filter(d => d.type === "add").length;
                              const dels = dLines.filter(d => d.type === "del").length;
                              return (
                                <div key={v.sha} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "3px" }}>
                                    <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: isLatest ? c.stroke : "var(--color-border-secondary)", flexShrink: 0 }} />
                                    {vi < vList.length - 1 && <div style={{ width: "1.5px", flex: 1, minHeight: "24px", background: "var(--color-border-tertiary)", marginTop: "2px" }} />}
                                  </div>
                                  <div style={{ flex: 1, paddingBottom: "4px" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                                      <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)" }}>{v.message}</span>
                                      {isLatest && <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "99px", background: c.fill, color: c.text, border: `0.5px solid ${c.stroke}` }}>HEAD</span>}
                                      {/* Commit hash */}
                                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--color-text-tertiary)", letterSpacing: "0.03em" }}>{v.sha}</span>
                                      <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{fmtTs(v.ts)}</span>
                                    </div>
                                    <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginTop: "1px" }}>{v.name}</div>
                                    <div style={{ display: "flex", gap: "6px", marginTop: "5px", alignItems: "center", flexWrap: "wrap" }}>
                                      <button onClick={() => setVUI(p => ({ ...p, [agent.hash]: { ...ui, diffSha: isDiffOpen ? null : v.sha } }))}
                                        style={{ fontSize: "11px", padding: "2px 8px", background: isDiffOpen ? c.fill : "transparent", border: `0.5px solid ${isDiffOpen ? c.stroke : "var(--color-border-secondary)"}`, borderRadius: "5px", cursor: "pointer", color: isDiffOpen ? c.text : "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
                                        {isDiffOpen ? "收起 diff" : "查看 diff"}
                                      </button>
                                      {!isDiffOpen && (adds + dels > 0) && (
                                        <span style={{ fontSize: "11px" }}>
                                          <span style={{ color: "#1D9E75" }}>+{adds}</span>
                                          {dels > 0 && <span style={{ color: "#E24B4A", marginLeft: "3px" }}>−{dels}</span>}
                                        </span>
                                      )}
                                      {!isLatest && <button onClick={() => revertTo(agent.hash, v)} style={{ fontSize: "11px", padding: "2px 8px", background: "transparent", border: "0.5px solid #BA7517", borderRadius: "5px", cursor: "pointer", color: "#854F0B", fontFamily: "var(--font-sans)" }}>回滚至此</button>}
                                      <button onClick={() => deleteVer(agent.hash, v.sha)} style={{ fontSize: "11px", padding: "2px 8px", background: "transparent", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "5px", cursor: "pointer", color: "var(--color-text-tertiary)", fontFamily: "var(--font-sans)" }}>删除</button>
                                    </div>
                                    {isDiffOpen && dLines.length > 0 && <div style={{ marginTop: "8px" }}><DiffView lines={dLines} /></div>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {isDirty && latestV && (
                            <div style={{ padding: "0 14px 12px" }}>
                              <div style={{ fontSize: "10px", fontWeight: 500, color: "#854F0B", marginBottom: "5px", textTransform: "uppercase", letterSpacing: "0.06em" }}>工作区 vs HEAD</div>
                              <DiffView lines={computeDiff(latestV.systemPrompt, agent.systemPrompt)} border="#BA7517" />
                            </div>
                          )}
                        </div>
                      )}

                      {agents.length > 1 && (
                        <div style={{ padding: "0 14px 12px" }}>
                          <button onClick={async () => { const u = agents.filter(a => a.hash !== agent.hash); await persistAgents(u); setOpenAgent(null); }}
                            style={{ padding: "5px 12px", fontSize: "12px", background: "transparent", color: "var(--color-text-danger)", border: "0.5px solid var(--color-border-danger)", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                            移除此 Agent
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button onClick={async () => {
            const idx = agents.length;
            const hash = await agentHash(`Agent ${idx + 1}`, COLOR_KEYS[idx % COLOR_KEYS.length], Date.now());
            const newAgent = { hash, name: `Agent ${idx + 1}`, subtitle: "Custom", icon: ICON_CHARS[idx % ICON_CHARS.length], colorKey: COLOR_KEYS[idx % COLOR_KEYS.length], systemPrompt: "You are a helpful agent. Based on the context from previous agents, complete your assigned task. Respond in Chinese." };
            await persistAgents([...agents, newAgent]);
          }} style={{ marginTop: "10px", width: "100%", padding: "10px", fontSize: "13px", background: "transparent", color: "var(--color-text-secondary)", border: "0.5px dashed var(--color-border-secondary)", borderRadius: "var(--border-radius-lg)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            + 添加 Agent
          </button>
        </div>
      )}

      <style>{`
        @keyframes scanbar { 0% { left: -45%; } 100% { left: 110%; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
