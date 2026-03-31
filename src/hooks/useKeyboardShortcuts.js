import { useEffect, useCallback } from "react";

const SHORTCUTS = {
  "ctrl+enter": "run",
  "ctrl+s": "save",
  "ctrl+z": "undo",
  "ctrl+shift+z": "redo",
  "escape": "stop",
  "ctrl+k": "clear_logs",
  "ctrl+1": "tab_run",
  "ctrl+2": "tab_config",
  "ctrl+3": "tab_api",
  "ctrl+4": "tab_tools",
  "ctrl+/": "toggle_shortcuts",
};

export default function useKeyboardShortcuts(handlers) {
  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase();
    const modifiers = [];
    if (e.ctrlKey || e.metaKey) modifiers.push("ctrl");
    if (e.shiftKey) modifiers.push("shift");
    if (e.altKey) modifiers.push("alt");

    const combo = [...modifiers, key].join("+");
    const action = SHORTCUTS[combo];

    if (action && handlers[action]) {
      e.preventDefault();
      handlers[action](e);
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

export function getShortcutsHelp() {
  return [
    { keys: "Ctrl+Enter", desc: "启动任务" },
    { keys: "Escape", desc: "停止运行" },
    { keys: "Ctrl+K", desc: "清空日志" },
    { keys: "Ctrl+1", desc: "切换到运行" },
    { keys: "Ctrl+2", desc: "切换到配置" },
    { keys: "Ctrl+3", desc: "切换到 API" },
    { keys: "Ctrl+4", desc: "切换到工具" },
    { keys: "Ctrl+/", desc: "显示快捷键帮助" },
  ];
}
