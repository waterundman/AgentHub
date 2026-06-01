import { useState } from "react";
import { DEFAULT_CONFIG } from "../../services/api";
import { saveConfig, loadConfig } from "../../services/storage";
import { Icon, Wifi, WifiOff, Check, X } from "../Icon";

const PROVIDERS = [
  { key: "anthropic", label: "Anthropic (Claude)", baseUrl: "https://api.anthropic.com/v1/messages", models: ["claude-sonnet-4-20250514", "claude-opus-4-20250514", "claude-3-5-sonnet-20241022"] },
  { key: "openai", label: "OpenAI (GPT)", baseUrl: "https://api.openai.com/v1/chat/completions", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"] },
];

export default function ApiConfig({ config, onChange }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showKey, setShowKey] = useState(false);

  const provider = PROVIDERS.find(p => p.key === config.provider) || PROVIDERS[0];

  const update = (key, value) => {
    const updated = { ...config, [key]: value };
    if (key === "provider") {
      const p = PROVIDERS.find(pr => pr.key === value);
      if (p) {
        updated.baseUrl = p.baseUrl;
        updated.model = p.models[0];
      }
    }
    onChange(updated);
    saveConfig(updated).catch(() => {});
  };

  const testConnection = async () => {
    if (!config.apiKey.trim()) {
      setTestResult({ ok: false, msg: "请先输入 API Key" });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const headers = { "Content-Type": "application/json" };
      if (config.provider === "anthropic") {
        headers["x-api-key"] = config.apiKey;
        headers["anthropic-version"] = "2023-06-01";
      } else {
        headers["Authorization"] = `Bearer ${config.apiKey}`;
      }

      const body = config.provider === "anthropic"
        ? { model: config.model, max_tokens: 10, system: "test", messages: [{ role: "user", content: "Hi" }] }
        : { model: config.model, max_tokens: 10, messages: [{ role: "user", content: "Hi" }] };

      const res = await fetch(config.baseUrl, { method: "POST", headers, body: JSON.stringify(body) });
      if (res.ok) {
        setTestResult({ ok: true, msg: "连接成功！" });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({ ok: false, msg: err.error?.message || `HTTP ${res.status}` });
      }
    } catch (err) {
      setTestResult({ ok: false, msg: err.message });
    }
    setTesting(false);
  };

  const saveSettings = async () => {
    await saveConfig(config);
    setTestResult({ ok: true, msg: "设置已保存" });
    setTimeout(() => setTestResult(null), 2000);
  };

  const resetDefaults = () => {
    onChange({ ...DEFAULT_CONFIG });
    setTestResult(null);
  };

  return (
    <div>
      <p style={{ margin: "0 0 16px", fontSize: "13px", color: "var(--color-text-secondary)", lineHeight: 1.6 }}>配置 LLM API 连接信息。支持 Anthropic Claude 和 OpenAI GPT 系列模型。</p>

      <div style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "16px" }}>
        {/* Provider */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>API 提供商</label>
          <select value={config.provider} onChange={e => update("provider", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
            {PROVIDERS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
          </select>
        </div>

        {/* Model */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>模型</label>
          <select value={config.model} onChange={e => update("model", e.target.value)}
            style={{ width: "100%", padding: "8px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }}>
            {provider.models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Base URL */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>API 地址</label>
          <input value={config.baseUrl} onChange={e => update("baseUrl", e.target.value)}
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }} />
        </div>

        {/* API Key */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>API Key</label>
          <div style={{ position: "relative" }}>
            <input type={showKey ? "text" : "password"} value={config.apiKey} onChange={e => update("apiKey", e.target.value)} placeholder="sk-..."
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 36px 8px 10px", fontSize: "12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-mono)" }} />
            <button onClick={() => setShowKey(!showKey)} style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "var(--color-text-tertiary)", padding: "2px" }}>
              {showKey ? "隐藏" : "显示"}
            </button>
          </div>
        </div>

        {/* Max Tokens */}
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>最大 Token 数</label>
          <input type="number" value={config.maxTokens} onChange={e => update("maxTokens", parseInt(e.target.value) || 1000)} min={100} max={8192}
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
        </div>

        {/* Retry */}
        <div style={{ marginBottom: "18px" }}>
          <label style={{ display: "block", fontSize: "10px", fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>最大重试次数</label>
          <input type="number" value={config.maxRetries} onChange={e => update("maxRetries", Math.max(0, parseInt(e.target.value) || 3))} min={0} max={10}
            style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", fontSize: "13px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", background: "var(--color-background-secondary)", color: "var(--color-text-primary)", fontFamily: "var(--font-sans)" }} />
        </div>

        {/* Test Result */}
        {testResult && (
          <div style={{ marginBottom: "14px", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", background: testResult.ok ? "#E1F5EE" : "#FAECE7", color: testResult.ok ? "#085041" : "#993C1D", border: `0.5px solid ${testResult.ok ? "#1D9E75" : "#D85A30"}`, display: "flex", alignItems: "center", gap: "6px" }}>
            {testResult.ok ? <Icon name="Check" size={14} /> : <Icon name="X" size={14} />}
            {testResult.msg}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={testConnection} disabled={testing}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 500, background: testing ? "var(--color-background-secondary)" : "#378ADD", color: testing ? "var(--color-text-tertiary)" : "#fff", border: "none", borderRadius: "var(--border-radius-md)", cursor: testing ? "not-allowed" : "pointer", fontFamily: "var(--font-sans)", display: "flex", alignItems: "center", gap: "6px" }}>
            {testing ? <Icon name="Loader" size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Icon name="Wifi" size={14} />}
            {testing ? "测试中..." : "测试连接"}
          </button>
          <button onClick={saveSettings}
            style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 500, background: "#1D9E75", color: "#fff", border: "none", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            保存设置
          </button>
          <button onClick={resetDefaults}
            style={{ padding: "8px 16px", fontSize: "12px", background: "transparent", color: "var(--color-text-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", cursor: "pointer", fontFamily: "var(--font-sans)" }}>
            恢复默认
          </button>
        </div>
      </div>
    </div>
  );
}
