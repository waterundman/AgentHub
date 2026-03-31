import { useCallback } from "react";

export function exportToMarkdown(logs, finalOutput, task) {
  let md = `# AgentHub 执行报告\n\n`;
  md += `**任务**: ${task}\n`;
  md += `**时间**: ${new Date().toLocaleString("zh-CN")}\n`;
  md += `**Agent 数量**: ${logs.length}\n\n`;
  md += `---\n\n`;

  for (const log of logs) {
    md += `## ${log.agentName}\n\n`;
    md += `- **时间**: ${log.ts}\n`;
    md += `- **状态**: ${log.done ? "完成" : "处理中"}\n\n`;
    md += `${log.content}\n\n`;
    md += `---\n\n`;
  }

  if (finalOutput) {
    md += `## 最终输出\n\n${finalOutput}\n`;
  }

  return md;
}

export function exportToJSON(logs, finalOutput, task, tokenStats) {
  return JSON.stringify({
    task,
    timestamp: new Date().toISOString(),
    agents: logs.map(l => ({
      name: l.agentName,
      hash: l.agentHash,
      timestamp: l.ts,
      status: l.done ? "completed" : "running",
      content: l.content,
    })),
    finalOutput,
    tokenStats: tokenStats ? {
      summary: tokenStats.summary,
      agents: Object.fromEntries(
        Object.entries(tokenStats.agents).map(([k, v]) => [k, {
          name: v.name,
          inputTokens: v.inputTokens,
          outputTokens: v.outputTokens,
          totalTokens: v.totalTokens,
          cost: v.cost,
        }])
      ),
    } : null,
  }, null, 2);
}

export function downloadFile(content, filename, mimeType = "text/markdown") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function useExport() {
  const exportMarkdown = useCallback((logs, finalOutput, task) => {
    const md = exportToMarkdown(logs, finalOutput, task);
    const filename = `agenthub-report-${Date.now()}.md`;
    downloadFile(md, filename);
  }, []);

  const exportJSON = useCallback((logs, finalOutput, task, tokenStats) => {
    const json = exportToJSON(logs, finalOutput, task, tokenStats);
    const filename = `agenthub-report-${Date.now()}.json`;
    downloadFile(json, filename, "application/json");
  }, []);

  return { exportMarkdown, exportJSON };
}
