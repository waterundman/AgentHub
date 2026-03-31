import { useState, useCallback, memo } from "react";
import { COLORS } from "../../constants/colors";
import { shortHash } from "../../utils/hash";

export default memo(function ExecutionQueue({ agents, dependencies, onReorder, onRemove, onClear }) {
  const [expanded, setExpanded] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    onReorder?.(draggedIdx, idx);
    setDraggedIdx(idx);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
  };

  if (!agents.length) return null;

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      overflow: "hidden",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", cursor: "pointer",
        background: "var(--color-background-secondary)",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          执行队列 ({agents.length})
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {onClear && agents.length > 1 && (
            <button onClick={(e) => { e.stopPropagation(); onClear(); }} style={{
              fontSize: "10px", padding: "2px 8px",
              background: "transparent", border: "0.5px solid var(--color-border-tertiary)",
              borderRadius: "5px", cursor: "pointer", color: "var(--color-text-tertiary)",
              fontFamily: "var(--font-sans)",
            }}>清空</button>
          )}
          <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{expanded ? "▲" : "▼"}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "10px" }}>
          {agents.map((agent, idx) => {
            const c = COLORS[agent.colorKey] || COLORS.purple;
            const deps = dependencies?.[agent.hash] || [];
            return (
              <div key={agent.hash} draggable onDragStart={() => handleDragStart(idx)} onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd} style={{
                display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px",
                background: draggedIdx === idx ? c.fill : "var(--color-background-secondary)",
                borderRadius: "6px", marginBottom: "4px",
                border: `0.5px solid ${draggedIdx === idx ? c.stroke : "var(--color-border-tertiary)"}`,
                cursor: "grab", transition: "all 0.15s ease",
              }}>
                <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", width: "16px", textAlign: "center" }}>{idx + 1}</span>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: c.fill, border: `1px solid ${c.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 500, color: c.text }}>{agent.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)" }}>{agent.name}</div>
                  {deps.length > 0 && (
                    <div style={{ fontSize: "9px", color: "var(--color-text-tertiary)" }}>依赖: {deps.map(d => shortHash(d)).join(", ")}</div>
                  )}
                </div>
                {onRemove && agents.length > 1 && (
                  <button onClick={() => onRemove(agent.hash)} style={{
                    fontSize: "10px", padding: "2px 6px",
                    background: "transparent", border: "0.5px solid var(--color-border-tertiary)",
                    borderRadius: "4px", cursor: "pointer", color: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-sans)",
                  }}>✕</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
