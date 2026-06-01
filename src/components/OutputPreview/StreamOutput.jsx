import { memo, useEffect, useRef } from 'react';

/**
 * 轻量级 Markdown 转 HTML
 * 仅处理常见格式，保持性能和稳定性
 */
function renderMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code style="background:var(--color-background-secondary);padding:1px 4px;border-radius:3px;font-size:0.9em">$1</code>')
    .replace(/^```(\w*)\n([\s\S]*?)```/gm, '<pre style="background:var(--color-background-secondary);padding:10px;border-radius:6px;overflow-x:auto;margin:8px 0"><code>$2</code></pre>')
    .replace(/^[-*] (.+)$/gm, '<li style="margin-left:16px">$1</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}

/**
 * 流式输出组件
 * 实时显示流式文本，支持增量 Markdown 渲染和自动滚动
 *
 * @param {Object} props
 * @param {string} props.content - 累积文本内容
 * @param {boolean} props.isStreaming - 是否正在流式输出
 * @param {string} props.error - 错误信息
 * @param {string} props.label - 标签文本 (如 Agent 名称)
 * @param {object} props.color - 配色方案 { fill, text, stroke }
 * @param {React.Ref} props.containerRef - 滚动容器 ref
 */
export default memo(function StreamOutput({
  content,
  isStreaming,
  error,
  label,
  color,
  containerRef: externalRef,
}) {
  const internalRef = useRef(null);
  const scrollRef = externalRef || internalRef;
  const userScrolledRef = useRef(false);

  useEffect(() => {
    if (!scrollRef.current || userScrolledRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [content, scrollRef]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    userScrolledRef.current = scrollHeight - scrollTop - clientHeight > 50;
  };

  if (!content && !isStreaming && !error) return null;

  return (
    <div style={{
      border: `0.5px solid ${error ? 'var(--color-text-danger)' : (color?.stroke || 'var(--color-border-tertiary)')}`,
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {label && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 12px',
          background: color?.fill || 'var(--color-background-secondary)',
        }}>
          <span style={{
            fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
            background: color?.fill || 'var(--color-background-tertiary)',
            color: color?.text || 'var(--color-text-secondary)',
            border: `0.5px solid ${color?.stroke || 'var(--color-border-tertiary)'}`,
            fontWeight: 500,
          }}>{label}</span>
          {isStreaming && (
            <span style={{
              fontSize: '10px', color: 'var(--color-text-tertiary)',
              display: 'flex', alignItems: 'center', gap: '4px',
            }}>
              <span style={{
                display: 'inline-block', width: '6px', height: '6px',
                borderRadius: '50%', background: '#378ADD',
                animation: 'pulse 1.2s ease-in-out infinite',
              }} />
              生成中...
            </span>
          )}
          {isStreaming && (
            <style>{`@keyframes pulse { 0%,100% { opacity: 0.4 } 50% { opacity: 1 } }`}</style>
          )}
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          padding: '12px',
          background: 'var(--color-background-primary)',
          maxHeight: '400px',
          overflowY: 'auto',
        }}
      >
        {error ? (
          <div style={{
            fontSize: '12px', color: 'var(--color-text-danger)',
            padding: '8px', background: 'rgba(220,38,38,0.06)',
            borderRadius: '6px',
          }}>
            {error}
          </div>
        ) : (
          <div
            style={{
              fontSize: '13px', lineHeight: 1.7,
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-sans)',
              wordBreak: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
          />
        )}

        {isStreaming && !error && (
          <span style={{
            display: 'inline-block', width: '2px', height: '14px',
            background: 'var(--color-text-primary)',
            marginLeft: '2px', verticalAlign: 'text-bottom',
            animation: 'blink 1s step-end infinite',
          }}>
            <style>{`@keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }`}</style>
          </span>
        )}
      </div>
    </div>
  );
});
