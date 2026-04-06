import { memo } from "react";

export default memo(function DiffView({ lines, border }) {
  if (!lines.length) return null;
  return (
    <div style={{ background: "var(--color-background-primary)", border: `0.5px solid ${border || "var(--color-border-tertiary)"}`, borderRadius: "6px", overflow: "hidden", fontSize: "11px", fontFamily: "var(--font-mono)", lineHeight: 1.75 }}>
      {lines.map((d, i) => (
        <div key={i} style={{ padding: "0 8px", display: "flex", gap: "6px", background: d.type === "add" ? "#E1F5EE" : d.type === "del" ? "#FAECE7" : "transparent", color: d.type === "add" ? "#085041" : d.type === "del" ? "#993C1D" : "var(--color-text-secondary)" }}>
          <span style={{ minWidth: "12px", opacity: 0.6, userSelect: "none" }}>{d.type === "add" ? "+" : d.type === "del" ? "−" : " "}</span>
          <span style={{ wordBreak: "break-all" }}>{d.text || " "}</span>
        </div>
      ))}
    </div>
  );
});

