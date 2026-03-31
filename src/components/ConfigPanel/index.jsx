import { useState, useMemo } from "react";
import { COLORS, COLOR_KEYS } from "../../constants/colors";
import { shortHash } from "../../utils/hash";
import { computeDiff, countChanges } from "../../utils/diff";
import { fmtTs } from "../../services/storage";
import HashBadge from "../HashBadge";
import DiffView from "../DiffView";
import Tooltip from "../Tooltip";

export default function ConfigPanel({
  agents,
  versions,
  openAgent,
  setOpenAgent,
  onPersistAgents,
  onCommit,
  onRevert,
  onDeleteVer,
  dependencies = {},
  onToggleDep,
  allAgents = [],
}) {
  const [vUI, setVUI] = useState({});
  const [commitMsg, setCommitMsg] = useState({});
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState("");

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash).catch(() => {});
    setCopied(hash); setTimeout(() => setCopied(null), 1500);
  };

  const getVers = hash => versions[hash] || [];

  const filteredAgents = useMemo(() => {
    if (!search.trim()) return agents;
    const q = search.toLowerCase();
    return agents.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.subtitle.toLowerCase().includes(q) ||
      a.systemPrompt.toLowerCase().includes(q) ||
      a.hash.toLowerCase().includes(q)
    );
  }, [agents, search]);

  return (
    <div>
      <p style={{ margin: "0 0 12px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>每个 Agent 持有唯一 SHA-256 身份哈希，修改内容不会改变 ID。提交版本时自动生成内容哈希作为 commit hash。</p>
      {agents.length > 3 && (
        <div style={{ marginBottom: "10px" }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索 Agent 名称、描述或提示词..."
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {filteredAgents.length === 0 && search && (
          <div style={{ textAlign: "center", padding: "20px", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
            未找到匹配的 Agent
          </div>
        )}
        {filteredAgents.map((agent, idx) => {
          const c = COLORS[agent.colorKey] || COLORS.purple;
          const isOpen = openAgent === agent.hash;
          const vList = getVers(agent.hash);
          const latestV = vList[0];
          const ui = vUI[agent.hash] || {};
          const isDirty = latestV && (latestV.systemPrompt !== agent.systemPrompt || latestV.name !== agent.name || latestV.colorKey !== agent.colorKey);

          return (
            <Tooltip key={agent.hash} text={agent.systemPrompt} position="right" maxWidth={300}>
              <div style={{ background: "var(--color-background-primary)", border: `0.5px solid ${isOpen ? c.stroke : "var(--color-border-tertiary)"}`, borderRadius: "var(--border-radius-lg)" }}>
                <div onClick={() => setOpenAgent(isOpen ? null : agent.hash)} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", cursor: "pointer", background: isOpen ? c.fill : "transparent", borderRadius: isOpen ? "var(--border-radius-lg) var(--border-radius-lg) 0 0" : "var(--border-radius-lg)" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)", minWidth: "14px" }}>{idx + 1}</span>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, background: c.fill, border: `1px solid ${c.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 500, color: c.text }}>{agent.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{agent.name}</span>
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

              {isOpen && (
                <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
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
                    {/* Dependencies */}
                    {allAgents.length > 1 && onToggleDep && (
                      <div style={{ marginBottom: "12px", padding: "10px", background: "var(--color-background-secondary)", borderRadius: "8px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>依赖的前序 Agent</div>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {allAgents.filter(a => a.hash !== agent.hash).map(a => {
                            const c = COLORS[a.colorKey] || COLORS.purple;
                            const isDep = (dependencies[agent.hash] || []).includes(a.hash);
                            return (
                              <button key={a.hash} onClick={() => onToggleDep(agent.hash, a.hash)}
                                style={{ padding: "3px 10px", fontSize: "11px", background: isDep ? c.fill : "transparent", border: `0.5px solid ${isDep ? c.stroke : "var(--color-border-tertiary)"}`, borderRadius: "99px", cursor: "pointer", color: isDep ? c.text : "var(--color-text-secondary)", fontFamily: "var(--font-sans)", transition: "all 0.15s" }}>
                                {isDep ? "✓ " : ""}{a.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "10px" }}>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>名称</label>
                        <input value={agent.name} onChange={e => { const u = agents.map(a => a.hash === agent.hash ? { ...a, name: e.target.value } : a); onPersistAgents(u); }}
                          style={{ width: "100%", boxSizing: "border-box", padding: "6px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>颜色</label>
                        <select value={agent.colorKey} onChange={e => { const u = agents.map(a => a.hash === agent.hash ? { ...a, colorKey: e.target.value } : a); onPersistAgents(u); }}
                          style={{ width: "100%", padding: "6px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
                          {COLOR_KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ marginBottom: "12px" }}>
                      <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>系统提示词</label>
                      <textarea value={agent.systemPrompt} onChange={e => { const u = agents.map(a => a.hash === agent.hash ? { ...a, systemPrompt: e.target.value } : a); onPersistAgents(u); }} rows={4}
                        style={{ width: "100%", boxSizing: "border-box", resize: "vertical", padding: "8px 10px", fontSize: "12px", lineHeight: 1.6, border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }} />
                    </div>

                    <div style={{ display: "flex", gap: "7px", alignItems: "center" }}>
                      <input value={commitMsg[agent.hash] || ""} onChange={e => setCommitMsg(p => ({ ...p, [agent.hash]: e.target.value }))} placeholder="提交备注（可选）"
                        onKeyDown={e => { if (e.key === "Enter") onCommit(agent, commitMsg[agent.hash] || ""); }}
                        style={{ flex: 1, padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
                      <button onClick={() => onCommit(agent, commitMsg[agent.hash] || "")}
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

                  {ui.panel === "history" && vList.length > 0 && (
                    <div style={{ borderTop: "0.5px solid var(--color-border-tertiary)", background: "var(--color-background-secondary)", borderRadius: "0 0 var(--border-radius-lg) var(--border-radius-lg)" }}>
                      <div style={{ padding: "12px 14px 4px" }}>
                        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "10px" }}>提交历史</div>
                        {vList.map((v, vi) => {
                          const isLatest = vi === 0;
                          const isDiffOpen = ui.diffSha === v.sha;
                          const prevPrompt = vi < vList.length - 1 ? vList[vi + 1].systemPrompt : "";
                          const dLines = computeDiff(prevPrompt, v.systemPrompt);
                          const { adds, dels } = countChanges(dLines);
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
                                  {!isLatest && <button onClick={() => onRevert(agent.hash, v)} style={{ fontSize: "11px", padding: "2px 8px", background: "transparent", border: "0.5px solid #BA7517", borderRadius: "5px", cursor: "pointer", color: "#854F0B", fontFamily: "var(--font-sans)" }}>回滚至此</button>}
                                  <button onClick={() => onDeleteVer(agent.hash, v.sha)} style={{ fontSize: "11px", padding: "2px 8px", background: "transparent", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "5px", cursor: "pointer", color: "var(--color-text-tertiary)", fontFamily: "var(--font-sans)" }}>删除</button>
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
                      <button onClick={async () => { const u = agents.filter(a => a.hash !== agent.hash); await onPersistAgents(u); setOpenAgent(null); }}
                        style={{ padding: "5px 12px", fontSize: "12px", background: "transparent", color: "var(--color-text-danger)", border: "0.5px solid var(--color-border-danger)", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
                        移除此 Agent
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Tooltip>
        );
        })}
      </div>
    </div>
  );
}
