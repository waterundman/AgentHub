/**
 * TracingService - 结构化追踪工具调用链路
 * 管理Trace和Span的创建、更新和查询
 */

// 生成唯一ID
const generateId = () => `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

class TracingService {
  constructor() {
    this.traces = new Map();
    this.spans = new Map();
  }

  /**
   * 创建新的Trace
   * @param {string} name - Trace名称
   * @returns {Object} 创建的Trace对象
   */
  startTrace(name) {
    const traceId = generateId();
    const trace = {
      id: traceId,
      name,
      startTime: Date.now(),
      endTime: null,
      spans: []
    };
    
    this.traces.set(traceId, trace);
    return trace;
  }

  /**
   * 创建新的Span
   * @param {string} traceId - Trace ID
   * @param {string|null} parentSpanId - 父Span ID，可选
   * @param {string} name - Span名称
   * @returns {Object} 创建的Span对象
   */
  startSpan(traceId, parentSpanId, name) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    const spanId = generateId();
    const span = {
      id: spanId,
      traceId,
      parentSpanId: parentSpanId || null,
      name,
      startTime: Date.now(),
      endTime: null,
      status: 'ok',
      events: [],
      metadata: {}
    };

    this.spans.set(spanId, span);
    trace.spans.push(spanId);
    
    return span;
  }

  /**
   * 结束Span
   * @param {string} spanId - Span ID
   * @param {string} status - 状态，'ok' 或 'error'
   */
  endSpan(spanId, status = 'ok') {
    const span = this.spans.get(spanId);
    if (!span) {
      throw new Error(`Span ${spanId} not found`);
    }

    span.endTime = Date.now();
    span.status = status;
    
    // 检查是否需要结束Trace
    const trace = this.traces.get(span.traceId);
    if (trace) {
      const allSpansEnded = trace.spans.every(id => {
        const s = this.spans.get(id);
        return s && s.endTime !== null;
      });
      
      if (allSpansEnded) {
        trace.endTime = Date.now();
      }
    }
    
    return span;
  }

  /**
   * 添加事件到Span
   * @param {string} spanId - Span ID
   * @param {Object} event - 事件对象
   */
  addEvent(spanId, event) {
    const span = this.spans.get(spanId);
    if (!span) {
      throw new Error(`Span ${spanId} not found`);
    }

    const eventWithTimestamp = {
      ...event,
      timestamp: Date.now()
    };
    
    span.events.push(eventWithTimestamp);
    return eventWithTimestamp;
  }

  /**
   * 获取Trace
   * @param {string} traceId - Trace ID
   * @returns {Object|null} Trace对象
   */
  getTrace(traceId) {
    return this.traces.get(traceId) || null;
  }

  /**
   * 获取Trace的所有Spans
   * @param {string} traceId - Trace ID
   * @returns {Array} Span对象数组
   */
  getSpans(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return [];
    }

    return trace.spans.map(spanId => this.spans.get(spanId)).filter(Boolean);
  }

  /**
   * 获取Span
   * @param {string} spanId - Span ID
   * @returns {Object|null} Span对象
   */
  getSpan(spanId) {
    return this.spans.get(spanId) || null;
  }

  /**
   * 获取所有Traces
   * @returns {Array} Trace对象数组
   */
  getAllTraces() {
    return Array.from(this.traces.values());
  }

  /**
   * 清除所有数据
   */
  clear() {
    this.traces.clear();
    this.spans.clear();
  }

  /**
   * 获取Trace的统计信息
   * @param {string} traceId - Trace ID
   * @returns {Object} 统计信息
   */
  getTraceStats(traceId) {
    const trace = this.traces.get(traceId);
    if (!trace) {
      return null;
    }

    const spans = this.getSpans(traceId);
    const totalSpans = spans.length;
    const completedSpans = spans.filter(s => s.endTime !== null).length;
    const errorSpans = spans.filter(s => s.status === 'error').length;
    const totalDuration = trace.endTime ? trace.endTime - trace.startTime : null;
    
    const spanDurations = spans
      .filter(s => s.endTime !== null)
      .map(s => s.endTime - s.startTime);
    
    const avgSpanDuration = spanDurations.length > 0 
      ? spanDurations.reduce((a, b) => a + b, 0) / spanDurations.length 
      : 0;

    return {
      totalSpans,
      completedSpans,
      errorSpans,
      totalDuration,
      avgSpanDuration,
      status: errorSpans > 0 ? 'error' : 'ok'
    };
  }
}

// 创建单例实例
export const tracingService = new TracingService();

// 导出类以便测试
export { TracingService };