import { useState, useCallback, useRef, useEffect } from "react";
import { COLORS } from "../../constants/colors";
import { shortHash } from "../../utils/hash";

export default function AgentChat({ agents, logs, running }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      if (lastLog.done && !messages.find(m => m.logId === lastLog.id)) {
        setMessages(prev => [...prev, {
          id: `agent-${lastLog.id}`,
          logId: lastLog.id,
          agentHash: lastLog.agentHash,
          agentName: lastLog.agentName,
          content: lastLog.content,
          ts: lastLog.ts,
          type: "agent",
        }]);
      }
    }
  }, [logs]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !selectedAgent) return;
    const msg = {
      id: `user-${Date.now()}`,
      agentHash: selectedAgent,
      agentName: agents.find(a => a.hash === selectedAgent)?.name || "User",
      content: input.trim(),
      ts: new Date().toLocaleTimeString("zh-CN", { hour12: false }),
      type: "user",
    };
    setMessages(prev => [...prev, msg]);
    setInput("");
  }, [input, selectedAgent, agents]);

  if (!running && messages.length === 0) return null;

  return (
    <div style={{
      background: "var(--color-background-primary)",
      border: "0.5px solid var(--color-border-tertiary)",
      borderRadius: "var(--border-radius-lg)",
      overflow: "hidden",
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", cursor: "pointer",
        background: "var(--color-background-secondary)",
      }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Agent 消息 {messages.length > 0 && `(${messages.length})`}
        </div>
        <span style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <>
          <div style={{ height: "250px", overflowY: "auto", padding: "10px" }}>
            {messages.map(msg => {
              const ag = agents.find(a => a.hash === msg.agentHash);
              const c = ag ? (COLORS[ag.colorKey] || COLORS.purple) : COLORS.purple;
              const isUser = msg.type === "user";
              return (
                <div key={msg.id} style={{
                  marginBottom: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isUser ? "flex-end" : "flex-start",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px",
                    fontSize: "10px", color: "var(--color-text-tertiary)",
                  }}>
                    {!isUser && <span style={{ padding: "1px 6px", borderRadius: "99px", background: c.fill, color: c.text, border: `0.5px solid ${c.stroke}`, fontWeight: 500 }}>{msg.agentName}</span>}
                    <span>{msg.ts}</span>
                    {isUser && <span style={{ padding: "1px 6px", borderRadius: "99px", background: "#E6F1FB", color: "#185FA5", border: "0.5px solid #378ADD" }}>User</span>}
                  </div>
                  <div style={{
                    maxWidth: "80%", padding: "8px 12px", borderRadius: "12px",
                    background: isUser ? "#E6F1FB" : "var(--color-background-secondary)",
                    color: isUser ? "#042C53" : "var(--color-text-primary)",
                    fontSize: "12px", lineHeight: 1.6,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                    borderTopLeftRadius: isUser ? "12px" : "4px",
                    borderTopRightRadius: isUser ? "4px" : "12px",
                  }}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <div style={{ padding: "10px", borderTop: "0.5px solid var(--color-border-tertiary)", display: "flex", gap: "8px" }}>
            <select value={selectedAgent || ""} onChange={e => setSelectedAgent(e.target.value)}
              style={{ flex: 1, padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
              <option value="">选择 Agent...</option>
              {agents.map(a => (
                <option key={a.hash} value={a.hash}>{a.name}</option>
              ))}
            </select>
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
              placeholder="输入消息..."
              style={{ flex: 2, padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
            <button onClick={sendMessage} disabled={!input.trim() || !selectedAgent}
              style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 500, background: (input.trim() && selectedAgent) ? "#378ADD" : "var(--color-background-secondary)", color: (input.trim() && selectedAgent) ? "#fff" : "var(--color-text-tertiary)", border: "none", borderRadius: "var(--border-radius-md)", cursor: (input.trim() && selectedAgent) ? "pointer" : "not-allowed", fontFamily: "var(--font-sans)" }}>
              发送
            </button>
          </div>
        </>
      )}
    </div>
  );
}
