import { describe, it, expect } from 'vitest';
import { validateManifest, checkCompatibility } from '../../src/services/agentFormat/manifest';

describe('Agent Format', () => {
  describe('validateManifest', () => {
    it('should validate a valid manifest', () => {
      const manifest = {
        formatVersion: '1.0',
        agent: {
          name: 'Test Agent',
          version: '1.0.0'
        },
        runtime: {
          engine: 'agenthub',
          minVersion: '1.2.0'
        }
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject manifest without agent', () => {
      const manifest = {
        formatVersion: '1.0',
        runtime: { engine: 'agenthub' }
      };

      const result = validateManifest(manifest);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing agent section');
    });
  });

  describe('checkCompatibility', () => {
    it('should be compatible with higher version', () => {
      const manifest = {
        runtime: { minVersion: '1.0.0' }
      };

      const result = checkCompatibility(manifest, '1.2.0');
      expect(result.compatible).toBe(true);
    });

    it('should be incompatible with lower version', () => {
      const manifest = {
        runtime: { minVersion: '2.0.0' }
      };

      const result = checkCompatibility(manifest, '1.2.0');
      expect(result.compatible).toBe(false);
    });
  });
});
