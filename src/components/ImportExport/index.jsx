import { useState } from "react";
import { loadAgents, saveAgents, loadVersions, saveVersions } from "../services/storage";
import { agentHash } from "../utils/hash";

const COLOR_KEYS = ["purple", "teal", "coral", "blue", "amber", "green"];
const ICON_CHARS = "ABCDEFGHIJKLMNOP";

export default function ImportExport({ agents, versions, onImport }) {
  const [importMsg, setImportMsg] = useState(null);

  const exportAll = () => {
    const data = { agents, versions, exportedAt: new Date().toISOString(), version: "1.0" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenthub-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAgentsOnly = () => {
    const data = { agents, exportedAt: new Date().toISOString(), version: "1.0" };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agenthub-agents-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.agents || !Array.isArray(data.agents)) {
        setImportMsg({ ok: false, msg: "无效的文件格式：缺少 agents 字段" });
        return;
      }
      const mode = "merge";
      if (mode === "overwrite") {
        await onImport(data.agents, data.versions || {});
      } else {
        const existing = await loadAgents() || [];
        const existingHashes = new Set(existing.map(a => a.hash));
        const newAgents = data.agents.filter(a => !existingHashes.has(a.hash));
        const merged = [...existing, ...newAgents];
        await onImport(merged, data.versions || {});
      }
      setImportMsg({ ok: true, msg: `导入成功！新增 ${data.agents.length} 个 agent` });
    } catch (err) {
      setImportMsg({ ok: false, msg: `导入失败：${err.message}` });
    }
    setTimeout(() => setImportMsg(null), 3000);
  };

  return (
    <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "16px" }}>
      <div style={{ fontSize: "10px", fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "12px" }}>导入 / 导出</div>

      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button onClick={exportAll} style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 500, background: "#378ADD", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          导出全部 (Agents + 版本)
        </button>
        <button onClick={exportAgentsOnly} style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 500, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          仅导出 Agents
        </button>
        <label style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 500, background: "var(--color-background-secondary)", color: "var(--color-text-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
          导入 JSON
          <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
        </label>
      </div>

      {importMsg && (
        <div style={{ marginTop: "10px", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", background: importMsg.ok ? "#E1F5EE" : "#FAECE7", color: importMsg.ok ? "#085041" : "#993C1D", border: `0.5px solid ${importMsg.ok ? "#1D9E75" : "#D85A30"}` }}>
          {importMsg.ok ? "✓ " : "✕ "}{importMsg.msg}
        </div>
      )}

      <div style={{ marginTop: "12px", fontSize: "11px", color: "var(--color-text-tertiary)", lineHeight: 1.5 }}>
        <p style={{ margin: "0 0 4px" }}>导出内容：当前所有 Agent 配置及版本历史</p>
        <p style={{ margin: 0 }}>导入模式：合并（跳过已存在的 Agent ID）</p>
      </div>
    </div>
  );
}
