import React from 'react';
import { getShortcutsHelp } from '../../hooks/useKeyboardShortcuts';

export const AgentHubModals = React.memo(function AgentHubModals({
  showConfirm,
  showShortcuts,
  agents,
  onConfirmRun,
  onCloseConfirm,
  onCloseShortcuts
}) {
  return (
    <>
      {showConfirm && (
        <div onClick={onCloseConfirm} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "12px", padding: "24px", maxWidth: "360px", width: "90%", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "8px" }}>确认启动</div>
            <div style={{ fontSize: "13px", color: "var(--color-text-secondary)", marginBottom: "16px", lineHeight: 1.5 }}>
              即将启动 {agents.length} 个 Agent 协作执行任务，预计消耗较多 Token。是否继续？
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button onClick={onCloseConfirm} style={{ padding: "8px 16px", fontSize: "12px", background: "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>取消</button>
              <button onClick={onConfirmRun} style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 500, background: "var(--color-text-primary)", color: "var(--color-background-primary)", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>确认启动</button>
            </div>
          </div>
        </div>
      )}

      {showShortcuts && (
        <div onClick={onCloseShortcuts} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div onClick={e => e.stopPropagation()} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "12px", padding: "20px 24px", maxWidth: "400px", width: "90%", boxShadow: "0 12px 32px rgba(0,0,0,0.3)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>快捷键</div>
              <button onClick={onCloseShortcuts} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "var(--color-text-tertiary)", padding: "4px" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {getShortcutsHelp().map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>{s.desc}</span>
                  <kbd style={{ fontSize: "11px", padding: "2px 8px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "4px", fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
});