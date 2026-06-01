import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  startTrace,
  endTrace,
  startSpan,
  endSpan,
  addSpanEvent,
  recordAgentCall,
  recordHandoff,
  getTraces,
  getTrace,
  getSpans,
  getSpan,
  getTraceStats,
  buildSpanTree,
  exportTraces,
  clearTraces,
} from '../utils/traceCollector';

describe('traceCollector', () => {
  beforeEach(() => {
    clearTraces();
  });

  describe('basic trace lifecycle', () => {
    it('should create and retrieve a trace', () => {
      const trace = startTrace('test-trace');
      expect(trace.id).toBeDefined();
      expect(trace.name).toBe('test-trace');
      expect(trace.startTime).toBeDefined();
      expect(trace.endTime).toBeNull();

      const all = getTraces();
      expect(all).toHaveLength(1);
      expect(getTrace(trace.id)).toBe(trace);
    });

    it('should end a trace', () => {
      const trace = startTrace('ended');
      endTrace(trace.id);
      expect(trace.endTime).toBeDefined();
      expect(trace.endTime).toBeGreaterThanOrEqual(trace.startTime);
    });

    it('should return null for unknown trace', () => {
      expect(getTrace('nonexistent')).toBeNull();
      expect(endTrace('nonexistent')).toBeNull();
    });
  });

  describe('span lifecycle', () => {
    it('should create spans within a trace', () => {
      const trace = startTrace('with-spans');
      const span = startSpan(trace.id, 'child-span');

      expect(span.id).toBeDefined();
      expect(span.traceId).toBe(trace.id);
      expect(span.name).toBe('child-span');
      expect(span.status).toBe('running');

      const spans = getSpans(trace.id);
      expect(spans).toHaveLength(1);
    });

    it('should end a span with status', () => {
      const trace = startTrace('t');
      const span = startSpan(trace.id, 's');
      endSpan(span.id, 'ok');

      const fetched = getSpan(span.id);
      expect(fetched.endTime).toBeDefined();
      expect(fetched.status).toBe('ok');
    });

    it('should end span with error status', () => {
      const trace = startTrace('t');
      const span = startSpan(trace.id, 'err');
      endSpan(span.id, 'error');

      expect(getSpan(span.id).status).toBe('error');
    });

    it('should set parent span', () => {
      const trace = startTrace('t');
      const parent = startSpan(trace.id, 'parent');
      const child = startSpan(trace.id, 'child', { parentSpanId: parent.id });

      expect(child.parentSpanId).toBe(parent.id);
    });

    it('should return null for unknown span', () => {
      expect(getSpan('nonexistent')).toBeNull();
      expect(endSpan('nonexistent')).toBeNull();
    });
  });

  describe('span events', () => {
    it('should add events to active span', () => {
      const trace = startTrace('t');
      const span = startSpan(trace.id, 's');

      addSpanEvent(span.id, 'click', { target: 'button' });
      addSpanEvent(span.id, 'input', { value: 'hello' });

      const fetched = getSpan(span.id);
      expect(fetched.events).toHaveLength(2);
      expect(fetched.events[0].type).toBe('click');
      expect(fetched.events[0].target).toBe('button');
      expect(fetched.events[0].timestamp).toBeDefined();
    });
  });

  describe('recordAgentCall', () => {
    it('should record agent call with metadata', () => {
      const trace = startTrace('agent-test');
      const span = recordAgentCall(trace.id, 'MyAgent', 'agent-hash-1', {
        input: 'hello',
        output: 'world',
        tokenUsage: { prompt: 10, completion: 20 },
      });

      expect(span.name).toBe('Agent: MyAgent');
      expect(span.metadata.agentHash).toBe('agent-hash-1');
      expect(span.metadata.tokenUsage.prompt).toBe(10);
    });

    it('should keep span running if no output', () => {
      const trace = startTrace('t');
      const span = recordAgentCall(trace.id, 'Agent', 'h', { input: 'q' });

      expect(span.status).toBe('running');
      expect(getSpan(span.id).endTime).toBeNull();
    });
  });

  describe('recordHandoff', () => {
    it('should record handoff event', () => {
      const trace = startTrace('handoff-test');
      const handoff = {
        id: 'h1',
        fromAgent: 'agent-a',
        toAgent: 'agent-b',
        task: { title: 'Do something' },
        status: 'pending',
        reason: 'needs help',
      };

      const span = recordHandoff(trace.id, handoff);
      expect(span.name).toBe('Handoff: agent-a → agent-b');
      expect(span.metadata.handoffId).toBe('h1');
      expect(span.events).toHaveLength(1);
      expect(span.events[0].type).toBe('handoff');
    });

    it('should end span when handoff accepted', () => {
      const trace = startTrace('t');
      const span = recordHandoff(trace.id, {
        id: 'h2', fromAgent: 'a', toAgent: 'b', task: 't', status: 'accepted',
      });

      expect(getSpan(span.id).endTime).toBeDefined();
      expect(getSpan(span.id).status).toBe('ok');
    });

    it('should end span with error when handoff rejected', () => {
      const trace = startTrace('t');
      const span = recordHandoff(trace.id, {
        id: 'h3', fromAgent: 'a', toAgent: 'b', task: 't', status: 'rejected',
      });

      expect(getSpan(span.id).status).toBe('error');
    });
  });

  describe('getTraceStats', () => {
    it('should compute trace statistics', () => {
      const trace = startTrace('stats-test');
      const s1 = startSpan(trace.id, 's1');
      endSpan(s1.id, 'ok');
      const s2 = startSpan(trace.id, 's2');
      endSpan(s2.id, 'error');
      startSpan(trace.id, 's3'); // still running
      endTrace(trace.id);

      const stats = getTraceStats(trace.id);
      expect(stats.totalSpans).toBe(3);
      expect(stats.completedSpans).toBe(2);
      expect(stats.errorSpans).toBe(1);
      expect(stats.totalDuration).toBeGreaterThanOrEqual(0);
      expect(stats.avgSpanDuration).toBeGreaterThanOrEqual(0);
    });

    it('should return null for unknown trace', () => {
      expect(getTraceStats('nonexistent')).toBeNull();
    });
  });

  describe('buildSpanTree', () => {
    it('should build tree from parent references', () => {
      const trace = startTrace('tree-test');
      const root = startSpan(trace.id, 'root');
      const child1 = startSpan(trace.id, 'child1', { parentSpanId: root.id });
      const child2 = startSpan(trace.id, 'child2', { parentSpanId: root.id });
      const grandchild = startSpan(trace.id, 'gc', { parentSpanId: child1.id });

      const tree = buildSpanTree(trace.id);
      expect(tree).toHaveLength(1);
      expect(tree[0].id).toBe(root.id);
      expect(tree[0].children).toHaveLength(2);
      expect(tree[0].children[0].children).toHaveLength(1);
    });
  });

  describe('export and clear', () => {
    it('should export traces as JSON', () => {
      startTrace('e1');
      startTrace('e2');
      const exported = exportTraces();
      expect(exported).toHaveLength(2);
      expect(typeof JSON.stringify(exported)).toBe('string');
    });

    it('should clear all traces', () => {
      startTrace('c1');
      startTrace('c2');
      expect(getTraces()).toHaveLength(2);
      clearTraces();
      expect(getTraces()).toHaveLength(0);
    });
  });
});
