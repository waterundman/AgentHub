import { memo } from "react";
import { shortHash } from "../utils/hash";

export default memo(function HashBadge({ hash, color, dim }) {
  return (
    <span style={{
      fontFamily: "var(--font-mono)", fontSize: "10px",
      padding: "1px 6px", borderRadius: "4px",
      background: color ? color.fill : "var(--color-background-secondary)",
      color: color ? color.mid : "var(--color-text-tertiary)",
      border: `0.5px solid ${color ? color.stroke : "var(--color-border-tertiary)"}`,
      opacity: dim ? 0.7 : 1, letterSpacing: "0.03em", userSelect: "all"
    }}>{shortHash(hash)}</span>
  );
}
