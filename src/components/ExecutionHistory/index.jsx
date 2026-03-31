import { useState, useEffect } from "react";
import { loadHistory, saveHistory } from "../services/storage";
import { fmtTs } from "../services/storage";

export default function ExecutionHistory({ onSelect }) {
  const [history, setHistory] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadHistory().then(setHistory).catch(() => setHistory([]));
  }, []);

  const filtered = filter
    ? history.filter(h => h.task?.toLowerCase().includes(filter.toLowerCase()) || h.agents?.some(a => a.name?.toLowerCase().includes(filter.toLowerCase())))
    : history;

  const clearHistory = async () => {
    setHistory([]);
    await saveHistory([]);
  };

  if (history.length === 0) {
    return (
      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "16px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
        暂无执行历史记录
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>执行历史 ({history.length})</div>
        <button onClick={clearHistory} style={{ fontSize: "11px", padding: "3px 10px", background: "transparent", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "5px", cursor: "pointer", color: "var(--color-text-tertiary)", fontFamily: "var(--font-sans)" }}>
          清空
        </button>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="搜索任务或 Agent..."
        style={{ width: "100%", boxSizing: "border-box", padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)", marginBottom: "10px" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "400px", overflowY: "auto" }}>
        {filtered.map((entry) => (
          <div key={entry.id} onClick={() => onSelect?.(entry)}
            style={{ padding: "10px 12px", background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "8px", cursor: "pointer", transition: "border-color 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: "8px" }}>
                {entry.task?.slice(0, 50) || "未命名任务"}{entry.task?.length > 50 ? "..." : ""}
              </span>
              <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", flexShrink: 0 }}>{fmtTs(entry.ts)}</span>
            </div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", alignItems: "center" }}>
              {entry.agents?.map((a, i) => (
                <span key={i} style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "99px", background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>{a.name}</span>
              ))}
              <span style={{ fontSize: "10px", color: entry.status === "completed" ? "#1D9E75" : entry.status === "failed" ? "#E24B4A" : "#BA7517", marginLeft: "auto" }}>
                {entry.status === "completed" ? "完成" : entry.status === "failed" ? "失败" : "进行中"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
