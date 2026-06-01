import { useState, useMemo } from "react";
import { useTaskStore } from "../../store/useTaskStore";
import { COLORS } from "../../constants/colors";
import TaskClaimPanel from "./TaskClaimPanel";

const STATUS_TABS = [
  { key: "pending", label: "待认领" },
  { key: "claimed", label: "进行中" },
  { key: "completed", label: "已完成" },
];

const PRIORITY_COLORS = {
  high: { bg: "#FDE8E8", color: "#9B1C1C", border: "#E24B4A" },
  medium: { bg: "#FAEEDA", color: "#412402", border: "#BA7517" },
  low: { bg: "#EAF3DE", color: "#173404", border: "#3B6D11" },
};

export default function TaskBoard({ agents }) {
  const { tasks } = useTaskStore();
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const filteredTasks = useMemo(
    () => tasks.filter((t) => t.status === activeTab),
    [tasks, activeTab]
  );

  const counts = useMemo(() => {
    const c = { pending: 0, claimed: 0, completed: 0 };
    tasks.forEach((t) => { if (c[t.status] !== undefined) c[t.status]++; });
    return c;
  }, [tasks]);

  const selectedTask = selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) : null;

  if (selectedTask) {
    return (
      <TaskClaimPanel
        task={selectedTask}
        agents={agents}
        onBack={() => setSelectedTaskId(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex", gap: "0", borderBottom: "0.5px solid var(--color-border-tertiary)",
      }}>
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: "8px 0", fontSize: "10px", fontWeight: 500,
            background: activeTab === tab.key ? "var(--color-background-primary)" : "transparent",
            color: activeTab === tab.key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
            border: "none", borderBottom: activeTab === tab.key ? "2px solid #378ADD" : "2px solid transparent",
            cursor: "pointer", fontFamily: "var(--font-sans)",
            letterSpacing: "0.04em",
          }}>
            {tab.label} ({counts[tab.key]})
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {filteredTasks.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "32px 0",
            fontSize: "11px", color: "var(--color-text-tertiary)",
          }}>
            暂无{STATUS_TABS.find((t) => t.key === activeTab)?.label}任务
          </div>
        ) : (
          filteredTasks.map((task) => {
            const pc = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
            const agent = task.claimedBy ? agents.find((a) => a.hash === task.claimedBy) : null;
            const ac = agent ? (COLORS[agent.colorKey] || COLORS.purple) : null;
            return (
              <div key={task.id} onClick={() => setSelectedTaskId(task.id)} style={{
                padding: "10px 12px", marginBottom: "6px",
                background: "var(--color-background-secondary)",
                border: "0.5px solid var(--color-border-tertiary)",
                borderRadius: "var(--border-radius-md)",
                cursor: "pointer", transition: "border-color 0.15s",
              }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#378ADD"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <span style={{
                    padding: "1px 6px", borderRadius: "99px", fontSize: "9px", fontWeight: 500,
                    background: pc.bg, color: pc.color, border: `0.5px solid ${pc.border}`,
                  }}>
                    {task.priority === "high" ? "高" : task.priority === "low" ? "低" : "中"}
                  </span>
                  <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--color-text-primary)", flex: 1 }}>
                    {task.title}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    {task.tags.slice(0, 3).map((tag) => (
                      <span key={tag} style={{
                        fontSize: "9px", padding: "1px 5px", borderRadius: "99px",
                        background: "var(--color-background-primary)",
                        color: "var(--color-text-tertiary)",
                        border: "0.5px solid var(--color-border-tertiary)",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  {agent && (
                    <span style={{
                      fontSize: "10px", padding: "1px 6px", borderRadius: "99px",
                      background: ac.fill, color: ac.text, border: `0.5px solid ${ac.stroke}`,
                      fontWeight: 500,
                    }}>
                      {agent.name}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
