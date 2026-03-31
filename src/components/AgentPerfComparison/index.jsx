import { useState, memo } from "react";
import { formatCost, formatTokens } from "../services/tokenPricing";
import { COLORS } from "../constants/colors";

const STORAGE_PERF_HISTORY = "agenthub_perf_history_v1";

function loadPerfHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_PERF_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePerfHistory(history) {
  try {
    localStorage.setItem(STORAGE_PERF_HISTORY, JSON.stringify(history.slice(0, 50)));
  } catch {}
}

export default memo(function AgentPerfComparison() {
  const [expanded, setExpanded] = useState(false);
  const history = loadPerfHistory();

  if (history.length === 0) return null;

  const agentStats = {};
  for (const run of history) {
    if (!run.tokenStats?.agents) continue;
    for (const [hash, data] of Object.entries(run.tokenStats.agents)) {
      if (!agentStats[hash]) {
        agentStats[hash] = { name: data.name, runs: 0, totalTokens: 0, totalCost: 0, totalDuration: 0, totalOutput: 0 };
      }
      agentStats[hash].runs += 1;
      agentStats[hash].totalTokens += data.totalTokens || 0;
      agentStats[hash].totalCost += data.cost?.total || 0;
      agentStats[hash].totalDuration += data.duration || 0;
      agentStats[hash].totalOutput += data.outputTokens || 0;
    }
  }

  const entries = Object.values(agentStats).sort((a, b) => b.totalCost - a.totalCost);
  const maxCost = Math.max(...entries.map(e => e.totalCost), 0.001);

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", cursor: "pointer",
        background: "var(--color-background-secondary)",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Agent 性能对比 ({entries.length})
        </div>
        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "8px", marginBottom: "8px", fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase" }}>
            <span>Agent</span>
            <span style={{ textAlign: "right" }}>运行次数</span>
            <span style={{ textAlign: "right" }}>总 Token</span>
            <span style={{ textAlign: "right" }}>总成本</span>
            <span style={{ textAlign: "right" }}>平均速率</span>
          </div>
          {entries.map((agent, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", gap: "8px",
              padding: "8px 0", borderTop: "0.5px solid var(--color-border-tertiary)",
              fontSize: "12px", alignItems: "center",
            }}>
              <div>
                <div style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{agent.name}</div>
                <div style={{ height: "4px", background: "var(--color-background-secondary)", borderRadius: "2px", marginTop: "4px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(agent.totalCost / maxCost) * 100}%`, background: "#BA7517", borderRadius: "2px" }} />
                </div>
              </div>
              <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{agent.runs}</span>
              <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{formatTokens(agent.totalTokens)}</span>
              <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "#1D9E75" }}>{formatCost(agent.totalCost)}</span>
              <span style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>
                {agent.totalDuration > 0 ? Math.round(agent.totalOutput / (agent.totalDuration / 1000)) : 0} tok/s
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
