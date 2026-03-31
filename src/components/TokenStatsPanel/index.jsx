import { memo } from "react";
import { formatCost, formatTokens } from "../services/tokenPricing";

const TokenBar = memo(function TokenBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px" }}>
      <span style={{ width: "40px", color: "var(--color-text-tertiary)", flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: "6px", background: "var(--color-background-secondary)", borderRadius: "3px", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: "3px", transition: "width 0.3s ease" }} />
      </div>
      <span style={{ width: "50px", textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)" }}>{formatTokens(value)}</span>
    </div>
  );
});

export default memo(function TokenStatsPanel({ stats, config }) {
  if (!stats) return null;
  const { agents, summary } = stats;
  const agentEntries = Object.values(agents);
  const maxTokens = Math.max(...agentEntries.map(a => a.totalTokens), 1);

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Token 使用统计</div>
        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1D9E75" }}>{formatCost(summary.totalCost)}</div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "14px" }}>
        {[
          { label: "总 Token", value: formatTokens(summary.totalTokens), color: "var(--color-text-primary)" },
          { label: "输入", value: formatTokens(summary.totalInput), color: "#378ADD" },
          { label: "输出", value: formatTokens(summary.totalOutput), color: "#1D9E75" },
          { label: "耗时", value: `${(summary.totalDuration / 1000).toFixed(1)}s`, color: "#BA7517" },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: "center", padding: "8px", background: "var(--color-background-secondary)", borderRadius: "8px" }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginBottom: "2px" }}>{item.label}</div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: item.color, fontFamily: "var(--font-mono)" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Per-agent breakdown */}
      <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px" }}>各 Agent 详情</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {agentEntries.map((agent, i) => (
          <div key={i} style={{ padding: "10px", background: "var(--color-background-secondary)", borderRadius: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)" }}>{agent.name}</span>
              <span style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#1D9E75" }}>{formatCost(agent.cost?.total || 0)}</span>
            </div>
            <TokenBar label="输入" value={agent.inputTokens} max={maxTokens} color="#378ADD" />
            <TokenBar label="输出" value={agent.outputTokens} max={maxTokens} color="#1D9E75" />
            {agent.cacheReadTokens > 0 && <TokenBar label="缓存读" value={agent.cacheReadTokens} max={maxTokens} color="#BA7517" />}
            {agent.cacheWriteTokens > 0 && <TokenBar label="缓存写" value={agent.cacheWriteTokens} max={maxTokens} color="#D85A30" />}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px", fontSize: "10px", color: "var(--color-text-tertiary)" }}>
              <span>共 {formatTokens(agent.totalTokens)} tokens</span>
              <span>{agent.duration}ms · {agent.tokenRate} tok/s</span>
            </div>
          </div>
        ))}
      </div>

      {/* Average rate */}
      <div style={{ marginTop: "12px", padding: "8px 12px", background: "var(--color-background-info)", borderRadius: "6px", display: "flex", justifyContent: "space-between", fontSize: "11px" }}>
        <span style={{ color: "var(--color-text-secondary)" }}>平均 Token 速率</span>
        <span style={{ fontWeight: 600, fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{Math.round(summary.avgTokenRate)} tok/s</span>
      </div>
    </div>
  );
});
