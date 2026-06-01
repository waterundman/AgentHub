import { useState, useCallback, useRef } from 'react';
import { tracingService } from '../services/tracing/TracingService';

/**
 * useTracing Hook
 * 提供Tracing上下文，自动创建工具调用Span，记录耗时和状态
 */
export function useTracing() {
  const [traces, setTraces] = useState([]);
  const [currentTrace, setCurrentTrace] = useState(null);
  const [currentSpan, setCurrentSpan] = useState(null);
  const activeSpans = useRef(new Map());

  // 开始新的Trace
  const startTrace = useCallback((name) => {
    const trace = tracingService.startTrace(name);
    setCurrentTrace(trace);
    setTraces(prev => [...prev, trace]);
    return trace;
  }, []);

  // 开始新的Span
  const startSpan = useCallback((traceId, parentSpanId, name) => {
    const span = tracingService.startSpan(traceId, parentSpanId, name);
    activeSpans.current.set(span.id, span);
    setCurrentSpan(span);
    return span;
  }, []);

  // 结束Span
  const endSpan = useCallback((spanId, status = 'ok') => {
    const span = tracingService.endSpan(spanId, status);
    activeSpans.current.delete(spanId);
    
    // 更新当前Span
    if (currentSpan && currentSpan.id === spanId) {
      setCurrentSpan(null);
    }
    
    // 更新traces状态
    setTraces(prev => prev.map(trace => {
      if (trace.id === span.traceId) {
        return { ...tracingService.getTrace(trace.id) };
      }
      return trace;
    }));
    
    return span;
  }, [currentSpan]);

  // 添加事件
  const addEvent = useCallback((spanId, event) => {
    return tracingService.addEvent(spanId, event);
  }, []);

  // 包装工具调用，自动创建Span
  const traceToolCall = useCallback(async (toolName, toolFn, ...args) => {
    let traceId = currentTrace?.id;
    if (!traceId) {
      // 如果没有当前Trace，创建一个新的
      const trace = startTrace(`Tool Call: ${toolName}`);
      traceId = trace.id;
    }

    const parentSpanId = currentSpan?.id || null;
    const span = startSpan(traceId, parentSpanId, `Tool: ${toolName}`);
    
    const startTime = Date.now();
    addEvent(span.id, { 
      type: 'tool.call.start', 
      toolName, 
      args: args.length > 0 ? args : undefined 
    });

    try {
      const result = await toolFn(...args);
      const duration = Date.now() - startTime;
      
      addEvent(span.id, { 
        type: 'tool.call.end', 
        toolName, 
        duration, 
        success: true 
      });
      
      endSpan(span.id, 'ok');
      
      return {
        success: true,
        result,
        duration,
        traceId,
        spanId: span.id
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      addEvent(span.id, { 
        type: 'tool.call.error', 
        toolName, 
        duration, 
        error: error.message 
      });
      
      endSpan(span.id, 'error');
      
      return {
        success: false,
        error: error.message,
        duration,
        traceId,
        spanId: span.id
      };
    }
  }, [currentTrace, currentSpan, startTrace, startSpan, endSpan, addEvent]);

  // 获取Trace
  const getTrace = useCallback((traceId) => {
    return tracingService.getTrace(traceId);
  }, []);

  // 获取Span
  const getSpan = useCallback((spanId) => {
    return tracingService.getSpan(spanId);
  }, []);

  // 获取Trace的所有Spans
  const getSpans = useCallback((traceId) => {
    return tracingService.getSpans(traceId);
  }, []);

  // 获取所有Traces
  const getAllTraces = useCallback(() => {
    return tracingService.getAllTraces();
  }, []);

  // 清除所有数据
  const clearTraces = useCallback(() => {
    tracingService.clear();
    setTraces([]);
    setCurrentTrace(null);
    setCurrentSpan(null);
    activeSpans.current.clear();
  }, []);

  // 获取Trace统计信息
  const getTraceStats = useCallback((traceId) => {
    return tracingService.getTraceStats(traceId);
  }, []);

  return {
    // 状态
    traces,
    currentTrace,
    currentSpan,
    
    // 核心方法
    startTrace,
    startSpan,
    endSpan,
    addEvent,
    
    // 工具调用追踪
    traceToolCall,
    
    // 查询方法
    getTrace,
    getSpan,
    getSpans,
    getAllTraces,
    getTraceStats,
    
    // 管理方法
    clearTraces
  };
}

/**
 * useTracingContext Hook
 * 提供简单的追踪上下文，用于组件内部
 */
export function useTracingContext() {
  const tracing = useTracing();
  
  // 开始追踪会话
  const startTracingSession = useCallback((sessionName) => {
    return tracing.startTrace(sessionName);
  }, [tracing]);
  
  // 记录工具调用
  const recordToolCall = useCallback(async (toolName, toolFn, ...args) => {
    return tracing.traceToolCall(toolName, toolFn, ...args);
  }, [tracing]);
  
  // 记录事件
  const recordEvent = useCallback((eventName, data) => {
    if (tracing.currentSpan) {
      return tracing.addEvent(tracing.currentSpan.id, {
        type: 'custom',
        name: eventName,
        ...data
      });
    }
    return null;
  }, [tracing]);
  
  return {
    ...tracing,
    startTracingSession,
    recordToolCall,
    recordEvent
  };
}