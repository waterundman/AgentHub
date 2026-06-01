import { useMemo } from "react";
import { useTaskStore } from "../../store/useTaskStore";
import { COLORS } from "../../constants/colors";

const PRIORITY_MAP = {
  high: { label: "高优先级", bg: "#FDE8E8", color: "#9B1C1C", border: "#E24B4A" },
  medium: { label: "中优先级", bg: "#FAEEDA", color: "#412402", border: "#BA7517" },
  low: { label: "低优先级", bg: "#EAF3DE", color: "#173404", border: "#3B6D11" },
};

const STATUS_LABEL = {
  pending: "待认领",
  claimed: "进行中",
  completed: "已完成",
};

export default function TaskClaimPanel({ task, agents, onBack }) {
  const { claimTask, unclaimTask, completeTask, taskLogs } = useTaskStore();

  const agent = task.claimedBy ? agents.find((a) => a.hash === task.claimedBy) : null;
  const ac = agent ? (COLORS[agent.colorKey] || COLORS.purple) : null;
  const pp = PRIORITY_MAP[task.priority] || PRIORITY_MAP.medium;

  const logs = useMemo(
    () => taskLogs.filter((l) => l.taskId === task.id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [taskLogs, task.id]
  );

  const logLabel = (action) => {
    switch (action) {
      case "created": return "创建任务";
      case "claimed": return "认领任务";
      case "unclaimed": return "取消认领";
      case "completed": return "完成任务";
      case "status_changed": return "状态变更";
      default: return action;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: "8px",
        padding: "10px 12px", borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: "14px", color: "var(--color-text-tertiary)", padding: "0 4px",
        }}>
          ←
        </button>
        <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          任务详情
        </span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "8px" }}>
          {task.title}
        </div>

        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{
            padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: 500,
            background: pp.bg, color: pp.color, border: `0.5px solid ${pp.border}`,
          }}>
            {pp.label}
          </span>
          <span style={{
            padding: "2px 8px", borderRadius: "99px", fontSize: "10px",
            background: "var(--color-background-primary)",
            color: "var(--color-text-tertiary)",
            border: "0.5px solid var(--color-border-tertiary)",
          }}>
            {STATUS_LABEL[task.status] || task.status}
          </span>
          {task.tags.map((tag) => (
            <span key={tag} style={{
              padding: "2px 8px", borderRadius: "99px", fontSize: "10px",
              background: "var(--color-background-primary)",
              color: "var(--color-text-tertiary)",
              border: "0.5px solid var(--color-border-tertiary)",
            }}>
              {tag}
            </span>
          ))}
        </div>

        {task.description && (
          <div style={{
            padding: "10px 12px", marginBottom: "12px",
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            fontSize: "12px", lineHeight: 1.6, color: "var(--color-text-primary)",
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            border: "0.5px solid var(--color-border-tertiary)",
          }}>
            {task.description}
          </div>
        )}

        {agent && (
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 12px", marginBottom: "12px",
            background: "var(--color-background-secondary)",
            borderRadius: "var(--border-radius-md)",
            border: "0.5px solid var(--color-border-tertiary)",
          }}>
            <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>认领者</span>
            <span style={{
              padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: 500,
              background: ac.fill, color: ac.text, border: `0.5px solid ${ac.stroke}`,
            }}>
              {agent.name}
            </span>
            {task.claimedAt && (
              <span style={{ fontSize: "10px", color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
                {new Date(task.claimedAt).toLocaleString("zh-CN", { hour12: false })}
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
          {task.status === "pending" && (
            <select id="claim-agent-select" style={{
              flex: 1, padding: "6px 10px", fontSize: "12px",
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-sans)",
            }}>
              <option value="">选择 Agent 认领...</option>
              {agents.map((a) => (
                <option key={a.hash} value={a.hash}>{a.name}</option>
              ))}
            </select>
          )}

          {task.status === "pending" && (
            <button onClick={() => {
              const sel = document.getElementById("claim-agent-select");
              if (sel?.value) claimTask(task.id, sel.value);
            }} style={{
              padding: "6px 14px", fontSize: "12px", fontWeight: 500,
              background: "#378ADD", color: "#fff", border: "none",
              borderRadius: "var(--border-radius-md)", cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}>
              认领
            </button>
          )}

          {task.status === "claimed" && (
            <>
              <button onClick={() => unclaimTask(task.id)} style={{
                padding: "6px 14px", fontSize: "12px", fontWeight: 500,
                background: "var(--color-background-secondary)",
                color: "var(--color-text-tertiary)", border: "0.5px solid var(--color-border-secondary)",
                borderRadius: "var(--border-radius-md)", cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}>
                取消认领
              </button>
              <button onClick={() => completeTask(task.id)} style={{
                padding: "6px 14px", fontSize: "12px", fontWeight: 500,
                background: "#1D9E75", color: "#fff", border: "none",
                borderRadius: "var(--border-radius-md)", cursor: "pointer",
                fontFamily: "var(--font-sans)",
              }}>
                完成
              </button>
            </>
          )}
        </div>

        <div style={{
          fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)",
          letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "8px",
        }}>
          操作记录
        </div>
        {logs.length === 0 ? (
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", textAlign: "center", padding: "12px 0" }}>
            暂无记录
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {logs.map((log) => {
              const detailAgent = log.details.agentHash ? agents.find((a) => a.hash === log.details.agentHash) : null;
              return (
                <div key={log.id} style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "6px 10px", fontSize: "10px",
                  background: "var(--color-background-secondary)",
                  borderRadius: "var(--border-radius-md)",
                  color: "var(--color-text-tertiary)",
                }}>
                  <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
                    {logLabel(log.action)}
                  </span>
                  {detailAgent && (
                    <span style={{
                      padding: "1px 5px", borderRadius: "99px",
                      background: (COLORS[detailAgent.colorKey] || COLORS.purple).fill,
                      color: (COLORS[detailAgent.colorKey] || COLORS.purple).text,
                      fontSize: "9px",
                    }}>
                      {detailAgent.name}
                    </span>
                  )}
                  {log.details.status && <span>{STATUS_LABEL[log.details.status] || log.details.status}</span>}
                  <span style={{ marginLeft: "auto", fontSize: "9px" }}>
                    {new Date(log.timestamp).toLocaleString("zh-CN", { hour12: false })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
