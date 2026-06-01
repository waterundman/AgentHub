import { memo, useState } from "react";
import { COLORS } from "../../constants/colors";
import { shortHash } from "../../utils/hash";
import HashBadge from "../HashBadge";
import { STATUS_MAP } from "../../constants/colors";
import Tooltip from "../Tooltip";
import { Icon, Check, X, Loader, Circle } from "../Icon";
import { ToolUseTagList } from "../ToolUseTag";

export default memo(function Pipeline({ agents, statuses, dependencies, onRemoveDep, toolCalls = {} }) {
  const hasDeps = dependencies && Object.keys(dependencies).some(k => dependencies[k].length > 0);
  const [hoveredHash, setHoveredHash] = useState(null);

  return (
    <div style={{ padding: "14px 16px", marginBottom: "1rem", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>流水线</div>
        {hasDeps && <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: "#E6F1FB", color: "#185FA5", border: "0.5px solid #378ADD" }}>DAG 模式</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", overflowX: "auto", gap: 0, paddingBottom: "4px" }}>
        {agents.map((agent, i) => {
          const c = COLORS[agent.colorKey] || COLORS.purple;
          const s = statuses[agent.hash] || "idle";
          const isDone = s === "done", isRunning = s === "running", isError = s === "error";
          const deps = dependencies?.[agent.hash] || [];
          const isHovered = hoveredHash === agent.hash;

          const tooltipContent = agent.systemPrompt
            ? `📋 ${agent.name}（${agent.subtitle}）\n\n${agent.systemPrompt}`
            : `${agent.name}（${agent.subtitle}）`;

          return (
            <div key={agent.hash} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Tooltip text={tooltipContent} position="bottom" maxWidth={320}>
                <div
                  onMouseEnter={() => setHoveredHash(agent.hash)}
                  onMouseLeave={() => setHoveredHash(null)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                    padding: "10px 14px",
                    background: isHovered ? c.fill : (isDone || isRunning) ? c.fill : "var(--color-background-primary)",
                    border: `${isRunning ? "1.5" : "0.5"}px solid ${isError ? "#E24B4A" : isHovered ? c.stroke : (isDone || isRunning) ? c.stroke : "var(--color-border-secondary)"}`,
                    borderRadius: "var(--border-radius-md)", minWidth: "84px", position: "relative",
                    overflow: "hidden", transition: "all 0.35s ease", boxSizing: "border-box",
                    cursor: "default",
                    transform: isHovered ? "translateY(-2px)" : "none",
                    boxShadow: isHovered ? `0 4px 12px ${c.stroke}33` : "none",
                  }}
                >
                  {isRunning && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "2px", overflow: "hidden" }}><div style={{ position: "absolute", height: "100%", width: "45%", background: c.mid, animation: "scanbar 1.1s ease-in-out infinite" }} /></div>}
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: isDone ? c.stroke : isRunning ? c.fill : "var(--color-background-secondary)", border: `1.5px solid ${(isDone || isRunning) ? c.stroke : "var(--color-border-secondary)"}`, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.35s ease" }}>
                    {isDone ? <Icon name="Check" size={14} color="#fff" /> : isError ? <Icon name="X" size={14} color="#E24B4A" /> : isRunning ? <Icon name="Loader" size={14} color={c.text} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon name="Circle" size={14} color="var(--color-text-secondary)" />}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>{agent.name}</span>
                  <HashBadge hash={agent.hash} color={isDone || isRunning ? c : null} />
                  <span style={{ fontSize: "10px", color: STATUS_MAP[s]?.color, fontWeight: s !== "idle" ? 500 : 400 }}>{STATUS_MAP[s]?.label}</span>
                  {toolCalls[agent.hash] && toolCalls[agent.hash].length > 0 && (
                    <div style={{ marginTop: "4px", maxWidth: "120px" }}>
                      <ToolUseTagList records={toolCalls[agent.hash].slice(0, 3)} />
                      {toolCalls[agent.hash].length > 3 && (
                        <span style={{ fontSize: "9px", color: "var(--color-text-tertiary)", marginTop: "2px", display: "block" }}>
                          +{toolCalls[agent.hash].length - 3} 更多
                        </span>
                      )}
                    </div>
                  )}
                  {deps.length > 0 && (
                    <div style={{ display: "flex", gap: "3px", flexWrap: "wrap", justifyContent: "center" }}>
                      {deps.map(d => (
                        <span key={d} style={{ fontSize: "9px", padding: "1px 4px", borderRadius: "3px", background: "#FAEEDA", color: "#854F0B", border: "0.5px solid #BA7517" }}>
                          ← {shortHash(d)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Tooltip>
              {i < agents.length - 1 && <div style={{ padding: "0 3px", fontSize: "16px", color: isDone ? c.stroke : "var(--color-text-tertiary)", transition: "color 0.35s ease" }}>›</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
});
