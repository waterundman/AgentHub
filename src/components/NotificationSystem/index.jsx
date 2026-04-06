import { useState, useCallback, useEffect, memo } from "react";

const STORAGE_NOTIFICATIONS = "agenthub_notifications_v1";

const NOTIFICATION_TYPES = {
  info: { bg: "#E6F1FB", border: "#378ADD", text: "#042C53", icon: "ℹ" },
  success: { bg: "#E1F5EE", border: "#1D9E75", text: "#085041", icon: "✓" },
  warning: { bg: "#FAEEDA", border: "#BA7517", text: "#412402", icon: "⚠" },
  error: { bg: "#FAECE7", border: "#D85A30", text: "#4A1B0C", icon: "✕" },
};

export default memo(function NotificationSystem() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const timers = notifications
      .filter(n => n.autoClose)
      .map(n => setTimeout(() => dismiss(n.id), n.duration || 5000));
    return () => timers.forEach(clearTimeout);
  }, [notifications]);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: "12px", right: "12px", zIndex: 9999,
      display: "flex", flexDirection: "column", gap: "8px", maxWidth: "360px", width: "calc(100% - 24px)",
    }}>
      {notifications.map(n => {
        const style = NOTIFICATION_TYPES[n.type] || NOTIFICATION_TYPES.info;
        return (
          <div key={n.id} style={{
            padding: "12px 14px", background: style.bg, border: `0.5px solid ${style.border}`,
            borderRadius: "8px", color: style.text, fontSize: "12px", lineHeight: 1.5,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)", animation: "slideInRight 0.2s ease-out",
          }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
              <span style={{ fontSize: "14px", flexShrink: 0 }}>{style.icon}</span>
              <div style={{ flex: 1 }}>
                {n.title && <div style={{ fontWeight: 500, marginBottom: "2px" }}>{n.title}</div>}
                <div>{n.message}</div>
              </div>
              <button onClick={() => dismiss(n.id)} style={{
                background: "none", border: "none", cursor: "pointer", fontSize: "14px",
                color: style.text, opacity: 0.6, padding: "0 2px", flexShrink: 0,
              }}>✕</button>
            </div>
          </div>
        );
      })}
      {notifications.length > 1 && (
        <button onClick={clearAll} style={{
          alignSelf: "flex-end", padding: "4px 10px", fontSize: "11px",
          background: "transparent", border: "0.5px solid var(--color-border-tertiary)",
          borderRadius: "5px", cursor: "pointer", color: "var(--color-text-tertiary)",
          fontFamily: "var(--font-sans)",
        }}>全部清除</button>
      )}
    </div>
  );
});

let notificationId = 0;
const listeners = new Set();

export function notify(message, options = {}) {
  const { type = "info", title, duration = 5000, autoClose = true } = options;
  const id = `notif-${++notificationId}-${Date.now()}`;
  const notification = { id, type, title, message, duration, autoClose };
  listeners.forEach(fn => fn(notification));
  return id;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const handler = (n) => {
      setNotifications(prev => [...prev, n]);
    };
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);

  const dismiss = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return { notifications, dismiss, clearAll };
}
