import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';
import { getProviderNames, getModelsByProvider, getProviderByName } from '../constants/providers';

export function AgentLLMConfig({ agent, onUpdate, globalConfig }) {
  const [config, setConfig] = useState(agent.llmConfig || null);
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);

  useEffect(() => {
    // 获取可用Provider列表
    const providerNames = getProviderNames();
    setProviders(providerNames.map(name => {
      const provider = getProviderByName(name);
      return {
        name: provider.name,
        displayName: provider.displayName
      };
    }));
  }, []);

  useEffect(() => {
    // 当Provider改变时，获取可用模型列表
    if (config?.provider) {
      const modelsList = getModelsByProvider(config.provider);
      setModels(modelsList.map(m => ({
        id: m.id,
        displayName: m.displayName
      })));
    } else {
      setModels([]);
    }
  }, [config?.provider]);

  const handleChange = (field, value) => {
    const newConfig = { ...config, [field]: value };
    // 如果切换了provider，重置model
    if (field === 'provider') {
      newConfig.model = '';
    }
    setConfig(newConfig);
    onUpdate({ ...agent, llmConfig: newConfig });
  };

  const handleReset = () => {
    setConfig(null);
    onUpdate({ ...agent, llmConfig: null });
  };

  return (
    <div className="agent-llm-config" style={{ marginTop: '12px', padding: '10px', background: 'var(--color-background-secondary)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon name="Zap" size={14} />
          <span style={{ fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>LLM 配置</span>
        </div>
        {config && (
          <button onClick={handleReset} style={{ padding: '2px 8px', fontSize: '11px', background: 'transparent', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '5px', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-sans)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Icon name="RotateCcw" size={12} />
            恢复默认
          </button>
        )}
      </div>

      {!config ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: 'var(--color-background-primary)', borderRadius: '6px', border: '0.5px solid var(--color-border-tertiary)' }}>
          <Icon name="Info" size={14} />
          <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
            使用全局配置: {globalConfig?.provider || 'anthropic'} / {globalConfig?.model || 'claude-sonnet-4-20250514'}
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Provider</label>
            <select
              value={config.provider || ''}
              onChange={(e) => handleChange('provider', e.target.value)}
              style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
            >
              <option value="">选择 Provider</option>
              {providers.map(p => (
                <option key={p.name} value={p.name}>{p.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>模型</label>
            <select
              value={config.model || ''}
              onChange={(e) => handleChange('model', e.target.value)}
              style={{ width: '100%', padding: '6px 10px', fontSize: '12px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
            >
              <option value="">选择模型</option>
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.displayName}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>最大 Tokens</label>
            <input
              type="number"
              value={config.maxTokens || 4096}
              onChange={(e) => handleChange('maxTokens', parseInt(e.target.value) || 4096)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', fontSize: '12px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Temperature</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)', minWidth: '30px' }}>{config.temperature || 0.7}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}