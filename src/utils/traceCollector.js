import { uid } from './uid';

const _traces = [];
const _activeSpans = new Map();

function _findTrace(traceId) {
  return _traces.find(t => t.id === traceId) || null;
}

export function startTrace(name, metadata = {}) {
  const trace = {
    id: uid(),
    name,
    startTime: Date.now(),
    endTime: null,
    spans: [],
    metadata,
  };
  _traces.push(trace);
  return trace;
}

export function endTrace(traceId) {
  const trace = _findTrace(traceId);
  if (!trace) return null;
  trace.endTime = Date.now();
  return trace;
}

export function startSpan(traceId, name, { parentSpanId = null, metadata = {} } = {}) {
  const trace = _findTrace(traceId);
  if (!trace) return null;
  const span = {
    id: uid(),
    traceId,
    parentSpanId,
    name,
    startTime: Date.now(),
    endTime: null,
    status: 'running',
    events: [],
    metadata,
  };
  trace.spans.push(span);
  _activeSpans.set(span.id, span);
  return span;
}

export function endSpan(spanId, status = 'ok') {
  const span = _activeSpans.get(spanId);
  if (!span) return null;
  span.endTime = Date.now();
  span.status = status;
  _activeSpans.delete(spanId);
  return span;
}

export function addSpanEvent(spanId, type, data = {}) {
  const span = _activeSpans.get(spanId);
  if (!span) return;
  span.events.push({ type, timestamp: Date.now(), ...data });
}

export function recordAgentCall(traceId, agentName, agentHash, { input, output, tokenUsage } = {}) {
  const span = startSpan(traceId, `Agent: ${agentName}`, {
    metadata: { agentHash, input, output, tokenUsage },
  });
  if (span && output !== undefined) {
    endSpan(span.id, 'ok');
  }
  return span;
}

export function recordHandoff(traceId, handoff) {
  const span = startSpan(traceId, `Handoff: ${handoff.fromAgent} → ${handoff.toAgent}`, {
    metadata: {
      handoffId: handoff.id,
      fromAgent: handoff.fromAgent,
      toAgent: handoff.toAgent,
      task: handoff.task,
      status: handoff.status,
      reason: handoff.reason,
    },
  });
  addSpanEvent(span.id, 'handoff', { status: handoff.status });
  if (handoff.status !== 'pending') {
    endSpan(span.id, handoff.status === 'rejected' ? 'error' : 'ok');
  }
  return span;
}

export function getTraces() {
  return [..._traces];
}

export function getTrace(traceId) {
  return _findTrace(traceId);
}

export function getSpans(traceId) {
  const trace = _findTrace(traceId);
  return trace ? [...trace.spans] : [];
}

export function getSpan(spanId) {
  for (const trace of _traces) {
    const span = trace.spans.find(s => s.id === spanId);
    if (span) return span;
  }
  return null;
}

export function getTraceStats(traceId) {
  const trace = _findTrace(traceId);
  if (!trace) return null;
  const spans = trace.spans;
  const completedSpans = spans.filter(s => s.endTime);
  const errorSpans = spans.filter(s => s.status === 'error');
  const totalDuration = trace.endTime ? trace.endTime - trace.startTime : null;
  const avgSpanDuration = completedSpans.length > 0
    ? completedSpans.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / completedSpans.length
    : null;
  return {
    totalSpans: spans.length,
    completedSpans: completedSpans.length,
    errorSpans: errorSpans.length,
    totalDuration,
    avgSpanDuration,
  };
}

export function buildSpanTree(traceId) {
  const spans = getSpans(traceId);
  if (!spans.length) return [];
  const spanMap = new Map();
  spans.forEach(s => spanMap.set(s.id, { ...s, children: [] }));
  const roots = [];
  spans.forEach(s => {
    const node = spanMap.get(s.id);
    if (s.parentSpanId) {
      const parent = spanMap.get(s.parentSpanId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });
  return roots;
}

export function exportTraces() {
  return JSON.parse(JSON.stringify(_traces));
}

export function clearTraces() {
  _traces.length = 0;
  _activeSpans.clear();
}
