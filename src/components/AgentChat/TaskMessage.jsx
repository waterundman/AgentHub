import { COLORS } from "../../constants/colors";

const ACTION_CONFIG = {
  created: { icon: "📋", label: "创建任务", color: "#378ADD" },
  claimed: { icon: "✋", label: "认领任务", color: "#BA7517" },
  unclaimed: { icon: "↩️", label: "取消认领", color: "var(--color-text-tertiary)" },
  completed: { icon: "✅", label: "完成任务", color: "#1D9E75" },
};

export default function TaskMessage({ log, agents }) {
  const config = ACTION_CONFIG[log.action] || ACTION_CONFIG.created;
  const agent = log.details.agentHash
    ? agents.find((a) => a.hash === log.details.agentHash)
    : null;
  const ac = agent ? (COLORS[agent.colorKey] || COLORS.purple) : null;

  return (
    <div
      style={{
        marginBottom: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "4px 12px",
          borderRadius: "99px",
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-tertiary)",
          fontSize: "10px",
          color: "var(--color-text-tertiary)",
        }}
      >
        <span>{config.icon}</span>
        <span style={{ fontWeight: 500, color: config.color }}>
          {config.label}
        </span>
        {log.details.title && (
          <span
            style={{
              maxWidth: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: "var(--color-text-primary)",
            }}
          >
            {log.details.title}
          </span>
        )}
        {agent && (
          <span
            style={{
              padding: "1px 6px",
              borderRadius: "99px",
              background: ac.fill,
              color: ac.text,
              border: `0.5px solid ${ac.stroke}`,
              fontWeight: 500,
              fontSize: "9px",
            }}
          >
            {agent.name}
          </span>
        )}
        <span style={{ fontSize: "9px" }}>
          {new Date(log.timestamp).toLocaleTimeString("zh-CN", {
            hour12: false,
          })}
        </span>
      </div>
    </div>
  );
}
