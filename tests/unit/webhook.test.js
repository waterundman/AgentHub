import { describe, it, expect, vi } from 'vitest';
import { WebhookService } from '../../src/services/webhook/WebhookService';

describe('WebhookService', () => {
  it('should create instance with config', () => {
    const service = new WebhookService({ projectName: 'TestProject' });
    expect(service.projectName).toBe('TestProject');
  });

  it('should add project identifier to message', () => {
    const service = new WebhookService({ projectName: 'TestProject' });
    const message = { title: 'Test', content: 'Hello' };
    const enriched = service.addProjectIdentifier(message);
    expect(enriched.project).toBe('TestProject');
    expect(enriched.timestamp).toBeDefined();
  });
});