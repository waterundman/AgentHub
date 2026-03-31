import { useState, memo, useCallback } from "react";
import { COLORS } from "../../constants/colors";
import { shortHash } from "../../utils/hash";
import MonacoDiff from "../MonacoDiff";
import DiffView from "../DiffView";

export default memo(function OutputPreview({ logs, agents, finalOutput, tokenStats }) {
  const [selectedLog, setSelectedLog] = useState(null);
  const [diffMode, setDiffMode] = useState(false);

  const handleLogSelect = useCallback((log) => {
    setSelectedLog(log === selectedLog ? null : log);
  }, [selectedLog]);

  if (!logs.length && !finalOutput) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Log entries */}
      {logs.length > 0 && (
        <div>
          <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>Agent 输出</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {logs.map(log => {
              const ag = agents.find(a => a.hash === log.agentHash);
              const c = ag ? (COLORS[ag.colorKey] || COLORS.purple) : COLORS.purple;
              const isSelected = selectedLog?.id === log.id;
              return (
                <div key={log.id} style={{
                  border: `0.5px solid ${isSelected ? c.stroke : "var(--color-border-tertiary)"}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                  transition: "all 0.2s ease",
                }}>
                  <div onClick={() => handleLogSelect(log)} style={{
                    display: "flex", alignItems: "center", gap: "8px", padding: "8px 12px",
                    background: isSelected ? c.fill : "var(--color-background-secondary)",
                    cursor: "pointer",
                  }}>
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "99px", background: c.fill, color: c.text, border: `0.5px solid ${c.stroke}`, fontWeight: 500 }}>{log.agentName}</span>
                    <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}>{shortHash(log.agentHash)}</span>
                    <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginLeft: "auto" }}>{log.ts}</span>
                    <span style={{ fontSize: "10px", color: isSelected ? c.text : "var(--color-text-tertiary)" }}>{isSelected ? "▲" : "▼"}</span>
                  </div>
                  {isSelected && (
                    <div style={{ padding: "12px", background: "var(--color-background-primary)", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                      <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                        <button onClick={() => setDiffMode(false)} style={{
                          fontSize: "11px", padding: "3px 10px",
                          background: !diffMode ? c.fill : "transparent",
                          border: `0.5px solid ${!diffMode ? c.stroke : "var(--color-border-tertiary)"}`,
                          borderRadius: "5px", cursor: "pointer",
                          color: !diffMode ? c.text : "var(--color-text-secondary)",
                          fontFamily: "var(--font-sans)",
                        }}>文本视图</button>
                        <button onClick={() => setDiffMode(true)} style={{
                          fontSize: "11px", padding: "3px 10px",
                          background: diffMode ? c.fill : "transparent",
                          border: `0.5px solid ${diffMode ? c.stroke : "var(--color-border-tertiary)"}`,
                          borderRadius: "5px", cursor: "pointer",
                          color: diffMode ? c.text : "var(--color-text-secondary)",
                          fontFamily: "var(--font-sans)",
                        }}>Diff 视图</button>
                      </div>
                      {diffMode ? (
                        <MonacoDiff original="" modified={log.content || ""} language="markdown" height={250} />
                      ) : (
                        <pre style={{
                          margin: 0, padding: "10px", background: "var(--color-background-secondary)",
                          borderRadius: "6px", fontSize: "12px", lineHeight: 1.6,
                          whiteSpace: "pre-wrap", wordBreak: "break-word",
                          fontFamily: "var(--font-mono)", color: log.isError ? "var(--color-text-danger)" : "var(--color-text-primary)",
                          maxHeight: "250px", overflowY: "auto",
                        }}>
                          {log.content || "\u00a0"}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Final output */}
      {finalOutput && (
        <div>
          <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "8px" }}>最终输出</div>
          <pre style={{
            margin: 0, padding: "14px", background: "var(--color-background-primary)",
            borderRadius: "var(--border-radius-lg)", border: "1px solid var(--color-border-info)",
            fontSize: "13px", lineHeight: 1.8,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "var(--font-sans)", color: "var(--color-text-primary)",
            maxHeight: "400px", overflowY: "auto",
          }}>
            {finalOutput}
          </pre>
        </div>
      )}
    </div>
  );
});
