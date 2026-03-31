import { useState } from "react";
import { DEFAULT_TEMPLATES } from "../services/templates";

export default function TemplatesPanel({ templates, onSelect, onAdd, onDelete }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: "", description: "", task: "", agents: [] });
  const [allTemplates, setAllTemplates] = useState(() => [...DEFAULT_TEMPLATES, ...(templates || [])]);

  const handleAdd = () => {
    if (!newTpl.name.trim() || !newTpl.task.trim()) return;
    const entry = { ...newTpl, agents: newTpl.agents.length ? newTpl.agents : ["规划师", "研究员", "执行者", "审查员"] };
    onAdd?.(entry);
    setAllTemplates(p => [...p, entry]);
    setNewTpl({ name: "", description: "", task: "", agents: [] });
    setShowAdd(false);
  };

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>任务模板</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ fontSize: "11px", padding: "3px 10px", background: showAdd ? "var(--color-background-secondary)" : "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "5px", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
          {showAdd ? "取消" : "+ 新建"}
        </button>
      </div>

      {showAdd && (
        <div style={{ marginBottom: "14px", padding: "12px", background: "var(--color-background-secondary)", borderRadius: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <input value={newTpl.name} onChange={e => setNewTpl(p => ({ ...p, name: e.target.value }))} placeholder="模板名称"
              style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
            <input value={newTpl.description} onChange={e => setNewTpl(p => ({ ...p, description: e.target.value }))} placeholder="描述"
              style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
          </div>
          <textarea value={newTpl.task} onChange={e => setNewTpl(p => ({ ...p, task: e.target.value }))} placeholder="任务内容，使用 {{variable}} 作为占位符" rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)", resize: "vertical", marginBottom: "8px" }} />
          <div style={{ display: "flex", gap: "6px" }}>
            <button onClick={handleAdd} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 500, background: "#1D9E75", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>保存模板</button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "8px" }}>
        {allTemplates.map((tpl, i) => (
          <div key={i} style={{ padding: "10px 12px", background: "var(--color-background-secondary)", borderRadius: "8px", border: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", transition: "border-color 0.2s" }}
            onClick={() => onSelect?.(tpl)}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--color-border-secondary)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--color-border-tertiary)"}>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)", marginBottom: "4px" }}>{tpl.name}</div>
            <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)", marginBottom: "6px" }}>{tpl.description}</div>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {tpl.agents.map((a, j) => (
                <span key={j} style={{ fontSize: "9px", padding: "1px 6px", borderRadius: "99px", background: "var(--color-background-primary)", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-tertiary)" }}>{a}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
