import { useState, memo, useCallback } from "react";
import { PROJECT_AGENTS } from "../../services/projectAgents";
import { launchAgent } from "../../services/agentRunner";
import { COLORS } from "../../constants/colors";
import Tooltip from "../Tooltip";

const ProjectCard = memo(function ProjectCard({ agent, onResult }) {
  const c = COLORS[agent.colorKey] || COLORS.purple;
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  const [taskInput, setTaskInput] = useState("");
  const [output, setOutput] = useState(null);
  const [error, setError] = useState(null);

  const handleLaunch = useCallback(async () => {
    if (!taskInput.trim() && agent.name !== "清扫者") return;
    setRunning(true);
    setError(null);
    setOutput(null);
    try {
      const result = await launchAgent(agent.name, taskInput || "执行清理", {
        onProgress: (chunk) => {
          setOutput(prev => (prev ? prev + "\n" : "") + chunk.trim());
        },
      });
      setOutput(JSON.stringify(result, null, 2));
    } catch (err) {
      setError(err.message);
    } finally {
      setRunning(false);
    }
  }, [agent.name, taskInput]);

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      overflow: "hidden",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = c.stroke; e.currentTarget.style.boxShadow = `0 4px 12px ${c.stroke}22`; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--color-border-tertiary)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "10px",
            background: c.fill, border: `1.5px solid ${c.stroke}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "16px", fontWeight: 600, color: c.text, flexShrink: 0
          }}>
            {agent.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-primary)" }}>{agent.name}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{agent.subtitle} · v{agent.version}</div>
          </div>
        </div>

        <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: 1.5, margin: "0 0 10px" }}>
          {agent.description}
        </p>

        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "12px" }}>
          {agent.capabilities.map((cap, i) => (
            <Tooltip key={i} text={cap} position="top" maxWidth={200}>
              <span style={{
                fontSize: "10px", padding: "2px 8px", borderRadius: "99px",
                background: c.fill, color: c.text, border: `0.5px solid ${c.stroke}`,
                cursor: "default"
              }}>
                {cap}
              </span>
            </Tooltip>
          ))}
        </div>

        {/* Task Input */}
        <div style={{ marginBottom: "10px" }}>
          <textarea
            value={taskInput}
            onChange={e => setTaskInput(e.target.value)}
            placeholder={
              agent.name === "PPT 大师" ? "输入 PPT 主题或粘贴文档内容..." :
              agent.name === "生图" ? "输入图片描述，多张用换行分隔..." :
              agent.name === "清扫者" ? "点击直接执行系统清理" :
              "输入任务..."
            }
            disabled={running}
            rows={3}
            style={{
              width: "100%", boxSizing: "border-box", resize: "vertical",
              padding: "8px 10px", fontSize: "12px", lineHeight: 1.5,
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: "var(--border-radius-md)",
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              fontFamily: "var(--font-sans)",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleLaunch} disabled={running || (!taskInput.trim() && agent.name !== "清扫者")} style={{
            flex: 1, padding: "8px 14px", fontSize: "12px", fontWeight: 500,
            background: running ? "var(--color-background-secondary)" : c.stroke,
            color: running ? "var(--color-text-tertiary)" : "#fff",
            border: "none",
            borderRadius: "var(--border-radius-md)",
            cursor: running ? "not-allowed" : "pointer",
            fontFamily: "var(--font-sans)",
            transition: "opacity 0.15s"
          }}>
            {running ? "执行中..." : "▶ 执行"}
          </button>
          <button onClick={() => setExpanded(!expanded)} style={{
            padding: "8px 12px", fontSize: "12px",
            background: "transparent", color: "var(--color-text-secondary)",
            border: "0.5px solid var(--color-border-secondary)",
            borderRadius: "var(--border-radius-md)", cursor: "pointer",
            fontFamily: "var(--font-sans)"
          }}>
            {expanded ? "收起" : "详情"}
          </button>
        </div>
      </div>

      {/* Output */}
      {(output || error) && (
        <div style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          padding: "12px 16px",
          background: error ? "#FAECE7" : "var(--color-background-secondary)",
          fontSize: "11px",
          lineHeight: 1.5,
          color: error ? "#993C1D" : "var(--color-text-secondary)",
          maxHeight: "200px",
          overflowY: "auto",
        }}>
          <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "var(--font-mono)" }}>
            {error || output}
          </pre>
        </div>
      )}

      {expanded && (
        <div style={{
          borderTop: "0.5px solid var(--color-border-tertiary)",
          padding: "14px 16px",
          background: "var(--color-background-secondary)",
          fontSize: "12px",
          lineHeight: 1.6,
          color: "var(--color-text-secondary)",
        }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>来源: </span>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: "11px", background: "var(--color-background-primary)", padding: "2px 6px", borderRadius: "4px" }}>
              {agent.source}
            </code>
          </div>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>系统提示词: </span>
          </div>
          <pre style={{
            margin: 0, padding: "10px", background: "var(--color-background-primary)",
            borderRadius: "6px", fontSize: "11px", lineHeight: 1.5,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
            fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)",
            maxHeight: "150px", overflowY: "auto"
          }}>
            {agent.systemPrompt}
          </pre>
          {agent.config && Object.keys(agent.config).length > 0 && (
            <div style={{ marginTop: "10px" }}>
              <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>配置: </span>
              <pre style={{
                margin: "6px 0 0", padding: "10px", background: "var(--color-background-primary)",
                borderRadius: "6px", fontSize: "11px", lineHeight: 1.5,
                whiteSpace: "pre-wrap", wordBreak: "break-word",
                fontFamily: "var(--font-mono)", color: "var(--color-text-secondary)",
                maxHeight: "120px", overflowY: "auto"
              }}>
                {JSON.stringify(agent.config, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default function ProjectManager() {
  const [filter, setFilter] = useState("");

  const filtered = filter
    ? PROJECT_AGENTS.filter(a =>
        a.name.toLowerCase().includes(filter.toLowerCase()) ||
        a.description.toLowerCase().includes(filter.toLowerCase()) ||
        a.capabilities.some(c => c.toLowerCase().includes(filter.toLowerCase()))
      )
    : PROJECT_AGENTS;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          项目 Agent ({PROJECT_AGENTS.length})
        </div>
      </div>

      {PROJECT_AGENTS.length > 2 && (
        <div style={{ marginBottom: "12px" }}>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="搜索 Agent 名称、描述或能力..."
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 12px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
        </div>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-tertiary)", fontSize: "13px" }}>
          未找到匹配的 Agent
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "12px" }}>
        {filtered.map(agent => (
          <ProjectCard key={agent.name} agent={agent} />
        ))}
      </div>
    </div>
  );
}
