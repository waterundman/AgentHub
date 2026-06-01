import { useState, useRef, useCallback, useEffect } from 'react';
import { SSEParser, extractStreamText, isStreamDone } from '../utils/sseParser';

/**
 * 流式渲染 Hook
 * 管理 SSE 连接、增量内容更新、自动滚动
 *
 * @param {Object} options
 * @param {string} options.provider - 提供商标识 (openai|anthropic|deepseek)
 * @param {boolean} options.autoScroll - 是否自动滚动 (默认 true)
 * @param {number} options.throttleMs - 更新节流间隔 (默认 30ms)
 * @returns {{ content, isStreaming, error, startStream, stopStream, reset, containerRef }}
 */
export function useStreamRender(options = {}) {
  const {
    provider = 'openai',
    autoScroll = true,
    throttleMs = 30,
  } = options;

  const [content, setContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState(null);

  const parserRef = useRef(null);
  const abortRef = useRef(null);
  const fullTextRef = useRef('');
  const throttleTimerRef = useRef(null);
  const pendingUpdateRef = useRef(false);
  const containerRef = useRef(null);

  const flushContent = useCallback(() => {
    if (pendingUpdateRef.current) {
      setContent(fullTextRef.current);
      pendingUpdateRef.current = false;
    }
  }, []);

  const scheduleUpdate = useCallback(() => {
    if (throttleTimerRef.current) {
      pendingUpdateRef.current = true;
      return;
    }
    setContent(fullTextRef.current);
    throttleTimerRef.current = setTimeout(() => {
      throttleTimerRef.current = null;
      flushContent();
    }, throttleMs);
  }, [throttleMs, flushContent]);

  const scrollToBottom = useCallback(() => {
    if (!autoScroll || !containerRef.current) return;
    const el = containerRef.current;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [autoScroll]);

  const handleData = useCallback((event) => {
    const text = extractStreamText(event.data, provider);
    if (text) {
      fullTextRef.current += text;
      scheduleUpdate();
      scrollToBottom();
    }

    if (isStreamDone(event.data)) {
      return;
    }
  }, [provider, scheduleUpdate, scrollToBottom]);

  const handleDone = useCallback(() => {
    flushContent();
    setIsStreaming(false);
    scrollToBottom();
  }, [flushContent, scrollToBottom]);

  const handleError = useCallback((err) => {
    flushContent();
    setError(err.message || '流式连接错误');
    setIsStreaming(false);
  }, [flushContent]);

  /**
   * 启动流式请求
   * @param {string} url - 请求地址
   * @param {Object} fetchOptions - fetch 选项
   */
  const startStream = useCallback(async (url, fetchOptions = {}) => {
    stopStream();
    reset();

    setIsStreaming(true);
    setError(null);

    const parser = new SSEParser({
      onData: handleData,
      onDone: handleDone,
      onError: handleError,
    });
    parserRef.current = parser;

    const abortCtrl = new AbortController();
    abortRef.current = abortCtrl;

    try {
      const res = await fetch(url, {
        ...fetchOptions,
        signal: abortCtrl.signal,
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error?.message || `HTTP ${res.status}`);
      }

      if (!res.body) {
        const data = await res.json();
        fullTextRef.current = typeof data === 'string' ? data : data.text || JSON.stringify(data);
        flushContent();
        setIsStreaming(false);
        return;
      }

      await parser.parse(res.body);
    } catch (err) {
      if (err.name !== 'AbortError') {
        handleError(err);
      }
    }
  }, [handleData, handleDone, handleError, flushContent]);

  /**
   * 从已有的 ReadableStream 启动解析
   * @param {ReadableStream} stream
   */
  const startFromStream = useCallback(async (stream) => {
    stopStream();
    reset();

    setIsStreaming(true);
    setError(null);

    const parser = new SSEParser({
      onData: handleData,
      onDone: handleDone,
      onError: handleError,
    });
    parserRef.current = parser;

    try {
      await parser.parse(stream);
    } catch (err) {
      handleError(err);
    }
  }, [handleData, handleDone, handleError]);

  /**
   * 直接喂入文本块 (用于自定义流处理)
   * @param {string} chunk
   */
  const feedChunk = useCallback((chunk) => {
    if (!parserRef.current) {
      const parser = new SSEParser({
        onData: handleData,
        onDone: handleDone,
        onError: handleError,
      });
      parserRef.current = parser;
      setIsStreaming(true);
    }
    parserRef.current.feed(chunk);
  }, [handleData, handleDone, handleError]);

  /**
   * 标记流结束
   */
  const finishStream = useCallback(() => {
    if (parserRef.current) {
      parserRef.current.finish();
    }
    flushContent();
    setIsStreaming(false);
  }, [flushContent]);

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    if (throttleTimerRef.current) {
      clearTimeout(throttleTimerRef.current);
      throttleTimerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const reset = useCallback(() => {
    stopStream();
    fullTextRef.current = '';
    pendingUpdateRef.current = false;
    setContent('');
    setError(null);
    parserRef.current?.reset();
  }, [stopStream]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (throttleTimerRef.current) {
        clearTimeout(throttleTimerRef.current);
      }
    };
  }, []);

  return {
    content,
    isStreaming,
    error,
    startStream,
    startFromStream,
    feedChunk,
    finishStream,
    stopStream,
    reset,
    containerRef,
  };
}
