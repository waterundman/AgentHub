import { memo } from "react";

function SkeletonLine({ width = "100%", height = "14px" }) {
  return (
    <div style={{
      width, height, borderRadius: "4px",
      background: "linear-gradient(90deg, var(--color-background-secondary) 25%, var(--color-background-info) 50%, var(--color-background-secondary) 75%)",
      backgroundSize: "200% 100%",
      animation: "skeletonShimmer 1.5s ease-in-out infinite",
    }} />
  );
}

export default memo(function Skeleton({ lines = 5, variant = "default" }) {
  if (variant === "agent-card") {
    return (
      <div style={{ padding: "14px 16px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)" }}>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", padding: "10px 14px", minWidth: "84px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "var(--color-background-secondary)", border: "1.5px solid var(--color-border-tertiary)" }} />
              <SkeletonLine width="60px" height="12px" />
              <SkeletonLine width="40px" height="10px" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine key={i} width={`${70 + Math.random() * 30}%`} />
      ))}
    </div>
  );
});
