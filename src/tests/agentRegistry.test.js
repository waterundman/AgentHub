import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerAgent,
  getAgentByType,
  getAllAgents,
  unregisterAgent,
  clearRegistry,
  initBuiltinAgents,
  AGENT_TYPES,
  PERMISSION_MODE
} from '../services/agentRegistry';
import { createStepReport, validateStepReport, REPORT_STATUS } from '../types/stepReport';
import {
  collectStepReport,
  getStepReports,
  getLatestReport,
  calculateAverageConfidence,
  clearReports
} from '../services/stepReportCollector';

describe('AgentRegistry', () => {
  beforeEach(() => {
    clearRegistry();
  });

  it('should register an agent', () => {
    const agent = registerAgent({
      type: 'test_agent',
      name: 'Test Agent',
      capabilities: ['testing']
    });
    expect(agent.type).toBe('test_agent');
    expect(agent.name).toBe('Test Agent');
    expect(agent.capabilities).toEqual(['testing']);
    expect(agent.permission_mode).toBe(PERMISSION_MODE.INTERACTIVE);
  });

  it('should throw on missing required fields', () => {
    expect(() => registerAgent({})).toThrow('type is required');
    expect(() => registerAgent({ type: 'x' })).toThrow('name is required');
    expect(() => registerAgent({ type: 'x', name: 'y' })).toThrow('capabilities must be a non-empty array');
  });

  it('should get agent by type', () => {
    registerAgent({ type: 'agent_a', name: 'A', capabilities: ['c1'] });
    const found = getAgentByType('agent_a');
    expect(found.name).toBe('A');
  });

  it('should return null for unknown type', () => {
    expect(getAgentByType('nonexistent')).toBeNull();
  });

  it('should get all agents', () => {
    registerAgent({ type: 'a1', name: 'A1', capabilities: ['c'] });
    registerAgent({ type: 'a2', name: 'A2', capabilities: ['c'] });
    expect(getAllAgents()).toHaveLength(2);
  });

  it('should unregister an agent', () => {
    registerAgent({ type: 'temp', name: 'Temp', capabilities: ['c'] });
    unregisterAgent('temp');
    expect(getAgentByType('temp')).toBeNull();
  });

  it('should init builtin agents', () => {
    const agents = initBuiltinAgents();
    expect(agents).toHaveLength(7);
    expect(getAgentByType(AGENT_TYPES.REPO_RESEARCHER)).toBeDefined();
    expect(getAgentByType(AGENT_TYPES.CODE_WRITER)).toBeDefined();
    expect(getAgentByType(AGENT_TYPES.TEST_RUNNER)).toBeDefined();
    expect(getAgentByType(AGENT_TYPES.CODE_REVIEWER)).toBeDefined();
    expect(getAgentByType(AGENT_TYPES.INTEGRATION_AGENT)).toBeDefined();
    expect(getAgentByType(AGENT_TYPES.DOC_WRITER)).toBeDefined();
    expect(getAgentByType(AGENT_TYPES.SECURITY_REVIEWER)).toBeDefined();
  });

  it('should not re-register existing builtin agents', () => {
    initBuiltinAgents();
    const countBefore = getAllAgents().length;
    initBuiltinAgents();
    expect(getAllAgents()).toHaveLength(countBefore);
  });
});

describe('StepReport', () => {
  it('should create a step report', () => {
    const report = createStepReport({
      step_id: 'S001',
      status: REPORT_STATUS.COMPLETED,
      summary: 'Step completed successfully',
      confidence: 0.9
    });
    expect(report.report_id).toMatch(/^sr_S001_a1_/);
    expect(report.step_id).toBe('S001');
    expect(report.attempt).toBe(1);
    expect(report.status).toBe('completed');
    expect(report.summary).toBe('Step completed successfully');
    expect(report.confidence).toBe(0.9);
    expect(report.artifacts).toEqual([]);
    expect(report.evidence).toEqual([]);
    expect(report.risks).toEqual([]);
    expect(report.blocked_by).toEqual([]);
    expect(report.created_at).toBeDefined();
  });

  it('should create report with artifacts and evidence', () => {
    const report = createStepReport({
      step_id: 'S002',
      status: REPORT_STATUS.PARTIAL,
      summary: 'Partial result',
      artifacts: [{ path: 'src/foo.js', op: 'created' }],
      evidence: [{ type: 'test_pass', detail: '15/15 tests pass' }],
      risks: ['low test coverage'],
      confidence: 0.7
    });
    expect(report.artifacts).toHaveLength(1);
    expect(report.evidence).toHaveLength(1);
    expect(report.risks).toHaveLength(1);
  });

  it('should validate valid report', () => {
    const report = createStepReport({
      step_id: 'S003',
      status: REPORT_STATUS.COMPLETED,
      summary: 'Done'
    });
    const result = validateStepReport(report);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail validation on missing fields', () => {
    const result = validateStepReport({});
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('step_id is required');
    expect(result.errors).toContain('status is required');
    expect(result.errors).toContain('summary is required');
  });

  it('should fail validation on invalid status', () => {
    const result = validateStepReport({
      step_id: 'S001',
      status: 'invalid',
      summary: 'test'
    });
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('status must be one of');
  });

  it('should fail validation on invalid confidence', () => {
    const result = validateStepReport({
      step_id: 'S001',
      status: REPORT_STATUS.COMPLETED,
      summary: 'test',
      confidence: 1.5
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('confidence must be between 0 and 1');
  });
});

describe('StepReportCollector', () => {
  beforeEach(() => {
    clearReports();
  });

  it('should collect a step report', () => {
    const report = collectStepReport('S100', {
      status: REPORT_STATUS.COMPLETED,
      summary: 'All good',
      confidence: 0.95
    });
    expect(report.step_id).toBe('S100');
    expect(report.status).toBe('completed');
  });

  it('should get step reports', () => {
    collectStepReport('S200', { status: REPORT_STATUS.COMPLETED, summary: 'v1' });
    collectStepReport('S200', { status: REPORT_STATUS.COMPLETED, summary: 'v2', attempt: 2 });
    expect(getStepReports('S200')).toHaveLength(2);
  });

  it('should return empty array for unknown step', () => {
    expect(getStepReports('UNKNOWN')).toEqual([]);
  });

  it('should get latest report', () => {
    collectStepReport('S300', { status: REPORT_STATUS.PARTIAL, summary: 'first' });
    collectStepReport('S300', { status: REPORT_STATUS.COMPLETED, summary: 'second', attempt: 2 });
    const latest = getLatestReport('S300');
    expect(latest.summary).toBe('second');
    expect(latest.attempt).toBe(2);
  });

  it('should return null when no reports exist', () => {
    expect(getLatestReport('NOPE')).toBeNull();
  });

  it('should calculate average confidence', () => {
    collectStepReport('S400', { status: REPORT_STATUS.COMPLETED, summary: 'a', confidence: 0.8 });
    collectStepReport('S401', { status: REPORT_STATUS.COMPLETED, summary: 'b', confidence: 0.6 });
    const avg = calculateAverageConfidence(['S400', 'S401']);
    expect(avg).toBe(0.7);
  });

  it('should return 0 for steps with no reports', () => {
    expect(calculateAverageConfidence(['NONE1', 'NONE2'])).toBe(0);
  });

  it('should throw on invalid report', () => {
    expect(() => collectStepReport('S500', { status: 'invalid_status', summary: 'bad' })).toThrow('status must be one of');
  });
});
