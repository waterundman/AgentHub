import { useRef, useEffect, useState, memo } from "react";
import { COLORS } from "../../constants/colors";
import HashBadge from "../HashBadge";

const ROW_HEIGHT = 120;
const OVERSCAN = 3;

const LogEntry = memo(function LogEntry({ log, agents }) {
  const ag = agents.find(a => a.hash === log.agentHash);
  const c = ag ? (COLORS[ag.colorKey] || COLORS.purple) : COLORS.purple;

  return (
    <div style={{ marginBottom: "10px" }}>
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
});

export default function LogPanel({ logs, agents }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const totalHeight = logs.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(logs.length, Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + OVERSCAN);
  const visibleLogs = logs.slice(startIndex, endIndex);
  const offsetY = startIndex * ROW_HEIGHT;

  if (!logs.length) return null;

  return (
    <div>
      <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.06em" }}>工作日志</div>
      <div
        ref={containerRef}
        onScroll={e => setScrollTop(e.target.scrollTop)}
        style={{ height: "320px", overflowY: "auto", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", padding: "10px", position: "relative" }}
      >
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ position: "absolute", top: offsetY, left: 0, right: 0 }}>
            {visibleLogs.map((log, i) => (
              <LogEntry key={log.id} log={log} agents={agents} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
