import React from 'react';
import { Icon } from '../Icon';
import { Button } from '../ui';

export const AgentHubHeader = React.memo(function AgentHubHeader({ 
  agents, 
  tab, 
  onTabChange, 
  onToggleTheme, 
  isDark 
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", background: "linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)", borderRadius: "var(--radius-lg)", padding: "12px 16px", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "var(--shadow-md)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "var(--color-background-info)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px" }}>
          <Icon name="Hexagon" size={16} />
        </div>
        <div>
          <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--color-text-primary)", lineHeight: 1.2 }}>AgentHub</div>
          <div style={{ fontSize: "11px", color: "var(--color-text-tertiary)" }}>{agents.length} 个 agent · 轻量多 Agent 协作平台</div>
        </div>
      </div>
      <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.1)", borderRadius: "var(--radius-md)", padding: "3px", gap: "2px" }}>
        {["run", "config", "projects", "api", "tools"].map(t => {
          const iconMap = {
            run: <Icon name="Play" size={14} />,
            config: <Icon name="Settings" size={14} />,
            projects: <Icon name="Folder" size={14} />,
            api: <Icon name="Zap" size={14} />,
            tools: <Icon name="Wrench" size={14} />
          };
          const labelMap = {
            run: "运行",
            config: "配置",
            projects: "项目",
            api: "API",
            tools: "工具"
          };
          return (
            <Button key={t} onClick={() => onTabChange(t)} variant={tab === t ? "secondary" : "ghost"} size="sm" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {iconMap[t]}
              {labelMap[t]}
            </Button>
          );
        })}
        <Button onClick={onToggleTheme} title={isDark ? "切换亮色主题" : "切换暗色主题"} variant="ghost" size="sm">
          {isDark ? "☀" : "☾"}
        </Button>
      </div>
    </div>
  );
});