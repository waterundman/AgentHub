import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "20px",
          background: "#FAECE7",
          border: "0.5px solid #D85A30",
          borderRadius: "var(--border-radius-lg)",
          color: "#993C1D",
          fontFamily: "var(--font-sans)",
        }}>
          <div style={{ fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>
            ⚠ 组件渲染错误
          </div>
          <div style={{ fontSize: "12px", marginBottom: "12px" }}>
            {this.state.error?.message || "未知错误"}
          </div>
          {this.state.errorInfo && (
            <details style={{ fontSize: "11px", fontFamily: "var(--font-mono)", maxHeight: "150px", overflow: "auto" }}>
              <summary style={{ cursor: "pointer", marginBottom: "4px" }}>错误详情</summary>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
          <button onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
            style={{
              marginTop: "10px", padding: "6px 14px", fontSize: "12px",
              background: "#D85A30", color: "#fff", border: "none",
              borderRadius: "var(--border-radius-md)", cursor: "pointer",
              fontFamily: "var(--font-sans)",
            }}>
            重试
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
