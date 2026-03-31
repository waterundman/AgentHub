import { useRef, useEffect, useState, memo } from "react";
import { DiffEditor } from "@monaco-editor/react";

export default memo(function MonacoDiff({ original, modified, language = "markdown", height = 300 }) {
  const [loading, setLoading] = useState(true);

  return (
    <div style={{ borderRadius: "6px", overflow: "hidden", border: "0.5px solid var(--color-border-tertiary)" }}>
      {loading && (
        <div style={{ padding: "20px", textAlign: "center", color: "var(--color-text-tertiary)", fontSize: "12px" }}>
          加载 Diff 编辑器...
        </div>
      )}
      <DiffEditor
        height={height}
        original={original}
        modified={modified}
        language={language}
        theme="vs-dark"
        options={{
          readOnly: true,
          renderSideBySide: true,
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: "on",
          renderValidationDecorations: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
        onMount={() => setLoading(false)}
      />
    </div>
  );
});
