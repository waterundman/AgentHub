import { useState, useCallback, memo } from "react";
import { COLORS } from "../../constants/colors";
import { shortHash } from "../../utils/hash";
import { Icon, Copy, ChevronDown, ChevronUp } from "../Icon";
import { ToolUseTagList } from "../ToolUseTag";

export default memo(function LogEntry({ log, agents, expanded, onToggle }) {
  const [copied, setCopied] = useState(false);
  const ag = agents.find(a => a.hash === log.agentHash);
  const c = ag ? (COLORS[ag.colorKey] || COLORS.purple) : COLORS.purple;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(log.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }, [log.content]);

  const wordCount = log.content ? log.content.split(/\s+/).filter(Boolean).length : 0;
  const charCount = log.content ? log.content.length : 0;

  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "4px", flexWrap: "wrap" }}>
        <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: c.fill, color: c.text, border: `0.5px solid ${c.stroke}`, fontWeight: 500 }}>{log.agentName}</span>
        <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{shortHash(log.agentHash)}</span>
        <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{log.ts}</span>
        {!log.done && <span style={{ fontSize: "10px", color: "#BA7517" }}>处理中...</span>}
        {log.done && log.content && (
          <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{charCount} 字符 · {wordCount} 词</span>
        )}
        <button onClick={handleCopy} style={{
          marginLeft: "auto", fontSize: "10px", padding: "2px 8px",
          background: copied ? "#E1F5EE" : "transparent",
          border: `0.5px solid ${copied ? "#1D9E75" : "var(--color-border-tertiary)"}`,
          borderRadius: "5px", cursor: "pointer",
          color: copied ? "#1D9E75" : "var(--color-text-tertiary)",
          fontFamily: "var(--font-sans)",
          display: "flex", alignItems: "center", gap: "4px"
        }}>
          {copied ? <Icon name="Check" size={14} /> : <Icon name="Copy" size={14} />}
          {copied ? "已复制" : "复制"}
        </button>
        <button onClick={onToggle} style={{
          fontSize: "10px", padding: "2px 8px",
          background: "transparent",
          border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "5px", cursor: "pointer",
          color: "var(--color-text-tertiary)",
          fontFamily: "var(--font-sans)",
          display: "flex", alignItems: "center", gap: "4px"
        }}>
          {expanded ? <Icon name="ChevronUp" size={14} /> : <Icon name="ChevronDown" size={14} />}
          {expanded ? "收起" : "展开"}
        </button>
      </div>
      <div style={{
        fontSize: "12px", lineHeight: 1.75,
        color: log.isError ? "var(--color-text-danger)" : "var(--color-text-primary)",
        whiteSpace: "pre-wrap", wordBreak: "break-word",
        background: "var(--color-background-primary)",
        padding: expanded ? "10px" : "7px 10px",
        borderRadius: "6px",
        border: `0.5px solid ${log.isError ? "var(--color-border-danger)" : "var(--color-border-tertiary)"}`,
        maxHeight: expanded ? "none" : "120px",
        overflow: expanded ? "visible" : "hidden",
        transition: "all 0.2s ease",
      }}>
        {log.content || "\u00a0"}
        {!log.done && <span style={{ animation: "blink 0.9s step-start infinite" }}>▌</span>}
      </div>
      {log.toolCalls && log.toolCalls.length > 0 && (
        <div style={{ marginTop: '6px' }}>
          <ToolUseTagList records={log.toolCalls} />
        </div>
      )}
    </div>
  );
});
