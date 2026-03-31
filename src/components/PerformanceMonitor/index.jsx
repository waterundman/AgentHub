import { useState, useEffect, memo } from "react";
import { formatCost, formatTokens } from "../services/tokenPricing";

function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    totalRenderTime: 0,
    componentRenders: {},
    memoryUsage: null,
    fps: 0,
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const measureFPS = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        setMetrics(prev => ({ ...prev, fps }));
      }
      requestAnimationFrame(measureFPS);
    };

    const animId = requestAnimationFrame(measureFPS);

    if (performance.memory) {
      const memInterval = setInterval(() => {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize,
            limit: performance.memory.jsHeapSizeLimit,
          },
        }));
      }, 2000);
      return () => { cancelAnimationFrame(animId); clearInterval(memInterval); };
    }

    return () => cancelAnimationFrame(animId);
  }, []);

  return metrics;
}

export default memo(function PerformanceMonitor() {
  const metrics = usePerformanceMonitor();
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <div onClick={() => setExpanded(true)} style={{
        position: "fixed", bottom: "10px", right: "10px",
        padding: "4px 10px", background: "rgba(0,0,0,0.7)", color: "#fff",
        borderRadius: "6px", fontSize: "10px", fontFamily: "var(--font-mono)",
        cursor: "pointer", zIndex: 9999,
      }}>
        {metrics.fps} FPS
      </div>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: "10px", right: "10px",
      padding: "12px", background: "rgba(0,0,0,0.85)", color: "#fff",
      borderRadius: "8px", fontSize: "11px", fontFamily: "var(--font-mono)",
      cursor: "pointer", zIndex: 9999, minWidth: "200px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
        <span style={{ fontWeight: 500 }}>性能监控</span>
        <button onClick={() => setExpanded(false)} style={{
          background: "none", border: "none", color: "#aaa", cursor: "pointer", fontSize: "14px", padding: "0 4px",
        }}>✕</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#aaa" }}>FPS</span>
          <span style={{ color: metrics.fps >= 50 ? "#1D9E75" : metrics.fps >= 30 ? "#BA7517" : "#E24B4A" }}>{metrics.fps}</span>
        </div>
        {metrics.memoryUsage && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#aaa" }}>内存使用</span>
              <span>{formatTokens(Math.round(metrics.memoryUsage.used / 1024))} KB</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#aaa" }}>内存限制</span>
              <span>{formatTokens(Math.round(metrics.memoryUsage.limit / 1024 / 1024))} MB</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
});
