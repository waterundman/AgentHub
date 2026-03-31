import { useRef, useEffect, useState, memo } from "react";
import { COLORS } from "../../constants/colors";
import HashBadge from "../HashBadge";
import LogEntry from "./LogEntry";

const ROW_HEIGHT = 150;
const OVERSCAN = 3;

export default memo(function LogPanel({ logs, agents }) {
  const containerRef = useRef(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(320);
  const [expandedLogs, setExpandedLogs] = useState({});

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

  const toggleLog = (logId) => {
    setExpandedLogs(prev => ({ ...prev, [logId]: !prev[logId] }));
  };

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
            {visibleLogs.map((log) => (
              <LogEntry key={log.id} log={log} agents={agents} expanded={!!expandedLogs[log.id]} onToggle={() => toggleLog(log.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
