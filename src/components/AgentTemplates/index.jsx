import { useState, useEffect, memo } from "react";
import { COLORS } from "../../constants/colors";
import { loadAgentTemplates, saveAgentTemplates, importAgentToHub, deleteAgentTemplate } from "../../services/agentTemplates";

export default memo(function AgentTemplates({ agents, persistAgents }) {
  const [templates, setTemplates] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newTpl, setNewTpl] = useState({ name: "", subtitle: "", icon: "", colorKey: "purple", systemPrompt: "" });

  useEffect(() => {
    loadAgentTemplates().then(setTemplates);
  }, []);

  const handleImport = async (tpl) => {
    const exists = agents.find(a => a.name === tpl.name);
    if (exists) {
      alert(`Agent "${tpl.name}" 已存在`);
      return;
    }
    await importAgentToHub(tpl, agents, persistAgents);
  };

  const handleDelete = async (index) => {
    const updated = await deleteAgentTemplate(index);
    setTemplates(updated);
  };

  const handleAdd = async () => {
    if (!newTpl.name.trim() || !newTpl.systemPrompt.trim()) return;
    const templates = await loadAgentTemplates();
    templates.push(newTpl);
    await saveAgentTemplates(templates);
    setTemplates(templates);
    setNewTpl({ name: "", subtitle: "", icon: "", colorKey: "purple", systemPrompt: "" });
    setShowAdd(false);
  };

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Agent 模板库</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ fontSize: "11px", padding: "3px 10px", background: showAdd ? "var(--color-background-secondary)" : "transparent", border: "0.5px solid var(--color-border-secondary)", borderRadius: "5px", cursor: "pointer", color: "var(--color-text-secondary)", fontFamily: "var(--font-sans)" }}>
          {showAdd ? "取消" : "+ 新建模板"}
        </button>
      </div>

      {showAdd && (
        <div style={{ marginBottom: "14px", padding: "12px", background: "var(--color-background-secondary)", borderRadius: "8px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
            <input value={newTpl.name} onChange={e => setNewTpl(p => ({ ...p, name: e.target.value }))} placeholder="名称"
              style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
            <input value={newTpl.subtitle} onChange={e => setNewTpl(p => ({ ...p, subtitle: e.target.value }))} placeholder="副标题"
              style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
            <input value={newTpl.icon} onChange={e => setNewTpl(p => ({ ...p, icon: e.target.value.slice(0, 1) }))} placeholder="图标 (1字符)" maxLength={1}
              style={{ padding: "6px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
          </div>
          <textarea value={newTpl.systemPrompt} onChange={e => setNewTpl(p => ({ ...p, systemPrompt: e.target.value }))} placeholder="系统提示词..." rows={3}
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-primary)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)", resize: "vertical", marginBottom: "8px" }} />
          <button onClick={handleAdd} style={{ padding: "6px 14px", fontSize: "12px", fontWeight: 500, background: "#1D9E75", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>保存模板</button>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "8px" }}>
        {templates.map((tpl, i) => {
          const c = COLORS[tpl.colorKey] || COLORS.purple;
          const exists = agents.find(a => a.name === tpl.name);
          return (
            <div key={i} style={{ padding: "12px", background: "var(--color-background-secondary)", borderRadius: "8px", border: "0.5px solid var(--color-border-tertiary)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: c.fill, border: `1px solid ${c.stroke}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 500, color: c.text }}>{tpl.icon || "?"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--color-text-primary)" }}>{tpl.name}</div>
                  <div style={{ fontSize: "10px", color: "var(--color-text-tertiary)" }}>{tpl.subtitle}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "6px" }}>
                <button onClick={() => handleImport(tpl)} disabled={!!exists} style={{
                  flex: 1, padding: "5px 10px", fontSize: "11px", fontWeight: 500,
                  background: exists ? "var(--color-background-primary)" : c.stroke,
                  color: exists ? "var(--color-text-tertiary)" : "#fff",
                  border: "none", borderRadius: "var(--border-radius-md)",
                  cursor: exists ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)",
                }}>
                  {exists ? "已存在" : "导入"}
                </button>
                <button onClick={() => handleDelete(i)} style={{
                  padding: "5px 10px", fontSize: "11px",
                  background: "transparent", color: "var(--color-text-tertiary)",
                  border: "0.5px solid var(--color-border-tertiary)",
                  borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)",
                }}>删除</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
