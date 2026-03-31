import { useState, useRef, useEffect, memo } from "react";

export default memo(function Tooltip({ text, children, position = "bottom", maxWidth = 280 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const positions = {
        bottom: { top: rect.bottom + 8, left: rect.left + rect.width / 2 },
        top: { top: rect.top - 8, left: rect.left + rect.width / 2 },
        right: { top: rect.top + rect.height / 2, left: rect.right + 8 },
        left: { top: rect.top + rect.height / 2, left: rect.left - 8 },
      };
      setPos(positions[position] || positions.bottom);
    }
  }, [visible, position]);

  if (!text) return children;

  return (
    <div
      ref={ref}
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div style={{
          position: "fixed",
          top: pos.top,
          left: pos.left,
          transform: "translate(-50%, 0)",
          zIndex: 9999,
          maxWidth,
          padding: "10px 14px",
          background: "var(--color-background-primary, #1a1a2e)",
          color: "var(--color-text-primary, #e0e0e0)",
          border: "0.5px solid var(--color-border-secondary, #333)",
          borderRadius: "8px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
          fontSize: "12px",
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          pointerEvents: "none",
          animation: "tooltipFadeIn 0.15s ease-out",
        }}>
          {text}
        </div>
      )}
    </div>
  );
});
